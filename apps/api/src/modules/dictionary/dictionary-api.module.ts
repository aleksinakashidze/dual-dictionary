import { Module } from '@nestjs/common';
import { DictionaryModule } from '@dual-dictionary/dictionary';
import { WordController } from '@dual-dictionary/dictionary';

@Module({
  imports: [DictionaryModule],
  controllers: [WordController],
})
export class DictionaryApiModule {}
