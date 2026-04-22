<template>
  <div class="stack-lg">
    <section class="panel">
      <div class="analysis-page-header">
        <p class="muted">Análise #{{ analysis?.id ?? props.id }}</p>
        <SectionHeader
          description="Acompanhe o status da avaliação, envie o documento e consulte o resultado."
          :title="analysis?.company.legalName || 'Detalhe da análise'"
          title-tag="h2"
        >
          <template #actions>
            <RouterLink class="button secondary inline-button" :to="{ name: 'analyses' }">
              Voltar para análises
            </RouterLink>
          </template>
        </SectionHeader>
      </div>

      <EmptyState
        v-if="isLoading"
        description="Estamos buscando o status, os documentos e o resultado mais recente."
        title="Carregando análise..."
      />
      <FeedbackBanner
        v-else-if="errorMessage"
        :message="errorMessage"
        title="Não foi possível carregar esta análise."
        variant="error"
      />

      <template v-else-if="analysis">
        <FeedbackBanner
          v-if="highlightMessage"
          :title="highlightMessage"
          variant="success"
        />

        <section class="analysis-hero">
          <div class="analysis-hero-main">
            <div class="analysis-hero-badges">
              <StatusBadge
                :label="formatAnalysisStatusLabel(analysis.status)"
                :tone="analysisStatusTone"
              />
              <StatusBadge
                appearance="risk"
                :label="riskLabel"
                :tone="analysis.riskLevel || 'pending'"
              />
            </div>

            <div class="stack-sm">
              <h3>{{ heroTitle }}</h3>
              <p class="muted">{{ nextStepText }}</p>
            </div>
          </div>

          <div class="analysis-hero-stats">
            <div class="stat-card">
              <span class="muted">Score</span>
              <strong>{{ riskScore }}/100</strong>
            </div>
            <div class="stat-card">
              <span class="muted">Empresa</span>
              <strong>{{ analysis.company.registrationNumber }}</strong>
            </div>
          </div>
        </section>

        <section class="panel nested-panel upload-panel">
          <SectionHeader
            :description="uploadPanelDescription"
            title="Documento da análise"
            title-tag="h3"
          >
            <template #actions>
              <StatusBadge
                appearance="tag"
                :label="`${analysis.documents.length} documento${analysis.documents.length !== 1 ? 's' : ''}`"
              />
            </template>
          </SectionHeader>

          <EmptyState
            v-if="isUploading"
            description="Aguarde enquanto atualizamos o status e o resultado da análise."
            title="Enviando e processando documento..."
          />

          <FeedbackBanner
            v-else-if="uploadMessage"
            :message="uploadMessage"
            title="Documento processado com sucesso."
            variant="success"
          />

          <DocumentUploadForm :loading="isUploading" @submit="handleUpload" />
        </section>

        <div class="detail-grid">
          <section class="panel nested-panel">
            <h3>Resumo da análise</h3>
            <p>{{ summaryText }}</p>
          </section>

          <section class="panel nested-panel">
            <h3>Empresa vinculada</h3>
            <p>{{ analysis.company.legalName }}</p>
            <p class="muted">{{ analysis.company.registrationNumber }}</p>
          </section>
        </div>

        <div class="detail-grid">
          <section class="panel nested-panel">
            <SectionHeader
              description="Veja os principais motivos que explicam o resultado desta análise."
              title="Achados de risco"
              title-tag="h3"
            />
            <FindingsList :findings="analysis.riskFindings" />
          </section>

          <section class="panel nested-panel">
            <SectionHeader
              description="Histórico dos arquivos enviados para esta análise."
              title="Documentos vinculados"
              title-tag="h3"
            />
            <EmptyState
              v-if="analysis.documents.length === 0"
              description="Envie um documento (PDF, imagem, DOCX ou XLSX) para começar o processamento desta análise."
              title="Nenhum documento enviado ainda."
            />
            <div v-else class="stack-md">
              <article
                v-for="document in analysis.documents"
                :key="document.id"
                class="list-card"
              >
                <div class="card-header">
                  <div>
                    <h4>{{ document.originalFilename }}</h4>
                    <p class="muted">{{ formatDocumentMeta(document) }}</p>
                  </div>
                  <StatusBadge
                    appearance="tag"
                    :label="formatDocumentStatusLabel(document.status)"
                    :tone="getDocumentStatusTone(document.status)"
                  />
                </div>
              </article>
            </div>
          </section>
        </div>
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import {
  fetchAnalysisDetail,
  uploadAnalysisDocument,
} from '@/features/analyses/api/analyses.api';
import DocumentUploadForm from '@/features/analyses/components/DocumentUploadForm.vue';
import FindingsList from '@/features/analyses/components/FindingsList.vue';
import EmptyState from '@/shared/ui/EmptyState.vue';
import FeedbackBanner from '@/shared/ui/FeedbackBanner.vue';
import SectionHeader from '@/shared/ui/SectionHeader.vue';
import StatusBadge from '@/shared/ui/StatusBadge.vue';
import type { AnalysisDetail } from '@/shared/types/api.types';
import {
  calculateRiskScore,
  formatAnalysisStatusLabel,
  formatDocumentStatusLabel,
  formatRiskLabel,
  getAnalysisDetailUi,
  getAnalysisStatusTone,
  getDocumentStatusTone,
} from '@/shared/utils/analysis-ui';
import { formatDateTime, formatFileSize } from '@/shared/utils/format';
import { getApiErrorMessage } from '@/shared/utils/get-api-error-message';

