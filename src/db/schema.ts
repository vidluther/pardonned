import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const administrations = sqliteTable("administrations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").unique().notNull(),
  president_name: text("president_name").notNull(),
  term_number: integer("term_number").notNull(),
  start_date: text("start_date").notNull(),
  end_date: text("end_date"),
  created_at: text("created_at")
    .default(sql`datetime('now')`)
    .notNull(),
  updated_at: text("updated_at")
    .default(sql`datetime('now')`)
    .notNull(),
});

export const pardons = sqliteTable(
  "pardons",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    administration: integer("administration")
      .notNull()
      .references(() => administrations.id),
    recipient_name: text("recipient_name").notNull(),
    slug: text("slug").unique(),
    clemency_type: text("clemency_type", {
      enum: ["pardon", "commutation"],
    }).notNull(),
    grant_date: text("grant_date").notNull(),
    warrant_url: text("warrant_url"),
    source_url: text("source_url"),
    district: text("district"),
    offense: text("offense").notNull(),
    offense_category: text("offense_category", {
      enum: [
        "violent crime",
        "fraud",
        "drug offense",
        "FACE act",
        "immigration",
        "firearms",
        "financial crime",
        "other",
      ],
    }).notNull(),
    sentence_in_months: integer("sentence_in_months"),
    fine: real("fine"),
    restitution: real("restitution"),
    original_sentence: text("original_sentence"),
    created_at: text("created_at")
      .default(sql`datetime('now')`)
      .notNull(),
    updated_at: text("updated_at")
      .default(sql`datetime('now')`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("pardons_admin_recipient_date_type_unique").on(
      table.administration,
      table.recipient_name,
      table.grant_date,
      table.clemency_type,
    ),
  ],
);
