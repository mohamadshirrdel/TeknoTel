-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "session_state" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" TIMESTAMP(3);
