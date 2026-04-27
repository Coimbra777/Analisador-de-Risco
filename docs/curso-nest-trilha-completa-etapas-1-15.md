# Trilha Nest.js no projeto Supplier Risk Analyzer
**validacao-documentos-app — Etapas 1 a 15**  
*Documento de estudo: fundamentos de Nest, decoradores, pastas e funcionamento*

---

## Parte A — O que você precisa saber sobre NestJS (base sólida)

### A.1 O que é o NestJS

O **NestJS** é um framework **Node.js** server-side, inspirado em **Angular** na organização: **módulos**, **injeção de dependências (DI)**, e fortemente tipado com **TypeScript**. Por baixo, o “adaptador” padrão é o **HTTP do Express** (há outro, Fastify, como alternativa). Não “substitui” o Node: é uma **estrutura** em cima dele para crescer com **testabilidade** e **separação de responsabilidades**.

**Ideia-chave:** em vez de espalhar `app.get('/...', handler)` num único ficheiro gigante, você organiza o código em **módulos de domínio** (auth, companies, etc.), com **controladores** (rotas) e **providers** (serviços, repositórios) ligados por **injeção**.

### A.2 Injeção de dependências (DI)

- Classes marcadas com **`@Injectable()`** podem ser **instâncias** geridas pelo **container** do Nest.  
- O **constructor** declara o que precisa: `constructor(private authService: AuthService) {}` — o Nest **resolve** e injeta, desde que o tipo esteja **registado** num módulo (`providers` ou importado de outro módulo que o exporta).  
- Vantagem: trocar implementações, testar com mocks, reutilizar a mesma instância (singleton, por padrão).

**Tokens e interfaces:** às vezes a implementação muda; usa-se `Symbol` ou string token com `@Inject(MEU_TOKEN)` (ex.: `RISK_ANALYZER` no projeto *documents*).

### A.3 Módulo (`@Module`)

Um **módulo** agrupa o que “pertence” a um recorte do sistema:

- **`imports`**: outros módulos cujas exportações este módulo usa (ex. `TypeOrmModule.forFeature`, `AuthModule`).  
- **`controllers`**: recebem HTTP, delegam a **services**.  
- **`providers`**: serviços, guards, repositórios, etc.  
- **`exports`**: o que fica visível a **outros módulos** que importam este.

O ficheiro raiz **`app.module.ts`** compõe a aplicação: importa config, base de dados, e todos os módulos de feature.

### A.4 Controllers, rotas, parâmetros

- `@Controller('prefixo')` + métodos com `@Get()`, `@Post()`, etc. definem a API REST.  
- Parâmetros com `@Param('id', ParseIntPipe)`, `@Body()`, `@Query()` ligam a validação (via **ValidationPipe** global) aos **DTOs** com `class-validator`.  
- Upload: `@UseInterceptors(FileInterceptor('file'))` + `@UploadedFile()` (Multer).

### A.5 Services (lógica de aplicação)

- Um **@Injectable** por domínio (ex. `CompaniesService`) concentra regras, chamadas a repositórios TypeORM, e em alguns casos **mapeia** entidade → resposta JSON.  
- O **controller** deve ser **fino**: chama o service; não duplica regra de negócio.

### A.6 Pipes, guards, filters, interceptors (o “request lifecycle” resumido)

| Peça | Papel resumido |
|------|----------------|
| **Guard** | Autorização **antes** do handler (pode a API executar? Ex.: `JwtAuthGuard`). |
| **Pipe** | **Transforma** e **valida** entradas (o `ValidationPipe` global + DTOs). |
| **Exception filter** | **Captura exceções** e formata a resposta HTTP (ex.: `GlobalExceptionFilter`). |
| **Interceptor** | Cerca o handler (ex.: `FileInterceptor` para upload), ou lógica transversal. |

**Ordem aproximada (HTTP):** middleware → guard → interceptors (before) → pipe → handler → interceptors (after) — exceções sobem e podem ser tratadas por **filter**.

### A.7 O que são **decorators** (anotações no TypeScript / Nest)

**Decorators** (com `@`) são *metadata* ligadas a classes, métodos ou parâmetros, que o **Nest lê** em tempo de arranque para montar rotas, injeção, etc.

**Nativos comuns no Nest (exemplos):**

| Decorator | Onde / uso |
|-----------|------------|
| `@Module`, `@Controller`, `@Injectable` | Módulo, rota, serviço injetável. |
| `@Get`, `@Post`, `@Patch`, ... | Verbos HTTP. |
| `@Body`, `@Param`, `@Query`, `@Req`, `@Res` | Extrair partes do pedido. |
| `@UseGuards`, `@UsePipes`, `@UseInterceptors`, `@UseFilters` | Encadear no método ou controlador. |
| `@Optional()` | Dependência pode ser omitida. |
| `forwardRef` | Resolver dependência circular. |

**No seu projeto (custom):** `@CurrentUser()` em `current-user.decorator.ts` lê o `user` do request após o JWT guard. É um **ParamDecorator** que o Nest reúne com `createParamDecorator`.

### A.8 Estrutura de pastas (backend) — *mapa mental*

