import { useState, useEffect } from "react";

export default function App() {
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [status, setStatus] = useState("");
  const [showSplash, setShowSplash] = useState(true);
  const [currentPage, setCurrentPage] = useState("upload"); // "upload" or "preview"
  const [uploadHistory, setUploadHistory] = useState([]);

  // Generate random ID on mount
  useEffect(() => {
    setUserId(Math.floor(Math.random() * 1000000));
    
    // Hide splash screen after 2.5 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Fetch upload history when preview page is opened
  useEffect(() => {
    if (currentPage === "preview") {
      fetchUploadHistory();
    }
  }, [currentPage]);

  const fetchUploadHistory = async () => {
    try {
      const serverIp = window.location.hostname;
      const res = await fetch(`http://${serverIp}:3000/uploads`);
      if (res.ok) {
        const data = await res.json();
        setUploadHistory(data.uploads || []);
      }
    } catch (e) {
      console.error("Error fetching upload history:", e);
    }
  };

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

  // Splash Screen Component
  if (showSplash) {
    return (
      <div style={styles.splashWrap}>
        <div style={styles.splashContent}>
          <div style={styles.splashIcon}>📱</div>
          <h1 style={styles.splashTitle}>File Upload</h1>
          <p style={styles.splashSubtitle}>Phone to Laptop Transfer</p>
          <div style={styles.loader}></div>
        </div>
      </div>
    );
  }

  // Preview Page
  if (currentPage === "preview") {
    return (
      <div style={styles.wrap}>
        <div style={styles.card}>
          <button 
            onClick={() => setCurrentPage("upload")} 
            style={styles.backBtn}
          >
            ← Back
          </button>
          
          <h1 style={styles.title}>📋 Upload History</h1>
          <p style={styles.subtitle}>View all uploaded files</p>

          {uploadHistory.length === 0 ? (
            <p style={styles.emptyState}>No uploads yet</p>
          ) : (
            <div style={styles.historyList}>
              {uploadHistory.map((upload, index) => (
                <div key={index} style={styles.historyItem}>
                  <div style={styles.historyHeader}>
                    <strong>{upload.username}</strong>
                    <span style={styles.historyDate}>
                      {new Date(upload.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div style={styles.historyFiles}>
                    {upload.files.map((file, fileIndex) => (
                      <div key={fileIndex} style={styles.historyFile}>
                        📄 {file.originalName} ({(file.size / 1024).toFixed(2)} KB)
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main Upload Page
  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>📱 File Upload</h1>
          <button 
            onClick={() => setCurrentPage("preview")} 
            style={styles.previewBtn}
          >
            📋
          </button>
        </div>
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
  // Splash Screen Styles
  splashWrap: {
    minHeight: "100vh",
    minWidth: "100vw",
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  splashContent: {
    textAlign: "center",
    animation: "fadeIn 0.8s ease-in",
  },
  splashIcon: {
    fontSize: 80,
    marginBottom: 20,
    animation: "bounce 1.5s infinite",
  },
  splashTitle: {
    fontSize: 32,
    fontWeight: 700,
    color: "#ffffff",
    marginBottom: 8,
    marginTop: 0,
  },
  splashSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 40,
    marginTop: 0,
  },
  loader: {
    width: 40,
    height: 40,
    border: "4px solid rgba(255, 255, 255, 0.3)",
    borderTop: "4px solid #ffffff",
    borderRadius: "50%",
    margin: "0 auto",
    animation: "spin 1s linear infinite",
  },
  
  // Main Wrap Styles
  wrap: {
    minHeight: "100vh",
    minWidth: "100vw",
    background: "linear-gradient(135deg, #e0e7ff 0%, #f0f4ff 50%, #faf5ff 100%)",
    backgroundAttachment: "fixed",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "16px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    boxSizing: "border-box",
    overflowY: "auto",
    overflowX: "hidden",
  },
  card: {
    maxWidth: 420,
    width: "100%",
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: 24,
    padding: "24px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.1), 0 0 1px rgba(0, 0, 0, 0.1)",
    boxSizing: "border-box",
    margin: "auto",
  },
  
  // Header with Preview Button
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: "#1e293b",
    margin: 0,
  },
  previewBtn: {
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    border: "none",
    borderRadius: 12,
    padding: "8px 12px",
    fontSize: 20,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
    transition: "all 0.2s",
  },
  backBtn: {
    background: "#f1f5f9",
    border: "none",
    borderRadius: 10,
    padding: "8px 16px",
    fontSize: 14,
    fontWeight: 600,
    color: "#1e293b",
    cursor: "pointer",
    marginBottom: 16,
    transition: "all 0.2s",
  },
  subtitle: {
    fontSize: 13,
    textAlign: "center",
    color: "#64748b",
    marginBottom: 24,
    marginTop: 0,
  },
  
  // Form Elements
  input: {
    width: "100%",
    padding: 12,
    fontSize: 15,
    marginBottom: 12,
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
    padding: 12,
    fontSize: 15,
    fontWeight: 600,
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    textAlign: "center",
    cursor: "pointer",
    marginBottom: 12,
    transition: "all 0.3s",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
    boxSizing: "border-box",
  },
  fileInput: {
    display: "none",
  },
  
  // File List
  fileList: {
    marginBottom: 12,
    border: "2px solid #e2e8f0",
    borderRadius: 16,
    padding: 12,
    maxHeight: 280,
    overflowY: "auto",
    background: "#f8fafc",
    boxSizing: "border-box",
  },
  fileListTitle: {
    margin: "0 0 12px 0",
    fontSize: 14,
    fontWeight: 700,
    color: "#1e293b",
  },
  fileItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 10,
    marginBottom: 8,
    background: "#ffffff",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    transition: "all 0.2s",
    boxSizing: "border-box",
  },
  thumbnail: {
    width: 50,
    height: 50,
    objectFit: "cover",
    borderRadius: 10,
    border: "2px solid #e2e8f0",
    flexShrink: 0,
  },
  fileInfo: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
  },
  fileName: {
    fontSize: 13,
    fontWeight: 600,
    color: "#1e293b",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 11,
    color: "#64748b",
  },
  deleteBtn: {
    background: "#fee2e2",
    border: "none",
    fontSize: 16,
    cursor: "pointer",
    padding: 6,
    borderRadius: 8,
    transition: "all 0.2s",
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  
  // Send Button
  sendBtn: {
    width: "100%",
    padding: 12,
    fontSize: 15,
    fontWeight: 600,
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    cursor: "pointer",
    transition: "all 0.3s",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
    boxSizing: "border-box",
  },
  status: {
    marginTop: 12,
    textAlign: "center",
    fontSize: 13,
    fontWeight: 500,
    padding: 10,
    borderRadius: 10,
    background: "#f1f5f9",
    color: "#1e293b",
    wordBreak: "break-word",
  },
  
  // Preview/History Page Styles
  emptyState: {
    textAlign: "center",
    color: "#64748b",
    padding: "40px 20px",
    fontSize: 14,
  },
  historyList: {
    maxHeight: 400,
    overflowY: "auto",
  },
  historyItem: {
    background: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    border: "1px solid #e2e8f0",
  },
  historyHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    fontSize: 14,
  },
  historyDate: {
    fontSize: 11,
    color: "#64748b",
  },
  historyFiles: {
    paddingLeft: 8,
  },
  historyFile: {
    fontSize: 12,
    color: "#475569",
    padding: "4px 0",
  },
};
