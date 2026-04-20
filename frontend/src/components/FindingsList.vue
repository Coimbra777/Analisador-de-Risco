<template>
  <div class="stack-md">
    <div v-if="findings.length === 0" class="empty-state">
      No findings available yet.
    </div>

    <article v-for="finding in findings" :key="finding.id" class="list-card">
      <div class="card-header">
        <div>
          <h4>{{ finding.title }}</h4>
          <p class="muted">{{ finding.code || 'No code' }}</p>
        </div>
        <span class="risk-pill" :class="finding.severity">{{ finding.severity }}</span>
      </div>
      <p>{{ finding.description || 'No extra description provided.' }}</p>
    </article>
  </div>
</template>

<script setup lang="ts">
import type { RiskFinding } from '@/types/models';

defineProps<{
  findings: RiskFinding[];
}>();
</script>