```
backend/src/
  main.ts                 ← arranque: NestFactory, prefixo 'api', pipes, filtros
  app.module.ts         ← módulo raiz: imports de todos os features
  config/                 ← ConfigModule, carregamento de .env
  common/                 ← compartilhado (auth, filtros, http, mappers)
  database/               ← TypeORM, entidades, migrations, typeorm.config
  modules/
    auth/                 ← login, register, JWT
    companies/            ← CRUD contexto
    analyses/             ← análises por empresa
    documents/            ← upload, extração, risco, storage
    health/               ← liveness/ops
```

- **`modules/<nome>/`**: módulo, controller, service, DTOs; às vezes subpastas (`dto/`, `services/`).  
- **`common/`**: não é “módulo de feature” de negócio; reutilizável.  
- **`database/entities`**: modelos de tabela; **`migrations`**: evolução do esquema.

### A.9 Arranque da aplicação (`main.ts`)

1. `NestFactory.create(AppModule)` — constrói o grafo de DI.  
2. `setGlobalPrefix('api')` — todas as rotas vão sob `/api/...`.  
3. `useGlobalPipes(new ValidationPipe({ whitelist, transform, ... }))` — DTOs validados.  
4. `useGlobalFilters(new GlobalExceptionFilter())` — erros com formato unificado.  
5. `listen(port)` — servidor HTTP a escutar.

---

## Parte B — Trilha por etapas (1 a 15) — resumo do que percorremos

### Etapa 1 — Node e API

- Node como runtime; event loop; I/O assíncrona.  
- **API HTTP** em Nest expõe recursos: `main.ts` arranca, processo fica a servir; build típico `dist/main.js` com `node` ou script npm.

### Etapa 2 — Nest: módulos, DI, bootstrap

- `AppModule` importa `AppConfigModule`, `DatabaseModule`, módulos de feature.  
- `ValidationPipe` e `GlobalExceptionFilter` no bootstrap.

### Etapa 3 — Mapa de módulos

- `AuthModule` (autenticação), `CompaniesModule`, `AnalysesModule`, `DocumentsModule`, `HealthModule`, `DatabaseModule`, `AppConfigModule`.  
- Cada módulo agrega o que o domínio precisa.  
- **Health** tipicamente responde a `GET /api/.../health` para sondas de “vivo” e integrações de deploy.

### Etapa 4 — Controllers

- Rotas reais, `ParseIntPipe` em `analysisId`, `FileInterceptor` em upload, guards.  
- DTOs alinhados ao corpo/params, exceto upload multipart (campo `file`).

### Etapa 5 — Services

- `AuthService`, `CompaniesService`, `AnalysesService`, `DocumentsService` orquestram repositórios, transacções, e o contrato `RISK_ANALYZER`.

### Etapa 6 — DTOs e ValidationPipe

- `whitelist`, `forbidNonWhitelisted`, `transform` — entrada segura; upload sem DTO de body (multipart).

### Etapa 7 — Entidades TypeORM

- `User`, `Company`, `Analysis`, `Document`, `RiskFinding`, relações; `synchronize: false` e migrations; repositórios vão nos services.

### Etapa 8 — JWT

- `JwtAuthGuard` com `JwtService.verifyAsync` e atribui `request['user']`; decorator `@CurrentUser()`.  
- Front: `Authorization: Bearer` e tratamento de 401.

### Etapa 9 — Fluxo ponta a ponta

- Register/login → company → analysis → document upload; pipeline: extração → análise → persistência e agregação; falhas e rethrow após tratar o estado do documento.

### Etapa 10 — Upload

- `FileInterceptor('file')` (Multer), validação de ficheiro no service, `FileStorageService` grava em disco com nome seguro, `storageKey` no banco, evolução possível para S3.

### Etapa 11 — Filtro de exceção global

- `@Catch()`; status e mensagem; 500 genérico ao cliente, stack no log; corpo com `path`, `timestamp`, `statusCode`, `message`.

### Etapa 12 — Mappers

- `toUserResponse` / `toCompanyResponse` privados nos services; `analysis-response.mapper.ts` com lista, detalhe e merge de achados.  
- Entidade ≠ resposta; não expor hash de senha.

### Etapa 13 — Regras de negócio e risco

- `RiskRulesService` (keywords), `LlmRiskAnalyzer`, `SelectingRiskAnalyzer` (modo env), `RISK_ANALYZER` token, `maxDocumentRiskLevel` e `syncAnalysisAggregate`.

### Etapa 14 — Assíncrono e filas (evolução)

- Hoje o upload espera tudo; fila + worker, idempotência, SQS vs Bull/Redis, desacoplar tempo de resposta.

### Etapa 15 — Síntese e produção

- Checklist: segredos, CORS, volume para uploads, health, `RISK_ANALYZER_MODE` e LLM, observabilidade; roadmap: fila, S3, testes, hardening.

---

## Parte C — Checklist de variáveis (referência rápida)

- **Aplicação / DB:** `PORT`, `DB_*`  
- **Auth:** `JWT_SECRET`, `JWT_EXPIRES_IN`  
- **Storage:** `UPLOAD_DIR`, `MAX_FILE_SIZE_BYTES`  
- **Risco:** `RISK_ANALYZER_MODE` (`keyword` | `llm` | `llm_with_fallback`)  
- **LLM:** `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`, `LLM_MAX_INPUT_CHARS`, `LLM_TIMEOUT_MS`, `LLM_JSON_OBJECT_MODE`  
- **OCR (README):** `OCR_LANGS` quando aplicável

---

*Documento gerado para acompanhar a trilha concluída (Etapas 1–15) no repositório **validacao-documentos-app**.*
