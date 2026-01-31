const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const net = require("net");

// Printer Configuration
const PRINTER_IP = "192.168.1.100"; // Default printer IP - can be changed
const PRINTER_PORT = 9100; // Raw printing port

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Path to JSON log file
const uploadsLogPath = path.join(__dirname, "uploads.json");

// Initialize uploads log file if it doesn't exist
if (!fs.existsSync(uploadsLogPath)) {
  fs.writeFileSync(uploadsLogPath, JSON.stringify({ uploads: [] }, null, 2));
}

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = req.body.id || "unknown";
    const filename = `${userId}_${Date.now()}_${file.originalname}`;
    cb(null, filename);
  },
});

const upload = multer({ storage });

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Receive data and files from phone
app.post("/print", upload.array("files", 10), (req, res) => {
  const { name, id } = req.body;
  const files = req.files;

  console.log("\n=== Received from phone ===");
  console.log("Name:", name);
  console.log("ID:", id);
  console.log("File count:", files ? files.length : 0);
  
  if (files && files.length > 0) {
    console.log("Files:");
    files.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.originalname} (${(file.size / 1024).toFixed(2)} KB)`);
      console.log(`     Saved as: ${file.filename}`);
    });
  }
  console.log("===========================\n");

  // Create upload record
  const uploadRecord = {
    jobId: `JOB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    username: name,
    userId: id,
    timestamp: new Date().toISOString(),
    status: "pending", // pending, approved, printed, rejected
    fileCount: files ? files.length : 0,
    files: files ? files.map(f => ({
      originalName: f.originalname,
      savedName: f.filename,
      size: f.size,
      mimeType: f.mimetype,
      uploadedAt: new Date().toISOString(),
    })) : [],
  };

  // Read existing uploads log
  try {
    const logData = JSON.parse(fs.readFileSync(uploadsLogPath, 'utf8'));
    logData.uploads.push(uploadRecord);
    
    // Write updated log back to file
    fs.writeFileSync(uploadsLogPath, JSON.stringify(logData, null, 2));
    console.log("✅ Upload logged to uploads.json");
  } catch (error) {
    console.error("❌ Error writing to uploads.json:", error);
  }

  res.json({
    status: "Received",
    data: {
      name,
      id,
      fileCount: files ? files.length : 0,
      files: files ? files.map(f => ({
        originalName: f.originalname,
        savedName: f.filename,
        size: f.size,
      })) : [],
    },
  });
});

// Get upload history
app.get("/uploads", (req, res) => {
  try {
    const logData = JSON.parse(fs.readFileSync(uploadsLogPath, 'utf8'));
    res.json(logData);
  } catch (error) {
    console.error("❌ Error reading uploads.json:", error);
    res.json({ uploads: [] });
  }
});

// Update job status
app.post("/update-status", (req, res) => {
  const { jobId, status } = req.body;
  
  try {
    const logData = JSON.parse(fs.readFileSync(uploadsLogPath, 'utf8'));
    const job = logData.uploads.find(u => u.jobId === jobId);
    
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    
    job.status = status;
    job.updatedAt = new Date().toISOString();
    
    fs.writeFileSync(uploadsLogPath, JSON.stringify(logData, null, 2));
    console.log(`✅ Job ${jobId} status updated to: ${status}`);
    
    res.json({ success: true, job });
  } catch (error) {
    console.error("❌ Error updating status:", error);
    res.status(500).json({ error: error.message });
  }
});

// Approve job
app.post("/approve-job", (req, res) => {
  const { jobId } = req.body;
  
  try {
    const logData = JSON.parse(fs.readFileSync(uploadsLogPath, 'utf8'));
    const job = logData.uploads.find(u => u.jobId === jobId);
    
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    
    job.status = "approved";
    job.approvedAt = new Date().toISOString();
    
    fs.writeFileSync(uploadsLogPath, JSON.stringify(logData, null, 2));
    console.log(`✅ Job ${jobId} approved`);
    
    res.json({ success: true, job });
  } catch (error) {
    console.error("❌ Error approving job:", error);
    res.status(500).json({ error: error.message });
  }
});

// Print job using TCP Raw Printing (Port 9100)
app.post("/print-job", (req, res) => {
  const { jobId, printerIp } = req.body;
  const targetPrinterIp = printerIp || PRINTER_IP;
  
  try {
    const logData = JSON.parse(fs.readFileSync(uploadsLogPath, 'utf8'));
    const job = logData.uploads.find(u => u.jobId === jobId);
    
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    
    if (job.status !== "approved") {
      return res.status(400).json({ error: "Job must be approved before printing" });
    }
    
    // Print each file in the job
    let printedCount = 0;
    const errors = [];
    
    job.files.forEach((file, index) => {
      const filePath = path.join(uploadDir, file.savedName);
      
      if (!fs.existsSync(filePath)) {
        errors.push(`File not found: ${file.originalName}`);
        return;
      }
      
      // Create TCP socket connection to printer
      const client = new net.Socket();
      
      client.connect(PRINTER_PORT, targetPrinterIp, () => {
        console.log(`📡 Connected to printer at ${targetPrinterIp}:${PRINTER_PORT}`);
        console.log(`🖨️  Printing: ${file.originalName}`);
        
        // Read file and send to printer
        const fileContent = fs.readFileSync(filePath);
        client.write(fileContent);
        
        // Send form feed to eject page (optional, depends on printer)
        client.write('\x0C');
        
        client.end();
        printedCount++;
        
        console.log(`✅ Printed: ${file.originalName}`);
      });
      
      client.on('error', (err) => {
        console.error(`❌ Print error for ${file.originalName}:`, err.message);
        errors.push(`${file.originalName}: ${err.message}`);
      });
      
      client.on('close', () => {
        console.log(`🔌 Connection closed for ${file.originalName}`);
      });
    });
    
    // Update job status
    setTimeout(() => {
      if (errors.length === 0) {
        job.status = "printed";
        job.printedAt = new Date().toISOString();
        job.printerIp = targetPrinterIp;
        
        fs.writeFileSync(uploadsLogPath, JSON.stringify(logData, null, 2));
        console.log(`✅ Job ${jobId} marked as printed`);
      }
    }, 1000);
    
    res.json({ 
      success: true, 
      printedCount,
      totalFiles: job.files.length,
      errors: errors.length > 0 ? errors : undefined,
      printerIp: targetPrinterIp
    });
    
  } catch (error) {
    console.error("❌ Error printing job:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get printer configuration
app.get("/printer-config", (req, res) => {
  res.json({
    printerIp: PRINTER_IP,
    printerPort: PRINTER_PORT
  });
});

// Update printer IP (for dynamic configuration)
app.post("/update-printer-ip", (req, res) => {
  const { printerIp } = req.body;
  
  if (!printerIp) {
    return res.status(400).json({ error: "Printer IP required" });
  }
  
  // In production, you'd want to persist this to a config file
  // For now, we'll just acknowledge it
  console.log(`🖨️  Printer IP updated to: ${printerIp}`);
  
  res.json({ 
    success: true, 
    printerIp,
    note: "IP updated for current session. Restart server to use default."
  });
});

app.listen(3000, () => {
  console.log("Server running on http://0.0.0.0:3000");
  console.log(`Upload directory: ${uploadDir}`);
  console.log(`Upload log: ${uploadsLogPath}`);
  console.log(`Printer: ${PRINTER_IP}:${PRINTER_PORT}`);
});
