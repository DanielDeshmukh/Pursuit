import { z } from "zod";

const JOB_STATUSES = [
  "SAVED",
  "APPLIED",
  "WALK_IN",
  "PHONE_SCREEN",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "GHOSTED",
] as const;

const SOURCES = [
  "LinkedIn",
  "Naukri",
  "Referral",
  "Walk-in",
  "Company Website",
  "Indeed",
  "Other",
] as const;

const REMINDER_TYPES = ["follow_up", "interview_prep", "thank_you"] as const;

const OUTREACH_CHANNELS = ["email", "linkedin"] as const;

export const addApplicationSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required").max(200),
  companyName: z.string().min(1, "Company name is required").max(200),
  jobUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  salaryMin: z.string().optional().or(z.literal("")),
  salaryMax: z.string().optional().or(z.literal("")),
  source: z.enum(SOURCES).optional().or(z.literal("")),
  notes: z.string().max(5000).optional().or(z.literal("")),
  status: z.enum(JOB_STATUSES).optional(),
});

export const updateApplicationSchema = z.object({
  jobTitle: z.string().min(1).max(200).optional(),
  jobUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  status: z.enum(JOB_STATUSES).optional(),
  salaryMin: z.string().optional().or(z.literal("")),
  salaryMax: z.string().optional().or(z.literal("")),
  source: z.enum(SOURCES).optional().or(z.literal("")),
  notes: z.string().max(5000).optional().or(z.literal("")),
  resumeVersionUsed: z.string().max(100).optional().or(z.literal("")),
});

export const addReminderSchema = z.object({
  applicationId: z.string().min(1, "Application is required"),
  type: z.enum(REMINDER_TYPES, { errorMap: () => ({ message: "Invalid reminder type" }) }),
  dueAt: z.string().min(1, "Due date is required"),
});

export const updateReminderSchema = z.object({
  applicationId: z.string().min(1).optional(),
  type: z.enum(REMINDER_TYPES).optional(),
  dueAt: z.string().min(1).optional(),
});

export const addOutreachSchema = z.object({
  applicationId: z.string().min(1, "Application is required"),
  contactId: z.string().min(1, "Contact is required"),
  channel: z.enum(OUTREACH_CHANNELS, { errorMap: () => ({ message: "Invalid channel" }) }),
  subject: z.string().max(200).optional().or(z.literal("")),
  body: z.string().min(1, "Message body is required").max(10000),
});

export const updateOutreachSchema = z.object({
  channel: z.enum(OUTREACH_CHANNELS).optional(),
  subject: z.string().max(200).optional().or(z.literal("")),
  body: z.string().min(1).max(10000).optional(),
});

export const addContactSchema = z.object({
  companyId: z.string().min(1, "Company is required"),
  name: z.string().min(1, "Name is required").max(200),
  role: z.string().max(200).optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  linkedinUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

export const updateContactSchema = z.object({
  companyId: z.string().min(1).optional(),
  name: z.string().min(1).max(200).optional(),
  role: z.string().max(200).optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  linkedinUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

export type AddApplicationInput = z.infer<typeof addApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type AddReminderInput = z.infer<typeof addReminderSchema>;
export type AddOutreachInput = z.infer<typeof addOutreachSchema>;
export type AddContactInput = z.infer<typeof addContactSchema>;
