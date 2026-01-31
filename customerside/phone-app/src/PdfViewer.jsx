import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path - using unpkg CDN for reliability
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

export default function PdfViewer({ file }) {
  const canvasRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);
        const fileUrl = URL.createObjectURL(file);
        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setLoading(false);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF. Please try again.');
        setLoading(false);
      }
    };

    loadPdf();
  }, [file]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // Calculate scale to fit screen width
        const viewport = page.getViewport({ scale: 1 });
        const scale = Math.min(
          (window.innerWidth * 0.85) / viewport.width,
          (window.innerHeight * 0.6) / viewport.height
        );
        const scaledViewport = page.getViewport({ scale });

        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport,
        };

        await page.render(renderContext).promise;
      } catch (err) {
        console.error('Error rendering page:', err);
        setError('Failed to render PDF page.');
      }
    };

    renderPage();
  }, [pdfDoc, currentPage]);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading PDF...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.error}>
        <div style={styles.errorIcon}>⚠️</div>
        <p style={styles.errorText}>{error}</p>
        <p style={styles.errorHint}>Try using a different PDF viewer app</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <canvas ref={canvasRef} style={styles.canvas} />
      
      {totalPages > 1 && (
        <div style={styles.controls}>
          <button
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            style={{
              ...styles.navBtn,
              opacity: currentPage === 1 ? 0.5 : 1,
            }}
          >
            ← Prev
          </button>
          <span style={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            style={{
              ...styles.navBtn,
              opacity: currentPage === totalPages ? 0.5 : 1,
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  canvas: {
    maxWidth: '100%',
    height: 'auto',
    border: '2px solid #e2e8f0',
    borderRadius: 12,
  },
  loading: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    margin: '0 auto 16px',
    animation: 'spin 1s linear infinite',
  },
  error: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    fontWeight: 600,
    color: '#dc2626',
    marginBottom: 8,
  },
  errorHint: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 0,
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '12px 16px',
    background: '#f8fafc',
    borderRadius: 12,
    width: '100%',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
  },
  navBtn: {
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  pageInfo: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1e293b',
  },
};
