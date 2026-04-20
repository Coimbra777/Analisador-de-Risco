import { createRouter, createWebHistory } from 'vue-router';

import { useAuth } from '@/composables/useAuth';
import AppLayout from '@/components/AppLayout.vue';
import AnalysisDetailPage from '@/pages/AnalysisDetailPage.vue';
import AnalysesPage from '@/pages/AnalysesPage.vue';
import CompaniesPage from '@/pages/CompaniesPage.vue';
import LoginPage from '@/pages/LoginPage.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
      meta: { guestOnly: true },
    },
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/companies',
        },
        {
          path: 'companies',
          name: 'companies',
          component: CompaniesPage,
        },
        {
          path: 'analyses',
          name: 'analyses',
          component: AnalysesPage,
        },
        {
          path: 'analyses/:id',
          name: 'analysis-detail',
          component: AnalysisDetailPage,
          props: true,
        },
      ],
    },
  ],
});

router.beforeEach((to) => {
  const { isAuthenticated } = useAuth();

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return { name: 'login' };
  }

  if (to.meta.guestOnly && isAuthenticated.value) {
    return { name: 'companies' };
  }

  return true;
});

export { router };
