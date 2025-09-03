/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

export interface UploadedImage {
  public_id: string;
  url: string;
}

export interface DeleteImageResult {
  result: 'ok' | 'not found';
}

@Injectable()
export class CloudinaryService {
  // FUNCTION 1: upload a single image
  async uploadImage(file: Express.Multer.File): Promise<UploadedImage> {
    // This function takes one image and uploads it to cloudinary
    return new Promise((resolve, reject) => {
      // cloudinary.uploader.upload_stream creates an upoad stream
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'jglobalproperties',
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) {
              // If upload fails, reject the promise
              reject(
                new Error(
                  `Image upload failed: ${error.message || 'Unknown error'}`,
                ),
              );
            } else {
              // if uploads succeeds, return only the essential information
              resolve({
                public_id: result?.public_id ?? '',
                url: result?.secure_url ?? '',
              });
            }
          },
        )
        .end(file.buffer);
    });
  }

  //FUNCTION 2: Upload multiple images at once
  async uploadMultipleImages(
    files: Express.Multer.File[],
  ): Promise<UploadedImage[]> {
    // This function takes an array of image files and uploads all of them

    //check if we have files to upload
    if (!files || files.length === 0) {
      return []; // Return empty array if no files
    }

    // Create an array of upload promises (one for each file)
    const uploadPromises = files.map((file) => this.uploadImage(file));

    // wait for all uploads to complete and return the results
    return Promise.all(uploadPromises);
  }

  // FUNCTION 3: Delete a single image
  async deleteImage(publicId: string): Promise<DeleteImageResult> {
    // This function deletes an image from cloudinary using it's public_id
    return new Promise((resolve, reject) => {
      void cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          reject(
            new Error(
              `Image deletion failed: ${error.message || 'Unknown error'}`,
            ),
          );
        } else {
          resolve(result as DeleteImageResult);
        }
      });
    });
  }

  async deleteMultipleImages(
    publicIds: string[],
  ): Promise<DeleteImageResult[]> {
    // This function deletes multiple image from cloudinary

    // Check if we have public_ids to delete
    if (!publicIds || publicIds.length === 0) {
      return [];
    }

    //create an array of delete promises (one for each public_id)
    const deletePromises = publicIds.map((id) => this.deleteImage(id));

    // wait for all the deletions to complete and return the results
    return Promise.all(deletePromises);
  }
}
