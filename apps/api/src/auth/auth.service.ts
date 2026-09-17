import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { eq, or } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service.js';
import { users } from '../database/schema.js';
import type { AuthenticatedUser, JwtPayload } from './auth.types.js';
import type { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly database: DatabaseService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const identifier = dto.identifier.trim();
    const [record] = await this.database.db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, identifier.toLowerCase()),
          eq(users.indexNumber, identifier.toUpperCase()),
          eq(users.staffNumber, identifier.toUpperCase()),
        ),
      )
      .limit(1);

    if (
      !record ||
      record.status !== 'ACTIVE' ||
      !(await argon2.verify(record.passwordHash, dto.password))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokens(record.id, record.role);
    await this.database.db
      .update(users)
      .set({
        refreshTokenHash: await argon2.hash(tokens.refreshToken),
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, record.id));

    return {
      accessToken: tokens.accessToken,
      user: this.toAuthenticatedUser(record),
      refreshToken: tokens.refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }
    if (payload.type !== 'refresh')
      throw new UnauthorizedException('Invalid token type');

    const [record] = await this.database.db
      .select()
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);
    if (
      !record?.refreshTokenHash ||
      record.status !== 'ACTIVE' ||
      !(await argon2.verify(record.refreshTokenHash, refreshToken))
    ) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    const tokens = await this.issueTokens(record.id, record.role);
    await this.database.db
      .update(users)
      .set({
        refreshTokenHash: await argon2.hash(tokens.refreshToken),
        updatedAt: new Date(),
      })
      .where(eq(users.id, record.id));
    return {
      accessToken: tokens.accessToken,
      user: this.toAuthenticatedUser(record),
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(userId: string): Promise<void> {
    await this.database.db
      .update(users)
      .set({ refreshTokenHash: null, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const [record] = await this.database.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (
      !record ||
      !(await argon2.verify(record.passwordHash, currentPassword))
    ) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    await this.database.db
      .update(users)
      .set({
        passwordHash: await argon2.hash(newPassword),
        refreshTokenHash: null,
        passwordChangedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  private async issueTokens(userId: string, role: AuthenticatedUser['role']) {
    const accessPayload: JwtPayload = { sub: userId, role, type: 'access' };
    const refreshPayload: JwtPayload = { sub: userId, role, type: 'refresh' };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(accessPayload, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: 15 * 60,
      }),
      this.jwt.signAsync(refreshPayload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: 7 * 24 * 60 * 60,
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private toAuthenticatedUser(
    record: typeof users.$inferSelect,
  ): AuthenticatedUser {
    return {
      id: record.id,
      email: record.email,
      fullName: record.fullName,
      role: record.role,
      indexNumber: record.indexNumber,
    };
  }
}
