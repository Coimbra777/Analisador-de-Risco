<template>
  <div class="stack-md analysis-upload">
    <div class="field">
      <label for="analysis-documents-input">Selecionar arquivos</label>
      <input
        id="analysis-documents-input"
        ref="fileInputRef"
        :disabled="uploading"
        accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,application/pdf,image/png,image/jpeg,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        multiple
        type="file"
        @change="handleFileInput"
      />
      <p class="field-help">
        Você pode escolher vários arquivos de uma vez. Cada envio é processado na ordem, um de cada vez.
      </p>
    </div>

    <div v-if="files.length > 0" class="stack-sm selected-files">
      <p class="selected-files-header">
        <strong>{{ files.length }}</strong>
        arquivo{{ files.length === 1 ? '' : 's' }} selecionado{{ files.length === 1 ? '' : 's' }}
      </p>
      <ul class="selected-files-list">
        <li v-for="(file, index) in files" :key="fileKey(file, index)">
          <span>{{ file.name }}</span>
          <button
            :disabled="uploading"
            class="linkish-button"
            type="button"
            @click="removeAt(index)"
          >
            Remover
          </button>
        </li>
      </ul>
    </div>

    <div class="stack-sm upload-actions">
      <AppButton
        label="Enviar e processar"
        :disabled="files.length === 0 || uploading"
        :loading="uploading"
        :loading-label="uploadingLabel"
        type="button"
        @click="requestUpload"
      />
      <button
        :disabled="uploading || files.length === 0"
        class="linkish-button"
        type="button"
        @click="clearAll"
      >
        Limpar seleção
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import AppButton from '@/shared/ui/AppButton.vue';

const props = defineProps<{
  uploading: boolean;
  uploadIndex: number;
  uploadTotal: number;
}>();

const emit = defineEmits<{
  upload: [files: File[]];
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);
const files = ref<File[]>([]);

const uploadingLabel = computed(() => {
  if (!props.uploading) {
    return 'Enviando...';
  }

  if (props.uploadTotal > 0) {
    return `Enviando ${props.uploadIndex} de ${props.uploadTotal}...`;
  }

  return 'Enviando...';
});

function fileKey(file: File, index: number) {
  return `${file.name}-${file.size}-${file.lastModified}-${index}`;
}

function handleFileInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const list = input.files;
  if (!list?.length) {
    return;
  }

  for (const file of Array.from(list)) {
    if (!files.value.some((existing) => isSameFile(existing, file))) {
      files.value.push(file);
    }
  }

  input.value = '';
}

function isSameFile(a: File, b: File) {
  return a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
}

function removeAt(index: number) {
  files.value = files.value.filter((_, i) => i !== index);
}

function clearAll() {
  files.value = [];
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
}

function requestUpload() {
  if (files.value.length === 0 || props.uploading) {
    return;
  }

  const payload = files.value.slice();
  emit('upload', payload);
}

defineExpose({
  clearSelection: clearAll,
});
</script>

<style scoped>
.selected-files {
  border: 1px solid #d7dfeb;
  border-radius: 12px;
  padding: 12px 14px;
  background: #ffffff;
}

.selected-files-header {
  margin: 0;
  font-size: 0.9rem;
}

.selected-files-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.selected-files-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
  font-size: 0.9rem;
  border-top: 1px solid #edf0f7;
}

.selected-files-list li:first-of-type {
  border-top: none;
  padding-top: 0;
}

.linkish-button {
  border: none;
  background: none;
  color: #2346b5;
  font: inherit;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.linkish-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  text-decoration: none;
}

.upload-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
}
</style>
