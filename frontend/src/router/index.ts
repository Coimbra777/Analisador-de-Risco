import { createRouter, createWebHistory } from 'vue-router';

import LoginPage from '@/features/auth/pages/LoginPage.vue';
import AnalysisDetailPage from '@/features/analyses/pages/AnalysisDetailPage.vue';
import AnalysesPage from '@/features/analyses/pages/AnalysesPage.vue';
import CompaniesPage from '@/features/companies/pages/CompaniesPage.vue';
import { useAuth } from '@/shared/auth/use-auth';
import AppLayout from '@/shared/layout/AppLayout.vue';

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
    return {
      name: 'login',
      query: {
        redirect: to.fullPath,
      },
    };
  }

  if (to.meta.guestOnly && isAuthenticated.value) {
    return { name: 'companies' };
  }

  return true;
});

export { router };
