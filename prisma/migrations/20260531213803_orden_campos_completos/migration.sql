/*
  Warnings:

  - You are about to drop the column `totalManoObra` on the `ordenes_trabajo` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ordenes_trabajo" DROP CONSTRAINT "ordenes_trabajo_vehiculoId_fkey";

-- AlterTable
ALTER TABLE "ordenes_trabajo" DROP COLUMN "totalManoObra",
ADD COLUMN     "anio" INTEGER,
ADD COLUMN     "asesor" TEXT,
ADD COLUMN     "chasis" TEXT,
ADD COLUMN     "clienteId" TEXT,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "contacto" TEXT,
ADD COLUMN     "correo" TEXT,
ADD COLUMN     "direccion" TEXT,
ADD COLUMN     "dniRuc" TEXT,
ADD COLUMN     "facturarA" TEXT,
ADD COLUMN     "km2" INTEGER,
ADD COLUMN     "marca" TEXT,
ADD COLUMN     "metodoPago" TEXT,
ADD COLUMN     "modelo" TEXT,
ADD COLUMN     "motor" TEXT,
ADD COLUMN     "nota1" TEXT,
ADD COLUMN     "nota2" TEXT,
ADD COLUMN     "placa" TEXT,
ADD COLUMN     "prioridad" TEXT NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "telefono" TEXT,
ADD COLUMN     "telefono2" TEXT,
ADD COLUMN     "tipoOrden" TEXT,
ALTER COLUMN "vehiculoId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "vehiculos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
