import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, type SQL } from 'drizzle-orm';
import { parse } from 'csv-parse/sync';
import { DatabaseService } from '../database/database.service.js';
import {
  auditLogs,
  gradeScales,
  importJobs,
  modules,
  results,
  users,
} from '../database/schema.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type {
  CreateResultDto,
  ListResultsDto,
  UpdateResultDto,
} from './dto/result.dto.js';
import { calculateGpa } from './gpa.js';

interface CsvRow {
  index_number?: string;
  module_code?: string;
  attempt?: string;
  grade?: string;
  marks?: string;
  examination_year?: string;
  status?: string;
}

@Injectable()
export class ResultsService {
  constructor(private readonly database: DatabaseService) {}

  async entryOptions() {
    const [studentOptions, moduleOptions, gradeOptions] = await Promise.all([
      this.database.db
        .select({
          id: users.id,
          label: users.fullName,
          indexNumber: users.indexNumber,
        })
        .from(users)
        .where(and(eq(users.role, 'STUDENT'), eq(users.status, 'ACTIVE')))
        .orderBy(asc(users.fullName)),
      this.database.db
        .select({ id: modules.id, code: modules.code, name: modules.name })
        .from(modules)
        .where(eq(modules.isActive, true))
        .orderBy(asc(modules.code)),
      this.database.db
        .select({ grade: gradeScales.grade })
        .from(gradeScales)
        .orderBy(asc(gradeScales.sortOrder)),
    ]);
    return {
      students: studentOptions,
      modules: moduleOptions,
      grades: gradeOptions.map((item) => item.grade),
    };
  }

  async list(query: ListResultsDto, actor: AuthenticatedUser) {
    const filters: SQL[] = [];
    if (actor.role === 'STUDENT') {
      filters.push(
        eq(results.studentId, actor.id),
        eq(results.status, 'PUBLISHED'),
      );
    } else if (query.studentId) {
      filters.push(eq(results.studentId, query.studentId));
    }
    if (query.moduleId) filters.push(eq(results.moduleId, query.moduleId));
    if (query.examinationYear)
      filters.push(eq(results.examinationYear, query.examinationYear));
    if (query.level) filters.push(eq(modules.level, query.level));
    if (query.semester) filters.push(eq(modules.semester, query.semester));

    return this.database.db
      .select({
        id: results.id,
        studentId: users.id,
        studentName: users.fullName,
        indexNumber: users.indexNumber,
        moduleId: modules.id,
        moduleCode: modules.code,
        moduleName: modules.name,
        credits: modules.credits,
        level: modules.level,
        semester: modules.semester,
        attempt: results.attempt,
        grade: results.grade,
        marks: results.marks,
        examinationYear: results.examinationYear,
        status: results.status,
        publishedAt: results.publishedAt,
      })
      .from(results)
      .innerJoin(users, eq(results.studentId, users.id))
      .innerJoin(modules, eq(results.moduleId, modules.id))
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(
        desc(results.examinationYear),
        asc(modules.level),
        asc(modules.semester),
        asc(modules.code),
      );
  }

  async summary(actor: AuthenticatedUser, requestedStudentId?: string) {
    const studentId = actor.role === 'STUDENT' ? actor.id : requestedStudentId;
    if (!studentId) throw new BadRequestException('studentId is required');
    const rows = await this.database.db
      .select({
        level: modules.level,
        semester: modules.semester,
        credits: modules.credits,
        grade: results.grade,
        gradePoint: gradeScales.gradePoint,
        isPass: gradeScales.isPass,
      })
      .from(results)
      .innerJoin(modules, eq(results.moduleId, modules.id))
      .innerJoin(gradeScales, eq(results.grade, gradeScales.grade))
      .where(
        and(eq(results.studentId, studentId), eq(results.status, 'PUBLISHED')),
      );

    const gpaItems = rows.map((row) => ({
      credits: Number(row.credits),
      gradePoint: Number(row.gradePoint),
    }));
    const completedCredits = rows
      .filter((row) => row.isPass)
      .reduce((sum, row) => sum + Number(row.credits), 0);
    const grouped = new Map<string, typeof gpaItems>();
    rows.forEach((row) => {
      const key = `${row.level}-${row.semester}`;
      const items = grouped.get(key) ?? [];
      items.push({
        credits: Number(row.credits),
        gradePoint: Number(row.gradePoint),
      });
      grouped.set(key, items);
    });
    return {
      cumulativeGpa: calculateGpa(gpaItems),
      completedCredits,
      modulesCompleted: rows.filter((row) => row.isPass).length,
      modulesAttempted: rows.length,
      semesterGpa: [...grouped.entries()].map(([period, items]) => ({
        period,
        gpa: calculateGpa(items),
      })),
    };
  }

  async create(dto: CreateResultDto, actor: AuthenticatedUser) {
    await this.assertGrade(dto.grade);
    try {
      const [created] = await this.database.db
        .insert(results)
        .values({
          studentId: dto.studentId,
          moduleId: dto.moduleId,
          attempt: dto.attempt,
          examinationYear: dto.examinationYear,
          status: dto.status,
          grade: dto.grade.trim().toUpperCase(),
          marks: dto.marks === undefined ? undefined : String(dto.marks),
          publishedAt: dto.status === 'PUBLISHED' ? new Date() : null,
          createdBy: actor.id,
        })
        .returning();
      await this.audit(actor.id, 'RESULT_CREATED', 'result', created.id, {
        status: dto.status,
      });
      return created;
    } catch (error) {
      if (isUniqueViolation(error))
        throw new ConflictException('This result already exists');
      if (isForeignKeyViolation(error))
        throw new BadRequestException(
          'The student, module, or grade is invalid',
        );
      throw error;
    }
  }

