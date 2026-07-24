import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/features/authentication/server/auth";

export const { GET, POST } = toNextJsHandler(auth);
