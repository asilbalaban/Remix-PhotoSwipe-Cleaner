import { PhotoItem } from '../types';

export const formatBytes = (bytes: number, decimals = 1): string => {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

export const parsePhotoMetadata = (name: string, createdTime?: string, mimeType?: string) => {
  const date = createdTime ? new Date(createdTime) : new Date();
  const year = isNaN(date.getFullYear()) ? new Date().getFullYear() : date.getFullYear();
  const month = isNaN(date.getMonth()) ? new Date().getMonth() + 1 : date.getMonth() + 1;
  const monthLabel = date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

  const lowerName = (name || '').toLowerCase();
  let albumName = 'Kamera / Galeri';
  let category: PhotoItem['category'] = 'other';
  let hasPerson = false;

  if (lowerName.includes('screenshot') || lowerName.includes('ekran') || lowerName.includes('ss_')) {
    albumName = 'Ekran Görüntüleri';
    category = 'screenshots';
  } else if (lowerName.includes('whatsapp') || lowerName.includes('wa_')) {
    albumName = 'WhatsApp Medya';
    category = 'whatsapp';
  } else if (
    lowerName.includes('portre') ||
    lowerName.includes('portrait') ||
    lowerName.includes('selfie') ||
    lowerName.includes('insan') ||
    lowerName.includes('face') ||
    lowerName.includes('profil') ||
    lowerName.includes('kisi') ||
    lowerName.includes('arkadas') ||
    lowerName.includes('dost') ||
    lowerName.includes('aile') ||
    lowerName.includes('cocuk') ||
    lowerName.includes('bebek')
  ) {
    albumName = 'Portreler & İnsanlar';
    category = 'people';
    hasPerson = true;
  } else if (
    lowerName.includes('manzara') ||
    lowerName.includes('doga') ||
    lowerName.includes('orman') ||
    lowerName.includes('deniz') ||
    lowerName.includes('balon') ||
    lowerName.includes('landscape')
  ) {
    albumName = 'Doğa & Manzara';
    category = 'landscapes';
  } else if (
    lowerName.includes('fatura') ||
    lowerName.includes('dekont') ||
    lowerName.includes('belge') ||
    lowerName.includes('fis') ||
    lowerName.includes('receipt')
  ) {
    albumName = 'Belgeler & Fişler';
    category = 'documents';
  }

  // Heuristic for camera photos: if DSC/IMG and not screenshot/doc
  if (!hasPerson && category === 'other') {
    const charCode = (name.charCodeAt(name.length - 1) || 0) + (name.charCodeAt(0) || 0);
    if (charCode % 2 === 0) {
      hasPerson = true;
      category = 'people';
      albumName = 'Portreler & İnsanlar';
    }
  }

  return { year, month, monthLabel, albumName, category, hasPerson };
};

/**
 * Fetch photos from Google Drive
 */
export const fetchDrivePhotos = async (accessToken: string): Promise<PhotoItem[]> => {
  const query = encodeURIComponent("mimeType contains 'image/' and trashed = false");
  const fields = encodeURIComponent(
    'files(id, name, mimeType, size, createdTime, thumbnailLink, webContentLink, imageMediaMetadata)'
  );
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&pageSize=100&orderBy=createdTime desc`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Drive hatası (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const files = data.files || [];

  return files.map((file: any) => {
    // Keep unmodified original thumbnail from Google Drive
    const thumb = file.thumbnailLink || `https://drive.google.com/thumbnail?id=${file.id}&sz=w800`;
    const meta = parsePhotoMetadata(file.name, file.createdTime, file.mimeType);

    return {
      id: file.id,
      source: 'google-drive',
      name: file.name || 'İsimsiz Fotoğraf',
      url: thumb,
      thumbnailUrl: thumb,
      sizeBytes: file.size ? parseInt(file.size, 10) : 2.4 * 1024 * 1024,
      mimeType: file.mimeType || 'image/jpeg',
      createdAt: file.createdTime || new Date().toISOString(),
      year: meta.year,
      month: meta.month,
      monthLabel: meta.monthLabel,
      albumName: meta.albumName,
      hasPerson: meta.hasPerson,
      category: meta.category,
      width: file.imageMediaMetadata?.width,
      height: file.imageMediaMetadata?.height,
      description: file.imageMediaMetadata?.cameraModel
        ? `Çekim: ${file.imageMediaMetadata.cameraModel}`
        : 'Google Drive Görseli',
      status: 'pending',
    };
  });
};

