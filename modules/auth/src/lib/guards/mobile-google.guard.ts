import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class MobileGoogleAuthGuard extends AuthGuard('google') {
  override getAuthenticateOptions() {
    return { state: 'mobile' };
  }
}
