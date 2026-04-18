import { Module } from '@nestjs/common';
import { DictionaryModule } from '@dual-dictionary/dictionary';
import { DictionaryAdminController } from './dictionary-admin.controller';

@Module({
  imports: [DictionaryModule],
  controllers: [DictionaryAdminController],
})
export class DictionaryAdminModule {}
