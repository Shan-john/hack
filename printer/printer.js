const net = require("net");
const http = require("http");

// Server configuration (where to send print confirmation)
const SERVER_HOST = "127.0.0.1";
const SERVER_PORT = 3000;

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
    
    // Display job info
    console.log("═══════════════════════════════════════════");
    console.log(`👤 Username: ${jobInfo.username}`);
    console.log(`📄 File: ${jobInfo.fileName}`);
    console.log(`🆔 Job ID: ${jobInfo.jobId}`);
    console.log(`📦 Size: ${(jobInfo.fileSize / 1024).toFixed(2)} KB`);
    console.log(`⏰ Time: ${new Date().toLocaleString()}`);
    console.log("✅ Print job received successfully!");
    console.log("═══════════════════════════════════════════");
    
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