import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppConfigService } from '@dual-dictionary/config';
import { AppLogger } from '@dual-dictionary/logger';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [AppConfigService, AppLogger],
      useFactory: (config: AppConfigService, logger: AppLogger) => ({
        uri: config.mongoUri,
        connectionFactory: (connection: {
          on: (event: string, cb: (...args: unknown[]) => void) => void;
        }) => {
          connection.on('connected', () =>
            logger.log('MongoDB connected successfully', 'DatabaseModule'),
          );
          connection.on('error', (err: unknown) =>
            logger.error('MongoDB connection error', String(err), 'DatabaseModule'),
          );
          connection.on('disconnected', () =>
            logger.warn('MongoDB disconnected', 'DatabaseModule'),
          );
          return connection;
        },
      }),
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
