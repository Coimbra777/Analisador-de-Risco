<template>
  <form class="stack-md" @submit.prevent="handleSubmit">
    <div class="field">
      <label for="doc">Enviar documento</label>
      <input
        id="doc"
        ref="fileInput"
        :disabled="loading"
        accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,application/pdf,image/png,image/jpeg,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        type="file"
        @change="handleChange"
      />
    </div>

    <AppButton
      label="Enviar e processar"
      :disabled="!selectedFile"
      :loading="loading"
      loading-label="Enviando..."
      type="submit"
    />
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import AppButton from '@/shared/ui/AppButton.vue';

defineProps<{
  loading: boolean;
}>();

const emit = defineEmits<{
  submit: [file: File];
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);

function handleChange(event: Event) {
  const input = event.target as HTMLInputElement;
  selectedFile.value = input.files?.[0] ?? null;
}

function handleSubmit() {
  if (!selectedFile.value) {
    return;
  }

  emit('submit', selectedFile.value);
  selectedFile.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}
</script>
