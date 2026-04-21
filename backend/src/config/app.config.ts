export default () => ({
  app: {
    name: process.env.APP_NAME ?? 'Supplier Risk Analyzer API',
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 3000),
  },
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    username: process.env.DB_USERNAME ?? 'root',
    password: process.env.DB_PASSWORD ?? 'root',
    name: process.env.DB_DATABASE ?? 'supplier_risk_analyzer',
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET ?? 'development-secret-change-me',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  },
  storage: {
    uploadDir: process.env.UPLOAD_DIR ?? 'storage/uploads',
    maxFileSizeBytes: Number(process.env.MAX_FILE_SIZE_BYTES ?? 5242880),
  },
  /** keyword | llm | llm_with_fallback */
  riskAnalyzer: {
    mode: process.env.RISK_ANALYZER_MODE ?? 'keyword',
  },
  llm: {
    apiKey: process.env.LLM_API_KEY ?? '',
    baseUrl: (process.env.LLM_BASE_URL ?? 'https://api.openai.com/v1').replace(
      /\/$/,
      '',
    ),
    model: process.env.LLM_MODEL ?? 'gpt-4o-mini',
    maxInputChars: Number(process.env.LLM_MAX_INPUT_CHARS ?? 12000),
    timeoutMs: Number(process.env.LLM_TIMEOUT_MS ?? 60000),
    /** OpenAI-compatible APIs: set false if the provider rejects response_format. */
    jsonObjectMode: process.env.LLM_JSON_OBJECT_MODE !== 'false',
  },
});
