/**
 * ============================================================================
 * TaskFlow Authentication — Centralized Error Handling & Translation
 * ============================================================================
 * Responsável pela tradução e tratamento centralizado de todos os erros do
 * Firebase Authentication em mensagens em português claras, amigáveis e
 * orientadas ao usuário final, preservando a segurança e privacidade.
 *
 * Tecnologias: JavaScript puro (ES Modules).
 */

const ERROR_MESSAGES = {
  // Credenciais de login inválidas
  "auth/invalid-credential": "E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.",
  "auth/wrong-password": "E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.",
  "auth/user-not-found": "Não encontramos uma conta cadastrada com este e-mail.",

  // Validação de e-mail
  "auth/invalid-email": "O endereço de e-mail informado é inválido. Por favor, verifique a digitação.",
  "auth/missing-email": "Por favor, informe seu endereço de e-mail.",

  // Validação e força da senha
  "auth/weak-password": "A senha informada é fraca. Ela deve conter no mínimo 8 caracteres, incluindo letras e números.",
  "auth/missing-password": "Por favor, informe sua senha.",

  // Conflito de conta existente
  "auth/email-already-in-use": "Este endereço de e-mail já está cadastrado. Faça login ou utilize a recuperação de senha.",

  // Limite de taxa / Rate limiting
  "auth/too-many-requests": "Muitas tentativas consecutivas foram detectadas. Por segurança, aguarde alguns instantes e tente novamente.",

  // Conectividade e rede
  "auth/network-request-failed": "Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.",

  // Reautenticação necessária para operações sensíveis
  "auth/requires-recent-login": "Esta operação exige uma confirmação recente de segurança. Por favor, entre novamente na sua conta.",

  // Conta desativada
  "auth/user-disabled": "Esta conta de usuário foi temporariamente suspensa. Entre em contato com o suporte.",

  // Links de ação (recuperação de senha / verificação de e-mail)
  "auth/expired-action-code": "O link de verificação expirou ou já foi utilizado. Solicite um novo envio.",
  "auth/invalid-action-code": "O link de verificação é inválido. Solicite um novo link.",

  // Operações e permissões do projeto Firebase
  "auth/operation-not-allowed": "O método de autenticação por e-mail e senha não está habilitado no console do projeto.",
  "auth/quota-exceeded": "Limite de requisições temporariamente excedido. Aguarde alguns minutos e tente novamente.",
  "auth/popup-closed-by-user": "A janela de autenticação foi encerrada antes de concluir o processo.",
  "auth/internal-error": "Ocorreu um erro interno de processamento no Firebase. Tente novamente em alguns instantes.",
  "auth/invalid-api-key": "Chave de acesso à API do Firebase inválida. Verifique as configurações.",

  // Padrão genérico
  "default": "Não foi possível concluir a operação. Por favor, verifique os dados informados e tente novamente."
};

/**
 * Traduz um código ou objeto de erro retornado pelo Firebase para uma mensagem amigável.
 * Suporta parâmetro de contexto opcional (ex: 'reauth' para troca de senha).
 *
 * @param {Error|Object|string} error Objeto de erro ou código do Firebase
 * @param {string|null} context Contexto da operação ('login'|'register'|'reset'|'reauth'|null)
 * @returns {string} Mensagem amigável traduzida
 */
export function getAuthErrorMessage(error, context = null) {
  if (!error) {
    return ERROR_MESSAGES["default"];
  }

  // Extrair o código de erro (suporta string direta, objeto de erro padrão ou customizado)
  const code = typeof error === "string" ? error : error?.code;

  // Tratamento contextual específico para reautenticação (atualização de senha)
  if (context === "reauth" && (code === "auth/wrong-password" || code === "auth/invalid-credential")) {
    return "A senha atual informada está incorreta. Verifique e tente novamente.";
  }

  if (context === "reset" && code === "auth/user-not-found") {
    return "Não encontramos uma conta cadastrada com este endereço de e-mail.";
  }

  if (code && typeof code === "string" && ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code];
  }

  // Se o erro tiver uma mensagem tratada que não contenha jargões técnicos do Firebase
  if (error?.message && typeof error.message === "string") {
    const rawMsg = error.message;
    // Se não for uma mensagem interna crua com Firebase: Error (...)
    if (!rawMsg.includes("Firebase:") && !rawMsg.includes("auth/")) {
      return rawMsg;
    }
  }

  return ERROR_MESSAGES["default"];
}

/**
 * Verifica se o erro corresponde a rate limit / excesso de requisições.
 * @param {Error|Object|string} error
 * @returns {boolean}
 */
export function isTooManyRequestsError(error) {
  const code = typeof error === "string" ? error : error?.code;
  return code === "auth/too-many-requests";
}

/**
 * Verifica se o erro corresponde a falha de conexão de rede.
 * @param {Error|Object|string} error
 * @returns {boolean}
 */
export function isNetworkError(error) {
  const code = typeof error === "string" ? error : error?.code;
  return code === "auth/network-request-failed";
}

/**
 * Verifica se o erro exige login recente para operações protegidas.
 * @param {Error|Object|string} error
 * @returns {boolean}
 */
export function isRequiresRecentLoginError(error) {
  const code = typeof error === "string" ? error : error?.code;
  return code === "auth/requires-recent-login";
}
