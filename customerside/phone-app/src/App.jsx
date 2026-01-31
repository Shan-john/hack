import { useState, useEffect } from "react";

export default function App() {
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [status, setStatus] = useState("");

  // Generate random ID on mount
  useEffect(() => {
    setUserId(Math.floor(Math.random() * 1000000));
  }, []);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Create file objects with preview URLs for images
    const newFiles = files.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    }));

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    e.target.value = ""; // Reset input to allow selecting same file again
  };

  const removeFile = (fileId) => {
    setSelectedFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  };

  const sendToLaptop = async () => {
    if (!username.trim()) {
      setStatus("❌ Please enter your name");
      return;
    }

    if (selectedFiles.length === 0) {
      setStatus("❌ Please select at least one file");
      return;
    }

    try {
      const serverIp = window.location.hostname;
      const url = `http://${serverIp}:3000/print`;

      const formData = new FormData();
      formData.append("name", username);
      formData.append("id", userId);

      selectedFiles.forEach((fileObj) => {
        formData.append("files", fileObj.file);
      });

      console.log("Sending to:", url);
      console.log("Username:", username);
      console.log("User ID:", userId);
      console.log("File count:", selectedFiles.length);

      const res = await fetch(url, {
        method: "POST",
        body: formData,
      });

      console.log("Response status:", res.status);

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();
      console.log("Response data:", data);

      setStatus(`✅ Sent ${selectedFiles.length} file(s) to laptop`);
      setSelectedFiles([]);
      setUsername("");
    } catch (e) {
      console.error("Error:", e);
      setStatus(`❌ Error: ${e.message}`);
    }
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h1 style={styles.title}>📱 File Upload</h1>
        <p style={styles.subtitle}>Send files from your phone to laptop</p>

        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your name"
          style={styles.input}
        />

        <label style={styles.fileLabel}>
          📎 Select Files
          <input
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.gif"
            onChange={handleFileSelect}
            style={styles.fileInput}
          />
        </label>

        {selectedFiles.length > 0 && (
          <div style={styles.fileList}>
            <h3 style={styles.fileListTitle}>
              Selected Files ({selectedFiles.length})
            </h3>
            {selectedFiles.map((fileObj) => (
              <div key={fileObj.id} style={styles.fileItem}>
                {fileObj.preview && (
                  <img
                    src={fileObj.preview}
                    alt={fileObj.file.name}
                    style={styles.thumbnail}
                  />
                )}
                <div style={styles.fileInfo}>
                  <div style={styles.fileName}>{fileObj.file.name}</div>
                  <div style={styles.fileSize}>
                    {(fileObj.file.size / 1024).toFixed(2)} KB
                  </div>
                </div>
                <button
                  onClick={() => removeFile(fileObj.id)}
                  style={styles.deleteBtn}
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        )}

        <button onClick={sendToLaptop} style={styles.sendBtn}>
          Send {selectedFiles.length > 0 && `(${selectedFiles.length})`}
        </button>

        {status && <p style={styles.status}>{status}</p>}
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #e0e7ff 0%, #f0f4ff 50%, #faf5ff 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  card: {
    maxWidth: 420,
    width: "100%",
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: 24,
    padding: 32,
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.1), 0 0 1px rgba(0, 0, 0, 0.1)",
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 8,
    color: "#1e293b",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#64748b",
    marginBottom: 32,
  },
  input: {
    width: "100%",
    padding: 14,
    fontSize: 15,
    marginBottom: 16,
    border: "2px solid #e2e8f0",
    borderRadius: 12,
    boxSizing: "border-box",
    outline: "none",
    transition: "all 0.2s",
    background: "#ffffff",
    color: "#1e293b",
  },
  fileLabel: {
    display: "block",
    width: "100%",
    padding: 14,
    fontSize: 15,
    fontWeight: 600,
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    textAlign: "center",
    cursor: "pointer",
    marginBottom: 16,
    transition: "all 0.3s",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
  },
  fileInput: {
    display: "none",
  },
  fileList: {
    marginBottom: 16,
    border: "2px solid #e2e8f0",
    borderRadius: 16,
    padding: 16,
    maxHeight: 320,
    overflowY: "auto",
    background: "#f8fafc",
  },
  fileListTitle: {
    margin: "0 0 16px 0",
    fontSize: 15,
    fontWeight: 700,
    color: "#1e293b",
  },
  fileItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 12,
    marginBottom: 10,
    background: "#ffffff",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    transition: "all 0.2s",
  },
  thumbnail: {
    width: 56,
    height: 56,
    objectFit: "cover",
    borderRadius: 10,
    border: "2px solid #e2e8f0",
  },
  fileInfo: {
    flex: 1,
    minWidth: 0,
  },
  fileName: {
    fontSize: 14,
    fontWeight: 600,
    color: "#1e293b",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 12,
    color: "#64748b",
  },
  deleteBtn: {
    background: "#fee2e2",
    border: "none",
    fontSize: 16,
    cursor: "pointer",
    padding: 8,
    borderRadius: 8,
    transition: "all 0.2s",
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtn: {
    width: "100%",
    padding: 14,
    fontSize: 15,
    fontWeight: 600,
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    cursor: "pointer",
    transition: "all 0.3s",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
  },
  status: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 14,
    fontWeight: 500,
    padding: 12,
    borderRadius: 10,
    background: "#f1f5f9",
    color: "#1e293b",
  },
};
