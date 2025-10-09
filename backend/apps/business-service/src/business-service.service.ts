import { Injectable } from '@nestjs/common';

@Injectable()
export class BusinessServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
