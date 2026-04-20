<template>
  <div class="page-grid two-columns">
    <section class="panel">
      <div class="section-heading">
        <div>
          <h2>Empresas</h2>
          <p class="muted">Cadastre fornecedores antes de criar análises.</p>
        </div>
      </div>

      <p v-if="message" class="success-banner">{{ message }}</p>
      <p v-if="errorMessage" class="error-banner">{{ errorMessage }}</p>

      <CompanyForm :loading="submitting" @submit="handleCreateCompany" />
    </section>

    <section class="panel">
      <div class="section-heading">
        <div>
          <h2>Empresas cadastradas</h2>
          <p class="muted">Listagem simples vinda da API do backend.</p>
        </div>
        <button class="button secondary" type="button" @click="loadCompanies">
          Atualizar
        </button>
      </div>

      <div v-if="loading" class="empty-state">Carregando empresas...</div>
      <div v-else-if="companies.length === 0" class="empty-state">
        Nenhuma empresa cadastrada ainda.
      </div>

      <div v-else class="stack-md">
        <article v-for="company in companies" :key="company.id" class="list-card">
          <div class="card-header">
            <div>
              <h3>{{ company.legalName }}</h3>
              <p class="muted">
                {{ company.tradeName || 'Sem nome fantasia' }} ·
                {{ company.registrationNumber }}
              </p>
            </div>
            <span class="tag">{{ company.country || 'Sem país' }}</span>
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
    errorMessage.value = getErrorMessage(error, 'Não foi possível carregar as empresas.');
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
    message.value = 'Empresa criada com sucesso.';
    await loadCompanies();
  } catch (error) {
    errorMessage.value = getErrorMessage(error, 'Não foi possível criar a empresa.');
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
