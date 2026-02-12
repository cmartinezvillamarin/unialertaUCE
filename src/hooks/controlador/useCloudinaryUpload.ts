import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
  resource_type: string;
  created_at: string;
  original_filename: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UseCloudinaryUploadOptions {
  folder?: string;
  tags?: string[];
  transformation?: string;
  onProgress?: (progress: UploadProgress) => void;
}

export interface UseCloudinaryUploadReturn {
  upload: (file: File, options?: UseCloudinaryUploadOptions) => Promise<CloudinaryUploadResult>;
  uploadMultiple: (files: File[], options?: UseCloudinaryUploadOptions) => Promise<CloudinaryUploadResult[]>;
  uploadFromDataUrl: (dataUrl: string, options?: UseCloudinaryUploadOptions) => Promise<CloudinaryUploadResult>;
  isUploading: boolean;
  progress: UploadProgress | null;
  error: Error | null;
  reset: () => void;
}

/**
 * Convert a File to a base64 data URL string
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function useCloudinaryUpload(): UseCloudinaryUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(null);
    setError(null);
  }, []);

  const uploadFile = useCallback(async (
    fileOrDataUrl: File | string,
    options?: UseCloudinaryUploadOptions
  ): Promise<CloudinaryUploadResult> => {
    setIsUploading(true);
    setError(null);
    setProgress({ loaded: 0, total: 100, percentage: 0 });

    try {
      // Convert File to data URL if needed
      const dataUrl = typeof fileOrDataUrl === 'string'
        ? fileOrDataUrl
        : await fileToDataUrl(fileOrDataUrl);

      setProgress({ loaded: 30, total: 100, percentage: 30 });

      // Call the server-side edge function
      const { data, error: fnError } = await supabase.functions.invoke('cloudinary-upload', {
        body: {
          file: dataUrl,
          folder: options?.folder,
          tags: options?.tags,
        },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Upload failed');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setProgress({ loaded: 100, total: 100, percentage: 100 });
      setIsUploading(false);

      return data as CloudinaryUploadResult;
    } catch (err) {
      const uploadError = err instanceof Error ? err : new Error('Error desconocido');
      setError(uploadError);
      setIsUploading(false);
      throw uploadError;
    }
  }, []);

  const upload = useCallback(async (
    file: File,
    options?: UseCloudinaryUploadOptions
  ): Promise<CloudinaryUploadResult> => {
    return uploadFile(file, options);
  }, [uploadFile]);

  const uploadFromDataUrl = useCallback(async (
    dataUrl: string,
    options?: UseCloudinaryUploadOptions
  ): Promise<CloudinaryUploadResult> => {
    return uploadFile(dataUrl, options);
  }, [uploadFile]);

  const uploadMultiple = useCallback(async (
    files: File[],
    options?: UseCloudinaryUploadOptions
  ): Promise<CloudinaryUploadResult[]> => {
    setIsUploading(true);
    setError(null);

    const results: CloudinaryUploadResult[] = [];
    const totalFiles = files.length;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result = await uploadFile(file, {
          ...options,
          onProgress: (fileProgress) => {
            const overallPercentage = Math.round(
              ((i + fileProgress.percentage / 100) / totalFiles) * 100
            );
            const overallProgress: UploadProgress = {
              loaded: i + fileProgress.percentage / 100,
              total: totalFiles,
              percentage: overallPercentage,
            };
            setProgress(overallProgress);
            options?.onProgress?.(overallProgress);
          },
        });
        results.push(result);
      }

      setIsUploading(false);
      return results;
    } catch (err) {
      setIsUploading(false);
      throw err;
    }
  }, [uploadFile]);

  return {
    upload,
    uploadMultiple,
    uploadFromDataUrl,
    isUploading,
    progress,
    error,
    reset,
  };
}
