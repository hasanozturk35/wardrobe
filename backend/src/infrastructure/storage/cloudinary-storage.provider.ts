import { Injectable, Logger } from '@nestjs/common';
import { StorageProvider, StorageFile } from './storage.provider';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryStorageProvider extends StorageProvider {
    private readonly logger = new Logger(CloudinaryStorageProvider.name);

    constructor() {
        super();
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        this.logger.log('CloudinaryStorageProvider aktif');
    }

    async upload(file: StorageFile, pathHint: string): Promise<string> {
        const base64 = file.buffer.toString('base64');
        const dataUri = `data:${file.mimetype};base64,${base64}`;
        const folder = pathHint.split('/')[0] || 'wardrobe';

        const result = await cloudinary.uploader.upload(dataUri, {
            folder,
            resource_type: 'image',
            transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        });

        return result.secure_url;
    }

    async delete(urlOrPublicId: string): Promise<void> {
        try {
            // Cloudinary URL'den public_id çıkar
            const match = urlOrPublicId.match(/\/([^/]+)\.[a-z]+$/i);
            if (match) {
                const folder = urlOrPublicId.includes('/wardrobe/') ? 'wardrobe' : 'uploads';
                await cloudinary.uploader.destroy(`${folder}/${match[1]}`);
            }
        } catch (err) {
            this.logger.warn(`Cloudinary delete failed: ${err}`);
        }
    }

    getUrl(urlOrPath: string): string {
        // Cloudinary'den dönen URL zaten tam URL — olduğu gibi döndür
        if (urlOrPath.startsWith('http')) return urlOrPath;
        return urlOrPath;
    }
}
