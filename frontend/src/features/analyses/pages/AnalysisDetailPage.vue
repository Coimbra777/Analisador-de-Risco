<template>
  <div class="stack-lg">
    <div class="analysis-page-header">
      <p class="muted">Análise #{{ analysis?.id ?? props.id }}</p>
      <SectionHeader
        description="Acompanhe o resumo, envie documentos e veja o resultado da avaliação."
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
      v-else-if="loadError"
      :message="loadError"
      title="Não foi possível carregar esta análise."
      variant="error"
    />

    <template v-else-if="analysis">
      <FeedbackBanner
        v-if="highlightMessage"
        :title="highlightMessage"
        variant="success"
      />
      <FeedbackBanner
        v-if="dataRefreshError"
        :message="dataRefreshError"
        title="A análise foi atualizada, mas não foi possível recarregar os dados mais recentes."
        variant="error"
      />

      <AnalysisSummaryCard :analysis="analysis" />

      <section class="panel nested-panel upload-panel">
        <SectionHeader
          :description="uploadPanelDescription"
          title="Enviar documentos"
          title-tag="h3"
        />
        <p v-if="contextHint" class="muted next-step-hint">{{ contextHint }}</p>

        <FeedbackBanner
          v-if="uploadOutcomes.length > 0"
          :message="uploadSummaryText"
          :title="uploadSummaryTitle"
          :variant="uploadSummaryVariant"
        >
          <ul v-if="hasMixedOrFailedUpload" class="upload-outcome-list">
            <li v-for="(outcome, index) in uploadOutcomes" :key="`${outcome.name}-${index}`">
              <span :class="outcome.ok ? 'outcome-ok' : 'outcome-fail'">
                {{ outcome.ok ? '✓' : '✕' }} {{ outcome.name }}
              </span>
              <span v-if="!outcome.ok && outcome.message" class="outcome-msg">{{
                outcome.message
              }}</span>
            </li>
          </ul>
        </FeedbackBanner>

        <AnalysisDocumentsUpload
          ref="uploadPanelRef"
          :upload-index="activeUploadIndex"
          :upload-total="activeUploadTotal"
          :uploading="isUploading"
          @upload="handleSequentialUpload"
        />
      </section>

      <section class="panel nested-panel">
        <SectionHeader
          description="Todos os arquivos vinculados a esta análise e o status de cada um."
          title="Documentos enviados"
          title-tag="h3"
        />
        <AnalysisDocumentsList :documents="analysis.documents" />
      </section>

      <section class="panel nested-panel">
        <SectionHeader
          description="Veja os principais motivos que explicam o resultado desta análise."
          title="Achados de risco"
          title-tag="h3"
        />
        <FindingsList :findings="analysis.riskFindings" />
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import {
  fetchAnalysisDetail,
  uploadAnalysisDocument,
} from '@/features/analyses/api/analyses.api';
import AnalysisDocumentsList from '@/features/analyses/components/AnalysisDocumentsList.vue';
import AnalysisDocumentsUpload from '@/features/analyses/components/AnalysisDocumentsUpload.vue';
import AnalysisSummaryCard from '@/features/analyses/components/AnalysisSummaryCard.vue';
import FindingsList from '@/features/analyses/components/FindingsList.vue';
import EmptyState from '@/shared/ui/EmptyState.vue';
import FeedbackBanner from '@/shared/ui/FeedbackBanner.vue';
import SectionHeader from '@/shared/ui/SectionHeader.vue';
import type { AnalysisDetail } from '@/shared/types/api.types';
import { getAnalysisDetailUi } from '@/shared/utils/analysis-ui';
import { getApiErrorMessage } from '@/shared/utils/get-api-error-message';

const props = defineProps<{
  id: string;
}>();

const route = useRoute();
const analysis = ref<AnalysisDetail | null>(null);
const isLoading = ref(false);
const isUploading = ref(false);
const loadError = ref('');
const dataRefreshError = ref('');
const uploadOutcomes = ref<
  { name: string; ok: boolean; message?: string }[]
>([]);
const activeUploadIndex = ref(0);
const activeUploadTotal = ref(0);
const highlightMessage = ref('');

const uploadPanelRef = ref<InstanceType<typeof AnalysisDocumentsUpload> | null>(null);

