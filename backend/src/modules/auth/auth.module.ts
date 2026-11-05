import { createHash, timingSafeEqual } from 'crypto';
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
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import oracledb from 'oracledb';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthUser, UserRole } from '../../common/types/auth-user';
import { OracleService } from '../../database/oracle.service';

export function hashPassword(plain: string): string {
  return createHash('sha256').update(plain).digest('hex');
}

export function verifyPassword(plain: string, storedHash: string): boolean {
  const hashedInput = hashPassword(plain);
  if (storedHash === plain) return true;
  if (storedHash.length !== hashedInput.length) return false;
  return timingSafeEqual(Buffer.from(hashedInput), Buffer.from(storedHash));
}

export class RegisterDto {
  @IsString() @IsNotEmpty() fullName!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() phone?: string;
  @IsString() @IsNotEmpty() password!: string;
  @IsIn(['LANDLORD', 'TENANT']) role!: UserRole;
}

export class LoginDto {
  @IsEmail() email!: string;
  @IsString() @IsNotEmpty() password!: string;
}

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly db: OracleService,
    private readonly jwt: JwtService,
  ) {}

<<<<<<< Updated upstream
  /** Если таблицы LANDLORDS / TENANTS пусты, автоматически вставляет тестовых пользователей. */
  async onApplicationBootstrap(): Promise<void> {
    const existingLandlord = await this.db.query<any>(
      'SELECT id FROM landlords WHERE UPPER(email) = UPPER(:email)',
=======
  /** Если таблица USERS пуста, автоматически вставляет тестовых LANDLORD и TENANT. */
  async onApplicationBootstrap(): Promise<void> {
    const existingLandlord = await this.db.query<any>(
      'SELECT user_id FROM users WHERE UPPER(email) = UPPER(:email)',
>>>>>>> Stashed changes
      { email: 'landlord@example.com' },
    );
    if (existingLandlord.length === 0) {
      await this.db.execute(
<<<<<<< Updated upstream
        `INSERT INTO landlords (full_name, email, phone, password_hash)
         VALUES (:fullName, :email, :phone, :passwordHash)
         RETURNING id INTO :id`,
=======
        `INSERT INTO users (full_name, email, phone, password_hash, role)
         VALUES (:fullName, :email, :phone, :passwordHash, :role)
         RETURNING user_id INTO :id`,
>>>>>>> Stashed changes
        {
          fullName: 'Иван Петров (Арендодатель)',
          email: 'landlord@example.com',
          phone: '+79001112233',
          passwordHash: hashPassword('demo123'),
<<<<<<< Updated upstream
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        },
      );
      this.logger.log('Seeded test landlord: landlord@example.com (LANDLORDS)');
    }

    const existingTenant = await this.db.query<any>(
      'SELECT id FROM tenants WHERE UPPER(email) = UPPER(:email)',
=======
          role: 'LANDLORD',
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        },
      );
      this.logger.log('Seeded test user: landlord@example.com (LANDLORD)');
    }

    const existingTenant = await this.db.query<any>(
      'SELECT user_id FROM users WHERE UPPER(email) = UPPER(:email)',
>>>>>>> Stashed changes
      { email: 'tenant@example.com' },
    );
    if (existingTenant.length === 0) {
      await this.db.execute(
<<<<<<< Updated upstream
        `INSERT INTO tenants (full_name, email, phone, password_hash)
         VALUES (:fullName, :email, :phone, :passwordHash)
         RETURNING id INTO :id`,
=======
        `INSERT INTO users (full_name, email, phone, password_hash, role)
         VALUES (:fullName, :email, :phone, :passwordHash, :role)
         RETURNING user_id INTO :id`,
>>>>>>> Stashed changes
        {
          fullName: 'Анна Смирнова (Арендатор)',
          email: 'tenant@example.com',
          phone: '+79004445566',
          passwordHash: hashPassword('demo123'),
<<<<<<< Updated upstream
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        },
      );
      this.logger.log('Seeded test tenant: tenant@example.com (TENANTS)');
=======
          role: 'TENANT',
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        },
      );
      this.logger.log('Seeded test user: tenant@example.com (TENANT)');
>>>>>>> Stashed changes
    }
  }

  async register(dto: RegisterDto) {
<<<<<<< Updated upstream
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

    const table = dto.role === 'LANDLORD' ? 'landlords' : 'tenants';
    const res = await this.db.execute(
      `INSERT INTO ${table} (full_name, email, phone, password_hash)
       VALUES (:fullName, :email, :phone, :passwordHash)
       RETURNING id INTO :id`,
=======
    const existing = await this.db.query<any>(
      'SELECT user_id FROM users WHERE UPPER(email) = UPPER(:email)',
      { email: dto.email },
    );
    if (existing.length > 0) throw new ConflictException('Email already registered');

    const res = await this.db.execute(
      `INSERT INTO users (full_name, email, phone, password_hash, role)
       VALUES (:fullName, :email, :phone, :passwordHash, :role)
       RETURNING user_id INTO :id`,
>>>>>>> Stashed changes
      {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone ?? null,
        passwordHash: hashPassword(dto.password),
<<<<<<< Updated upstream
=======
        role: dto.role,
>>>>>>> Stashed changes
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
    );
    const id = (res.outBinds as any).id[0];
<<<<<<< Updated upstream
    const saved = await this.me({ id, role: dto.role });
    if (!saved) {
      throw new ConflictException(`Failed to persist user in ${table.toUpperCase()} table`);
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
      if (!verifyPassword(dto.password, u.PASSWORD_HASH)) {
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
      if (!verifyPassword(dto.password, u.PASSWORD_HASH)) {
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
    const table = user.role === 'LANDLORD' ? 'landlords' : 'tenants';
    const rows = await this.db.query<any>(
      `SELECT id, full_name, email, phone FROM ${table} WHERE id = :id`,
      { id: user.id },
    );
    const u = rows[0];
    return u ? { id: u.ID, fullName: u.FULL_NAME, email: u.EMAIL, phone: u.PHONE, role: user.role } : null;
=======
    const token = await this.jwt.signAsync({ sub: id, role: dto.role });
    return { token, user: { id, fullName: dto.fullName, email: dto.email, role: dto.role } };
  }

  async login(dto: LoginDto) {
    const rows = await this.db.query<any>(
      'SELECT user_id, full_name, email, password_hash, role FROM users WHERE UPPER(email) = UPPER(:email)',
      { email: dto.email },
    );
    const user = rows[0];
    if (!user || !verifyPassword(dto.password, user.PASSWORD_HASH)) {
      throw new UnauthorizedException('Неверный email или пароль');
    }
    const token = await this.jwt.signAsync({ sub: user.USER_ID, role: user.ROLE });
    return {
      token,
      user: { id: user.USER_ID, fullName: user.FULL_NAME, email: user.EMAIL, role: user.ROLE },
    };
  }

  async me(id: number) {
    const rows = await this.db.query<any>(
      'SELECT user_id, full_name, email, phone, role FROM users WHERE user_id = :id',
      { id },
    );
    const u = rows[0];
    return u ? { id: u.USER_ID, fullName: u.FULL_NAME, email: u.EMAIL, phone: u.PHONE, role: u.ROLE } : null;
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    return this.service.me(user);
=======
    return this.service.me(user.id);
>>>>>>> Stashed changes
  }
}

@Module({ controllers: [AuthController], providers: [AuthService] })
export class AuthModule {}
