import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppConfigService } from '@dual-dictionary/config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        uri: config.mongoUri,
        connectionFactory: (connection: {
          on: (event: string, cb: (...args: unknown[]) => void) => void;
        }) => {
          connection.on('connected', () =>
            console.log('MongoDB connected successfully'),
          );
          connection.on('error', (err: unknown) =>
            console.error('MongoDB connection error:', err),
          );
          connection.on('disconnected', () =>
            console.warn('MongoDB disconnected'),
          );
          return connection;
        },
      }),
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
