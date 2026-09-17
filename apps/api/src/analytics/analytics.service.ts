import { Injectable } from '@nestjs/common';
import { asc, count, eq } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service.js';
import { gradeScales, modules, results, users } from '../database/schema.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { ResultsService } from '../results/results.service.js';
import { calculateGpa } from '../results/gpa.js';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly resultsService: ResultsService,
  ) {}

  async dashboard(user: AuthenticatedUser) {
    if (user.role === 'STUDENT') {
      const summary = await this.resultsService.summary(user);
      return { kind: 'student', ...summary };
    }

    const [[studentCount], [moduleCount], [resultCount], gradeRows] =
      await Promise.all([
        this.database.db
          .select({ value: count() })
          .from(users)
          .where(eq(users.role, 'STUDENT')),
        this.database.db
          .select({ value: count() })
          .from(modules)
          .where(eq(modules.isActive, true)),
        this.database.db.select({ value: count() }).from(results),
        this.database.db
          .select({
            year: results.examinationYear,
            credits: modules.credits,
            gradePoint: gradeScales.gradePoint,
          })
          .from(results)
          .innerJoin(modules, eq(results.moduleId, modules.id))
          .innerJoin(gradeScales, eq(results.grade, gradeScales.grade))
          .where(eq(results.status, 'PUBLISHED'))
          .orderBy(asc(results.examinationYear)),
      ]);
    const byYear = new Map<
      number,
      Array<{ credits: number; gradePoint: number }>
    >();
    gradeRows.forEach((row) => {
      const values = byYear.get(row.year) ?? [];
      values.push({
        credits: Number(row.credits),
        gradePoint: Number(row.gradePoint),
      });
      byYear.set(row.year, values);
    });
    return {
      kind: 'staff',
      students: studentCount.value,
      modules: moduleCount.value,
      results: resultCount.value,
      publishedResults: gradeRows.length,
      yearlyGpa: [...byYear.entries()].map(([year, values]) => ({
        year,
        gpa: calculateGpa(values),
      })),
    };
  }
}
