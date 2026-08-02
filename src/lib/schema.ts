import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  resumeUrl: text("resume_url"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const companies = sqliteTable("companies", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  website: text("website"),
  industry: text("industry"),
  source: text("source"),
});

export const contacts = sqliteTable("contacts", {
  id: text("id").primaryKey(),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id),
  name: text("name").notNull(),
  role: text("role"),
  email: text("email"),
  linkedinUrl: text("linkedin_url"),
  lastContactedAt: text("last_contacted_at"),
});

export const applications = sqliteTable(
  "applications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id),
    contactId: text("contact_id").references(() => contacts.id),
    jobTitle: text("job_title").notNull(),
    jobUrl: text("job_url"),
    status: text("status").notNull().default("SAVED"),
    salaryMin: integer("salary_min"),
    salaryMax: integer("salary_max"),
    source: text("source"),
    appliedAt: text("applied_at"),
    resumeVersionUsed: text("resume_version_used"),
    notes: text("notes"),
    nextFollowUpAt: text("next_follow_up_at"),
  },
  (t) => [
    index("applications_user_id_idx").on(t.userId),
    index("applications_status_idx").on(t.status),
    index("applications_company_id_idx").on(t.companyId),
  ]
);

export const outreachMessages = sqliteTable(
  "outreach_messages",
  {
    id: text("id").primaryKey(),
    applicationId: text("application_id")
      .notNull()
      .references(() => applications.id),
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id),
    channel: text("channel").notNull(),
    subject: text("subject"),
    body: text("body").notNull(),
    status: text("status").notNull().default("drafted"),
    sentAt: text("sent_at"),
  },
  (t) => [
    index("outreach_application_id_idx").on(t.applicationId),
  ]
);

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country"),
  linkedinUrl: text("linkedin_url"),
  portfolioUrl: text("portfolio_url"),
  currentTitle: text("current_title"),
  currentCompany: text("current_company"),
  yearsExperience: text("years_experience"),
  education: text("education"),
  skills: text("skills"),
  workAuthorization: text("work_authorship"),
  salaryExpectation: text("salary_expectation"),
  bio: text("bio"),
  coverLetterTemplate: text("cover_letter_template"),
  customAnswers: text("custom_answers"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const reminders = sqliteTable(
  "reminders",
  {
    id: text("id").primaryKey(),
    applicationId: text("application_id")
      .notNull()
      .references(() => applications.id),
    type: text("type").notNull(),
    dueAt: text("due_at").notNull(),
    done: integer("done", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [
    index("reminders_application_id_idx").on(t.applicationId),
    index("reminders_done_idx").on(t.done),
  ]
);
