export type PhotoCategory = 'screenshots' | 'whatsapp' | 'documents' | 'other';

export interface PhotoItem {
  id: string;
  source: 'local';
  name: string;
  url: string;
  thumbnailUrl: string;
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
  year: number;
  month: number; // 1-12
  monthLabel: string; // e.g. "Ekim 2026"
  albumName: string; // e.g. "Camera", "Screenshots", "WhatsApp Images"
  category: PhotoCategory;
  width?: number;
  height?: number;
}

export type SwipeDirection = 'left' | 'right' | 'up';
export type AppTab = 'profile' | 'swipe' | 'gallery';

export interface CleanerStats {
  totalReviewed: number;
  keptCount: number;
  deletedCount: number;
  favoritedCount: number;
  freedBytes: number;
}

export type SortOrder = 'newest' | 'oldest' | 'largest' | 'smallest' | 'name' | 'random';

export const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'newest', label: 'En Yeni' },
  { value: 'oldest', label: 'En Eski' },
  { value: 'largest', label: 'En Büyük' },
  { value: 'smallest', label: 'En Küçük' },
  { value: 'name', label: 'Ada Göre' },
  { value: 'random', label: 'Rastgele' },
];

export interface FilterState {
  sortBy: SortOrder;
  selectedYear: number | 'all';
  selectedMonth: number | 'all'; // 1-12 or 'all'
  selectedAlbum: string | 'all';
  category: 'all' | 'screenshots' | 'large';
}

export const DEFAULT_FILTERS: FilterState = {
  sortBy: 'newest',
  selectedYear: 'all',
  selectedMonth: 'all',
  selectedAlbum: 'all',
  category: 'all',
};

/** Photos at or above this size match the "large files" filter */
export const LARGE_FILE_BYTES = 4 * 1024 * 1024;
