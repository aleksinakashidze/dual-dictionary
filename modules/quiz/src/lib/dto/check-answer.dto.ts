import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CheckAnswerDto {
  @ApiProperty({ description: 'StudyListEntry _id returned by /session' })
  @IsString()
  @IsNotEmpty()
  entryId!: string;

  @ApiProperty({ description: "User's translation attempt" })
  @IsString()
  @IsNotEmpty()
  answer!: string;
}
