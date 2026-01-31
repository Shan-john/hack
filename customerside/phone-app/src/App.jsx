import { useState } from "react";

export default function App() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");

  const sendToLaptop = async () => {
    try {
      const serverIp = window.location.hostname;
      const url = `http://${serverIp}:3000/print`;
      
      console.log("Sending to:", url);
      console.log("Data:", { text });
      
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      console.log("Response status:", res.status);
      
      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();
      console.log("Response data:", data);
      
      setStatus("✅ Sent to laptop");
      setText("");
    } catch (e) {
      console.error("Error:", e);
      setStatus(`❌ Error: ${e.message}`);
    }
  };

  return (
    <div style={styles.wrap}>
      <h2>📱 Phone → 💻 Laptop → 🖨️ Printer</h2>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text to print"
        style={styles.input}
      />

      <button onClick={sendToLaptop} style={styles.btn}>
        Send
      </button>

      <p>{status}</p>
    </div>
  );
}

const styles = {
  wrap: {
    maxWidth: 420,
    margin: "auto",
    padding: 16,
    fontFamily: "system-ui",
  },
  input: {
    width: "100%",
    height: 120,
    fontSize: 16,
    marginBottom: 12,
  },
  btn: {
    width: "100%",
    padding: 12,
    fontSize: 16,
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: 8,
  },
};