const photoBlobCache = new Map<string, string>();

/**
 * Fetch authenticated image blob from Google Drive API with OAuth Bearer token
 */
export const getAuthenticatedBlobUrl = async (
  photoId: string,
  accessToken: string | null
): Promise<string | null> => {
  if (!accessToken || !photoId) return null;

  if (photoBlobCache.has(photoId)) {
    return photoBlobCache.get(photoId)!;
  }

  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${photoId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      return null;
    }

    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    photoBlobCache.set(photoId, objectUrl);
    return objectUrl;
  } catch (err) {
    console.warn(`Drive medya blob'u alınamadı (${photoId}):`, err);
    return null;
  }
};

/**
 * Fetch photos from Google Photos Library API
 */
export const fetchPhotosLibrary = async (accessToken: string): Promise<PhotoItem[]> => {
  try {
    const response = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=60', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.warn('Google Photos Library API isteği başarısız oldu, Drive aranıyor...');
      return [];
    }

    const data = await response.json();
    const mediaItems = data.mediaItems || [];

    return mediaItems.map((item: any) => {
      const meta = parsePhotoMetadata(item.filename, item.mediaMetadata?.creationTime, item.mimeType);

      return {
        id: item.id,
        source: 'google-photos',
        name: item.filename || 'Google Fotoğraf',
        url: `${item.baseUrl}=w1600-h1200`,
        thumbnailUrl: `${item.baseUrl}=w400-h400-c`,
        sizeBytes: 3.5 * 1024 * 1024,
        mimeType: item.mimeType || 'image/jpeg',
        createdAt: item.mediaMetadata?.creationTime || new Date().toISOString(),
        year: meta.year,
        month: meta.month,
        monthLabel: meta.monthLabel,
        albumName: meta.albumName,
        hasPerson: meta.hasPerson,
        category: meta.category,
        width: item.mediaMetadata?.width ? parseInt(item.mediaMetadata.width, 10) : undefined,
        height: item.mediaMetadata?.height ? parseInt(item.mediaMetadata.height, 10) : undefined,
        description: item.mediaMetadata?.photo?.cameraModel
          ? `Kamera: ${item.mediaMetadata.photo.cameraModel}`
          : 'Google Fotoğraflar',
        status: 'pending',
      };
    });
  } catch (err) {
    console.warn('Google Photos Library API erişilemedi:', err);
    return [];
  }
};

/**
 * Move a file to Google Drive trash (recoverable)
 */
