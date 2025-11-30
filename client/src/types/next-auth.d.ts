import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    user: DefaultSession["user"] & {};
  }
}

declare module "@auth/core/jwt" {
  interface JWT extends Record<string, unknown> {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
  }
}
