import type { H3Event } from "h3";
export const useDB = (event: H3Event) => event.context.cloudflare.env.DB as D1Database;
