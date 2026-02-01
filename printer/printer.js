const net = require("net");
const http = require("http");

// Server configuration (where to send print confirmation)
// Usage: node printer.js [SERVER_IP]
// Example: node printer.js 192.168.1.100
const SERVER_HOST = process.argv[2] || "127.0.0.1";
const SERVER_PORT = 3000;

console.log("");
console.log("╔═══════════════════════════════════════════════════════════╗");
console.log("║           🖨️  PRINTER CONFIGURATION                       ║");
console.log("╠═══════════════════════════════════════════════════════════╣");
console.log(`║  Server IP    : ${SERVER_HOST.padEnd(42)}║`);
console.log(`║  Server Port  : ${SERVER_PORT.toString().padEnd(42)}║`);
console.log("╚═══════════════════════════════════════════════════════════╝");
if (SERVER_HOST === "127.0.0.1") {
  console.log("");
  console.log("💡 TIP: To connect to a remote server, run:");
  console.log("   node printer.js <SERVER_IP>");
  console.log("   Example: node printer.js 192.168.1.100");
}

const server = net.createServer(socket => {
  console.log("\n🖨️  Printer connection from", socket.remoteAddress);
 
  const chunks = [];
  socket.setTimeout(0);
 
  socket.on("data", data => {
    chunks.push(data);
  });
 
  socket.on("end", () => {
    const fullData = Buffer.concat(chunks);
    const dataStr = fullData.toString();
    
    // Parse metadata if present
    const metadataMarker = "METADATA:";
    const endMarker = ":ENDMETA";
    
    let jobInfo = {
      username: "Unknown",
      fileName: "Unknown",
      jobId: "Unknown",
      fileSize: fullData.length
    };
    
    if (dataStr.startsWith(metadataMarker)) {
      const endIdx = dataStr.indexOf(endMarker);
      if (endIdx > 0) {
        try {
          const metaJson = dataStr.substring(metadataMarker.length, endIdx);
          const meta = JSON.parse(metaJson);
          jobInfo = { ...jobInfo, ...meta };
          // Calculate actual file size (without metadata header)
          const headerLength = Buffer.byteLength(metadataMarker + metaJson + endMarker);
          jobInfo.fileSize = fullData.length - headerLength;
        } catch (e) {
          // Keep default values
        }
      }
    }
    
    // Get file extension/type
    const getFileType = (fileName) => {
      if (!fileName || fileName === "Unknown") return "Unknown";
      const ext = fileName.split('.').pop().toUpperCase();
      const types = {
        'PDF': '📕 PDF Document',
        'DOC': '📘 Word Document',
        'DOCX': '📘 Word Document',
        'JPG': '🖼️ JPEG Image',
        'JPEG': '🖼️ JPEG Image',
        'PNG': '🖼️ PNG Image',
        'TXT': '📝 Text File',
        'XLS': '📊 Excel Spreadsheet',
        'XLSX': '📊 Excel Spreadsheet',
        'PPT': '📽️ PowerPoint',
        'PPTX': '📽️ PowerPoint'
      };
      return types[ext] || `📄 ${ext} File`;
    };

    // Format date and time separately
    const now = new Date();
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    const formattedDate = now.toLocaleDateString('en-US', dateOptions);
    const formattedTime = now.toLocaleTimeString('en-US', timeOptions);

    // Get copies info
    const copies = jobInfo.copies || 1;

    // Display job info with enhanced details
    console.log("\n");
    console.log("╔═══════════════════════════════════════════════════════════╗");
    console.log("║              🖨️  NEW PRINT JOB RECEIVED                   ║");
    console.log("╠═══════════════════════════════════════════════════════════╣");
    console.log(`║  👤 Username    : ${jobInfo.username.padEnd(40)}║`);
    console.log(`║  📄 File Name   : ${jobInfo.fileName.padEnd(40)}║`);
    console.log(`║  📁 File Type   : ${getFileType(jobInfo.fileName).padEnd(40)}║`);
    console.log(`║  🆔 Job ID      : ${jobInfo.jobId.toString().padEnd(40)}║`);
    console.log(`║  📦 File Size   : ${((jobInfo.fileSize / 1024).toFixed(2) + ' KB').padEnd(40)}║`);
    console.log(`║  📋 Copies      : ${copies.toString().padEnd(40)}║`);
    console.log("╠═══════════════════════════════════════════════════════════╣");
    console.log(`║  📅 Date        : ${formattedDate.padEnd(40)}║`);
    console.log(`║  ⏰ Time        : ${formattedTime.padEnd(40)}║`);
    console.log("╠═══════════════════════════════════════════════════════════╣");
    console.log("║                  ✅ PRINT JOB SUCCESSFUL                  ║");
    console.log("╚═══════════════════════════════════════════════════════════╝");
    
    // Send feedback to server to confirm print and delete file
    sendPrintConfirmation(jobInfo);
  });
 
  socket.on("close", () => {
    console.log("🔌 Connection closed\n");
  });
 
  socket.on("error", err => {
    console.error("⚠️ Printer socket error:", err.message);
  });
});

// Function to send print confirmation back to server
function sendPrintConfirmation(jobInfo) {
  const postData = JSON.stringify({
    jobId: jobInfo.jobId,
    fileName: jobInfo.fileName,
    username: jobInfo.username,
    printedAt: new Date().toISOString(),
    success: true
  });

  const options = {
    hostname: SERVER_HOST,
    port: SERVER_PORT,
    path: "/print-complete",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    if (res.statusCode === 200) {
      console.log("📤 Print confirmation sent to server");
      console.log("🗑️  Server notified to delete printed file");
    } else {
      console.log(`⚠️  Server response: ${res.statusCode}`);
    }
  });

  req.on("error", (err) => {
    console.error("⚠️  Could not send confirmation:", err.message);
  });

  req.write(postData);
  req.end();
}
 
server.listen(9100, "0.0.0.0", () => {
  console.log("════════════════════════════════════════════");
  console.log("🖨️  Print Server Running on port 9100");
  console.log(`📡 Will send confirmations to ${SERVER_HOST}:${SERVER_PORT}`);
  console.log("════════════════════════════════════════════\n");
  console.log("Waiting for print jobs...\n");
});