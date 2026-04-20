<template>
  <div class="page-grid two-columns">
    <section class="panel">
      <div class="section-heading">
        <div>
          <h2>Criar análise</h2>
          <p class="muted">Escolha uma empresa e crie uma nova análise.</p>
        </div>
      </div>

      <p v-if="message" class="success-banner">{{ message }}</p>
      <p v-if="errorMessage" class="error-banner">{{ errorMessage }}</p>

      <AnalysisForm
        :companies="companies"
        :loading="creating"
        @submit="handleCreateAnalysis"
      />
    </section>

    <section class="panel">
      <div class="section-heading">
        <div>
          <h2>Análises</h2>
          <p class="muted">Análises atuais vindas da API.</p>
        </div>
        <button class="button secondary" type="button" @click="loadData">
          Atualizar
        </button>
      </div>

      <div v-if="loading" class="empty-state">Carregando análises...</div>
      <div v-else-if="analyses.length === 0" class="empty-state">
        Nenhuma análise criada ainda.
      </div>

      <div v-else class="stack-md">
        <article v-for="analysis in analyses" :key="analysis.id" class="list-card">
          <div class="card-header">
            <div>
              <h3>Análise #{{ analysis.id }}</h3>
              <p class="muted">
                {{ analysis.company.legalName }} · {{ formatStatusLabel(analysis.status) }}
              </p>
            </div>
            <span class="risk-pill" :class="analysis.riskLevel || 'pending'">
              {{ formatRiskLabel(analysis.riskLevel) }}
            </span>
          </div>

          <p>{{ analysis.summaryText || 'Nenhum resumo gerado ainda.' }}</p>

          <RouterLink
            class="button secondary inline-button"
            :to="{ name: 'analysis-detail', params: { id: analysis.id } }"
          >
            Ver detalhes
          </RouterLink>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';

import AnalysisForm from '@/components/AnalysisForm.vue';
import { createAnalysis, fetchAnalyses } from '@/services/analyses';
import { fetchCompanies } from '@/services/companies';
import type { AnalysisListItem, Company } from '@/types/models';
import { formatRiskLabel, formatStatusLabel } from '@/utils/risk';

const router = useRouter();

const companies = ref<Company[]>([]);
const analyses = ref<AnalysisListItem[]>([]);
const loading = ref(false);
const creating = ref(false);
const message = ref('');
const errorMessage = ref('');

onMounted(() => {
  loadData();
});

async function loadData() {
  try {
    loading.value = true;
    errorMessage.value = '';
    const [nextCompanies, nextAnalyses] = await Promise.all([
      fetchCompanies(),
      fetchAnalyses(),
    ]);
    companies.value = nextCompanies;
    analyses.value = nextAnalyses;
  } catch (error) {
    errorMessage.value = getErrorMessage(error, 'Não foi possível carregar as análises.');
  } finally {
    loading.value = false;
  }
}

async function handleCreateAnalysis(payload: { companyId: number }) {
  try {
    creating.value = true;
    errorMessage.value = '';
    message.value = '';
    const analysis = await createAnalysis(payload);
    message.value = 'Análise criada com sucesso.';
    await loadData();
    router.push({ name: 'analysis-detail', params: { id: analysis.id } });
  } catch (error) {
    errorMessage.value = getErrorMessage(error, 'Não foi possível criar a análise.');
  } finally {
    creating.value = false;
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
