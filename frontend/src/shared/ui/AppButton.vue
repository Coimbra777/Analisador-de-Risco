<template>
  <button class="button" :class="variantClass" :disabled="disabled || loading" :type="type">
    {{ loading ? loadingLabel : label }}
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    label: string;
    loading?: boolean;
    loadingLabel?: string;
    disabled?: boolean;
    type?: 'button' | 'submit';
    variant?: 'primary' | 'secondary';
  }>(),
  {
    loading: false,
    loadingLabel: 'Carregando...',
    disabled: false,
    type: 'button',
    variant: 'primary',
  },
);

const variantClass = computed(() =>
  props.variant === 'secondary' ? 'secondary' : undefined,
);
</script>
