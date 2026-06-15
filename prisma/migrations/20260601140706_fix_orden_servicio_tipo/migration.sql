-- DropForeignKey
ALTER TABLE "orden_servicios" DROP CONSTRAINT "orden_servicios_servicioId_fkey";

-- AlterTable
ALTER TABLE "orden_servicios" ADD COLUMN     "tipo" TEXT NOT NULL DEFAULT 'servicio',
ALTER COLUMN "servicioId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "orden_servicios" ADD CONSTRAINT "orden_servicios_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "servicios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
