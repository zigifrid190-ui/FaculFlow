# 🪐 FaculFlow — Master Engineering Roadmap & Architecture Guide (V3.0)

> **Status:** MVP Avançado | **Protocolo:** Olympus Active | **Design System:** Linear/Premium
> **Agentes Orquestradores:** `@orchestrator`, `@frontend-specialist`, `@backend-specialist`, `@security-auditor`, `@mobile-developer`

---

## 📋 1. Visão Arquitetural e Diagnóstico de Elite

O FaculFlow evoluiu de um MVP para um ecossistema funcional. Para atingir o nível "Production-Ready", seguiremos os padrões de engenharia da Vercel e Linear.

| Dimensão | Score | Especialista Responsável | Meta 2026 |
| :--- | :--- | :--- | :--- |
| **Segurança & Compliance** | 2/10 | `@security-auditor` | OWASP Top 10 + JWT Rotate |
| **UI/UX Aesthetics** | 7/10 | `@frontend-specialist` | Dark Mode + Linear Motion |
| **Backend Resilience** | 4/10 | `@backend-specialist` | Redis Cache + PostgreSQL |
| **Mobile Performance** | 5/10 | `@mobile-developer` | Infinite Scroll + local cache |
| **Testing Coverage** | 1/10 | `@test-engineer` | 80% Unit + E2E Playwright |

---

## 🔴 FASE 1: Hardening & Core Resilience (Prioridade P0)

### 1.1. Backend Hardening (`@security-auditor`)
*Baseado em: .agent/agents/security-auditor.md e .agent/skills/vulnerability-scanner*

- [x] **Protocolo de Senha Argon2/PBKDF2:** Implementar validação rigorosa (regex: `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$`). (✅ Implementado)
- [x] **Validação de senha forte** — Mínimo 8 caracteres, letras + números no registro. (✅ Implementado)
- [x] **Rate Limiting** — Implementar `django-ratelimit` (via DRF Throttling) para evitar ataques de força bruta no login. (✅ Implementado)
- [x] **CORS Restritivo** — Substituir `ALLOW_ALL` por lista de origens permitidas (Railway/Vercel). (✅ Implementado)
- [x] **Sanitização de Input** — Validar conteúdo dos posts/mensagens contra XSS e Injection. (✅ Implementado)
- [x] **SECRET_KEY Rotativa** — Garantir chaves seguras via variáveis de ambiente no deploy. (✅ Implementado)
- [x] **Paginação na API** — Adicionar `PageNumberPagination` para evitar crash em listas longas. (✅ Implementado)
- [ ] **Enviroment Security:** Auditoria de segredos via `python .agent/scripts/checklist.py --security`.

### 1.2. API Stability & Scalability (`@backend-specialist`)
*Baseado em: .agent/skills/api-patterns e .agent/skills/database-design*

- [x] **Paginação Universal (DRF):** Implementar `CursorPagination` para feeds em tempo real (Home/Comunidades). (✅ Implementado)
- [x] **DB Migration (SQLite → PostgreSQL):** Planejamento de transição para o Railway. (✅ Implementado)
- [x] **Computed Fields Optimization:** Refatorar `hot_score` e `is_member` para consultas anotadas (QuerySets) eficientes. (✅ Implementado)

---

## 🟡 FASE 2: Interação Social & Social Graph (Prioridade P1)

### 2.1. Social Engine (`@product-owner`)
- [x] **Functional Social Actions:**
  - [x] Implementar Model/View de `Like` com debounce no frontend. (✅ Implementado)
  - [x] Sistema de `Comments` encadeados no feed principal. (✅ Implementado)
  - [x] Botão de "Salvar" (Bookmark) com persistência local e remota. (✅ Implementado)
- [ ] **Rich Media Pipeline:**
  - [ ] Integração com Cloudinary/S3 para upload de imagens.
  - [ ] Compressão de imagem no lado do cliente antes do upload.

### 2.2. Messaging Core (`@orchestrator`)
*Baseado em: .agent/agents/orchestrator.md*

- [x] **Chat 1-a-1 Privado:** Canal dedicado após Match de Mentoria. (✅ Implementado)
- [ ] **Real-time Notifications:** Implementar `expo-notifications` para sinalizar interações sociais.
- [ ] **Badges Dinâmicos:** Contador de notificações persistente no ícone do sino.

---

## 🟢 FASE 3: UX Premium & Visual Motion (Prioridade P2)

