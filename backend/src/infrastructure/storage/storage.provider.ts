export interface StorageFile {
  buffer: Buffer;
  filename: string;
  mimetype: string;
}

export abstract class StorageProvider {
  abstract upload(file: StorageFile, path: string): Promise<string>;
  abstract delete(path: string): Promise<void>;
  abstract getUrl(path: string): string;
}
