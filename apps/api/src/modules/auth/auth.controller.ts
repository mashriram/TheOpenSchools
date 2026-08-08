import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { SignupService } from './signup.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { SwitchRoleDto } from './dto/switch-role.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import type { AccessTokenPayload } from './access-token-payload';

const REFRESH_TOKEN_COOKIE = 'refreshToken';
// path must be '/' - this cookie is read by the Next.js BFF's proxy.ts on
// every protected route (e.g. /people), not just the /auth/* endpoints here.
// A browser only re-sends a cookie for requests whose path matches the Path
// it was set with, evaluated against the browser-facing Next.js app's own
// route space - which has no literal /auth routes - so scoping this to
// '/auth' meant the cookie was never sent back at all.
const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict' as const,
  path: '/',
};

// @types/cookie-parser types Request.cookies as `any`; this keeps that `any`
// from propagating into everything that reads the refresh token cookie.
function readRefreshTokenCookie(request: Request): string | undefined {
  const cookies = request.cookies as
    Record<string, string | undefined> | undefined;
  return cookies?.[REFRESH_TOKEN_COOKIE];
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly signupService: SignupService,
  ) {}

  @Post('signup')
  async signup(
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.signupService.signup(dto);
    response.cookie(
      REFRESH_TOKEN_COOKIE,
      result.refreshToken,
      REFRESH_TOKEN_COOKIE_OPTIONS,
    );
    return {
      accessToken: result.accessToken,
      person: result.person,
      activeRoleId: result.activeRoleId,
    };
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(
      dto.schoolSlug,
      dto.email,
      dto.password,
    );
    response.cookie(
      REFRESH_TOKEN_COOKIE,
      result.refreshToken,
      REFRESH_TOKEN_COOKIE_OPTIONS,
    );
    return {
      accessToken: result.accessToken,
      person: result.person,
      activeRoleId: result.activeRoleId,
    };
  }

  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const rawRefreshToken = readRefreshTokenCookie(request);
    if (!rawRefreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const result = await this.authService.refresh(rawRefreshToken);
    response.cookie(
      REFRESH_TOKEN_COOKIE,
      result.refreshToken,
      REFRESH_TOKEN_COOKIE_OPTIONS,
    );
    return {
      accessToken: result.accessToken,
      person: result.person,
      activeRoleId: result.activeRoleId,
    };
  }

  @Post('logout')
  @HttpCode(204)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const rawRefreshToken = readRefreshTokenCookie(request);
    if (rawRefreshToken) {
      await this.authService.logout(rawRefreshToken);
    }
    response.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
  }

  @UseGuards(JwtAuthGuard)
  @Post('switch-role')
  async switchRole(
    @CurrentUser() currentUser: AccessTokenPayload,
    @Body() dto: SwitchRoleDto,
  ) {
    const accessToken = await this.authService.switchRole(
      currentUser,
      dto.roleId,
    );
    return { accessToken };
  }
}
