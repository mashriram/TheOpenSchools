import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { RbacModule } from '../rbac/rbac.module';
import { RefreshToken } from './entities/refresh-token.entity';
import { RefreshTokensRepository } from './repositories/refresh-tokens.repository';
import { HashingService } from './hashing.service';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MeController } from './me.controller';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken]),
    PassportModule,
    JwtModule.register({}),
    ConfigModule,
    SchoolModule,
    PeopleModule,
    RbacModule,
  ],
  controllers: [AuthController, MeController],
  providers: [
    RefreshTokensRepository,
    HashingService,
    AuthService,
    JwtStrategy,
  ],
  exports: [HashingService, AuthService],
})
export class AuthModule {}
