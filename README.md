# 🪐 FaculFlow — Conectando Calouros e Veteranos Estácio

> **Status:** MVP Avançado | **Design System:** Linear Premium | **Protocolo:** Olympus Active

O **FaculFlow** é um ecossistema completo e gamificado de mentoria acadêmica projetado exclusivamente para alunos da Estácio. Nosso propósito é integrar calouros e veteranos, facilitando a transição universitária, tirando dúvidas e acelerando carreiras por meio de mentoria personalizada, fóruns de discussão e dinâmicas motivacionais de gamificação (Passe de Batalha).

---

## 🎨 Design System & Estética (Olympus Active)

O projeto segue as diretrizes estéticas mais requintadas inspiradas no **Linear Design System**:
*   **stacking de Luminância:** Cards com bordas sutis e fundo com elevações luxuosas.
*   **Micro-interações:** Ofensivas animadas no perfil (contador de fogo pulsante).
*   **Modo Escuro / Claro Dinâmico:** Suporte integral às preferências do usuário com paleta de alta legibilidade.
*   **Feed de Matches:** Layout premium tipo cartões tateáveis que aceleram a conexão.

---

## 🚀 Novas Funcionalidades (Últimas Atualizações)

### 👥 1. Seção de Solicitações de Mentoria (Recebidas & Enviadas)
Adicionamos uma interface de alta fidelidade e controle de conexões pendentes na aba de **Perfil**:
*   **Solicitações Recebidas:** Lista horizontal de outros estudantes que pediram para se conectar a você, com suas fotos, cursos, e ações rápidas para **Aceitar** (estabelece o match e abre a DM) ou **Recusar** (pula e limpa o card).
*   **Solicitações Enviadas:** Exibe os perfis aos quais você solicitou conexão e que ainda estão pendentes, sob a tag visual *"Aguardando..."*.
*   **XP por Conexão:** Ao aceitar um match, ambos os usuários são notificados e recebem **50 XP** no Passe de Batalha!

### 🧪 2. Injeção de Perfis Acadêmicos Premium
Para viabilizar testes imediatos do fluxo de Match e mentoria, o banco de dados agora conta com **14 perfis premium** (semeados via `seed_users.py`), divididos entre calouros e veteranos de cursos reais da Estácio:
*   **Engenharia de Software** (React Native, Python, Ponteiros, Algoritmos).
*   **Direito** (Direito Penal, Constitucional, Hermenêutica Jurídica, OAB).
*   **Psicologia** (Psicologia Social, Organizacional, Saúde Mental).
*   **Administração** (Empreendedorismo, Contabilidade, Finanças, Logística).

---

## 🛠️ Stack Tecnológico

### Backend (Django REST Framework)
*   **Banco de Dados:** SQLite (Desenvolvimento) / Prontidão para PostgreSQL (Produção).
*   **Autenticação:** JWT Seguro (JSON Web Token) via `SimpleJWT`.
*   **Paginação Avançada:** `CursorPagination` para feeds em tempo real e paginação global de APIs.
*   **Resiliência:** Validação rígida de senhas, Rate Limiting contra força bruta e sanitização de inputs.

### Frontend (React Native + Expo)
*   **Gerenciador de Estado:** Context API nativa com hooks personalizados para Autenticação (`useAuth`) e Tema (`useTheme`).
*   **Estilização:** CSS Vanilla com variáveis centralizadas em tokens de design (`theme.js`).
*   **Offline-First:** Cache local offline e persistência segura de segredos via `AsyncStorage` e `SecureStore`.

---

## 💻 Como Executar o Projeto Localmente

### 1. Requisitos Prévios
*   Python 3.10+
*   Node.js (versão LTS recomendada)
*   Expo Go (no celular para testes LAN)

### 2. Configurando o Backend (Django)
```powershell
# Clone o repositório
cd FaculFlow

# Ative o ambiente virtual
venv\Scripts\activate

# Instale as dependências (se houver novos pacotes)
pip install -r backend/requirements.txt

# Execute as migrações do banco
python backend/manage.py migrate

# Realize a semeadura de perfis acadêmicos reais e comunidades
$env:PYTHONIOENCODING="utf-8"; python backend/seed_users.py

# Inicie o servidor backend (rodando na porta 8000)
python backend/manage.py runserver 0.0.0.0:8000
```

### 3. Configurando o Frontend (React Native)
```powershell
# Acesse a pasta do aplicativo
cd frontend/faculflow-app

# Instale os pacotes Node
npm install

# Inicie o servidor Metro Bundler do Expo
npx expo start
```
*Dica:* Para rodar em seu aparelho físico usando o app **Expo Go**, certifique-se de que o celular está na mesma rede Wi-Fi e configure o seu IP de rede local em `constants/api.js` (atualmente configurado no IP LAN `192.168.1.103`).

---

## 🏁 Suíte de Qualidade & Testes
Para rodar a validação de qualidade, execute a suíte de auditoria completa da Antigravity:
```powershell
$env:PYTHONIOENCODING="utf-8"; venv\Scripts\python.exe .agent\scripts\checklist.py .
```
Isso validará automaticamente a **Segurança (OWASP)**, o **Linter**, as **Migrações de Banco**, os **Testes Unitários**, a **Acessibilidade/UX** e a conformidade de **SEO**!
