const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
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

app.listen(3000, () => {
  console.log("Server running on http://0.0.0.0:3000");
  console.log(`Upload directory: ${uploadDir}`);
});
