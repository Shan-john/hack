import { useState, useEffect } from "react";

export default function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, approved, printed, rejected
  const [printerIp, setPrinterIp] = useState("127.0.0.1");
  const [showSettings, setShowSettings] = useState(false);
  const [status, setStatus] = useState("");

  // Hide splash screen after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch jobs on mount and every 5 seconds
  useEffect(() => {
    if (!showSplash) {
      fetchJobs();
      const interval = setInterval(fetchJobs, 5000);
      return () => clearInterval(interval);
    }
  }, [showSplash]);

  // Fetch printer config on mount
  useEffect(() => {
    if (!showSplash) {
      fetchPrinterConfig();
    }
  }, [showSplash]);

  const fetchJobs = async () => {
    try {
      const serverIp = window.location.hostname;
      const res = await fetch(`http://${serverIp}:3000/uploads`);
      if (res.ok) {
        const data = await res.json();
        // Reverse order to show newest first
        const reversedJobs = (data.uploads || []).reverse();
        setJobs(reversedJobs);
      }
    } catch (e) {
      console.error("Error fetching jobs:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrinterConfig = async () => {
    try {
      const serverIp = window.location.hostname;
      const res = await fetch(`http://${serverIp}:3000/printer-config`);
      if (res.ok) {
        const data = await res.json();
        setPrinterIp(data.printerIp);
      }
    } catch (e) {
      console.error("Error fetching printer config:", e);
    }
  };

  const approveJob = async (jobId) => {
    try {
      const serverIp = window.location.hostname;
      const res = await fetch(`http://${serverIp}:3000/approve-job`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });

      if (res.ok) {
        setStatus(`✅ Job approved`);
        fetchJobs();
        setTimeout(() => setStatus(""), 3000);
      }
    } catch (e) {
      setStatus(`❌ Error: ${e.message}`);
      setTimeout(() => setStatus(""), 3000);
    }
  };

  const rejectJob = async (jobId) => {
    try {
      const serverIp = window.location.hostname;
      const res = await fetch(`http://${serverIp}:3000/update-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, status: "rejected" }),
      });

      if (res.ok) {
        setStatus(`✅ Job rejected`);
        fetchJobs();
        setTimeout(() => setStatus(""), 3000);
      }
    } catch (e) {
      setStatus(`❌ Error: ${e.message}`);
      setTimeout(() => setStatus(""), 3000);
    }
  };

  const printJob = async (jobId) => {
    try {
      const serverIp = window.location.hostname;
      const res = await fetch(`http://${serverIp}:3000/print-job`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, printerIp }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.errors) {
          setStatus(`⚠️ Printed with errors: ${data.errors.join(", ")}`);
        } else {
          setStatus(`✅ Printed ${data.printedCount} file(s) to ${data.printerIp}`);
        }
        fetchJobs();
        setTimeout(() => setStatus(""), 5000);
      } else {
        const error = await res.json();
        setStatus(`❌ ${error.error}`);
        setTimeout(() => setStatus(""), 3000);
      }
    } catch (e) {
      setStatus(`❌ Error: ${e.message}`);
      setTimeout(() => setStatus(""), 3000);
    }
  };

  const updatePrinterIp = async () => {
    try {
      const serverIp = window.location.hostname;
      const res = await fetch(`http://${serverIp}:3000/update-printer-ip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ printerIp }),
      });

      if (res.ok) {
        setStatus(`✅ Printer IP updated to ${printerIp}`);
        setShowSettings(false);
        setTimeout(() => setStatus(""), 3000);
      }
    } catch (e) {
      setStatus(`❌ Error: ${e.message}`);
      setTimeout(() => setStatus(""), 3000);
    }
  };

  // Splash Screen
  if (showSplash) {
    return (
      <div style={styles.splashWrap}>
        <div style={styles.splashContent}>
          <div style={styles.splashIcon}>🖨️</div>
          <h1 style={styles.splashTitle}>Shopowner Dashboard</h1>
          <p style={styles.splashSubtitle}>Print Job Management</p>
          <div style={styles.loader}></div>
        </div>
      </div>
    );
  }

  // Filter jobs
  const filteredJobs = jobs.filter((job) => {
    if (filter === "all") return true;
    return job.status === filter;
  });

  // Get status counts
  const statusCounts = {
    all: jobs.length,
    pending: jobs.filter((j) => j.status === "pending").length,
    approved: jobs.filter((j) => j.status === "approved").length,
    printed: jobs.filter((j) => j.status === "printed").length,
    rejected: jobs.filter((j) => j.status === "rejected").length,
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>🖨️ Shopowner Dashboard</h1>
            <p style={styles.subtitle}>Manage print jobs and printer settings</p>
          </div>
          <button onClick={() => setShowSettings(!showSettings)} style={styles.settingsBtn}>
            ⚙️
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div style={styles.settingsPanel}>
            <h3 style={styles.settingsTitle}>Printer Settings</h3>
            <div style={styles.settingsRow}>
              <label style={styles.label}>Printer IP Address:</label>
              <input
                type="text"
                value={printerIp}
                onChange={(e) => setPrinterIp(e.target.value)}
                placeholder="192.168.1.100"
                style={styles.input}
              />
            </div>
            <div style={styles.settingsRow}>
              <label style={styles.label}>Port:</label>
              <input type="text" value="9100" disabled style={styles.inputDisabled} />
            </div>
            <button onClick={updatePrinterIp} style={styles.saveBtn}>
              Save Settings
            </button>
          </div>
        )}

        {/* Status Message */}
        {status && <div style={styles.statusBar}>{status}</div>}

        {/* Filter Tabs */}
        <div style={styles.filterTabs}>
          {["all", "pending", "approved", "printed", "rejected"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                ...styles.filterTab,
                ...(filter === f ? styles.filterTabActive : {}),
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span style={styles.badge}>{statusCounts[f]}</span>
            </button>
          ))}
        </div>

        {/* Jobs List */}
        <div style={styles.jobsList}>
          {loading ? (
            <div style={styles.emptyState}>Loading jobs...</div>
          ) : filteredJobs.length === 0 ? (
            <div style={styles.emptyState}>No {filter !== "all" ? filter : ""} jobs found</div>
          ) : (
            filteredJobs.map((job) => (
              <div key={job.jobId} style={styles.jobCard}>
                {/* Job Header */}
                <div style={styles.jobHeader}>
                  <div>
                    <div style={styles.jobUser}>👤 {job.username}</div>
                    <div style={styles.jobId}>ID: {job.userId}</div>
                  </div>
                  <div style={getStatusStyle(job.status || "pending")}>{(job.status || "pending").toUpperCase()}</div>
                </div>

                {/* Job Info */}
                <div style={styles.jobInfo}>
                  <div style={styles.jobInfoItem}>
                    <span style={styles.jobInfoLabel}>Job ID:</span>
                    <span style={styles.jobInfoValue}>{job.jobId}</span>
                  </div>
                  <div style={styles.jobInfoItem}>
                    <span style={styles.jobInfoLabel}>Submitted:</span>
                    <span style={styles.jobInfoValue}>
                      {new Date(job.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div style={styles.jobInfoItem}>
                    <span style={styles.jobInfoLabel}>Files:</span>
                    <span style={styles.jobInfoValue}>{job.fileCount} file(s)</span>
                  </div>
                </div>

                {/* Files List */}
                <div style={styles.filesList}>
                  {job.files.map((file, idx) => (
                    <div key={idx} style={styles.fileItem}>
                      <span style={styles.fileIcon}>📄</span>
                      <div style={styles.fileInfo}>
                        <div style={styles.fileName}>{file.originalName}</div>
                        <div style={styles.fileSize}>
                          {(file.size / 1024).toFixed(2)} KB • {file.mimeType}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div style={styles.actions}>
                  {job.status === "pending" && (
                    <>
                      <button onClick={() => approveJob(job.jobId)} style={styles.approveBtn}>
                        ✓ Approve
                      </button>
                      <button onClick={() => rejectJob(job.jobId)} style={styles.rejectBtn}>
                        ✗ Reject
                      </button>
                    </>
                  )}
                  {job.status === "approved" && (
                    <button onClick={() => printJob(job.jobId)} style={styles.printBtn}>
                      🖨️ Print Now
                    </button>
                  )}
                  {job.status === "printed" && (
                    <div style={styles.printedInfo}>
                      ✅ Printed on {new Date(job.printedAt).toLocaleString()}
                      {job.printerIp && ` to ${job.printerIp}`}
                    </div>
                  )}
                  {job.status === "rejected" && (
                    <div style={styles.rejectedInfo}>❌ Rejected</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function for status badge styling
const getStatusStyle = (status) => {
  const baseStyle = {
    padding: "6px 12px",
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.5px",
  };

  const statusColors = {
    pending: { background: "#fef3c7", color: "#92400e" },
    approved: { background: "#d1fae5", color: "#065f46" },
    printed: { background: "#dbeafe", color: "#1e40af" },
    rejected: { background: "#fee2e2", color: "#991b1b" },
  };

  return { ...baseStyle, ...statusColors[status] };
};

const styles = {
  // Splash Screen
  splashWrap: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #7c3aed 0%, #6366f1 50%, #3b82f6 100%)",
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

  // Main Layout
  wrap: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 50%, #f5f3ff 100%)",
    backgroundAttachment: "fixed",
    padding: "20px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    boxSizing: "border-box",
  },
  container: {
    maxWidth: 1200,
    margin: "0 auto",
  },

  // Header
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: 20,
    padding: 24,
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: "#1e293b",
    margin: 0,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    margin: 0,
  },
  settingsBtn: {
    background: "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)",
    border: "none",
    borderRadius: 12,
    padding: "10px 14px",
    fontSize: 20,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)",
    transition: "all 0.2s",
  },

  // Settings Panel
  settingsPanel: {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#1e293b",
    marginTop: 0,
    marginBottom: 16,
  },
  settingsRow: {
    marginBottom: 12,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#475569",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: 10,
    fontSize: 14,
    border: "2px solid #e2e8f0",
    borderRadius: 10,
    boxSizing: "border-box",
    outline: "none",
    transition: "all 0.2s",
  },
  inputDisabled: {
    width: "100%",
    padding: 10,
    fontSize: 14,
    border: "2px solid #e2e8f0",
    borderRadius: 10,
    boxSizing: "border-box",
    background: "#f1f5f9",
    color: "#94a3b8",
  },
  saveBtn: {
    background: "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 8,
    boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)",
    transition: "all 0.2s",
  },

  // Status Bar
  statusBar: {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    textAlign: "center",
    fontSize: 14,
    fontWeight: 600,
    color: "#1e293b",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
  },

  // Filter Tabs
  filterTabs: {
    display: "flex",
    gap: 8,
    marginBottom: 20,
    overflowX: "auto",
    padding: "4px 0",
  },
  filterTab: {
    background: "rgba(255, 255, 255, 0.7)",
    border: "2px solid #e2e8f0",
    borderRadius: 12,
    padding: "10px 16px",
    fontSize: 13,
    fontWeight: 600,
    color: "#64748b",
    cursor: "pointer",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  filterTabActive: {
    background: "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)",
    color: "#fff",
    borderColor: "transparent",
    boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)",
  },
  badge: {
    background: "rgba(0, 0, 0, 0.1)",
    borderRadius: 6,
    padding: "2px 6px",
    fontSize: 11,
    fontWeight: 700,
  },

  // Jobs List
  jobsList: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  emptyState: {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: 16,
    padding: 60,
    textAlign: "center",
    color: "#64748b",
    fontSize: 16,
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
  },

  // Job Card
  jobCard: {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
    transition: "all 0.3s",
  },
  jobHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottom: "2px solid #f1f5f9",
  },
  jobUser: {
    fontSize: 18,
    fontWeight: 700,
    color: "#1e293b",
    marginBottom: 4,
  },
  jobId: {
    fontSize: 12,
    color: "#64748b",
  },

  // Job Info
  jobInfo: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginBottom: 16,
    padding: 12,
    background: "#f8fafc",
    borderRadius: 10,
  },
  jobInfoItem: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13,
  },
  jobInfoLabel: {
    fontWeight: 600,
    color: "#475569",
  },
  jobInfoValue: {
    color: "#1e293b",
  },

  // Files List
  filesList: {
    marginBottom: 16,
  },
  fileItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 10,
    background: "#f8fafc",
    borderRadius: 10,
    marginBottom: 8,
    border: "1px solid #e2e8f0",
  },
  fileIcon: {
    fontSize: 24,
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
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 11,
    color: "#64748b",
  },

  // Actions
  actions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  approveBtn: {
    flex: 1,
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "12px 20px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
    transition: "all 0.2s",
  },
  rejectBtn: {
    flex: 1,
    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "12px 20px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
    transition: "all 0.2s",
  },
  printBtn: {
    width: "100%",
    background: "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "12px 20px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)",
    transition: "all 0.2s",
  },
  printedInfo: {
    width: "100%",
    padding: 12,
    background: "#dbeafe",
    color: "#1e40af",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    textAlign: "center",
  },
  rejectedInfo: {
    width: "100%",
    padding: 12,
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    textAlign: "center",
  },
};

