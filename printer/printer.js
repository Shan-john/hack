const net = require("net");
const fs = require("fs");
const path = require("path");
 
const OUTPUT_DIR = "./jobs";
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);
 
const server = net.createServer(socket => {
  console.log("🖨️  Printer connection from", socket.remoteAddress);
 
  const chunks = [];
 
  // Important: do NOT set timeouts
  socket.setTimeout(0);
 
  socket.on("data", data => {
    chunks.push(data);
  });
 
  socket.on("end", () => {
    const job = Buffer.concat(chunks);
    const file = `job-${Date.now()}.raw`;
 
    fs.writeFileSync(path.join(OUTPUT_DIR, file), job);
    console.log(`✅ Print job saved: ${file}`);
  });
 
  socket.on("close", () => {
    console.log("🔌 Printer connection closed");
  });
 
  socket.on("error", err => {
    console.error("⚠️ Printer socket error:", err.message);
  });
});
 
server.listen(9100, "0.0.0.0", () => {
  console.log("🖨️  Raspberry Pi is now acting as a RAW printer (port 9100)");
});