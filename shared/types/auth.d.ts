declare module "#auth-utils" {
  interface User {
    id: number;
    name: string;
    avatarUrl?: string;
    provider: "google" | "riot" | "guest";
  }
}
export {};
