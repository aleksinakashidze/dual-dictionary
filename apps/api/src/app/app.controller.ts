import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '@dual-dictionary/common';

@ApiTags('app')
@Controller()
export class AppController {
  @Get()
  @Public()
  ping(): { status: string; app: string } {
    return { status: 'ok', app: 'dual-dictionary-api' };
  }
}
