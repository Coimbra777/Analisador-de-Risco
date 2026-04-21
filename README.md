# Supplier Risk Analyzer

Aplicação fullstack para **avaliação de risco de contratação/fornecedor** a partir de documentos enviados pelo usuário. O sistema extrai texto de vários formatos, analisa o conteúdo (regras por palavras-chave ou LLM configurável) e consolida o resultado por **análise**, suportando **múltiplos documentos** na mesma análise.

---

## Descrição

**Problema:** equipes precisam de uma forma objetiva de triar risco com base em documentos (contratos, balanços, comunicações) sem depender só de leitura manual.

**O que o sistema faz:** o usuário cadastra empresas, abre uma análise vinculada a uma empresa, faz upload de arquivos e recebe um **nível de risco** (baixo, médio ou alto), **resumo** e **achados** persistidos. Com mais de um documento, o risco da análise é **agregado** (regra: o maior nível entre documentos processados com sucesso prevalece).

---

## Principais funcionalidades

- Autenticação JWT e CRUD de contexto (empresas, análises)
- Upload de documentos com validação de tipo e tamanho
- Extração de texto por tipo de arquivo (PDF, imagem com OCR, DOCX, XLSX)
- Análise de risco por documento com contrato único (`RiskAnalyzer`)
- Modos **keyword**, **LLM** ou **LLM com fallback** para keywords
- Persistência em MySQL (texto extraído, resumo, nível, achados por documento)
- Agregação da análise após cada processamento (status, resumo consolidado, achados deduplicados na API)
- Frontend Vue para acompanhar análises e enviar arquivos

---

## Tecnologias

| Camada | Stack |
|--------|--------|
| Backend | NestJS 11, TypeORM, MySQL, class-validator |
| Frontend | Vue 3, Vite, Vue Router, Axios |
| Extração | `pdf-parse`, Mammoth (DOCX), SheetJS `xlsx` (XLSX), Tesseract.js (OCR) |
| LLM | HTTP `fetch` para API compatível com OpenAI (Chat Completions + JSON) |

---

## Arquitetura geral

Monólito **modular** no NestJS: cada domínio (`auth`, `companies`, `analyses`, `documents`, `health`) tem módulo próprio com controllers finos e services. O fluxo de documentos combina:

- **Extração:** contrato `DocumentTextExtractor` + orquestrador que escolhe implementação por MIME/extensão
- **Risco:** contrato `RiskAnalyzer` + `SelectingRiskAnalyzer` que delega para keywords ou LLM conforme ambiente
- **Persistência:** transações ao concluir ou falhar o processamento de um documento; recálculo do agregado da análise

O frontend consome a API REST sob o prefixo `/api` (proxy do Vite em desenvolvimento).

---

## Fluxo da aplicação

1. **Upload** — `POST /api/analyses/:id/document` (multipart), arquivo salvo em disco e metadata em `documents`
2. **Extração** — buffer + MIME → texto único (`extractedText`)
3. **Análise** — `RiskAnalyzer.analyze({ extractedText })` → nível, resumo, lista de achados
4. **Persistência** — atualiza o documento; substitui achados daquele documento; atualiza a análise agregada
5. **Agregação** — recalcula `riskLevel` e `summaryText` da análise a partir de **todos** os documentos (sucesso/falha parcial: análise só falha se **todos** falharem)

---

## Tipos de documentos suportados

| Tipo | Abordagem |
|------|-----------|
| **PDF** | `pdf-parse` + fallback leve para streams de texto |
| **Imagem** (JPG, JPEG, PNG) | OCR com Tesseract.js (idiomas via `OCR_LANGS`, padrão `por+eng`) |
| **DOCX** | Mammoth — texto bruto |
| **XLSX** | SheetJS — planilhas convertidas em texto tipo CSV por aba |

`application/octet-stream` é aceito quando a **extensão** identifica um dos formatos acima.

---

## Estratégia de análise de risco

Variável **`RISK_ANALYZER_MODE`**:

| Modo | Comportamento |
|------|----------------|
| `keyword` (padrão) | Listas de termos críticos / atenção (`RiskRulesService`) |
| `llm` | Chamada à API configurada em `LLM_*`; resposta validada como JSON (`riskLevel`, `summary`, `findings`) |
| `llm_with_fallback` | Tenta LLM; em qualquer falha (rede, HTTP, JSON inválido), usa o analisador por keywords |

O fallback preserva disponibilidade do MVP e reduz risco operacional quando a API externa oscila.

---

## Configuração de ambiente

