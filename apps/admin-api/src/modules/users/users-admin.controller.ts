import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Version,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  ApiAuth,
  PageResultDto,
  Roles,
  RolesEnum,
} from '@dual-dictionary/common';
import {
  ChangeRolesDto,
  CreateUserDto,
  UpdateUserDto,
  UserFilterDto,
  UserResponseDto,
  UserService,
} from '@dual-dictionary/users';

@ApiTags('admin / users')
@Controller('admin/users')
@Roles(RolesEnum.Admin)
@ApiAuth()
export class UsersAdminController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Version('1')
  @ApiOperation({ summary: 'Create user (admin)' })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.userService.create(dto);
    return UserResponseDto.from(user);
  }

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'List all users with pagination' })
  async findAll(
    @Query() pagination: UserFilterDto,
  ): Promise<PageResultDto<UserResponseDto>> {
    console.log('Pagination:', pagination);
    return this.userService.findAll(pagination);
  }

  @Get(':id')
  @Version('1')
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.userService.findById(id);
    return UserResponseDto.from(user);
  }

  @Patch(':id')
  @Version('1')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Update user' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.userService.update(id, dto);
    return UserResponseDto.from(user);
  }

  @Patch(':id/roles')
  @Version('1')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Change user roles' })
  async changeRoles(
    @Param('id') id: string,
    @Body() dto: ChangeRolesDto,
  ): Promise<UserResponseDto> {
    const user = await this.userService.changeRoles(id, dto.roles);
    return UserResponseDto.from(user);
  }

  @Delete(':id')
  @Version('1')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Soft delete user' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.userService.remove(id);
  }
}
