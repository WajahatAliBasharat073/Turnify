import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import Redis from 'ioredis';
import { User, UserRole } from '../../database/entities/user.entity';
import { CleanerProfile } from '../../database/entities/cleaner-profile.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private redis: Redis;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private dataSource: DataSource,
  ) {
    this.redis = new Redis(this.configService.get<string>('REDIS_URL'));
  }

  /**
   * Register a new user and create a cleaner profile if applicable.
   */
  async register(registerDto: RegisterDto) {
    const { email, password, first_name, last_name, role, phone } = registerDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const passwordHash = await bcrypt.hash(password, 12);
      
      const user = this.userRepository.create({
        email,
        password_hash: passwordHash,
        first_name,
        last_name,
        role,
        phone,
      });

      const savedUser = await queryRunner.manager.save(user);

      if (role === UserRole.CLEANER) {
        const cleanerProfile = queryRunner.manager.create(CleanerProfile, {
          id: savedUser.id,
          user_id: savedUser.id,
        });
        await queryRunner.manager.save(cleanerProfile);
      }

      await queryRunner.commitTransaction();

      const tokens = await this.getTokens(savedUser);
      await this.updateRefreshToken(savedUser.id, tokens.refresh_token);

      delete savedUser.password_hash;
      return { ...tokens, user: savedUser };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error.code === '23505') {
        throw new ConflictException('User already exists');
      }
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Authenticate user and return tokens.
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password_hash', 'role', 'first_name', 'last_name', 'is_active'],
    });

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('User account is disabled');
    }

    const tokens = await this.getTokens(user);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    delete user.password_hash;
    return { ...tokens, user };
  }

  /**
   * Refresh the access token using a valid refresh token.
   */
  async refresh(userId: string, refreshToken: string) {
    const storedHash = await this.redis.get(`refresh:${userId}`);
    if (!storedHash || !(await bcrypt.compare(refreshToken, storedHash))) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const tokens = await this.getTokens(user);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }

  /**
   * Log out by removing the refresh token from Redis.
   */
  async logout(userId: string) {
    await this.redis.del(`refresh:${userId}`);
  }

  /**
   * Generate access and refresh tokens.
   */
  private async getTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRY'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRY'),
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  /**
   * Hash and store refresh token in Redis.
   */
  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    const expiry = 7 * 24 * 60 * 60; // 7 days in seconds
    await this.redis.set(`refresh:${userId}`, hash, 'EX', expiry);
  }
}
