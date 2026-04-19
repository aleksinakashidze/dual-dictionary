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
    try {
      return await this.userRepo.create({
        ...dto,
        password: hashed,
        roles: dto.roles ?? [RolesEnum.User],
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
      });
    } catch (err: unknown) {
      // Handle MongoDB E11000 duplicate key error
      if (err instanceof Error && err.message.includes('E11000')) {
        if (err.message.includes('email')) {
          throw new ConflictException('Email already in use');
        }
        if (err.message.includes('username')) {
          throw new ConflictException('Username already taken');
        }
      }
      throw err;
    }
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

  async findByEmailWithResetToken(email: string): Promise<UserDocument | null> {
    return this.userRepo.findByEmailWithResetToken(email);
  }

  async findByHashedResetToken(hashedToken: string): Promise<UserDocument | null> {
    return this.userRepo.findByHashedResetToken(hashedToken);
  }

  async storeResetToken(
    id: string,
    hashedToken: string,
    expiry: Date,
  ): Promise<void> {
    await this.userRepo.updateById(id, {
      resetToken: hashedToken,
      resetTokenExpiry: expiry,
    });
  }

  async clearResetToken(id: string): Promise<void> {
    await this.userRepo.updateById(id, {
      resetToken: null,
      resetTokenExpiry: null,
    });
  }

  async storeVerificationToken(
    id: string,
    hashedToken: string,
    expiry: Date,
  ): Promise<void> {
    await this.userRepo.updateById(id, {
      emailVerificationToken: hashedToken,
      emailVerificationTokenExpiry: expiry,
    });
  }

  async clearVerificationToken(id: string): Promise<void> {
    await this.userRepo.updateById(id, {
      emailVerificationToken: null,
      emailVerificationTokenExpiry: null,
    });
  }

  async findByHashedVerificationToken(hashedToken: string): Promise<UserDocument | null> {
    return this.userRepo.findByHashedVerificationToken(hashedToken);
  }

  async markEmailAsVerified(id: string): Promise<void> {
    await this.userRepo.updateById(id, {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpiry: null,
    });
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const hashed = await this.hash.hash(newPassword);
    await this.userRepo.updateById(id, { password: hashed });
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

  async findDeletedByEmail(email: string): Promise<UserDocument | null> {
    return this.userRepo.findDeletedByEmail(email);
  }

  async storeRecoveryToken(
    id: string,
    hashedToken: string,
    expiry: Date,
  ): Promise<void> {
    await this.userRepo.updateByIdIgnoreDeleted(id, {
      recoveryToken: hashedToken,
      recoveryTokenExpiry: expiry,
    });
  }

  async findByHashedRecoveryToken(hashedToken: string): Promise<UserDocument | null> {
    return this.userRepo.findByHashedRecoveryToken(hashedToken);
  }

  async recoverAccount(id: string): Promise<void> {
    await this.userRepo.updateByIdIgnoreDeleted(id, {
      isDeleted: false,
      recoveryToken: null,
      recoveryTokenExpiry: null,
    });
  }

  async clearRecoveryToken(id: string): Promise<void> {
    await this.userRepo.updateByIdIgnoreDeleted(id, {
      recoveryToken: null,
      recoveryTokenExpiry: null,
    });
  }

  async permanentlyDeleteUser(id: string): Promise<void> {
    await this.userRepo.hardDelete(id);
  }
}
