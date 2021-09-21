import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/loginPage.vue'),
        meta: {
          requriesAuth: true,
        },
      },
      {
        path: 'activityPage',
        component: () => import('pages/activityPage.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: 'smoPage',
        component: () => import('pages/smoPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'loginPage',
        component: () => import('pages/loginPage.vue'),
        meta: { requiresAuth: false },
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue'),
  },
];

export default routes;
