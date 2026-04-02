import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { entryGroups } from "@/db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const groups = await db.select().from(entryGroups).orderBy(asc(entryGroups.position));
  return NextResponse.json(groups);
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const all = await db.select().from(entryGroups).orderBy(asc(entryGroups.position));
  const maxPos = all.length > 0 ? Math.max(...all.map((g) => g.position)) : -1;
  const [group] = await db
    .insert(entryGroups)
    .values({ name: name.trim(), position: maxPos + 1 })
    .returning();
  return NextResponse.json(group, { status: 201 });
}
