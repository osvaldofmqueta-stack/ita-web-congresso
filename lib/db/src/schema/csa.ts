import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const csaSettingsTable = pgTable("csa_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const insertCsaSettingSchema = createInsertSchema(csaSettingsTable).omit({ id: true, updatedAt: true });
export type InsertCsaSetting = z.infer<typeof insertCsaSettingSchema>;
export type CsaSetting = typeof csaSettingsTable.$inferSelect;

export const csaLinksTable = pgTable("csa_links", {
  id: serial("id").primaryKey(),
  platform: text("platform").notNull(),
  label: text("label").notNull(),
  url: text("url").notNull(),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const insertCsaLinkSchema = createInsertSchema(csaLinksTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCsaLink = z.infer<typeof insertCsaLinkSchema>;
export type CsaLink = typeof csaLinksTable.$inferSelect;

export const csaImportantDatesTable = pgTable("csa_important_dates", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  date: text("date").notNull(),
  done: boolean("done").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const insertCsaImportantDateSchema = createInsertSchema(csaImportantDatesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCsaImportantDate = z.infer<typeof insertCsaImportantDateSchema>;
export type CsaImportantDate = typeof csaImportantDatesTable.$inferSelect;

export const csaSpeakersTable = pgTable("csa_speakers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  area: text("area").notNull(),
  country: text("country").notNull(),
  initials: text("initials").notNull(),
  photoUrl: text("photo_url"),
  category: text("category"),
  academicDegree: text("academic_degree"),
  origin: text("origin"),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const insertCsaSpeakerSchema = createInsertSchema(csaSpeakersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCsaSpeaker = z.infer<typeof insertCsaSpeakerSchema>;
export type CsaSpeaker = typeof csaSpeakersTable.$inferSelect;
