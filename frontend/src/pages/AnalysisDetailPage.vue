<template>
  <div class="stack-lg">
    <section class="panel">
      <div class="section-heading">
        <div>
          <h2>Analysis detail</h2>
          <p class="muted">Summary, score, findings and document upload.</p>
        </div>
        <RouterLink class="button secondary inline-button" :to="{ name: 'analyses' }">
          Back to analyses
        </RouterLink>
      </div>

      <div v-if="loading" class="empty-state">Loading analysis...</div>
      <p v-else-if="errorMessage" class="error-banner">{{ errorMessage }}</p>

      <template v-else-if="analysis">
        <div class="stats-grid">
          <div class="stat-card">
            <span class="muted">Analysis</span>
            <strong>#{{ analysis.id }}</strong>
          </div>
          <div class="stat-card">
            <span class="muted">Status</span>
            <strong>{{ analysis.status }}</strong>
          </div>
          <div class="stat-card">
            <span class="muted">Risk level</span>
            <strong>{{ riskLabel }}</strong>
          </div>
          <div class="stat-card">
            <span class="muted">Score</span>
            <strong>{{ riskScore }}/100</strong>
          </div>
        </div>

        <div class="detail-grid">
          <section class="panel nested-panel">
            <h3>Company</h3>
            <p>{{ analysis.company.legalName }}</p>
            <p class="muted">{{ analysis.company.registrationNumber }}</p>
          </section>

          <section class="panel nested-panel">
            <h3>Summary</h3>
            <p>{{ analysis.summaryText || 'No summary available yet.' }}</p>
          </section>
        </div>

        <section class="panel nested-panel">
          <h3>Upload document</h3>
          <p class="muted">
            Send a PDF to trigger the local processing flow in the backend.
          </p>
          <p v-if="uploadMessage" class="success-banner">{{ uploadMessage }}</p>
          <DocumentUploadForm :loading="uploading" @submit="handleUpload" />
        </section>

        <section class="panel nested-panel">
          <h3>Documents</h3>
          <div v-if="analysis.documents.length === 0" class="empty-state">
            No documents uploaded yet.
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
                  <p class="muted">{{ document.storageKey || 'Local storage' }}</p>
                </div>
                <span class="tag">{{ document.status }}</span>
              </div>
            </article>
          </div>
        </section>

        <section class="panel nested-panel">
          <h3>Findings</h3>
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
import { calculateRiskScore, formatRiskLabel } from '@/utils/risk';

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
  analysis.value ? formatRiskLabel(analysis.value.riskLevel) : 'Pending',
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
    errorMessage.value = getErrorMessage(error, 'Unable to load analysis.');
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
    errorMessage.value = getErrorMessage(error, 'Unable to upload document.');
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
