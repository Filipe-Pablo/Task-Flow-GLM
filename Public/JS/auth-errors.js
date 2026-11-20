/**
 * ============================================================================
 * TaskFlow Authentication — Centralized Error Handling
 * ============================================================================
 * Responsável pela tradução e tratamento centralizado de todos os erros do
 * Firebase Authentication, garantindo privacidade, segurança e proteção
 * contra enumeração de e-mails.
 *
 * Regra fundamental: Nenhuma mensagem da aplicação deve permitir que terceiros
 * descubram se um determinado endereço de e-mail está cadastrado no sistema.
 */

const ERROR_MESSAGES = {
  // Credenciais inválidas (login)
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/wrong-password": "E-mail ou senha incorretos.",
  "auth/user-not-found": "E-mail ou senha incorretos.",

  // Validação de e-mail
  "auth/invalid-email": "Verifique o endereço de e-mail informado.",

  // Validação de senha
  "auth/weak-password": "A senha não atende aos requisitos mínimos.",

  // Privacidade: nunca confirmar se o e-mail já existe
  "auth/email-already-in-use": "Se aplicável, verifique os dados informados ou tente recuperar sua senha.",

  // Excesso de requisições / Rate limit
  "auth/too-many-requests": "Muitas tentativas foram realizadas. Aguarde alguns instantes e tente novamente.",

  // Falha de rede / conectividade
  "auth/network-request-failed": "Não foi possível conectar ao serviço. Verifique sua conexão.",

  // Reautenticação necessária (operações sensíveis como alteração de senha)
  "auth/requires-recent-login": "Por segurança, realize novamente sua autenticação.",

  // Usuário desativado
  "auth/user-disabled": "Não foi possível realizar a operação. Entre em contato com o suporte.",

  // Credencial expirada ou malformada
  "auth/expired-action-code": "O link expirou ou já foi utilizado. Solicite um novo.",
  "auth/invalid-action-code": "O link de verificação é inválido. Solicite um novo envio.",

  // Erro padrão
  "default": "Não foi possível concluir a operação. Tente novamente."
};

/**
 * Traduz um código de erro ou objeto de erro do Firebase em uma mensagem segura e amigável.
 * Nunca expõe stack traces, códigos internos ou pistas sobre a existência de contas.
 *
 * @param {Error|Object|string} error Objeto de erro ou código de erro
 * @returns {string} Mensagem amigável e segura para exibição na interface
 */
export function getAuthErrorMessage(error) {
  if (!error) {
    return ERROR_MESSAGES["default"];
  }

  // Extrair o código de erro do Firebase (ex: "auth/invalid-credential")
  const code = typeof error === "string" ? error : error?.code;

  if (code && typeof code === "string" && ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code];
  }

  return ERROR_MESSAGES["default"];
}

/**
 * Verifica se um erro corresponde ao bloqueio temporário por excesso de requisições.
 * @param {Error|Object|string} error
 * @returns {boolean}
 */
export function isTooManyRequestsError(error) {
  const code = typeof error === "string" ? error : error?.code;
  return code === "auth/too-many-requests";
}

/**
 * Verifica se um erro exige reautenticação recente do usuário.
 * @param {Error|Object|string} error
 * @returns {boolean}
 */
export function isRequiresRecentLoginError(error) {
  const code = typeof error === "string" ? error : error?.code;
  return code === "auth/requires-recent-login";
}
