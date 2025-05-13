import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CookieUtil {
  private readonly logger = new Logger(CookieUtil.name);
  
  constructor(private configService: ConfigService) {}

  setCookie(
    response: Response,
    name: string,
    value: string,
    options: {
      maxAge?: number;
      httpOnly?: boolean;
      path?: string;
    } = {},
  ): void {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const domain = this.configService.get('COOKIE_DOMAIN');
    
    this.logger.debug(`Setting cookie ${name} in ${isProduction ? 'production' : 'development'} environment`);
    
    if (domain) {
      this.logger.debug(`Using custom cookie domain: ${domain}`);
    }

    const cookieOptions = {
      httpOnly: options.httpOnly !== undefined ? options.httpOnly : true,
      secure: isProduction,
      maxAge: options.maxAge || 30 * 24 * 60 * 60 * 1000, // Default 30 days
      path: options.path || '/',
      sameSite: isProduction ? 'none' : 'lax',
      ...(domain && { domain }),
    };

    response.cookie(name, value, cookieOptions as any);
  }

  clearCookie(response: Response, name: string): void {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const domain = this.configService.get('COOKIE_DOMAIN');
    
    this.logger.debug(`Clearing cookie ${name}`);
    
    const options = {
      httpOnly: true,
      secure: isProduction,
      path: '/',
      sameSite: isProduction ? 'none' : 'lax',
      ...(domain && { domain }),
    };
    
    response.clearCookie(name, options as any);
  }
}