### 3.1. Design System Sync (`@frontend-specialist`)
*Diretrizes: DESIGN-SYSTEMS/linear-app/DESIGN.md*

- [ ] **Linear Aesthetic Implementation:**
  - [ ] **Dark Mode Native:** Paleta `#08090a` (BG) e `#f7f8f8` (Texto).
  - [ ] **Luminance Stacking:** Elevação de cards via opacidade de branco (0.02 → 0.05).
  - [ ] **Dark Mode** — Suporte total a temas claro/escuro.
- [x] **Skeleton Loading** — Substituir spinners por placeholders animados (estilo Facebook/Instagram). (✅ Implementado)
- [ ] **Animações Reanimated** — Transições suaves entre telas e feedbacks hápticos (vibração).
- [ ] **Paginação Infinita** — Carregar mais itens conforme o usuário rola a tela (Lazy Loading).
- [ ] **Cache Local** — Persistência temporária do feed para carregamento instantâneo offline.

### 3.2. Performance Optimization (`@performance-optimizer`)
- [ ] **Offline-First Storage:** AsyncStorage para cache de feed e dados de perfil.
- [ ] **Image Optimization:** Lazy loading e thumbnails para avatares na lista de conexões.

### 3.3. Gamificação & Battle Pass (Passe de Batalha) (`@frontend-specialist` + `@backend-specialist`)
*Inspirado em: DESIGN-SYSTEMS/duolingo/DESIGN.md e Mecânicas de Jogos*

- [ ] **Modelagem Backend de XP & Recompensas (Django):**
  - [ ] Estender model `User` com `xp` (Integer), `level` (Integer), `streak` (Integer) e `last_activity` (DateTime).
  - [ ] Criar model `BattlePassReward` representando as recompensas desbloqueáveis por nível (descontos na mensalidade, horas extracurriculares, copos e camisas personalizadas).
  - [ ] Implementar triggers de backend que concedem XP a Veteranos por ajudar calouros (aceitar conexões, manter chats diários, avaliações positivas).
  - [ ] Criar endpoint `/api/user/battle-pass/` para progresso, conquistas e resgate de recompensas.
- [ ] **Painel do Passe de Batalha (Frontend - React Native):**
  - [ ] **Duolingo-style Progress Bar:** Barra de progresso 3D animada para controle de XP e indicação de level-up.
  - [ ] **Streak Indicator:** Contador visual animado de ofensiva de dias ativos (ícone de fogo no topo do perfil).
  - [ ] **Battle Pass Tier Grid:** Exibição elegante em grade dos níveis/recompensas bloqueadas/desbloqueadas com botão "Resgatar" táctil.
  - [ ] Diferenciar temas: Verde/Laranja para Calouros (Missões de Integração) e Azul/Dourado para Veteranos (Mentoria & Recompensas).

---

## 🔵 FASE 4: Automation & Quality Assurance (Prioridade P3)

### 4.1. CI/CD & Testing (`@test-engineer`)
*Baseado em: .agent/scripts/verify_all.py*

- [ ] **Backend Unit Tests:** Cobertura de 100% nos serializers e models críticos.
- [ ] **E2E Testing:** Playwright/Detox para fluxo de Login → Match → Comunidade.
- [ ] **Automated Audits:** Integrar `checklist.py` no workflow do GitHub Actions.

---

## 🛠️ Débito Técnico & Manutenção

| Componente | Problema | Ação Corretiva |
| :--- | :--- | :--- |
| `ConnectScreen.js` | Lógica de Match acoplada | ✅ (Modularizado em MatchComponents) |
| `App.js` | Fontes não carregadas | ✅ (Inter & Poppins configuradas) |
| `HomeScreen.js` | Quick Actions sem navegação | ✅ (Conectadas ao Connect e Comunidade) |
| `services/api.js` | Hardcoded IPs | Implementar `Environment.js` para chaveamento de prod/dev |
| `Models` | Falta de Relationships | Adicionar ManyToMany para `MentorshipHistory` |

---

## 🏁 Critérios de Sucesso para V3.0
1. **Lighthouse Mobile Score:** > 90.
2. **Crash-free sessions:** 99.9%.
3. **Security Audit:** Zero vulnerabilidades críticas via `checklist.py`.

> **Próxima Ação Imediata:** Iniciar **Fase 1.1 (Rate Limiting e Senha Forte)** e **Fase 3.1 (Carregamento de Fontes e Skeleton Loading)**.
