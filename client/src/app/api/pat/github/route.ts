export const dynamic = "force-dynamic";
import { createDevopsApiProxy } from "@/lib/helpers/server/devopsApiProxy";

export const POST = createDevopsApiProxy({ requireAuth: true });

