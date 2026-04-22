// Vetur: use o subprojeto Vite, onde o alias @/* e os includes de .vue
// estão em tsconfig.app.json (o tsconfig raiz do frontend é só "references").
/** @type {import('vls').VeturConfig} */
module.exports = {
  settings: {
    'vetur.useWorkspaceDependencies': true,
  },
  projects: [
    {
      root: './frontend',
      package: './package.json',
      tsconfig: './tsconfig.app.json',
    },
  ],
};
