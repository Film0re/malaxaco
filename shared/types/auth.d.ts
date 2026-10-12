// auth.d.ts
import type { OAuthProvider } from "#shared/auth";

declare module "#auth-utils" {
  interface User {
    id: number;
    name: string | null;
    avatarUrl?: string;
    provider: OAuthProvider | "guest" | "credentials";
  }
}
export {};
