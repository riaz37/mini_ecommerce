import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Get the request object
    const request = context.switchToHttp().getRequest();

    // Make authentication optional for cart endpoints
    if (request.url.includes('/cart')) {
      try {
        return super.canActivate(context);
      } catch (error) {
        // Allow the request to proceed even if authentication fails
        return true;
      }
    }

    // For non-cart endpoints, use normal JWT authentication
    return super.canActivate(context);
  }
}
