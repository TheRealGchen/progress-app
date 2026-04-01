import { NextResponse } from "next/server";
import { db } from "@/db";
import { trackerTypes } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const types = await db.select().from(trackerTypes);
  return NextResponse.json(types);
}
