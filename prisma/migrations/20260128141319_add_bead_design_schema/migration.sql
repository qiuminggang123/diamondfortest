-- CreateTable
CREATE TABLE "public"."BeadCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "BeadCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BeadMaterial" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "BeadMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Bead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "size" INTEGER NOT NULL,
    "categoryId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,

    CONSTRAINT "Bead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Design" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "thumb" TEXT,
    "circumference" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Design_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DesignBead" (
    "id" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "beadId" TEXT NOT NULL,
    "x" DOUBLE PRECISION,
    "y" DOUBLE PRECISION,
    "rotation" DOUBLE PRECISION,
    "order" INTEGER NOT NULL,

    CONSTRAINT "DesignBead_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Bead" ADD CONSTRAINT "Bead_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."BeadCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bead" ADD CONSTRAINT "Bead_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "public"."BeadMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Design" ADD CONSTRAINT "Design_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DesignBead" ADD CONSTRAINT "DesignBead_designId_fkey" FOREIGN KEY ("designId") REFERENCES "public"."Design"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DesignBead" ADD CONSTRAINT "DesignBead_beadId_fkey" FOREIGN KEY ("beadId") REFERENCES "public"."Bead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
