/**
 * ============================================================================
 * TaskFlow — Main Application & Authentication Controller (Vanilla JS)
 * ============================================================================
 * Responsável por:
 * 1. Inicialização e interação da interface com os serviços de autenticação
 *    (Login, Cadastro, Recuperação de Senha, Verificação de E-mail, Atualização de Senha).
 * 2. Integração fluida com o software TaskFlow (Dashboard, Tarefas, Perfil, Categorias),
 *    preservando 100% das funcionalidades do software pronto.
 *
 * Tecnologias: JavaScript puro moderno (ES6+, ES Modules), sem frameworks ou libs externas.
 */

import { authService } from "./auth-service.js";
import { getAuthErrorMessage, isTooManyRequestsError } from "./auth-errors.js";

/* ==========================================================================
   SEÇÃO 1: CONTROLADORES DE INTERFACE DE AUTENTICAÇÃO (Auth UI)
   ========================================================================== */

/**
 * Exibe alertas dinâmicos com acessibilidade na área dedicada da página de autenticação.
 * @param {string} message Mensagem a ser exibida
 * @param {'danger'|'success'|'info'} type Tipo do alerta
 */
export function showAuthAlert(message, type = "danger") {
  const alertArea = document.getElementById("authAlertArea");
  if (!alertArea) return;

  const iconSvg =
    type === "success"
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`
      : type === "info"
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

  alertArea.innerHTML = `
    <div class="auth-alert auth-alert--${type}" role="alert">
      <span class="auth-alert__icon">${iconSvg}</span>
      <div class="auth-alert__content">${message}</div>
    </div>
  `;
}

/**
 * Limpa a área de alertas.
 */
export function clearAuthAlert() {
  const alertArea = document.getElementById("authAlertArea");
  if (alertArea) alertArea.innerHTML = "";
}

/**
 * Controla o estado de carregamento e desabilitação de botões para impedir cliques múltiplos.
 * @param {HTMLButtonElement} button
 * @param {boolean} isLoading
 * @param {string} loadingText
 */
export function setButtonLoading(button, isLoading, loadingText = "Processando...") {
  if (!button) return;
  button.disabled = isLoading;

  if (isLoading) {
    button.dataset.originalHtml = button.innerHTML;
    button.innerHTML = `<span class="spinner" aria-hidden="true"></span> <span>${loadingText}</span>`;
  } else if (button.dataset.originalHtml) {
    button.innerHTML = button.dataset.originalHtml;
  }
}

/**
 * Configura botões de exibição/ocultação de senha (show/hide toggle).
 */
function initPasswordToggles() {
  document.querySelectorAll("[data-toggle-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-toggle-target");
      const input = document.getElementById(targetId);
      if (!input) return;

      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      button.setAttribute("aria-label", isPassword ? "Ocultar senha" : "Exibir senha");

      button.innerHTML = isPassword
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
            <line x1="2" x2="22" y1="2" y2="22"/>
          </svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>`;
    });
  });
}

/**
 * Inicializa validação visual dinâmica em tempo real dos requisitos de senha.
 * @param {string} passwordInputId
 * @param {string|null} confirmInputId
 */
function initPasswordChecklist(passwordInputId, confirmInputId = null) {
  const pwdInput = document.getElementById(passwordInputId);
  const confirmInput = confirmInputId ? document.getElementById(confirmInputId) : null;
  const checklist = document.getElementById("passwordRequirements");

  if (!pwdInput || !checklist) return;

  const reqMinLength = document.getElementById("reqMinLength");
  const reqLetter = document.getElementById("reqLetter");
  const reqNumber = document.getElementById("reqNumber");
  const reqMatch = document.getElementById("reqMatch");

  const validate = () => {
    const password = pwdInput.value;
    const confirm = confirmInput ? confirmInput.value : null;
    const res = authService.validatePassword(password, confirm);

    if (reqMinLength) reqMinLength.classList.toggle("valid", res.hasMinLength);
    if (reqLetter) reqLetter.classList.toggle("valid", res.hasLetter);
    if (reqNumber) reqNumber.classList.toggle("valid", res.hasNumber);
    if (reqMatch && confirmInput) {
      reqMatch.classList.toggle("valid", Boolean(confirm && confirm.length > 0 && res.passwordsMatch));
    }
  };

  pwdInput.addEventListener("input", validate);
  if (confirmInput) {
    confirmInput.addEventListener("input", validate);
  }
}

/**
 * Gerenciador de cooldown (controle de frequência para reenvio e recuperação).
 * @param {HTMLButtonElement} button
 * @param {HTMLElement} noticeElement
 * @param {number} seconds
 */
function applyCooldown(button, noticeElement, seconds) {
  let remaining = seconds;
  button.disabled = true;

  if (noticeElement) {
    noticeElement.hidden = false;
  }

  const update = () => {
    if (remaining <= 0) {
      clearInterval(timer);
      button.disabled = false;
      if (noticeElement) {
        noticeElement.textContent = "";
        noticeElement.hidden = true;
      }
    } else {
      if (noticeElement) {
        noticeElement.textContent = `Aguarde ${remaining}s para realizar uma nova tentativa.`;
      }
      remaining--;
    }
  };

  update();
  const timer = setInterval(update, 1000);
}

/**
 * 2.1 Cadastro de Usuário
 */
function initRegisterForm() {
  const form = document.getElementById("registerForm");
  if (!form) return;

  initPasswordChecklist("registerPassword", "registerConfirmPassword");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAuthAlert();

    const email = document.getElementById("registerEmail")?.value.trim();
    const password = document.getElementById("registerPassword")?.value;
    const confirmPassword = document.getElementById("registerConfirmPassword")?.value;
    const submitBtn = document.getElementById("btnRegisterSubmit");

    if (!email || !password || !confirmPassword) {
      showAuthAlert("Preencha todos os campos obrigatórios.");
      return;
    }

    if (!authService.validateEmail(email)) {
      showAuthAlert("Informe um endereço de e-mail válido.");
      return;
    }

    const validation = authService.validatePassword(password, confirmPassword);
    if (!validation.isValid) {
      if (!validation.passwordsMatch) {
        showAuthAlert("As senhas informadas não são iguais.");
      } else {
        showAuthAlert("A senha não atende aos requisitos mínimos de segurança.");
      }
      return;
    }

    setButtonLoading(submitBtn, true, "Criando conta...");

    try {
      const result = await authService.register(email, password);
      showAuthAlert(result.message, "success");

      // Redireciona para verificação de e-mail após 1.5s
      setTimeout(() => {
        window.location.replace("verificar-email.html");
      }, 1500);
    } catch (error) {
      setButtonLoading(submitBtn, false);
      const friendlyMessage = getAuthErrorMessage(error);
      showAuthAlert(friendlyMessage, "danger");
    }
  });
}

