// Re-export from firebase storage for service layer consistency
export {
  uploadFile,
  uploadBase64,
  getFileUrl,
  deleteFile,
  listFiles,
  getFileMetadata,
  createUploadTask,
  generateFilePath,
  commitPendingStorageUpload,
  listPendingProgressPhotoPaths,
  deleteStoragePaths,
} from '@/lib/firebase/storage';
