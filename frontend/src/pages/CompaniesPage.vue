<template>
  <div class="page-grid two-columns">
    <section class="panel">
      <div class="section-heading">
        <div>
          <h2>Companies</h2>
          <p class="muted">Register suppliers before creating analyses.</p>
        </div>
      </div>

      <p v-if="message" class="success-banner">{{ message }}</p>
      <p v-if="errorMessage" class="error-banner">{{ errorMessage }}</p>

      <CompanyForm :loading="submitting" @submit="handleCreateCompany" />
    </section>

    <section class="panel">
      <div class="section-heading">
        <div>
          <h2>Registered companies</h2>
          <p class="muted">Simple list from the backend API.</p>
        </div>
        <button class="button secondary" type="button" @click="loadCompanies">
          Refresh
        </button>
      </div>

      <div v-if="loading" class="empty-state">Loading companies...</div>
      <div v-else-if="companies.length === 0" class="empty-state">
        No companies created yet.
      </div>

      <div v-else class="stack-md">
        <article v-for="company in companies" :key="company.id" class="list-card">
          <div class="card-header">
            <div>
              <h3>{{ company.legalName }}</h3>
              <p class="muted">
                {{ company.tradeName || 'No trade name' }} ·
                {{ company.registrationNumber }}
              </p>
            </div>
            <span class="tag">{{ company.country || 'No country' }}</span>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

import CompanyForm from '@/components/CompanyForm.vue';
import { createCompany, fetchCompanies } from '@/services/companies';
import type { Company } from '@/types/models';

const companies = ref<Company[]>([]);
const loading = ref(false);
const submitting = ref(false);
const message = ref('');
const errorMessage = ref('');

onMounted(() => {
  loadCompanies();
});

async function loadCompanies() {
  try {
    loading.value = true;
    errorMessage.value = '';
    companies.value = await fetchCompanies();
  } catch (error) {
    errorMessage.value = getErrorMessage(error, 'Unable to load companies.');
  } finally {
    loading.value = false;
  }
}

async function handleCreateCompany(payload: {
  legalName: string;
  tradeName?: string;
  registrationNumber: string;
  country?: string;
}) {
  try {
    submitting.value = true;
    errorMessage.value = '';
    message.value = '';
    await createCompany(payload);
    message.value = 'Company created successfully.';
    await loadCompanies();
  } catch (error) {
    errorMessage.value = getErrorMessage(error, 'Unable to create company.');
  } finally {
    submitting.value = false;
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  const maybeAxiosError = error as {
    response?: { data?: { message?: string | string[] } };
  };
  const message = maybeAxiosError.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  return message ?? fallback;
}
</script>
