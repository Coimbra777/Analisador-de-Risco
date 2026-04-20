<template>
  <div class="section-heading">
    <div>
      <component :is="titleTag" class="section-title">{{ title }}</component>
      <p v-if="description" class="muted">{{ description }}</p>
    </div>

    <div v-if="$slots.actions" class="section-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    description?: string;
    titleTag?: 'h2' | 'h3' | 'h4';
  }>(),
  {
    description: undefined,
    titleTag: 'h2',
  },
);
</script>
