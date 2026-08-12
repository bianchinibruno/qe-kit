import { construirApp } from './app.js';

const app = construirApp();
const porta = Number(process.env.PORT ?? 3000);

app
  .listen({ port: porta, host: '0.0.0.0' })
  .then(() => {
    // eslint-disable-next-line no-console
    console.log(`sandbox-cobranca ouvindo em http://localhost:${porta}`);
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
