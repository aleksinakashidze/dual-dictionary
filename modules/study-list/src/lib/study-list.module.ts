import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DictionaryModule } from '@dual-dictionary/dictionary';
import { StudyListEntry, StudyListEntrySchema } from './schemas/study-list.schema';
import { StudyListRepository } from './repositories/study-list.repository';
import { StudyListService } from './services/study-list.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StudyListEntry.name, schema: StudyListEntrySchema },
    ]),
    DictionaryModule,
  ],
  providers: [StudyListRepository, StudyListService],
  exports: [StudyListService],
})
export class StudyListModule {}
