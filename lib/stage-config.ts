export type FieldType = "text" | "textarea" | "datetime-local" | "number" | "url";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  optional?: boolean;
}

// Structured fields that are suggested per stage name.
// These are just suggestions — users can always add freeform notes too.
export const STAGE_FIELDS: Record<string, FieldDef[]> = {
  // Job Hunt
  Applied: [
    { key: "date_applied", label: "Date Applied", type: "datetime-local" },
    {
      key: "apply_method",
      label: "Method",
      type: "text",
      placeholder: "Company site, LinkedIn, Referral…",
    },
    { key: "contact_name", label: "Contact Name", type: "text", optional: true },
  ],
  "Phone Screen": [
    { key: "scheduled_at", label: "Scheduled", type: "datetime-local" },
    { key: "recruiter_name", label: "Recruiter Name", type: "text", optional: true },
    { key: "prep_notes", label: "Prep Notes", type: "textarea", optional: true },
  ],
  Interview: [
    { key: "scheduled_at", label: "Scheduled", type: "datetime-local" },
    { key: "round_number", label: "Round #", type: "number", optional: true },
    {
      key: "format",
      label: "Format",
      type: "text",
      placeholder: "Technical, Behavioural, System Design…",
      optional: true,
    },
    {
      key: "interviewers",
      label: "Interviewer(s)",
      type: "text",
      optional: true,
    },
    { key: "notes", label: "Notes", type: "textarea", optional: true },
  ],
  Offer: [
    { key: "amount", label: "Offer Amount", type: "text", placeholder: "$120,000" },
    { key: "deadline", label: "Decision Deadline", type: "datetime-local", optional: true },
    {
      key: "equity_notes",
      label: "Equity / Benefits",
      type: "textarea",
      optional: true,
    },
  ],
  Closed: [
    {
      key: "outcome",
      label: "Outcome",
      type: "text",
      placeholder: "Accepted, Rejected, Withdrew, Ghosted",
    },
    { key: "reason", label: "Notes / Reason", type: "textarea", optional: true },
  ],

  // Apartment Hunt
  Toured: [
    { key: "tour_date", label: "Tour Date", type: "datetime-local" },
    { key: "tour_notes", label: "Notes", type: "textarea", optional: true },
  ],
  "Application Submitted": [
    { key: "submitted_at", label: "Submitted At", type: "datetime-local" },
    { key: "fee", label: "Application Fee", type: "text", optional: true },
  ],
  Approved: [
    { key: "approval_date", label: "Approval Date", type: "datetime-local", optional: true },
    { key: "conditions", label: "Conditions", type: "textarea", optional: true },
  ],
  "Lease Signed": [
    { key: "move_in_date", label: "Move-in Date", type: "datetime-local" },
    { key: "monthly_rent", label: "Monthly Rent", type: "text" },
    { key: "lease_term", label: "Lease Term", type: "text", placeholder: "12 months" },
  ],
};

// Returns field defs for a given stage name, or empty array if none defined.
export function getStageFields(stageName: string): FieldDef[] {
  return STAGE_FIELDS[stageName] ?? [];
}
