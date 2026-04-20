export default () => ({
  app: {
    name: process.env.APP_NAME ?? 'Supplier Risk Analyzer API',
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 3000),
  },
});
