import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed...');

  for (const nombre of ['ADMINISTRADOR', 'SUPERVISOR', 'MECANICO', 'RECEPCION']) {
    await prisma.rol.upsert({ where: { nombre }, update: {}, create: { nombre } });
  }
  console.log('Roles creados');

  const rolAdmin = await prisma.rol.findUnique({ where: { nombre: 'ADMINISTRADOR' } });
  await prisma.usuario.upsert({
    where: { email: 'admin@automotrizcyc.com' },
    update: {},
    create: {
      nombre: 'Administrador',
      email: 'admin@automotrizcyc.com',
      password: await bcrypt.hash('Admin123!', 12),
      rolId: rolAdmin.id,
    },
  });
  console.log('Usuario admin creado: admin@automotrizcyc.com / Admin123!');

  const servicios = [
    { nombre: 'Cambio de aceite', descripcion: 'Cambio de aceite y filtro', precioBase: 50 },
    { nombre: 'Cambio de frenos', descripcion: 'Cambio de pastillas y discos', precioBase: 120 },
    { nombre: 'Diagnóstico general', descripcion: 'Diagnóstico completo del vehículo', precioBase: 30 },
    { nombre: 'Escaneo electrónico', descripcion: 'Lectura de códigos de falla', precioBase: 40 },
    { nombre: 'Balanceo de llantas', descripcion: 'Balanceo de 4 llantas', precioBase: 60 },
    { nombre: 'Alineamiento', descripcion: 'Alineamiento de dirección', precioBase: 70 },
    { nombre: 'Mantenimiento preventivo', descripcion: 'Mantenimiento completo', precioBase: 200 },
  ];
  for (const s of servicios) {
    await prisma.servicio.upsert({ where: { nombre: s.nombre }, update: {}, create: s });
  }
  console.log('Servicios creados');
  console.log('Seed completado!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
