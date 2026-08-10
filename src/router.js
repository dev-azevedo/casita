import { createRouter, createWebHistory } from 'vue-router'
import { useAuth, initAuth } from './composables/useAuth'
import PortalView from './views/PortalView.vue'
import PresentesView from './views/PresentesView.vue'
import HomeView from './views/HomeView.vue'
import LoginView from './views/LoginView.vue'

/**
 * `/` deixou de ser o painel: quem abre o app e, quase sempre, um convidado com
 * o link no WhatsApp. Ele cai no portal e escolhe. O painel do casal vive em
 * /painel e continua sendo a unica rota com meta.requiresAuth.
 */
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'portal', component: PortalView },
    { path: '/presentes', name: 'presentes', component: PresentesView },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/painel', name: 'painel', component: HomeView, meta: { requiresAuth: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  await initAuth()
  const { isLoggedIn } = useAuth()

  if (to.meta.requiresAuth && !isLoggedIn.value) return { name: 'login' }
  if (to.name === 'login' && isLoggedIn.value) return { name: 'painel' }
  return true
})

export default router
