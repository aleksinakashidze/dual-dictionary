import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GenderEnum, RolesEnum } from '@dual-dictionary/common';
import { UserDocument } from '../schemas/user.schema';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional({ enum: GenderEnum })
  gender: GenderEnum | null;

  @ApiPropertyOptional()
  birthDate: Date | null;

  @ApiPropertyOptional()
  phoneNumber: string | null;

  @ApiProperty({ enum: RolesEnum, isArray: true })
  roles: RolesEnum[];

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;

  static from(user: UserDocument): UserResponseDto {
    return {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      gender: user.gender,
      birthDate: user.birthDate,
      phoneNumber: user.phoneNumber,
      roles: user.roles,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
