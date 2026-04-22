<template>
  <div class="page-grid two-columns">
    <section class="panel">
      <SectionHeader
        description="Uma análise reúne o fornecedor, o documento enviado e o resultado da avaliação."
        title="Criar análise"
        title-tag="h2"
      />

      <FeedbackBanner v-if="errorMessage" :message="errorMessage" variant="error" />

      <EmptyState
        v-if="companies.length === 0"
        description="Cadastre uma empresa primeiro para poder criar a sua primeira análise."
        title="Você ainda não tem empresas cadastradas."
      >
        <RouterLink class="button secondary inline-button" :to="{ name: 'companies' }">
          Ir para empresas
        </RouterLink>
      </EmptyState>
      <AnalysisForm
        v-else
        :companies="companies"
        :loading="isCreating"
        @submit="handleCreateAnalysis"
      />
    </section>

    <section class="panel">
      <SectionHeader
        description="Veja o andamento de cada análise e siga para o envio do documento quando necessário."
        title="Análises"
        title-tag="h2"
      >
        <template #actions>
          <AppButton
            label="Atualizar"
            :loading="isLoading"
            loading-label="Atualizando..."
            type="button"
            variant="secondary"
            @click="loadPageData"
          />
        </template>
      </SectionHeader>

      <EmptyState
        v-if="isLoading"
        description="Estamos buscando a lista mais recente de análises."
        title="Carregando análises..."
      />
      <EmptyState
        v-else-if="analyses.length === 0"
        description="Crie uma nova análise para escolher uma empresa e seguir para o envio do documento."
        title="Nenhuma análise criada ainda."
      />

      <div v-else class="stack-md">
        <article v-for="analysis in analyses" :key="analysis.id" class="list-card">
          <div class="card-header">
            <div>
              <h3>{{ analysis.company.legalName }}</h3>
              <p class="muted">
                Análise #{{ analysis.id }} · {{ formatAnalysisStatusLabel(analysis.status) }}
              </p>
            </div>
            <StatusBadge
              appearance="risk"
              :label="formatRiskLabel(analysis.riskLevel)"
              :tone="analysis.riskLevel || 'pending'"
            />
          </div>

          <p>{{ analysis.summaryText || 'Nenhum resumo gerado ainda.' }}</p>
          <p class="muted">{{ getAnalysisListUi(analysis.status).nextStepText }}</p>

          <RouterLink
            class="button secondary inline-button"
            :to="{ name: 'analysis-detail', params: { id: analysis.id } }"
          >
            {{ getAnalysisListUi(analysis.status).actionLabel }}
          </RouterLink>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  createAnalysis,
  fetchAnalysisList,
} from '@/features/analyses/api/analyses.api';
import AnalysisForm from '@/features/analyses/components/AnalysisForm.vue';
import { fetchCompanyList } from '@/features/companies/api/companies.api';
import AppButton from '@/shared/ui/AppButton.vue';
import EmptyState from '@/shared/ui/EmptyState.vue';
import FeedbackBanner from '@/shared/ui/FeedbackBanner.vue';
import SectionHeader from '@/shared/ui/SectionHeader.vue';
import StatusBadge from '@/shared/ui/StatusBadge.vue';
import type { AnalysisListItem, Company } from '@/shared/types/api.types';
import {
  formatAnalysisStatusLabel,
  formatRiskLabel,
  getAnalysisListUi,
} from '@/shared/utils/analysis-ui';
import { getApiErrorMessage } from '@/shared/utils/get-api-error-message';

const router = useRouter();

const companies = ref<Company[]>([]);
const analyses = ref<AnalysisListItem[]>([]);
const isLoading = ref(false);
const isCreating = ref(false);
const errorMessage = ref('');

onMounted(() => {
  loadPageData();
});

async function loadPageData() {
  try {
    isLoading.value = true;
    errorMessage.value = '';
    const [nextCompanies, nextAnalyses] = await Promise.all([
      fetchCompanyList(),
      fetchAnalysisList(),
    ]);
    companies.value = nextCompanies;
    analyses.value = nextAnalyses;
  } catch (error) {
    errorMessage.value = getApiErrorMessage(
      error,
      'Não foi possível carregar as análises.',
    );
  } finally {
    isLoading.value = false;
  }
}

async function handleCreateAnalysis(payload: { companyId: number }) {
  try {
    isCreating.value = true;
    errorMessage.value = '';
    const analysis = await createAnalysis(payload);
    await loadPageData();
    router.push({
      name: 'analysis-detail',
      params: { id: analysis.id },
      query: { created: '1' },
    });
  } catch (error) {
    errorMessage.value = getApiErrorMessage(
      error,
      'Não foi possível criar a análise.',
    );
  } finally {
    isCreating.value = false;
  }
}
</script>
