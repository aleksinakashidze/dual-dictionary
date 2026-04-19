import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppConfigService } from '@dual-dictionary/config';
import { CommonModule } from '@dual-dictionary/common';
import { UsersModule } from '@dual-dictionary/users';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        secret: config.jwtSecret,
        signOptions: { expiresIn: config.jwtExpiresIn as never },
      }),
    }),
    CommonModule,
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, JwtRefreshStrategy, RefreshTokenGuard, AuthService],
  exports: [JwtModule, PassportModule, RefreshTokenGuard, AuthService],
})
export class AuthModule {}
