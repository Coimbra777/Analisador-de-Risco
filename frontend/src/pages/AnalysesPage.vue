<template>
  <div class="page-grid two-columns">
    <section class="panel">
      <div class="section-heading">
        <div>
          <h2>Create analysis</h2>
          <p class="muted">Choose a company and create a new analysis.</p>
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
          <h2>Analyses</h2>
          <p class="muted">Current analyses from the API.</p>
        </div>
        <button class="button secondary" type="button" @click="loadData">
          Refresh
        </button>
      </div>

      <div v-if="loading" class="empty-state">Loading analyses...</div>
      <div v-else-if="analyses.length === 0" class="empty-state">
        No analyses created yet.
      </div>

      <div v-else class="stack-md">
        <article v-for="analysis in analyses" :key="analysis.id" class="list-card">
          <div class="card-header">
            <div>
              <h3>Analysis #{{ analysis.id }}</h3>
              <p class="muted">
                {{ analysis.company.legalName }} · {{ analysis.status }}
              </p>
            </div>
            <span class="risk-pill" :class="analysis.riskLevel || 'pending'">
              {{ analysis.riskLevel || 'pending' }}
            </span>
          </div>

          <p>{{ analysis.summaryText || 'No summary generated yet.' }}</p>

          <RouterLink
            class="button secondary inline-button"
            :to="{ name: 'analysis-detail', params: { id: analysis.id } }"
          >
            View details
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
    errorMessage.value = getErrorMessage(error, 'Unable to load analyses.');
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
    message.value = 'Analysis created successfully.';
    await loadData();
    router.push({ name: 'analysis-detail', params: { id: analysis.id } });
  } catch (error) {
    errorMessage.value = getErrorMessage(error, 'Unable to create analysis.');
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
