<template>
  <div class="stack-lg">
    <section class="panel">
      <SectionHeader
        description="Cadastre aqui os fornecedores que você quer avaliar. Depois disso, o próximo passo é criar uma análise e enviar um documento PDF."
        title="Empresas"
        title-tag="h2"
      />
    </section>

    <div class="page-grid two-columns">
      <section class="panel">
        <SectionHeader
          description="Preencha os dados básicos do fornecedor para usar nas análises."
          title="Cadastrar empresa"
          title-tag="h3"
        />

        <FeedbackBanner v-if="hasCreatedCompany" title="Empresa criada com sucesso." variant="success">
          <p>Com a empresa cadastrada, você já pode seguir para a criação de uma análise.</p>
          <RouterLink class="button secondary inline-button" :to="{ name: 'analyses' }">
            Ir para análises
          </RouterLink>
        </FeedbackBanner>
        <FeedbackBanner v-if="errorMessage" :message="errorMessage" variant="error" />

        <CompanyForm :loading="isSubmitting" @submit="handleCreateCompany" />
      </section>

      <section class="panel">
        <SectionHeader
          description="Selecione uma dessas empresas quando for criar uma nova análise."
          title="Empresas cadastradas"
          title-tag="h3"
        >
          <template #actions>
            <div class="stack-sm">
              <StatusBadge
                appearance="tag"
                :label="`${companies.length} cadastrada${companies.length !== 1 ? 's' : ''}`"
              />
              <AppButton
                label="Atualizar"
                :loading="isLoading"
                loading-label="Atualizando..."
                type="button"
                variant="secondary"
                @click="loadCompanyList"
              />
            </div>
          </template>
        </SectionHeader>

        <EmptyState
          v-if="isLoading"
          description="Estamos buscando a lista mais recente de fornecedores cadastrados."
          title="Carregando empresas cadastradas..."
        />
        <EmptyState
          v-else-if="companies.length === 0"
          description="Cadastre sua primeira empresa para seguir para a criação de análises e envio de documentos."
          title="Nenhuma empresa cadastrada ainda."
        />

        <div v-else class="stack-md">
          <article v-for="company in companies" :key="company.id" class="list-card">
            <div class="card-header">
              <div>
                <h3>{{ company.legalName }}</h3>
                <p class="muted">
                  {{ company.tradeName || 'Sem nome fantasia' }} ·
                  {{ company.registrationNumber }}
                </p>
              </div>
              <StatusBadge
                appearance="tag"
                :label="company.country || 'Sem país'"
              />
            </div>
            <p class="muted">
              Próximo passo: use esta empresa na tela de análises para iniciar uma avaliação.
            </p>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

import {
  createCompany,
  fetchCompanyList,
} from '@/features/companies/api/companies.api';
import CompanyForm from '@/features/companies/components/CompanyForm.vue';
import AppButton from '@/shared/ui/AppButton.vue';
import EmptyState from '@/shared/ui/EmptyState.vue';
import FeedbackBanner from '@/shared/ui/FeedbackBanner.vue';
import SectionHeader from '@/shared/ui/SectionHeader.vue';
import StatusBadge from '@/shared/ui/StatusBadge.vue';
import type { Company } from '@/shared/types/models';
import { getApiErrorMessage } from '@/shared/utils/get-api-error-message';

const companies = ref<Company[]>([]);
const isLoading = ref(false);
const isSubmitting = ref(false);
const hasCreatedCompany = ref(false);
const errorMessage = ref('');

onMounted(() => {
  loadCompanyList();
});

async function loadCompanyList() {
  try {
    isLoading.value = true;
    errorMessage.value = '';
    companies.value = await fetchCompanyList();
  } catch (error) {
    errorMessage.value = getApiErrorMessage(
      error,
      'Não foi possível carregar as empresas.',
    );
  } finally {
    isLoading.value = false;
  }
}

async function handleCreateCompany(payload: {
  legalName: string;
  tradeName?: string;
  registrationNumber: string;
  country?: string;
}) {
  try {
    isSubmitting.value = true;
    errorMessage.value = '';
    hasCreatedCompany.value = false;
    await createCompany(payload);
    hasCreatedCompany.value = true;
    await loadCompanyList();
  } catch (error) {
    errorMessage.value = getApiErrorMessage(
      error,
      'Não foi possível criar a empresa.',
    );
  } finally {
    isSubmitting.value = false;
  }
}
</script>
