import { Module } from '@nestjs/common';
import { StudyListModule } from '@dual-dictionary/study-list';
import { StudyListController } from '@dual-dictionary/study-list';

@Module({
  imports: [StudyListModule],
  controllers: [StudyListController],
})
export class StudyListApiModule {}
