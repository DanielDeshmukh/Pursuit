import { applications, companies, contacts } from "./schema";

export const STATUS_COLUMNS = [
  { id: "SAVED", label: "Saved" },
  { id: "APPLIED", label: "Applied" },
  { id: "WALK_IN", label: "Walk-in" },
  { id: "PHONE_SCREEN", label: "Phone Screen" },
  { id: "INTERVIEW", label: "Interview" },
  { id: "OFFER", label: "Offer" },
  { id: "REJECTED", label: "Rejected" },
  { id: "GHOSTED", label: "Ghosted" },
] as const;

export type Application = typeof applications.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type Contact = typeof contacts.$inferSelect;

export type ApplicationWithRelations = Application & {
  company: Company;
  contact: Contact | null;
};
