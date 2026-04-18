import { NotFoundException } from '@nestjs/common';
import { Document, Model, Types, UpdateQuery } from 'mongoose';
import type { Filter as FilterQuery } from 'mongodb';
import { BaseSchema } from './base.schema';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export abstract class BaseRepository<T extends BaseSchema & Document> {
  constructor(protected readonly model: Model<T>) {}

  async findById(id: string | Types.ObjectId): Promise<T | null> {
    return this.model
      .findOne({ _id: id, isDeleted: false } as FilterQuery<T>)
      .exec();
  }

  async findByIdOrThrow(id: string | Types.ObjectId): Promise<T> {
    const doc = await this.findById(id);
    if (!doc) throw new NotFoundException(`${this.model.modelName} not found`);
    return doc;
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    return this.model.findOne({ ...filter, isDeleted: false }).exec();
  }

  async findAll(filter: FilterQuery<T> = {}): Promise<T[]> {
    return this.model.find({ ...filter, isDeleted: false }).exec();
  }

  async findPaginated(
    filter: FilterQuery<T> = {},
    page = 1,
    limit = 10,
    sort: Record<string, 1 | -1> = { createdAt: -1 },
  ): Promise<PaginatedResult<T>> {
    const skip = (page - 1) * limit;
    const query = { ...filter, isDeleted: false };

    const [data, total] = await Promise.all([
      this.model.find(query).sort(sort).skip(skip).limit(limit).exec(),
      this.model.countDocuments(query),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data);
  }

  async updateById(
    id: string | Types.ObjectId,
    update: UpdateQuery<T>,
  ): Promise<T> {
    const doc = await this.model
      .findOneAndUpdate(
        { _id: id, isDeleted: false } as FilterQuery<T>,
        update,
        { returnDocument: 'after' },
      )
      .exec();

    if (!doc) throw new NotFoundException(`${this.model.modelName} not found`);
    return doc;
  }

  async softDelete(id: string | Types.ObjectId): Promise<void> {
    await this.model
      .findOneAndUpdate(
        { _id: id } as FilterQuery<T>,
        { isDeleted: true, deletedAt: new Date() } as UpdateQuery<T>,
      )
      .exec();
  }

  async hardDelete(id: string | Types.ObjectId): Promise<void> {
    await this.model.findByIdAndDelete(id).exec();
  }

  async exists(filter: FilterQuery<T>): Promise<boolean> {
    const count = await this.model.countDocuments({
      ...filter,
      isDeleted: false,
    });
    return count > 0;
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments({ ...filter, isDeleted: false });
  }
}
