import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

const session = ref(null)
const ready = ref(false)

// Estado de sessao e global (fora do composable) para que todos os componentes
// compartilhem a mesma referencia.
let initPromise = null

export function initAuth() {
  if (initPromise) return initPromise

  initPromise = supabase.auth.getSession().then(({ data }) => {
    session.value = data.session
    ready.value = true
    supabase.auth.onAuthStateChange((_event, newSession) => {
      session.value = newSession
    })
  })

  return initPromise
}

const MENSAGENS_ERRO = {
  'Invalid login credentials': 'Email ou senha incorretos.',
  'Email not confirmed': 'Email ainda não confirmado no painel do Supabase.',
}

export function useAuth() {
  const user = computed(() => session.value?.user ?? null)
  const isLoggedIn = computed(() => !!session.value)

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) {
      throw new Error(MENSAGENS_ERRO[error.message] ?? error.message)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return { session, user, isLoggedIn, ready, signIn, signOut }
}
