import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { format } from 'date-fns';
import { MapPin } from 'lucide-react'; // Optional, or just use simple styling

const DefaultLogo = () => (
  <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="35" y="10" width="30" height="80" fill="black" />
    <rect x="10" y="35" width="80" height="30" fill="black" />
  </svg>
);

const numberToWords = (num) => {
  const n = parseInt(num, 10);
  if (isNaN(n)) return '';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (n === 0) return 'Zero';
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
  return n.toString();
};

const CertificatePreview = React.forwardRef(({ data }, ref) => {
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (data.certificateId && barcodeRef.current) {
      JsBarcode(barcodeRef.current, data.certificateId, {
        format: "CODE128",
        width: 1,
        height: 25,
        displayValue: true,
        fontSize: 10,
        margin: 0,
        lineColor: "#000000"
      });
    }
  }, [data.certificateId]);

  const prefix = data.patientTitle || '';
  const currentDateFormatted = data.date ? format(new Date(data.date), 'dd MMM yyyy') : '';
  const startDateFormatted = data.startDate ? format(new Date(data.startDate), 'dd MMM yyyy') : '';
  const restDaysWord = numberToWords(data.restDays);

  return (
    <div className="certificate-print" ref={ref} id="certificate-print">
      {/* Header section */}
      <div className="cert-header-row">
        <div className="cert-logo-container">
          {data.clinicLogo ? (
            <img src={data.clinicLogo} alt="Clinic Logo" className="cert-logo" />
          ) : (
            <DefaultLogo />
          )}
        </div>
        <div className="cert-clinic-info">
          <div className="cert-dept-name">{data.departmentName || 'HEALTH AND FAMILY WELFARE DEPARTMENT'}</div>
          <div className="cert-clinic-name">{data.clinicName || 'COMMUNITY HEALTH CENTRE, BAROH'}</div>
          <div className="cert-clinic-address">
            {data.clinicAddress || 'TEH. BAROH, DISTT, KANGRA (H.P)'}
          </div>
        </div>
      </div>

      <hr className="cert-divider" />

      {/* Body Wrapper */}
      <div className="cert-body-wrapper">
        {/* Title */}
        <div className="cert-title">MEDICAL CERTIFICATE</div>

        {/* Date */}
        <div className="cert-date-row">
          Date: <span className="cert-underline">............ {currentDateFormatted || '[Date]'} ............</span>
        </div>

        {/* Patient Info */}
        <table className="cert-info-table">
          <tbody>
            <tr>
              <td className="col-label">Name</td>
              <td className="col-colon">:</td>
              <td className="col-value">{prefix} {data.patientName || '[Patient Name]'}</td>
            </tr>
            <tr>
              <td className="col-label">Age</td>
              <td className="col-colon">:</td>
              <td className="col-value">{data.age ? `${data.age} Years` : '[Age]'}</td>
            </tr>
            <tr>
              <td className="col-label">Gender</td>
              <td className="col-colon">:</td>
              <td className="col-value">{data.gender || '[Gender]'}</td>
            </tr>
            <tr>
              <td className="col-label">Address</td>
              <td className="col-colon">:</td>
              <td className="col-value">{data.patientAddress || '[Address]'}</td>
            </tr>
          </tbody>
        </table>

        <hr className="cert-divider" />

        {/* Diagnosis Info */}
        <div className="cert-diagnosis-section">
          <div className="col-label">Diagnosis :</div>
          <div className="col-value diagnosis-text">{data.diagnosis || '[Diagnosis]'}</div>
        </div>
        
        <div className="cert-rest-section">
          <span className="col-label">Recommended Rest Period :</span>
          <span className="col-value" style={{ marginLeft: '10px' }}>{data.restDays || '[X]'} ({restDaysWord}) Days</span>
        </div>

        <hr className="cert-divider" />

        {/* Statement */}
        <div className="cert-paragraph">
          This is to certify that {prefix} {data.patientName || '[Patient Name]'}, aged {data.age || '[Age]'} years, was examined on {currentDateFormatted || '[Date]'} and diagnosed with {data.diagnosis || '[Diagnosis]'}.
        </div>

        <div className="cert-paragraph">
          The patient is advised to take rest for {data.restDays || '[X]'} ({restDaysWord}) days from {startDateFormatted || '[Start Date]'}.
        </div>

        <div className="cert-instructions-title">
          Instructions/Recommendations :
        </div>
        <div className="cert-paragraph">
          {data.instructions || 'Take plenty of rest, drink fluids, and follow the prescribed medication.'}
        </div>
      </div>

      {/* Footer */}
      <div className="cert-footer">
        <div className="cert-stamp-left">
          {data.stampImage && <img src={data.stampImage} alt="Stamp" style={{ transform: 'rotate(-70deg)' }} className="cert-stamp" />}
        </div>

        <div className="cert-doctor-section">
          <div className="cert-signature-box">
            {data.signatureImage && <img src={data.signatureImage} alt="Signature" />}
            {data.stampImage && <img src={data.stampImage} alt="Stamp" className="cert-stamp-overlay" />}
          </div>
          <hr className="cert-sign-line" style={{ borderTop: '1px solid black', width: '100%', margin: '5px 0' }} />
          <div className="cert-doctor-name" style={{ textAlign: 'center' }}>Doctor's Signature</div>
        </div>
      </div>

      {/* Bottom section pushes to the end of the A4 page */}
      <div style={{ marginTop: 'auto' }}>
        <div className="cert-barcode-section">
          <svg ref={barcodeRef}></svg>
        </div>

        {/* Bottom Note */}
        <div className="cert-bottom-note">
          <div>This certificate is valid only for the period mentioned above. Any extension requires re-evaluation by the attending physician.</div>
          <div>This is a computer-generated document.</div>
        </div>
      </div>
    </div>
  );
});

export default CertificatePreview;
