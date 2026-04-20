<template>
  <div class="app-shell">
    <header class="topbar">
      <div>
        <h1>Supplier Risk Analyzer</h1>
        <p class="muted">Minimal MVP frontend for the backend API.</p>
      </div>

      <div class="topbar-actions">
        <nav class="nav-links">
          <RouterLink to="/companies">Companies</RouterLink>
          <RouterLink to="/analyses">Analyses</RouterLink>
        </nav>

        <div class="user-chip">
          <span>{{ user?.name }}</span>
          <button class="button secondary" type="button" @click="handleLogout">
            Logout
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
