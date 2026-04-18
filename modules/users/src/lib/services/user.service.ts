import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HashService, PageResultDto, RolesEnum } from '@dual-dictionary/common';
import { UserFilterDto } from '../dto/user-filter.dto';
import { UserRepository } from '../repositories/user.repository';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UserDocument } from '../schemas/user.schema';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly hash: HashService,
  ) {}

  async create(dto: CreateUserDto): Promise<UserDocument> {
    const [emailTaken, usernameTaken] = await Promise.all([
      this.userRepo.findByEmail(dto.email),
      this.userRepo.findByUsername(dto.username),
    ]);

    if (emailTaken) throw new ConflictException('Email already in use');
    if (usernameTaken) throw new ConflictException('Username already taken');

    const hashed = await this.hash.hash(dto.password);
    return this.userRepo.create({
      ...dto,
      password: hashed,
      roles: dto.roles ?? [RolesEnum.User],
      birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
    });
  }

  async findAll(
    pagination: UserFilterDto,
  ): Promise<PageResultDto<UserResponseDto>> {
    const filter: Record<string, unknown> = {};

    if (pagination.search) {
      filter['$or'] = [
        { username: { $regex: pagination.search, $options: 'i' } },
        { email: { $regex: pagination.search, $options: 'i' } },
      ];
    }

    if (pagination.role) {
      filter['roles'] = pagination.role;
    }

    const result = await this.userRepo.findPaginated(
      filter,
      pagination.page,
      pagination.limit,
    );

    return PageResultDto.from({
      ...result,
      data: result.data.map(UserResponseDto.from),
    });
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userRepo.findByEmail(email);
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userRepo.findByEmailWithPassword(email);
  }

  async findByIdWithRefreshToken(id: string): Promise<UserDocument | null> {
    return this.userRepo.findByIdWithRefreshToken(id);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserDocument> {
    await this.findById(id);
    return this.userRepo.updateById(id, dto);
  }

  async changeRoles(id: string, roles: RolesEnum[]): Promise<UserDocument> {
    await this.findById(id);
    return this.userRepo.updateById(id, { roles });
  }

  async updateRefreshToken(
    id: string,
    token: string | null,
  ): Promise<void> {
    const hashed = token ? await this.hash.hash(token) : null;
    await this.userRepo.updateById(id, { refreshToken: hashed });
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.userRepo.softDelete(id);
  }
}
