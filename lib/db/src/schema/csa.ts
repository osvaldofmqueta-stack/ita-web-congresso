import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
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
