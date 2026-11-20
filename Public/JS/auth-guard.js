/**
 * ============================================================================
 * TaskFlow Authentication — Auth Guard (Proteção de Páginas e Rotas)
 * ============================================================================
 * Responsável pela proteção centralizada de páginas e controle de acesso:
 * - Aguarda a inicialização do Firebase Authentication sem bloquear a renderização
 * - Redireciona usuários não autenticados para fora de páginas protegidas
 * - Exige verificação de e-mail para acesso às áreas privadas do sistema
 * - Redireciona usuários já autenticados para fora das telas de login/cadastro
 *
 * Tecnologias: JavaScript puro (ES Modules) e Firebase SDK oficial.
 */

import { authService } from "./auth-service.js";

/**
 * Remove qualquer overlay residual de forma segura e imediata.
 */
function cleanupVeil() {
  const apply = () => {
    if (document.body) {
      document.body.classList.add("auth-ready");
    }
    const veil = document.getElementById("authGuardVeil");
    if (veil) {
      try {
        veil.remove();
      } catch (e) {
        veil.style.display = "none";
      }
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply, { once: true });
  } else {
    apply();
  }
}

export const authGuard = {
  /**
   * Protege páginas privadas (ex: dashboard.html, atualizar-senha.html).
   * - Redireciona para login se não houver usuário autenticado
   * - Redireciona para verificar-email.html se o e-mail não estiver confirmado
   *
   * @param {{ requireVerified?: boolean, redirectTo?: string }} options
   * @returns {Promise<boolean>} Retorna true se o acesso for autorizado
   */
  async requireAuth({ requireVerified = true, redirectTo = "index.html" } = {}) {
    try {
      const user = await authService.waitForAuthInit(2500);

      if (!user) {
        window.location.replace(redirectTo);
        return false;
      }

      if (requireVerified && !user.emailVerified) {
        window.location.replace("verificar-email.html");
        return false;
      }

      cleanupVeil();
      return true;
    } catch (error) {
      console.warn("AuthGuard requireAuth error:", error);
      window.location.replace(redirectTo);
      return false;
    }
  },

  /**
   * Protege telas públicas de autenticação (ex: index.html/login, cadastro.html, recuperar-senha.html).
   * Se o usuário já estiver autenticado e verificado, redireciona diretamente para o dashboard.
   * Se estiver autenticado mas com e-mail pendente, redireciona para verificar-email.html.
   *
   * @param {{ redirectTo?: string }} options
   * @returns {Promise<boolean>} Retorna true se for um visitante não logado
   */
  async requireGuest({ redirectTo = "dashboard.html" } = {}) {
    try {
      const user = await authService.waitForAuthInit(1500);

      if (user) {
        if (user.emailVerified) {
          window.location.replace(redirectTo);
          return false;
        } else {
          window.location.replace("verificar-email.html");
          return false;
        }
      }
    } catch (error) {
      console.warn("AuthGuard requireGuest error:", error);
    }

    cleanupVeil();
    return true;
  },

  /**
   * Garante acesso exclusivo à tela de verificação de e-mail (verificar-email.html).
   * - Se não houver usuário logado, redireciona para login
   * - Se o usuário já tiver verificado o e-mail, redireciona para dashboard.html
   *
   * @param {{ redirectTo?: string }} options
   * @returns {Promise<boolean>} Retorna true se o usuário tiver verificação pendente
   */
  async requireUnverified({ redirectTo = "dashboard.html" } = {}) {
    try {
      const user = await authService.waitForAuthInit(2000);

      if (!user) {
        window.location.replace("index.html");
        return false;
      }

      if (user.emailVerified) {
        window.location.replace(redirectTo);
        return false;
      }

      cleanupVeil();
      return true;
    } catch (error) {
      console.warn("AuthGuard requireUnverified error:", error);
      window.location.replace("index.html");
      return false;
    }
  }
};
