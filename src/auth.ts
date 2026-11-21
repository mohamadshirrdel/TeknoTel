import { generateId } from "@/lib/id";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Google,
    Credentials({
      id: "phone-otp",
      credentials: { phone: {}, code: {} },

      async authorize(c) {
        const phone = String(c.phone),
          code = String(c.code);

        if (!/^09\d{9}$/.test(phone)) return null;
        if (!(await verifyOtp(phone, code))) return null;

        const adminPhones = (process.env.ADMIN_PHONES ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        const isAdmin = adminPhones.includes(phone);

        return prisma.user.upsert({
          where: { phone },
          update: isAdmin ? { role: "ADMIN" } : {},
          create: {
            id: generateId(),
            phone,
            role: isAdmin ? "ADMIN" : "USER",
          },
        });
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phone = user.phone;
      }

      if (token.id && !token.phone) {
        const u = await prisma.user.findUnique({
          where: { id: token.id },
          select: { phone: true, role: true },
        });

        if (u) {
          token.phone = u.phone;
          token.role = u.role;
        }
      }

      return token;
    },

    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.phone = token.phone;

      return session;
    },
  },
  pages: { signIn: "/login" },
});
