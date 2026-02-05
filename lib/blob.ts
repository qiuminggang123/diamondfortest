import { put, del } from '@vercel/blob';

// 上传图片到 vercel blob
export const uploadImageToBlob = async (file: File): Promise<string> => {
  // Next.js 会自动将 env 中配置的变量暴露给客户端
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  
  if (!token) {
    console.warn('BLOB_READ_WRITE_TOKEN 未配置，使用本地文件 URL 作为 fallback');
    return URL.createObjectURL(file);
  }

  try {
    const blob = await put(file.name, file, {
      access: 'public',
      token: token,
    });
    return blob.url;
  } catch (error) {
    console.error('Upload image to blob failed:', error);
    // 如果上传失败，返回本地 URL 作为 fallback
    console.warn('Blob 上传失败，使用本地文件 URL 作为 fallback');
    return URL.createObjectURL(file);
  }
};

// 删除图片从 vercel blob
export const deleteImageFromBlob = async (url: string): Promise<void> => {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  
  // 如果没有配置 token 或是本地 URL，直接返回
  if (!token || url.startsWith('blob:')) {
    console.warn('未配置 BLOB_READ_WRITE_TOKEN 或为本地 URL，跳过删除操作');
    return;
  }

  try {
    await del(url, { token: token });
  } catch (error) {
    console.error('Delete image from blob failed:', error);
  }
};