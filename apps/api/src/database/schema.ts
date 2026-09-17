import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
};

export const userRole = pgEnum('user_role', ['ADMIN', 'LECTURER', 'STUDENT']);
export const userStatus = pgEnum('user_status', [
  'ACTIVE',
  'SUSPENDED',
  'ARCHIVED',
]);
export const resultStatus = pgEnum('result_status', [
  'DRAFT',
  'PUBLISHED',
  'WITHHELD',
]);
export const moduleCategory = pgEnum('module_category', [
  'CORE',
  'ELECTIVE',
  'GENERAL',
]);

export const departments = pgTable('departments', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 16 }).notNull().unique(),
  name: varchar('name', { length: 160 }).notNull(),
  ...timestamps,
});

export const programmes = pgTable('programmes', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 32 }).notNull().unique(),
  name: varchar('name', { length: 180 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps,
});

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 254 }).notNull(),
    indexNumber: varchar('index_number', { length: 40 }),
    staffNumber: varchar('staff_number', { length: 40 }),
    fullName: varchar('full_name', { length: 180 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    refreshTokenHash: text('refresh_token_hash'),
    role: userRole('role').notNull().default('STUDENT'),
    status: userStatus('status').notNull().default('ACTIVE'),
    batchYear: integer('batch_year'),
    programmeId: uuid('programme_id').references(() => programmes.id, {
      onDelete: 'set null',
    }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    passwordChangedAt: timestamp('password_changed_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('users_email_unique').on(table.email),
    uniqueIndex('users_index_number_unique').on(table.indexNumber),
    index('users_role_status_idx').on(table.role, table.status),
    index('users_batch_idx').on(table.batchYear),
  ],
);

export const modules = pgTable(
  'modules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 32 }).notNull().unique(),
    name: varchar('name', { length: 180 }).notNull(),
    credits: numeric('credits', { precision: 4, scale: 1 }).notNull(),
    level: integer('level').notNull(),
    semester: integer('semester').notNull(),
    category: moduleCategory('category').notNull().default('CORE'),
    departmentId: uuid('department_id').references(() => departments.id, {
      onDelete: 'restrict',
    }),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps,
  },
  (table) => [
    index('modules_level_semester_idx').on(table.level, table.semester),
  ],
);

export const programmeModules = pgTable(
  'programme_modules',
  {
    programmeId: uuid('programme_id')
      .notNull()
      .references(() => programmes.id, { onDelete: 'cascade' }),
    moduleId: uuid('module_id')
      .notNull()
      .references(() => modules.id, { onDelete: 'cascade' }),
    isRequired: boolean('is_required').notNull().default(true),
  },
  (table) => [primaryKey({ columns: [table.programmeId, table.moduleId] })],
);

export const gradeScales = pgTable('grade_scales', {
  id: uuid('id').primaryKey().defaultRandom(),
  grade: varchar('grade', { length: 8 }).notNull().unique(),
  gradePoint: numeric('grade_point', { precision: 3, scale: 2 }).notNull(),
  minimumMark: numeric('minimum_mark', { precision: 5, scale: 2 }),
  maximumMark: numeric('maximum_mark', { precision: 5, scale: 2 }),
  isPass: boolean('is_pass').notNull().default(true),
  sortOrder: integer('sort_order').notNull(),
  ...timestamps,
});

export const results = pgTable(
  'results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    moduleId: uuid('module_id')
      .notNull()
      .references(() => modules.id, { onDelete: 'restrict' }),
    attempt: integer('attempt').notNull().default(1),
    grade: varchar('grade', { length: 8 })
      .notNull()
      .references(() => gradeScales.grade, { onDelete: 'restrict' }),
    marks: numeric('marks', { precision: 5, scale: 2 }),
    examinationYear: integer('examination_year').notNull(),
    status: resultStatus('status').notNull().default('DRAFT'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdBy: uuid('created_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('results_student_module_attempt_year_unique').on(
      table.studentId,
      table.moduleId,
      table.attempt,
      table.examinationYear,
    ),
    index('results_student_status_idx').on(table.studentId, table.status),
    index('results_module_year_idx').on(table.moduleId, table.examinationYear),
  ],
);

export const importJobs = pgTable('import_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  importedBy: uuid('imported_by').references(() => users.id, {
    onDelete: 'set null',
  }),
  totalRows: integer('total_rows').notNull().default(0),
  successfulRows: integer('successful_rows').notNull().default(0),
  failedRows: integer('failed_rows').notNull().default(0),
  errors: text('errors'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorId: uuid('actor_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    action: varchar('action', { length: 80 }).notNull(),
    entityType: varchar('entity_type', { length: 80 }).notNull(),
    entityId: varchar('entity_id', { length: 80 }),
    metadata: text('metadata'),
    ipAddress: varchar('ip_address', { length: 64 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('audit_actor_created_idx').on(table.actorId, table.createdAt),
  ],
);

export type User = typeof users.$inferSelect;
export type AcademicModule = typeof modules.$inferSelect;
export type Result = typeof results.$inferSelect;
