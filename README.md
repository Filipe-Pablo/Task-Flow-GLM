# TaskFlow — Sistema de Autenticação com Firebase Authentication

Sistema profissional, modular, seguro e enxuto de autenticação desenvolvido exclusivamente com **HTML5**, **CSS3**, **JavaScript puro (Vanilla JS - ES Modules)** e **Firebase Authentication (SDK Modular v10+)**, integrado ao software de gerenciamento de tarefas **TaskFlow Pro**.

A autenticação é realizada **exclusivamente por e-mail e senha**, sem provedores externos (sem OAuth/Google/Apple/Microsoft), respeitando padrões rigorosos de privacidade e segurança contra enumeração de usuários.

---

## 1. Visão Geral da Arquitetura

O projeto adota uma arquitetura em camadas com separação estrita de responsabilidades:

```
Task-Flow-GLM/
├── Public/                       # Raiz pública da aplicação web (Firebase Hosting)
│   ├── index.html                # Tela de Login (Entrada da aplicação)
│   ├── login.html                # Redirecionamento/Alias para index.html
│   ├── cadastro.html             # Tela de Cadastro de Usuário
│   ├── recuperar-senha.html      # Tela de Recuperação de Senha
│   ├── verificar-email.html      # Tela de Verificação de E-mail Pendente
│   ├── atualizar-senha.html      # Tela de Atualização de Senha (Área Protegida)
│   ├── dashboard.html            # Software pronto integrado (TaskFlow Pro)
│   ├── app.html                  # Alias para dashboard.html
│   │
│   ├── CSS/
│   │   ├── style.css             # Estilização completa das telas de autenticação e layout
│   │   ├── components.css        # Componentes visuais do TaskFlow
│   │   ├── responsive.css        # Regras de responsividade do TaskFlow
│   │   └── themes.css            # Variáveis e tokens de tema (Dark e Light Mode)
│   │
│   ├── JS/
│   │   ├── firebase-config.js    # Inicialização oficial do Firebase e instâncias Auth/DB
│   │   ├── auth-service.js       # Centralização das operações de autenticação
│   │   ├── auth-errors.js        # Tradução centralizada de erros e proteção contra enumeração
│   │   ├── auth-guard.js         # Proteção de rotas e controle de sessão
│   │   ├── app.js                # Interação da UI, formulários e integração com o Dashboard
│   │   ├── tasks.js              # Controlador de tarefas do TaskFlow
│   │   ├── taskService.js        # Integração do TaskFlow com o Firestore
│   │   ├── filters.js            # Filtros de tarefas
│   │   ├── storage.js            # Armazenamento de preferências locais
│   │   └── theme.js              # Gerenciador de tema (claro/escuro)
│   │
│   └── assets/icons/             # Conjunto de ícones vetoriais SVG
│
├── firestore.rules               # Regras oficiais de segurança do Firestore
├── firestore.indexes.json        # Definição de índices do Firestore
├── firebase.json                 # Configuração de Hosting e Rewrites do Firebase
├── .firebaserc                   # Associação ao projeto Firebase CLI
└── README.md                     # Documentação completa do sistema
```

---

## 2. Responsabilidade dos Módulos

### `firebase-config.js`
- Inicializa a aplicação Firebase utilizando o SDK modular oficial (`13.4.0` / ES Modules).
- Configura a persistência local da sessão (`browserLocalPersistence`).
- Inicializa e exporta as instâncias de `auth` e `db` (Firestore).

### `auth-service.js`
Centraliza todas as chamadas às APIs oficiais do Firebase Authentication:
- `register(email, password)`: Cria a conta via `createUserWithEmailAndPassword` e envia o e-mail de verificação automaticamente via `sendEmailVerification`.
- `login(email, password)`: Autentica o usuário via `signInWithEmailAndPassword` e verifica a flag `emailVerified`.
- `logout()`: Encerra a sessão via `signOut`.
- `sendVerificationEmail()`: Envia ou reenvia a mensagem de confirmação.
- `reloadUser()`: Atualiza a instância do usuário via `reload()` para obter o status real de `emailVerified`.
- `sendPasswordReset(email)`: Envia o link de recuperação via `sendPasswordResetEmail`.
- `updateUserPassword(newPassword, currentPassword)`: Atualiza a senha via `updatePassword`, reautenticando com `reauthenticateWithCredential` quando necessário.
- `validatePassword(password, confirmPassword)`: Validador dos requisitos mínimos (8+ caracteres, letra, número e correspondência).
- `waitForAuthInit()`: Promessa que aguarda a resolução do estado inicial da sessão.

