import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * Service for extracting metadata from images including timestamps and location
 */
export class ImageMetadataService {
  /**
   * Extract metadata from an image file
   */
  static async extractMetadata(imageUri: string): Promise<ImageMetadata> {
    try {
      console.log('ImageMetadataService: Extracting metadata from:', imageUri);
      
      const metadata: ImageMetadata = {
        uri: imageUri,
        createdAt: new Date(),
        modifiedAt: new Date(),
        fileSize: 0,
        width: 0,
        height: 0,
        format: 'unknown',
        source: 'unknown'
      };

      // Get basic file info
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (fileInfo.exists) {
        metadata.fileSize = fileInfo.size || 0;
        metadata.modifiedAt = fileInfo.modificationTime ? new Date(fileInfo.modificationTime) : new Date();
      }

      // For images taken with camera, try to get creation date from file system
      if (imageUri.includes('ImagePicker') || imageUri.includes('Camera')) {
        metadata.source = 'camera';
        // Use file modification time as creation time for camera images
        metadata.createdAt = metadata.modifiedAt;
      } else if (imageUri.includes('Photos') || imageUri.includes('media-library')) {
        metadata.source = 'gallery';
        
        // Try to get more detailed info from media library
        try {
          const [permissionResult] = await MediaLibrary.requestPermissionsAsync();
          
          if (permissionResult.granted) {
            // Try to find the asset in media library
            const assets = await MediaLibrary.getAssetsAsync({
              first: 100,
              mediaType: 'photo',
              sortBy: 'modificationTime',
            });
            
            // Find matching asset by URI or filename
            const filename = imageUri.split('/').pop();
            const matchingAsset = assets.assets.find(asset => 
              asset.uri === imageUri || 
              asset.filename === filename ||
              asset.uri.includes(filename || '')
            );
            
            if (matchingAsset) {
              metadata.createdAt = new Date(matchingAsset.creationTime);
              metadata.modifiedAt = new Date(matchingAsset.modificationTime);
              metadata.width = matchingAsset.width;
              metadata.height = matchingAsset.height;
              metadata.format = getImageFormat(matchingAsset.filename);
              
              // Try to get location data if available
              if (matchingAsset.location) {
                metadata.location = {
                  latitude: matchingAsset.location.latitude,
                  longitude: matchingAsset.location.longitude,
                };
              }
              
              console.log('ImageMetadataService: Found matching asset with creation time:', metadata.createdAt);
            }
          }
        } catch (error) {
          console.warn('ImageMetadataService: Could not access media library:', error);
        }
      }

      // Extract date from filename patterns (common camera naming)
      const filenameDate = extractDateFromFilename(imageUri);
      if (filenameDate) {
        metadata.createdAt = filenameDate;
        console.log('ImageMetadataService: Extracted date from filename:', filenameDate);
      }

      // Estimate creation date based on journal context
      const estimatedDate = estimateJournalDate(metadata);
      if (estimatedDate) {
        metadata.estimatedJournalDate = estimatedDate;
        console.log('ImageMetadataService: Estimated journal date:', estimatedDate);
      }

      console.log('ImageMetadataService: Final metadata:', {
        createdAt: metadata.createdAt,
        source: metadata.source,
        estimatedJournalDate: metadata.estimatedJournalDate
      });

      return metadata;

    } catch (error) {
      console.error('ImageMetadataService: Failed to extract metadata:', error);
      
      // Return minimal metadata on error
      return {
        uri: imageUri,
        createdAt: new Date(),
        modifiedAt: new Date(),
        fileSize: 0,
        width: 0,
        height: 0,
        format: 'unknown',
        source: 'unknown'
      };
    }
  }

