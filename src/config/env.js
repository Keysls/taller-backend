import 'dotenv/config';

const required = ['DATABASE_URL', 'JWT_SECRET'];

export function validateEnv() {
  const missing = required.filter(key => !process.env[key]);
  if (missing.length) {
    console.error(`Variables de entorno faltantes: ${missing.join(', ')}`);
    process.exit(1);
  }
}

export const env = {
  port:         process.env.PORT || 3000,
  nodeEnv:      process.env.NODE_ENV || 'development',
  databaseUrl:  process.env.DATABASE_URL,
  jwtSecret:    process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  uploadPath:   process.env.UPLOAD_PATH || 'uploads',
  frontendUrl:  process.env.FRONTEND_URL || 'http://localhost:5173',
};
