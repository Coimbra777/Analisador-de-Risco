# Guia do projeto — Supplier Risk Analyzer

Este documento explica o repositório **como um tutor**: começa pelos conceitos (Node, Nest, fluxo HTTP), desce às pastas e módulos, e termina com testes manuais e frases para entrevista. Complementa o [README.md](README.md) (comandos e variáveis resumidas).

---

## Índice

1. [Como encaixar isto no mundo Node / Nest](#1-como-encaixar-isto-no-mundo-node--nest)
2. [Mapa mental do repositório](#2-mapa-mental-do-repositório)
3. [Backend: pastas e ficheiros centrais](#3-backend-pastas-e-ficheiros-centrais)
4. [Módulos Nest (análise um a um)](#4-módulos-nest-análise-um-a-um)
5. [Fluxo completo do backend (do HTTP à base de dados)](#5-fluxo-completo-do-backend-do-http-à-base-de-dados)
6. [Frontend: pastas, rotas e HTTP](#6-frontend-pastas-rotas-e-http)
7. [Integração com LLM](#7-integração-com-llm)
8. [Extração de texto por tipo de ficheiro](#8-extração-de-texto-por-tipo-de-ficheiro)
9. [Persistência e agregação](#9-persistência-e-agregação)
10. [Como testar manualmente](#10-como-testar-manualmente)
11. [Como explicar o projeto em entrevista](#11-como-explicar-o-projeto-em-entrevista)
12. [Leitura recomendada no código](#12-leitura-recomendada-no-código)

---

## 1. Como encaixar isto no mundo Node / Nest

### Node.js

O **Node** executa JavaScript no servidor e trata I/O de forma assíncrona (ficheiros, rede, base de dados). Este projeto usa **TypeScript** compilado para JavaScript.

### NestJS

**Nest** é um framework em cima do **Express** (por omissão) que organiza a aplicação em:

- **Módulos** (`@Module`) — agrupam controllers, services e imports.
- **Injeção de dependências** — classes `@Injectable()` recebem repositórios e serviços no construtor.
- **Controllers** — mapeiam URLs e verbos HTTP para métodos.
- **Guards / Pipes / Filters** — autenticação, validação de DTOs, formato de erros.

Benefício: o código de negócio não fica misturado com *wiring* HTTP bruto; dá para testar e evoluir por módulos.

### O que este projeto adiciona em cima disso

- **TypeORM** — entidades ↔ tabelas MySQL, repositórios e migrations.
- **JWT** — estado de sessão no token; o guard valida e preenche `request.user`.
- **Contrato `RiskAnalyzer`** — a “regra de negócio” de risco não está colada ao controller; pode ser keyword, LLM ou ambos com fallback.

---

## 2. Mapa mental do repositório

```
validacao-documentos-app/
├── README.md                 # Objetivo, stack, como rodar, env, modos, limitações
├── PROJECT_GUIDE.md          # Este guia (didático)
├── docker-compose.yml        # MySQL + backend + frontend (+ adminer)
├── .env.example              # Exemplo para Compose / variáveis partilhadas
├── backend/
│   ├── src/
│   │   ├── main.ts           # Bootstrap: prefixo api, pipes, filtro, CORS opcional
│   │   ├── app.module.ts     # Importa todos os módulos de feature
│   │   ├── config/           # ConfigModule + mapeamento env → objeto
│   │   ├── common/           # Cross-cutting: auth, filtros, mappers, mensagens
│   │   ├── database/         # TypeORM, entidades, enums, migrations
│   │   └── modules/        # auth, companies, analyses, documents, health
│   ├── test/                 # Testes e2e leves (ex.: health)
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── main.ts           # Vue app + router
    │   ├── router.ts         # Rotas e meta requiresAuth / guestOnly
    │   ├── features/         # auth, companies, analyses (páginas + API)
    │   └── shared/           # api-client, use-auth, tipos, UI
    └── .env.example
```

Regra prática: **`modules/<nome>`** = domínio; **`common`** = partilhado sem ser “feature” de negócio; **`database`** = modelo relacional e evolução do schema.

---

## 3. Backend: pastas e ficheiros centrais

| Pasta / ficheiro | Papel |
|------------------|--------|
| `main.ts` | Cria a app Nest, `setGlobalPrefix('api')`, `ValidationPipe` global, `GlobalExceptionFilter`, opcionalmente **CORS** se `CORS_ORIGIN` estiver definido, aviso de JWT fraco em produção. |
| `app.module.ts` | Só importa: config, base de dados, auth, health, companies, analyses, documents. |
| `config/app.config.ts` | Lê `process.env` e expõe `app`, `database`, `auth`, `storage`, `riskAnalyzer`, `llm`. Tudo o que o código precisa de ambiente deveria passar por aqui (ou ConfigService), não `process.env` espalhado. |
| `config/app-config.module.ts` | `ConfigModule.forRoot` com `load: [appConfig]` e ficheiros `.env`. |
| `database/database.module.ts` | `TypeOrmModule.forRootAsync` com opções de `typeorm.config.ts` / fábrica. |
| `database/entities/` | `User`, `Company`, `Analysis`, `Document`, `RiskFinding` — relações e colunas. |
| `database/migrations/` | Alterações versionadas do schema. |
| `common/filters/global-exception.filter.ts` | Resposta JSON unificada para erros; 500 genérico ao cliente. |
| `common/auth/` | `JwtAuthGuard`, `CurrentUser` decorator, tipo `JwtUserPayload`. |
| `common/mappers/analysis-response.mapper.ts` | Análise + relações → JSON de detalhe (incl. merge de achados para a UI). |
| `common/http/api-messages.ts` | Strings de negócio / erro reutilizáveis. |

---

## 4. Módulos Nest (análise um a um)

### `AuthModule`

- **Rotas:** `POST /api/auth/register`, `POST /api/auth/login` (sem JWT).
- **Service:** `bcrypt` para hash, `JwtService` para emitir token com `sub` e `email`.
- Resposta de utilizador **não** inclui `passwordHash`.

### `HealthModule`

- **Rota:** `GET /api/health` — estado da API (útil para Docker / load balancer).

### `CompaniesModule`

- **Rotas:** `GET/POST /api/companies` (com JWT).
- **Regra:** número de registo único **por** utilizador autenticado; resposta mapeada sem campos internos desnecessários.

### `AnalysesModule`

- **Rotas:** criar, listar, detalhe de análises; valida que a **empresa** e a **análise** pertencem ao utilizador.
- **Output:** mappers de lista e detalhe (`toAnalysisListResponse` / `toAnalysisDetailResponse`).

### `DocumentsModule` (coração do processamento)

- **Rota:** `POST /api/analyses/:analysisId/document` — `multipart`, campo **`file`**, JWT.
- Inclui: `FileStorageService`, `DocumentTextExtractionService`, `RiskRulesService`, `LlmRiskAnalyzer`, `SelectingRiskAnalyzer`, registo do token `RISK_ANALYZER` → `SelectingRiskAnalyzer`.
- **Service:** orquestra validação, armazenamento, extração, análise, transações e `syncAnalysisAggregate`.

---

## 5. Fluxo completo do backend (do HTTP à base de dados)

### Passo 0: Pedido entra

1. Caminho: `/api/...` (prefixo global).
2. **Exception filter** global captura erros ao fim; **ValidationPipe** valida DTOs antes do handler.
3. Rotas protegidas: **JwtAuthGuard** lê `Authorization: Bearer`, verifica o token, preenche `request.user` (ex.: `sub` = id do user).

### Passo 1: Upload de documento

1. `FileInterceptor('file')` (Multer) preenche `file` (buffer, nome, mime, tamanho).
2. `DocumentsService.uploadForAnalysis`:
   - valida ficheiro (obrigatório, tipo suportado, tamanho máx. `MAX_FILE_SIZE_BYTES`);
   - carrega a análise e confirma **ownership** (utilizador dono);
   - marca análise como em processamento (`AnalysisStatus` → valor persistido `in_progress`);
   - grava ficheiro em disco (`FileStorageService`) sob pasta `analysis-<id>`;
   - cria registo `Document` com `status` pending e `storageKey`.

### Passo 2: Extração

1. `DocumentTextExtractionService` recebe buffer + mime + nome.
2. Percorre implementações de **`DocumentTextExtractor`** (ordem fixa no módulo): PDF, DOCX, XLSX, imagem+OCR.
3. A primeira cujo `supports(mime, extensão)` seja verdadeiro extrai o texto.
4. Se o texto for vazio → erro de negócio (não processa risco com conteúdo inútil).

### Passo 3: Análise de risco

1. `this.riskAnalyzer.analyze({ extractedText })` — injetado via token `RISK_ANALYZER`, implementação = **`SelectingRiskAnalyzer`**.
2. Conforme `RISK_ANALYZER_MODE`:
   - **keyword** → `RiskRulesService` (listas de termos);
   - **llm** → `LlmRiskAnalyzer` (HTTP + parse JSON);
   - **llm_with_fallback** → tenta LLM; se falhar, keyword.

3. O resultado de domínio tem `riskLevel`, `summaryText`, `findings[]`.

### Passo 4: Persistência e agregação

1. Numa **transação**:
   - atualiza o `Document` (status available, `extractedText`, resumo, nível);
   - remove `RiskFinding` antigos desse `documentId` e insere os novos;
   - **`syncAnalysisAggregate`**: lê todos os documentos da análise, calcula status global, risco agregado (máximo entre documentos com sucesso), resumo consolidado, `completedAt` conforme regras.

2. Se qualquer exceção ocorrer a meio, outro caminho transacional pode marcar o documento como `failed` e ainda assim recalcula o agregado.

### Passo 5: Resposta

- Recarrega a análise com relações; devolve `message` + análise em formato mapeado (`toAnalysisDetailResponse`).

---

## 6. Frontend: pastas, rotas e HTTP

### Rotas (`frontend/src/router.ts`)

- `/login` — só convidado (`guestOnly`); se já autenticado, redireciona para empresas.
- `/`, `/companies`, `/analyses`, `/analyses/:id` — exigem **auth** (`requiresAuth`); se não houver token, redireciona para login com `redirect`.

### `shared/http/api-client.ts`

- `axios` com `baseURL: '/api'`.
- **Request:** anexa `Authorization: Bearer` a partir de `useAuth().token` (em memória + localStorage).
- **Response 401:** limpa sessão e envia para login (sessão expirada).

### `shared/auth/use-auth.ts`

- Guarda `token` e `user` (serializado) no `localStorage`; expõe `setSession`, `clearSession`, `isAuthenticated`.

### `features/*`

- Cada feature tem `api/*.ts` (chamadas REST) e `pages/` / `components/` (Vue).
- Formulários de login/registo, lista de empresas, análises e detalhe com upload e visualização de risco.

Fluxo de utilizador típico: **login** → **empresas** → **análises** → **detalhe** → **upload** → ver estado e badges de risco.

---

## 7. Integração com LLM

### Onde está

- Ficheiro: `backend/src/modules/documents/llm-risk.analyzer.ts` (`LlmRiskAnalyzer`).

### O que faz

1. Lê `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`, limites e timeout de `app.config` / `ConfigService`.
2. Corta o texto a `LLM_MAX_INPUT_CHARS`.
3. Envia `POST` para `{LLM_BASE_URL}/chat/completions` com `fetch`, corpo estilo OpenAI (mensagens `system` + `user` pedindo **só** JSON com `riskLevel`, `summary`, `findings`).
4. Opcionalmente define `response_format: { type: 'json_object' }` (controlado por `LLM_JSON_OBJECT_MODE`).
5. A string da resposta passa em **`parseRiskClassificationFromLlmJson`** — valida e normaliza para o tipo interno; se falhar, lança (e no modo puro `llm` o documento falha; no `llm_with_fallback` o `SelectingRiskAnalyzer` cai para keyword).

### Por que contrato + parser

- O domínio não persiste “qualquer JSON”; só estrutura validada.
- Trocar de modelo ou URL é mudar **env**, não o fluxo do upload.

---

## 8. Extração de texto por tipo de ficheiro

| Tipo | Implementação (resumo) |
|------|------------------------|
| **PDF** | `pdf-parse` + fallback leve de leitura de streams (PDFs “estranhos”) |
| **DOCX** | Mammoth — texto contínuo |
| **XLSX** | SheetJS — abas transformadas em texto estilo linhas/CSV |
| **Imagem** (jpg, png, …) | Tesseract.js; idiomas via `OCR_LANGS` |

A escolha do extractor é **sempre** a primeira `supports(mime, extensão)` verdadeira. Por isso, com `application/octet-stream`, a **extensão** do ficheiro é crítica.

A validação no upload reutiliza a mesma lógica de suporte: se nenhum extractor aceitar, resposta **400** (tipo não suportado).

---

## 9. Persistência e agregação

### Tabelas (conceito)

- **users** — credenciais e perfil.
- **companies** — empresas do utilizador.
- **analyses** — “caso” por empresa, estado (`pending` / `in_progress` / `completed` / `failed` em termos de enum persistido), risco e resumo agregados.
- **documents** — um ficheiro processado, texto extraído, nível por documento, status.
- **risk_findings** — achados por análise e documento (código, título, descrição, severidade).

### Agregação (`analysis-aggregate.util` + `syncAnalysisAggregate` no service)

- Particiona documentos: disponíveis (com risco), falhados, pendentes.
- Se existir pelo menos um documento **com sucesso** com nível, a análise fica “concluída” e o **nível da análise** é o **máximo** entre os níveis dos documentos bem-sucedidos (HIGH > MEDIUM > LOW).
- O resumo agregado junta resumos por ficheiro e pode acrescentar nota se alguns documentos falharam.
- Se **todos** falharem (sem pendentes), a análise pode ir para estado de falha global; ver implementação concreta no service para o caso vazio e mistos.

Isto evita que o último upload apague o significado agregado dos anteriores sem intenção.

---

## 10. Como testar manualmente

### Preparação

1. MySQL a correr, base criada, migrations aplicadas (`backend/`: `npm run migration:run`).
2. Backend com `.env` válido, `npm run start:dev`.
3. Frontend com `npm run dev`, abrir o browser em `http://localhost:5173`.

### Percurso feliz (UI)

1. Registar utilizador e iniciar sessão.
2. Criar empresa e análise.
3. Anexar um PDF pequeno com texto ou um DOCX; confirmar que o detalhe da análise mostra risco e documento `available`.

### Modos de análise

1. **Keyword:** deixe `RISK_ANALYZER_MODE=keyword` (ou omissa). Inclua no PDF texto com termos da lista (ex. palavras em `RiskRulesService` — crítico vs. atenção) e veja o nível subir.
2. **LLM:** defina `LLM_API_KEY`, `RISK_ANALYZER_MODE=llm`, reinicie. Envie documento; verifique resumo e achados. Teste com chave inválida — o processamento do documento deve falhar.
3. **Fallback:** `RISK_ANALYZER_MODE=llm_with_fallback` com chave errada; deve cair no keyword e ainda concluir (ver logs de *warn*).

### Chamadas API (exemplo)

```bash
BASE=http://localhost:3000/api
curl -sS "$BASE/health"
```

Registo, login, token e `GET /companies` com `Authorization: Bearer` — ver secção 15 de [docs/GUIA-TECNICO-COMPLETO.md](docs/GUIA-TECNICO-COMPLETO.md) para *curl* completos.

Upload via `curl` (campo `file`):

```bash
curl -X POST "$BASE/analyses/1/document" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/caminho/para/ficheiro.pdf"
```

(Substitua `1` pelo id real da análise.)

### CORS em dev

- Normalmente **não** precisa: o Vite faz proxy de `/api` para o backend.
- Com front noutro origin em produção, defina `CORS_ORIGIN` no backend (ver README).

### Testes automáticos

- `cd backend && npm test`
- `cd frontend && npm test`

---

## 11. Como explicar o projeto em entrevista

### 20–30 segundos

> É um sistema fullstack em NestJS e Vue para triagem de risco de fornecedores. O utilizador submete documentos a uma análise; o backend extrai texto de PDF, Office ou imagem com OCR, classifica risco com regras ou LLM (configurável, com opção de fallback) e agrega o resultado numa análise com vários ficheiros. O desenho separa extração e motor de risco com contratos, o que facilita evoluir para fila e cloud storage.

### 1 minuto (mais técnico)

> Usei Nest com módulos por domínio: auth, empresas, análises e documentos. O upload é síncrono no MVP: grava o ficheiro, extrai texto com extractors por tipo, chama uma interface `RiskAnalyzer` resolvida para keyword, LLM ou LLM com fallback. Persiste texto, nível e achados por documento e recalcula a análise com uma regra de máximo entre níveis. O LLM fala com uma API estilo OpenAI e o JSON da resposta é validado antes de gravar. O front usa Axios com JWT e o proxy do Vite em desenvolvimento. As limitações são processamento síncrono e disco local — o roadmap natural é fila e object storage.

### Se perguntarem “e se o LLM alucinar?”

> O modelo produz *hipóteses*; o parser garante a forma dos dados, e no modo híbrido ainda temos o fallback de keywords. Para produção crítica, combinaria isso com revisão humana, fontes externas e testes de regressão de prompt — o código está preparado para trocar implementação de `RiskAnalyzer` sem reescrever o pipeline de upload.

---

## 12. Leitura recomendada no código

| Ordem | Ficheiro | Porquê |
|-------|----------|--------|
| 1 | `backend/src/main.ts` | Bootstrap, pipes, filtro, CORS |
| 2 | `backend/src/modules/documents/documents.service.ts` | Fluxo E2E do documento e agregação |
| 3 | `backend/src/modules/documents/selecting-risk.analyzer.ts` | Modos de análise |
| 4 | `backend/src/modules/documents/text-extraction/document-text-extraction.service.ts` | Escolha do extractor |
| 5 | `backend/src/common/mappers/analysis-response.mapper.ts` | Forma do JSON do detalhe |
| 6 | `frontend/src/shared/http/api-client.ts` + `router.ts` | Integração e proteção de rotas |

Com estes, consegue explicar 80% do sistema em viva voz e apontar extensões futuras (fila, S3, e2e) sem contradizer o repositório.

---

*Bom estudo. O [README.md](README.md) mantém a referência rápida de comandos e variáveis; este guia foca a compreensão profunda e a narrativa para entrevista.*
