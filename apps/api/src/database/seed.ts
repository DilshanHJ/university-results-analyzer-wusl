import 'dotenv/config';
import * as argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
  departments,
  gradeScales,
  modules,
  programmes,
  results,
  users,
} from './schema.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required');
const client = postgres(databaseUrl, { max: 1 });
const db = drizzle(client);

async function seed(): Promise<void> {
  await db
    .insert(departments)
    .values([
      { code: 'CMIS', name: 'Computing and Information Systems' },
      { code: 'MATH', name: 'Mathematical Sciences' },
      { code: 'ELTN', name: 'Electronics' },
      { code: 'IMGT', name: 'Industrial Management' },
    ])
    .onConflictDoNothing();
  const [programme] = await db
    .insert(programmes)
    .values({
      code: 'BSC-CS',
      name: 'B.Sc. Special in Computer Science',
      description: 'Four-year honours programme',
    })
    .onConflictDoUpdate({
      target: programmes.code,
      set: { name: 'B.Sc. Special in Computer Science' },
    })
    .returning();

  await db
    .insert(gradeScales)
    .values([
      {
        grade: 'A+',
        gradePoint: '4.00',
        minimumMark: '85',
        maximumMark: '100',
        isPass: true,
        sortOrder: 1,
      },
      {
        grade: 'A',
        gradePoint: '4.00',
        minimumMark: '70',
        maximumMark: '84.99',
        isPass: true,
        sortOrder: 2,
      },
      {
        grade: 'A-',
        gradePoint: '3.70',
        minimumMark: '65',
        maximumMark: '69.99',
        isPass: true,
        sortOrder: 3,
      },
      {
        grade: 'B+',
        gradePoint: '3.30',
        minimumMark: '60',
        maximumMark: '64.99',
        isPass: true,
        sortOrder: 4,
      },
      {
        grade: 'B',
        gradePoint: '3.00',
        minimumMark: '55',
        maximumMark: '59.99',
        isPass: true,
        sortOrder: 5,
      },
      {
        grade: 'B-',
        gradePoint: '2.70',
        minimumMark: '50',
        maximumMark: '54.99',
        isPass: true,
        sortOrder: 6,
      },
      {
        grade: 'C+',
        gradePoint: '2.30',
        minimumMark: '45',
        maximumMark: '49.99',
        isPass: true,
        sortOrder: 7,
      },
      {
        grade: 'C',
        gradePoint: '2.00',
        minimumMark: '40',
        maximumMark: '44.99',
        isPass: true,
        sortOrder: 8,
      },
      {
        grade: 'C-',
        gradePoint: '1.70',
        minimumMark: '35',
        maximumMark: '39.99',
        isPass: false,
        sortOrder: 9,
      },
      {
        grade: 'D',
        gradePoint: '1.00',
        minimumMark: '30',
        maximumMark: '34.99',
        isPass: false,
        sortOrder: 10,
      },
      {
        grade: 'E',
        gradePoint: '0.00',
        minimumMark: '0',
        maximumMark: '29.99',
        isPass: false,
        sortOrder: 11,
      },
    ])
    .onConflictDoNothing();

  const [cmis] = await db
    .select()
    .from(departments)
    .where(eq(departments.code, 'CMIS'))
    .limit(1);
  const createdModules = await db
    .insert(modules)
    .values([
      {
        code: 'CMIS1113',
        name: 'Introduction to Programming',
        credits: '3.0',
        level: 1,
        semester: 1,
        departmentId: cmis.id,
      },
      {
        code: 'CMIS1223',
        name: 'Database Management Systems',
        credits: '3.0',
        level: 1,
        semester: 2,
        departmentId: cmis.id,
      },
      {
        code: 'CMIS2213',
        name: 'Data Structures and Algorithms',
        credits: '3.0',
        level: 2,
        semester: 1,
        departmentId: cmis.id,
      },
      {
        code: 'CMIS3223',
        name: 'Software Engineering',
        credits: '3.0',
        level: 3,
        semester: 2,
        departmentId: cmis.id,
      },
    ])
    .onConflictDoNothing()
    .returning();

  const passwordHash = await argon2.hash(
    process.env.SEED_PASSWORD ?? 'ChangeMeNow!2026',
  );
  await db
    .insert(users)
    .values({
      email: 'admin@wusl.ac.lk',
      fullName: 'System Administrator',
      staffNumber: 'ADMIN-001',
      passwordHash,
      role: 'ADMIN',
    })
    .onConflictDoNothing();
  const [student] = await db
    .insert(users)
    .values({
      email: 'student@wusl.ac.lk',
      fullName: 'Demo Student',
      indexNumber: 'UWU/CST/21/001',
      passwordHash,
      role: 'STUDENT',
      batchYear: 2021,
      programmeId: programme.id,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { fullName: 'Demo Student' },
    })
    .returning();

  const availableModules = createdModules.length
    ? createdModules
    : await db.select().from(modules);
  const demoGrades = ['A', 'A-', 'B+', 'A'];
  for (const [index, academicModule] of availableModules.entries()) {
    await db
      .insert(results)
      .values({
        studentId: student.id,
        moduleId: academicModule.id,
        attempt: 1,
        grade: demoGrades[index % demoGrades.length],
        marks: String(72 - index * 3),
        examinationYear: 2022 + Math.floor(index / 2),
        status: 'PUBLISHED',
        publishedAt: new Date(),
      })
      .onConflictDoNothing();
  }
}

try {
  await seed();
  console.info('Database seeded successfully');
} finally {
  await client.end();
}
