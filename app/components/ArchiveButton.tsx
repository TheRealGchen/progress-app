"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Archive, ArchiveRestore } from "lucide-react";

interface ArchiveButtonProps {
  entryId: number;
  isArchived: boolean;
}

export function ArchiveButton({ entryId, isArchived }: ArchiveButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    await fetch(`/api/entries/${entryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        archivedAt: isArchived ? null : new Date().toISOString(),
      }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className="gap-1.5 text-muted-foreground"
    >
      {isArchived ? (
        <>
          <ArchiveRestore size={14} />
          Restore
        </>
      ) : (
        <>
          <Archive size={14} />
          Archive
        </>
      )}
    </Button>
  );
}
