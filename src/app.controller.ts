import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check', description: 'Returns application health status' })
  @ApiResponse({ status: 200, description: 'Application is healthy', type: String })
  getHello(): string {
    return this.appService.getHello();
  }
}
