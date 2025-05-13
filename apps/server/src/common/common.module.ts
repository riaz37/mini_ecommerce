import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CookieUtil } from './utils/cookie.util';

@Module({
  imports: [ConfigModule],
  providers: [CookieUtil],
  exports: [CookieUtil],
})
export class CommonModule {}