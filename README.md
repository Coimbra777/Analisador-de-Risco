# Supplier Risk Analyzer

Aplicação **fullstack** para avaliar **risco de contratação de fornecedores** com base em **documentos** enviados pelo utilizador: extrai texto (PDF, Office, imagem com OCR), classifica risco com **regras por palavras-chave** ou **LLM** (configurável) e **consolida o resultado** numa análise que pode conter **vários ficheiros**.

**Guia didático (estudo / entrevista):** [PROJECT_GUIDE.md](PROJECT_GUIDE.md)

---

## Objetivo do projeto

Oferecer um fluxo digital mínimo e reprodutível: autenticar utilizador, cadastrar **empresas**, abrir **análises** por empresa, **submeter documentos** e obter **nível de risco** (baixo / médio / alto), **resumo** e **achados** persistidos, com visão agregada da análise quando há mais do que um documento.

---

## Stack

| Camada | Tecnologias |
|--------|-------------|
| **Backend** | NestJS 11, TypeORM, MySQL 8, JWT (`@nestjs/jwt`), `class-validator`, Multer (`@nestjs/platform-express`) |
| **Frontend** | Vue 3, Vite, Vue Router, Axios |
| **Extração** | `pdf-parse`, Mammoth (DOCX), SheetJS `xlsx` (XLSX), Tesseract.js (OCR em imagens) |
| **LLM** | HTTP `fetch` para API compatível com OpenAI Chat Completions (JSON) |

---

## Funcionalidades

- Registo e login com **JWT** (`Authorization: Bearer`)
- **Empresas** por utilizador (número de registo único por conta)
- **Análises** associadas a uma empresa (caso de triagem)
- **Upload** de documentos por análise com validação de tipo e tamanho
- **Extração de texto** por tipo de ficheiro (extractors plugáveis)
- **Análise de risco** via contrato `RiskAnalyzer` (keyword / LLM / LLM com fallback para keyword)
- **Persistência** de texto extraído, resumo, nível e achados (`risk_findings`)
- **Agregação** da análise após cada processamento (estado, risco global, resumo consolidado)
- **API REST** com prefixo `/api`, `ValidationPipe` global e filtro de exceções uniforme
- **Frontend** com rotas protegidas e cliente HTTP com interceptor de 401

---

## Fluxo principal

1. Utilizador **regista-se** ou **inicia sessão** → recebe token JWT.
2. Cria **empresa(s)** e uma **análise** ligada a uma empresa.
3. Na análise, faz **upload** de um ou mais ficheiros (`multipart`, campo `file`).
4. O backend **guarda** o ficheiro, **extrai texto**, **classifica risco**, **grava** resultado do documento e **recalcula** a análise.
5. O utilizador **consulta** a lista e o **detalhe** da análise (documentos, estados, risco agregado, achados).

```
Login/Register → Empresa → Análise → Upload (POST /api/analyses/:id/document)
  → extração → RiskAnalyzer → BD → resposta com análise atualizada
```

O processamento do upload é **síncrono** no pedido HTTP (MVP).

---

## Como rodar

### Pré-requisitos

- Node.js (LTS)
- MySQL 8 com base de dados criada (ex.: `supplier_risk_analyzer`)

### Backend

```bash
cd backend
cp .env.example .env   # editar DB, JWT, etc.
npm install
npm run migration:run
npm run start:dev
```

