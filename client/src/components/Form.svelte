<script>
  import { addDays, format } from 'date-fns';
  import { Eye, Mail, Upload } from 'lucide-svelte';
  
  export let data;
  export let isProcessing = false;
  export let onDownload;
  export let onEmail;
  export let formRef;

  const commonDiagnoses = [
    'Viral Fever',
    'Acute Gastroenteritis',
    'Upper Respiratory Tract Infection',
    'Migraine',
    'Lower Back Pain'
  ];

  let isCustomDiagnosis = false;

  function handleInputChange(e) {
    const { name, value } = e.target;
    data[name] = value;
    
    if (name === 'restDays' || name === 'startDate') {
      const days = parseInt(name === 'restDays' ? value : data.restDays, 10);
      const start = new Date(name === 'startDate' ? value : data.startDate);
      
      if (!isNaN(days) && start.toString() !== 'Invalid Date') {
        const end = addDays(start, Math.max(0, days - 1));
        data.endDate = format(end, 'yyyy-MM-dd');
      }
    }
  }

  function handleImageUpload(e, field) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        data[field] = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }
</script>

<form bind:this={formRef} class="space-y-10" on:submit|preventDefault>
  
  <!-- Clinic Details Section -->
  <section class="glass-panel p-6 rounded-2xl border border-white/20 dark:border-white/5 shadow-glass dark:shadow-glass-dark bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl transition-all">
    <h2 class="text-xl font-semibold mb-6 flex items-center gap-2">
      <span class="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-sm">1</span>
      Clinic Details
    </h2>
    
    <div class="space-y-5">
      <div class="form-group">
        <label class="block text-sm font-medium mb-1.5 opacity-80" for="departmentName">Department Name</label>
        <input id="departmentName" type="text" name="departmentName" bind:value={data.departmentName} on:input={handleInputChange} placeholder="e.g. Department of General Medicine" class="input-premium" />
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div class="form-group">
          <label class="block text-sm font-medium mb-1.5 opacity-80" for="clinicName">Clinic/Hospital Name</label>
          <input id="clinicName" type="text" name="clinicName" bind:value={data.clinicName} on:input={handleInputChange} placeholder="e.g. City Hospital, Bangalore" class="input-premium" />
        </div>
        <div class="form-group">
          <label class="block text-sm font-medium mb-1.5 opacity-80" for="clinicAddress">Clinic Address</label>
          <textarea id="clinicAddress" name="clinicAddress" bind:value={data.clinicAddress} on:input={handleInputChange} rows="2" placeholder="e.g. 123 Healthcare Ave, Koramangala, Bangalore 560034" class="input-premium resize-none"></textarea>
        </div>
      </div>
      
      <div class="form-group">
        <label class="block text-sm font-medium mb-1.5 opacity-80" for="clinicLogo">Clinic Logo (Optional)</label>
        <div class="relative flex items-center gap-4">
          <label class="cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 font-medium text-sm">
            <Upload size={16} /> Choose File
            <input id="clinicLogo" type="file" accept="image/*" on:change={(e) => handleImageUpload(e, 'clinicLogo')} class="hidden" />
          </label>
          {#if data.clinicLogo}
            <span class="text-sm text-emerald-500 font-medium">✓ Logo loaded</span>
          {:else}
            <span class="text-sm opacity-50">No file chosen</span>
          {/if}
        </div>
      </div>
    </div>
  </section>

  <!-- Patient Details Section -->
  <section class="glass-panel p-6 rounded-2xl border border-white/20 dark:border-white/5 shadow-glass dark:shadow-glass-dark bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl transition-all">
    <h2 class="text-xl font-semibold mb-6 flex items-center gap-2">
      <span class="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-sm">2</span>
      Patient Details
    </h2>
    
    <div class="space-y-5">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div class="form-group">
          <label class="block text-sm font-medium mb-1.5 opacity-80" for="patientName">Patient Name</label>
          <div class="flex gap-2">
            <select name="patientTitle" bind:value={data.patientTitle} on:change={handleInputChange} class="input-premium w-24 flex-shrink-0">
              <option value="Mr.">Mr.</option>
              <option value="Ms.">Ms.</option>
              <option value="Mrs.">Mrs.</option>
              <option value="Miss">Miss</option>
              <option value="Master">Master</option>
            </select>
            <input id="patientName" type="text" name="patientName" bind:value={data.patientName} on:input={handleInputChange} class="input-premium flex-1" />
          </div>
        </div>
        <div class="form-group">
          <label class="block text-sm font-medium mb-1.5 opacity-80" for="age">Age</label>
          <input id="age" type="number" name="age" bind:value={data.age} on:input={handleInputChange} min="1" max="150" class="input-premium" />
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div class="form-group">
          <label class="block text-sm font-medium mb-1.5 opacity-80" for="gender">Gender</label>
          <select id="gender" name="gender" bind:value={data.gender} on:change={handleInputChange} class="input-premium">
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div class="form-group">
          <label class="block text-sm font-medium mb-1.5 opacity-80" for="patientAddress">Patient Address</label>
          <textarea id="patientAddress" name="patientAddress" bind:value={data.patientAddress} on:input={handleInputChange} rows="2" class="input-premium resize-none"></textarea>
        </div>
      </div>
    </div>
  </section>

  <!-- Medical Details Section -->
  <section class="glass-panel p-6 rounded-2xl border border-white/20 dark:border-white/5 shadow-glass dark:shadow-glass-dark bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl transition-all">
    <h2 class="text-xl font-semibold mb-6 flex items-center gap-2">
      <span class="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-sm">3</span>
      Medical Details
    </h2>
    
    <div class="space-y-5">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div class="form-group">
          <label class="block text-sm font-medium mb-1.5 opacity-80" for="diagnosis">Diagnosis</label>
          {#if !isCustomDiagnosis}
            <select id="diagnosis" name="diagnosis" bind:value={data.diagnosis} on:change={(e) => {
              if (e.target.value === 'custom') {
                isCustomDiagnosis = true;
                data.diagnosis = '';
              } else {
                handleInputChange(e);
              }
            }} class="input-premium">
              <option value="">Select Diagnosis...</option>
              {#each commonDiagnoses as d}
                <option value={d}>{d}</option>
              {/each}
              <option value="custom">-- Custom Diagnosis --</option>
            </select>
          {:else}
            <div class="flex gap-2">
              <input type="text" name="diagnosis" bind:value={data.diagnosis} on:input={handleInputChange} placeholder="Enter custom diagnosis" class="input-premium flex-1" />
              <button type="button" on:click={() => isCustomDiagnosis = false} class="px-4 bg-slate-200 dark:bg-slate-800 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors text-sm font-medium">List</button>
            </div>
          {/if}
        </div>
        <div class="form-group">
          <label class="block text-sm font-medium mb-1.5 opacity-80" for="date">Certificate Date</label>
          <input id="date" type="date" name="date" bind:value={data.date} on:input={handleInputChange} class="input-premium" />
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div class="form-group">
          <label class="block text-sm font-medium mb-1.5 opacity-80" for="startDate">Start Date</label>
          <input id="startDate" type="date" name="startDate" bind:value={data.startDate} on:input={handleInputChange} class="input-premium" />
        </div>
        <div class="form-group">
          <label class="block text-sm font-medium mb-1.5 opacity-80" for="restDays">Rest Days</label>
          <input id="restDays" type="number" name="restDays" bind:value={data.restDays} on:input={handleInputChange} min="1" max="90" class="input-premium" />
        </div>
      </div>
      
      <div class="form-group">
        <label class="block text-sm font-medium mb-1.5 opacity-80" for="endDate">Auto-calculated End Date</label>
        <input id="endDate" type="date" name="endDate" bind:value={data.endDate} readonly class="input-premium opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800" />
      </div>
      
      <div class="form-group pt-2">
        <label class="block text-sm font-medium mb-1.5 opacity-80" for="instructions">Additional Instructions</label>
        <textarea id="instructions" name="instructions" bind:value={data.instructions} on:input={handleInputChange} rows="3" placeholder="Dietary restrictions, medicine schedule, etc." class="input-premium resize-none"></textarea>
      </div>
    </div>
  </section>

  <!-- Signatures & Security -->
  <section class="glass-panel p-6 rounded-2xl border border-white/20 dark:border-white/5 shadow-glass dark:shadow-glass-dark bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl transition-all">
    <h2 class="text-xl font-semibold mb-6 flex items-center gap-2">
      <span class="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-sm">4</span>
      Signatures & Delivery
    </h2>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
      <div class="form-group">
        <label class="block text-sm font-medium mb-1.5 opacity-80" for="signatureImage">Signature Upload</label>
        <div class="relative flex items-center gap-4">
          <label class="cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 font-medium text-sm w-full">
            <Upload size={16} /> Signature PNG
            <input id="signatureImage" type="file" accept="image/*" on:change={(e) => handleImageUpload(e, 'signatureImage')} class="hidden" />
          </label>
        </div>
        {#if data.signatureImage}
          <div class="mt-2 text-sm text-emerald-500 font-medium">✓ Loaded</div>
        {/if}
      </div>
      <div class="form-group">
        <label class="block text-sm font-medium mb-1.5 opacity-80" for="stampImage">Stamp Upload</label>
        <div class="relative flex items-center gap-4">
          <label class="cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 font-medium text-sm w-full">
            <Upload size={16} /> Stamp PNG
            <input id="stampImage" type="file" accept="image/*" on:change={(e) => handleImageUpload(e, 'stampImage')} class="hidden" />
          </label>
        </div>
        {#if data.stampImage}
          <div class="mt-2 text-sm text-emerald-500 font-medium">✓ Loaded</div>
        {/if}
      </div>
    </div>
    
    <div class="form-group border-t border-slate-200 dark:border-slate-700 pt-6">
      <label class="block text-sm font-medium mb-1.5 opacity-80" for="patientEmail">Patient Email</label>
      <input id="patientEmail" type="email" name="patientEmail" bind:value={data.patientEmail} on:input={handleInputChange} placeholder="patient@example.com" class="input-premium" />
    </div>
  </section>

  <!-- Actions -->
  <div class="flex flex-col sm:flex-row gap-4 pt-4 sticky bottom-6 z-20">
    <button type="button" on:click={onDownload} disabled={isProcessing} class="flex-1 btn-primary shadow-xl shadow-blue-500/20 backdrop-blur-md">
      <Eye size={18} /> {isProcessing ? 'Processing...' : 'Preview & Download'}
    </button>
    <button type="button" on:click={onEmail} disabled={isProcessing || !data.patientEmail} class="flex-1 btn-success shadow-xl shadow-teal-500/20 backdrop-blur-md">
      <Mail size={18} /> Send Secure Email
    </button>
  </div>
</form>


