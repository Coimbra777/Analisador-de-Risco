<template>
  <div class="app-shell">
    <header class="topbar">
      <div>
        <h1>Supplier Risk Analyzer</h1>
        <p class="muted">Frontend MVP minimalista para a API do backend.</p>
      </div>

      <div class="topbar-actions">
        <nav class="nav-links">
          <RouterLink to="/companies">Empresas</RouterLink>
          <RouterLink to="/analyses">Análises</RouterLink>
        </nav>

        <div class="user-chip">
          <span>{{ user?.name }}</span>
          <button class="button secondary" type="button" @click="handleLogout">
            Sair
          </button>
        </div>
      </div>
    </header>

    <main class="page-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router';

import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const { user, clearSession } = useAuth();

function handleLogout() {
  clearSession();
  router.push({ name: 'login' });
}
</script>
