export type PhotoCategory = 'people' | 'screenshots' | 'landscapes' | 'documents' | 'whatsapp' | 'other';

export interface PhotoItem {
  id: string;
  source: 'google-drive' | 'google-photos' | 'demo' | 'local';
  name: string;
  url: string;
  thumbnailUrl: string;
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
  year: number;
  month: number; // 1-12
  monthLabel: string; // e.g. "Ekim 2026"
  albumName: string; // e.g. "Kamera", "WhatsApp", "Ekran Görüntüleri", "Portreler"
  hasPerson: boolean; // Detected person / selfie / portrait
  category: PhotoCategory;
  width?: number;
  height?: number;
  description?: string;
  trashedInDrive?: boolean;
  status: 'pending' | 'kept' | 'deleted' | 'favorited';
}

export type SwipeDirection = 'left' | 'right' | 'up';
export type ViewMode = 'swipe' | 'grid';

export interface CleanerStats {
  totalReviewed: number;
  keptCount: number;
  deletedCount: number;
  favoritedCount: number;
  freedBytes: number;
}

export interface FilterState {
  selectedYear: number | 'all';
  selectedMonth: number | 'all'; // 1-12 or 'all'
  selectedAlbum: string | 'all';
  category: 'all' | 'people' | 'non-people' | 'screenshots' | 'large';
}