  /**
   * Get suggested date for journal entries based on image metadata
   */
  static getSuggestedDate(metadata: ImageMetadata): Date {
    // Priority order for date selection:
    // 1. Estimated journal date (if reasonable)
    // 2. Creation date (if recent)
    // 3. Today (fallback)
    
    const now = new Date();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    
    // Use estimated journal date if available and within reasonable range
    if (metadata.estimatedJournalDate) {
      const timeDiff = Math.abs(now.getTime() - metadata.estimatedJournalDate.getTime());
      if (timeDiff <= maxAge) {
        return metadata.estimatedJournalDate;
      }
    }
    
    // Use creation date if recent
    if (metadata.createdAt) {
      const timeDiff = Math.abs(now.getTime() - metadata.createdAt.getTime());
      if (timeDiff <= maxAge) {
        return metadata.createdAt;
      }
    }
    
    // Fallback to today
    return now;
  }
}

/**
 * Extract date from common camera filename patterns
 */
function extractDateFromFilename(uri: string): Date | null {
  const filename = uri.split('/').pop() || '';
  
  // Common patterns:
  // IMG_20240115_143022.jpg
  // 20240115_143022.jpg
  // 2024-01-15 14:30:22.jpg
  // Screenshot 2024-01-15 at 2.30.22 PM.png
  
  const patterns = [
    /(\d{4})(\d{2})(\d{2})[_\-\s]?(\d{2})(\d{2})(\d{2})/,  // YYYYMMDD_HHMMSS
    /(\d{4})-(\d{2})-(\d{2})[_\-\s]?(\d{2})[:\.](\d{2})[:\.](\d{2})/, // YYYY-MM-DD HH:MM:SS
    /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
    /(\d{2})(\d{2})(\d{4})/, // MMDDYYYY
  ];
  
  for (const pattern of patterns) {
    const match = filename.match(pattern);
    if (match) {
      try {
        let year, month, day, hour = 0, minute = 0, second = 0;
        
        if (match.length >= 4) {
          [, year, month, day] = match.map(Number);
          
          // Handle different year positions
          if (year < 100) {
            [year, month, day] = [day, year, month]; // Assume MMDDYY format
            year += 2000;
          }
          
          if (match.length >= 7) {
            [, , , , hour, minute, second] = match.map(Number);
          }
        }
        
        const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
        
        // Validate date is reasonable (not too far in past/future)
        const now = new Date();
        const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year
        if (Math.abs(now.getTime() - date.getTime()) <= maxAge) {
          return date;
        }
      } catch (error) {
        console.warn('Failed to parse date from filename:', filename, error);
      }
    }
  }
  
  return null;
}

/**
 * Get image format from filename
 */
function getImageFormat(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'jpeg';
    case 'png':
      return 'png';
    case 'gif':
      return 'gif';
    case 'webp':
      return 'webp';
    case 'heic':
    case 'heif':
      return 'heic';
    default:
      return 'unknown';
  }
}

/**
 * Estimate journal date based on various factors
 */
function estimateJournalDate(metadata: ImageMetadata): Date | null {
  const now = new Date();
  const createdAt = metadata.createdAt;
  
  if (!createdAt) return null;
  
  // If image was taken today, assume it's for today's journal
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const imageDate = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate());
  
  if (imageDate.getTime() === today.getTime()) {
    return today;
  }
  
  // If image was taken yesterday evening (after 6 PM), might be for today's journal
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  if (imageDate.getTime() === yesterday.getTime() && createdAt.getHours() >= 18) {
    return today;
  }
  
  // If image was taken in the morning (before 10 AM), might be for yesterday's journal
  if (imageDate.getTime() === today.getTime() && createdAt.getHours() <= 10) {
    return yesterday;
  }
  
  // Otherwise, use the image date
  return imageDate;
}

/**
 * Image metadata interface
 */
export interface ImageMetadata {
  uri: string;
  createdAt: Date;
  modifiedAt: Date;
  fileSize: number;
  width: number;
  height: number;
  format: string;
  source: 'camera' | 'gallery' | 'unknown';
  location?: {
    latitude: number;
    longitude: number;
  };
  estimatedJournalDate?: Date;
}