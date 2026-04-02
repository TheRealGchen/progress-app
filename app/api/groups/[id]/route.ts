import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { entryGroups } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// PATCH /api/groups/[id] — rename or reorder
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.position !== undefined) updates.position = body.position;

  const [updated] = await db
    .update(entryGroups)
    .set(updates)
    .where(eq(entryGroups.id, parseInt(id)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

// DELETE /api/groups/[id] — entries in this group become ungrouped
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(entryGroups).where(eq(entryGroups.id, parseInt(id)));
  return new NextResponse(null, { status: 204 });
}
