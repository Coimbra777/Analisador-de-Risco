<template>
  <div class="stack-md">
    <EmptyState
      v-if="findings.length === 0"
      title="Nenhum achado disponível ainda."
      description="Os principais sinais de risco aparecerão aqui depois do processamento."
    />

    <article v-for="finding in findings" :key="finding.id" class="list-card">
      <div class="card-header">
        <div>
          <h4>{{ finding.title }}</h4>
          <p class="muted">{{ finding.code || 'Sem código' }}</p>
        </div>
        <StatusBadge
          appearance="risk"
          :label="formatSeverityLabel(finding.severity)"
          :tone="finding.severity"
        />
      </div>
      <p>{{ finding.description || 'Nenhuma descrição adicional informada.' }}</p>
    </article>
  </div>
</template>

<script setup lang="ts">
import type { RiskFinding } from '@/shared/types/api.types';
import EmptyState from '@/shared/ui/EmptyState.vue';
import StatusBadge from '@/shared/ui/StatusBadge.vue';
import { formatRiskLabel } from '@/shared/utils/analysis-ui';

defineProps<{
  findings: RiskFinding[];
}>();

function formatSeverityLabel(severity: 'low' | 'medium' | 'high') {
  return formatRiskLabel(severity);
}
</script>
