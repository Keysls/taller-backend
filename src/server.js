import 'dotenv/config';
import { validateEnv } from './config/env.js';
validateEnv();

import app from './app.js';
import { env } from './config/env.js';

app.listen(env.port, () => {
  console.log(`Servidor corriendo en http://localhost:${env.port}`);
  console.log(`Health: http://localhost:${env.port}/health`);
});
