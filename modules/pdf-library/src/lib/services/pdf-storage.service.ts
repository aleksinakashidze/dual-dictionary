import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AppConfigService } from '@dual-dictionary/config';
import { S3Service } from '@dual-dictionary/common';
import { createReadStream } from 'fs';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { dirname, resolve, sep } from 'path';
import { Response } from 'express';
import { PdfBookDocument } from '../schemas/pdf-book.schema';
import { decodePossibleUtf8Mojibake } from '../utils/text-encoding.util';

export interface StoredPdfFile {
  storageProvider: 'local' | 's3';
  storageKey: string;
}

@Injectable()
export class PdfStorageService {
  private readonly logger = new Logger(PdfStorageService.name);

  constructor(
    private readonly config: AppConfigService,
    private readonly s3: S3Service,
  ) {}

  get maxFileSizeBytes(): number {
    return this.config.pdfMaxFileSizeMb * 1024 * 1024;
  }

  async save(file: Express.Multer.File, userId: string): Promise<StoredPdfFile> {
    const key = this.buildStorageKey(userId);

    if (this.shouldUseS3()) {
      this.ensureS3Configured();
      try {
        const result = await this.s3.upload(file.buffer, {
          folder: 'pdf-books',
          fileName: `${randomUUID()}.pdf`,
          mimeType: 'application/pdf',
        });
        return { storageProvider: 's3', storageKey: result.key };
      } catch (error) {
        const err = error as Error;
        this.logger.error(`PDF S3 upload failed: ${err.message}`, err.stack);
        throw new ServiceUnavailableException('PDF S3 storage is not available');
      }
    }

    const path = this.resolveLocalPath(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, file.buffer);
    return { storageProvider: 'local', storageKey: key };
  }

  async send(book: PdfBookDocument, res: Response): Promise<void> {
    const fileName = this.safeHeaderFileName(book.originalFileName);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(book.originalFileName)}`);
    res.setHeader('Cache-Control', 'private, max-age=300');

    if (book.storageProvider === 's3') {
      const object = await this.s3.getObject(book.storageKey);
      if (object.contentLength !== undefined) {
        res.setHeader('Content-Length', object.contentLength.toString());
      }
      object.body.on('error', (error) => {
        this.logger.error(`S3 PDF stream failed: ${error.message}`, error.stack);
        if (!res.headersSent) res.status(404).send();
      });
      object.body.pipe(res);
      return;
    }

    const stream = createReadStream(this.resolveLocalPath(book.storageKey));
    stream.on('error', (error) => {
      this.logger.error(`PDF stream failed: ${error.message}`, error.stack);
      if (!res.headersSent) res.status(404).send();
    });
    stream.pipe(res);
  }

  async delete(book: PdfBookDocument): Promise<void> {
    if (book.storageProvider === 's3') {
      await this.s3.delete(book.storageKey);
      return;
    }

    try {
      await unlink(this.resolveLocalPath(book.storageKey));
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== 'ENOENT') throw error;
    }
  }

  private shouldUseS3(): boolean {
    return this.config.pdfStorageDriver === 's3';
  }

  private ensureS3Configured(): void {
    const configured = Boolean(
      this.config.awsRegion &&
      this.config.awsAccessKeyId &&
      this.config.awsSecretAccessKey &&
      this.config.awsS3Bucket,
    );
    if (!configured) {
      throw new ServiceUnavailableException('PDF S3 storage is not configured');
    }
  }

  private buildStorageKey(userId: string): string {
    return `${userId}/${randomUUID()}.pdf`;
  }

  private resolveLocalPath(key: string): string {
    const root = resolve(process.cwd(), this.config.pdfStoragePath);
    const target = resolve(root, key);
    if (target !== root && !target.startsWith(`${root}${sep}`)) {
      throw new BadRequestException('Invalid PDF storage key');
    }
    return target;
  }

  private safeHeaderFileName(fileName: string): string {
    return decodePossibleUtf8Mojibake(fileName)
      .replace(/[^\w.\- ]/g, '_')
      .slice(0, 120) || 'book.pdf';
  }
}