const analysisUi = computed(() => getAnalysisDetailUi(analysis.value?.status ?? null));
const uploadPanelDescription = computed(() => analysisUi.value.uploadPanelDescription);
const contextHint = computed(() => analysisUi.value.nextStepText);

const uploadSummaryTitle = computed(() => {
  if (uploadOutcomes.value.length === 0) {
    return '';
  }
  const failed = uploadOutcomes.value.filter((o) => !o.ok);
  if (failed.length === 0) {
    return 'Envio concluído';
  }
  if (failed.length === uploadOutcomes.value.length) {
    return 'Nenhum arquivo foi enviado com sucesso';
  }
  return 'Envio concluído com falhas em alguns arquivos';
});

const uploadSummaryText = computed(() => {
  if (uploadOutcomes.value.length === 0) {
    return '';
  }
  const ok = uploadOutcomes.value.filter((o) => o.ok).length;
  const n = uploadOutcomes.value.length;
  if (ok === n) {
    return `Todos os ${n} arquivo${n === 1 ? ' foi' : 's foram'} processado${n === 1 ? '' : 's'}. A lista de documentos foi atualizada.`;
  }
  if (ok === 0) {
    return 'Nenhum arquivo foi enviado com sucesso. Verifique o tipo e o tamanho do arquivo e tente novamente.';
  }
  return 'Confira os detalhes abaixo. A lista de documentos foi atualizada com os envios concluídos com sucesso.';
});

const uploadSummaryVariant = computed(() =>
  uploadOutcomes.value.length > 0 && uploadOutcomes.value.every((o) => o.ok)
    ? 'success'
    : 'error',
);

const hasMixedOrFailedUpload = computed(
  () =>
    uploadOutcomes.value.length > 0 &&
    uploadOutcomes.value.some((o) => !o.ok),
);

onMounted(() => {
  if (route.query.created === '1') {
    highlightMessage.value =
      'Análise criada com sucesso. Selecione um ou mais documentos e envie para análise.';
  }

  loadInitialAnalysis();
});

async function loadInitialAnalysis() {
  try {
    isLoading.value = true;
    loadError.value = '';
    analysis.value = await fetchAnalysisDetail(Number(props.id));
  } catch (error) {
    loadError.value = getApiErrorMessage(
      error,
      'Não foi possível carregar a análise.',
    );
  } finally {
    isLoading.value = false;
  }
}

async function refreshAnalysisFromServer() {
  const next = await fetchAnalysisDetail(Number(props.id));
  analysis.value = next;
}

async function handleSequentialUpload(files: File[]) {
  if (files.length === 0) {
    return;
  }

  dataRefreshError.value = '';
  uploadOutcomes.value = [];
  isUploading.value = true;
  const total = files.length;
  activeUploadTotal.value = total;

  for (let i = 0; i < total; i++) {
    const file = files[i];
    activeUploadIndex.value = i + 1;

    try {
      const response = await uploadAnalysisDocument(Number(props.id), file);
      analysis.value = response.analysis;
      uploadOutcomes.value = [
        ...uploadOutcomes.value,
        { name: file.name, ok: true },
      ];
    } catch (error) {
      uploadOutcomes.value = [
        ...uploadOutcomes.value,
        {
          name: file.name,
          ok: false,
          message: getApiErrorMessage(error, 'Falha no envio.'),
        },
      ];
    }
  }

  try {
    await refreshAnalysisFromServer();
  } catch (error) {
    dataRefreshError.value = getApiErrorMessage(
      error,
      'Não foi possível atualizar os dados da análise após o envio.',
    );
  } finally {
    isUploading.value = false;
    activeUploadIndex.value = 0;
    activeUploadTotal.value = 0;
    uploadPanelRef.value?.clearSelection();
    highlightMessage.value = '';
  }
}
</script>

<style scoped>
.next-step-hint {
  margin: 0 0 16px;
  font-size: 0.9rem;
  line-height: 1.45;
}

.upload-outcome-list {
  margin: 8px 0 0;
  padding-left: 1.1rem;
}

.upload-outcome-list li {
  margin-bottom: 6px;
  list-style: disc;
}

.outcome-ok {
  color: #1b6e3f;
}

.outcome-fail {
  color: #a52a2a;
}

.outcome-msg {
  display: block;
  font-size: 0.9rem;
  color: #60708f;
  margin-top: 2px;
}
</style>
