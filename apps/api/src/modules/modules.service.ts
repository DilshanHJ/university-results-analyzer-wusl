import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service.js';
import { departments, modules, programmes } from '../database/schema.js';
import type {
  CreateModuleDto,
  ListModulesDto,
  UpdateModuleDto,
} from './dto/module.dto.js';

@Injectable()
export class ModulesService {
  constructor(private readonly database: DatabaseService) {}

  async list(query: ListModulesDto) {
    const filters: SQL[] = [];
    if (query.level) filters.push(eq(modules.level, query.level));
    if (query.semester) filters.push(eq(modules.semester, query.semester));
    if (query.search?.trim()) {
      const search = or(
        ilike(modules.code, `%${query.search.trim()}%`),
        ilike(modules.name, `%${query.search.trim()}%`),
      );
      if (search) filters.push(search);
    }
    return this.database.db
      .select({
        id: modules.id,
        code: modules.code,
        name: modules.name,
        credits: modules.credits,
        level: modules.level,
        semester: modules.semester,
        category: modules.category,
        departmentId: modules.departmentId,
        department: departments.name,
        isActive: modules.isActive,
      })
      .from(modules)
      .leftJoin(departments, eq(modules.departmentId, departments.id))
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(asc(modules.level), asc(modules.semester), asc(modules.code));
  }

  async catalogs() {
    const [departmentItems, programmeItems] = await Promise.all([
      this.database.db
        .select()
        .from(departments)
        .orderBy(asc(departments.name)),
      this.database.db
        .select()
        .from(programmes)
        .where(eq(programmes.isActive, true))
        .orderBy(asc(programmes.name)),
    ]);
    return { departments: departmentItems, programmes: programmeItems };
  }

  async create(dto: CreateModuleDto) {
    const code = dto.code.trim().toUpperCase();
    const [existing] = await this.database.db
      .select({ id: modules.id })
      .from(modules)
      .where(eq(modules.code, code))
      .limit(1);
    if (existing)
      throw new ConflictException('A module with this code already exists');
    const [created] = await this.database.db
      .insert(modules)
      .values({
        code,
        name: dto.name.trim(),
        credits: String(dto.credits),
        level: dto.level,
        semester: dto.semester,
        category: dto.category,
        departmentId: dto.departmentId,
      })
      .returning();
    return created;
  }

  async update(id: string, dto: UpdateModuleDto) {
    const [existing] = await this.database.db
      .select()
      .from(modules)
      .where(eq(modules.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('Module was not found');
    const [updated] = await this.database.db
      .update(modules)
      .set({
        code: dto.code?.trim().toUpperCase(),
        name: dto.name?.trim(),
        credits: dto.credits === undefined ? undefined : String(dto.credits),
        level: dto.level,
        semester: dto.semester,
        category: dto.category,
        departmentId: dto.departmentId,
        isActive: dto.isActive,
        updatedAt: new Date(),
      })
      .where(eq(modules.id, id))
      .returning();
    return updated;
  }
}
