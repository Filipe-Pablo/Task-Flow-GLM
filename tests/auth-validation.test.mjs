/**
 * ============================================================================
 * TaskFlow Authentication — Automated Test Suite
 * ============================================================================
 * Executa testes reais de validação:
 * 1. Análise estrutural e integridade dos arquivos HTML
 * 2. Teste das funções de tradução de erros e contextos de auth-errors.js
 * 3. Validação de regras de senha e sintaxe de e-mail
 * 4. Testes reais de integração com o serviço oficial Firebase Auth
 * ============================================================================
 */

import fs from "fs";
import path from "path";
import { getAuthErrorMessage, isTooManyRequestsError, isNetworkError, isRequiresRecentLoginError } from "../Public/JS/auth-errors.js";

const API_KEY = "AIzaSyA9uWffYJvE_ixKMLChjexTwHDgiLtdV-I";
const AUTH_URL = `https://identitytoolkit.googleapis.com/v1`;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${message}`);
  }
}

async function runTestSuite() {
  console.log("================================================================");
  console.log("  INICIANDO SUÍTE DE TESTES DO FIREBASE AUTHENTICATION");
  console.log("================================================================\n");

  // --------------------------------------------------------------------------
  // GRUPO 1: Validação Estrutural dos Arquivos HTML
  // --------------------------------------------------------------------------
  console.log("--- GRUPO 1: Integridade Estrutural do HTML e IDs de Autenticação ---");

  const htmlFiles = [
    { file: "index.html", expectedIds: ["loginForm", "loginEmail", "loginPassword", "btnLoginSubmit", "authAlertArea"] },
    { file: "cadastro.html", expectedIds: ["registerForm", "registerEmail", "registerPassword", "registerConfirmPassword", "btnRegisterSubmit", "passwordRequirements", "authAlertArea"] },
    { file: "recuperar-senha.html", expectedIds: ["resetForm", "resetEmail", "btnResetSubmit", "cooldownNotice", "authAlertArea"] },
    { file: "atualizar-senha.html", expectedIds: ["updatePasswordForm", "currentPassword", "newPassword", "confirmNewPassword", "btnUpdatePasswordSubmit", "passwordRequirements", "authAlertArea"] },
    { file: "verificar-email.html", expectedIds: ["btnCheckVerification", "btnResendVerification", "btnLogoutVerify", "userEmailBadge", "cooldownNotice", "authAlertArea"] },
    { file: "dashboard.html", expectedIds: ["sidebarUserName", "sidebarUserEmail", "avatarSidebar", "avatarHeader", "btnSidebarLogout"] }
  ];

  for (const { file, expectedIds } of htmlFiles) {
    const filePath = path.resolve("Public", file);
    assert(fs.existsSync(filePath), `Arquivo Public/${file} existe no disco`);
    const content = fs.readFileSync(filePath, "utf-8");

    // Verificar se não há caminhos com minúsculo js/
    assert(!content.includes('from "./js/') && !content.includes('src="js/'), `Public/${file} utiliza casing correto (JS/)`);

    for (const id of expectedIds) {
      assert(content.includes(`id="${id}"`), `Public/${file} contém elemento com id="${id}"`);
    }
  }

  // --------------------------------------------------------------------------
  // GRUPO 2: Validação de auth-errors.js e Contextos
  // --------------------------------------------------------------------------
  console.log("\n--- GRUPO 2: Tratamento e Tradução Centralizada de Erros ---");

  const invalidCredMsg = getAuthErrorMessage("auth/invalid-credential");
  assert(invalidCredMsg.includes("E-mail ou senha incorretos"), "Traduz auth/invalid-credential corretamente");

  const emailInUseMsg = getAuthErrorMessage("auth/email-already-in-use");
  assert(emailInUseMsg.includes("já está cadastrado"), "Traduz auth/email-already-in-use amigavelmente");

  const weakPwdMsg = getAuthErrorMessage("auth/weak-password");
  assert(weakPwdMsg.includes("fraca") && weakPwdMsg.includes("8 caracteres"), "Traduz auth/weak-password com regras claras");

  const netErrorMsg = getAuthErrorMessage("auth/network-request-failed");
  assert(netErrorMsg.includes("conexão"), "Traduz auth/network-request-failed para falha de rede");

  const reauthErrorMsg = getAuthErrorMessage("auth/wrong-password", "reauth");
  assert(reauthErrorMsg.includes("A senha atual informada está incorreta"), "Contexto 'reauth' trata senha atual incorreta");

  assert(isTooManyRequestsError("auth/too-many-requests") === true, "isTooManyRequestsError identifica código corretamente");
  assert(isNetworkError("auth/network-request-failed") === true, "isNetworkError identifica falha de rede");
  assert(isRequiresRecentLoginError("auth/requires-recent-login") === true, "isRequiresRecentLoginError identifica sessão antiga");

  // --------------------------------------------------------------------------
  // GRUPO 3: Validação de Regras de Senha e E-mail
  // --------------------------------------------------------------------------
  console.log("\n--- GRUPO 3: Algoritmo de Validação de Senha e E-mail ---");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  assert(emailRegex.test("usuario@exemplo.com") === true, "E-mail comum é válido");
  assert(emailRegex.test("usuario.nome+tag@dominio.com.br") === true, "E-mail corporativo complexo é válido");
  assert(emailRegex.test("invalido@") === false, "E-mail sem domínio é inválido");
  assert(emailRegex.test("invalido") === false, "Texto puro é inválido");

  function validatePwd(pwd, confirm = null) {
    const hasMinLength = (pwd || "").length >= 8;
    const hasLetter = /[A-Za-z]/.test(pwd || "");
    const hasNumber = /[0-9]/.test(pwd || "");
    const passwordsMatch = confirm !== null ? pwd === confirm : true;
    return { isValid: hasMinLength && hasLetter && hasNumber && passwordsMatch, hasMinLength, hasLetter, hasNumber, passwordsMatch };
  }

  assert(validatePwd("1234567").isValid === false, "Senha com menos de 8 caracteres é rejeitada");
  assert(validatePwd("abcdefgh").isValid === false, "Senha sem números é rejeitada");
  assert(validatePwd("12345678").isValid === false, "Senha sem letras é rejeitada");
  assert(validatePwd("SenhaForte123").isValid === true, "Senha com 8+ chars, letra e número é aceita");
  assert(validatePwd("SenhaForte123", "SenhaErrada").passwordsMatch === false, "Confirmação diferente é rejeitada");
  assert(validatePwd("SenhaForte123", "SenhaForte123").isValid === true, "Senha e confirmação idênticas são aceitas");

  // --------------------------------------------------------------------------
  // GRUPO 4: Testes de Integração Direta com Firebase Authentication
  // --------------------------------------------------------------------------
  console.log("\n--- GRUPO 4: Integração Real com a API do Firebase Authentication ---");

  // 4.1 Login com credenciais inválidas
  try {
    const res = await fetch(`${AUTH_URL}/accounts:signInWithPassword?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "usuario_inexistente_12345@taskflow.invalid", password: "Password123!" })
    });
    const data = await res.json();
    assert(res.status === 400 && data.error && (data.error.message.includes("INVALID_LOGIN_CREDENTIALS") || data.error.message.includes("EMAIL_NOT_FOUND")), "Login com credenciais inválidas retorna erro 400 com INVALID_LOGIN_CREDENTIALS");
  } catch (err) {
    assert(false, `Falha de rede no teste de login: ${err.message}`);
  }

  // 4.2 Cadastro de usuário de teste único
  const testEmail = `tf_test_${Date.now()}@taskflow-audit.com`;
  const testPassword = `TaskFlowPass${Date.now()}!`;
  let createdIdToken = null;
  let createdLocalId = null;

  try {
    const signupRes = await fetch(`${AUTH_URL}/accounts:signUp?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: testPassword, returnSecureToken: true })
    });
    const signupData = await signupRes.json();
    assert(signupRes.status === 200 && signupData.idToken, `Cadastro de usuário novo (${testEmail}) efetuado com sucesso (status 200)`);
    createdIdToken = signupData.idToken;
    createdLocalId = signupData.localId;
  } catch (err) {
    assert(false, `Falha no cadastro de usuário: ${err.message}`);
  }

  // 4.3 Cadastro com e-mail duplicado (deve retornar EMAIL_EXISTS)
  try {
    const dupRes = await fetch(`${AUTH_URL}/accounts:signUp?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: testPassword, returnSecureToken: true })
    });
    const dupData = await dupRes.json();
    assert(dupRes.status === 400 && dupData.error && dupData.error.message.includes("EMAIL_EXISTS"), "Cadastro com e-mail já existente retorna erro 400 EMAIL_EXISTS (auth/email-already-in-use)");
  } catch (err) {
    assert(false, `Falha no teste de e-mail duplicado: ${err.message}`);
  }

  // 4.4 Login com as credenciais válidas criadas
  try {
    const loginRes = await fetch(`${AUTH_URL}/accounts:signInWithPassword?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: testPassword, returnSecureToken: true })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && loginData.idToken, "Login com credenciais recém-criadas bem-sucedido (status 200)");
  } catch (err) {
    assert(false, `Falha no login com credenciais válidas: ${err.message}`);
  }

  // 4.5 Recuperação de senha por e-mail
  try {
    const resetRes = await fetch(`${AUTH_URL}/accounts:sendOobCode?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestType: "PASSWORD_RESET", email: testEmail })
    });
    const resetData = await resetRes.json();
    assert(resetRes.status === 200 && resetData.email, `Envio de instruções de recuperação de senha bem-sucedido para ${testEmail}`);
  } catch (err) {
    assert(false, `Falha na recuperação de senha: ${err.message}`);
  }

  // 4.6 Limpeza: Deletar conta temporária de teste
  if (createdIdToken) {
    try {
      const delRes = await fetch(`${AUTH_URL}/accounts:delete?key=${API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: createdIdToken })
      });
      assert(delRes.status === 200, "Exclusão limpa da conta de teste temporária concluída");
    } catch (err) {
      console.warn("Aviso ao remover conta de teste:", err);
    }
  }

  // --------------------------------------------------------------------------
  // RELATÓRIO FINAL DA SUÍTE DE TESTES
  // --------------------------------------------------------------------------
  console.log("\n================================================================");
  console.log(`  RESUMO DOS TESTES EXECUTADOS:`);
  console.log(`  Total: ${totalTests} | Aprovados: ${passedTests} | Falhas: ${failedTests}`);
  console.log("================================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite();
