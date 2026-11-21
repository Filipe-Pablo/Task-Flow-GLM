/**
 * ============================================================================
 * TaskFlow Authentication — Auth Guard (Proteção de Rotas e Páginas)
 * ============================================================================
 * Controla e assegura o acesso a cada página do sistema:
 * - Redireciona usuários anônimos para o login ao acessar rotas protegidas
 * - Exige e-mail verificado para o ambiente de trabalho (dashboard)
 * - Redireciona usuários já logados para fora das telas de login/cadastro
 * - Previne exibição indevida de dados privados antes da validação do Firebase
 *
 * Tecnologias: JavaScript puro (ES Modules) e Firebase SDK oficial.
 */

import { authService } from "./auth-service.js";

/**
 * Libera a visualização suave da página após a checagem do guard.
 */
function revealPage() {
  const markReady = () => {
    if (document.body) {
      document.body.classList.add("auth-ready");
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", markReady, { once: true });
  } else {
    markReady();
  }
}

export const authGuard = {
  /**
   * Protege páginas de acesso restrito (ex: dashboard.html, atualizar-senha.html).
   * - Redireciona para o login se não houver usuário autenticado
   * - Redireciona para verificar-email.html caso o e-mail não tenha sido verificado
   *
   * @param {{ requireVerified?: boolean, redirectTo?: string }} options
   * @returns {Promise<boolean>}
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

      revealPage();
      return true;
    } catch (error) {
      console.warn("AuthGuard requireAuth:", error);
      window.location.replace(redirectTo);
      return false;
    }
  },

  /**
   * Protege páginas exclusivas para visitantes (ex: login/index.html, cadastro.html, recuperar-senha.html).
   * Se o usuário já estiver com sessão ativa e e-mail confirmado, redireciona ao dashboard.
   * Se a sessão estiver ativa mas o e-mail pendente, redireciona para verificar-email.html.
   *
   * @param {{ redirectTo?: string }} options
   * @returns {Promise<boolean>}
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
      console.warn("AuthGuard requireGuest:", error);
    }

    revealPage();
    return true;
  },

  /**
   * Permite acesso exclusivamente a usuários com e-mail ainda pendente de verificação.
   * - Redireciona ao login se não houver sessão ativa
   * - Redireciona ao dashboard se o e-mail já foi verificado
   *
   * @param {{ redirectTo?: string }} options
   * @returns {Promise<boolean>}
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

      revealPage();
      return true;
    } catch (error) {
      console.warn("AuthGuard requireUnverified:", error);
      window.location.replace("index.html");
      return false;
    }
  }
};
