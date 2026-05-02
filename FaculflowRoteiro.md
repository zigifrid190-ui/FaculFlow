# Roteiro Completo - MVP Faculflow

**Objetivo do MVP**: Criar um aplicativo funcional de rede social de mentoria que conecta calouros e veteranos da Estácio, com login real, feed, navegação inferior e visual bonito baseado no `design.md`.

**Tecnologias**:
- Backend: Django + Django REST Framework + JWT
- Frontend: React Native + Expo
- Banco de dados: SQLite (para MVP)

**Tempo estimado total**: 12–18 horas (distribuídas em vários dias)

---

## Fase 0: Preparação (✅ CONCLUÍDA)

- [x] Backend Django configurado com autenticação (login/cadastro)
- [x] Frontend Expo criado corretamente
- [x] `design.md` e logo do Faculflow prontos

---

## Fase 1: Polir o Visual (UI/UX Bonita) — ✅ CONCLUÍDA

- [x] Criar sistema de design centralizado (`src/constants/theme.js`)
- [x] Criar componentes reutilizáveis (Button, Input, Header, PostCard, UserCard)
- [x] Implementar navegação com Bottom Tabs + Stack Navigation
- [x] Adicionar a logo do Faculflow no Header da Home
- [x] Aplicar cores do `design.md` (#00BFA5, #1E3A8A, etc.)
- [x] Criar telas visuais: Home (Feed com banner + quick actions), Conectar (busca + filtros), Comunidade (grupos), Perfil (stats + menu)
- [x] Configurar `app.json` com branding do Faculflow

---

## Fase 2: Autenticação Real (Login + Cadastro) — ✅ CONCLUÍDA

- [x] Criar tela de Login e Cadastro (`LoginScreen.js`) com animações
- [x] Implementar chamadas à API (`/api/auth/register/` e `/api/auth/login/`)
- [x] Salvar token JWT usando `expo-secure-store` (seguro e criptografado)
- [x] Criar contexto de autenticação (`AuthContext`) com login/register/logout
- [x] Proteger as telas (só mostra abas após login via `AppNavigator`)
- [x] Implementar logout com confirmação
- [x] Interceptor Axios para injeção automática do token JWT
- [x] Token refresh automático quando expirado

**Backend atualizado com**:
- [x] Endpoint de token refresh (`/api/auth/token/refresh/`)
- [x] Models de Post e Community criados
- [x] Serializers com dados aninhados do autor
- [x] Views com ListCreateAPIView, busca, e perfil do usuário
- [x] Admin panel configurado para User, Post e Community

---

## Fase 3: Funcionalidades Principais do MVP — ✅ CONCLUÍDA

### 3.1 Tela Home (Feed)
- [x] Mostrar lista de posts/dicas (vindos do backend)
- [x] Botão de “Nova dica” (criar post)

### 3.2 Tela Conectar
- [x] Lista de usuários (mentores e calouros)
- [x] Busca simples por nome ou curso

### 3.3 Tela Comunidade
- [x] Grupos por curso ou temas (Carregados do banco)

### 3.4 Tela Perfil
- [x] Dados do usuário logado
- [x] Opção de editar perfil (já preparada no modelo)
- [x] Botão de Logout

---

## Fase 4: Polimento e Qualidade — ✅ CONCLUÍDA

1. [x] Indicadores de carregamento (ActivityIndicator) em todas as telas
2. [x] Tratamento de erros amigável (mensagens claras, sem alertas intrusivos no load inicial)
3. [x] Timestamps relativos nos posts ("há 5 min", "há 2h")
4. [x] Profile com dados reais da API + pull-to-refresh
5. [x] Menu do perfil com subtítulos descritivos
6. [x] PostCard com botão de compartilhar e bookmark alinhado
7. [x] Debounce na busca de usuários (ConnectScreen)
8. [x] Testes completos no celular (fluxo: cadastro → login → feed → criar post)
9. [x] Limpeza de código e imports corretos

---

## Fase 5: Deploy e Distribuição — ✅ CONCLUÍDA

- [x] Repositório no GitHub (github.com/zigifrid190-ui/FaculFlow)
- [x] Backend deployado no Railway com PostgreSQL
- [x] URL pública: https://faculflow-production.up.railway.app
- [x] Migrations e seed automáticos no startup
- [x] APK gerado via Expo EAS Build (perfil preview)
- [x] App instalado e testado no celular Android

---

## Arquitetura Atual do Projeto

```
FaculFlow/
├── backend/
│   ├── core/
│   │   ├── models.py        (User, Post, Community)
│   │   ├── serializers.py   (UserSerializer, PostSerializer, etc.)
│   │   ├── views.py         (Register, Login, CRUD endpoints)
│   │   ├── urls.py          (Todas as rotas da API)
│   │   └── admin.py         (Admin panel configurado)
│   ├── faculflow_backend/
│   │   ├── settings.py      (JWT, CORS, SQLite)
│   │   └── urls.py          (Roteamento principal)
│   ├── db.sqlite3
│   └── manage.py
│
├── frontend/faculflow-app/
│   ├── src/
│   │   ├── components/      (Button, Input, Header, PostCard, UserCard)
│   │   ├── constants/       (theme.js, api.js)
│   │   ├── context/         (AuthContext.js)
│   │   ├── navigation/      (AppNavigator.js, TabNavigator.js)
│   │   ├── screens/         (Login, Home, Connect, Community, Profile)
│   │   └── services/        (api.js - Axios client com interceptors)
│   ├── assets/              (Logo, ícones, splash)
│   ├── App.js               (Entry point)
│   └── app.json             (Expo config com branding)
│
├── design.md
├── FaculflowRoteiro.md
└── logo-faculflow.png
```

---

## ✅ MVP Completo!

O Faculflow MVP está funcional com:
- Autenticação real (JWT com refresh automático)
- Feed de dicas com criação de posts (dados reais do banco)
- Busca de usuários com filtro por tipo (calouro/veterano)
- Comunidades carregadas do banco de dados
- Perfil do usuário com dados da API
- Design system centralizado e consistente

**Para executar:**
1. Backend: `cd backend && python manage.py runserver 0.0.0.0:8000`
2. Frontend: `cd frontend/faculflow-app && npx expo start`
3. Atualize o IP em `src/constants/api.js` se necessário