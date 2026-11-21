import type { DefaultSession } from "next-auth";
import type { Role } from "@/generated/prisma/client";

declare module "next-auth" {
  interface User {
    id: string;
    role?: Role;
    phone?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role?: Role;
      phone?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role?: Role;
    phone?: string | null;
  }
}