API base: `http://localhost:3000/api`  
Saúde: `GET /api/health`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173` — o Vite **proxy** encaminha `/api` para o backend (ver `VITE_API_PROXY_TARGET`).

### Docker (opcional)

Na raiz do repositório existem `docker-compose.yml` e `.env.example` para subir MySQL, backend e frontend. Ajuste variáveis e execute `docker compose up` (detalhes em [PROJECT_GUIDE.md](PROJECT_GUIDE.md)).

### Testes automatizados

```bash
cd backend && npm test
cd frontend && npm test
```

---

## Variáveis de ambiente

### Backend (`backend/.env`)

Copie de `backend/.env.example`. Principais grupos:

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `PORT` | Porta HTTP | `3000` |
| `NODE_ENV` | Ambiente | `development` |
| `APP_NAME` | Nome no health | `Supplier Risk Analyzer API` |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` | MySQL | `localhost`, `3306`, `root`, `root`, `supplier_risk_analyzer` |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Autenticação JWT | segredo de dev + `1d` |
| `UPLOAD_DIR` | Pasta de uploads (relativa ao cwd) | `storage/uploads` |
| `MAX_FILE_SIZE_BYTES` | Tamanho máximo do ficheiro | `5242880` (5 MB) |
| `RISK_ANALYZER_MODE` | `keyword` \| `llm` \| `llm_with_fallback` | `keyword` |
| `LLM_API_KEY` | Chave Bearer da API LLM | vazio |
| `LLM_BASE_URL` | Base URL (sem `/` final) | `https://api.openai.com/v1` |
| `LLM_MODEL` | Modelo | `gpt-4o-mini` |
| `LLM_MAX_INPUT_CHARS` | Corte do texto enviado ao modelo | `12000` |
| `LLM_TIMEOUT_MS` | Timeout da chamada HTTP | `60000` |
| `LLM_JSON_OBJECT_MODE` | `false` desliga `response_format` se o provedor não suportar | `true` |
| `OCR_LANGS` | Idiomas Tesseract (imagens) | `por+eng` |
| `CORS_ORIGIN` | Origens CORS separadas por vírgula; vazio = CORS desligado | vazio |

### Frontend (`frontend/.env` — opcional)

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `VITE_API_PROXY_TARGET` | Alvo do proxy `/api` no `npm run dev` | `http://localhost:3000` |

---

## Modos de análise (`RISK_ANALYZER_MODE`)

| Modo | Comportamento |
|------|----------------|
| **`keyword`** (padrão) | `RiskRulesService`: listas de termos “críticos” e de “atenção”; prioridade crítico > atenção > baixo. Sem LLM. |
| **`llm`** | `LlmRiskAnalyzer`: POST para `/chat/completions`, resposta JSON validada. Requer `LLM_API_KEY`; falhas (rede, HTTP, JSON) fazem falhar o processamento do documento. |
| **`llm_with_fallback`** | Tenta LLM; em qualquer falha, regista *warning* e usa o analisador **keyword**. |

Reinicie o backend após alterar o `.env`.

---

## Limitações

- **Processamento síncrono** no upload: pedidos longos (OCR, LLM lento) seguram a conexão HTTP.
- **Armazenamento em disco local** (não S3); várias instâncias da API precisam de volume partilhado ou storage objeto.
- **PDF** só com texto embutido ou fallback leve; PDF “só imagem” pode sair vazio se não for tratado como imagem.
- **OCR** depende da qualidade da imagem e dos modelos Tesseract; primeira execução pode descarregar dados de idioma.
- **LLM:** truncagem por `LLM_MAX_INPUT_CHARS`; custo e disponibilidade do provedor externos.
- **Segurança de produção:** `JWT_SECRET` forte, `CORS_ORIGIN` explícito, *rate limiting* e antivírus não são o foco deste MVP.

---

## Próximos passos (roadmap sugerido)

1. Fila assíncrona (ex. Bull/BullMQ) + worker para extração e LLM.
2. Armazenamento em objeto (S3/MinIO) e URLs assinadas.
3. Testes e2e com base de dados de teste.
4. Observabilidade (correlation id, métricas de latência LLM/OCR).
5. Endurecimento (rate limit, validação de conteúdo, rotação de segredos).

---

## Estrutura do repositório (resumo)

```
validacao-documentos-app/
├── README.md                 ← este ficheiro
├── PROJECT_GUIDE.md          ← guia didático completo
├── docker-compose.yml
├── backend/                  ← NestJS + TypeORM
└── frontend/                 ← Vue + Vite
```

---

## Documentação adicional

- [PROJECT_GUIDE.md](PROJECT_GUIDE.md) — arquitetura, módulos, fluxos, LLM, testes manuais, entrevista.
- [docs/GUIA-TECNICO-COMPLETO.md](docs/GUIA-TECNICO-COMPLETO.md) — documento longo complementar (histórico / aprofundamentos).

---

*MVP com fronteiras claras para evolução incremental sem reescrever o núcleo de negócio.*
