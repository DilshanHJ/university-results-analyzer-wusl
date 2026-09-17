import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { and, asc, count, eq, ilike, ne, or, type SQL } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service.js';
import { programmes, users } from '../database/schema.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import type { ListUsersDto } from './dto/list-users.dto.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';

const userProjection = {
  id: users.id,
  email: users.email,
  fullName: users.fullName,
  indexNumber: users.indexNumber,
  staffNumber: users.staffNumber,
  role: users.role,
  status: users.status,
  batchYear: users.batchYear,
  programmeId: users.programmeId,
  programme: programmes.name,
  lastLoginAt: users.lastLoginAt,
  createdAt: users.createdAt,
};

@Injectable()
export class UsersService {
  constructor(private readonly database: DatabaseService) {}

  async list(query: ListUsersDto) {
    const filters: SQL[] = [];
    if (query.role) filters.push(eq(users.role, query.role));
    if (query.search?.trim()) {
      const term = `%${query.search.trim()}%`;
      const searchCondition = or(
        ilike(users.fullName, term),
        ilike(users.email, term),
        ilike(users.indexNumber, term),
        ilike(users.staffNumber, term),
      );
      if (searchCondition) filters.push(searchCondition);
    }
    const where = filters.length ? and(...filters) : undefined;
    const [items, [{ total }]] = await Promise.all([
      this.database.db
        .select(userProjection)
        .from(users)
        .leftJoin(programmes, eq(users.programmeId, programmes.id))
        .where(where)
        .orderBy(asc(users.fullName))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      this.database.db.select({ total: count() }).from(users).where(where),
    ]);
    return { items, page: query.page, pageSize: query.pageSize, total };
  }

  async findById(id: string) {
    const [user] = await this.database.db
      .select(userProjection)
      .from(users)
      .leftJoin(programmes, eq(users.programmeId, programmes.id))
      .where(eq(users.id, id))
      .limit(1);
    if (!user) throw new NotFoundException('User was not found');
    return user;
  }

  async create(dto: CreateUserDto) {
    await this.ensureUnique(dto.email, dto.indexNumber, dto.staffNumber);
    const [created] = await this.database.db
      .insert(users)
      .values({
        email: dto.email.trim().toLowerCase(),
        fullName: dto.fullName.trim(),
        passwordHash: await argon2.hash(dto.password),
        role: dto.role,
        indexNumber: dto.indexNumber?.trim().toUpperCase(),
        staffNumber: dto.staffNumber?.trim().toUpperCase(),
        batchYear: dto.batchYear,
        programmeId: dto.programmeId,
      })
      .returning({ id: users.id });
    return this.findById(created.id);
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findById(id);
    if (dto.email || dto.indexNumber || dto.staffNumber) {
      await this.ensureUnique(dto.email, dto.indexNumber, dto.staffNumber, id);
    }
    await this.database.db
      .update(users)
      .set({
        role: dto.role,
        status: dto.status,
        batchYear: dto.batchYear,
        programmeId: dto.programmeId,
        email: dto.email?.trim().toLowerCase(),
        fullName: dto.fullName?.trim(),
        indexNumber: dto.indexNumber?.trim().toUpperCase(),
        staffNumber: dto.staffNumber?.trim().toUpperCase(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
    return this.findById(id);
  }

  private async ensureUnique(
    email?: string,
    indexNumber?: string,
    staffNumber?: string,
    excludeId?: string,
  ) {
    const checks: SQL[] = [];
    if (email) checks.push(eq(users.email, email.trim().toLowerCase()));
    if (indexNumber)
      checks.push(eq(users.indexNumber, indexNumber.trim().toUpperCase()));
    if (staffNumber)
      checks.push(eq(users.staffNumber, staffNumber.trim().toUpperCase()));
    if (!checks.length) return;
    const match = or(...checks);
    const where =
      excludeId && match ? and(match, ne(users.id, excludeId)) : match;
    const [existing] = await this.database.db
      .select({ id: users.id })
      .from(users)
      .where(where)
      .limit(1);
    if (existing)
      throw new ConflictException(
        'Email, index number, or staff number is already in use',
      );
  }
}
