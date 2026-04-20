<template>
  <span :class="badgeClass">
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    label: string;
    tone?: 'neutral' | 'pending' | 'processing' | 'completed' | 'failed' | 'low' | 'medium' | 'high';
    appearance?: 'status' | 'tag' | 'risk';
  }>(),
  {
    tone: 'neutral',
    appearance: 'status',
  },
);

const badgeClass = computed(() => {
  const baseClass =
    props.appearance === 'risk'
      ? 'risk-pill'
      : props.appearance === 'tag'
        ? 'tag'
        : 'status-badge';

  return [baseClass, props.tone];
});
</script>
