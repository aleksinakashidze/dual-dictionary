import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { DirectionEnum } from '../enums/direction.enum';

export class CreateWordDto {
  @ApiProperty({ example: 'hello' })
  @IsString()
  @IsNotEmpty()
  word!: string;

  @ApiProperty({ example: 'გამარჯობა' })
  @IsString()
  @IsNotEmpty()
  translation!: string;

  @ApiProperty({ enum: DirectionEnum })
  @IsEnum(DirectionEnum)
  direction!: DirectionEnum;
}
