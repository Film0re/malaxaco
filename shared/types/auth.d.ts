// auth.d.ts
import type { OAuthProvider } from "#shared/auth";

declare module "#auth-utils" {
  interface User {
    id: number;
    name: string;
    avatarUrl?: string;
    provider: OAuthProvider | "guest";
  }
}
export {};