### `auth-errors.js`
- Centraliza a tradução dos códigos de erro do Firebase Authentication para mensagens claras em português.
- **Proteção fundamental contra enumeração**: Erros como `auth/user-not-found` e `auth/wrong-password` retornam a mesma mensagem amigável: *"E-mail ou senha incorretos."*.
- O erro `auth/email-already-in-use` no cadastro não confirma a existência da conta: *"Se aplicável, verifique os dados informados ou tente recuperar sua senha."*.
- Tratamento específico para `auth/too-many-requests`: *"Muitas tentativas foram realizadas. Aguarde alguns instantes e tente novamente."*.

### `auth-guard.js`
- `requireAuth({ requireVerified: true })`: Protege páginas privadas (`dashboard.html`, `atualizar-senha.html`). Bloqueia acessos não logados e e-mails não confirmados.
- `requireGuest()`: Protege páginas públicas (`index.html`, `cadastro.html`, `recuperar-senha.html`), redirecionando automaticamente usuários já autenticados para o dashboard.
- `requireUnverified()`: Garante acesso exclusivo à tela `verificar-email.html` enquanto o usuário tiver verificação pendente.
- Remove o véu de carregamento (`#authGuardVeil`) suavemente após a validação para evitar *flash* de conteúdo indevido.

### `app.js`
- Gerencia todos os formulários da interface de autenticação.
- Alterna a visibilidade das senhas (botão exibir/ocultar senha).
- Atualiza em tempo real os indicadores dinâmicos de requisitos de senha conforme o usuário digita.
- Aplica controle de frequência (*cooldown timer* de 60 segundos) no reenvio de confirmação e recuperação de senha.
- Desabilita botões e exibe *spinners* animados durante o processamento para evitar submissões duplicadas.
- Conecta o usuário autenticado à barra lateral, perfil e botão de encerramento de sessão do TaskFlow.

---

## 3. Segurança e Privacidade

O sistema segue rigorosas práticas de segurança da informação:

1. **Proteção contra enumeração de e-mails**:
   - Nenhuma resposta da interface permite descobrir se um e-mail específico está registrado.
   - Mensagens de erro de login e recuperação utilizam textos genéricos.
   - Recuperação de senha exibe a mesma mensagem de sucesso mesmo se a conta não existir:
     > *"Se houver uma conta associada ao endereço informado, você receberá as instruções para redefinir sua senha."*
2. **Sem armazenamento sensível no cliente**:
   - Nenhuma senha é armazenada em banco de dados, `localStorage` ou `sessionStorage`.
   - O Firebase SDK gerencia tokens de forma segura e cifrada via IndexedDB interno.
   - Nenhum dado confidencial é exposto no console ou em logs da aplicação.
3. **Controle de Rate Limit (`auth/too-many-requests`)**:
   - Tratamento explícito quando o Firebase bloqueia requisições excessivas.
   - Bloqueio no frontend com contagem regressiva para novas tentativas.
4. **Regras de Segurança do Firestore (`firestore.rules`)**:
   - O acesso às tarefas é protegido no servidor pelo Firebase Security Rules, permitindo leitura e escrita exclusivamente para requisições autenticadas (`request.auth != null`).

---

## 4. Configuração no Console do Firebase

