import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class BucketService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.BUCKET_CLOUD_NAME,
      api_key: process.env.BUCKET_API_KEY,
      api_secret: process.env.BUCKET_API_SECRET,
    });
  }

  /**
   * Envia uma imagem base64 para o Cloudinary com um public_id definido
   * @param base64 string base64 da imagem (sem prefixo data:image/jpeg...)
   * @param folder pasta no Cloudinary (ex: 'users', 'products')
   * @param identifier nome único para o arquivo (ex: userId ou productId)
   */
  async uploadBase64Image(
    base64: string,
    folder: string,
    identifier: string,
  ): Promise<string> {
    const publicId = `${folder}/${identifier}`;

    try {
      // Detecta se tem prefixo (data:image/...)
      const matches = base64.match(/^data:(image\/\w+);base64,(.+)$/);

      let mimeType = 'image/jpeg';
      let cleanBase64 = base64;

      if (matches) {
        mimeType = matches[1]; // image/png ou image/jpeg
        cleanBase64 = matches[2]; // só a string base64
      }

      const result = await cloudinary.uploader.upload(
        `data:${mimeType};base64,${cleanBase64}`,
        {
          public_id: publicId,
          overwrite: true,
          resource_type: 'image',
        },
      );

      return result.secure_url;
    } catch (err) {
      throw new Error(
        `Erro ao enviar imagem para o Cloudinary: ${err.message}`,
      );
    }
  }

  async deleteImageByName(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.warn(`Erro ao excluir imagem no Cloudinary: ${error.message}`);
    }
  }
}
