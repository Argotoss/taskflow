import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AppService } from './app.service';

@ApiTags('health')
@Controller({ path: 'health' })
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  healthCheck(): { status: string } {
    return this.appService.healthCheck();
  }
}
