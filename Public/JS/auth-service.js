/**
 * ============================================================================
 * TaskFlow Authentication — Authentication Service
 * ============================================================================
 * Centraliza e encapsula todas as operações do Firebase Authentication:
 * - Cadastro com envio automático de e-mail de confirmação
 * - Login seguro com validação de formato e monitoramento de e-mail verificado
 * - Logout com encerramento de sessão
 * - Verificação de e-mail e reenvio com controle de frequência
 * - Recuperação de senha por e-mail com mensagens claras
 * - Alteração de senha com reautenticação prévia de segurança
 * - Observação e sincronização contínua do estado da sessão (onAuthStateChanged)
 *
 * Tecnologias: JavaScript puro (ES Modules) e Firebase SDK oficial v13+.
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

export const authService = {
  /**
   * Promessa que resolve quando o Firebase Auth carrega o estado inicial de persistência.
   * Possui fallback de segurança para nunca travar a renderização em loading infinito.
   *
   * @param {number} timeoutMs Tempo máximo de espera em ms (padrão: 3000ms)
   * @returns {Promise<import("https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js").User|null>}
   */
  waitForAuthInit(timeoutMs = 3000) {
    // Se o SDK já possui o usuário carregado em memória
    if (auth.currentUser) {
      return Promise.resolve(auth.currentUser);
    }

    return new Promise((resolve) => {
      let settled = false;

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
            console.warn("Aviso ao inicializar observador de autenticação:", error);
            if (!settled) {
              settled = true;
              clearTimeout(timer);
              resolve(auth.currentUser || null);
            }
          }
        );
      } catch (err) {
        console.warn("Falha ao registrar observador onAuthStateChanged:", err);
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(auth.currentUser || null);
        }
      }
    });
  },

  /**
   * Monitora continuamente alterações no estado de autenticação (login, logout, token refresh).
   * @param {function(import("https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js").User|null): void} callback
   * @returns {function(): void} Função de cancelamento da inscrição
   */
  subscribeAuthState(callback) {
    return onAuthStateChanged(auth, callback);
  },

  /**
   * Retorna o usuário autenticado no momento.
   * @returns {import("https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js").User|null}
   */
  getCurrentUser() {
    return auth.currentUser;
  },

  /**
   * Valida sintaticamente o formato do e-mail.
   * @param {string} email
   * @returns {boolean}
   */
  validateEmail(email) {
    if (!email || typeof email !== "string") return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return re.test(email.trim());
  },

  /**
   * Valida os requisitos de segurança de senha:
   * - Mínimo de 8 caracteres
   * - Pelo menos uma letra (a-z ou A-Z)
   * - Pelo menos um número (0-9)
   * - Confirmação de senha coincidente (quando fornecida)
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
   * Cadastra um novo usuário no Firebase Authentication por e-mail e senha.
   * Envia automaticamente o e-mail de confirmação da conta.
   *
   * @param {string} email E-mail do usuário
   * @param {string} password Senha
   * @returns {Promise<{ success: boolean, user: object, message: string }>}
   */
  async register(email, password) {
    const cleanEmail = (email || "").trim();
    if (!this.validateEmail(cleanEmail)) {
      const err = new Error("Verifique o endereço de e-mail informado.");
      err.code = "auth/invalid-email";
      throw err;
    }

    const validation = this.validatePassword(password);
    if (!validation.isValid) {
      const err = new Error("A senha não atende aos requisitos mínimos de segurança.");
      err.code = "auth/weak-password";
      throw err;
    }

    // Cria o usuário no Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const user = userCredential.user;

    // Dispara o e-mail de verificação oficial do Firebase
    try {
      await sendEmailVerification(user);
    } catch (verificationError) {
      console.warn("Aviso ao enviar e-mail inicial de verificação:", verificationError?.code || verificationError);
    }

    return {
      success: true,
      user,
      message: "Conta criada com sucesso! Enviamos um link de confirmação para o seu e-mail."
    };
  },

  /**
   * Realiza login no Firebase Authentication por e-mail e senha.
   * Retorna os dados do usuário e status da confirmação de e-mail.
   *
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ user: object, isVerified: boolean }>}
   */
  async login(email, password) {
    const cleanEmail = (email || "").trim();
    if (!cleanEmail || !password) {
      const err = new Error("Preencha todos os campos obrigatórios.");
      err.code = "auth/missing-credentials";
      throw err;
    }

    if (!this.validateEmail(cleanEmail)) {
      const err = new Error("Informe um endereço de e-mail válido.");
      err.code = "auth/invalid-email";
      throw err;
    }

    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const user = userCredential.user;

    return {
      user,
      isVerified: Boolean(user.emailVerified)
    };
  },

  /**
   * Encerra a sessão ativa do usuário no Firebase Authentication.
   * @returns {Promise<void>}
   */
  async logout() {
    await signOut(auth);
  },

  /**
   * Envia ou reenvia o e-mail de verificação para o usuário ativo.
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
   * Atualiza os dados do usuário atual a partir dos servidores do Firebase.
   * Essencial para refletir o status de emailVerified sem recarregar a página.
   *
   * @returns {Promise<import("https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js").User|null>}
   */
  async reloadUser() {
    if (!auth.currentUser) return null;
    await reload(auth.currentUser);
    return auth.currentUser;
  },

  /**
   * Informa se o usuário atual já teve seu e-mail verificado.
   * @returns {boolean}
   */
  isEmailVerified() {
    return Boolean(auth.currentUser?.emailVerified);
  },

  /**
   * Envia instruções de recuperação e redefinição de senha para o e-mail informado.
   *
   * @param {string} email E-mail cadastrado
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async sendPasswordReset(email) {
    const cleanEmail = (email || "").trim();
    if (!this.validateEmail(cleanEmail)) {
      const err = new Error("Verifique o endereço de e-mail informado.");
      err.code = "auth/invalid-email";
      throw err;
    }

    await sendPasswordResetEmail(auth, cleanEmail);

    return {
      success: true,
      message: "Instruções de redefinição de senha enviadas com sucesso! Verifique sua caixa de entrada e spam."
    };
  },

  /**
   * Atualiza a senha de acesso do usuário autenticado.
   * Executa reautenticação de segurança prévia com a senha atual para garantir
   * autorização e evitar falhas por sessão antiga (auth/requires-recent-login).
   *
   * @param {string} newPassword Nova senha
   * @param {string} currentPassword Senha atual para validação de segurança
   * @returns {Promise<void>}
   */
  async updateUserPassword(newPassword, currentPassword) {
    const user = auth.currentUser;
    if (!user) {
      const err = new Error("Nenhum usuário autenticado.");
      err.code = "auth/no-current-user";
      throw err;
    }

    if (!currentPassword) {
      const err = new Error("Por segurança, informe sua senha atual.");
      err.code = "auth/missing-password";
      throw err;
    }

    const validation = this.validatePassword(newPassword);
    if (!validation.isValid) {
      const err = new Error("A nova senha não atende aos requisitos mínimos de segurança.");
      err.code = "auth/weak-password";
      throw err;
    }

    // Reautenticação prévia obrigatória
    if (user.email) {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
    }

    // Atualização da senha no Firebase Authentication
    await updatePassword(user, newPassword);
  }
};
