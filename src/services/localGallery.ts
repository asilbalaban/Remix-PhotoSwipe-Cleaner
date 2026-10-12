import { Capacitor, registerPlugin } from '@capacitor/core';
import { PhotoItem } from '../types';
import { categorizePhoto, datePartsOf } from './photoUtils';

interface DevicePhoto {
  id: string;
  name: string | null;
  size: number;
  mimeType: string | null;
  dateTaken: number;
  album: string | null;
  width: number;
  height: number;
}

interface LocalGalleryPlugin {
  hasPermission(): Promise<{ granted: boolean }>;
  getPhotos(options?: { limit?: number }): Promise<{ photos: DevicePhoto[]; total: number }>;
  deletePhotos(options: { ids: string[]; permanent: boolean }): Promise<{ confirmed: boolean }>;
}

// Native Android plugin (android/app/.../LocalGalleryPlugin.java)
const LocalGallery = registerPlugin<LocalGalleryPlugin>('LocalGallery');

const DEVICE_ID_PREFIX = 'device-';

// Served by LocalThumbnailWebViewClient.java. Bump "v" when the native scaling changes,
// so the WebView does not keep showing images it cached from the older version.
const thumbnailUrl = (mediaId: string, size: number) => `/_local_thumb_/${mediaId}?s=${size}&v=2`;

/** The real device gallery is only reachable from the native app */
export const isDeviceGalleryAvailable = (): boolean => Capacitor.isNativePlatform();

export const isDevicePhoto = (photo: PhotoItem): boolean => photo.id.startsWith(DEVICE_ID_PREFIX);

/** True when the gallery can be read without showing the permission dialog */
export const hasGalleryPermission = async (): Promise<boolean> => {
  const { granted } = await LocalGallery.hasPermission();
  return granted;
};

/**
 * Fetch the newest photos from the device gallery (asks for the gallery permission when needed)
 */
export const fetchDevicePhotos = async (): Promise<{ photos: PhotoItem[]; total: number }> => {
  const { photos, total } = await LocalGallery.getPhotos();

  const items: PhotoItem[] = photos.map((photo) => {
    const name = photo.name || 'İsimsiz Fotoğraf';
    const albumName = photo.album || 'Cihaz Galerisi';
    const date = new Date(photo.dateTaken);

    return {
      id: `${DEVICE_ID_PREFIX}${photo.id}`,
      source: 'local',
      name,
      url: thumbnailUrl(photo.id, 2048),
      thumbnailUrl: thumbnailUrl(photo.id, 400),
      sizeBytes: photo.size || 0,
      mimeType: photo.mimeType || 'image/jpeg',
      createdAt: date.toISOString(),
      ...datePartsOf(date),
      albumName,
      category: categorizePhoto(name, albumName),
      width: photo.width || undefined,
      height: photo.height || undefined,
    };
  });

  return { photos: items, total };
};

/**
 * Delete (or move to the system trash) device photos. Android asks the user to confirm;
 * resolves false when the user cancels that dialog.
 */
export const deleteDevicePhotos = async (photos: PhotoItem[], permanent: boolean): Promise<boolean> => {
  const ids = photos.map((photo) => photo.id.slice(DEVICE_ID_PREFIX.length));
  const { confirmed } = await LocalGallery.deletePhotos({ ids, permanent });
  return confirmed;
};

/**
 * Browser fallback: photos the user picked with a file input. They can be reviewed,
 * but a web page cannot delete the files behind them.
 */
export const photosFromFiles = (files: FileList): PhotoItem[] =>
  Array.from(files).map((file, idx) => {
    const objectUrl = URL.createObjectURL(file);
    const date = new Date(file.lastModified || Date.now());
    const albumName = 'Seçilen Dosyalar';

    return {
      id: `picked-${Date.now()}-${idx}`,
      source: 'local',
      name: file.name,
      url: objectUrl,
      thumbnailUrl: objectUrl,
      sizeBytes: file.size,
      mimeType: file.type || 'image/jpeg',
      createdAt: date.toISOString(),
      ...datePartsOf(date),
      albumName,
      category: categorizePhoto(file.name, albumName),
    };
  });
