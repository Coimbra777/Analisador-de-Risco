<template>
  <div class="stack-md">
    <EmptyState
      v-if="documents.length === 0"
      description="Envie um ou mais arquivos (PDF, imagem, DOCX ou XLSX) para processar nesta análise."
      title="Nenhum documento enviado ainda."
    />
    <div v-else class="stack-sm">
      <article
        v-for="document in documents"
        :key="document.id"
        class="list-card"
      >
        <div class="card-header">
          <div>
            <h4>{{ document.originalFilename }}</h4>
            <p class="muted">{{ documentMetaLine(document) }}</p>
          </div>
          <StatusBadge
            appearance="tag"
            :label="formatDocumentStatusLabel(document.status)"
            :tone="getDocumentStatusTone(document.status)"
          />
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import EmptyState from "@/shared/ui/EmptyState.vue";
import StatusBadge from "@/shared/ui/StatusBadge.vue";
import type { DocumentItem } from "@/shared/types/api.types";
import {
  formatDocumentStatusLabel,
  getDocumentStatusTone,
} from "@/shared/utils/analysis-ui";
import { formatDateTime, formatFileSize } from "@/shared/utils/format";

defineProps<{
  documents: DocumentItem[];
}>();

function documentMetaLine(document: DocumentItem) {
  const details: string[] = [];

  if (document.fileSizeBytes) {
    details.push(formatFileSize(document.fileSizeBytes));
  }

  if (document.createdAt) {
    details.push(`Enviado em ${formatDateTime(document.createdAt)}`);
  }

  return details.join(" · ") || "Documento enviado";
}
</script>
