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

  // Select reset token fields for password-reset flow
  async findByEmailWithResetToken(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase(), isDeleted: false })
      .select('+resetToken +resetTokenExpiry +password')
      .exec();
  }

  // Find user by hashed reset token (not expired)
  async findByHashedResetToken(hashedToken: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        resetToken: hashedToken,
        resetTokenExpiry: { $gt: new Date() },
        isDeleted: false,
      })
      .select('+resetToken +resetTokenExpiry')
      .exec();
  }

  // Find user by hashed email verification token (not expired)
  async findByHashedVerificationToken(hashedToken: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        emailVerificationToken: hashedToken,
        emailVerificationTokenExpiry: { $gt: new Date() },
        isDeleted: false,
      })
      .select('+emailVerificationToken +emailVerificationTokenExpiry')
      .exec();
  }

  // Get verification token fields for a user
  async findByIdWithVerificationToken(id: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ _id: id, isDeleted: false })
      .select('+emailVerificationToken +emailVerificationTokenExpiry')
      .exec();
  }

  async findByGoogleId(googleId: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ googleId, isDeleted: false })
      .exec();
  }

  // Find deleted user by email (for account recovery)
  async findDeletedByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase(), isDeleted: true })
      .select('+recoveryToken +recoveryTokenExpiry')
      .exec();
  }

  // Find user by hashed recovery token (not expired, can be deleted or active)
  async findByHashedRecoveryToken(hashedToken: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        recoveryToken: hashedToken,
        recoveryTokenExpiry: { $gt: new Date() },
      })
      .select('+recoveryToken +recoveryTokenExpiry +isDeleted')
      .exec();
  }
}

