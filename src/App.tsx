import React, { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  PhotoItem,
  SwipeDirection,
  CleanerStats,
  FilterState,
  AppTab,
  SortOrder,
  DEFAULT_FILTERS,
  LARGE_FILE_BYTES,
} from './types';
import { formatBytes } from './services/photoUtils';
import {
  fetchDevicePhotos,
  deleteDevicePhotos,
  hasGalleryPermission,
  isDevicePhoto,
  isDeviceGalleryAvailable,
  photosFromFiles,
} from './services/localGallery';
import { AndroidFrame } from './components/AndroidFrame';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { WelcomeView } from './components/WelcomeView';
import { ProfileView } from './components/ProfileView';
import { SwipeCard } from './components/SwipeCard';
import { ActionControls } from './components/ActionControls';
import { ReviewTrashModal } from './components/ReviewTrashModal';
import { PhotoPreviewModal } from './components/PhotoPreviewModal';
import { BatchCompleteView } from './components/BatchCompleteView';
import { FilterDrawer } from './components/FilterDrawer';
import { BatchGalleryView } from './components/BatchGalleryView';

// Stable pseudo-random rank per photo, so the "random" order does not reshuffle on every render
const randomRank = (id: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i++) {
    hash = Math.imul(hash ^ id.charCodeAt(i), 16777619);
  }
  return hash >>> 0;
};

const PHOTO_COMPARATORS: Record<SortOrder, (a: PhotoItem, b: PhotoItem) => number> = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
  largest: (a, b) => b.sizeBytes - a.sizeBytes,
  smallest: (a, b) => a.sizeBytes - b.sizeBytes,
  name: (a, b) => a.name.localeCompare(b.name, 'tr', { numeric: true }),
  random: (a, b) => randomRank(a.id) - randomRank(b.id),
};

const EMPTY_STATS: CleanerStats = {
  totalReviewed: 0,
  keptCount: 0,
  deletedCount: 0,
  favoritedCount: 0,
  freedBytes: 0,
};

const useFilePicker = !isDeviceGalleryAvailable();

// Photos kept in earlier sessions are remembered so they are not suggested again
const REVIEWED_STORAGE_KEY = 'cleanswipe.reviewedIds';

const loadReviewedIds = (): Set<string> => {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(REVIEWED_STORAGE_KEY) || '[]'));
  } catch {
    return new Set<string>();
  }
};

