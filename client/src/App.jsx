import React, { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import axios from 'axios';
import Form from './components/Form';
import CertificatePreview from './components/CertificatePreview';
import { format } from 'date-fns';

function App() {
  const [data, setData] = useState({
    certificateId: '',
    departmentName: 'Health and Family Welfare Department',
    clinicName: 'COMMUNITY HEALTH CENTRE, BAROH',
    clinicAddress: 'TEH. BAROH, DISTT, KANGRA (H.P)',
    clinicLogo: '',
    patientTitle: 'Mr.',
    patientName: '',
    age: '',
    gender: 'Male',
    patientAddress: '',
    diagnosis: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startDate: format(new Date(), 'yyyy-MM-dd'),
    restDays: '2',
    endDate: format(new Date(new Date().setDate(new Date().getDate() + 1)), 'yyyy-MM-dd'),
    instructions: 'Ensure adequate hydration and proper rest. Take prescribed medicines on time.',
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

  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const CORRECT_PASSKEY = 'CERtificate'; // Configurable passcode

  // Load from local storage and generate initial ID on mount
  useEffect(() => {
    const savedData = localStorage.getItem('medCertData');
    if (savedData) {
      setData(prev => ({
        ...prev,
        ...JSON.parse(savedData),
        // keep some fields default to current
        date: format(new Date(), 'yyyy-MM-dd'),
        startDate: format(new Date(), 'yyyy-MM-dd'),
        certificateId: generateCertId()
      }));
    } else {
      setData(prev => ({ ...prev, certificateId: generateCertId() }));
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    // Only save clinic & doctor details to avoid saving patient specific info
    const toSave = {
      departmentName: data.departmentName,
      clinicName: data.clinicName,
      clinicAddress: data.clinicAddress,
      clinicLogo: data.clinicLogo,
      signatureImage: data.signatureImage,
      stampImage: data.stampImage
    };
    localStorage.setItem('medCertData', JSON.stringify(toSave));
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
      { key: 'patientAddress', label: 'Patient Address' },
      { key: 'diagnosis', label: 'Diagnosis' },
      { key: 'date', label: 'Certificate Date' },
      { key: 'startDate', label: 'Start Date' },
      { key: 'restDays', label: 'Rest Days' },
      { key: 'signatureImage', label: 'Signature Upload' },
      { key: 'stampImage', label: 'Stamp Upload' }
    ];

    for (let field of requiredFields) {
      if (!data[field.key]) {
        showToast(`Missing detail: ${field.label}`, 'error');
        return false;
      }
    }

    if (formRef.current && !formRef.current.reportValidity()) {
      return false;
    }

    return true;
  };

  const generatePDFBlob = async () => {
    if (!certificateRef.current) return null;

    // Scale up for better resolution in print
    const dataUrl = await toPng(certificateRef.current, {
      quality: 0.8,
      pixelRatio: 2,
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left'
      }
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Force image to cover the exact 8.27 x 11.69 A4 dimensions
    pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
    return pdf.output('blob');
  };

  const handlePreviewAndDownload = async () => {
    if (!validateForm()) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }
    setPendingAction('download');
    setShowPasskeyModal(true);
  };

  const executeDownload = async () => {
    setIsProcessing(true);
    try {
      const blob = await generatePDFBlob();
      if (!blob) throw new Error("Could not generate PDF");

      setPdfBlob(blob);
      const url = URL.createObjectURL(blob);
      setPreviewPdfUrl(url);
    } catch (error) {
      console.error(error);
      showToast('Failed to generate PDF preview.', 'error');
    } finally {
      setIsProcessing(false);
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

  const handleEmail = async () => {
    if (!validateForm()) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }
    if (!data.patientEmail) {
      showToast('Please enter a patient email address first.', 'error');
      return;
    }
    setPendingAction('email');
    setShowPasskeyModal(true);
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
        certificateBase64: base64data
      };

      const response = await axios.post('/api/send-email', payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        showToast('Email sent securely to patient!', 'success');
      } else {
        throw new Error(response.data.message || 'Failed to send email');
      }
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Error connecting to the mail server.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePasskeySubmit = () => {
    if (passkeyInput === CORRECT_PASSKEY) {
      setShowPasskeyModal(false);
      setPasskeyInput('');
      if (pendingAction === 'download') {
        executeDownload();
      } else if (pendingAction === 'email') {
        executeEmail();
      }
    } else {
      showToast('Invalid Pass Key!', 'error');
    }
  };

  return (
    <div className="app-container">
      {isProcessing && (
        <div className="loading-overlay">
          Processing Certificate...
        </div>
      )}

      {toast.show && (
        <div className={`toast-notification toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Passkey Modal */}
      {showPasskeyModal && (
        <div className="pdf-modal-overlay">
          <div className="pdf-modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '20px' }}>Security Check</h2>
            <p style={{ marginBottom: '15px' }}>Please enter the pass key to authorize this action.</p>
            <input 
              type="password" 
              value={passkeyInput} 
              onChange={(e) => setPasskeyInput(e.target.value)} 
              placeholder="Enter Pass Key" 
              style={{ width: '100%', padding: '10px', marginBottom: '20px', fontSize: '16px' }}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handlePasskeySubmit(); }}
            />
            <div className="modal-actions" style={{ justifyContent: 'center' }}>
              <button className="btn-secondary" onClick={() => { setShowPasskeyModal(false); setPasskeyInput(''); }}>Cancel</button>
              <button className="btn-primary" onClick={handlePasskeySubmit}>Authorize</button>
            </div>
          </div>
        </div>
      )}

      <div className="form-section">
        <h1>Generator Dashboard</h1>
        <p>Fill out the details below. Clinic and Doctor info is auto-saved.</p>
        <Form
          data={data}
          setData={setData}
          onDownload={handlePreviewAndDownload}
          onEmail={handleEmail}
          isProcessing={isProcessing}
        />
      </div>

      <div className="preview-section">
        <CertificatePreview ref={certificateRef} data={data} />
      </div>

      {previewPdfUrl && (
        <div className="pdf-modal-overlay">
          <div className="pdf-modal">
            <div className="pdf-modal-header">
              <h2>PDF Preview</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
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
