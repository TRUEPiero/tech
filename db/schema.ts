import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const calculatorSettings = sqliteTable("calculator_settings", {
  id: text("id").primaryKey(),
  payload: text("payload").notNull(),
  revision: integer("revision").notNull(),
  updatedAt: text("updated_at").notNull(),
  updatedBy: text("updated_by").notNull(),
});