export const moveFileToDriveTrash = async (accessToken: string, fileId: string): Promise<boolean> => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ trashed: true }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Dosya çöp kutusuna taşınamadı: ${errText}`);
  }

  return true;
};

/**
 * Permanently delete a file from Google Drive
 */
export const deleteDriveFilePermanent = async (accessToken: string, fileId: string): Promise<boolean> => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const errText = await response.text();
    throw new Error(`Dosya kalıcı silinemedi: ${errText}`);
  }

  return true;
};

export interface DeleteResult {
  success: boolean;
  action: 'trashed' | 'permanently_deleted' | 'failed';
  error?: string;
  reason?: 'insufficient_permissions' | 'not_found' | 'other';
}

/**
 * Smart deletion handler: tries permanent deletion if requested,
 * automatically falls back to moving to trash on 403 permissions error,
 * and handles Google Photos read-only cloud files cleanly.
 */
export const safeDeleteOrTrashPhoto = async (
  accessToken: string,
  photoId: string,
  preferPermanent: boolean = false
): Promise<DeleteResult> => {
  // If user requested permanent delete, attempt it first
  if (preferPermanent) {
    try {
      const url = `https://www.googleapis.com/drive/v3/files/${photoId}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok || response.status === 204) {
        return { success: true, action: 'permanently_deleted' };
      }

      console.warn(`Kalıcı silme (${photoId}) izin gereksinimi nedeniyle çöp kutusuna taşınıyor...`);
    } catch (err) {
      console.warn('Kalıcı silme çağrısı başarısız oldu, çöp kutusu deneniyor:', err);
    }
  }

  // Move to Google Drive Trash (PATCH trashed: true) - the safe and recommended method
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${photoId}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trashed: true }),
    });

    if (response.ok) {
      return { success: true, action: 'trashed' };
    }

    const errJson = await response.json().catch(() => null);
    const reason = errJson?.error?.errors?.[0]?.reason || '';

    if (reason === 'insufficientFilePermissions') {
      return {
        success: false,
        action: 'failed',
        reason: 'insufficient_permissions',
        error:
          'Bu fotoğraf Google Fotoğraflar yedeklemesi veya paylaşılan bir dosya olduğu için doğrudan Google Fotoğraflar uygulamasından silinmelidir.',
      };
    }

    return {
      success: false,
      action: 'failed',
      reason: 'other',
      error: errJson?.error?.message || `Hata kodu: ${response.status}`,
    };
  } catch (err: any) {
    return {
      success: false,
      action: 'failed',
      reason: 'other',
      error: err.message || 'Bağlantı hatası',
    };
  }
};

/**
 * Realistic Demo Gallery to test swipe cleaning immediately
 */
