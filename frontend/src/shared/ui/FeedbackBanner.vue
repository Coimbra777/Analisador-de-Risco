<template>
  <div :class="bannerClass">
    <strong v-if="title">{{ title }}</strong>
    <p v-if="message">{{ message }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    variant: 'success' | 'error';
    title?: string;
    message?: string;
  }>(),
  {
    title: undefined,
    message: undefined,
  },
);

const bannerClass = computed(() => [
  props.variant === 'success' ? 'success-banner' : 'error-banner',
  'stack-sm',
]);
</script>
