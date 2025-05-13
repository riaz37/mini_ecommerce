import {
  Body,
  Controller,
  Post,
  UseGuards,
  Get,
  Request,
  Res,
  HttpCode,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LocalAuthGuard } from './local-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { CookieUtil } from '../common/utils/cookie.util';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private cookieUtil: CookieUtil,
  ) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.firstName,
      registerDto.lastName,
    );
  }

  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({ type: LoginDto })
  @UseGuards(LocalAuthGuard)
  @HttpCode(200)
  @Post('login')
  async login(@Request() req, @Res({ passthrough: true }) response: Response) {
    const { access_token, user } = await this.authService.login(req.user);
    const refresh_token = await this.authService.generateRefreshToken(
      req.user.id,
    );

    // Set refresh token in HTTP-only cookie
    this.cookieUtil.setCookie(response, 'refresh_token', refresh_token, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Set access token in cookie for JWT strategy
    this.cookieUtil.setCookie(response, 'access_token', access_token, {
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return { user, access_token };
  }

  @ApiOperation({
    summary: 'Get current user information and refresh token if needed',
  })
  @ApiResponse({
    status: 200,
    description: 'User information retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('me')
  async getProfile(
    @Request() req,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      // First try to get user from JWT token in Authorization header
      let user;
      let customerId;

      try {
        // Check if there's a valid JWT token in the Authorization header
        if (req.headers.authorization?.startsWith('Bearer ')) {
          const token = req.headers.authorization.split(' ')[1];
          const decoded = this.authService.verifyToken(token);
          user = await this.authService.getUserById(decoded.sub);
          customerId = user?.customerId;
        }
      } catch (error) {
        console.log('No valid access token, trying refresh token');
      }

      // If no user from access token, try refresh token
      if (!user && req.cookies?.refresh_token) {
        try {
          console.log('Attempting to use refresh token');
          const decoded = this.authService.verifyRefreshToken(
            req.cookies.refresh_token,
          );
          user = await this.authService.getUserById(decoded.sub);

          if (user) {
            console.log('User found via refresh token, generating new tokens');
            // Generate new tokens
            const { access_token } = await this.authService.login(user);
            const refresh_token = await this.authService.generateRefreshToken(
              user.id,
            );

            // Set cookies
            this.cookieUtil.setCookie(
              response,
              'refresh_token',
              refresh_token,
              {
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
              },
            );

            this.cookieUtil.setCookie(response, 'access_token', access_token, {
              maxAge: 24 * 60 * 60 * 1000, // 1 day
            });

            customerId = user.customerId;
          }
        } catch (error) {
          console.error('Error refreshing token:', error);
        }
      }

      if (!user) {
        throw new UnauthorizedException('Not authenticated');
      }

      // Get customer info if needed
      if (!customerId && user.email) {
        const customer = await this.authService.getCustomerByEmail(user.email);
        customerId = customer?.id;
      }

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        customerId: customerId,
      };
    } catch (error) {
      console.error('Error in getProfile:', error);
      throw new UnauthorizedException('Not authenticated');
    }
  }

  @ApiOperation({ summary: 'Logout current user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @HttpCode(200)
  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    this.cookieUtil.clearCookie(response, 'refresh_token');
    this.cookieUtil.clearCookie(response, 'access_token');
    return { success: true };
  }
}
