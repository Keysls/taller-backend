import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed...');

  // ─── Roles ────────────────────────────────────────────────────
  for (const nombre of ['ADMINISTRADOR', 'SUPERVISOR', 'MECANICO', 'RECEPCION']) {
    await prisma.rol.upsert({ where: { nombre }, update: {}, create: { nombre } });
  }
  console.log('✓ Roles creados');

  // ─── Usuario admin ────────────────────────────────────────────
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
  console.log('✓ Usuario admin creado: admin@automotrizcyc.com / Admin123!');

  // ─── Servicios ────────────────────────────────────────────────
  const servicios = [
    { nombre: 'Mantenimiento', descripcion: 'Servicio de mantenimiento general', precioBase: 100.00 },
    { nombre: 'Bajada de motor', descripcion: 'Desmontaje de motor', precioBase: 600.00 },
    { nombre: 'Cambio de neumáticos', descripcion: 'Cambio completo de 4 llantas', precioBase: 120.00 },
    { nombre: 'Servicio prueba', descripcion: 'Servicio de prueba', precioBase: 15.00 },
    { nombre: 'Cambio de trapecio', descripcion: 'Reemplazo de trapecio RH', precioBase: 123.00 },
    { nombre: 'Servicio nuevo', descripcion: 'Servicio nuevo', precioBase: 10.00 },
    { nombre: 'Reemplazar trapecio', descripcion: 'Reemplazo de trapecio RH', precioBase: 34.00 },
    { nombre: 'Reemplazo de bomba de agua', descripcion: 'Cambio de bomba de agua del motor', precioBase: 102.00 },
    { nombre: 'Desmontar/Montar Culata Renault K4M', descripcion: 'Trabajo de desmontaje y montaje de culata', precioBase: 600.00 },
    { nombre: 'Trabajo de rectificadora', descripcion: 'Servicio realizado por terceros', precioBase: 350.00 },
    { nombre: 'Desmontar/Montar Trapecio RH', descripcion: 'Trabajo de suspensión lado derecho', precioBase: 60.00 },
    { nombre: 'Cambiar faro posterior LH', descripcion: 'Reemplazo de faro posterior izquierdo', precioBase: 40.00 },
    { nombre: 'Reemplazo de batería', descripcion: 'Cambio de batería', precioBase: 0.00 },
    { nombre: 'Mantenimiento de motor / Limpieza y regulación de frenos e inspección general', descripcion: 'Mantenimiento completo de motor y frenos', precioBase: 80.00 },
    { nombre: 'Reparación de motor', descripcion: 'Reparación completa de motor', precioBase: 1500.00 },
  ];
  for (const s of servicios) {
    await prisma.servicio.upsert({ where: { nombre: s.nombre }, update: {}, create: s });
  }
  console.log('✓ Servicios creados');

  // ─── Repuestos / Productos ────────────────────────────────────
  const repuestos = [
    // ── Aceites 1L ──
    { codigo: 'ACE-001', nombre: 'Mobil 1 Sintético SAE 5w-30 1L',                      categoria: 'ACEITES',        precioVenta: 30.00,  costo: 22.00 },
    { codigo: 'ACE-002', nombre: 'Mobil Super 100% Sintético SAE 5w-30 1L',              categoria: 'ACEITES',        precioVenta: 30.00,  costo: 22.00 },
    { codigo: 'ACE-003', nombre: 'Mobil Super 100% Sintético SAE 5w-40 1L',              categoria: 'ACEITES',        precioVenta: 30.00,  costo: 22.00 },
    { codigo: 'ACE-004', nombre: 'Mobil Super Tecnología Sintética SAE 10w-30 1L',       categoria: 'ACEITES',        precioVenta: 30.00,  costo: 22.00 },
    { codigo: 'ACE-005', nombre: 'Shield Choice Mezcla Sintética SAE 3w-30 1L',          categoria: 'ACEITES',        precioVenta: 30.00,  costo: 22.00 },
    { codigo: 'ACE-006', nombre: 'Mobil Super Semi Sintético SAE 20w-50 1L',             categoria: 'ACEITES',        precioVenta: 30.00,  costo: 22.00 },
    { codigo: 'ACE-007', nombre: 'Castrol EDGE Full Synthetic SAE 5w-30 1L',             categoria: 'ACEITES',        precioVenta: 30.00,  costo: 22.00 },
    { codigo: 'ACE-008', nombre: 'Mobil Super Tecnología Sintética SAE 10w-40 1L',       categoria: 'ACEITES',        precioVenta: 40.00,  costo: 30.00 },
    // ── Aceites Galón ──
    { codigo: 'ACE-G01', nombre: 'Mobil Super Semi Sintético SAE 20w-50 1Gal',           categoria: 'ACEITES',        precioVenta: 180.00, costo: 140.00 },
    { codigo: 'ACE-G02', nombre: 'Valvoline Mezcla Sintética SAE 10w-30 1Gal',           categoria: 'ACEITES',        precioVenta: 180.00, costo: 140.00 },
    { codigo: 'ACE-G03', nombre: 'Valvoline Totalmente Sintético SAE 5w-30 1Gal',        categoria: 'ACEITES',        precioVenta: 180.00, costo: 140.00 },
    { codigo: 'ACE-G04', nombre: 'Mobil Super Tecnología Sintética SAE 5w-30 1Gal',      categoria: 'ACEITES',        precioVenta: 180.00, costo: 140.00 },
    { codigo: 'ACE-G05', nombre: 'Mobil Super 100% Sintético SAE 5w-30 1Gal',            categoria: 'ACEITES',        precioVenta: 180.00, costo: 140.00 },
    { codigo: 'ACE-G06', nombre: 'Mobil Super Tecnología Sintética SAE 10w-30 1Gal',     categoria: 'ACEITES',        precioVenta: 180.00, costo: 140.00 },
    { codigo: 'ACE-G07', nombre: 'Wolver Ultratec Sintético SAE 5w-40 1Gal',             categoria: 'ACEITES',        precioVenta: 180.00, costo: 140.00 },
    { codigo: 'ACE-G08', nombre: 'Mobil Super Tecnología Sintética SAE 10w-40 1Gal',     categoria: 'ACEITES',        precioVenta: 180.00, costo: 140.00 },
    { codigo: 'ACE-G09', nombre: 'Mobil Delvac Tecnología Sintética SAE 15w-40 1Gal',    categoria: 'ACEITES',        precioVenta: 180.00, costo: 140.00 },
    { codigo: 'ACE-G10', nombre: 'Mobil Delvac Tecnología Sintética SAE 15w-40 120ml',   categoria: 'ACEITES',        precioVenta: 120.00, costo: 90.00  },
    // ── Refrigerantes ──
    { codigo: 'REF-001', nombre: 'Refrigerante Prestone Max 50/50 1Gal',                 categoria: 'REFRIGERANTES',  precioVenta: 180.00, costo: 140.00 },
    { codigo: 'REF-002', nombre: 'Refrigerante Prestone 30% 1Gal',                       categoria: 'REFRIGERANTES',  precioVenta: 180.00, costo: 140.00 },
    { codigo: 'REF-003', nombre: 'Refrigerante Lubritek Ultimate 33% 1Gal',              categoria: 'REFRIGERANTES',  precioVenta: 180.00, costo: 140.00 },
    { codigo: 'REF-004', nombre: 'Refrigerante Alliance 50/50 1Gal',                     categoria: 'REFRIGERANTES',  precioVenta: 180.00, costo: 140.00 },
    { codigo: 'REF-005', nombre: 'Refrigerante Mitsubishi Motors 50% 1Gal',              categoria: 'REFRIGERANTES',  precioVenta: 190.00, costo: 150.00 },
    { codigo: 'REF-006', nombre: 'Refrigerante Prestone 33% Verde',                      categoria: 'REFRIGERANTES',  precioVenta: 45.00,  costo: 35.00  },
    { codigo: 'REF-007', nombre: 'Refrigerante de Motor',                                categoria: 'REFRIGERANTES',  precioVenta: 45.00,  costo: 35.00  },
    // ── Transmisión / Diferencial ──
    { codigo: 'ATF-001', nombre: 'ATF D3M For Nissan Automatic Transmission 1L',         categoria: 'TRANSMISION',    precioVenta: 30.00,  costo: 22.00 },
    { codigo: 'ATF-002', nombre: 'ATF Castrol Transmax DEX/MERC Automatic Transmission', categoria: 'TRANSMISION',    precioVenta: 30.00,  costo: 22.00 },
    { codigo: 'ATF-003', nombre: 'Hesst Ne Maxi Gear Full Synthetic GL-4 SAE 74w-90 1L', categoria: 'TRANSMISION',    precioVenta: 30.00,  costo: 22.00 },
    { codigo: 'ATF-004', nombre: 'Chevron Delo Gear EP-5 GL-5 SAE 80w-90 1L',            categoria: 'TRANSMISION',    precioVenta: 30.00,  costo: 22.00 },
    { codigo: 'ATF-005', nombre: 'Multi Gear Oil Eco Mitsubishi Motors GL-4 SAE 75w-80', categoria: 'TRANSMISION',    precioVenta: 30.00,  costo: 22.00 },
    { codigo: 'ATF-006', nombre: 'Aceite Para Diferencial Toyota GL-5 80w-90 1L',        categoria: 'TRANSMISION',    precioVenta: 30.00,  costo: 22.00 },
    // ── Motor ──
    { codigo: 'MOT-001', nombre: 'Trapecio Delantero RH',                                categoria: 'SUSPENSION',     precioVenta: 345.00, costo: 280.00 },
    { codigo: 'MOT-002', nombre: 'Juego de Válvulas Renault Duster K4M',                 categoria: 'MOTOR',          precioVenta: 320.00, costo: 250.00 },
    { codigo: 'MOT-003', nombre: 'Guía de Válvula Renault Duster K4M',                   categoria: 'MOTOR',          precioVenta: 220.00, costo: 170.00 },
    { codigo: 'MOT-004', nombre: 'Empaquetadura de Culata Renault K4M',                  categoria: 'MOTOR',          precioVenta: 150.00, costo: 110.00 },
    { codigo: 'MOT-005', nombre: 'Juego de Retenes Renault Duster K4M',                  categoria: 'MOTOR',          precioVenta: 130.00, costo: 100.00 },
    { codigo: 'MOT-006', nombre: 'Arandela de Tapón de Carter',                          categoria: 'MOTOR',          precioVenta: 5.00,   costo: 3.00   },
    { codigo: 'MOT-007', nombre: 'Arandela de Tapón de Carter (repuesto)',               categoria: 'ARANDELAS',      precioVenta: 10.00,  costo: 7.00   },
    { codigo: 'MOT-008', nombre: 'Termostato',                                           categoria: 'MOTOR',          precioVenta: 80.00,  costo: 60.00  },
    { codigo: 'MOT-009', nombre: 'Silicona para Motor',                                  categoria: 'MOTOR',          precioVenta: 20.00,  costo: 15.00  },
    { codigo: 'MOT-010', nombre: 'Faja de Accesorios',                                   categoria: 'MOTOR',          precioVenta: 70.00,  costo: 50.00  },
    { codigo: 'MOT-011', nombre: 'O-Ring de Múltiple de Admisión Renault Duster K4M',   categoria: 'MOTOR',          precioVenta: 80.00,  costo: 60.00  },
    { codigo: 'MOT-012', nombre: 'Pistones L200',                                        categoria: 'MOTOR',          precioVenta: 300.00, costo: 240.00 },
    { codigo: 'MOT-013', nombre: 'Juego de Anillos',                                     categoria: 'MOTOR',          precioVenta: 260.00, costo: 200.00 },
    { codigo: 'MOT-014', nombre: 'Juego de Camisetas L200',                              categoria: 'MOTOR',          precioVenta: 180.00, costo: 140.00 },
    { codigo: 'MOT-015', nombre: 'Juego de Bocinas de Biela',                            categoria: 'MOTOR',          precioVenta: 50.00,  costo: 38.00  },
    { codigo: 'MOT-016', nombre: 'Kit de Empaquetaduras de Motor L200',                  categoria: 'MOTOR',          precioVenta: 250.00, costo: 195.00 },
    { codigo: 'MOT-017', nombre: 'Metales de Biela L200',                                categoria: 'MOTOR',          precioVenta: 75.00,  costo: 58.00  },
    { codigo: 'MOT-018', nombre: 'Metales de Cigüeñal L200',                             categoria: 'MOTOR',          precioVenta: 110.00, costo: 85.00  },
    { codigo: 'MOT-019', nombre: 'Tapa de Radiador L200',                                categoria: 'MOTOR',          precioVenta: 25.00,  costo: 18.00  },
    { codigo: 'MOT-020', nombre: 'Biela de Motor L200',                                  categoria: 'MOTOR',          precioVenta: 250.00, costo: 195.00 },
    { codigo: 'MOT-021', nombre: 'Bomba de Aceite L200',                                 categoria: 'MOTOR',          precioVenta: 480.00, costo: 380.00 },
    { codigo: 'MOT-022', nombre: 'Bujías Pre Calentadoras',                              categoria: 'MOTOR',          precioVenta: 50.00,  costo: 38.00  },
    { codigo: 'MOT-023', nombre: 'Turbocompresor',                                       categoria: 'MOTOR',          precioVenta: 750.00, costo: 600.00 },
    { codigo: 'MOT-024', nombre: 'Silicona de Motor',                                    categoria: 'MOTOR',          precioVenta: 20.00,  costo: 15.00  },
    // ── Filtros ──
    { codigo: 'FIL-001', nombre: 'Filtro de Aceite de Motor',                            categoria: 'FILTROS',        precioVenta: 20.00,  costo: 14.00  },
    { codigo: 'FIL-002', nombre: 'Filtro de Aire de Motor For Wingle',                   categoria: 'FILTROS',        precioVenta: 40.00,  costo: 30.00  },
    { codigo: 'FIL-003', nombre: 'Filtro de Aceite de Motor L200',                       categoria: 'FILTROS',        precioVenta: 30.00,  costo: 22.00  },
    // ── Suspensión ──
    { codigo: 'SUS-001', nombre: 'Trapecio Delantero Derecho',                           categoria: 'SUSPENSION',     precioVenta: 350.00, costo: 280.00 },
    // ── Baterías ──
    { codigo: 'BAT-001', nombre: 'Batería 13 Placas Etna',                               categoria: 'BATERIAS',       precioVenta: 360.00, costo: 290.00 },
    // ── Eléctrico ──
    { codigo: 'ELE-001', nombre: 'Remaches 1/8',                                         categoria: 'ELECTRICIDAD',   precioVenta: 1.00,   costo: 0.50   },
    { codigo: 'ELE-002', nombre: 'Focos Doble Contacto',                                 categoria: 'ELECTRICIDAD',   precioVenta: 5.00,   costo: 3.00   },
    // ── Insumos ──
    { codigo: 'INS-001', nombre: 'Limpiador de Freno',                                   categoria: 'INSUMOS',        precioVenta: 20.00,  costo: 14.00  },
    { codigo: 'INS-002', nombre: 'Gasolina para Lavar',                                  categoria: 'INSUMOS',        precioVenta: 30.00,  costo: 22.00  },
    { codigo: 'INS-003', nombre: 'Gasolina para Limpieza',                               categoria: 'INSUMOS',        precioVenta: 30.00,  costo: 22.00  },
    { codigo: 'INS-004', nombre: 'Gasolina para Limpieza (combustible)',                  categoria: 'COMBUSTIBLE',    precioVenta: 50.00,  costo: 40.00  },
    { codigo: 'INS-005', nombre: 'Shampoo para Limpiaparabrisas',                        categoria: 'INSUMOS',        precioVenta: 10.00,  costo: 7.00   },
    // ── Mangueras ──
    { codigo: 'MAN-001', nombre: 'Mangueras de Refrigerante de Motor',                   categoria: 'MANGUERAS',      precioVenta: 50.00,  costo: 38.00  },
  ];

  let creados = 0;
  let omitidos = 0;
  for (const r of repuestos) {
    const existe = await prisma.repuesto.findUnique({ where: { codigo: r.codigo } });
    if (!existe) {
      await prisma.repuesto.create({
        data: {
          codigo:      r.codigo,
          nombre:      r.nombre,
          categoria:   r.categoria,
          precioVenta: r.precioVenta,
          costo:       r.costo,
          stock:       0,
          stockMinimo: 2,
          activo:      true,
        },
      });
      creados++;
    } else {
      omitidos++;
    }
  }
  console.log(`✓ Repuestos: ${creados} creados, ${omitidos} ya existían`);
  console.log('✅ Seed completado!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());