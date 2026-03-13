import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '../../database/entities/user.entity';
import { CleanerProfile } from '../../database/entities/cleaner-profile.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshStrategy } from './strategies/refresh.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    TypeOrmModule.forFeature([User, CleanerProfile]),
    ThrottlerModule.forRoot([
      {
        ttl: 900000, // 15 minutes in milliseconds
        limit: 5,
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RefreshStrategy],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
