// client/src/app/api/github/[...path]/route.ts
export const dynamic = "force-dynamic";
import { createDevopsApiProxy } from "@/lib/helpers/server/devopsApiProxy";

export const GET = createDevopsApiProxy({ requireAuth: true });
export const POST = createDevopsApiProxy({ requireAuth: true });
export const PUT = createDevopsApiProxy({ requireAuth: true });
export const PATCH = createDevopsApiProxy({ requireAuth: true });
export const DELETE = createDevopsApiProxy({ requireAuth: true });

