import './style.css'

// Import dinamico: se faltar .env, o supabase.js lanca — e sem isso a tela
// ficaria simplesmente branca, sem pista do motivo.
try {
  const { createApp } = await import('vue')
  const { default: App } = await import('./App.vue')
  const { default: router } = await import('./router')
  const { initAuth } = await import('./composables/useAuth')
  const { initTheme } = await import('./composables/useTheme')
  const { useConfig } = await import('./composables/useConfig')

  // O script inline do index.html ja pintou o tema certo; aqui so assumimos o
  // controle reativo dele.
  initTheme()

  // SEM await: a cor da casa vem do banco, e travar a montagem numa ida a rede
  // deixaria a tela em branco a cada carregamento. Ela chega em seguida e
  // repinta; o cache faz a segunda visita ja abrir certa.
  useConfig().initConfig()

  // Resolve a sessao antes de montar para o guard de rota nao piscar o login.
  await initAuth()
  createApp(App).use(router).mount('#app')
} catch (e) {
  document.getElementById('app').innerHTML = `
    <div style="font-family:system-ui;max-width:36rem;margin:15vh auto;padding:1.5rem;
                border:1px solid #dcdcd4;border-radius:1rem;background:#fbfbf7">
      <h1 style="margin:0 0 .5rem;font-size:1.1rem;color:#8a2b1f">Erro ao iniciar o Casita</h1>
      <p style="color:#57544e;line-height:1.6">${e.message}</p>
      <p style="color:#8f8b83;font-size:.875rem">Veja o console do navegador para o stack completo.</p>
    </div>`
  throw e
}
