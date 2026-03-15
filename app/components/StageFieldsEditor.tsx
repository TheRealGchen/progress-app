"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getStageFields, type FieldDef } from "@/lib/stage-config";
import { Pencil, Check, X } from "lucide-react";

interface StageField {
  id: number;
  fieldKey: string;
  fieldValue: string | null;
}

interface StageFieldsEditorProps {
  entryId: number;
  stageId: number;
  stageName: string;
  existingFields: StageField[];
  isEntered: boolean;
}

export function StageFieldsEditor({
  entryId,
  stageId,
  stageName,
  existingFields,
  isEntered,
}: StageFieldsEditorProps) {
  const router = useRouter();
  const configFields = getStageFields(stageName);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Build initial form values from existing saved fields
  const initialValues = Object.fromEntries(
    configFields.map((f) => [
      f.key,
      existingFields.find((ef) => ef.fieldKey === f.key)?.fieldValue ?? "",
    ])
  );
  const [values, setValues] = useState<Record<string, string>>(initialValues);

  // Also track freeform stage note separately (stored as fieldKey "stage_note")
  const savedNote = existingFields.find((f) => f.fieldKey === "stage_note")?.fieldValue ?? "";
  const [stageNote, setStageNote] = useState(savedNote);

  if (!isEntered) return null;

  // Nothing configured + no saved data + no note: show a minimal add-notes prompt
  const hasConfigFields = configFields.length > 0;
  const hasSavedData = existingFields.length > 0;

  async function handleSave() {
    setSaving(true);
    const allFields: Record<string, string> = { ...values };
    if (stageNote.trim()) allFields["stage_note"] = stageNote.trim();

    await fetch(`/api/entries/${entryId}/stages/${stageId}/fields`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: allFields }),
    });

    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  function handleCancel() {
    // Reset to last saved values
    setValues(initialValues);
    setStageNote(savedNote);
    setEditing(false);
  }

  // Read-only view
  if (!editing) {
    const displayFields = [
      ...configFields
        .map((f) => ({ label: f.label, value: values[f.key] }))
        .filter((f) => f.value),
      ...(savedNote ? [{ label: "Notes", value: savedNote }] : []),
    ];

    return (
      <div className="mt-2">
        {displayFields.length > 0 ? (
          <div className="flex flex-col gap-1">
            {displayFields.map((f) => (
              <div key={f.label} className="text-xs flex gap-1.5">
                <span className="text-muted-foreground shrink-0">{f.label}:</span>
                <span className="whitespace-pre-wrap break-words">{f.value}</span>
              </div>
            ))}
            <button
              onClick={() => setEditing(true)}
              className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground w-fit"
            >
              <Pencil size={10} />
              Edit
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Pencil size={10} />
            Add notes
          </button>
        )}
      </div>
    );
  }

  // Edit view
  return (
    <div className="mt-3 flex flex-col gap-3 p-3 rounded-lg border bg-muted/30">
      {configFields.map((field) => (
        <FieldInput
          key={field.key}
          field={field}
          value={values[field.key] ?? ""}
          onChange={(v) => setValues((prev) => ({ ...prev, [field.key]: v }))}
        />
      ))}

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          Notes
          <span className="ml-1 font-normal">(optional)</span>
        </label>
        <Textarea
          value={stageNote}
          onChange={(e) => setStageNote(e.target.value)}
          placeholder="Any notes about this stage…"
          rows={2}
          className="resize-none text-xs"
        />
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1 h-7 text-xs">
          <Check size={11} />
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          className="gap-1 h-7 text-xs"
        >
          <X size={11} />
          Cancel
        </Button>
      </div>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted-foreground">
        {field.label}
        {field.optional && <span className="ml-1 font-normal">(optional)</span>}
      </label>
      {field.type === "textarea" ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={2}
          className="resize-none text-xs"
        />
      ) : (
        <Input
          type={field.type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="h-7 text-xs"
        />
      )}
    </div>
  );
}