const props = defineProps<{
  id: string;
}>();

const route = useRoute();
const analysis = ref<AnalysisDetail | null>(null);
const isLoading = ref(false);
const isUploading = ref(false);
const uploadMessage = ref('');
const errorMessage = ref('');
const highlightMessage = ref('');

const riskScore = computed(() =>
  analysis.value
    ? calculateRiskScore(analysis.value.riskFindings, analysis.value.riskLevel)
    : 0,
);
const riskLabel = computed(() =>
  analysis.value ? formatRiskLabel(analysis.value.riskLevel) : 'Pendente',
);
const summaryText = computed(() =>
  analysis.value?.summaryText || 'O resultado aparecerá aqui depois que o documento for enviado e processado.',
);
const analysisStatusTone = computed(() => getAnalysisStatusTone(analysis.value?.status ?? null));
const analysisUi = computed(() => getAnalysisDetailUi(analysis.value?.status ?? null));
const heroTitle = computed(() => analysisUi.value.heroTitle);
const nextStepText = computed(() => analysisUi.value.nextStepText);
const uploadPanelDescription = computed(() => analysisUi.value.uploadPanelDescription);

onMounted(() => {
  if (route.query.created === '1') {
    highlightMessage.value =
      'Análise criada com sucesso. Agora o próximo passo é enviar um documento para análise.';
  }

  loadAnalysis();
});

async function loadAnalysis() {
  try {
    isLoading.value = true;
    errorMessage.value = '';
    analysis.value = await fetchAnalysisDetail(Number(props.id));
  } catch (error) {
    errorMessage.value = getApiErrorMessage(
      error,
      'Não foi possível carregar a análise.',
    );
  } finally {
    isLoading.value = false;
  }
}

async function handleUpload(file: File) {
  try {
    isUploading.value = true;
    errorMessage.value = '';
    uploadMessage.value = '';
    const response = await uploadAnalysisDocument(Number(props.id), file);
    analysis.value = response.analysis;
    uploadMessage.value = response.message;
    highlightMessage.value = '';
  } catch (error) {
    errorMessage.value = getApiErrorMessage(
      error,
      'Não foi possível enviar o documento.',
    );
  } finally {
    isUploading.value = false;
  }
}

function formatDocumentMeta(document: AnalysisDetail['documents'][number]) {
  const details = [];

  if (document.fileSizeBytes) {
    details.push(formatFileSize(document.fileSizeBytes));
  }

  if (document.createdAt) {
    details.push(`Enviado em ${formatDateTime(document.createdAt)}`);
  }

  return details.join(' · ') || 'Documento enviado';
}
</script>
