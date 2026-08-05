import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// Re-export the Better Auth tables so `db/schema.ts` is the single schema entry.
// The `user` table is the canonical accounts table.
export * from "./auth-schema";
import { user } from "./auth-schema";

// ---- Groups ----
export const groups = sqliteTable("groups", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ---- GroupMembers (many-to-many: user <-> groups) ----
export const groupMembers = sqliteTable("group_members", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  groupId: text("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

// ---- Expenses ----
export const expenses = sqliteTable("expenses", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  groupId: text("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  paidById: text("paid_by_id")
    .notNull()
    .references(() => user.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ---- ExpenseSplits ----
export const expenseSplits = sqliteTable("expense_splits", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  expenseId: text("expense_id")
    .notNull()
    .references(() => expenses.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  amount: real("amount").notNull(),
});

// ---- Relations ----
export const groupsRelations = relations(groups, ({ one, many }) => ({
  owner: one(user, { fields: [groups.ownerId], references: [user.id] }),
  members: many(groupMembers),
  expenses: many(expenses),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, { fields: [groupMembers.groupId], references: [groups.id] }),
  member: one(user, { fields: [groupMembers.userId], references: [user.id] }),
}));

export const expensesRelations = relations(expenses, ({ one, many }) => ({
  group: one(groups, { fields: [expenses.groupId], references: [groups.id] }),
  paidBy: one(user, { fields: [expenses.paidById], references: [user.id] }),
  splits: many(expenseSplits),
}));

export const expenseSplitsRelations = relations(expenseSplits, ({ one }) => ({
  expense: one(expenses, {
    fields: [expenseSplits.expenseId],
    references: [expenses.id],
  }),
  member: one(user, { fields: [expenseSplits.userId], references: [user.id] }),
}));