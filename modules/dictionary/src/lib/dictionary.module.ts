import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WordSchema } from './schemas/word.schema';
import { WordKaEnRepository } from './repositories/word-ka-en.repository';
import { WordEnKaRepository } from './repositories/word-en-ka.repository';
import { WordService } from './services/word.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'WordKaEn', schema: WordSchema, collection: 'words_ka_en' },
      { name: 'WordEnKa', schema: WordSchema, collection: 'words_en_ka' },
    ]),
  ],
  providers: [WordKaEnRepository, WordEnKaRepository, WordService],
  exports: [WordService],
})
export class DictionaryModule {}
