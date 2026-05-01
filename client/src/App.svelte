<script>
  import { onMount, tick } from 'svelte';
  import axios from 'axios';
  import { toPng } from 'html-to-image';
  import { jsPDF } from 'jspdf';
  import { Moon, Sun, Download, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-svelte';
  
  import Form from './components/Form.svelte';
  import CertificatePreview from './components/CertificatePreview.svelte';

  // State Management
  let isDarkMode = false;
  let isProcessing = false;
  
  let showPasskeyModal = false;
  let passkeyInput = '';
  let pendingAction = null;
  
  let pdfBlob = null;
  let previewPdfUrl = '';
  let showFinalPreview = false;

  let toasts = [];

  // Data Store
  let data = {
    certificateId: '',
    departmentName: '',
    clinicName: '',
    clinicAddress: '',
    clinicLogo: null,
    patientName: '',
    patientTitle: 'Mr.',
    age: '',
    gender: '',
    patientAddress: '',
    diagnosis: '',
    date: new Date().toISOString().split('T')[0],
    startDate: new Date().toISOString().split('T')[0],
    restDays: '',
    endDate: '',
    instructions: '',
    signatureImage: null,
    stampImage: null,
    patientEmail: ''
  };

  // Fit Engine logic
  const A4_WIDTH = 794;
  const A4_HEIGHT = 1123;
  let previewScale = 1;
  let previewOuterRef;
  let certificateRef;
  let formRef;

  function generateCertId() {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `MC-${year}-${randomNum}`;
  }

  function showToast(message, type = 'info') {
    const id = Date.now();
    toasts = [...toasts, { id, message, type }];
    setTimeout(() => {
      toasts = toasts.filter(t => t.id !== id);
    }, 3000);
  }

  onMount(() => {
    // Theme setup
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      isDarkMode = true;
      document.documentElement.classList.add('dark');
    }

    // Load saved data
    const savedData = localStorage.getItem('medCertData_v2');
    if (savedData) {
      data = { ...data, ...JSON.parse(savedData), certificateId: generateCertId() };
    } else {
      data.certificateId = generateCertId();
    }

    // Fit Engine
    if (previewOuterRef) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const containerWidth = entry.contentRect.width;
          const containerHeight = entry.contentRect.height;
          
          const scaleByWidth = (containerWidth / A4_WIDTH) * 0.95;
          const scaleByHeight = (containerHeight / A4_HEIGHT) * 0.95;
          
          previewScale = Math.min(scaleByWidth, scaleByHeight, 1.0);
        }
      });
      resizeObserver.observe(previewOuterRef);
      return () => resizeObserver.disconnect();
    }
  });

  // Watch and save data automatically
  $: {
    if (data.clinicName || data.clinicAddress) {
      const dataToSave = {
        departmentName: data.departmentName,
        clinicName: data.clinicName,
        clinicAddress: data.clinicAddress,
        clinicLogo: data.clinicLogo,
        signatureImage: data.signatureImage,
        stampImage: data.stampImage
      };
      localStorage.setItem('medCertData_v2', JSON.stringify(dataToSave));
    }
  }

  function toggleTheme() {
    isDarkMode = !isDarkMode;
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  function validateForm() {
    if (!data.patientName || !data.diagnosis || !data.restDays) {
      showToast('Please fill all required patient and medical fields.', 'error');
      if (formRef) formRef.scrollIntoView({ behavior: 'smooth' });
      return false;
    }
    return true;
  }

  async function generatePDFBlob() {
    // Note: since the watermark is an overlay outside this element, it will be naturally excluded!
    const node = document.querySelector('.certificate-print');
    if (!node) return null;
    
    try {
      const dataUrl = await toPng(node, {
        quality: 1.0,
        pixelRatio: 2,
        width: A4_WIDTH,
        height: A4_HEIGHT,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [A4_WIDTH, A4_HEIGHT]
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, A4_WIDTH, A4_HEIGHT);
      return pdf.output('blob');
    } catch (e) {
      console.error(e);
      throw new Error("Failed to generate PDF");
    }
  }

  function handlePreviewAndDownload() {
    if (!validateForm()) return;
    pendingAction = 'download';
    showPasskeyModal = true;
  }

  function handleEmail() {
    if (!validateForm()) return;
    if (!data.patientEmail) {
      showToast('Please enter a patient email address first.', 'error');
      return;
    }
    pendingAction = 'email';
    showPasskeyModal = true;
  }

  async function executeDownload() {
    isProcessing = true;
    try {
      showPasskeyModal = false;
      passkeyInput = '';
      
      const blob = await generatePDFBlob();
      if (!blob) throw new Error("Could not generate PDF");

      pdfBlob = blob;
      previewPdfUrl = URL.createObjectURL(blob);
      showFinalPreview = true;
      
      data.certificateId = generateCertId();
    } catch (error) {
      showToast(error.message || 'Error generating PDF', 'error');
    } finally {
      isProcessing = false;
    }
  }

  async function executeEmail() {
    isProcessing = true;
    try {
      const blob = await generatePDFBlob();
      const base64data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
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
        showPasskeyModal = false;
        passkeyInput = '';
        data.certificateId = generateCertId();
      }
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to send email. Invalid passkey?', 'error');
    } finally {
      isProcessing = false;
    }
  }

  function handlePasskeySubmit() {
    if (!passkeyInput.trim()) {
      showToast('Please enter the passkey.', 'error');
      return;
    }
    
    if (passkeyInput.trim() !== 'CERTificate') {
      showToast('Invalid Passkey.', 'error');
      return;
    }

    if (pendingAction === 'download') executeDownload();
    else if (pendingAction === 'email') executeEmail();
  }

  function downloadActualPdf() {
    if (!previewPdfUrl) return;
    const link = document.createElement('a');
    link.href = previewPdfUrl;
    link.download = `Medical_Certificate_${data.patientName.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
</script>

<main class="min-h-screen flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden bg-premium-50 dark:bg-premium-950 font-sans selection:bg-blue-500/30">
  
  <!-- Left Side: Form Section -->
  <div class="flex-1 lg:max-w-3xl overflow-y-auto p-6 md:p-10 scrollbar-hide relative z-10">
    <div class="max-w-2xl mx-auto pb-20">
      
      <!-- Header -->
      <header class="flex justify-between items-center mb-10 pb-6 border-b border-premium-200 dark:border-premium-800">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-premium-900 dark:text-white flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <FileText size={20} />
            </div>
            Medicerfy
          </h1>
          <p class="text-premium-800/60 dark:text-premium-100/60 mt-2 text-sm font-medium">Professional Certificate Engine</p>
        </div>
        
        <button on:click={toggleTheme} class="w-12 h-12 rounded-full flex items-center justify-center bg-white dark:bg-premium-900 shadow-soft hover:shadow-glass hover:scale-110 active:scale-95 transition-all text-premium-800 dark:text-premium-100 border border-premium-200 dark:border-premium-800">
          {#if isDarkMode}
            <Moon size={20} />
          {:else}
            <Sun size={20} />
          {/if}
        </button>
      </header>

      <Form 
        bind:data 
        {isProcessing} 
        onDownload={handlePreviewAndDownload} 
        onEmail={handleEmail} 
        bind:formRef 
      />
    </div>
  </div>

  <!-- Right Side: Sticky Preview -->
  <div class="flex-1 bg-slate-200/50 dark:bg-black/20 lg:border-l border-premium-200 dark:border-premium-800 flex flex-col relative h-[65vh] lg:h-full overflow-hidden">
    <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] dark:opacity-[0.05] pointer-events-none"></div>
    
    <div class="flex-1 w-full h-full flex items-center justify-center p-8 overflow-hidden z-10" bind:this={previewOuterRef}>
      <div style="transform: scale({previewScale}); transform-origin: center center; width: {A4_WIDTH}px; height: {A4_HEIGHT}px; flex-shrink: 0; position: relative;">
        <!-- Using svelte:component is overkill, we just render directly -->
        <CertificatePreview bind:this={certificateRef} {data} />
        
        <!-- Watermark Overlay (Will not be captured in PDF because it sits outside the CertificatePreview component conceptually, wait, html-to-image queries '.certificate-print', so it's perfectly safe) -->
        <div class="watermark-overlay absolute inset-0 pointer-events-none z-50"></div>
      </div>
    </div>
  </div>
</main>

<!-- Security Passkey Modal -->
{#if showPasskeyModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-premium-900/40 backdrop-blur-sm transition-opacity" on:click={() => showPasskeyModal = false}></div>
    <div class="bg-white dark:bg-premium-900 rounded-3xl p-8 max-w-sm w-full relative z-10 shadow-2xl border border-white/20 dark:border-white/5 transform transition-all scale-100">
      <div class="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 text-blue-500 rounded-2xl flex items-center justify-center mb-6">
        <AlertCircle size={24} />
      </div>
      <h3 class="text-xl font-bold mb-2">Security Check</h3>
      <p class="text-sm opacity-70 mb-6">Please enter your admin passkey to authorize this action.</p>
      
      <input 
        type="password" 
        bind:value={passkeyInput} 
        placeholder="Enter Passkey" 
        class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl mb-6 text-center tracking-widest font-mono text-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        autofocus
        on:keydown={(e) => e.key === 'Enter' && handlePasskeySubmit()}
      />
      
      <div class="flex gap-3">
        <button class="flex-1 py-3 rounded-xl font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" on:click={() => showPasskeyModal = false}>Cancel</button>
        <button class="flex-1 py-3 rounded-xl font-medium bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20 transition-transform active:scale-95" on:click={handlePasskeySubmit}>Authorize</button>
      </div>
    </div>
  </div>
{/if}

<!-- Final PDF Preview Modal -->
{#if showFinalPreview}
  <div class="fixed inset-0 z-50 flex flex-col p-4 md:p-8">
    <div class="absolute inset-0 bg-premium-900/80 backdrop-blur-xl" on:click={() => showFinalPreview = false}></div>
    
    <div class="relative z-10 w-full max-w-5xl mx-auto flex-1 flex flex-col bg-premium-100 dark:bg-premium-900 rounded-3xl shadow-2xl overflow-hidden border border-white/10">
      <div class="flex justify-between items-center p-4 border-b border-premium-200 dark:border-premium-800 bg-white dark:bg-premium-950">
        <h3 class="font-bold text-lg flex items-center gap-2">
          <CheckCircle class="text-teal-500" size={20} /> PDF Generated Successfully
        </h3>
        <div class="flex items-center gap-4">
          <button class="flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20" on:click={downloadActualPdf}>
            <Download size={18} /> Download PDF
          </button>
          <button class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" on:click={() => showFinalPreview = false}>
            <XCircle size={24} class="opacity-70" />
          </button>
        </div>
      </div>
      
      <div class="flex-1 p-4 md:p-8 overflow-auto bg-slate-200/50 dark:bg-black/20 flex justify-center">
        <iframe src={previewPdfUrl} class="w-full max-w-[794px] h-full min-h-[1123px] bg-white shadow-2xl" title="PDF Preview"></iframe>
      </div>
    </div>
  </div>
{/if}

<!-- Toasts -->
<div class="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
  {#each toasts as toast (toast.id)}
    <div class="flex items-center gap-3 px-5 py-3.5 bg-white dark:bg-slate-800 shadow-xl rounded-xl border-l-4 {toast.type === 'error' ? 'border-red-500' : 'border-teal-500'} animate-slideIn">
      {#if toast.type === 'error'}
        <XCircle class="text-red-500" size={18} />
      {:else}
        <CheckCircle class="text-teal-500" size={18} />
      {/if}
      <span class="font-medium text-sm">{toast.message}</span>
    </div>
  {/each}
</div>

<style>
  :global(.scrollbar-hide::-webkit-scrollbar) {
    display: none;
  }
  :global(.scrollbar-hide) {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(20px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .animate-slideIn {
    animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
</style>
