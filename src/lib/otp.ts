import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const MAX_ATTEMPTS = 5;

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  if (!/^09\d{9}$/.test(phone) || !/^\d{5}$/.test(code)) return false;

  const otp = await prisma.otpCode.findFirst({
    where: { phone, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) return false;

  const { attempts } = await prisma.otpCode.update({
    where: { id: otp.id },
    data: { attempts: { increment: 1 } },
  });

  if (attempts >= MAX_ATTEMPTS) {
    await prisma.otpCode.deleteMany({ where: { id: otp.id } });
    return false;
  }

  if (!(await bcrypt.compare(code, otp.codeHash))) return false;

  await prisma.otpCode.deleteMany({ where: { phone } });
  return true;
}
