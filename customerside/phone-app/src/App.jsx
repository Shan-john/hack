import { useState, useEffect } from "react";

export default function App() {
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [status, setStatus] = useState("");
  const [showSplash, setShowSplash] = useState(true);
  const [previewFile, setPreviewFile] = useState(null); // For file preview modal

  // Generate random ID on mount
  useEffect(() => {
    setUserId(Math.floor(Math.random() * 1000000));
    
    // Hide splash screen after 2.5 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
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

  // Main Upload Page
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
                <div 
                  onClick={() => setPreviewFile(fileObj)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flex: 1,
                    cursor: "pointer",
                  }}
                >
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

      {/* File Preview Modal */}
      {previewFile && (
        <div style={styles.modalOverlay} onClick={() => setPreviewFile(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setPreviewFile(null)} 
              style={styles.modalClose}
            >
              ✕
            </button>
            
            <h3 style={styles.modalTitle}>{previewFile.file.name}</h3>
            <p style={styles.modalSize}>
              {(previewFile.file.size / 1024).toFixed(2)} KB • {previewFile.file.type}
            </p>

            {previewFile.preview ? (
              // Image preview only
              <img
                src={previewFile.preview}
                alt={previewFile.file.name}
                style={styles.modalImage}
              />
            ) : (
              // Other file types - no preview
              <div style={styles.modalFileIcon}>
                <div style={styles.fileIconLarge}>
                  {previewFile.file.type === "application/pdf" ? "📄" : "📎"}
                </div>
                <p style={styles.fileType}>
                  {previewFile.file.type || "Unknown type"}
                </p>
                <p style={styles.noPreview}>
                  Preview not available
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function for status badge styling
const getStatusBadgeStyle = (status) => {
  const baseStyle = {
    marginLeft: 8,
    padding: "4px 8px",
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.5px",
  };

  const statusColors = {
    pending: { background: "#fef3c7", color: "#92400e" },
    approved: { background: "#d1fae5", color: "#065f46" },
    printed: { background: "#dbeafe", color: "#1e40af" },
    rejected: { background: "#fee2e2", color: "#991b1b" },
  };

  return { ...baseStyle, ...(statusColors[status] || statusColors.pending) };
};

const styles = {
  // Splash Screen Styles
  splashWrap: {
    minHeight: "100vh",
    minWidth: "100vw",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
    backgroundSize: "200% 200%",
    animation: "gradientShift 6s ease infinite",
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
    filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))",
  },
  splashTitle: {
    fontSize: 32,
    fontWeight: 700,
    color: "#ffffff",
    marginBottom: 8,
    marginTop: 0,
    textShadow: "0 2px 10px rgba(0,0,0,0.2)",
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
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)",
    backgroundAttachment: "fixed",
    backgroundSize: "400% 400%",
    animation: "gradientShift 15s ease infinite",
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
    background: "rgba(255, 255, 255, 0.15)",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    borderRadius: 24,
    padding: "28px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2)",
    boxSizing: "border-box",
    margin: "auto",
    border: "1px solid rgba(255, 255, 255, 0.3)",
  },
  
  title: {
    fontSize: 26,
    fontWeight: 700,
    color: "#ffffff",
    margin: "0 0 8px 0",
    textAlign: "center",
    textShadow: "0 2px 10px rgba(0,0,0,0.2)",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 24,
    marginTop: 0,
    fontWeight: 500,
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
    padding: 14,
    fontSize: 15,
    fontWeight: 600,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 14,
    textAlign: "center",
    cursor: "pointer",
    marginBottom: 12,
    transition: "all 0.3s ease",
    boxShadow: "0 6px 20px rgba(102, 126, 234, 0.4)",
    boxSizing: "border-box",
  },
  fileInput: {
    display: "none",
  },
  
  // File List
  fileList: {
    marginBottom: 12,
    border: "2px solid rgba(255, 255, 255, 0.3)",
    borderRadius: 18,
    padding: 14,
    maxHeight: 280,
    overflowY: "auto",
    background: "rgba(255, 255, 255, 0.15)",
    backdropFilter: "blur(10px)",
    boxSizing: "border-box",
  },
  fileListTitle: {
    margin: "0 0 12px 0",
    fontSize: 14,
    fontWeight: 700,
    color: "#ffffff",
    textShadow: "0 1px 3px rgba(0,0,0,0.2)",
  },
  fileItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 12,
    marginBottom: 8,
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: 14,
    border: "1px solid rgba(255, 255, 255, 0.5)",
    transition: "all 0.2s ease",
    boxSizing: "border-box",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
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
    background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)",
    border: "none",
    fontSize: 14,
    cursor: "pointer",
    padding: 8,
    borderRadius: 10,
    transition: "all 0.2s ease",
    width: 34,
    height: 34,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    color: "#ffffff",
    boxShadow: "0 2px 8px rgba(255, 107, 107, 0.3)",
  },
  
  // Send Button
  sendBtn: {
    width: "100%",
    padding: 14,
    fontSize: 16,
    fontWeight: 700,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 14,
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 6px 20px rgba(102, 126, 234, 0.4)",
    boxSizing: "border-box",
  },
  status: {
    marginTop: 12,
    textAlign: "center",
    fontSize: 13,
    fontWeight: 600,
    padding: 12,
    borderRadius: 12,
    background: "rgba(255, 255, 255, 0.9)",
    color: "#1e293b",
    wordBreak: "break-word",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
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
  
  // File Preview Modal Styles
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
    boxSizing: "border-box",
  },
  modalContent: {
    background: "#ffffff",
    borderRadius: 20,
    padding: "24px",
    maxWidth: "90vw",
    maxHeight: "90vh",
    overflow: "auto",
    position: "relative",
    boxSizing: "border-box",
  },
  modalClose: {
    position: "absolute",
    top: 12,
    right: 12,
    background: "#fee2e2",
    border: "none",
    borderRadius: "50%",
    width: 36,
    height: 36,
    fontSize: 20,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    color: "#dc2626",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#1e293b",
    marginBottom: 4,
    marginTop: 0,
    paddingRight: 40,
    wordBreak: "break-word",
  },
  modalSize: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 16,
    marginTop: 0,
  },
  modalImage: {
    width: "100%",
    height: "auto",
    maxHeight: "70vh",
    objectFit: "contain",
    borderRadius: 12,
    border: "2px solid #e2e8f0",
  },
  modalPdf: {
    width: "100%",
    height: "70vh",
    border: "2px solid #e2e8f0",
    borderRadius: 12,
  },
  pdfFallback: {
    textAlign: "center",
    padding: "40px 20px",
    minHeight: "70vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  pdfMessage: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 20,
    marginTop: 0,
  },
  downloadBtn: {
    display: "inline-block",
    padding: "12px 24px",
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    color: "#ffffff",
    textDecoration: "none",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
    transition: "all 0.2s",
  },
  modalFileIcon: {
    textAlign: "center",
    padding: "40px 20px",
  },
  fileIconLarge: {
    fontSize: 80,
    marginBottom: 16,
  },
  fileType: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 0,
  },
  noPreview: {
    fontSize: 13,
    color: "#94a3b8",
    fontStyle: "italic",
    marginTop: 8,
  },
};
