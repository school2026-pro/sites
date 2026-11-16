import { sqliteTable, text, integer, index, primaryKey } from 'drizzle-orm/sqlite-core';
export const entries = sqliteTable('planner_entries', {
 id:text('id').primaryKey(), owner:text('owner').notNull(), title:text('title').notNull(),
 kind:text('kind').notNull(), date:text('date').notNull(), start:text('start'), end:text('end'),
 category:text('category').notNull(), priority:integer('priority').notNull(), notes:text('notes').notNull(),
 done:integer('done').notNull().default(0), version:integer('version').notNull().default(1),
 deletedAt:text('deleted_at'), createdAt:text('created_at').notNull(), updatedAt:text('updated_at').notNull(),
}, t=>[index('planner_entries_owner_date').on(t.owner,t.date)]);
export const reflections = sqliteTable('planner_reflections', {
 owner:text('owner').notNull(), date:text('date').notNull(), mood:integer('mood').notNull(),
 focus:integer('focus').notNull(), minutes:integer('minutes').notNull(), wins:text('wins').notNull(),
 obstacles:text('obstacles').notNull(), learned:text('learned').notNull(), nextAction:text('next_action').notNull(),
 version:integer('version').notNull().default(1), updatedAt:text('updated_at').notNull(),
}, t=>[primaryKey({columns:[t.owner,t.date]})]);
