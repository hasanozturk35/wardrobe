import { Global, Module } from '@nestjs/common';
import { StorageProvider } from './storage.provider';
import { LocalStorageProvider } from './local-storage.provider';
import { CloudinaryStorageProvider } from './cloudinary-storage.provider';

const storageProvider = {
    provide: StorageProvider,
    useClass: process.env.CLOUDINARY_CLOUD_NAME
        ? CloudinaryStorageProvider
        : LocalStorageProvider,
};

@Global()
@Module({
    providers: [storageProvider],
    exports: [StorageProvider],
})
export class StorageModule {}
