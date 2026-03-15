import { NextResponse } from "next/server";
import { db } from "@/db";
import { trackerTypes } from "@/db/schema";

export async function GET() {
  const types = await db.select().from(trackerTypes);
  return NextResponse.json(types);
}
