<template>
  <div class="stack-lg">
    <section class="panel">
      <div class="section-heading">
        <div>
          <h2>Detalhe da análise</h2>
          <p class="muted">Resumo, score, achados e envio de documento.</p>
        </div>
        <RouterLink class="button secondary inline-button" :to="{ name: 'analyses' }">
          Voltar para análises
        </RouterLink>
      </div>

      <div v-if="loading" class="empty-state">Carregando análise...</div>
      <p v-else-if="errorMessage" class="error-banner">{{ errorMessage }}</p>

      <template v-else-if="analysis">
        <div class="stats-grid">
          <div class="stat-card">
            <span class="muted">Análise</span>
            <strong>#{{ analysis.id }}</strong>
          </div>
          <div class="stat-card">
            <span class="muted">Status</span>
            <strong>{{ formatStatusLabel(analysis.status) }}</strong>
          </div>
          <div class="stat-card">
            <span class="muted">Nível de risco</span>
            <strong>{{ riskLabel }}</strong>
          </div>
          <div class="stat-card">
            <span class="muted">Score</span>
            <strong>{{ riskScore }}/100</strong>
          </div>
        </div>

        <div class="detail-grid">
          <section class="panel nested-panel">
            <h3>Empresa</h3>
            <p>{{ analysis.company.legalName }}</p>
            <p class="muted">{{ analysis.company.registrationNumber }}</p>
          </section>

          <section class="panel nested-panel">
            <h3>Resumo</h3>
            <p>{{ analysis.summaryText || 'Nenhum resumo disponível ainda.' }}</p>
          </section>
        </div>

        <section class="panel nested-panel">
          <h3>Enviar documento</h3>
          <p class="muted">
            Envie um PDF para disparar o fluxo local de processamento no backend.
          </p>
          <p v-if="uploadMessage" class="success-banner">{{ uploadMessage }}</p>
          <DocumentUploadForm :loading="uploading" @submit="handleUpload" />
        </section>

        <section class="panel nested-panel">
          <h3>Documentos</h3>
          <div v-if="analysis.documents.length === 0" class="empty-state">
            Nenhum documento enviado ainda.
          </div>
          <div v-else class="stack-md">
            <article
              v-for="document in analysis.documents"
              :key="document.id"
              class="list-card"
            >
              <div class="card-header">
                <div>
                  <h4>{{ document.originalFilename }}</h4>
                  <p class="muted">{{ document.storageKey || 'Armazenamento local' }}</p>
                </div>
                <span class="tag">{{ formatStatusLabel(document.status) }}</span>
              </div>
            </article>
          </div>
        </section>

        <section class="panel nested-panel">
          <h3>Achados</h3>
          <FindingsList :findings="analysis.riskFindings" />
        </section>
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';

import DocumentUploadForm from '@/components/DocumentUploadForm.vue';
import FindingsList from '@/components/FindingsList.vue';
import { fetchAnalysisDetail } from '@/services/analyses';
import { uploadAnalysisDocument } from '@/services/documents';
import type { AnalysisDetail } from '@/types/models';
import { calculateRiskScore, formatRiskLabel, formatStatusLabel } from '@/utils/risk';

const props = defineProps<{
  id: string;
}>();

const analysis = ref<AnalysisDetail | null>(null);
const loading = ref(false);
const uploading = ref(false);
const uploadMessage = ref('');
const errorMessage = ref('');

const riskScore = computed(() =>
  analysis.value
    ? calculateRiskScore(analysis.value.riskFindings, analysis.value.riskLevel)
    : 0,
);
const riskLabel = computed(() =>
  analysis.value ? formatRiskLabel(analysis.value.riskLevel) : 'Pendente',
);

onMounted(() => {
  loadAnalysis();
});

async function loadAnalysis() {
  try {
    loading.value = true;
    errorMessage.value = '';
    analysis.value = await fetchAnalysisDetail(Number(props.id));
  } catch (error) {
    errorMessage.value = getErrorMessage(error, 'Não foi possível carregar a análise.');
  } finally {
    loading.value = false;
  }
}

async function handleUpload(file: File) {
  try {
    uploading.value = true;
    errorMessage.value = '';
    uploadMessage.value = '';
    const response = await uploadAnalysisDocument(Number(props.id), file);
    analysis.value = response.analysis;
    uploadMessage.value = response.message;
  } catch (error) {
    errorMessage.value = getErrorMessage(error, 'Não foi possível enviar o documento.');
  } finally {
    uploading.value = false;
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