/**
 * 2.2 Login de Usuário
 */
function initLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAuthAlert();

    const email = document.getElementById("loginEmail")?.value.trim();
    const password = document.getElementById("loginPassword")?.value;
    const submitBtn = document.getElementById("btnLoginSubmit");

    if (!email || !password) {
      showAuthAlert("Preencha seu e-mail e senha.");
      return;
    }

    if (!authService.validateEmail(email)) {
      showAuthAlert("Informe um endereço de e-mail válido.");
      return;
    }

    setButtonLoading(submitBtn, true, "Entrando...");

    try {
      const { isVerified } = await authService.login(email, password);

      if (!isVerified) {
        showAuthAlert("Seu e-mail ainda não foi verificado. Redirecionando para confirmação...", "info");
        setTimeout(() => {
          window.location.replace("verificar-email.html");
        }, 1200);
      } else {
        showAuthAlert("Autenticação realizada com sucesso! Redirecionando...", "success");
        setTimeout(() => {
          window.location.replace("dashboard.html");
        }, 800);
      }
    } catch (error) {
      setButtonLoading(submitBtn, false);
      const friendlyMessage = getAuthErrorMessage(error);
      showAuthAlert(friendlyMessage, "danger");
    }
  });
}

/**
 * 2.4 Verificação de E-mail
 */
function initEmailVerification() {
  const checkBtn = document.getElementById("btnCheckVerification");
  const resendBtn = document.getElementById("btnResendVerification");
  const logoutBtn = document.getElementById("btnLogoutVerify");
  const emailBadge = document.getElementById("userEmailBadge");
  const cooldownNotice = document.getElementById("cooldownNotice");

  if (!checkBtn && !resendBtn) return;

  // Carregar e-mail do usuário autenticado no badge
  authService.waitForAuthInit().then((user) => {
    if (user && emailBadge) {
      emailBadge.textContent = user.email || "seu e-mail";
    }
  });

  // Botão: Verificar status atualizado via Firebase reload()
  if (checkBtn) {
    checkBtn.addEventListener("click", async () => {
      clearAuthAlert();
      setButtonLoading(checkBtn, true, "Verificando status...");

      try {
        const user = await authService.reloadUser();
        if (user && user.emailVerified) {
          showAuthAlert("E-mail confirmado com sucesso! Redirecionando para o aplicativo...", "success");
          setTimeout(() => {
            window.location.replace("dashboard.html");
          }, 1000);
        } else {
          setButtonLoading(checkBtn, false);
          showAuthAlert(
            "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada e spam e clique no link de ativação.",
            "info"
          );
        }
      } catch (error) {
        setButtonLoading(checkBtn, false);
        showAuthAlert(getAuthErrorMessage(error), "danger");
      }
    });
  }

  // Botão: Reenviar e-mail de verificação com controle de frequência (60s)
  if (resendBtn) {
    resendBtn.addEventListener("click", async () => {
      clearAuthAlert();
      setButtonLoading(resendBtn, true, "Enviando...");

      try {
        await authService.sendVerificationEmail();
        setButtonLoading(resendBtn, false);
        showAuthAlert("Novo e-mail de confirmação enviado! Verifique sua caixa de entrada.", "success");
        applyCooldown(resendBtn, cooldownNotice, 60);
      } catch (error) {
        setButtonLoading(resendBtn, false);
        showAuthAlert(getAuthErrorMessage(error), "danger");
        if (isTooManyRequestsError(error)) {
          applyCooldown(resendBtn, cooldownNotice, 60);
        }
      }
    });
  }

  // Botão: Encerrar sessão
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await authService.logout();
      window.location.replace("index.html");
    });
  }
}

/**
 * 2.5 Recuperação de Senha
 */
function initPasswordResetForm() {
  const form = document.getElementById("resetForm");
  if (!form) return;

  const submitBtn = document.getElementById("btnResetSubmit");
  const cooldownNotice = document.getElementById("cooldownNotice");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAuthAlert();

    const email = document.getElementById("resetEmail")?.value.trim();

    if (!email) {
      showAuthAlert("Informe seu endereço de e-mail.");
      return;
    }

    if (!authService.validateEmail(email)) {
      showAuthAlert("Informe um endereço de e-mail válido.");
      return;
    }

    setButtonLoading(submitBtn, true, "Enviando...");

    try {
      const result = await authService.sendPasswordReset(email);
      setButtonLoading(submitBtn, false);

      // Sempre exibe mensagem genérica de sucesso independente da existência da conta
      showAuthAlert(result.message, "success");
      applyCooldown(submitBtn, cooldownNotice, 60);
    } catch (error) {
      setButtonLoading(submitBtn, false);
      showAuthAlert(getAuthErrorMessage(error), "danger");
      if (isTooManyRequestsError(error)) {
        applyCooldown(submitBtn, cooldownNotice, 60);
      }
    }
  });
}

/**
 * 2.6 Atualização de Senha
 */
