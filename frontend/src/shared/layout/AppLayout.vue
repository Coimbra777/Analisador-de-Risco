<template>
  <div class="app-shell">
    <header class="topbar">
      <div>
        <h1>Supplier Risk Analyzer</h1>
        <p class="muted">Avalie fornecedores de forma simples, com resumo e classificação de risco.</p>
      </div>

      <div class="topbar-actions">
        <nav class="nav-links">
          <RouterLink to="/companies">Empresas</RouterLink>
          <RouterLink to="/analyses">Análises</RouterLink>
        </nav>

        <div class="user-chip">
          <span>{{ user?.name }}</span>
          <AppButton label="Sair" type="button" variant="secondary" @click="handleLogout" />
        </div>
      </div>
    </header>

    <main class="page-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

import { useAuth } from '@/shared/auth/use-auth';
import AppButton from '@/shared/ui/AppButton.vue';

const router = useRouter();
const { user, clearSession } = useAuth();

function handleLogout() {
  clearSession();
  router.push({ name: 'login' });
}
</script>