Para que o sistema funcione com todas as funcionalidades em seu próprio projeto do Firebase, certifique-se de realizar as seguintes configurações no [Firebase Console](https://console.firebase.google.com/):

### 4.1. Ativar Provedor E-mail e Senha
1. Acesse seu projeto no Console do Firebase.
2. No menu lateral, acesse **Build > Authentication**.
3. Clique na aba **Sign-in method** (Método de login).
4. Em **Provedores nativos**, clique em **E-mail/senha**.
5. Ative a primeira opção: **E-mail/senha**.
6. Mantenha a opção *Link do e-mail (login sem senha)* desativada (utilizamos autenticação clássica com senha).
7. Clique em **Salvar**.

### 4.2. Ativar Proteção contra Enumeração de E-mails
1. No menu **Authentication**, clique na aba **Settings** (Configurações).
2. Vá até a seção **User actions** (Ações do usuário).
3. Ative a opção **Email enumeration protection** (Proteção contra enumeração de e-mails).
4. Essa configuração garante que o Firebase não retorne códigos distintos que possam denunciar a existência de contas a invasores.

### 4.3. Configurar Modelos de E-mail (Templates)
1. No menu **Authentication**, acesse a aba **Templates** (Modelos).
2. Selecione **Confirmação de endereço de e-mail**:
   - Personalize o nome do remetente e o assunto da mensagem.
3. Selecione **Redefinição de senha**:
   - Personalize a mensagem que os usuários receberão para redefinir suas credenciais.

### 4.4. Domínios Autorizados
1. No menu **Authentication > Settings**, clique em **Authorized domains** (Domínios autorizados).
2. Certifique-se de que constam os seguintes domínios:
   - `localhost`
   - `127.0.0.1`
   - `to-do-list-232fd.firebaseapp.com` (ou o domínio do seu projeto)
   - `to-do-list-232fd.web.app`

### 4.5. Publicação das Regras do Firestore
As regras contidas no arquivo `firestore.rules` devem ser aplicadas no Console do Firebase em **Firestore Database > Regras**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tasks/{taskId} {
      allow read, write: if request.auth != null;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 5. Como Executar o Projeto Localmente

Como o projeto utiliza ES Modules nativos (`import`/`export`), ele deve ser servido através de um servidor HTTP local (e não aberto diretamente pelo protocolo `file://`).

Você pode utilizar qualquer uma das opções abaixo:

### Opção A: Utilizando Node.js (`npx serve`)
```bash
# Na raiz do repositório, execute:
npx serve Public
```
Acesse no navegador: `http://localhost:3000`

### Opção B: Utilizando Python 3
```bash
# Na raiz do repositório, execute:
python -m http.server -d Public 5000
```
Acesse no navegador: `http://localhost:5000`

### Opção C: Utilizando Firebase CLI (Emulador ou Hosting)
```bash
# Iniciar o emulador do Firebase Hosting:
firebase emulators:start --only hosting
```
Acesse no navegador: `http://localhost:5000`

---

## 6. Fluxos de Navegação e Teste

1. **Cadastro**: Acesse `cadastro.html`, preencha um e-mail válido e uma senha que atenda aos 3 requisitos (8+ caracteres, letra, número). Ao criar a conta, o Firebase enviará o e-mail de ativação e você será direcionado para `verificar-email.html`.
2. **Verificação de E-mail**:
   - Na tela `verificar-email.html`, clique em *"Reenviar e-mail de confirmação"* para testar o *cooldown* de 60 segundos.
   - Abra a caixa postal, clique no link de ativação enviado pelo Firebase.
   - Volte à aplicação e clique em *"Já confirmei meu e-mail"*. A aplicação executará `reload()` no Firebase e liberará o acesso ao dashboard.
3. **Login**: Acesse `index.html`. Caso o e-mail ainda não esteja verificado, você será redirecionado para `verificar-email.html`. Caso esteja verificado, entrará direto no `dashboard.html`.
4. **Recuperação de Senha**: Acesse `recuperar-senha.html`, digite o e-mail e solicite o link. O sistema responderá com a mensagem genérica segura.
5. **Atualização de Senha**: No Dashboard, vá até o menu Perfil ou acesse `atualizar-senha.html`. Informe a senha atual, defina a nova senha forte e salve.
6. **Encerramento de Sessão**: Clique em *"Sair da conta"* no rodapé da barra lateral ou no perfil. Sua sessão será revogada e você retornará para `index.html`.
