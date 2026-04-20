<template>
  <form class="stack-md" @submit.prevent="handleSubmit">
    <div class="field">
      <label for="companyId">Empresa</label>
      <select id="companyId" v-model.number="selectedCompanyId" :disabled="loading" required>
        <option disabled value="0">Selecione uma empresa</option>
        <option v-for="company in companies" :key="company.id" :value="company.id">
          {{ company.legalName }} ({{ company.registrationNumber }})
        </option>
      </select>
      <small class="field-help">Escolha a empresa que será avaliada nesta análise.</small>
    </div>

    <AppButton
      label="Criar análise e seguir"
      :disabled="companies.length === 0"
      :loading="loading"
      loading-label="Criando análise..."
      type="submit"
    />
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import type { Company } from '@/shared/types/models';
import AppButton from '@/shared/ui/AppButton.vue';

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
