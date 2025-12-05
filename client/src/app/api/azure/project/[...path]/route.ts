// client/src/app/api/azure/project/[...path]/route.ts
export const dynamic = "force-dynamic";
import { createDevopsApiProxy } from "@/lib/helpers/server/devopsApiProxy";

export const GET = createDevopsApiProxy();
export const POST = createDevopsApiProxy();
export const PUT = createDevopsApiProxy();
export const PATCH = createDevopsApiProxy();
export const DELETE = createDevopsApiProxy();

