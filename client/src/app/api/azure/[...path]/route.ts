// client/src/app/api/azure/[...path]/route.ts
export const dynamic = "force-dynamic";
import { makeDotnetProxy } from "@/lib/helpers/server/dotnetProxy";

export const GET = makeDotnetProxy();
export const POST = makeDotnetProxy();
export const PUT = makeDotnetProxy();
export const PATCH = makeDotnetProxy();
export const DELETE = makeDotnetProxy();
