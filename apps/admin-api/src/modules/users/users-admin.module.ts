import { Module } from '@nestjs/common';
import { UsersModule } from '@dual-dictionary/users';
import { UsersAdminController } from './users-admin.controller';

@Module({
  imports: [UsersModule],
  controllers: [UsersAdminController],
})
export class UsersAdminModule {}
