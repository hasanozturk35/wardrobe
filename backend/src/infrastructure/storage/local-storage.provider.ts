import { Injectable, Logger } from '@nestjs/common';
import { StorageProvider, StorageFile } from './storage.provider';
import * as fs from 'fs/promises';
import { join } from 'path';

@Injectable()
export class LocalStorageProvider extends StorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly uploadDir = join(process.cwd(), 'uploads');

  async upload(file: StorageFile, path: string): Promise<string> {
    const fullPath = join(this.uploadDir, path);
    const dir = join(fullPath, '..');

    try {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(fullPath, file.buffer);
      this.logger.log(`File uploaded to: ${fullPath}`);
      return `/uploads/${path}`;
    } catch (error: any) {
      this.logger.error(`Error uploading file to local storage: ${error.message}`);
      throw error;
    }
  }

  async delete(path: string): Promise<void> {
    const fullPath = join(this.uploadDir, path);
    try {
      await fs.unlink(fullPath);
    } catch (error) {
      this.logger.warn(`Could not delete file: ${fullPath}. It may not exist.`);
    }
  }

  getUrl(path: string): string {
    // Returns the static file URL served by NestJS
    return `/static/${path}`;
  }
}
