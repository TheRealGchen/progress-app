import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notes } from "@/db/schema";

export const dynamic = "force-dynamic";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const entryNotes = await db
    .select()
    .from(notes)
    .where(eq(notes.entryId, parseInt(id)))
    .orderBy(notes.createdAt);
  return NextResponse.json(entryNotes);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { body } = await req.json();

  if (!body?.trim()) {
    return NextResponse.json({ error: "body is required" }, { status: 400 });
  }

  const [note] = await db
    .insert(notes)
    .values({ entryId: parseInt(id), body })
    .returning();

  return NextResponse.json(note, { status: 201 });
}
