<template>
  <section class="panel nested-panel analysis-summary-card">
    <h3 class="analysis-summary-title">Resumo da análise</h3>

    <div class="analysis-summary-badges">
      <StatusBadge
        :label="formatAnalysisStatusLabel(analysis.status)"
        :tone="getAnalysisStatusTone(analysis.status)"
      />
      <StatusBadge
        appearance="risk"
        :label="formatRiskLabel(analysis.riskLevel)"
        :tone="analysis.riskLevel || 'pending'"
      />
    </div>

    <p class="analysis-summary-text">
      {{ summaryText }}
    </p>

    <div class="analysis-summary-meta">
      <div>
        <span class="muted">Empresa</span>
        <p class="analysis-summary-line">{{ analysis.company.legalName }}</p>
        <p class="muted">{{ analysis.company.registrationNumber }}</p>
      </div>
      <div class="analysis-summary-stat">
        <span class="muted">Score estimado</span>
        <strong>{{ riskScore }}/100</strong>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import StatusBadge from '@/shared/ui/StatusBadge.vue';
import type { AnalysisDetail } from '@/shared/types/api.types';
import {
  calculateRiskScore,
  formatAnalysisStatusLabel,
  formatRiskLabel,
  getAnalysisStatusTone,
} from '@/shared/utils/analysis-ui';

const props = defineProps<{
  analysis: AnalysisDetail;
}>();

const riskScore = computed(() =>
  calculateRiskScore(props.analysis.riskFindings, props.analysis.riskLevel),
);

const summaryText = computed(
  () =>
    props.analysis.summaryText ||
    'O resultado consolidado aparecerá aqui após o processamento dos documentos.',
);
</script>

<style scoped>
.analysis-summary-title {
  margin: 0 0 12px;
  font-size: 1.05rem;
}

.analysis-summary-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.analysis-summary-text {
  margin: 0 0 16px;
  line-height: 1.5;
}

.analysis-summary-meta {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  align-items: start;
  padding-top: 12px;
  border-top: 1px solid #e7ebf3;
}

.analysis-summary-line {
  margin: 4px 0 0;
  font-weight: 600;
}

.analysis-summary-stat {
  text-align: right;
}

.analysis-summary-stat strong {
  display: block;
  font-size: 1.15rem;
  margin-top: 4px;
}
</style>
