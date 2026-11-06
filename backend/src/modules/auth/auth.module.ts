import { createHash, timingSafeEqual } from 'crypto';
import * as bcrypt from 'bcryptjs';
import {
  Body,
  ConflictException,
  Controller,
  Get,
  Injectable,
  Logger,
  Module,
  OnApplicationBootstrap,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import oracledb from 'oracledb';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthUser, UserRole } from '../../common/types/auth-user';
import { OracleService } from '../../database/oracle.service';

const BCRYPT_SALT_ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_SALT_ROUNDS);
}

export async function verifyPassword(plain: string, storedHash: string): Promise<boolean> {
  if (!storedHash || !plain) return false;
  // Современный bcrypt-хэш ($2a$, $2b$, $2y$)
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
    return bcrypt.compare(plain, storedHash);
  }
  // Обратная совместимость для существующих записей с SHA-256 (с защитой от timing-атак)
  const sha256Hex = createHash('sha256').update(plain).digest('hex');
  if (storedHash.length !== sha256Hex.length) return false;
  return timingSafeEqual(Buffer.from(sha256Hex), Buffer.from(storedHash));
}

export class RegisterDto {
  @IsString() @IsNotEmpty() @MaxLength(150) fullName!: string;
  @IsEmail() @MaxLength(150) email!: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsString() @IsNotEmpty() @MinLength(6) @MaxLength(128) password!: string;
  @IsIn(['LANDLORD', 'TENANT']) role!: UserRole;
}

export class LoginDto {
  @IsEmail() @MaxLength(150) email!: string;
  @IsString() @IsNotEmpty() @MaxLength(128) password!: string;
}

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly db: OracleService,
    private readonly jwt: JwtService,
  ) {}

  /** Если таблицы LANDLORDS / TENANTS пусты, автоматически вставляет демонстрационных пользователей. */
  async onApplicationBootstrap(): Promise<void> {
    const demoPassword = process.env.DEMO_USER_PASSWORD ?? 'demo123';
    const existingLandlord = await this.db.query<any>(
      'SELECT id FROM landlords WHERE UPPER(email) = UPPER(:email)',
      { email: 'landlord@example.com' },
    );
    if (existingLandlord.length === 0) {
      await this.db.execute(
        `INSERT INTO landlords (full_name, email, phone, password_hash)
         VALUES (:fullName, :email, :phone, :passwordHash)
         RETURNING id INTO :id`,
        {
          fullName: 'Иван Петров (Арендодатель)',
          email: 'landlord@example.com',
          phone: '+79001112233',
          passwordHash: await hashPassword(demoPassword),
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        },
      );
      this.logger.log('Seeded test landlord: landlord@example.com (LANDLORDS)');
    }

    const existingTenant = await this.db.query<any>(
      'SELECT id FROM tenants WHERE UPPER(email) = UPPER(:email)',
      { email: 'tenant@example.com' },
    );
    if (existingTenant.length === 0) {
      await this.db.execute(
        `INSERT INTO tenants (full_name, email, phone, password_hash)
         VALUES (:fullName, :email, :phone, :passwordHash)
         RETURNING id INTO :id`,
        {
          fullName: 'Анна Смирнова (Арендатор)',
          email: 'tenant@example.com',
          phone: '+79004445566',
          passwordHash: await hashPassword(demoPassword),
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        },
      );
      this.logger.log('Seeded test tenant: tenant@example.com (TENANTS)');
    }
  }

  async register(dto: RegisterDto) {
    const existingLandlord = await this.db.query<any>(
      'SELECT id FROM landlords WHERE UPPER(email) = UPPER(:email)',
      { email: dto.email },
    );
    const existingTenant = await this.db.query<any>(
      'SELECT id FROM tenants WHERE UPPER(email) = UPPER(:email)',
      { email: dto.email },
    );
    if (existingLandlord.length > 0 || existingTenant.length > 0) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await hashPassword(dto.password);
    const insertSql =
      dto.role === 'LANDLORD'
        ? `INSERT INTO landlords (full_name, email, phone, password_hash)
           VALUES (:fullName, :email, :phone, :passwordHash)
           RETURNING id INTO :id`
        : `INSERT INTO tenants (full_name, email, phone, password_hash)
           VALUES (:fullName, :email, :phone, :passwordHash)
           RETURNING id INTO :id`;

    const res = await this.db.execute(insertSql, {
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone ?? null,
      passwordHash,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    });
    const id = (res.outBinds as any).id[0];
    const saved = await this.me({ id, role: dto.role });
    if (!saved) {
      throw new ConflictException('Failed to persist user in database');
    }
    const token = await this.jwt.signAsync({ sub: saved.id, role: saved.role });
    return { token, user: saved };
  }

  async login(dto: LoginDto) {
    const landlordRows = await this.db.query<any>(
      'SELECT id, full_name, email, phone, password_hash FROM landlords WHERE UPPER(email) = UPPER(:email)',
      { email: dto.email },
    );
    if (landlordRows[0]) {
      const u = landlordRows[0];
      const isValid = await verifyPassword(dto.password, u.PASSWORD_HASH);
      if (!isValid) {
        throw new UnauthorizedException('Неверный email или пароль');
      }
      const token = await this.jwt.signAsync({ sub: u.ID, role: 'LANDLORD' });
      return {
        token,
        user: { id: u.ID, fullName: u.FULL_NAME, email: u.EMAIL, phone: u.PHONE, role: 'LANDLORD' as UserRole },
      };
    }

    const tenantRows = await this.db.query<any>(
      'SELECT id, full_name, email, phone, password_hash FROM tenants WHERE UPPER(email) = UPPER(:email)',
      { email: dto.email },
    );
    if (tenantRows[0]) {
      const u = tenantRows[0];
      const isValid = await verifyPassword(dto.password, u.PASSWORD_HASH);
      if (!isValid) {
        throw new UnauthorizedException('Неверный email или пароль');
      }
      const token = await this.jwt.signAsync({ sub: u.ID, role: 'TENANT' });
      return {
        token,
        user: { id: u.ID, fullName: u.FULL_NAME, email: u.EMAIL, phone: u.PHONE, role: 'TENANT' as UserRole },
      };
    }

    throw new UnauthorizedException('Неверный email или пароль');
  }

  async me(user: AuthUser) {
    const selectSql =
      user.role === 'LANDLORD'
        ? 'SELECT id, full_name, email, phone FROM landlords WHERE id = :id'
        : 'SELECT id, full_name, email, phone FROM tenants WHERE id = :id';
    const rows = await this.db.query<any>(selectSql, { id: user.id });
    const u = rows[0];
    return u ? { id: u.ID, fullName: u.FULL_NAME, email: u.EMAIL, phone: u.PHONE, role: user.role } : null;
  }
}

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.service.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.service.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return this.service.me(user);
  }
}

@Module({ controllers: [AuthController], providers: [AuthService] })
export class AuthModule {}