const saveReviewedIds = (ids: Set<string>) => {
  try {
    localStorage.setItem(REVIEWED_STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // storage full or unavailable: the photos are simply suggested again next time
  }
};

export default function App() {
  const [allPhotos, setAllPhotos] = useState<PhotoItem[]>([]);
  // False until the gallery (or picked files) has been loaded; the welcome screen shows meanwhile
  const [hasGallery, setHasGallery] = useState(false);
  // True while checking at startup whether the gallery permission was already granted
  const [isStarting, setIsStarting] = useState(!useFilePicker);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [isSimulatedFrame, setIsSimulatedFrame] = useState(true);

  const [activeTab, setActiveTab] = useState<AppTab>('swipe');

  // Sort & Filter Drawer State (Order, Type, Year, Month, Album)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Batch Multi-Select state
  const [batchSelectedIds, setBatchSelectedIds] = useState<string[]>([]);

  // Swipe Action History for Undo
  const [swipeHistory, setSwipeHistory] = useState<{ photo: PhotoItem; direction: SwipeDirection }[]>([]);

  // Trash Queue
  const [trashQueue, setTrashQueue] = useState<PhotoItem[]>([]);
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);
  const [isProcessingTrash, setIsProcessingTrash] = useState(false);

  // Preview Modal
  const [previewPhoto, setPreviewPhoto] = useState<PhotoItem | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Statistics
  const [stats, setStats] = useState<CleanerStats>(EMPTY_STATS);

  // Photos the user kept or favorited. They leave the list at once and stay out across restarts.
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(loadReviewedIds);

  const updateReviewedIds = useCallback((change: (ids: Set<string>) => void) => {
    setReviewedIds((prev) => {
      const next = new Set(prev);
      change(next);
      saveReviewedIds(next);
      return next;
    });
  }, []);

  const handleResetReviewed = () => {
    updateReviewedIds((ids) => ids.clear());
    setSwipeHistory([]);
    showToast('İnceleme geçmişi sıfırlandı, tüm fotoğraflar yeniden gösterilecek.');
  };

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3200);
  }, []);

  // Fetch photos from the device gallery (asks for the permission when needed)
  const loadDeviceGallery = useCallback(async () => {
    setIsLoadingPhotos(true);
    try {
      const { photos, total } = await fetchDevicePhotos();
      if (photos.length === 0) {
        showToast('Galeride fotoğraf bulunamadı.');
        return;
      }

      setAllPhotos(photos);
      setSwipeHistory([]);
      setTrashQueue([]);
      setBatchSelectedIds([]);
      setHasGallery(true);
      showToast(
        total > photos.length
          ? `Galerideki ${total} fotoğraftan en yeni ${photos.length} tanesi yüklendi.`
          : `${photos.length} fotoğraf yüklendi.`
      );
    } catch (err: any) {
      console.error('Cihaz galerisi yükleme hatası:', err);
      showToast(
        err?.code === 'PERMISSION_DENIED'
          ? 'Galeri izni verilmedi. Devam etmek için fotoğraflara erişim izni gerekiyor.'
          : `Hata: ${err?.message || 'Galeri okunamadı'}`
      );
    } finally {
      setIsLoadingPhotos(false);
    }
  }, [showToast]);

  // Open straight into the gallery when the permission was granted on an earlier run
  useEffect(() => {
    if (useFilePicker) return;
    hasGalleryPermission()
      .then((granted) => (granted ? loadDeviceGallery() : undefined))
      .catch((err) => console.error('Galeri izni kontrol edilemedi:', err))
      .finally(() => setIsStarting(false));
  }, [loadDeviceGallery]);

  // Browser: photos picked with the file input
  const handleLocalFilesPicked = (files: FileList) => {
    const newItems = photosFromFiles(files);
    setAllPhotos((prev) => [...newItems, ...prev]);
    setHasGallery(true);
    showToast(`${newItems.length} fotoğraf eklendi.`);
  };

  // Available Years from photo collection
  const availableYears = useMemo(() => {
    const set = new Set<number>();
    allPhotos.forEach((p) => {
      if (p.year) set.add(p.year);
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [allPhotos]);

  // Available Albums from photo collection
  const availableAlbums = useMemo(() => {
    const set = new Set<string>();
    allPhotos.forEach((p) => {
      if (p.albumName) set.add(p.albumName);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [allPhotos]);

  const trashQueueIds = useMemo(() => new Set(trashQueue.map((p) => p.id)), [trashQueue]);

  // Photos still waiting for a decision: not kept, not queued for deletion, matching the
  // Type, Year, Month and Album filters, in the chosen sort order. The first one is the front card.
  const filteredPhotos = useMemo(() => {
    const matching = allPhotos.filter((p) => {
      if (reviewedIds.has(p.id) || trashQueueIds.has(p.id)) return false;
      if (filters.selectedYear !== 'all' && p.year !== filters.selectedYear) return false;
      if (filters.selectedMonth !== 'all' && p.month !== filters.selectedMonth) return false;
      if (filters.selectedAlbum !== 'all' && p.albumName !== filters.selectedAlbum) return false;
      if (filters.category === 'screenshots' && p.category !== 'screenshots') return false;
      if (filters.category === 'large' && p.sizeBytes < LARGE_FILE_BYTES) return false;
      return true;
    });
    return matching.sort(PHOTO_COMPARATORS[filters.sortBy]);
  }, [allPhotos, filters, reviewedIds, trashQueueIds]);

  const hasActiveFilters = useMemo(
    () => (Object.keys(DEFAULT_FILTERS) as (keyof FilterState)[]).some((key) => filters[key] !== DEFAULT_FILTERS[key]),
    [filters]
  );

  // A batch selection only makes sense for the list it was made in
  useEffect(() => {
    setBatchSelectedIds([]);
  }, [filters]);

  // Current active cards in stack (up to 3 for visual depth)
  const visibleCards = useMemo(() => filteredPhotos.slice(0, 3), [filteredPhotos]);

  const hasMorePhotos = filteredPhotos.length > 0;
  const pendingCount = filteredPhotos.length;

  // Swipe Action Handler
  const handleSwipe = useCallback(
    (direction: SwipeDirection) => {
      const currentPhoto = filteredPhotos[0];
      if (!currentPhoto) return;

      setSwipeHistory((prev) => [...prev, { photo: currentPhoto, direction }]);

      if (direction === 'left') {
        // Queue for trash
        setTrashQueue((prev) => (prev.some((p) => p.id === currentPhoto.id) ? prev : [...prev, currentPhoto]));
        setStats((prev) => ({
          ...prev,
          totalReviewed: prev.totalReviewed + 1,
          deletedCount: prev.deletedCount + 1,
        }));
      } else {
        updateReviewedIds((ids) => ids.add(currentPhoto.id));
      }

      if (direction === 'right') {
        // Keep
        setStats((prev) => ({
          ...prev,
          totalReviewed: prev.totalReviewed + 1,
          keptCount: prev.keptCount + 1,
        }));
      } else if (direction === 'up') {
        // Favorite
        setStats((prev) => ({
          ...prev,
          totalReviewed: prev.totalReviewed + 1,
          favoritedCount: prev.favoritedCount + 1,
        }));
      }
    },
    [filteredPhotos, updateReviewedIds]
  );

  // Undo Last Action: the photo goes back into the list
  const handleUndo = useCallback(() => {
    if (swipeHistory.length === 0) return;

    const lastAction = swipeHistory[swipeHistory.length - 1];
    setSwipeHistory((prev) => prev.slice(0, -1));

    if (lastAction.direction !== 'left') {
      updateReviewedIds((ids) => ids.delete(lastAction.photo.id));
    }

    if (lastAction.direction === 'left') {
      setTrashQueue((prev) => prev.filter((p) => p.id !== lastAction.photo.id));
      setStats((prev) => ({
        ...prev,
        totalReviewed: Math.max(0, prev.totalReviewed - 1),
        deletedCount: Math.max(0, prev.deletedCount - 1),
      }));
    } else if (lastAction.direction === 'right') {
      setStats((prev) => ({
        ...prev,
        totalReviewed: Math.max(0, prev.totalReviewed - 1),
        keptCount: Math.max(0, prev.keptCount - 1),
      }));
    } else if (lastAction.direction === 'up') {
      setStats((prev) => ({
        ...prev,
        totalReviewed: Math.max(0, prev.totalReviewed - 1),
        favoritedCount: Math.max(0, prev.favoritedCount - 1),
      }));
    }

    showToast('Son hareket geri alındı');
  }, [swipeHistory, showToast, updateReviewedIds]);

  // Keyboard navigation for Swipe mode
  useEffect(() => {
    if (activeTab !== 'swipe' || !hasGallery) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTrashModalOpen || previewPhoto || isFilterDrawerOpen) return;
      if (e.key === 'ArrowLeft') {
        handleSwipe('left');
      } else if (e.key === 'ArrowRight') {
        handleSwipe('right');
      } else if (e.key === 'ArrowUp') {
        handleSwipe('up');
      } else if (e.key === 'z' || e.key === 'Z') {
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSwipe, handleUndo, isTrashModalOpen, previewPhoto, isFilterDrawerOpen, activeTab, hasGallery]);

  // Batch Multi-Select Handlers
  const handleToggleBatchSelect = (id: string) => {
    setBatchSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleQueueBatchForTrash = () => {
    if (batchSelectedIds.length === 0) return;
    const selectedSet = new Set(batchSelectedIds);
    const selectedPhotos = filteredPhotos.filter((p) => selectedSet.has(p.id));
    setTrashQueue((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      return [...prev, ...selectedPhotos.filter((p) => !existingIds.has(p.id))];
    });
    setBatchSelectedIds([]);
    setIsTrashModalOpen(true);
  };

  // Trash Confirmation Execution (the only place photos are actually deleted)
  const handleConfirmTrash = async (selectedIds: string[], permanent: boolean) => {
    setIsProcessingTrash(true);
    const selectedSet = new Set(selectedIds);
    const selected = trashQueue.filter((p) => selectedSet.has(p.id));
    const devicePhotos = selected.filter(isDevicePhoto);
    // Picked in the browser: they can only be dropped from the list
    const removedIds = new Set(selected.filter((p) => !isDevicePhoto(p)).map((p) => p.id));
    let deletedBytes = 0;
    let notice: string | null = null;

    try {
      // One system confirmation dialog covers the whole batch
      if (devicePhotos.length > 0) {
        const confirmed = await deleteDevicePhotos(devicePhotos, permanent);
        if (confirmed) {
          devicePhotos.forEach((photo) => {
            removedIds.add(photo.id);
            deletedBytes += photo.sizeBytes;
          });
          notice = permanent
            ? `${devicePhotos.length} fotoğraf kalıcı olarak silindi (${formatBytes(deletedBytes)}).`
            : `${devicePhotos.length} fotoğraf çöp kutusuna taşındı (${formatBytes(deletedBytes)}).`;
        } else {
          notice = 'Silme iptal edildi, fotoğrafların yerinde duruyor.';
        }
      } else if (removedIds.size > 0) {
        notice = `${removedIds.size} fotoğraf listeden kaldırıldı. Dosyalar cihazında duruyor.`;
      }

      if (removedIds.size > 0) {
        // Photos the user unticked in the review are a decision to keep them
        const sparedIds = trashQueue.filter((p) => !selectedSet.has(p.id)).map((p) => p.id);
        if (sparedIds.length > 0) {
          updateReviewedIds((ids) => sparedIds.forEach((id) => ids.add(id)));
        }
        setAllPhotos((prev) => prev.filter((p) => !removedIds.has(p.id)));
        setTrashQueue([]);
        setSwipeHistory([]);
        setStats((prev) => ({ ...prev, freedBytes: prev.freedBytes + deletedBytes }));
        setIsTrashModalOpen(false);
      }

      if (deletedBytes > 0) {
        try {
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.5 },
            colors: ['#FFC629', '#1D1D1B', '#FFFFFF'],
          });
        } catch {
          // ignore
        }
      }
    } catch (err: any) {
      console.error('Silme işleminde hata:', err);
      notice = `Silinemedi: ${err?.message || 'Bilinmeyen hata'}`;
    } finally {
      setIsProcessingTrash(false);
      if (notice) showToast(notice);
    }
  };

  const trashedQueueBytes = useMemo(() => {
    return trashQueue.reduce((acc, p) => acc + p.sizeBytes, 0);
  }, [trashQueue]);

  return (
    <AndroidFrame isSimulatedFrame={isSimulatedFrame} onToggleFrame={() => setIsSimulatedFrame(!isSimulatedFrame)}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-3 inset-x-4 z-[60] pointer-events-none">
          <div className="mx-auto max-w-sm px-4 py-3 rounded-2xl bg-ink shadow-xl text-xs font-semibold text-white text-center leading-snug">
            {toastMessage}
          </div>
        </div>
      )}

      {!hasGallery ? (
        isStarting ? (
          <div className="flex-1 flex items-center justify-center bg-white">
            <span className="w-8 h-8 border-[3px] border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          /* Welcome: nothing is loaded until the user grants access to the gallery */
          <WelcomeView
            onUseDeviceGallery={loadDeviceGallery}
            onLocalFilesPicked={handleLocalFilesPicked}
            useFilePicker={useFilePicker}
            isLoading={isLoadingPhotos}
          />
        )
      ) : (
        <>
          <TopBar
            pendingCount={pendingCount}
            onOpenFilters={() => setIsFilterDrawerOpen(true)}
            hasActiveFilters={hasActiveFilters}
          />

          {activeTab === 'swipe' && (
            <>
              <main className="flex-1 min-h-0 relative w-full flex flex-col items-center justify-center overflow-hidden">
                {hasMorePhotos ? (
                  /* Render cards in reverse so top card renders on top */
                  visibleCards
                    .map((photo, idx) => (
                      <SwipeCard
                        key={photo.id}
                        photo={photo}
                        isFront={idx === 0}
                        depthIndex={idx}
                        onSwipe={handleSwipe}
                        onOpenPreview={setPreviewPhoto}
                      />
                    ))
                    .reverse()
                ) : (
                  <BatchCompleteView
                    stats={stats}
                    trashedCount={trashQueue.length}
                    trashedBytes={trashedQueueBytes}
                    onOpenTrashModal={() => setIsTrashModalOpen(true)}
                    onReset={handleResetReviewed}
                    onOpenFilters={() => setIsFilterDrawerOpen(true)}
                  />
                )}
              </main>

              {(hasMorePhotos || swipeHistory.length > 0) && (
                <ActionControls
                  canUndo={swipeHistory.length > 0}
                  onUndo={handleUndo}
                  onSwipeAction={handleSwipe}
                />
              )}
            </>
          )}

          {activeTab === 'gallery' && (
            <BatchGalleryView
              photos={filteredPhotos}
              selectedIds={batchSelectedIds}
              onToggleSelect={handleToggleBatchSelect}
              onSelectAll={() => setBatchSelectedIds(filteredPhotos.map((p) => p.id))}
              onDeselectAll={() => setBatchSelectedIds([])}
              onOpenPreview={setPreviewPhoto}
              onQueueSelectedForTrash={handleQueueBatchForTrash}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              stats={stats}
              totalPhotos={allPhotos.length}
              trashedCount={trashQueue.length}
              trashedBytes={trashedQueueBytes}
              onOpenTrash={() => setIsTrashModalOpen(true)}
              onReloadGallery={loadDeviceGallery}
              onLocalFilesPicked={handleLocalFilesPicked}
              useFilePicker={useFilePicker}
              isLoading={isLoadingPhotos}
              hiddenReviewedCount={allPhotos.filter((p) => reviewedIds.has(p.id)).length}
              onResetReviewed={handleResetReviewed}
            />
          )}

          <BottomNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
            trashedCount={trashQueue.length}
            onOpenTrash={() => setIsTrashModalOpen(true)}
          />

          {/* Modal: Full Resolution Preview */}
          <PhotoPreviewModal photo={previewPhoto} onClose={() => setPreviewPhoto(null)} />

          {/* Drawer: Sort order, type, timeline (Year / Month) & album filter */}
          <FilterDrawer
            isOpen={isFilterDrawerOpen}
            onClose={() => setIsFilterDrawerOpen(false)}
            filters={filters}
            onFilterChange={setFilters}
            availableYears={availableYears}
            availableAlbums={availableAlbums}
            totalMatchingCount={filteredPhotos.length}
          />

          {/* Modal: Destructive Trash & Delete Review */}
          <ReviewTrashModal
            trashQueue={trashQueue}
            isOpen={isTrashModalOpen}
            onClose={() => setIsTrashModalOpen(false)}
            onConfirmTrash={handleConfirmTrash}
            isProcessing={isProcessingTrash}
            canDeleteFiles={!useFilePicker}
          />
        </>
      )}
    </AndroidFrame>
  );
}
