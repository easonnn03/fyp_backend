/// <reference types="multer" />

import { BlobServiceClient } from '@azure/storage-blob';
import { v4 as uuid } from 'uuid';

const blobService = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING!,
);
const container = blobService.getContainerClient(
  process.env.AZURE_STORAGE_CONTAINER || 'posts',
);

export async function uploadToAzure(
  file: Express.Multer.File,
  folder = 'posts',
) {
  const ext = file.originalname.split('.').pop() || '';
  const blob = `${folder}/${uuid()}.${ext}`;
  const block = container.getBlockBlobClient(blob);

  await block.uploadData(file.buffer, {
    blobHTTPHeaders: { blobContentType: file.mimetype },
  });

  const account = process.env.AZURE_STORAGE_ACCOUNT;
  return `https://${account}.blob.core.windows.net/${container.containerName}/${blob}`;
}
