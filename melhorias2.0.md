# 🚀 Faculflow 2.0 — Roteiro de Melhorias

**Auditoria realizada em:** 02/05/2026  
**Estado atual:** MVP completo, deployado no Railway + APK Android  
**Análise por:** Orchestrator (frontend-specialist + backend-specialist + security-auditor + mobile-developer)

---

## 📊 Diagnóstico Geral do Projeto

| Área | Nota | Observação |
|------|------|------------|
| **Funcionalidade** | ⭐⭐⭐⭐ | Fluxo completo funciona (auth, feed, busca, comunidades) |
| **UI/UX** | ⭐⭐⭐ | Design limpo, mas sem animações avançadas ou dark mode |
| **Segurança** | ⭐⭐ | JWT básico, sem validações de senha forte, sem rate limiting |
| **Performance** | ⭐⭐⭐ | Funciona bem, mas sem paginação no feed |
| **Escalabilidade** | ⭐⭐ | SQLite em prod, sem cache, sem filas |
| **Testes** | ⭐ | Nenhum teste automatizado |
| **Código** | ⭐⭐⭐ | Organizado, mas sem tipagem e com alguns padrões duplicados |

---

## 🔴 Prioridade CRÍTICA (Segurança e Estabilidade)

### 1. Segurança do Backend
- [ ] **Validação de senha forte** — Mínimo 8 caracteres, letras + números
- [ ] **Rate limiting** no login — Evitar ataques de força bruta (ex: `django-ratelimit`)
- [ ] **CORS restritivo** — Trocar `CORS_ALLOW_ALL_ORIGINS = True` por uma lista de origens permitidas
- [ ] **SECRET_KEY rotativa** — Gerar uma chave criptograficamente segura no Railway
- [ ] **Sanitização de input** — Validar `content` dos posts contra XSS/injection
- [ ] **Paginação na API** — Sem paginação, o `/api/posts/` pode retornar milhares de registros e crashar

### 2. Tratamento de Erros Robusto
- [ ] **Tela de erro global** — Catch de erros não tratados no React Native (ErrorBoundary)
- [ ] **Retry automático** — Quando a API falha, tentar novamente antes de mostrar erro
- [ ] **Offline mode** — Mostrar mensagem amigável quando não tem internet
- [ ] **Token expirado** — Redirecionar para login quando refresh token falha (já tem interceptor, mas falta UI)

---

## 🟡 Prioridade ALTA (Funcionalidades Essenciais)

### 3. Funcionalidades de Engajamento
- [ ] **Curtir posts** — Botão de ❤️ funcional com endpoint `POST /api/posts/{id}/like/`
- [ ] **Comentários** — Tela de comentários abrindo ao clicar em um post
- [ ] **Entrar em comunidade** — Botão "Entrar" funcional com `POST /api/communities/{id}/join/`
- [ ] **Editar perfil** — Tela de edição (bio, curso, semestre) usando `PATCH /api/users/me/`
- [ ] **Excluir posts** — Só o autor pode excluir seus próprios posts
- [ ] **Denunciar posts** — Botão de report com endpoint no backend

### 4. Notificações
- [ ] **Push notifications** com Expo (expo-notifications)
- [ ] **Badges** — Contador de notificações não lidas no ícone do sino
- [ ] **Notificação de novo comentário/curtida** no seu post

### 5. Chat / Mensagens Diretas
- [ ] **Tela de conversas** — Lista de chats ativos
- [ ] **Chat 1-a-1** — Mensagens em tempo real entre calouro e veterano
- [ ] **WebSocket** — Django Channels para chat em tempo real
- [ ] **Indicador online/offline** — Mostrar quem está online

---

## 🟢 Prioridade MÉDIA (UX e Qualidade)

### 6. Melhorias de UI/UX
- [ ] **Dark Mode** — Toggle de tema (usar `useColorScheme` + Context)
- [ ] **Animações de transição** — `react-native-reanimated` para transições suaves entre telas
- [ ] **Skeleton loading** — Placeholder animado enquanto carrega (em vez de spinner)
- [ ] **Imagens nos posts** — Upload de foto via `expo-image-picker`
- [ ] **Avatar com foto** — Upload de foto de perfil (armazenar no S3/Cloudinary)
- [ ] **Haptic feedback** — Vibração suave ao curtir/interagir (`expo-haptics`)
- [ ] **Onboarding** — Telas de boas-vindas para novos usuários (3 slides explicando o app)
- [ ] **Pull-to-refresh nas comunidades** — Atualmente só Home e Profile têm

### 7. Melhorias de Performance
- [ ] **Paginação infinita** — Carregar 20 posts por vez, mais ao rolar para baixo
- [ ] **Cache local** — Salvar dados localmente com `@react-native-async-storage` para abrir instantâneo
- [ ] **Otimização de imagens** — Lazy load + thumbnails para avatares
- [ ] **useMemo/useCallback** — Evitar re-renders desnecessários nos componentes pesados
- [ ] **Compressão de imagens** antes do upload

### 8. Testes Automatizados
- [ ] **Testes unitários backend** — `pytest` para models, serializers e views
- [ ] **Testes de API** — Testar todos os endpoints com dados válidos/inválidos
- [ ] **Testes de componentes** — `@testing-library/react-native` para PostCard, UserCard, Button
- [ ] **Testes E2E** — Detox ou Maestro para testar fluxo completo no dispositivo
- [ ] **CI/CD** — GitHub Actions rodando testes automaticamente a cada push