  async update(id: string, dto: UpdateResultDto, actor: AuthenticatedUser) {
    const [existing] = await this.database.db
      .select()
      .from(results)
      .where(eq(results.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('Result was not found');
    if (dto.grade) await this.assertGrade(dto.grade);
    const [updated] = await this.database.db
      .update(results)
      .set({
        status: dto.status,
        grade: dto.grade?.trim().toUpperCase(),
        marks: dto.marks === undefined ? undefined : String(dto.marks),
        publishedAt:
          dto.status === 'PUBLISHED'
            ? (existing.publishedAt ?? new Date())
            : existing.publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(results.id, id))
      .returning();
    await this.audit(actor.id, 'RESULT_UPDATED', 'result', id, {
      before: existing.status,
      after: updated.status,
    });
    return updated;
  }

  async importCsv(
    file: { originalname: string; buffer: Buffer },
    actor: AuthenticatedUser,
  ) {
    const rows = parse(file.buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    }) as CsvRow[];
    if (!rows.length)
      throw new BadRequestException('CSV file contains no data rows');
    if (rows.length > 10_000)
      throw new BadRequestException('CSV exceeds the 10,000-row limit');

    const [studentRows, moduleRows, gradeRows] = await Promise.all([
      this.database.db
        .select({ id: users.id, indexNumber: users.indexNumber })
        .from(users)
        .where(eq(users.role, 'STUDENT')),
      this.database.db
        .select({ id: modules.id, code: modules.code })
        .from(modules),
      this.database.db.select({ grade: gradeScales.grade }).from(gradeScales),
    ]);
    const studentsByIndex = new Map(
      studentRows.map((student) => [student.indexNumber, student.id]),
    );
    const modulesByCode = new Map(
      moduleRows.map((module) => [module.code, module.id]),
    );
    const validGrades = new Set(gradeRows.map((row) => row.grade));
    const errors: string[] = [];
    const validRows: Array<typeof results.$inferInsert> = [];

    rows.forEach((row, index) => {
      const rowNumber = index + 2;
      const studentId = studentsByIndex.get(
        row.index_number?.toUpperCase() ?? '',
      );
      const moduleId = modulesByCode.get(row.module_code?.toUpperCase() ?? '');
      const attempt = Number(row.attempt ?? 1);
      const examinationYear = Number(row.examination_year);
      const marks =
        row.marks === '' || row.marks === undefined
          ? undefined
          : Number(row.marks);
      const status = row.status?.toUpperCase() ?? 'DRAFT';
      if (!studentId) errors.push(`Row ${rowNumber}: unknown index_number`);
      else if (!moduleId) errors.push(`Row ${rowNumber}: unknown module_code`);
      else if (!row.grade) errors.push(`Row ${rowNumber}: grade is required`);
      else if (!validGrades.has(row.grade.toUpperCase()))
        errors.push(
          `Row ${rowNumber}: grade is not in the configured grade scale`,
        );
      else if (!Number.isInteger(attempt) || attempt < 1)
        errors.push(`Row ${rowNumber}: invalid attempt`);
      else if (!Number.isInteger(examinationYear))
        errors.push(`Row ${rowNumber}: invalid examination_year`);
      else if (
        marks !== undefined &&
        (!Number.isFinite(marks) || marks < 0 || marks > 100)
      )
        errors.push(`Row ${rowNumber}: marks must be between 0 and 100`);
      else if (!['DRAFT', 'PUBLISHED', 'WITHHELD'].includes(status))
        errors.push(`Row ${rowNumber}: invalid status`);
      else
        validRows.push({
          studentId,
          moduleId,
          attempt,
          grade: row.grade.toUpperCase(),
          marks: marks === undefined ? undefined : String(marks),
          examinationYear,
          status: status as 'DRAFT' | 'PUBLISHED' | 'WITHHELD',
          publishedAt: status === 'PUBLISHED' ? new Date() : null,
          createdBy: actor.id,
        });
    });

    await this.database.db.transaction(async (transaction) => {
      for (const row of validRows) {
        await transaction
          .insert(results)
          .values(row)
          .onConflictDoUpdate({
            target: [
              results.studentId,
              results.moduleId,
              results.attempt,
              results.examinationYear,
            ],
            set: {
              grade: row.grade,
              marks: row.marks,
              status: row.status,
              publishedAt: row.publishedAt,
              updatedAt: new Date(),
            },
          });
      }
      await transaction.insert(importJobs).values({
        fileName: file.originalname,
        importedBy: actor.id,
        totalRows: rows.length,
        successfulRows: validRows.length,
        failedRows: errors.length,
        errors: errors.length ? JSON.stringify(errors.slice(0, 100)) : null,
      });
    });
    await this.audit(actor.id, 'RESULTS_IMPORTED', 'import_job', null, {
      file: file.originalname,
      imported: validRows.length,
      failed: errors.length,
    });
    return {
      totalRows: rows.length,
      importedRows: validRows.length,
      failedRows: errors.length,
      errors: errors.slice(0, 100),
    };
  }

  private async audit(
    actorId: string,
    action: string,
    entityType: string,
    entityId: string | null,
    metadata: object,
  ) {
    await this.database.db.insert(auditLogs).values({
      actorId,
      action,
      entityType,
      entityId,
      metadata: JSON.stringify(metadata),
    });
  }

  private async assertGrade(grade: string): Promise<void> {
    const [configured] = await this.database.db
      .select({ grade: gradeScales.grade })
      .from(gradeScales)
      .where(eq(gradeScales.grade, grade.trim().toUpperCase()))
      .limit(1);
    if (!configured)
      throw new BadRequestException(
        'Grade is not in the configured grade scale',
      );
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505'
  );
}

function isForeignKeyViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23503'
  );
}
