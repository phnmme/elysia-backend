-- CreateTable
CREATE TABLE "CareerReview" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "jobField" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CareerReview_userId_idx" ON "CareerReview"("userId");

-- AddForeignKey
ALTER TABLE "CareerReview" ADD CONSTRAINT "CareerReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
