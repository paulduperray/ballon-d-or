import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const votes = sqliteTable("votes", {
  userId: text("user_id").primaryKey(),
  voterName: text("voter_name").notNull(),
  voterEmail: text("voter_email").notNull(),
  ranking: text("ranking", { mode: "json" }).$type<string[]>().notNull(),
  isFinal: integer("is_final", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  lockedAt: text("locked_at"),
});
