export interface UploadResult {
  url: string;
  key: string;
  size: number;
  mimeType: string;
  bucket: string;
  etag?: string;
}

export interface MediaFile {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface UploadOptions {
  userId?: string;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  makePublic?: boolean;
}
