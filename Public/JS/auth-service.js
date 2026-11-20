/**
 * ============================================================================
 * TaskFlow Authentication — Authentication Service
 * ============================================================================
 * Centraliza todas as operações do Firebase Authentication:
 * - Cadastro com envio automático de e-mail de verificação
 * - Login com validação de e-mail confirmado
 * - Encerramento de sessão (Logout)
 * - Verificação de e-mail e reenvio com controle de frequência
 * - Recuperação de senha com proteção contra enumeração
 * - Atualização de senha e reautenticação segura
 * - Monitoramento de sessão com onAuthStateChanged
 *
 * Tecnologias: JavaScript puro (ES Modules) e Firebase SDK oficial.
 */

import { auth } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
  reload
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import { getAuthErrorMessage } from "./auth-errors.js";

// Estado de inicialização do Firebase Auth (resolvido na primeira emissão de onAuthStateChanged)
let authInitializedPromise = null;

export const authService = {
  /**
   * Promessa que resolve quando o Firebase Auth carrega o estado de persistência.
   * Possui timeout de segurança para evitar qualquer loading infinito caso a conexão
   * com o serviço esteja lenta ou indisponível.
   *
   * @param {number} timeoutMs Tempo máximo de espera em milissegundos (padrão: 2500ms)
   * @returns {Promise<import("https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js").User|null>}
   */
  waitForAuthInit(timeoutMs = 2500) {
    if (!authInitializedPromise) {
      authInitializedPromise = new Promise((resolve) => {
        let settled = false;

        // Fallback de timeout: garante que a aplicação nunca fique presa em loading infinito
        const timer = setTimeout(() => {
          if (!settled) {
            settled = true;
            resolve(auth.currentUser || null);
          }
        }, timeoutMs);

        try {
          const unsubscribe = onAuthStateChanged(
            auth,
            (user) => {
              if (!settled) {
                settled = true;
                clearTimeout(timer);
                resolve(user);
              }
              unsubscribe();
            },
            (error) => {
              console.warn("Aviso na inicialização do estado de autenticação:", error);
              if (!settled) {
                settled = true;
                clearTimeout(timer);
                resolve(auth.currentUser || null);
              }
            }
          );
        } catch (err) {
          console.warn("Erro ao registrar observador de autenticação:", err);
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve(auth.currentUser || null);
          }
        }
      });
    }
    return authInitializedPromise;
  },

  /**
   * Monitora alterações contínuas no estado de autenticação.
   * @param {function(import("https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js").User|null): void} callback
   * @returns {function(): void} Função para cancelar a inscrição
   */
  subscribeAuthState(callback) {
    return onAuthStateChanged(auth, callback);
  },

  /**
   * Retorna o usuário atualmente autenticado (se houver).
   * @returns {import("https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js").User|null}
   */
  getCurrentUser() {
    return auth.currentUser;
  },

  /**
   * Valida o formato de um endereço de e-mail.
   * @param {string} email
   * @returns {boolean}
   */
  validateEmail(email) {
    if (!email || typeof email !== "string") return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return re.test(email.trim());
  },

  /**
   * Valida as regras mínimas de senha:
   * - Pelo menos 8 caracteres
   * - Pelo menos uma letra (maiúscula ou minúscula)
   * - Pelo menos um número
   * - Permite caracteres especiais
   * - Verifica confirmação de senha quando informada
   *
   * @param {string} password Senha a ser validada
   * @param {string|null} confirmPassword Confirmação opcional
   * @returns {{
   *   isValid: boolean,
   *   hasMinLength: boolean,
   *   hasLetter: boolean,
   *   hasNumber: boolean,
   *   passwordsMatch: boolean
   * }}
   */
  validatePassword(password, confirmPassword = null) {
    const pwd = password || "";
    const hasMinLength = pwd.length >= 8;
    const hasLetter = /[A-Za-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const passwordsMatch = confirmPassword !== null ? pwd === confirmPassword : true;

    const isValid = hasMinLength && hasLetter && hasNumber && passwordsMatch;

    return {
      isValid,
      hasMinLength,
      hasLetter,
      hasNumber,
      passwordsMatch
    };
  },

  /**
   * Cadastra um novo usuário no Firebase Authentication.
   * - Envia automaticamente o e-mail de verificação
   * - Preserva a privacidade: nunca revela se o e-mail já existe
   *
   * @param {string} email E-mail do usuário
   * @param {string} password Senha do usuário
   * @returns {Promise<{ success: boolean, user?: object, message: string }>}
   */
  async register(email, password) {
    const cleanEmail = (email || "").trim();
    if (!this.validateEmail(cleanEmail)) {
      throw new Error("Verifique o endereço de e-mail informado.");
    }

    const validation = this.validatePassword(password);
    if (!validation.isValid) {
      throw new Error("A senha não atende aos requisitos mínimos de segurança.");
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      // Envia automaticamente e-mail de verificação
      try {
        await sendEmailVerification(user);
      } catch (verificationError) {
        console.warn("Aviso ao enviar e-mail de verificação:", verificationError?.code || verificationError);
      }

      return {
        success: true,
        user,
        message: "Cadastro realizado com sucesso! Enviamos as instruções de verificação para o seu e-mail."
      };
    } catch (error) {
      // Regra de privacidade fundamental: se o e-mail já estiver cadastrado, não confirmar sua existência
      if (error?.code === "auth/email-already-in-use") {
        return {
          success: true,
          message: "Se houver elegibilidade para esta conta, as instruções foram enviadas para o endereço informado."
        };
      }
      throw error;
    }
  },

  /**
   * Realiza login por e-mail e senha.
   * Verifica se o e-mail está confirmado para orientar o redirecionamento.
   *
   * @param {string} email E-mail do usuário
   * @param {string} password Senha
   * @returns {Promise<{ user: object, isVerified: boolean }>}
   */
  async login(email, password) {
    const cleanEmail = (email || "").trim();
    if (!cleanEmail || !password) {
      throw new Error("Preencha todos os campos obrigatórios.");
    }

    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const user = userCredential.user;

    return {
      user,
      isVerified: Boolean(user.emailVerified)
    };
  },

  /**
   * Encerra a sessão ativa do usuário.
   * Limpa referências locais de autenticação.
   * @returns {Promise<void>}
   */
  async logout() {
    await signOut(auth);
  },

  /**
   * Envia ou reenvia o e-mail de verificação para o usuário atual.
   * @param {import("https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js").User|null} user
   * @returns {Promise<void>}
   */
  async sendVerificationEmail(user = null) {
    const targetUser = user || auth.currentUser;
    if (!targetUser) {
      throw new Error("Nenhum usuário autenticado para envio da verificação.");
    }
    await sendEmailVerification(targetUser);
  },

  /**
   * Atualiza os dados do usuário atual a partir do Firebase Authentication.
   * Utilizado para verificar o estado real de emailVerified sem depender de reload manual da página.
   *
   * @returns {Promise<import("https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js").User|null>}
   */
  async reloadUser() {
    if (!auth.currentUser) return null;
    await reload(auth.currentUser);
    return auth.currentUser;
  },

  /**
   * Verifica se o e-mail do usuário atual está confirmado.
   * @returns {boolean}
   */
  isEmailVerified() {
    return Boolean(auth.currentUser?.emailVerified);
  },

  /**
   * Envia o link de redefinição de senha para o e-mail informado.
   *
   * Regra de privacidade fundamental:
   * Sempre exibe mensagem genérica, nunca informando se a conta existe ou não no sistema.
   *
   * @param {string} email E-mail para recuperação
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async sendPasswordReset(email) {
    const cleanEmail = (email || "").trim();
    if (!this.validateEmail(cleanEmail)) {
      throw new Error("Verifique o endereço de e-mail informado.");
    }

    const genericSuccessMessage =
      "Se houver uma conta associada ao endereço informado, você receberá as instruções para redefinir sua senha.";

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      return {
        success: true,
        message: genericSuccessMessage
      };
    } catch (error) {
      // Se a conta não existir, não revelar isso ao usuário
      if (error?.code === "auth/user-not-found") {
        return {
          success: true,
          message: genericSuccessMessage
        };
      }
      throw error;
    }
  },

  /**
   * Atualiza a senha do usuário autenticado.
   * Solicita a senha atual para reautenticação prévia, evitando auth/requires-recent-login.
   *
   * @param {string} newPassword Nova senha
   * @param {string|null} currentPassword Senha atual para reautenticação
   * @returns {Promise<void>}
   */
  async updateUserPassword(newPassword, currentPassword = null) {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Nenhum usuário autenticado.");
    }

    const validation = this.validatePassword(newPassword);
    if (!validation.isValid) {
      throw new Error("A nova senha não atende aos requisitos mínimos de segurança.");
    }

    // Se a senha atual foi fornecida, reautenticar o usuário
    if (currentPassword && user.email) {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
    }

    try {
      await updatePassword(user, newPassword);
    } catch (error) {
      // Se a sessão expirou e requer login recente
      if (error?.code === "auth/requires-recent-login" && !currentPassword) {
        throw new Error("Por segurança, informe sua senha atual para confirmar a alteração.");
      }
      throw error;
    }
  }
};
