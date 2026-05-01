import React, { useState, useEffect } from 'react';
import { addDays, format } from 'date-fns';
import { Download, Mail, Eye } from 'lucide-react';

const Form = ({ data, setData, onDownload, onEmail, isProcessing, formRef }) => {
  const [commonDiagnoses] = useState([
    'Viral Fever',
    'Acute Gastroenteritis',
    'Upper Respiratory Tract Infection',
    'Migraine',
    'Lower Back Pain'
  ]);

  const [isCustomDiagnosis, setIsCustomDiagnosis] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto-calculate end date when rest days or start date changes
      if (name === 'restDays' || name === 'startDate') {
        const days = parseInt(name === 'restDays' ? value : prev.restDays, 10);
        const start = name === 'startDate' ? new Date(value) : new Date(prev.startDate);
        
        if (!isNaN(days) && start.toString() !== 'Invalid Date') {
          // Subtract 1 because the start day counts as day 1
          const end = addDays(start, Math.max(0, days - 1));
          newData.endDate = format(end, 'yyyy-MM-dd');
        }
      }
      
      return newData;
    });
  };

  const handleImageUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setData(prev => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form ref={formRef} className="form-container" onSubmit={(e) => e.preventDefault()}>
      <h2 className="section-title">Clinic Details</h2>
      <div className="form-group">
        <label>Department Name</label>
        <input type="text" name="departmentName" value={data.departmentName} onChange={handleInputChange} placeholder="e.g. Department of General Medicine" />
      </div>
      <div className="grid-2">
        <div className="form-group">
          <label>Clinic/Hospital Name</label>
          <input type="text" name="clinicName" value={data.clinicName} onChange={handleInputChange} placeholder="e.g. City Hospital, Bangalore" />
        </div>
        <div className="form-group">
          <label>Clinic Address</label>
          <textarea name="clinicAddress" value={data.clinicAddress} onChange={handleInputChange} rows="2" placeholder="e.g. 123 Healthcare Ave, Koramangala, Bangalore 560034"></textarea>
        </div>
      </div>
      <div className="form-group">
        <label>Clinic Logo Upload (Optional)</label>
        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'clinicLogo')} />
        {data.clinicLogo && <div style={{marginTop: '5px', fontSize: '0.8rem', color: 'green'}}>Logo loaded.</div>}
      </div>

      <h2 className="section-title">Patient Details</h2>
      <div className="grid-2">
        <div className="form-group">
          <label>Patient Name</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select name="patientTitle" value={data.patientTitle || 'Mr.'} onChange={handleInputChange} style={{ width: '80px', padding: '0.5rem' }}>
              <option value="Mr.">Mr.</option>
              <option value="Ms.">Ms.</option>
              <option value="Mrs.">Mrs.</option>
              <option value="Miss">Miss</option>
              <option value="Master">Master</option>
            </select>
            <input type="text" name="patientName" value={data.patientName} onChange={handleInputChange} style={{ flex: 1 }} />
          </div>
        </div>
        <div className="form-group">
          <label>Age</label>
          <input type="number" name="age" value={data.age} onChange={handleInputChange} min="1" max="150" />
        </div>
      </div>
      <div className="grid-2">
        <div className="form-group">
          <label>Gender</label>
          <select name="gender" value={data.gender} onChange={handleInputChange}>
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label>Patient Address</label>
          <textarea name="patientAddress" value={data.patientAddress} onChange={handleInputChange} rows="2"></textarea>
        </div>
      </div>

      <h2 className="section-title">Medical Details</h2>
      <div className="grid-2">
        <div className="form-group">
          <label>Diagnosis</label>
          {!isCustomDiagnosis ? (
            <select name="diagnosis" value={data.diagnosis} onChange={(e) => {
              if (e.target.value === 'custom') {
                setIsCustomDiagnosis(true);
                setData(prev => ({ ...prev, diagnosis: '' }));
              } else {
                handleInputChange(e);
              }
            }}>
              <option value="">Select Diagnosis...</option>
              {commonDiagnoses.map(d => <option key={d} value={d}>{d}</option>)}
              <option value="custom">-- Custom Diagnosis --</option>
            </select>
          ) : (
            <div style={{display: 'flex', gap: '5px'}}>
              <input type="text" name="diagnosis" value={data.diagnosis} onChange={handleInputChange} placeholder="Enter custom diagnosis" style={{flex: 1}}/>
              <button type="button" onClick={() => setIsCustomDiagnosis(false)} className="btn-secondary" style={{padding: '0.75rem', fontSize: '0.8rem'}}>List</button>
            </div>
          )}
        </div>
        <div className="form-group">
          <label>Certificate Date</label>
          <input type="date" name="date" value={data.date} onChange={handleInputChange} />
        </div>
      </div>
      <div className="grid-2">
        <div className="form-group">
          <label>Start Date</label>
          <input type="date" name="startDate" value={data.startDate} onChange={handleInputChange} />
        </div>
        <div className="form-group">
          <label>Rest Days</label>
          <input type="number" name="restDays" value={data.restDays} onChange={handleInputChange} min="1" max="90" />
        </div>
      </div>
      <div className="form-group">
          <label>Auto-calculated End Date</label>
          <input type="date" name="endDate" value={data.endDate} readOnly style={{backgroundColor: '#e9ecef'}} />
      </div>

      <h2 className="section-title">Additional Instructions</h2>
      <div className="form-group">
        <textarea name="instructions" value={data.instructions} onChange={handleInputChange} rows="3" placeholder="Dietary restrictions, medicine schedule, etc."></textarea>
      </div>

      <h2 className="section-title">Signatures & Stamps</h2>
      <div className="grid-2">
        <div className="form-group">
          <label>Signature Upload (Transparent PNG recommended)</label>
          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'signatureImage')} />
          {data.signatureImage && <div style={{marginTop: '5px', fontSize: '0.8rem', color: 'green'}}>Signature loaded.</div>}
        </div>
        <div className="form-group">
          <label>Stamp Upload (Transparent PNG recommended)</label>
          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'stampImage')} />
          {data.stampImage && <div style={{marginTop: '5px', fontSize: '0.8rem', color: 'green'}}>Stamp loaded.</div>}
        </div>
      </div>

      <h2 className="section-title">Patient Email</h2>
      <div className="form-group">
        <label>Email Address</label>
        <input type="email" name="patientEmail" value={data.patientEmail} onChange={handleInputChange} placeholder="patient@example.com" />
      </div>

      <div className="actions">
        <button type="button" className="btn-primary" onClick={onDownload} disabled={isProcessing}>
          <Eye size={18} /> {isProcessing ? 'Processing...' : 'Preview & Download'}
        </button>
        <button type="button" className="btn-success" onClick={onEmail} disabled={isProcessing || !data.patientEmail}>
          <Mail size={18} /> Send Email
        </button>
      </div>
    </form>
  );
};

export default Form;
