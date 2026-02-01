const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const net = require("net");

// Printer Configuration
// Usage: node server.js [PRINTER_IP]
// Example: node server.js 192.168.1.200
let PRINTER_IP = process.argv[2] || "127.0.0.1"; // Mutable so it can be updated at runtime
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

// Serve dashboard
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard.html"));
});

// Serve uploaded files (for viewing in dashboard)
app.use("/files", express.static(uploadDir));

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
    const fileContent = fs.readFileSync(uploadsLogPath, 'utf8');
    if (!fileContent.trim()) {
      return res.json({ uploads: [] });
    }
    const logData = JSON.parse(fileContent);
    res.json(logData);
  } catch (error) {
    console.error("❌ Error reading uploads.json:", error.message);
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
app.post("/print-job", async (req, res) => {
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

    console.log(`\n🖨️  Starting print job: ${jobId}`);
    console.log(`📡 Printer IP: ${targetPrinterIp}:${PRINTER_PORT}`);

    // Function to print a single file with metadata
    const printFile = (filePath, fileName, username, jobId) => {
      return new Promise((resolve, reject) => {
        const client = new net.Socket();
        
        // Set timeout
        client.setTimeout(30000);
        
        client.connect(PRINTER_PORT, targetPrinterIp, () => {
          console.log(`📡 Connected to printer at ${targetPrinterIp}:${PRINTER_PORT}`);
          console.log(`🖨️  Sending: ${fileName} (User: ${username})`);
          
          // Create metadata header
          const metadata = JSON.stringify({
            username: username,
            fileName: fileName,
            jobId: jobId,
            timestamp: new Date().toISOString()
          });
          
          // Read file content
          const fileContent = fs.readFileSync(filePath);
          
          // Send metadata + file content
          const header = Buffer.from(`METADATA:${metadata}:ENDMETA`);
          const fullData = Buffer.concat([header, fileContent]);
          
          client.write(fullData, () => {
            console.log(`✅ File sent: ${fileName} (${fileContent.length} bytes)`);
            client.end();
          });
        });
        
        client.on('close', () => {
          console.log(`🔌 Connection closed for ${fileName}`);
          resolve({ success: true, fileName });
        });
        
        client.on('error', (err) => {
          console.error(`❌ Print error for ${fileName}:`, err.message);
          reject({ success: false, fileName, error: err.message });
        });
        
        client.on('timeout', () => {
          console.error(`⏰ Timeout for ${fileName}`);
          client.destroy();
          reject({ success: false, fileName, error: 'Connection timeout' });
        });
      });
    };

    // Print files sequentially
    const results = [];
    const errors = [];

    for (const file of job.files) {
      const filePath = path.join(uploadDir, file.savedName);
      
      if (!fs.existsSync(filePath)) {
        errors.push(`File not found: ${file.originalName}`);
        continue;
      }
      
      try {
        const result = await printFile(filePath, file.originalName, job.username, jobId);
        results.push(result);
      } catch (err) {
        errors.push(`${file.originalName}: ${err.error}`);
      }
    }

    // Update job status
    if (results.length > 0) {
      job.status = "printed";
      job.printedAt = new Date().toISOString();
      job.printerIp = targetPrinterIp;
      job.printResults = { printed: results.length, failed: errors.length };
      
      fs.writeFileSync(uploadsLogPath, JSON.stringify(logData, null, 2));
      console.log(`✅ Job ${jobId} marked as printed`);
    }

    res.json({ 
      success: errors.length === 0, 
      printedCount: results.length,
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

  // Update the printer IP at runtime
  const oldIp = PRINTER_IP;
  PRINTER_IP = printerIp;
  console.log(`🖨️  Printer IP updated: ${oldIp} → ${printerIp}`);

  res.json({
    success: true,
    printerIp: PRINTER_IP,
    message: `Printer IP changed from ${oldIp} to ${printerIp}`
  });
});

// Callback from printer - confirms print and deletes file (keeps record)
app.post("/print-complete", (req, res) => {
  const { jobId, fileName, username, success } = req.body;

  console.log(`\n📬 Print confirmation received from printer:`);
  console.log(`   Job ID: ${jobId}`);
  console.log(`   File: ${fileName}`);
  console.log(`   User: ${username}`);

  if (!jobId) {
    return res.status(400).json({ error: "Job ID required" });
  }

  try {
    // Read the uploads log with error handling
    let logData = { uploads: [] };
    try {
      const fileContent = fs.readFileSync(uploadsLogPath, 'utf8');
      if (fileContent.trim()) {
        logData = JSON.parse(fileContent);
      }
    } catch (parseError) {
      console.log(`   ⚠️  Could not read uploads.json, using empty data`);
    }

    const job = logData.uploads.find(u => u.jobId === jobId);

    if (!job) {
      console.log(`   ⚠️  Job not found in log`);
      return res.status(404).json({ error: "Job not found" });
    }

    // Delete the printed files from storage
    let deletedCount = 0;
    for (const file of job.files) {
      const filePath = path.join(uploadDir, file.savedName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        deletedCount++;
        console.log(`   🗑️  Deleted: ${file.originalName}`);
      }
    }

    // Mark files as deleted in the record (but keep the job record)
    job.filesDeleted = true;
    job.filesDeletedAt = new Date().toISOString();
    fs.writeFileSync(uploadsLogPath, JSON.stringify(logData, null, 2));
    
    console.log(`   ✅ Files deleted (${deletedCount}), record kept\n`);

    res.json({ 
      success: true, 
      message: `Deleted ${deletedCount} file(s), record kept`,
      jobId 
    });

  } catch (error) {
    console.error(`   ❌ Error processing print confirmation:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://0.0.0.0:3000");
  console.log(`Upload directory: ${uploadDir}`);
  console.log(`Upload log: ${uploadsLogPath}`);
  console.log(`Printer: ${PRINTER_IP}:${PRINTER_PORT}`);
});
