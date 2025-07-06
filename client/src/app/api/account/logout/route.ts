// app/api/account/logout/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  (await cookies()).delete("DevopsUserToken");
  return NextResponse.json({ message: "Logged out successfully." });
}
