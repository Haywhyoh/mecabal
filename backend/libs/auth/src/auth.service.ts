import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  // This is a placeholder service
  // The actual implementation should be in the auth-service app
  constructor() {}

  validateUser(_login: string, _password: string): Promise<any> {
    // This is a placeholder method
    // The actual implementation should be in the auth-service app
    throw new Error(
      'validateUser method should be implemented in the auth-service app',
    );
  }
}
