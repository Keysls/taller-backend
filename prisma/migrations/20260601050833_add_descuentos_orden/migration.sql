-- AlterTable
ALTER TABLE "ordenes_trabajo" ADD COLUMN     "descuentoRep" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "descuentoSvc" DECIMAL(10,2) NOT NULL DEFAULT 0;