function initUpdatePasswordForm() {
  const form = document.getElementById("updatePasswordForm");
  if (!form) return;

  initPasswordChecklist("newPassword", "confirmNewPassword");

  const submitBtn = document.getElementById("btnUpdatePasswordSubmit");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAuthAlert();

    const currentPassword = document.getElementById("currentPassword")?.value;
    const newPassword = document.getElementById("newPassword")?.value;
    const confirmNewPassword = document.getElementById("confirmNewPassword")?.value;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      showAuthAlert("Preencha todos os campos obrigatórios.");
      return;
    }

    const validation = authService.validatePassword(newPassword, confirmNewPassword);
    if (!validation.isValid) {
      if (!validation.passwordsMatch) {
        showAuthAlert("A nova senha e a confirmação não coincidem.");
      } else {
        showAuthAlert("A nova senha não atende aos requisitos mínimos de segurança.");
      }
      return;
    }

    setButtonLoading(submitBtn, true, "Atualizando senha...");

    try {
      await authService.updateUserPassword(newPassword, currentPassword);
      setButtonLoading(submitBtn, false);

      showAuthAlert("Senha atualizada com sucesso!", "success");

      // Limpar campos de senha
      form.reset();
      const checklist = document.getElementById("passwordRequirements");
      if (checklist) {
        checklist.querySelectorAll(".req-item").forEach((item) => item.classList.remove("valid"));
      }

      // Redireciona para o dashboard após 2s
      setTimeout(() => {
        window.location.replace("dashboard.html");
      }, 2000);
    } catch (error) {
      setButtonLoading(submitBtn, false);
      showAuthAlert(getAuthErrorMessage(error), "danger");
    }
  });
}

/* ==========================================================================
   SEÇÃO 2: INTEGRAÇÃO COM O SOFTWARE PRONTO (TaskFlow App)
   ========================================================================== */

/**
 * Inicialização e integração da barra lateral e perfil do TaskFlow com o Firebase Auth
 */
async function initTaskFlowAuthIntegration() {
  const sidebarUserName = document.getElementById("sidebarUserName");
  const sidebarUserEmail = document.getElementById("sidebarUserEmail");
  const avatarSidebar = document.getElementById("avatarSidebar");
  const avatarHeader = document.getElementById("avatarHeader");
  const btnSidebarLogout = document.getElementById("btnSidebarLogout");

  if (!sidebarUserName && !btnSidebarLogout) return;

  const user = await authService.waitForAuthInit();
  if (user) {
    const userEmail = user.email || "usuário@taskflow.app";
    const displayName = user.displayName || userEmail.split("@")[0];
    const initials = displayName.slice(0, 2).toUpperCase();

    if (sidebarUserName) sidebarUserName.textContent = displayName;
    if (sidebarUserEmail) sidebarUserEmail.textContent = userEmail;
    if (avatarSidebar) avatarSidebar.textContent = initials;
    if (avatarHeader) avatarHeader.textContent = initials;
  }

  if (btnSidebarLogout) {
    btnSidebarLogout.addEventListener("click", async () => {
      try {
        await authService.logout();
        window.location.replace("index.html");
      } catch (err) {
        console.error("Erro ao encerrar sessão:", err);
        window.location.replace("index.html");
      }
    });
  }
}

/* ==========================================================================
   SEÇÃO 3: TASKFLOW DASHBOARD WIRING (Views, Tarefas, Categorias, Modais)
   ========================================================================== */

