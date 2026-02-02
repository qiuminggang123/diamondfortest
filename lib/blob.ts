import { put, del } from '@vercel/blob';

// 上传图片到 vercel blob
export const uploadImageToBlob = async (file: File): Promise<string> => {
  try {
    const blob = await put(file.name, file, {
      access: 'public',
    });
    return blob.url;
  } catch (error) {
    console.error('Upload image to blob failed:', error);
    throw error;
  }
};

// 删除图片从 vercel blob
export const deleteImageFromBlob = async (url: string): Promise<void> => {
  try {
    await del(url);
  } catch (error) {
    console.error('Delete image from blob failed:', error);
  }
};
