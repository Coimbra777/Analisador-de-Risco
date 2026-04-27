# Guia técnico completo — Supplier Risk Analyzer

Este documento explica o projeto **do zero**, como um mentor explicaria para alguém que quer dominar o sistema e defendê-lo em entrevista. Ele complementa o `README.md` (comandos e variáveis de ambiente) com **conceitos, fluxos e decisões**.

### Índice

1. [Visão geral do projeto](#1-visão-geral-do-projeto)
2. [Arquitetura geral](#2-arquitetura-geral)
3. [Fluxo completo da aplicação](#3-fluxo-completo-da-aplicação-passo-a-passo)
4. [Estrutura de pastas (backend)](#4-estrutura-de-pastas-backend)
5. [Sistema de extração de texto](#5-sistema-de-extração-de-texto)
6. [Sistema de análise de risco](#6-sistema-de-análise-de-risco)
7. [Integração com LLM](#7-integração-com-llm)
8. [Persistência e banco de dados](#8-persistência-e-banco-de-dados)
9. [Agregação de múltiplos documentos](#9-agregação-de-múltiplos-documentos)
10. [Frontend (Vue)](#10-frontend-vue)
11. [Decisões arquiteturais importantes (recap)](#11-decisões-arquiteturais-importantes-recap)
12. [Limitações do projeto (honestidade técnica)](#12-limitações-do-projeto-honestidade-técnica)
13. [Próximos passos (roadmap)](#13-próximos-passos-roadmap)
14. [Como explicar em entrevista](#14-como-explicar-em-entrevista)
15. [Operação, CORS, migrations e teste dos modos de análise](#15-operação-cors-migrations-e-teste-dos-modos-de-análise)
16. [Leitura sugerida no repositório](#leitura-sugerida-no-repositório)

---

## 1. Visão geral do projeto

### Qual problema resolve

Organizações precisam **avaliar risco** (ex.: contratar ou manter um fornecedor) com base em **documentos** — contratos, demonstrações, e-mails exportados, planilhas, scans. Ler tudo manualmente não escala e é difícil padronizar.

Este sistema oferece um **fluxo digital mínimo**: o usuário associa documentos a uma **análise** ligada a uma **empresa** e recebe um **nível de risco** (baixo / médio / alto), um **resumo** e **achados** que ficam **gravados no banco**, podendo ser consultados depois.

### Como funciona no alto nível

1. O usuário **se autentica** (JWT).
2. Cadastra **empresas** e cria **análises** (uma análise = um “caso” para aquela empresa).
3. **Envia um ou mais arquivos** para uma análise.
4. O backend **salva o arquivo**, **extrai texto** conforme o tipo (PDF, imagem, DOCX, XLSX), **analisa o texto** (palavras-chave ou LLM, configurável) e **atualiza** o documento e a análise.
5. O frontend **lista análises** e mostra **detalhe** com documentos, status e resultado agregado.

### Principais fluxos

| Fluxo | Resumo |
|--------|--------|
| **Onboarding de dados** | Registro → login → empresa → análise |
| **Processamento de documento** | Upload → extração → análise → persistência → agregação |
| **Consulta** | Listagem e detalhe da análise com documentos e achados |

Tudo isso é **síncrono** no request HTTP do upload (MVP): não há fila de jobs neste momento.

---

## 2. Arquitetura geral

### Por que NestJS

**NestJS** é um framework Node.js com opinião clara sobre **módulos**, **injeção de dependências** e **camadas** (controller → service). Isso ajuda a:

- separar responsabilidades sem virar um monólito “bola de lama”;
- testar e trocar implementações (ex.: LLM vs keyword) com **contratos**;
- alinhar com padrões que empresas já usam (similar a ideias de Angular/Spring na organização).

Para um portfólio, mostra que você estrutura API **profissionalmente**, não só scripts Express soltos.

### O que é arquitetura modular

Em vez de um único arquivo gigante, o app é dividido em **módulos Nest**, cada um com um **domínio** ou **capacidade**:

- cada módulo declara **controllers** (HTTP), **providers** (services, repositórios lógicos), **imports** (outros módulos que precisa);
- o **AppModule** só **importa** módulos de feature e infra (config, banco).

**Modular** aqui significa: *mudanças em “documentos” não exigem abrir “auth” o tempo todo*, e as fronteiras ficam explícitas.

### Como os módulos estão organizados

No `AppModule` entram, em ordem prática de dependência:

| Módulo | Papel |
|--------|--------|
| `AppConfigModule` | Carrega variáveis de ambiente (`app.config.ts`). |
| `DatabaseModule` | TypeORM + MySQL, entidades registradas. |
| `AuthModule` | Registro, login, JWT. |
| `HealthModule` | Saúde da API (operacional). |
| `CompaniesModule` | CRUD de empresas (escopo por usuário). |
| `AnalysesModule` | CRUD de análises vinculadas a empresa. |
| `DocumentsModule` | Upload, extração de texto, análise de risco, persistência. |

`DocumentsModule` importa `AuthModule` para reutilizar o mesmo **guard** JWT nos endpoints protegidos.

### Como o backend fala com o frontend

- **Backend** expõe HTTP em uma porta (ex.: `3000`) com prefixo global **`/api`** (`main.ts`).
- **Frontend** (Vite) roda em outra porta (ex.: `5173`) e usa **Axios** com `baseURL: '/api'`.
- Em desenvolvimento, o **Vite proxy** encaminha `/api` para `http://localhost:3000`, evitando CORS chato no MVP.

Em produção, costuma-se servir o frontend estático atrás do mesmo domínio ou configurar CORS explicitamente — o projeto foca no fluxo dev com proxy.

### Como a API REST está estruturada

Padrão **recurso + verbo HTTP**:

- Rotas agrupadas por domínio (`/api/auth/...`, `/api/companies`, `/api/analyses`, etc.).
- Respostas JSON; erros com corpo padronizado pelo **exception filter** global.
- **ValidationPipe** global: DTOs com `class-validator` rejeitam campos extras e tipos inválidos.
- Upload de documento: **`POST /api/analyses/:analysisId/document`** com `multipart/form-data` e campo `file`.

A consistência (prefixo `api`, guards, pipe) é o que você descreve em entrevista como “API REST disciplinada em Nest”.

---

## 3. Fluxo completo da aplicação (passo a passo)

Imagine que o usuário já está logado e tem uma análise `id = 5`.

### 1) Upload do documento

- O frontend envia **POST** com arquivo.
- O **`DocumentsController`** usa `JwtAuthGuard`: sem token válido, nem entra no service.
- `FileInterceptor('file')` coloca o arquivo em `req.file` (buffer, nome original, mime, tamanho).

### 2) Persistência inicial (metadata)

- `DocumentsService.uploadForAnalysis` valida arquivo (obrigatório, tipo suportado, tamanho).
- Marca a análise como **em processamento** (`in_progress`), limpando `completed_at` até sabermos o resultado.
- **`FileStorageService`** grava bytes no disco (path por `analysisId`).
- Cria registro **`Document`** com status **`pending`**, `mimeType`, `storageKey`, etc. Ainda **não** tem texto extraído nem risco.

### 3) Extração de texto

- O service chama **`DocumentTextExtractionService.extractText`** com `buffer`, `mimetype`, `originalFilename`.

### 4) Escolha do extractor

- O orquestrador mantém uma **lista ordenada** de implementações do contrato **`DocumentTextExtractor`** (PDF, DOCX, XLSX, imagem).
- Para cada uma, pergunta: **`supports(mime, extensão)?`**
- O **primeiro que aceitar** extrai o texto.

**Por que ordem importa:** quando o navegador manda `application/octet-stream`, só a **extensão** (`.pdf`, `.docx`, …) diferencia o tipo; a ordem evita ambiguidade.

### 5) Chamada do analyzer

- Se o texto extraído não for vazio, o service chama **`RiskAnalyzer.analyze({ extractedText })`**.
- Na injeção, `RISK_ANALYZER` aponta para **`SelectingRiskAnalyzer`**, não para uma implementação fixa.

### 6) Integração com LLM (quando configurado)

- Se `RISK_ANALYZER_MODE=llm` (ou `llm_with_fallback` na primeira tentativa), o **`LlmRiskAnalyzer`**:
  - monta mensagens **system + user** (system define o **formato JSON** esperado);
  - faz **POST** para `{LLM_BASE_URL}/chat/completions` com `fetch`;
  - opcionalmente usa `response_format: json_object` (OpenAI e compatíveis);
  - lê `choices[0].message.content` e passa o string para o **parser**.

### 7) Fallback para keyword

- Se o modo for **`llm_with_fallback`** e o LLM falhar (rede, 4xx/5xx, JSON inválido, timeout, chave ausente no erro, etc.), o **`SelectingRiskAnalyzer`** captura o erro, **loga** e chama **`RiskRulesService.analyze`** — a mesma lógica de **termos críticos / atenção** de sempre.

Isso é **resiliência de MVP**: demo e ambiente instável continuam “respondendo algo útil”.

### 8) Persistência do resultado

- Dentro de uma **transação**:
  - atualiza o **documento**: `available`, `extractedText`, `summaryText`, `riskLevel`;
  - **apaga** `RiskFinding` só daquele `documentId` e reinsere os achados novos;
  - chama **`syncAnalysisAggregate`**.

Se algo estourar **depois** de existir linha de documento, o catch externo marca o documento como **`failed`** e recalcula o agregado (ver item 9).

### 9) Agregação da análise

- Lê **todos** os documentos da análise.
- Separa: disponíveis (com risco), falhos, pendentes.
- **Regra de negócio:**
  - Se existe **pelo menos um** documento **disponível** com risco: análise **`completed`**, `riskLevel` = **máximo** entre eles (HIGH vence MEDIUM e LOW).
  - `summaryText` consolidado = uma linha por arquivo bem-sucedido + nota se algum falhou.
  - Se **todos** falharam (e nenhum pendente): análise **`failed`**.
- Isso permite **vários uploads** sem o último apagar silenciosamente o significado dos anteriores no agregado.

### 10) Resposta para o frontend

- Recarrega a análise com relações (`documents`, `riskFindings` + documento para merge).
- **`toAnalysisDetailResponse`** monta o JSON: lista de documentos, achados **agregados** (merge por `code` para não poluir a UI com duplicatas idênticas).
- O frontend atualiza a tela com status, badges de risco, lista de documentos, etc.

---

## 4. Estrutura de pastas (backend)

Raiz relevante: `backend/src/`.

### `config/`

- **`app-config.module.ts`**: registra `ConfigModule.forRoot` com `app.config.ts`.
- **`app.config.ts`**: mapa **env → objeto** (app, database, auth, storage, riskAnalyzer, llm).

Centralizar aqui evita `process.env` espalhado e facilita explicar “como configuramos LLM”.

### `database/`

- **`database.module.ts`**: TypeORM async com credenciais do config.
- **`entities/`**: classes que viram tabelas (`User`, `Company`, `Analysis`, `Document`, `RiskFinding`).
- **`migrations/`**: evolução do schema versionada.
- **`enums/`**: status, níveis de risco, severidade.

### `common/`

Código **transversal** ao domínio:

- **`filters/global-exception.filter.ts`**: pega exceções não tratadas, devolve JSON com `statusCode`, `message`, etc.
- **`auth/`**: `JwtAuthGuard`, decorator `@CurrentUser()`, tipos de payload.
- **`http/api-messages.ts`**: strings de erro reutilizáveis.
- **`mappers/analysis-response.mapper.ts`**: entidades TypeORM → DTO de API (inclui merge de findings).

### `modules/` — por feature

#### `auth/`

- **Responsabilidade:** registrar usuário, validar senha (hash), emitir JWT.
- **Conexões:** usado por guards; não depende de documents.

#### `companies/`

- **Responsabilidade:** CRUD de empresas; **ownership** por `createdByUserId` (via migrações de ownership).
- **Conexões:** análises escolhem `companyId` existente e acessível.

#### `analyses/`

- **Responsabilidade:** criar/listar/detalhar análises; garante que a empresa pertence ao usuário.
- **Conexões:** `DocumentsController` usa `analysisId` na URL; documentos sempre ligados a uma análise.

#### `documents/`

**Coração do processamento.**

- **`documents.controller.ts`**: rota de upload; só POST documento.
- **`documents.service.ts`**: orquestra validação, storage, extração, analyzer, transação, agregação.
- **`analysis-aggregate.util.ts`**: funções puras (partição de documentos, max de risco, texto consolidado).
- **`risk-analyzer.contract.ts`**: token `RISK_ANALYZER` + interface `RiskAnalyzer` + tipo `RiskAnalyzerInput`.
- **`selecting-risk.analyzer.ts`**: escolhe keyword / LLM / fallback.
- **`llm-risk.analyzer.ts`**: HTTP para o modelo.
- **`llm/llm-risk-json.parser.ts`**: validação do JSON do LLM → tipo de domínio.
- **`services/risk-rules.service.ts`**: keyword analyzer (implementa `RiskAnalyzer`).
- **`services/pdf-text.service.ts`**: lógica PDF (pdf-parse + fallback).
- **`services/file-storage.service.ts`**: escrita em disco.
- **`text-extraction/`**: contrato `DocumentTextExtractor`, orquestrador, PDF/DOCX/XLSX/OCR.
- **`interfaces/`**: tipos de upload e resultado de classificação.

#### `health/`

- Endpoint simples para monitoramento (load balancer, k8s probe).

---

## 5. Sistema de extração de texto

### Por que separar por tipo de arquivo

Cada formato é um **padrão binário ou texto diferente**:

- PDF pode ter texto embutido ou streams comprimidos;
- DOCX é um ZIP com XML;
- XLSX idem, com modelos de planilha;
- imagem não tem “texto” até passar por **OCR**.

Um único “parser genérico” ou `if` gigante **não escala** mentalmente. O contrato por tipo deixa claro: *“quem sabe extrair X é a classe X”*.

### Contrato `DocumentTextExtractor`

Cada implementação expõe:

- **`supports(mimetype, extensão)`**: diz se pode tratar aquele arquivo;
- **`extract(input)`**: devolve `Promise<string>` com texto normalizado o máximo possível.

### Como o sistema decide qual extractor usar

O **`DocumentTextExtractionService`** percorre a lista **na ordem registrada** e usa o **primeiro** que retornar `true` em `supports`.

Validação no upload (`isSupported`) usa a **mesma** lógica: se nenhum extractor aceitar, **400** com tipo não suportado.

### PDF

- Tenta **`pdf-parse`**.
- Se falhar ou vier vazio, tenta fallback **manual** em streams simples (FlateDecode, etc.) — pragmático para PDFs “quebrados” gerados por ferramentas comuns.

### DOCX

- **Mammoth** extrai **texto bruto** do Word moderno (OOXML). Não preserva layout fino; para risco por palavras/LLM, texto corrido costuma bastar.

### XLSX

- **SheetJS (`xlsx`)** lê o workbook em memória.
- Cada aba vira algo parecido com **CSV** (texto linha a linha). É uma **representação legível** para o analyzer, não um modelo de células.

### OCR (imagem)

**OCR (Optical Character Recognition)** = algoritmo que **lê pixels** e tenta **reconhecer caracteres**.

Aqui usa-se **Tesseract.js** (WASM), com idiomas configuráveis (`OCR_LANGS`, ex. `por+eng`). Limitações: qualidade da foto, iluminação, skew; MVP não faz pré-processamento de imagem pesado.

---

## 6. Sistema de análise de risco

### O que é o `RiskAnalyzer`

É uma **interface** com um método:

```text
analyze(input: { extractedText: string }): Promise<RiskClassificationResult>
```

O retorno (`riskLevel`, `summaryText`, `findings`) é o que o domínio já sabe persistir — **independente** de ter vindo de regex, LLM ou futuro modelo interno.

### Por que usar um contrato

- **Inversão de dependência:** `DocumentsService` não importa “OpenAI” nem “lista de palavras”; só o **contrato**.
- **Troca por configuração:** mesmo código de upload, outro provider de análise.
- **Testes:** mock de `RiskAnalyzer` sem subir PDF nem LLM.

### Keyword analyzer (`RiskRulesService`)

- Normaliza texto, busca **termos** em listas (críticos vs atenção).
- Determina nível: crítico → HIGH; senão atenção → MEDIUM; senão LOW.
- Monta `findings` com códigos fixos (`critical-terms`, `attention-terms`).

**Prós:** rápido, barato, determinístico, fácil de auditar.  
**Contras:** não entende contexto nem linguagem figurada.

### LLM analyzer (`LlmRiskAnalyzer`)

- Envia um **pedaço** do texto (limite de caracteres).
- Pede resposta em **JSON** com `riskLevel`, `summary`, `findings`.
- Converte e **valida** no backend.

**Prós:** resume e argumenta melhor em linguagem natural.  
**Contras:** custo, latência, variabilidade, precisa de API key e rede.

### `SelectingRiskAnalyzer`

É um **único ponto** que lê `RISK_ANALYZER_MODE` e delega:

| Modo | Efeito |
|------|--------|
| `keyword` | Só `RiskRulesService`. |
| `llm` | Só `LlmRiskAnalyzer` (falha se der errado). |
| `llm_with_fallback` | Tenta LLM; se falhar, keyword. |

### O que é fallback e por que existe

**Fallback** = “se o caminho preferencial quebrar, use o caminho seguro”.

Em demo, desenvolvimento ou quando a API do modelo cai, **`llm_with_fallback`** ainda entrega **um resultado coerente** (keywords), em vez de falhar o documento inteiro por instabilidade externa. Em produção estrita, você pode preferir `llm` puro e tratar falha como evento de negócio — é decisão de produto.

---

## 7. Integração com LLM

### Como o backend chama o modelo

- **HTTP POST** para **`/chat/completions`** (padrão OpenAI-compatible).
- **Autenticação:** header `Authorization: Bearer {LLM_API_KEY}`.
- Corpo JSON: `model`, `messages`, `temperature`, e opcionalmente `response_format`.

Não há SDK oficial obrigatório: **`fetch`** reduz dependência e deixa óbvio o que trafega na rede.

### Como o prompt é estruturado

- **System:** define o papel (“avaliar risco a partir do texto”), o **formato JSON exato** e regras (“não inventar fatos”).
- **User:** contém o texto do documento (truncado).

Isso separa **instruções estáveis** (system) de **dados variáveis** (user).

### Por que pedir JSON

- **Parsing estruturado** é mais fácil que regex em prosa.
- O frontend e o banco esperam **campos fixos** (`riskLevel`, achados com `severity`).
- Com `json_object` (quando suportado), o modelo **força** saída JSON válida na maior parte dos casos.

### Por que validar no backend

O modelo pode:

- alucinar campos;
- usar `riskLevel` inválido;
- devolver `findings` que não são array;
- colocar markdown ao redor do JSON.

O **`parseRiskClassificationFromLlmJson`**:

- remove cercas ```json se existirem;
- valida tipos e enums;
- normaliza severidade desconhecida para algo seguro.

**Sem isso**, você persiste lixo ou quebra o TypeORM na hora do save.

### Riscos de usar LLM diretamente

- **Indisponibilidade** e **rate limit**.
- **Custo** proporcional ao tamanho do prompt.
- **Variabilidade** — mesma entrada pode mudar levemente entre chamadas.
- **Compliance** — enviar documentos sensíveis para terceiros exige política de dados.
- **Segurança** — prompt injection (texto do documento “mandando” o modelo ignorar regras); mitigação: instruções claras + validação de saída, nunca confiar cegamente.

### Por que não deixar o LLM “decidir tudo sozinho”

Em sistemas reais costuma-se:

- usar LLM para **sugestão** ou **enriquecimento**;
- manter **regras duras** (listas restritivas, obrigatoriedade de campos) no backend;
- opcionalmente **combinar** score keyword + LLM.

Aqui o MVP **confia** no JSON validado para persistir, mas o desenho com **fallback keyword** e **validação** já mostra maturidade: o backend é a **última linha** antes do dado virar “verdade do sistema”.

---

## 8. Persistência e banco de dados

### Entidades principais

**User**  
Quem autentica; dono de empresas/análises (conforme regras de ownership).

**Company**  
Fornecedor / entidade avaliada; várias análises ao longo do tempo.

**Analysis**  
Um “estudo” para uma empresa: status (`pending`, `in_progress`, `completed`, `failed`), **resultado agregado** (`riskLevel`, `summaryText`, `completedAt`), FK para `company` e `user`.

**Document**  
Cada arquivo enviado: nome, mime, path no disco, status (`pending`, `available`, `failed`), **`extractedText`**, **`summaryText`**, **`riskLevel`** do **documento**.

**RiskFinding**  
Achado atômico: `code`, `title`, `description`, `severity`, ligado a **`analysis`** e **`document`** (para saber de qual upload veio e permitir agregação na API).

### Relações (mental model)

```text
User 1──* Company 1──* Analysis 1──* Document 1──* RiskFinding
                              └──* RiskFinding (também por analysis_id)
```

Na prática, findings são **por documento**, mas a análise também tem FK para facilitar consultas e integridade.

### Por que guardar `extractedText`, `summaryText`, `riskLevel`

| Campo | Motivo |
|--------|--------|
| **`extractedText`** | Reprocessar com outro analyzer, auditoria, debug, futuro RAG sem reextrair arquivo. |
| **`summaryText`** | Leitura humana rápida sem re-chamar LLM. |
| **`riskLevel`** | Consultas e UI simples; agregação numérica/ordinal sem reparsear achados. |

---

## 9. Agregação de múltiplos documentos

### Por que a análise não é “só o último documento”

Negócio real: você pode ter **contrato + balanço + e-mail**. O risco **combinado** importa. Se cada upload **sobrescrevesse** tudo, perderia histórico semântico na análise.

### Como consolida

- Só entram documentos **`available`** com `riskLevel` definido.
- **`maxDocumentRiskLevel`**: se qualquer um é HIGH → análise HIGH; senão MEDIUM; senão LOW.
- **Resumo** agrega linhas por arquivo; se houve falhas parciais, adiciona **observação**.

### Por que HIGH > MEDIUM > LOW é bom para MVP

- Regra **uma linha** que qualquer stakeholder entende (“o pior sinal vence”).
- Alinha com mentalidade de **compliance** cautelosa.
- Evita média artificial que esconde um documento terrível.

Evoluções futuras: pesos por tipo de documento, scores numéricos, veto absoluto por lista interna.

---

## 10. Frontend (Vue)

### Como consome a API

- **`apiClient` (Axios)** com `baseURL: '/api'`.
- **Interceptor** injeta `Authorization: Bearer` a partir de um composable de auth.
- Em **401**, limpa sessão e redireciona para login (UX de sessão expirada).

### Interação do usuário

Fluxo típico:

1. Login / registro.
2. Lista de empresas → cadastro.
3. Lista de análises → cria análise escolhendo empresa.
4. **Detalhe da análise:** vê status, risco agregado, documentos, formulário de upload.
5. Upload dispara POST multipart; resposta traz análise atualizada.

### Fluxo de upload e visualização

- Componente de formulário escolhe arquivo (`accept` com vários tipos).
- Chama API em `features/analyses/api/analysis-documents.api.ts`.
- Página de detalhe refaz GET da análise ou usa payload de retorno conforme implementado.
- Textos de ajuda e erros podem mapear mensagens inglesas da API para português (`get-api-error-message.ts`).

---

## 11. Decisões arquiteturais importantes (recap)

| Decisão | Benefício |
|---------|-----------|
| **Contrato `RiskAnalyzer`** | Upload desacoplado da tecnologia de análise. |
| **Fallback LLM → keyword** | Resiliência e demo estável. |
| **Extração desacoplada por tipo** | Evolução incremental (novo formato = novo extractor). |
| **Libs específicas leves** (mammoth, xlsx, tesseract) | Menos “canivete suíço” opaco que Tika no MVP. |
| **`fetch` em vez de SDK LLM** | Menos dependência, transparência do HTTP, fácil trocar URL/modelo. |
| **Validação de JSON LLM** | Domínio e banco protegidos de saída malformada. |
| **Transações no documento** | Estado consistente entre `documents`, `risk_findings`, `analyses`. |

---

## 12. Limitações do projeto (honestidade técnica)

- **OCR** simples (Tesseract WASM, worker por request no MVP); imagens ruins geram texto ruim.
- **Sem fila**: upload longo ou LLM lento **segura** o HTTP.
- **Sem Apache Tika**: extração é “por tipo”, não um motor unificado enterprise.
- **Armazenamento local** de arquivos (não S3).
- **PDF escaneado** sem OCR dedicado no PDF pode sair vazio.
- **XLSX** linearizado como texto, sem semântica rica de planilha.
- **LLM** com truncamento de contexto; modo `llm` puro falha se a API cair.
- **Segurança operacional** (rate limit, antivírus, secrets) não é o foco deste MVP.

---

## 13. Próximos passos (roadmap)

1. **Fila** (Bull/BullMQ) + worker para extração/análise assíncrona.
2. **Object storage** (S3/MinIO) e URLs assinadas.
3. **Tika** ou pipeline “detectar tipo → extrator” mais genérico, se o cardápio de formatos crescer.
4. **Pool de workers Tesseract** ou serviço OCR gerenciado.
5. **Testes** (parser LLM, extractors, agregação, e2e críticos).
6. **Observabilidade** (structured logs, métricas de latência LLM/OCR, correlation id).
7. **Auditoria** (quem rodou qual modo, versão de prompt, hash do documento).

---

## 14. Como explicar em entrevista

### 30 segundos

“É um sistema fullstack onde o usuário envia documentos de um fornecedor, o backend extrai texto de PDF, Office ou imagem com OCR, e analisa risco com regras ou LLM — configurável. Vários arquivos entram na mesma análise e o risco final consolida pelo pior caso. Usei Nest modular, TypeORM e contratos para trocar extração e análise sem quebrar o fluxo.”

### 1 minuto

“O problema é triar risco de contratação com base em documentos. No Nest, separei módulos de auth, empresas, análises e documentos. O upload grava o arquivo, extrai texto com extractors por tipo, e chama um `RiskAnalyzer` — hoje keywords ou LLM via HTTP, com opção de fallback se a API falhar. Persisto texto extraído, resumo e nível por documento, e recalculo o agregado da análise. O frontend Vue consome `/api` com JWT. Foi um MVP deliberadamente simples: síncrono, disco local, mas com fronteiras claras para fila e S3 depois.”

### Nível Tech Lead

“Arquitetura monolítica modular no NestJS com domínios explícitos. Dois pontos de extensão principais: **extração** (`DocumentTextExtractor` + orquestrador por mime/ext) e **análise** (`RiskAnalyzer` + `SelectingRiskAnalyzer`). O LLM é integrado por **contrato HTTP** com `fetch`, saída **JSON schema-driven** validada antes de persistir — reduzindo risco de dados inválidos e facilitando troca de provedor. Multi-documento é modelado com findings por `document_id` e agregação determinística no serviço; isso evita o anti-pattern de sobrescrever achados globais a cada upload. Limitações conscientes: processamento síncrono, OCR MVP, sem Tika — roadmap para assincronismo, storage objeto e observabilidade. O desenho prioriza **evolução incremental** e narrativa clara para time e auditoria.”

---

## 15. Operação, CORS, migrations e teste dos modos de análise

### Migrations (TypeORM)

Na pasta `backend/`:

```bash
npm run migration:run    # aplica pendentes
npm run migration:revert # desfaz a última
npm run migration:show  # situação
```

Requer `backend/.env` (ou variáveis) alinhado ao `typeorm-cli.config.ts`. Crie a **database** vazia no MySQL antes (ex. `CREATE DATABASE supplier_risk_analyzer`).

### CORS (produção ou front noutro host)

- Em **desenvolvimento** com Vite, o `proxy` em `frontend/vite.config.ts` envia `/api` ao backend: **CORS no backend costuma ser desnecessário**.
- Se o front falar com o back **por origem diferente** (ex.: `https://app.com` → `https://api.com`), defina no backend:
  - `CORS_ORIGIN=https://app.com` ou vários separados por vírgula: `https://a.com,https://b.com`
- Com a variável **vazia** (padrão), o Nest **não** chama `enableCors` — evita abrir tudo acidentalmente.

### Docker Compose (raiz do repositório)

Há `docker-compose.yml` com `mysql`, `backend`, `frontend` (e `adminer`). Use o `.env` da raiz (há `.env.example`) para portas e credenciais. Fluxo típico: `docker compose up` (ou `up -d`) após ajustar variáveis; o backend, ao subir, precisa de migrations (executar `npm run migration:run` **dentro** do container de backend se o volume mapear o código, ou com DB acessível na rede Docker).

### Testar o modo `keyword` (padrão)

1. Garanta `RISK_ANALYZER_MODE=keyword` (ou omita; é o padrão em `app.config.ts`).
2. A API usa listas de termos em `RiskRulesService` (crítico vs. atenção). Qualquer ficheiro cujo texto contenha, por ex., *fraud* ou *falência* (conforme listas) deve puxar o nível para HIGH ou MEDIUM.

### Testar o modo `llm`

1. Defina `LLM_API_KEY` (e opcionalmente `LLM_BASE_URL`, `LLM_MODEL`).
2. `RISK_ANALYZER_MODE=llm` — se a chave faltar, o processamento de documento **falha** (o serviço lança e o filtro trata; documento fica `failed` conforme o fluxo de erro).

### Testar o modo `llm_with_fallback`

1. `RISK_ANALYZER_MODE=llm_with_fallback` com `LLM_API_KEY` **inválida** ou **rede** indisponível: o `SelectingRiskAnalyzer` captura, regista *warn* e aplica o analisador de **keyword** — a análise ainda conclui de forma previsível.

### Chamadas HTTP mínimas (ex.: `curl`) — *smoke* manual

Substitua `BASE` e o token JWT após `POST /api/auth/login`.

```bash
BASE=http://localhost:3000/api
curl -sS "$BASE/health" | jq .

# registo (se a base permitir)
curl -sS -X POST "$BASE/auth/register" -H 'Content-Type: application/json' \
  -d '{"name":"U","email":"u@test.com","password":"senha12345"}' | jq .

# token
TOKEN=$(curl -sS -X POST "$BASE/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"u@test.com","password":"senha12345"}' | jq -r .accessToken)

# empresas
curl -sS "$BASE/companies" -H "Authorization: Bearer $TOKEN" | jq .
```

O upload de documento é `multipart` com o campo `file` — o `curl` fica longo; na prática, use o **frontend** (formulário na análise) ou `curl -F "file=@/caminho/contrato.pdf" .../api/analyses/ID/document` com o mesmo `Authorization`.

### Testes automáticos

No `backend/`: `npm test` (unitários e smoke do `/health` em módulo de teste).  
No `frontend/`: `npm test` (utilitário de mapeamento de erros, etc.).

### Em produção: JWT e CORS

- Gere `JWT_SECRET` com valor **longo e aleatório**; o bootstrap **avisa** se `NODE_ENV=production` e o segredo ainda for o default de desenvolvimento.
- Configure `CORS_ORIGIN` com os *origins* reais do front.

---

## Leitura sugerida no repositório

1. `README.md` — como rodar e variáveis de ambiente.  
2. `backend/src/modules/documents/documents.service.ts` — fluxo end-to-end do upload.  
3. `backend/src/modules/documents/selecting-risk.analyzer.ts` — modos de análise.  
4. `backend/src/modules/documents/text-extraction/document-text-extraction.service.ts` — escolha do extractor.  
5. `backend/src/common/mappers/analysis-response.mapper.ts` — forma da API no detalhe da análise.

Bons estudos — entender estes cinco ficheiros já cobre a maior parte da história do sistema.