---

## 🔵 Prioridade BAIXA (Escalabilidade e Futuro)

### 9. Infraestrutura e DevOps
- [ ] **Migrar para PostgreSQL dedicado** — Quando ultrapassar o free tier do Railway
- [ ] **Redis** — Cache de sessão e filas de background jobs
- [ ] **Celery** — Tasks assíncronas (envio de emails, notificações)
- [ ] **CI/CD pipeline** — Deploy automático via GitHub Actions
- [ ] **Monitoramento** — Sentry para crash reports no app e no backend
- [ ] **Logs estruturados** — Usando `structlog` no Django
- [ ] **CDN para mídia** — Cloudinary ou AWS S3 para imagens/avatares

### 10. Funcionalidades Futuras (v3.0+)
- [ ] **Calendário acadêmico** — Datas de provas, matrículas, eventos
- [ ] **Sistema de mentoria formal** — Match calouro ↔ veterano por curso/interesse
- [ ] **Mapa do campus** — Localização de salas, bibliotecas, cantinas
- [ ] **Material de estudo** — Upload/compartilhamento de PDFs e links
- [ ] **Ranking/Gamificação** — Pontos por dicas publicadas, curtidas recebidas
- [ ] **Versão iOS** — Build via `eas build --platform ios` (necessita conta Apple Developer $99/ano)
- [ ] **PWA (Web)** — Versão web responsiva do app
- [ ] **Integração com sistema da Estácio** — Login via matrícula (se a universidade permitir)

---

## 🛠️ Débito Técnico Identificado

### Código Frontend
| Arquivo | Problema | Solução |
|---------|----------|---------|
| `api.js` | Header `Bypass-Tunnel-Reminder` desnecessário em prod | Remover ou condicionar com `__DEV__` |
| `ProfileScreen.js` | Importa `usersAPI` mas `updateUser` do AuthContext não existe | Implementar `updateUser` no AuthContext |
| `HomeScreen.js` | Quick actions "Mentores", "Grupos", "Eventos" com `onPress: () => {}` | Implementar navegação ou remover |
| `PostCard.js` | Botões de like/comment/bookmark são visuais, não funcionais | Conectar com endpoints reais |
| `UserCard.js` | Botão de "conectar" é visual, sem ação | Implementar lógica de conexão/follow |
| `CommunityScreen.js` | Botão "Entrar" sem ação | Implementar join/leave de comunidade |
| `theme.js` | Fontes `Inter` definidas mas nunca carregadas | Adicionar `expo-font` + `useFonts` no App.js |

### Código Backend
| Arquivo | Problema | Solução |
|---------|----------|---------|
| `views.py` | Sem paginação em nenhum endpoint | Adicionar `PageNumberPagination` |
| `serializers.py` | Post não retorna `likes` nem `comments` count | Adicionar campos calculados |
| `models.py` | Sem model de `Like`, `Comment`, `Connection` | Criar os models relacionais |
| `settings.py` | `CORS_ALLOW_ALL_ORIGINS = True` em produção | Restringir ou usar regex |
| `urls.py` | Rotas de auth estão em `/api/auth/` mas views estão flat | OK, mas documentar melhor |

---

## 📋 Plano de Sprints Sugerido

### Sprint 1 (Semana 1-2): Segurança + Paginação
- Implementar rate limiting
- Adicionar paginação no feed
- Restringir CORS
- Criar ErrorBoundary no frontend

### Sprint 2 (Semana 3-4): Interação Social
- Curtidas (model + endpoint + botão funcional)
- Comentários (model + tela + endpoint)
- Editar perfil (tela + endpoint)

### Sprint 3 (Semana 5-6): Comunidades
- Entrar/sair de comunidade
- Tela de detalhes da comunidade
- Posts dentro de comunidades

### Sprint 4 (Semana 7-8): UX Premium
- Dark mode
- Skeleton loading
- Animações com Reanimated
- Onboarding de novos usuários

### Sprint 5 (Semana 9-10): Chat + Notificações
- Chat 1-a-1 com WebSocket
- Push notifications
- Badge de notificações

### Sprint 6 (Semana 11-12): Testes + CI/CD
- Testes unitários (backend)
- Testes de componentes (frontend)
- GitHub Actions pipeline
- Sentry para crash reports

---

## 🎯 Meta Final

> Transformar o Faculflow de um **MVP funcional** em uma **plataforma completa de mentoria universitária** que pode ser apresentada como TCC, pitch para a Estácio, ou até startup.

**Tecnologias recomendadas para as próximas fases:**
- 🔄 **Django Channels** — Chat em tempo real
- 📸 **Cloudinary** — Upload de imagens
- 🔔 **Expo Notifications** — Push notifications
- 🎨 **react-native-reanimated** — Animações fluidas
- 🧪 **pytest + testing-library** — Testes automatizados
- 📊 **Sentry** — Monitoramento de erros

---

*Documento gerado após auditoria completa do código frontend (7 telas, 5 componentes, 3 services) e backend (3 models, 4 views, 4 serializers, 7 endpoints).*
