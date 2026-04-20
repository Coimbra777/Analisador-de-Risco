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
});