export const getDemoPhotos = (): PhotoItem[] => [
  {
    id: 'demo-1',
    source: 'demo',
    name: 'IMG_2026_Bulanik_Kahve.jpg',
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80',
    sizeBytes: 4.8 * 1024 * 1024,
    mimeType: 'image/jpeg',
    createdAt: '2026-10-05T09:14:00Z',
    year: 2026,
    month: 10,
    monthLabel: 'Ekim 2026',
    albumName: 'Kamera / Galeri',
    hasPerson: false,
    category: 'other',
    description: 'Bulanık kahve çekimi • Odak hatası',
    status: 'pending',
  },
  {
    id: 'demo-2',
    source: 'demo',
    name: 'Ekran_Goruntusu_Fatura_Dekont.png',
    url: 'https://images.unsplash.com/photo-1554415707-9e44667ff4f6?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1554415707-9e44667ff4f6?auto=format&fit=crop&w=400&q=80',
    sizeBytes: 2.1 * 1024 * 1024,
    mimeType: 'image/png',
    createdAt: '2026-10-02T14:22:00Z',
    year: 2026,
    month: 10,
    monthLabel: 'Ekim 2026',
    albumName: 'Ekran Görüntüleri',
    hasPerson: false,
    category: 'screenshots',
    description: 'Ekran görüntüsü • Eski fiş/dekont',
    status: 'pending',
  },
  {
    id: 'demo-3',
    source: 'demo',
    name: 'IMG_8820_Portre_Kadin.jpg',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    sizeBytes: 6.9 * 1024 * 1024,
    mimeType: 'image/jpeg',
    createdAt: '2026-09-24T16:10:00Z',
    year: 2026,
    month: 9,
    monthLabel: 'Eylül 2026',
    albumName: 'Portreler & İnsanlar',
    hasPerson: true,
    category: 'people',
    description: 'Portre fotoğrafı • İnsan algılandı',
    status: 'pending',
  },
  {
    id: 'demo-4',
    source: 'demo',
    name: 'DSC_8941_Kapadokya_Balonlar.jpg',
    url: 'https://images.unsplash.com/photo-1527838832700-5059252407fa?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1527838832700-5059252407fa?auto=format&fit=crop&w=400&q=80',
    sizeBytes: 8.4 * 1024 * 1024,
    mimeType: 'image/jpeg',
    createdAt: '2026-09-18T06:30:00Z',
    year: 2026,
    month: 9,
    monthLabel: 'Eylül 2026',
    albumName: 'Doğa & Manzara',
    hasPerson: false,
    category: 'landscapes',
    description: 'Kapadokya gün doğumu balonu',
    status: 'pending',
  },
  {
    id: 'demo-5',
    source: 'demo',
    name: 'IMG_9100_Selfie_Grup_Arkadaslar.jpg',
    url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=400&q=80',
    sizeBytes: 5.2 * 1024 * 1024,
    mimeType: 'image/jpeg',
    createdAt: '2026-08-12T19:30:00Z',
    year: 2026,
    month: 8,
    monthLabel: 'Ağustos 2026',
    albumName: 'Portreler & İnsanlar',
    hasPerson: true,
    category: 'people',
    description: 'Grup selfie çekimi • İnsanlar',
    status: 'pending',
  },
  {
    id: 'demo-6',
    source: 'demo',
    name: 'WhatsApp_Gorsel_Memes_Komik.jpg',
    url: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=400&q=80',
    sizeBytes: 1.4 * 1024 * 1024,
    mimeType: 'image/jpeg',
    createdAt: '2025-11-10T11:05:00Z',
    year: 2025,
    month: 11,
    monthLabel: 'Kasım 2025',
    albumName: 'WhatsApp Medya',
    hasPerson: false,
    category: 'whatsapp',
    description: 'WhatsApp Medya Grubu • İstenmeyen görsel',
    status: 'pending',
  },
  {
    id: 'demo-7',
    source: 'demo',
    name: 'IMG_2025_Aile_Portresi_Park.jpg',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    sizeBytes: 6.1 * 1024 * 1024,
    mimeType: 'image/jpeg',
    createdAt: '2025-06-20T17:40:00Z',
    year: 2025,
    month: 6,
    monthLabel: 'Haziran 2025',
    albumName: 'Portreler & İnsanlar',
    hasPerson: true,
    category: 'people',
    description: 'Park portre fotoğrafı • İnsan algılandı',
    status: 'pending',
  },
  {
    id: 'demo-8',
    source: 'demo',
    name: 'IMG_4412_Cift_Cekim_Kopya.jpg',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
    sizeBytes: 5.6 * 1024 * 1024,
    mimeType: 'image/jpeg',
    createdAt: '2025-05-15T18:45:00Z',
    year: 2025,
    month: 5,
    monthLabel: 'Mayıs 2025',
    albumName: 'Doğa & Manzara',
    hasPerson: false,
    category: 'landscapes',
    description: 'Sahil gün batımı • Benzer poz kopyası',
    status: 'pending',
  },
  {
    id: 'demo-9',
    source: 'demo',
    name: 'DSC_2024_Bebek_Portre_Kare.jpg',
    url: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=400&q=80',
    sizeBytes: 4.3 * 1024 * 1024,
    mimeType: 'image/jpeg',
    createdAt: '2024-04-12T14:10:00Z',
    year: 2024,
    month: 4,
    monthLabel: 'Nisan 2024',
    albumName: 'Portreler & İnsanlar',
    hasPerson: true,
    category: 'people',
    description: 'Gülümseyen çocuk portresi • İnsan',
    status: 'pending',
  },
  {
    id: 'demo-10',
    source: 'demo',
    name: 'IMG_0128_Karanlik_Gece_Karesi.jpg',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
    sizeBytes: 3.2 * 1024 * 1024,
    mimeType: 'image/jpeg',
    createdAt: '2024-01-30T23:55:00Z',
    year: 2024,
    month: 1,
    monthLabel: 'Ocak 2024',
    albumName: 'Kamera / Galeri',
    hasPerson: false,
    category: 'other',
    description: 'Karanlık ve bozuk pozlama',
    status: 'pending',
  },
];
