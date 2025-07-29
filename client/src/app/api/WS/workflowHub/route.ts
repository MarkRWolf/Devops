// client/src/app/api/WS/workflowHub/route.ts

import { makeDotnetProxy } from "@/lib/helpers/server/dotnetProxy";

export const GET = makeDotnetProxy();
export const POST = makeDotnetProxy();
