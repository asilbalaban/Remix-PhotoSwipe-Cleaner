import { PhotoCategory } from '../types';

export const formatBytes = (bytes: number, decimals = 1): string => {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
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

export const datePartsOf = (date: Date) => ({
  year: date.getFullYear(),
  month: date.getMonth() + 1,
  monthLabel: date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
});

/** Category from what the file name and its folder say; nothing is guessed from the image itself */
export const categorizePhoto = (name: string, albumName: string): PhotoCategory => {
  const text = `${name} ${albumName}`.toLowerCase();
  if (text.includes('screenshot') || text.includes('ekran')) return 'screenshots';
  if (text.includes('whatsapp')) return 'whatsapp';
  if (['fatura', 'dekont', 'belge', 'receipt', 'scan', 'document'].some((word) => text.includes(word))) {
    return 'documents';
  }
  return 'other';
};
