import { useState, useEffect } from "react";

export default function App() {
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [showSplash, setShowSplash] = useState(true);
  const [currentPage, setCurrentPage] = useState("username"); // username, upload, payment
  const [uploadedFileCount, setUploadedFileCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState(null); // For preview modal

  useEffect(() => {
    setUserId(Math.floor(Math.random() * 1000000));
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    addFiles(files);
    e.target.value = "";
  };

  const addFiles = (files) => {
    const newFiles = files.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: "pending", // pending, uploading, completed
      progress: 0,
      copies: 1, // Number of copies
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    }));
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const updateCopies = (fileId, copies) => {
    const count = Math.max(1, Math.min(99, parseInt(copies) || 1));
    setSelectedFiles((prev) => prev.map(f => 
      f.id === fileId ? { ...f, copies: count } : f
    ));
  };

  const openPreview = (fileObj) => {
    if (fileObj.file.type.startsWith("image/") || fileObj.file.type === "application/pdf") {
      setPreviewFile({
        name: fileObj.file.name,
        type: fileObj.file.type,
        url: URL.createObjectURL(fileObj.file)
      });
    }
  };

  const closePreview = () => {
    if (previewFile?.url) {
      URL.revokeObjectURL(previewFile.url);
    }
    setPreviewFile(null);
  };

  const removeFile = (fileId) => {
    setSelectedFiles((prev) => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.previewUrl) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    try {
      const serverIp = window.location.hostname;
      const url = `http://${serverIp}:3000/print`;

      // Simulate progress for each file
      for (let i = 0; i < selectedFiles.length; i++) {
        const fileObj = selectedFiles[i];
        setSelectedFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, status: "uploading" } : f
        ));

        // Simulate upload progress
        for (let p = 0; p <= 100; p += 20) {
          await new Promise(r => setTimeout(r, 100));
          setSelectedFiles(prev => prev.map(f => 
            f.id === fileObj.id ? { ...f, progress: p } : f
          ));
        }

        setSelectedFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, status: "completed", progress: 100 } : f
        ));
      }

      // Actually upload all files
      const formData = new FormData();
      formData.append("name", username);
      formData.append("id", userId);
      selectedFiles.forEach((fileObj) => formData.append("files", fileObj.file));

      const res = await fetch(url, { method: "POST", body: formData });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      setUploadedFileCount(selectedFiles.length);
      setCurrentPage("payment");
      setSelectedFiles([]);
    } catch (e) {
      console.error("Error:", e);
      alert(`Upload failed: ${e.message}`);
    }
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) return "📄";
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return "🖼️";
    if (['doc', 'docx'].includes(ext)) return "📝";
    if (['fig', 'ai', 'psd'].includes(ext)) return "🎨";
    return "📎";
  };

  // Splash Screen
  if (showSplash) {
    return (
      <div style={styles.splashWrap}>
        <div style={styles.splashContent}>
          <div style={styles.splashIcon}>📱</div>
          <h1 style={styles.splashTitle}>PrintConnect</h1>
          <p style={styles.splashSubtitle}>Upload & Print Service</p>
          <div style={styles.loader}></div>
        </div>
      </div>
    );
  }

  // Username Page
  if (currentPage === "username") {
    return (
      <div style={styles.pageWrap} className="desktop-layout">
        <div style={{...styles.card, justifyContent: "center", alignItems: "center"}} className="responsive-card">
          <div style={{width: "100%", maxWidth: 320}}>
            <div style={{...styles.cardHeader, textAlign: "center"}}>
              <h1 style={styles.cardTitle}>Welcome</h1>
              <p style={styles.cardSubtitle}>Please enter your name to continue</p>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>Your Name</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name"
                style={styles.input}
              />
            </div>

            <button
              onClick={() => username.trim() && setCurrentPage("upload")}
              disabled={!username.trim()}
              style={{
                ...styles.primaryBtn,
                opacity: username.trim() ? 1 : 0.5,
              }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Payment Page
  if (currentPage === "payment") {
    return (
      <div style={styles.pageWrap} className="desktop-layout">
        <div style={styles.card} className="responsive-card">
          <div style={styles.successIcon}>✅</div>
          <h1 style={styles.cardTitle}>Upload Successful!</h1>
          <p style={styles.cardSubtitle}>
            {uploadedFileCount} file(s) uploaded successfully
          </p>

          <div style={styles.paymentAmount}>
            ₹{uploadedFileCount * 10}
            <span style={styles.paymentAmountSub}>({uploadedFileCount} × ₹10)</span>
          </div>

          <h3 style={styles.sectionTitle}>Select Payment Method</h3>

          <button
            onClick={() => {
              alert(`Please pay ₹${uploadedFileCount * 10} at the counter`);
              setCurrentPage("username");
              setUsername("");
            }}
            style={styles.paymentBtn}
          >
            <span style={styles.paymentBtnIcon}>💵</span>
            <div>
              <div style={styles.paymentBtnTitle}>Cash Payment</div>
              <div style={styles.paymentBtnDesc}>Pay at the counter</div>
            </div>
          </button>

          <button
            onClick={() => alert("Razorpay coming soon!")}
            style={styles.paymentBtn}
          >
            <span style={styles.paymentBtnIcon}>💳</span>
            <div>
              <div style={styles.paymentBtnTitle}>Pay Online</div>
              <div style={styles.paymentBtnDesc}>UPI, Card, NetBanking</div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Upload Page (Main)
  return (
    <div style={styles.pageWrap} className="desktop-layout">
      <div style={styles.card} className="responsive-card">
        <button onClick={() => setCurrentPage("username")} style={styles.closeBtn}>
          ✕
        </button>

        <div style={styles.cardHeader}>
          <h1 style={styles.cardTitle}>Upload and attach files</h1>
          <p style={styles.cardSubtitle}>Files will be sent for printing</p>
        </div>

        {/* Drag & Drop Area */}
        <div
          style={{
            ...styles.dropZone,
            borderColor: isDragging ? "#7c3aed" : "#e2e8f0",
            backgroundColor: isDragging ? "#f5f3ff" : "#fafafa",
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div style={styles.dropIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <label style={styles.dropLabel}>
            <span style={styles.dropLink}>Click to Upload</span> or drag and drop
            <input
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.gif,.doc,.docx"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
          </label>
          <p style={styles.dropHint}>(Max. File size: 25 MB)</p>
        </div>

        {/* Files List */}
        {selectedFiles.length > 0 && (
          <div style={styles.filesList}>
            <p style={styles.filesCount}>
              {selectedFiles.filter(f => f.status === "uploading").length > 0
                ? `${selectedFiles.filter(f => f.status === "uploading").length} files uploading...`
                : `${selectedFiles.length} file(s) selected`}
            </p>

            {selectedFiles.map((fileObj) => (
              <div key={fileObj.id} style={styles.fileItem}>
                {/* Preview thumbnail */}
                <div 
                  style={styles.fileThumbnail}
                  onClick={() => openPreview(fileObj)}
                >
                  {fileObj.previewUrl ? (
                    <img src={fileObj.previewUrl} alt="" style={styles.thumbnailImg} />
                  ) : (
                    <span style={styles.fileIcon}>{getFileIcon(fileObj.file.name)}</span>
                  )}
                  {(fileObj.file.type.startsWith("image/") || fileObj.file.type === "application/pdf") && (
                    <div style={styles.previewOverlay}>👁️</div>
                  )}
                </div>
                <div style={styles.fileInfo}>
                  <div style={styles.fileName}>{fileObj.file.name}</div>
                  <div style={styles.fileMeta}>
                    {(fileObj.file.size / (1024 * 1024)).toFixed(1)} MB
                    {fileObj.status === "uploading" && ` • ${Math.round((fileObj.file.size / 1024 / 1024) * (100 - fileObj.progress) / 100)} sec left`}
                    {fileObj.status === "completed" && " • Completed"}
                  </div>
                  {/* Copy count */}
                  {fileObj.status !== "uploading" && (
                    <div style={styles.copyRow}>
                      <span style={styles.copyLabel}>Copies:</span>
                      <button 
                        style={styles.copyBtn} 
                        onClick={() => updateCopies(fileObj.id, fileObj.copies - 1)}
                      >−</button>
                      <input 
                        type="number" 
                        value={fileObj.copies} 
                        onChange={(e) => updateCopies(fileObj.id, e.target.value)}
                        style={styles.copyInput}
                        min="1" max="99"
                      />
                      <button 
                        style={styles.copyBtn} 
                        onClick={() => updateCopies(fileObj.id, fileObj.copies + 1)}
                      >+</button>
                    </div>
                  )}
                  {fileObj.status === "uploading" && (
                    <div style={styles.progressBar}>
                      <div style={{ ...styles.progressFill, width: `${fileObj.progress}%` }} />
                    </div>
                  )}
                </div>
                <div style={styles.fileActions}>
                  {fileObj.status === "uploading" && (
                    <span style={styles.progressText}>{fileObj.progress}%</span>
                  )}
                  <button onClick={() => removeFile(fileObj.id)} style={styles.removeBtn}>
                    {fileObj.status === "completed" ? "🗑️" : "✕"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div style={styles.actionButtons}>
          <button
            onClick={() => {
              setSelectedFiles([]);
              setCurrentPage("username");
            }}
            style={styles.cancelBtn}
          >
            Cancel
          </button>
          <button
            onClick={uploadFiles}
            disabled={selectedFiles.length === 0}
            style={{
              ...styles.attachBtn,
              opacity: selectedFiles.length > 0 ? 1 : 0.5,
            }}
          >
            Attach files
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <div style={styles.previewModal} onClick={closePreview}>
          <div style={styles.previewContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.previewClose} onClick={closePreview}>✕</button>
            <h3 style={styles.previewTitle}>{previewFile.name}</h3>
            {previewFile.type.startsWith("image/") ? (
              <img src={previewFile.url} alt={previewFile.name} style={styles.previewImage} />
            ) : (
              <iframe 
                src={previewFile.url} 
                style={styles.previewPdf} 
                title={previewFile.name}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  // Splash Screen
  splashWrap: {
    height: "100vh", // Use 100vh as base
    height: "100dvh", // Full viewport height including mobile URL bars etc
    width: "100vw",   // Full viewport width
    background: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter', -apple-system, sans-serif",
    position: "fixed", // Guaranteed overlay
    top: 0,
    left: 0,
    zIndex: 9999,
  },
  splashContent: { 
    textAlign: "center", 
    padding: 20,
    width: "100%",
    maxWidth: "420px", // Constrain width on larger screens
  },
  splashIcon: { fontSize: "clamp(48px, 12vw, 64px)", marginBottom: 16 },
  splashTitle: { fontSize: "clamp(24px, 6vw, 28px)", fontWeight: 700, color: "#fff", margin: "0 0 8px" },
  splashSubtitle: { fontSize: "clamp(12px, 3vw, 14px)", color: "rgba(255,255,255,0.8)", margin: 0 },
  loader: {
    width: 32, height: 32, margin: "32px auto 0",
    border: "3px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },

  // Page Wrapper - Centered on Desktop, Full on Mobile
  pageWrap: {
    height: "100dvh",
    width: "100vw",
    background: "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 50%, #f5f3ff 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",     // Center horizontally
    justifyContent: "center", // Center vertically
    fontFamily: "'Inter', -apple-system, sans-serif",
    boxSizing: "border-box",
    overflow: "hidden",
    padding: 0,
  },

  // Card - Compact with shadow on Mobile, styled on Desktop
  card: {
    flex: 1,
    width: "calc(100% - 24px)", // Compact with margin
    maxWidth: "480px",
    height: "calc(100% - 24px)",
    maxHeight: "calc(100dvh - 24px)",
    margin: "12px",
    background: "#ffffff",
    borderRadius: 20,
    padding: "clamp(16px, 4vw, 24px)",
    paddingTop: "clamp(20px, 5vw, 28px)",
    
    // Mobile shadow
    boxShadow: "0 10px 40px -10px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)",
    
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    position: "relative",
    overflowY: "auto",
  },
  closeBtn: {
    position: "absolute",
    top: "clamp(12px, 3vw, 16px)",
    right: "clamp(12px, 3vw, 16px)",
    background: "none",
    border: "none",
    fontSize: 20,
    color: "#94a3b8",
    cursor: "pointer",
    padding: 4,
    zIndex: 10,
  },
  cardHeader: { 
    textAlign: "center", 
    marginBottom: "clamp(16px, 4vw, 24px)",
    paddingRight: 24, // Space for close button
  },
  cardTitle: { 
    fontSize: "clamp(18px, 4.5vw, 22px)", 
    fontWeight: 600, 
    color: "#1e293b", 
    margin: "0 0 6px",
    lineHeight: 1.3,
  },
  cardSubtitle: { 
    fontSize: "clamp(12px, 3vw, 14px)", 
    color: "#64748b", 
    margin: 0,
    lineHeight: 1.4,
  },

  // Input
  inputGroup: { marginBottom: "clamp(16px, 4vw, 20px)" },
  inputLabel: { 
    display: "block", 
    fontSize: "clamp(12px, 3vw, 13px)", 
    fontWeight: 500, 
    color: "#475569", 
    marginBottom: 8 
  },
  input: {
    width: "100%",
    padding: "clamp(10px, 2.5vw, 14px)",
    fontSize: "clamp(14px, 3.5vw, 16px)",
    border: "2px solid #e2e8f0",
    borderRadius: 10,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },

  // Buttons
  primaryBtn: {
    width: "100%",
    padding: "clamp(12px, 3vw, 16px)",
    fontSize: "clamp(14px, 3.5vw, 16px)",
    fontWeight: 600,
    background: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
  },

  // Drop Zone
  dropZone: {
    border: "2px dashed #e2e8f0",
    borderRadius: 12,
    padding: "clamp(20px, 5vw, 32px) clamp(12px, 3vw, 16px)",
    textAlign: "center",
    marginBottom: "clamp(12px, 3vw, 16px)",
    transition: "all 0.2s",
    cursor: "pointer",
  },
  dropIcon: { marginBottom: "clamp(8px, 2vw, 12px)" },
  dropLabel: { 
    fontSize: "clamp(12px, 3vw, 14px)", 
    color: "#64748b", 
    cursor: "pointer", 
    display: "block",
    lineHeight: 1.5,
  },
  dropLink: { color: "#7c3aed", fontWeight: 500 },
  dropHint: { 
    fontSize: "clamp(10px, 2.5vw, 12px)", 
    color: "#94a3b8", 
    margin: "8px 0 0" 
  },

  // Files List
  filesList: { 
    flex: 1,
    marginBottom: "clamp(12px, 3vw, 16px)",
    overflowY: "auto",
    minHeight: 0,
  },
  filesCount: { 
    fontSize: "clamp(12px, 3vw, 13px)", 
    fontWeight: 600, 
    color: "#475569", 
    margin: "0 0 10px" 
  },
  fileItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "clamp(8px, 2vw, 12px)",
    padding: "clamp(10px, 2.5vw, 12px)",
    background: "#f8fafc",
    borderRadius: 10,
    marginBottom: 8,
  },
  fileIcon: { 
    fontSize: "clamp(20px, 5vw, 24px)", 
    lineHeight: 1,
    flexShrink: 0,
  },
  fileInfo: { flex: 1, minWidth: 0, overflow: "hidden" },
  fileName: {
    fontSize: "clamp(12px, 3vw, 14px)",
    fontWeight: 500,
    color: "#1e293b",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  fileMeta: { 
    fontSize: "clamp(10px, 2.5vw, 12px)", 
    color: "#64748b", 
    marginTop: 2 
  },
  progressBar: {
    height: 4,
    background: "#e2e8f0",
    borderRadius: 2,
    marginTop: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #7c3aed, #a78bfa)",
    borderRadius: 2,
    transition: "width 0.2s",
  },
  fileActions: { 
    display: "flex", 
    alignItems: "center", 
    gap: 6,
    flexShrink: 0,
  },
  progressText: { 
    fontSize: "clamp(10px, 2.5vw, 12px)", 
    fontWeight: 600, 
    color: "#7c3aed" 
  },
  removeBtn: {
    background: "none",
    border: "none",
    fontSize: "clamp(14px, 3.5vw, 16px)",
    color: "#94a3b8",
    cursor: "pointer",
    padding: 4,
  },

  // Action Buttons
  actionButtons: { 
    display: "flex", 
    gap: "clamp(8px, 2vw, 12px)",
    flexWrap: "wrap",
  },
  cancelBtn: {
    flex: 1,
    minWidth: 100,
    padding: "clamp(10px, 2.5vw, 14px)",
    fontSize: "clamp(13px, 3vw, 14px)",
    fontWeight: 600,
    background: "#f1f5f9",
    color: "#475569",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
  },
  attachBtn: {
    flex: 1,
    minWidth: 100,
    padding: "clamp(10px, 2.5vw, 14px)",
    fontSize: "clamp(13px, 3vw, 14px)",
    fontWeight: 600,
    background: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
  },

  // Payment
  successIcon: { 
    fontSize: "clamp(48px, 12vw, 64px)", 
    textAlign: "center", 
    marginBottom: "clamp(12px, 3vw, 16px)" 
  },
  paymentAmount: {
    fontSize: "clamp(24px, 7vw, 32px)",
    fontWeight: 700,
    color: "#7c3aed",
    textAlign: "center",
    margin: "clamp(12px, 3vw, 16px) 0",
  },
  paymentAmountSub: { 
    fontSize: "clamp(11px, 3vw, 14px)", 
    fontWeight: 400, 
    color: "#64748b", 
    marginLeft: 8,
    display: "inline-block",
  },
  sectionTitle: { 
    fontSize: "clamp(12px, 3vw, 14px)", 
    fontWeight: 600, 
    color: "#475569", 
    margin: "clamp(16px, 4vw, 24px) 0 clamp(8px, 2vw, 12px)" 
  },
  paymentBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "clamp(12px, 3vw, 16px)",
    padding: "clamp(12px, 3vw, 16px)",
    background: "#f8fafc",
    border: "2px solid #e2e8f0",
    borderRadius: 12,
    cursor: "pointer",
    marginBottom: "clamp(8px, 2vw, 12px)",
    textAlign: "left",
  },
  paymentBtnIcon: { 
    fontSize: "clamp(24px, 6vw, 32px)",
    flexShrink: 0,
  },
  paymentBtnTitle: { 
    fontSize: "clamp(13px, 3.5vw, 15px)", 
    fontWeight: 600, 
    color: "#1e293b" 
  },
  paymentBtnDesc: { 
    fontSize: "clamp(10px, 2.5vw, 12px)", 
    color: "#64748b" 
  },

  // Thumbnail & Preview
  fileThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    cursor: "pointer",
    flexShrink: 0,
  },
  thumbnailImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  previewOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0,
    transition: "opacity 0.2s",
    fontSize: 16,
  },

  // Copy controls
  copyRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  copyLabel: {
    fontSize: 11,
    color: "#64748b",
  },
  copyBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#7c3aed",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  copyInput: {
    width: 36,
    height: 24,
    borderRadius: 6,
    border: "1px solid #e2e8f0",
    textAlign: "center",
    fontSize: 12,
    fontWeight: 600,
  },

  // Preview Modal
  previewModal: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 16,
  },
  previewContent: {
    background: "#fff",
    borderRadius: 16,
    maxWidth: "95vw",
    maxHeight: "95vh",
    overflow: "hidden",
    position: "relative",
    display: "flex",
    flexDirection: "column",
  },
  previewClose: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: "none",
    background: "#f1f5f9",
    cursor: "pointer",
    fontSize: 16,
    zIndex: 10,
  },
  previewTitle: {
    padding: "12px 48px 12px 16px",
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
    borderBottom: "1px solid #e2e8f0",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  previewImage: {
    maxWidth: "90vw",
    maxHeight: "80vh",
    objectFit: "contain",
  },
  previewPdf: {
    width: "90vw",
    height: "80vh",
    border: "none",
  },
};
