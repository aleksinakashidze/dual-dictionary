import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '@dual-dictionary/database';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UserRepository extends BaseRepository<UserDocument> {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {
    super(userModel);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase(), isDeleted: false })
      .exec();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ username: username.toLowerCase(), isDeleted: false })
      .exec();
  }

  // Explicitly select password (normally excluded via select: false)
  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase(), isDeleted: false })
      .select('+password')
      .exec();
  }

  // Explicitly select refreshToken
  async findByIdWithRefreshToken(id: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ _id: id, isDeleted: false })
      .select('+refreshToken')
      .exec();
  }
}