// Mirror de ícones SVG estáticos do TaskFlow
const svg = (d, extra = "") =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${extra}${d}</svg>`;

window.ICONS = window.ICONS || {
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  plusSm: svg('<path d="M12 5v14M5 12h14"/>'),
  x: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
  check: svg('<path d="M20 6 9 17l-5-5"/>'),
  'check-circle': svg('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>'),
  dashboard: svg('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
  tasks: svg('<path d="M21 12a9 9 0 1 1-9-9"/><path d="m9 11 3 3L22 4"/>'),
  calendar: svg('<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>'),
  history: svg('<path d="M3 3v6h6"/><path d="M3.5 12a9 9 0 1 0 2.1-5.8L3 9"/><path d="M12 7v5l4 2"/>'),
  folder: svg('<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-3H4a2 2 0 0 0-2 3v12a2 2 0 0 0 2 2Z"/>'),
  settings: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.36a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.64 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.56 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
  bell: svg('<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>'),
  sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  moon: svg('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>'),
  pencil: svg('<path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>'),
  trash: svg('<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/>'),
  reopen: svg('<path d="M3 3v6h6"/><path d="M3.5 12a9 9 0 1 0 2.1-5.8L3 9"/>'),
  menu: svg('<path d="M3 6h18M3 12h18M3 18h18"/>'),
  list: svg('<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>'),
  grid: svg('<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>'),
  inbox: svg('<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.4 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.4-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.8 1.1Z"/>'),
  alert: svg('<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>'),
  info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>'),
  zap: svg('<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/>'),
  target: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
  chart: svg('<path d="M3 3v18h18"/><path d="m7 15 4-5 3 3 5-7"/>')
};

/**
 * TaskFlow Dashboard Application Controller
 */
const TaskFlowApp = (() => {
  const VIEWS = {
    dashboard:  { title: 'Dashboard Overview' },
    mytasks:    { title: 'Minhas Tarefas' },
    today:      { title: 'Hoje' },
    upcoming:   { title: 'Próximas Tarefas' },
    completed:  { title: 'Concluídas' },
    categories: { title: 'Categorias' },
    profile:    { title: 'Perfil & Segurança' },
    settings:   { title: 'Configurações' }
  };

  let currentView = 'dashboard';
  let editingCategoryId = null;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const initials = (name) =>
    name ? name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || 'TF' : 'TF';

  const syncProfile = () => {
    if (typeof Storage === 'undefined') return;
    const p = Storage.getProfile();
    const currentUser = authService.getCurrentUser();
    const displayName = currentUser?.displayName || p.name;
    const email = currentUser?.email || p.email;

    const sbName = document.getElementById('sidebarUserName');
    if (sbName) sbName.textContent = displayName;

    const sbEmail = document.getElementById('sidebarUserEmail');
    if (sbEmail) sbEmail.textContent = email;

    const greet = document.getElementById('headerGreet');
    if (greet) greet.textContent = `${greeting()}, ${displayName.split(' ')[0]}`;

    const init = initials(displayName);
    const sbAvatar = document.getElementById('avatarSidebar');
    if (sbAvatar) sbAvatar.textContent = init;

    const hdAvatar = document.getElementById('avatarHeader');
    if (hdAvatar) hdAvatar.textContent = init;

    const prof = document.getElementById('profileAvatar');
    if (prof) prof.textContent = init;
  };

  const syncSidebar = () => {
    if (typeof Storage === 'undefined' || typeof Tasks === 'undefined') return;
    const cats = Storage.getCategories();
    const tasks = Tasks.all();
    const wrap = document.getElementById('navCategories');
    if (wrap) {
      wrap.innerHTML = cats
        .map((c) => {
          const count = tasks.filter((t) => t.category === c.id && t.status !== 'completed').length;
          return `<a href="#categories" class="nav-cat" data-action="filter-cat" data-id="${c.id}">
            <span class="cat-dot" style="background:${c.color}"></span>
            <span>${Tasks.escapeHTML(c.name)}</span>
            <span class="nav-badge" style="margin-left:auto">${count}</span>
          </a>`;
        })
        .join('');
    }

    const open = tasks.filter((t) => t.status !== 'completed');
    const badges = {
      mytasks: open.length,
      today: open.filter((t) => Tasks.isToday(t) || Tasks.isOverdue(t)).length,
      upcoming: open.filter((t) => t.dueDate && Tasks.daysBetween(t.dueDate) > 0).length,
      completed: tasks.filter((t) => t.status === 'completed').length
    };
    document.querySelectorAll('[data-badge]').forEach((el) => {
      const v = badges[el.dataset.badge];
      if (v !== undefined) el.textContent = v;
    });

    const urgent = badges.today > 0;
    const dot = document.getElementById('notifDot');
    if (dot) dot.hidden = !urgent;
  };

  const navigate = (view, opts = {}) => {
    if (!VIEWS[view]) view = 'dashboard';
    currentView = view;
    location.hash = view;

    document.querySelectorAll('.nav-item').forEach((n) =>
      n.classList.toggle('active', n.dataset.view === view));

    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) pageTitle.textContent = VIEWS[view].title;

    const content = document.getElementById('appContent');
    if (content && RENDERERS[view]) {
      content.innerHTML = RENDERERS[view](opts);
      wireView(content);
      content.scrollTop = 0;
    }
  };

  const refresh = () => {
    syncSidebar();
    syncProfile();
    navigate(currentView, { keep: true });
  };

  const rerenderView = () => {
    const content = document.getElementById('appContent');
    if (content && RENDERERS[currentView]) {
      content.innerHTML = RENDERERS[currentView]();
      wireView(content);
    }
  };

  const statCard = (label, value, icon, variant, footer) => `
    <div class="stat-card">
      <div class="stat-card__top">
        <span class="stat-card__label">${label}</span>
        <span class="stat-icon stat-icon--${variant}">${icon}</span>
      </div>
      <span class="stat-card__value">${value}</span>
      <div class="stat-card__footer">${footer || ''}</div>
    </div>`;

  const RENDERERS = {
    dashboard() {
      if (typeof Tasks === 'undefined' || typeof Storage === 'undefined') return '';
      const tasks = Tasks.all();
      const open = tasks.filter((t) => t.status !== 'completed');
      const done = tasks.filter((t) => t.status === 'completed');
      const overdue = tasks.filter(Tasks.isOverdue);
      const dueToday = open.filter((t) => Tasks.isToday(t));
      const pct = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;
      const addedWeek = tasks.filter((t) => t.createdAt && Tasks.daysBetween(t.createdAt) >= -7).length;
      const urgent = overdue.length + dueToday.length;
      const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', month: 'long', day: 'numeric' });

      const ring = `
        <svg width="52" height="52" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r="22" fill="none" stroke="var(--hover)" stroke-width="5"/>
          <circle cx="26" cy="26" r="22" fill="none" stroke="${pct >= 70 ? 'var(--success)' : 'var(--primary)'}"
            stroke-width="5" stroke-linecap="round"
            stroke-dasharray="${2 * Math.PI * 22}" stroke-dashoffset="${2 * Math.PI * 22 * (1 - pct / 100)}"/>
        </svg><span class="velocity__pct">${pct}%</span>`;

      const recent = [...tasks]
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
        .slice(0, 5);

      const cats = Storage.getCategories().map((c) => {
        const all = tasks.filter((t) => t.category === c.id);
        const ok = all.filter((t) => t.status === 'completed').length;
        return { ...c, total: all.length, done: ok, pct: all.length ? Math.round((ok / all.length) * 100) : 0 };
      }).filter((c) => c.total > 0);

      const userName = authService.getCurrentUser()?.displayName || Storage.getProfile().name;

      return `
        <section class="welcome-banner">
          <div class="welcome-banner__main">
            <span class="welcome-banner__tag">Espaço de Trabalho Ativo</span>
            <h2>${greeting()}, ${userName.split(' ')[0]}!</h2>
            <p class="welcome-banner__sub">${today} — Aqui está o resumo das suas tarefas.
              Você possui <strong>${urgent} ${urgent === 1 ? 'prazo urgente' : 'prazos urgentes'}</strong> e sua
              taxa de conclusão está em <strong>${pct}%</strong>.</p>
          </div>
          <div class="welcome-banner__extra" style="display:flex;align-items:center;gap:14px">
            <div class="velocity">
              <div>
                <div class="velocity__label">Conclusão</div>
                <div class="velocity__value">${done.length}/${tasks.length}</div>
              </div>
              <div class="velocity__ring">${ring}</div>
            </div>
            <button class="btn btn--primary" data-action="open-create">${window.ICONS.plus} Nova Tarefa</button>
          </div>
        </section>

        <div class="stats-grid">
          ${statCard('Total de Tarefas', tasks.length, window.ICONS.tasks, 'primary',
            `<span class="stat-note"><strong>+${addedWeek}</strong> adicionadas nesta semana</span>`)}
          ${statCard('Concluídas', done.length, window.ICONS['check-circle'], 'success',
            `<span class="progress"><span class="progress__bar progress__bar--success" style="width:${pct}%"></span></span>
             <span class="stat-note">${pct}%</span>`)}
          ${statCard('Em Andamento', tasks.filter((t) => t.status === 'inprogress').length, window.ICONS.clock, 'warning',
            `<span class="stat-note">${dueToday.length} para hoje</span>`)}
          ${statCard('Atrasadas', overdue.length, window.ICONS.alert, 'danger',
            `<span class="stat-note">${overdue.length ? 'Atenção imediata' : 'Tudo em dia!'}</span>`)}
        </div>

        <div class="panel" style="margin-bottom:16px">
          <div class="view-head" style="margin-bottom:12px">
            <h2 style="font-size:15px">Resumo por Categoria</h2>
            <span class="stat-note">${pct}% das tarefas concluídas</span>
          </div>
          ${cats.length ? cats.map((c) => `
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
              <span class="cat-dot" style="background:${c.color}"></span>
              <span style="width:110px;font-weight:600;font-size:13px">${Tasks.escapeHTML(c.name)}</span>
              <span class="progress"><span class="progress__bar" style="width:${c.pct}%"></span></span>
              <span class="stat-note" style="width:64px;text-align:right">${c.done}/${c.total}</span>
            </div>`).join('')
          : '<p class="stat-note">Nenhuma categoria com tarefas no momento.</p>'}
        </div>

        <div class="panel">
          <div class="view-head" style="margin-bottom:12px">
            <h2 style="font-size:15px">Tarefas Recentes</h2>
            <button class="btn btn--ghost btn--sm" data-nav="mytasks">Ver todas</button>
          </div>
          ${Tasks.renderList(recent, {
            mode: Filters.state.view,
            emptyTitle: 'Nenhuma tarefa ainda',
            emptyText: 'Clique em "Nova Tarefa" para começar.'
          })}
        </div>`;
    },

    mytasks() {
      const tasks = Tasks.all();
      const counts = Filters.countByStatus(tasks);
      const filtered = Filters.apply(tasks);
      const cats = Storage.getCategories();
      const f = Filters.state;

      const chip = (key, label) =>
        `<button class="chip ${f.status === key ? 'active' : ''}" data-chip="${key}">${label} (${counts[key]})</button>`;

      return `
        <div class="toolbar">
          <div class="toolbar__title">
            <h3>${window.ICONS.list} Tarefas</h3>
            <span class="badge badge--primary">${counts.all - counts.completed} pendentes</span>
          </div>
          <div class="search-box">
            <span class="search-box__icon">${window.ICONS.search}</span>
            <input type="search" id="localSearch" class="search-box__input" placeholder="Pesquisar tarefas..." value="${Tasks.escapeHTML(f.search)}">
          </div>
          <select class="select-inline" id="sortSelect" aria-label="Ordenar por">
            <option value="duedate" ${f.sort === 'duedate' ? 'selected' : ''}>Ordenar: Data de Entrega</option>
            <option value="priority" ${f.sort === 'priority' ? 'selected' : ''}>Ordenar: Prioridade</option>
            <option value="created" ${f.sort === 'created' ? 'selected' : ''}>Ordenar: Adicionadas Recentemente</option>
            <option value="title" ${f.sort === 'title' ? 'selected' : ''}>Ordenar: Título</option>
          </select>
          <div class="view-toggle" role="group" aria-label="Modo de visualização">
            <button data-viewmode="list" class="${f.view === 'list' ? 'active' : ''}" aria-label="Visualização em Lista">${window.ICONS.list}</button>
            <button data-viewmode="cards" class="${f.view === 'cards' ? 'active' : ''}" aria-label="Visualização em Cartões">${window.ICONS.grid}</button>
          </div>
        </div>

        <div class="toolbar">
          <div class="chips">
            ${chip('all', 'Todas')}
            ${chip('todo', 'A Fazer')}
            ${chip('inprogress', 'Em Andamento')}
            ${chip('completed', 'Concluídas')}
          </div>
          <span style="flex:1"></span>
          <div class="chips-tags">
            <span class="chips-label">PRIORIDADE</span>
            <select class="select-inline" id="priorityFilter" aria-label="Filtrar por prioridade">
              <option value="all" ${f.priority === 'all' ? 'selected' : ''}>Todas</option>
              <option value="low" ${f.priority === 'low' ? 'selected' : ''}>Baixa</option>
              <option value="medium" ${f.priority === 'medium' ? 'selected' : ''}>Média</option>
              <option value="high" ${f.priority === 'high' ? 'selected' : ''}>Alta</option>
            </select>
            <span class="chips-label">CATEGORIA</span>
            <select class="select-inline" id="categoryFilter" aria-label="Filtrar por categoria">
              <option value="all" ${f.category === 'all' ? 'selected' : ''}>Todas</option>
              ${cats.map((c) => `<option value="${c.id}" ${f.category === c.id ? 'selected' : ''}>${Tasks.escapeHTML(c.name)}</option>`).join('')}
            </select>
          </div>
        </div>

        ${Tasks.renderList(filtered, { emptyTitle: 'Nenhuma tarefa encontrada', emptyText: 'Tente ajustar os filtros ou criar uma nova tarefa.' })}`;
    },

    today() {
      const open = Tasks.all().filter((t) => t.status !== 'completed');
      const overdue = open.filter(Tasks.isOverdue);
      const dueToday = open.filter((t) => Tasks.isToday(t));
      const total = overdue.length + dueToday.length;
      const doneToday = Tasks.all().filter(
        (t) => t.status === 'completed' && t.completedAt === Tasks.todayISO()
      ).length;
      const pct = total ? Math.round((doneToday / (total + doneToday)) * 100) : (total ? 0 : 100);

      return `
        <div class="panel" style="margin-bottom:16px">
          <div class="view-head" style="margin-bottom:10px">
            <div>
              <h2 style="font-size:15px">Progresso Diário</h2>
              <p>${new Date().toLocaleDateString('pt-BR', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
            <span class="badge badge--primary">${pct}% concluído</span>
          </div>
          <div class="progress" style="height:9px">
            <span class="progress__bar ${pct >= 100 ? 'progress__bar--success' : ''}" style="width:${pct}%"></span>
          </div>
          <p class="stat-note" style="margin-top:8px">${doneToday} concluídas hoje · ${total} restantes</p>
        </div>

        ${overdue.length ? `
          <h4 class="group-title"><span class="badge badge--danger">${overdue.length} atrasadas</span> Atrasadas</h4>
          ${Tasks.renderList(overdue, { emptyTitle: '', emptyText: '' })}` : ''}
        <h4 class="group-title"><span class="badge badge--primary">${dueToday.length}</span> Para Hoje</h4>
        ${Tasks.renderList(dueToday, { emptyTitle: 'Nada agendado para hoje', emptyText: 'Aproveite seu dia ou veja tarefas futuras.' })}`;
    },

    upcoming() {
      const open = Tasks.all().filter(
        (t) => t.status !== 'completed' && t.dueDate && Tasks.daysBetween(t.dueDate) > 0
      );
      const groups = { 'Amanhã': [], 'Esta Semana': [], 'Mais Tarde': [] };
      open.forEach((t) => {
        const d = Tasks.daysBetween(t.dueDate);
        if (d === 1) groups['Amanhã'].push(t);
        else if (d <= 7) groups['Esta Semana'].push(t);
        else groups['Mais Tarde'].push(t);
      });

      const html = Object.entries(groups)
        .filter(([, list]) => list.length)
        .map(([label, list]) => `
          <h4 class="group-title">${label} <span class="group-count">${list.length}</span></h4>
          ${Tasks.renderList(list)}`)
        .join('');

      return html || Tasks.emptyState('Nenhuma tarefa próxima', 'Tarefas com prazos futuros aparecerão aqui.');
    },

    completed() {
      const done = Tasks.all()
        .filter((t) => t.status === 'completed')
        .sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));
      return `
        <div class="toolbar">
          <div class="toolbar__title">
            <h3>${window.ICONS['check-circle']} Histórico de Tarefas</h3>
            <span class="badge badge--success">${done.length} concluídas</span>
          </div>
        </div>
        ${Tasks.renderList(done, { emptyTitle: 'Nenhuma tarefa concluída', emptyText: 'Tarefas concluídas aparecerão aqui com a data de conclusão.' })}`;
    },

    categories() {
      const cats = Storage.getCategories();
      const tasks = Tasks.all();
      return `
        <div class="view-head">
          <div>
            <h2>Categorias</h2>
            <p>Organize suas tarefas por projeto ou contexto.</p>
          </div>
          <button class="btn btn--primary" data-action="new-category">${window.ICONS.plusSm} Nova Categoria</button>
        </div>

        <div class="panel" id="categoryFormPanel" hidden style="margin-bottom:16px">
          <div class="field" style="margin-bottom:10px">
            <label class="field__label" for="catNameInput">Nome da Categoria</label>
            <input class="input" id="catNameInput" maxlength="24" placeholder="Ex: Engenharia">
          </div>
          <div class="field" style="margin-bottom:14px">
            <span class="field__label">Cor</span>
            <div class="color-options" id="catColorOptions">
              ${['#7C5CFC', '#2ECC71', '#F4B740', '#F16C6C', '#4BA3F4', '#F07CB4'].map((c, i) =>
                `<button type="button" class="color-option ${i === 0 ? 'selected' : ''}" style="background:${c}" data-color="${c}" aria-label="Cor ${c}"></button>`).join('')}
            </div>
          </div>
          <div style="display:flex;gap:8px;justify-content:flex-end">
            <button class="btn btn--ghost" data-action="cancel-category">Cancelar</button>
            <button class="btn btn--primary" data-action="save-category">${window.ICONS.plusSm} Salvar Categoria</button>
          </div>
        </div>

        <div class="cat-grid">
          ${cats.map((c) => {
            const all = tasks.filter((t) => t.category === c.id);
            const open = all.filter((t) => t.status !== 'completed').length;
            const pct = all.length ? Math.round(((all.length - open) / all.length) * 100) : 0;
            return `
              <div class="cat-card">
                <div class="cat-card__header">
                  <span class="cat-dot" style="background:${c.color};width:12px;height:12px"></span>
                  <h3 class="cat-card__title">${Tasks.escapeHTML(c.name)}</h3>
                  <div class="cat-card__actions">
                    <button class="icon-btn icon-btn--sm" data-action="edit-category" data-id="${c.id}" aria-label="Editar categoria">${window.ICONS.pencil}</button>
                    <button class="icon-btn icon-btn--sm link-danger" data-action="delete-category" data-id="${c.id}" aria-label="Excluir categoria">${window.ICONS.trash}</button>
                  </div>
                </div>
                <div class="cat-card__meta">${open} tarefas abertas · ${all.length} total</div>
                <div class="progress" style="margin-top:12px">
                  <span class="progress__bar" style="width:${pct}%;background:${c.color}"></span>
                </div>
              </div>`;
          }).join('')}
        </div>`;
    },

    profile() {
      const p = Storage.getProfile();
      const currentUser = authService.getCurrentUser();
      const email = currentUser?.email || p.email;
      const displayName = currentUser?.displayName || p.name;
      const isVerified = currentUser?.emailVerified;
      const tasks = Tasks.all();
      const done = tasks.filter((t) => t.status === 'completed').length;

      return `
        <div class="profile-card">
          <div class="profile-head">
            <span class="avatar" id="profileAvatar">${initials(displayName)}</span>
            <div>
              <h3>${Tasks.escapeHTML(displayName)}</h3>
              <p>${Tasks.escapeHTML(p.role)}</p>
            </div>
          </div>

          <div class="stats-grid" style="margin-bottom:22px;grid-template-columns:repeat(2,1fr)">
            ${statCard('Total de Tarefas', tasks.length, window.ICONS.tasks, 'primary', '')}
            ${statCard('Tarefas Concluídas', done, window.ICONS['check-circle'], 'success', '')}
          </div>

          <!-- Seção de Segurança do Firebase Authentication -->
          <div class="panel" style="margin-bottom:20px; background:var(--secondary);">
            <h4 style="margin-bottom:12px; font-size:14px; display:flex; align-items:center; gap:8px;">
              <span>Segurança da Conta (Firebase Auth)</span>
              ${isVerified ? '<span class="badge badge--success">E-mail Verificado</span>' : '<span class="badge badge--warning">Verificação Pendente</span>'}
            </h4>
            <div style="font-size:13px; color:var(--text-2); margin-bottom:14px;">
              Autenticado como: <strong>${Tasks.escapeHTML(email)}</strong>
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <a href="atualizar-senha.html" class="btn btn--primary btn--sm" style="display:inline-flex; align-items:center; gap:6px;">
                ${window.ICONS.settings} Alterar Senha
              </a>
              <button class="btn btn--ghost btn--sm" id="btnProfileLogout" style="color:var(--danger);">
                ${window.ICONS.x} Encerrar Sessão
              </button>
            </div>
          </div>

          <div class="field">
            <label class="field__label" for="profileName">Nome de Exibição</label>
            <input class="input" id="profileName" value="${Tasks.escapeHTML(displayName)}" maxlength="40">
          </div>
          <div class="field">
            <label class="field__label" for="profileEmail">E-mail Cadastrado</label>
            <input class="input" id="profileEmail" type="email" value="${Tasks.escapeHTML(email)}" maxlength="60" readonly style="opacity:0.8; cursor:not-allowed;">
          </div>
          <div class="field">
            <label class="field__label" for="profileRole">Cargo ou Função</label>
            <input class="input" id="profileRole" value="${Tasks.escapeHTML(p.role)}" maxlength="40">
          </div>
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px">
            <button class="btn btn--primary" data-action="save-profile">${window.ICONS.check} Salvar Alterações</button>
          </div>
        </div>`;
    },

    settings() {
      const t = typeof Theme !== 'undefined' ? Theme.get() : 'dark';
      return `
        <div class="settings-card">
          <h3>Aparência</h3>
          <p>Selecione o tema para a interface.</p>
          <div class="theme-cards">
            <button class="theme-card ${t === 'dark' ? 'active' : ''}" data-theme="dark" data-action="set-theme">
              <span class="theme-preview theme-preview--dark"><span></span><span></span><span></span></span>
              <span class="theme-card__label">${window.ICONS.moon} Modo Escuro</span>
            </button>
            <button class="theme-card ${t === 'light' ? 'active' : ''}" data-theme="light" data-action="set-theme">
              <span class="theme-preview theme-preview--light"><span></span><span></span><span></span></span>
              <span class="theme-card__label">${window.ICONS.sun} Modo Claro</span>
            </button>
          </div>
        </div>`;
    }
  };

  const wireView = (container) => {
    const sort = container.querySelector('#sortSelect');
    if (sort) {
      sort.addEventListener('change', () => {
        Filters.state.sort = sort.value;
        rerenderView();
      });
    }

    const pf = container.querySelector('#priorityFilter');
    if (pf) {
      pf.addEventListener('change', () => {
        Filters.state.priority = pf.value;
        rerenderView();
      });
    }

    const cf = container.querySelector('#categoryFilter');
    if (cf) {
      cf.addEventListener('change', () => {
        Filters.state.category = cf.value;
        rerenderView();
      });
    }

    const ls = container.querySelector('#localSearch');
    if (ls) {
      ls.addEventListener('input', () => {
        Filters.state.search = ls.value;
        rerenderView();
      });
    }

    const profLogout = container.querySelector('#btnProfileLogout');
    if (profLogout) {
      profLogout.addEventListener('click', async () => {
        await authService.logout();
        window.location.replace('index.html');
      });
    }
  };

  const openCategoryForm = (id) => {
    editingCategoryId = id;
    const panel = document.getElementById('categoryFormPanel');
    if (!panel) return;
    panel.hidden = false;
    const inp = document.getElementById('catNameInput');
    const titleBtn = panel.querySelector('[data-action="save-category"]');

    if (id) {
      const c = Storage.getCategories().find((x) => x.id === id);
      if (c) {
        inp.value = c.name;
        selectColor(c.color);
        if (titleBtn) titleBtn.innerHTML = `${window.ICONS.check} Atualizar Categoria`;
      }
    } else {
      inp.value = '';
      selectColor('#7C5CFC');
      if (titleBtn) titleBtn.innerHTML = `${window.ICONS.plusSm} Criar Categoria`;
    }
    inp.focus();
  };

  const selectColor = (color) => {
    document.querySelectorAll('#catColorOptions .color-option').forEach((b) => {
      b.classList.toggle('selected', b.dataset.color === color);
    });
  };

  const saveCategoryForm = () => {
    const inp = document.getElementById('catNameInput');
    const name = inp ? inp.value.trim() : '';
    if (!name) {
      Tasks.toast('Informe o nome da categoria', 'warning');
      return;
    }
    const sel = document.querySelector('#catColorOptions .color-option.selected');
    const color = sel ? sel.dataset.color : '#7C5CFC';

    if (editingCategoryId) {
      Tasks.updateCategory(editingCategoryId, { name, color });
    } else {
      Tasks.createCategory({ name, color });
    }
    editingCategoryId = null;
    const panel = document.getElementById('categoryFormPanel');
    if (panel) panel.hidden = true;
    refresh();
  };

  const bindGlobal = () => {
    const sidebarNav = document.getElementById('sidebarNav');
    if (sidebarNav) {
      sidebarNav.addEventListener('click', (e) => {
        const nav = e.target.closest('.nav-item');
        if (!nav || !nav.dataset.view) return;
        e.preventDefault();
        navigate(nav.dataset.view);
        closeDrawer();
      });
    }

    const navCats = document.getElementById('navCategories');
    if (navCats) {
      navCats.addEventListener('click', (e) => {
        const cat = e.target.closest('.nav-cat');
        if (!cat) return;
        e.preventDefault();
        Filters.state.category = cat.dataset.id;
        Filters.state.status = 'all';
        navigate('mytasks');
        closeDrawer();
      });
    }

    document.addEventListener('click', (e) => {
      const el = e.target.closest('[data-action], [data-nav], [data-chip], [data-viewmode], [data-color]');
      if (!el) return;

      if (!e.target.closest('#notifPanel') && !e.target.closest('#btnNotifications')) {
        const np = document.getElementById('notifPanel');
        if (np) np.hidden = true;
      }

      const act = el.dataset.action;

      if (el.dataset.color) { selectColor(el.dataset.color); return; }
      if (act === 'open-create') { Tasks.openModal(null); return; }
      if (act === 'close-modal') { Tasks.closeModal(); return; }
      if (act === 'submit-task') { Tasks.submitModal(); return; }
      if (act === 'modal-delete') { Tasks.modalDelete(); return; }
      if (act === 'goto-profile') { navigate('profile'); closeDrawer(); return; }
      if (act === 'goto-categories') { Filters.state.category = 'all'; navigate('categories'); return; }
      if (act === 'toggle-notifications') {
        const panel = document.getElementById('notifPanel');
        if (panel) panel.hidden = !panel.hidden;
        return;
      }

      if (act === 'toggle-task') { Tasks.toggleComplete(el.dataset.id); return; }
      if (act === 'edit-task') { Tasks.openModal(el.dataset.id); return; }
      if (act === 'delete-task') { Tasks.deleteTask(el.dataset.id); return; }
      if (act === 'retry-fetch') { Tasks.retry(); return; }

      if (act === 'set-theme') { Theme.set(el.dataset.theme); rerenderView(); return; }
      if (act === 'new-category') { openCategoryForm(null); return; }
      if (act === 'edit-category') { openCategoryForm(el.dataset.id); return; }
      if (act === 'cancel-category') {
        editingCategoryId = null;
        const panel = document.getElementById('categoryFormPanel');
        if (panel) panel.hidden = true;
        return;
      }
      if (act === 'save-category') { saveCategoryForm(); return; }
      if (act === 'delete-category') {
        if (Tasks.deleteCategory(el.dataset.id)) TaskFlowApp.refresh();
        return;
      }
      if (act === 'filter-cat') {
        Filters.state.category = el.dataset.id;
        Filters.state.status = 'all';
        navigate('mytasks');
        return;
      }
      if (act === 'save-profile') {
        const name = document.getElementById('profileName')?.value.trim();
        const role = document.getElementById('profileRole')?.value.trim();
        if (!name) { Tasks.toast('Informe um nome', 'warning'); return; }
        Storage.saveProfile({ name, role });
        syncProfile();
        Tasks.toast('Perfil atualizado com sucesso!', 'success');
        return;
      }
      if (el.dataset.chip) {
        Filters.state.status = el.dataset.chip;
        rerenderView();
        return;
      }
      if (el.dataset.viewmode) {
        Filters.state.view = el.dataset.viewmode;
        const prefs = Storage.getPrefs();
        prefs.viewMode = Filters.state.view;
        Storage.savePrefs(prefs);
        rerenderView();
        return;
      }
      if (el.dataset.nav) {
        navigate(el.dataset.nav);
        const np = document.getElementById('notifPanel');
        if (np) np.hidden = true;
        return;
      }
    });

    const statusGroup = document.getElementById('taskStatusGroup');
    if (statusGroup) {
      statusGroup.addEventListener('click', (e) => {
        const btn = e.target.closest('.segmented__btn');
        if (!btn) return;
        Tasks.setModalStatus(btn.dataset.status);
      });
    }

    const taskModal = document.getElementById('taskModal');
    if (taskModal) {
      taskModal.addEventListener('click', (e) => {
        if (e.target.id === 'taskModal') Tasks.closeModal();
      });
    }

    const gs = document.getElementById('globalSearch');
    if (gs) {
      gs.addEventListener('input', () => {
        Filters.state.search = gs.value;
        if (currentView !== 'mytasks') navigate('mytasks');
        else rerenderView();
      });
    }

    const btnMenu = document.getElementById('btnMenu');
    if (btnMenu) {
      btnMenu.addEventListener('click', () => {
        document.getElementById('sidebar')?.classList.add('open');
        document.getElementById('sidebarOverlay')?.classList.add('show');
      });
    }

    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) {
      overlay.addEventListener('click', closeDrawer);
    }
  };

  const closeDrawer = () => {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebarOverlay')?.classList.remove('show');
  };

  const init = () => {
    if (typeof Storage !== 'undefined') Storage.init();
    if (typeof Theme !== 'undefined') Theme.init();

    document.querySelectorAll('[data-icon]').forEach((el) => {
      el.innerHTML = window.ICONS[el.dataset.icon] || '';
    });

    if (typeof Filters !== 'undefined' && typeof Storage !== 'undefined') {
      Filters.state.view = Storage.getPrefs().viewMode || 'list';
    }

    syncSidebar();
    syncProfile();
    bindGlobal();

    const start = (location.hash || '#dashboard').slice(1);
    navigate(VIEWS[start] ? start : 'dashboard');

    window.addEventListener('hashchange', () => {
      const v = location.hash.slice(1);
      if (VIEWS[v] && v !== currentView) navigate(v);
    });

    if (typeof Tasks !== 'undefined' && typeof Tasks.init === 'function') {
      Tasks.init();
    }
  };

  return { init, navigate, refresh, rerenderView };
})();

/* ==========================================================================
   SEÇÃO 4: INICIALIZAÇÃO AUTOMÁTICA CONFORME A PÁGINA
   ========================================================================== */
function bootstrap() {
  // Inicializa recursos globais de formulário de autenticação
  initPasswordToggles();
  initLoginForm();
  initRegisterForm();
  initPasswordResetForm();
  initEmailVerification();
  initUpdatePasswordForm();

  // Se estiver na tela do Dashboard (TaskFlow pronto)
  if (document.getElementById("appContent")) {
    TaskFlowApp.init();
    initTaskFlowAuthIntegration();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}

window.App = TaskFlowApp;
export { TaskFlowApp as App };