### Backend (`.env` na pasta `backend/`)

**Aplicação e banco**

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `PORT` | Porta HTTP | `3000` |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` | MySQL | `localhost`, `3306`, `root`, `root`, `supplier_risk_analyzer` |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Auth | valores de desenvolvimento |

**Armazenamento e upload**

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `UPLOAD_DIR` | Diretório relativo aos uploads | `storage/uploads` |
| `MAX_FILE_SIZE_BYTES` | Tamanho máximo do arquivo | `5242880` (5 MB) |

**Análise de risco e LLM**

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `RISK_ANALYZER_MODE` | `keyword` \| `llm` \| `llm_with_fallback` | `keyword` |
| `LLM_API_KEY` | Chave Bearer | vazio |
| `LLM_BASE_URL` | Base da API (sem barra final) | `https://api.openai.com/v1` |
| `LLM_MODEL` | Modelo | `gpt-4o-mini` |
| `LLM_MAX_INPUT_CHARS` | Corte do texto enviado ao modelo | `12000` |
| `LLM_TIMEOUT_MS` | Timeout da requisição | `60000` |
| `LLM_JSON_OBJECT_MODE` | `false` desliga `response_format` se o provedor não suportar | `true` |

**OCR**

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `OCR_LANGS` | Idiomas Tesseract | `por+eng` |

### Frontend

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `VITE_API_PROXY_TARGET` | Alvo do proxy `/api` no `vite dev` | `http://localhost:3000` |

---

## Como rodar o projeto

### Pré-requisitos

- Node.js (LTS recomendado)
- MySQL acessível com banco criado (ex.: `supplier_risk_analyzer`)

### Backend

```bash
cd backend
# Crie um .env com as variáveis da seção "Configuração de ambiente"
npm install
npm run migration:run
npm run start:dev
```

API: `http://localhost:3000/api`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173` — requisições `/api` são encaminhadas ao backend.

### Produção (resumo)

```bash
cd backend && npm run build && npm run start:prod
cd frontend && npm run build && npm run preview   # ou servir `dist/` com nginx/CDN
```

---

## Estrutura de pastas (resumo)

```
validacao-documentos-app/
├── backend/
│   └── src/
│       ├── common/          # filtros, guards, mappers, mensagens HTTP
│       ├── config/          # ConfigModule + app.config
│       ├── database/        # entidades, migrações TypeORM
│       └── modules/
│           ├── auth/
│           ├── companies/
│           ├── analyses/
│           ├── documents/   # upload, extração, risk analyzer, LLM
│           └── health/
└── frontend/
    └── src/
        ├── features/        # auth, companies, analyses
        ├── shared/          # HTTP client, tipos, utilitários
        └── router/
```

---

## Limitações atuais

- **Armazenamento** em disco local (não S3); **processamento síncrono** no request (sem fila).
- **PDF** baseado em texto: PDFs só-imagem sem camada extra de OCR podem vir vazios.
- **OCR** depende da qualidade da imagem e dos modelos Tesseract; primeira execução pode baixar dados de idioma.
- **XLSX** exportado como texto linear (CSV por aba), sem modelo semântico de planilha.
- **LLM:** corte de contexto (`LLM_MAX_INPUT_CHARS`); dependência de provedor e custo; JSON inválido em modo `llm` falha o documento (sem fallback).
- **Segurança:** segredos e CORS devem ser endurecidos para ambiente real.

---

## Próximos passos (roadmap)

- Fila assíncrona (Bull/BullMQ) para uploads grandes e timeout previsível
- Armazenamento em objeto (S3/MinIO) e URLs assinadas
- Pool ou worker único para OCR; opcional Tika para extração unificada
- Testes automatizados (parser LLM, extractors, agregação)
- Observabilidade (correlation id, métricas de latência LLM/OCR)

---

## Observações técnicas importantes

- O contrato **`RiskAnalyzer`** isola o domínio de “como” o texto vira risco: keywords e LLM são intercambiáveis via configuração.
- **`SelectingRiskAnalyzer`** centraliza a escolha de modo; **`RISK_ANALYZER`** no Nest aponta para ele.
- Resposta do LLM é validada no backend (`parseRiskClassificationFromLlmJson`) antes de persistir — evita gravar estrutura arbitrária.
- **Agregação multi-documento:** cada documento guarda seu resultado; a análise é recalculada após cada upload; falha parcial não zera análises com documentos já bem-sucedidos.

---

*Projeto pensado como MVP sólido para portfólio: arquitetura clara, poucas camadas desnecessárias e evolução natural para produção.*
