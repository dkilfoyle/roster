import { RouteRecordRaw } from 'vue-router';
import { getAuth } from 'firebase/auth';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () =>
          !!getAuth().currentUser
            ? import('pages/loginPage.vue')
            : import('pages/smoPage.vue'),
      },
      {
        path: 'activityPage',
        component: () => import('pages/activityPage.vue'),
      },
      { path: 'smoPage', component: () => import('pages/smoPage.vue') },
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
