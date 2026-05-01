import React, { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import axios from 'axios';
import Form from './components/Form';
import CertificatePreview from './components/CertificatePreview';

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const [data, setData] = useState({
    certificateId: '',
    departmentName: '',
    clinicName: '',
    clinicAddress: '',
    clinicLogo: '',
    patientTitle: 'Mr.',
    patientName: '',
    age: '',
    gender: 'Male',
    patientAddress: '',
    diagnosis: '',
    date: '',
    startDate: '',
    restDays: '',
    endDate: '',
    instructions: '',
    signatureImage: '',
    stampImage: '',
    patientEmail: ''
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [previewPdfUrl, setPreviewPdfUrl] = useState('');
  const [pdfBlob, setPdfBlob] = useState(null);
  
  const certificateRef = useRef(null);
  const formRef = useRef(null);
  const previewOuterRef = useRef(null);

  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  // Fit Engine State
  const A4_WIDTH = 794;
  const A4_HEIGHT = 1123;
  const [previewScale, setPreviewScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState(A4_HEIGHT);

  useEffect(() => {
    if (!previewOuterRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        // Calculate exact mathematical scale needed to fit the container width
        const containerWidth = entry.contentRect.width;
        const newScale = containerWidth / A4_WIDTH;
        
        // Cap the scale so it doesn't get ridiculously large on ultrawide monitors
        const finalScale = Math.min(newScale, 1.2);
        
        setPreviewScale(finalScale);
        setScaledHeight(A4_HEIGHT * finalScale);
      }
    });
    
    resizeObserver.observe(previewOuterRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const savedData = localStorage.getItem('medCertData_v2');
    if (savedData) {
      setData(prev => ({
        ...prev,
        ...JSON.parse(savedData),
        certificateId: generateCertId()
      }));
    } else {
      setData(prev => ({ ...prev, certificateId: generateCertId() }));
    }
  }, []);

  useEffect(() => {
    const toSave = {
      departmentName: data.departmentName,
      clinicName: data.clinicName,
      clinicAddress: data.clinicAddress,
      clinicLogo: data.clinicLogo,
      signatureImage: data.signatureImage,
      stampImage: data.stampImage
    };
    localStorage.setItem('medCertData_v2', JSON.stringify(toSave));
  }, [data]);

  const generateCertId = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `MC-${year}-${randomNum}`;
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const validateForm = () => {
    const requiredFields = [
      { key: 'departmentName', label: 'Department Name' },
      { key: 'clinicName', label: 'Clinic/Hospital Name' },
      { key: 'clinicAddress', label: 'Clinic Address' },
      { key: 'patientName', label: 'Patient Name' },
      { key: 'age', label: 'Age' },
      { key: 'gender', label: 'Gender' },
      { key: 'diagnosis', label: 'Diagnosis' },
      { key: 'date', label: 'Certificate Date' },
      { key: 'signatureImage', label: 'Signature Upload' }
    ];

    for (let field of requiredFields) {
      if (!data[field.key]) {
        showToast(`Missing detail: ${field.label}`, 'error');
        return false;
      }
    }
    return true;
  };



  const generatePDFBlob = async () => {
    if (!certificateRef.current) return null;
    
    // Explicitly enforce scale(1) so the export is strictly 794x1123, unaffected by preview scaling
    const dataUrl = await toPng(certificateRef.current, {
      quality: 0.8,
      pixelRatio: 2,
      style: { 
        transform: 'scale(1)', 
        transformOrigin: 'top left',
        width: `${A4_WIDTH}px`,
        height: `${A4_HEIGHT}px`
      }
    });
    
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
    return pdf.output('blob');
  };

  const handlePreviewAndDownload = async () => {
    if (!validateForm()) return;
    setPendingAction('download');
    setShowPasskeyModal(true);
  };

  const handleEmail = async () => {
    if (!validateForm()) return;
    if (!data.patientEmail) {
      showToast('Please enter a patient email address first.', 'error');
      return;
    }
    setPendingAction('email');
    setShowPasskeyModal(true);
  };

  const executeDownload = async () => {
    setIsProcessing(true);
    try {
      setShowPasskeyModal(false);
      setPasskeyInput('');
      
      const blob = await generatePDFBlob();
      if (!blob) throw new Error("Could not generate PDF");

      setPdfBlob(blob);
      const url = URL.createObjectURL(blob);
      setPreviewPdfUrl(url);
      
      // Auto-generate a new ID for the next certificate
      setData(prev => ({ ...prev, certificateId: generateCertId() }));
    } catch (error) {
      showToast(error.message || 'Error generating PDF', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const executeEmail = async () => {
    setIsProcessing(true);
    try {
      const pdfBlob = await generatePDFBlob();
      const base64data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(pdfBlob);
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
      });

      const payload = {
        email: data.patientEmail,
        certificateBase64: base64data,
        passkey: passkeyInput
      };

      const response = await axios.post('/api/send-email', payload, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.data.success) {
        showToast('Email sent securely to patient!', 'success');
        setShowPasskeyModal(false);
        setPasskeyInput('');
        
        // Auto-generate a new ID for the next certificate
        setData(prev => ({ ...prev, certificateId: generateCertId() }));
      }
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to send email. Invalid passkey?', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePasskeySubmit = () => {
    if (!passkeyInput.trim()) {
      showToast('Please enter the passkey.', 'error');
      return;
    }

    if (passkeyInput.trim() !== 'CERTificate') {
      showToast('Invalid Passkey.', 'error');
      return;
    }

    if (pendingAction === 'download') {
      executeDownload();
    } else if (pendingAction === 'email') {
      executeEmail();
    }
  };

  const handleConfirmDownload = () => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Medical_Certificate_${data.patientName || 'Unknown'}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('PDF downloaded successfully!', 'success');
  };

  return (
    <div className="app-container">
      {isProcessing && (
        <div className="loading-overlay">
          <div className="loader"></div>
          <p>Processing Certificate...</p>
        </div>
      )}

      {toast.show && (
        <div className={`toast-notification toast-${toast.type} card`}>
          {toast.message}
        </div>
      )}

      {/* Passkey Modal */}
      {showPasskeyModal && (
        <div className="modal-overlay">
          <div className="modal-content card">
            <h2>Security Check</h2>
            <p className="modal-subtitle">
              Please enter your admin passkey to authorize this action.
            </p>
            <input 
              type="password" 
              className="medical-input text-center"
              value={passkeyInput} 
              onChange={(e) => setPasskeyInput(e.target.value)} 
              placeholder="Enter Passkey" 
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handlePasskeySubmit(); }}
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => { setShowPasskeyModal(false); setPasskeyInput(''); }}>Cancel</button>
              <button className="btn-primary" onClick={handlePasskeySubmit}>Authorize</button>
            </div>
          </div>
        </div>
      )}

      {/* Form Section */}
      <div className="form-section">
        <div className="page-header">
          <div>
            <h1>Medical Certificate Dashboard</h1>
            <p className="subtitle">Fill out the details below. Clinic and Doctor info is auto-saved.</p>
          </div>
          <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle Theme">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
        
        <div className="card form-wrapper">
          <Form
            data={data}
            setData={setData}
            onDownload={handlePreviewAndDownload}
            onEmail={handleEmail}
            isProcessing={isProcessing}
          />
        </div>
      </div>

      {/* Live Preview Section */}
      <div className="preview-section">
        {/* Layer 1: Outer Container controls layout and tracks width */}
        <div className="preview-outer-container" ref={previewOuterRef}>
          {/* Layer 2: Wrapper that holds the exact physical footprint of the scaled inner component */}
          <div 
            className="preview-inner-layer"
            style={{ 
              width: `${A4_WIDTH * previewScale}px`, 
              height: `${scaledHeight}px` 
            }}
          >
            {/* The actual unscaled certificate, visually shrunk down via CSS transform */}
            <div style={{
              transform: `scale(${previewScale})`,
              transformOrigin: 'top center',
              width: `${A4_WIDTH}px`,
              height: `${A4_HEIGHT}px`,
              pointerEvents: 'none' // Prevents text selection/dragging
            }}>
              <CertificatePreview ref={certificateRef} data={data} />
            </div>
          </div>
        </div>
      </div>

      {/* Final PDF Preview Modal */}
      {previewPdfUrl && (
        <div className="modal-overlay">
          <div className="modal-content large-modal card">
            <div className="modal-header">
              <h2>PDF Preview</h2>
              <div className="modal-header-actions">
                <button className="btn-primary" onClick={handleConfirmDownload}>Download Final PDF</button>
                <button className="btn-secondary" onClick={() => setPreviewPdfUrl('')}>Close</button>
              </div>
            </div>
            <iframe src={previewPdfUrl} className="pdf-iframe" title="PDF Preview"></iframe>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
