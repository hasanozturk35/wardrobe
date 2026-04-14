import { Global, Module } from '@nestjs/common';
import { StorageProvider } from './storage.provider';
import { LocalStorageProvider } from './local-storage.provider';

@Global()
@Module({
  providers: [
    {
      provide: StorageProvider,
      useClass: LocalStorageProvider, // Can be easily swapped with S3Provider here
    },
  ],
  exports: [StorageProvider],
})
export class StorageModule {}
