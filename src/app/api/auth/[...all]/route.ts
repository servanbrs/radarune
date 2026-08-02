import { toNextJsHandler } from "better-auth/next-js";
import { createAuth } from "@/features/authentication/server/auth";

async function handle(request: Request) {
  const handler = toNextJsHandler(createAuth());
  return request.method === "GET" ? handler.GET(request) : handler.POST(request);
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
