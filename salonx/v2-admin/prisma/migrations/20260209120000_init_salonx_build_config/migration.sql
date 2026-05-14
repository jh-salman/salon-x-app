-- CreateTable
CREATE TABLE "SalonxBuildConfig" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "webProjectionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedPayload" JSONB,

    CONSTRAINT "SalonxBuildConfig_pkey" PRIMARY KEY ("id")
);
