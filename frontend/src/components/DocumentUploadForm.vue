<template>
  <form class="stack-md" @submit.prevent="handleSubmit">
    <div class="field">
      <label for="pdf">Upload PDF</label>
      <input id="pdf" accept="application/pdf,.pdf" type="file" @change="handleChange" />
    </div>

    <button class="button" :disabled="loading || !selectedFile" type="submit">
      {{ loading ? 'Uploading...' : 'Upload and process' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  loading: boolean;
}>();

const emit = defineEmits<{
  submit: [file: File];
}>();

const selectedFile = ref<File | null>(null);

function handleChange(event: Event) {
  const input = event.target as HTMLInputElement;
  selectedFile.value = input.files?.[0] ?? null;
}

function handleSubmit() {
  if (!selectedFile.value || props.loading) {
    return;
  }

  emit('submit', selectedFile.value);
  selectedFile.value = null;
}
</script>
