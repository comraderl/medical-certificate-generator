<script>
  import { onMount } from 'svelte';
  import JsBarcode from 'jsbarcode';

  export let data = {};
  
  let barcodeNode;

  // Svelte reactivity for barcode
  $: if (barcodeNode && data.certificateId) {
    JsBarcode(barcodeNode, data.certificateId, {
      format: "CODE128",
      lineColor: "#000",
      width: 1.5,
      height: 40,
      displayValue: true,
      fontSize: 14,
      margin: 0
    });
  }
</script>

<div class="certificate-print mx-auto relative shadow-2xl flex flex-col justify-between">
  <!-- Header -->
  <div class="text-center mb-8 border-b-2 border-black pb-4">
    <h2 class="text-xl font-bold uppercase tracking-wider mb-2">{data.departmentName || '[Department Name]'}</h2>
    <h1 class="text-2xl font-black uppercase tracking-widest">{data.clinicName || '[Clinic/Hospital Name]'}</h1>
    <p class="text-sm mt-2">{data.clinicAddress || '[Clinic Address]'}</p>
  </div>

  {#if data.clinicLogo}
    <img src={data.clinicLogo} alt="Clinic Logo" class="absolute top-12 left-16 w-24 h-24 object-contain opacity-80" />
  {/if}

  <div class="text-center font-bold text-2xl tracking-[0.2em] mb-8 underline underline-offset-4">
    MEDICAL CERTIFICATE
  </div>

  <div class="flex justify-between items-start mb-10 text-sm">
    <div class="w-1/2">
      <div class="grid grid-cols-[100px_auto] gap-2 mb-2">
        <span class="font-bold">Name</span>
        <span>: {data.patientTitle || 'Mr.'} {data.patientName || '[Patient Name]'}</span>
      </div>
      <div class="grid grid-cols-[100px_auto] gap-2 mb-2">
        <span class="font-bold">Age</span>
        <span>: {data.age || '[Age]'}</span>
      </div>
      <div class="grid grid-cols-[100px_auto] gap-2 mb-2">
        <span class="font-bold">Gender</span>
        <span>: {data.gender || '[Gender]'}</span>
      </div>
      <div class="grid grid-cols-[100px_auto] gap-2">
        <span class="font-bold">Address</span>
        <span>: {data.patientAddress || '[Address]'}</span>
      </div>
    </div>
    <div class="text-right flex flex-col items-end gap-4">
      <div>
        <span class="mr-2">Date:</span>
        <span class="border-b border-black border-dashed pb-1 min-w-[120px] inline-block text-center">
          {data.date || '[Date]'}
        </span>
      </div>
      <!-- Barcode -->
      <div class="mt-2">
        <svg bind:this={barcodeNode}></svg>
      </div>
    </div>
  </div>

  <div class="border-t-2 border-b-2 border-black py-4 mb-8">
    <div class="font-bold mb-2 text-lg">Diagnosis :</div>
    <div class="mb-4 text-lg italic">{data.diagnosis || '[Diagnosis]'}</div>
    <div class="font-bold text-lg">Recommended Rest Period : <span class="border-b border-black px-4">{data.restDays || '[X]'}</span> Days</div>
  </div>

  <div class="flex-grow text-justify leading-relaxed text-base mb-8">
    <p class="mb-4">
      This is to certify that {data.patientTitle || 'Mr.'} <strong>{data.patientName || '[Patient Name]'}</strong>, aged {data.age || '[Age]'} years, was examined on <strong>{data.date || '[Date]'}</strong> and diagnosed with <strong>{data.diagnosis || '[Diagnosis]'}</strong>.
    </p>
    <p class="mb-6">
      The patient is advised to take rest for <strong>{data.restDays || '[X]'}</strong> days from <strong>{data.startDate || '[Start Date]'}</strong> to <strong>{data.endDate || '[End Date]'}</strong>.
    </p>
    <div class="font-bold mb-2">Instructions/Recommendations :</div>
    <p class="whitespace-pre-line">{data.instructions || 'Take plenty of rest, drink fluids, and follow the prescribed medication.'}</p>
  </div>

  <!-- Footer -->
  <div class="flex justify-between items-end mt-12 pt-8 relative">
    <div class="w-1/3 text-center">
      {#if data.stampImage}
        <img src={data.stampImage} alt="Official Stamp" class="h-24 object-contain mx-auto mb-2 opacity-80" />
      {:else}
        <div class="h-24 flex items-center justify-center border-2 border-dashed border-gray-300 text-gray-400 mb-2 rounded-full w-24 mx-auto">
          Stamp
        </div>
      {/if}
      <div class="border-t border-black pt-1 font-bold text-sm">Official Stamp</div>
    </div>

    <div class="w-1/3 text-center">
      {#if data.signatureImage}
        <img src={data.signatureImage} alt="Doctor Signature" class="h-16 object-contain mx-auto mb-2" />
      {:else}
        <div class="h-16 mb-2"></div>
      {/if}
      <div class="border-t border-black pt-1 font-bold text-sm">Doctor's Signature</div>
    </div>
  </div>
</div>
