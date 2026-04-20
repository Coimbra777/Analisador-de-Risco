<template>
  <form class="stack-md" @submit.prevent="handleSubmit">
    <div class="field">
      <label for="companyId">Company</label>
      <select id="companyId" v-model.number="selectedCompanyId" required>
        <option disabled value="0">Select a company</option>
        <option v-for="company in companies" :key="company.id" :value="company.id">
          {{ company.legalName }} ({{ company.registrationNumber }})
        </option>
      </select>
    </div>

    <button class="button" :disabled="loading || companies.length === 0" type="submit">
      {{ loading ? 'Creating...' : 'Create analysis' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import type { Company } from '@/types/models';

defineProps<{
  companies: Company[];
  loading: boolean;
}>();

const emit = defineEmits<{
  submit: [payload: { companyId: number }];
}>();

const selectedCompanyId = ref(0);

function handleSubmit() {
  if (!selectedCompanyId.value) {
    return;
  }

  emit('submit', { companyId: selectedCompanyId.value });
  selectedCompanyId.value = 0;
}
</script>
