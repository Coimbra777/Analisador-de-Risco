<template>
  <div class="stack-md">
    <div v-if="findings.length === 0" class="empty-state">
      Nenhum achado disponível ainda.
    </div>

    <article v-for="finding in findings" :key="finding.id" class="list-card">
      <div class="card-header">
        <div>
          <h4>{{ finding.title }}</h4>
          <p class="muted">{{ finding.code || 'Sem código' }}</p>
        </div>
        <span class="risk-pill" :class="finding.severity">
          {{ formatSeverityLabel(finding.severity) }}
        </span>
      </div>
      <p>{{ finding.description || 'Nenhuma descrição adicional informada.' }}</p>
    </article>
  </div>
</template>

<script setup lang="ts">
import type { RiskFinding } from '@/types/models';
import { formatRiskLabel } from '@/utils/risk';

defineProps<{
  findings: RiskFinding[];
}>();

function formatSeverityLabel(severity: 'low' | 'medium' | 'high') {
  return formatRiskLabel(severity);
}
</script>
