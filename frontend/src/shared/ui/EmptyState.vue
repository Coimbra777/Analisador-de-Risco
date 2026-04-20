<template>
  <div class="empty-state">
    <strong v-if="title">{{ title }}</strong>
    <p v-if="description" class="muted">{{ description }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    description?: string;
  }>(),
  {
    title: undefined,
    description: undefined,
  },
);
</script>
