const net = require("net");

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
    
    // Display job info (no file storage)
    console.log("═══════════════════════════════════════════");
    console.log(`👤 Username: ${jobInfo.username}`);
    console.log(`📄 File: ${jobInfo.fileName}`);
    console.log(`🆔 Job ID: ${jobInfo.jobId}`);
    console.log(`📦 Size: ${(jobInfo.fileSize / 1024).toFixed(2)} KB`);
    console.log(`⏰ Time: ${new Date().toLocaleString()}`);
    console.log("✅ Print job received successfully!");
    console.log("═══════════════════════════════════════════\n");
  });
 
  socket.on("close", () => {
    console.log("🔌 Connection closed");
  });
 
  socket.on("error", err => {
    console.error("⚠️ Printer socket error:", err.message);
  });
});
 
server.listen(9100, "0.0.0.0", () => {
  console.log("════════════════════════════════════════════");
  console.log("🖨️  Print Server Running on port 9100");
  console.log("════════════════════════════════════════════\n");
  console.log("Waiting for print jobs...\n");
});