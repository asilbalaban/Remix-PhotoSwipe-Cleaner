import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User } from 'firebase/auth';
import confetti from 'canvas-confetti';
import { PhotoItem, SwipeDirection, CleanerStats, FilterState, ViewMode } from './types';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  setCachedAccessToken,
} from './services/auth';
import {
  fetchDrivePhotos,
  fetchPhotosLibrary,
  moveFileToDriveTrash,
  deleteDriveFilePermanent,
  safeDeleteOrTrashPhoto,
  getDemoPhotos,
  formatBytes,
  getAuthenticatedBlobUrl,
} from './services/googlePhotosService';
import { AndroidFrame } from './components/AndroidFrame';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { StorageStatsCard } from './components/StorageStatsCard';
import { SwipeCard } from './components/SwipeCard';
import { ActionControls } from './components/ActionControls';
import { ReviewTrashModal } from './components/ReviewTrashModal';
import { PhotoPreviewModal } from './components/PhotoPreviewModal';
import { BatchCompleteView } from './components/BatchCompleteView';
import { FilterDrawer } from './components/FilterDrawer';
import { BatchGalleryView } from './components/BatchGalleryView';
import { AppInfoModal } from './components/AppInfoModal';
import { Sparkles, ShieldCheck } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [cachedToken, setCachedToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [allPhotos, setAllPhotos] = useState<PhotoItem[]>(() => getDemoPhotos());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [isSimulatedFrame, setIsSimulatedFrame] = useState(true);

  // View Mode: 'swipe' (one-by-one card) or 'grid' (toplu seç ve sil)
  const [viewMode, setViewMode] = useState<ViewMode>('swipe');

  // Filter Drawer State (Year, Month, Album, Person)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    selectedYear: 'all',
    selectedMonth: 'all',
    selectedAlbum: 'all',
    category: 'all',
  });

  // Batch Multi-Select state
  const [batchSelectedIds, setBatchSelectedIds] = useState<string[]>([]);
  const [isAppInfoOpen, setIsAppInfoOpen] = useState(false);

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
  const [stats, setStats] = useState<CleanerStats>({
    totalReviewed: 0,
    keptCount: 0,
    deletedCount: 0,
    favoritedCount: 0,
    freedBytes: 0,
  });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3200);
  }, []);

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (authedUser, token) => {
        setUser(authedUser);
        setCachedAccessToken(token);
        setCachedToken(token);
        loadUserPhotos(token);
      },
      () => {
        setUser(null);
        setCachedAccessToken(null);
        setCachedToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch photos from Google Drive & Photos
  const loadUserPhotos = async (tokenOverride?: string) => {
    const token = tokenOverride || cachedToken || (await getAccessToken());
    if (!token) {
      showToast('Lütfen önce Google hesabınızla giriş yapın.');
      return;
    }

    setCachedToken(token);
    setIsLoadingPhotos(true);
    try {
      const drivePhotos = await fetchDrivePhotos(token);
      let photosLibPhotos: PhotoItem[] = [];

      try {
        photosLibPhotos = await fetchPhotosLibrary(token);
      } catch (e) {
        console.warn('Google Photos Library API opsiyonel kontrolü geçildi:', e);
      }

      const combined = [...drivePhotos, ...photosLibPhotos];

      if (combined.length > 0) {
        setAllPhotos(combined);
        setCurrentIndex(0);
        setSwipeHistory([]);
        setTrashQueue([]);
        setBatchSelectedIds([]);
        setIsDemoMode(false);
        showToast(`${combined.length} fotoğraf Google hesabınızdan yüklendi!`);
      } else {
        showToast('Google hesabınızda görsel bulunamadı, örnek galeri yüklendi.');
        setAllPhotos(getDemoPhotos());
        setIsDemoMode(true);
      }
    } catch (err: any) {
      console.error('Fotoğraf yükleme hatası:', err);
      showToast(`Hata: ${err.message || 'Fotoğraflar yüklenemedi'}`);
    } finally {
      setIsLoadingPhotos(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setCachedToken(result.accessToken);
        await loadUserPhotos(result.accessToken);
      }
    } catch (err: any) {
      showToast(`Giriş başarısız: ${err.message || 'Bilinmeyen hata'}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setCachedToken(null);
    setAllPhotos(getDemoPhotos());
    setIsDemoMode(true);
    setCurrentIndex(0);
    setSwipeHistory([]);
    setTrashQueue([]);
    setBatchSelectedIds([]);
    showToast('Google oturumunuz kapatıldı. Örnek moda geçildi.');
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
    return Array.from(set).sort();
  }, [allPhotos]);

  // Filtered photos based on Year, Month, Album, and Person category
  const filteredPhotos = useMemo(() => {
    return allPhotos.filter((p) => {
      if (filters.selectedYear !== 'all' && p.year !== filters.selectedYear) return false;
      if (filters.selectedMonth !== 'all' && p.month !== filters.selectedMonth) return false;
      if (filters.selectedAlbum !== 'all' && p.albumName !== filters.selectedAlbum) return false;
      if (filters.category === 'people' && !p.hasPerson) return false;
      if (filters.category === 'non-people' && p.hasPerson) return false;
      if (filters.category === 'screenshots' && p.category !== 'screenshots') return false;
      if (filters.category === 'large' && p.sizeBytes < 4 * 1024 * 1024) return false;
      return true;
    });
  }, [allPhotos, filters]);

  // Summary badge for active filter
  const activeFilterSummary = useMemo(() => {
    const parts: string[] = [];
    if (filters.selectedYear !== 'all') parts.push(`${filters.selectedYear}`);
    if (filters.selectedMonth !== 'all') {
      const monthNames = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
      ];
      parts.push(monthNames[filters.selectedMonth - 1] || '');
    }
    if (filters.selectedAlbum !== 'all') parts.push(filters.selectedAlbum);
    if (filters.category === 'people') parts.push('👤 İnsanlar');
    if (filters.category === 'non-people') parts.push('🏞️ İnsan Olmayanlar');
    return parts.length > 0 ? parts.join(' • ') : null;
  }, [filters]);

  // Reset index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
    setBatchSelectedIds([]);
  }, [filters]);

  // Current active cards in stack (up to 3 for visual depth)
  const visibleCards = useMemo(() => {
    return filteredPhotos.slice(currentIndex, currentIndex + 3);
  }, [filteredPhotos, currentIndex]);

  // Prefetch authenticated image blobs for visible cards
  useEffect(() => {
    if (cachedToken && visibleCards.length > 0) {
      visibleCards.forEach((c) => {
        if (c.source === 'google-drive') {
          getAuthenticatedBlobUrl(c.id, cachedToken);
        }
      });
    }
  }, [visibleCards, cachedToken]);

  const hasMorePhotos = currentIndex < filteredPhotos.length;
  const pendingCount = Math.max(0, filteredPhotos.length - currentIndex);

  // Swipe Action Handler
  const handleSwipe = useCallback(
    (direction: SwipeDirection) => {
      if (!hasMorePhotos) return;

      const currentPhoto = filteredPhotos[currentIndex];
      if (!currentPhoto) return;

      setSwipeHistory((prev) => [...prev, { photo: currentPhoto, direction }]);

      if (direction === 'left') {
        // Queue for trash
        setTrashQueue((prev) => [...prev, currentPhoto]);
        setStats((prev) => ({
          ...prev,
          totalReviewed: prev.totalReviewed + 1,
          deletedCount: prev.deletedCount + 1,
        }));
      } else if (direction === 'right') {
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

      setCurrentIndex((prev) => prev + 1);
    },
    [filteredPhotos, currentIndex, hasMorePhotos]
  );

  // Undo Last Action
  const handleUndo = useCallback(() => {
    if (swipeHistory.length === 0 || currentIndex === 0) return;

    const lastAction = swipeHistory[swipeHistory.length - 1];
    setSwipeHistory((prev) => prev.slice(0, -1));

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

    setCurrentIndex((prev) => Math.max(0, prev - 1));
    showToast(`"${lastAction.photo.name.slice(0, 16)}..." geri alındı`);
  }, [swipeHistory, currentIndex, showToast]);

  // Keyboard navigation for Swipe mode
  useEffect(() => {
    if (viewMode !== 'swipe') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTrashModalOpen || previewPhoto || isFilterDrawerOpen) return;
      if (e.key === 'ArrowLeft') {
        handleSwipe('left');
      } else if (e.key === 'ArrowRight') {
        handleSwipe('right');
      } else if (e.key === 'ArrowUp') {
        handleSwipe('up');
      } else if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey || true)) {
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSwipe, handleUndo, isTrashModalOpen, previewPhoto, isFilterDrawerOpen, viewMode]);

  // Batch Multi-Select Handlers (Toplu Seç ve Sil)
  const handleToggleBatchSelect = (id: string) => {
    setBatchSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllBatch = () => {
    setBatchSelectedIds(filteredPhotos.map((p) => p.id));
  };

  const handleDeselectAllBatch = () => {
    setBatchSelectedIds([]);
  };

  const handleSelectPeopleOnly = () => {
    const peopleIds = filteredPhotos.filter((p) => p.hasPerson).map((p) => p.id);
    setBatchSelectedIds(peopleIds);
    showToast(`${peopleIds.length} insan fotoğrafı seçildi.`);
  };

  const handleSelectNonPeopleOnly = () => {
    const nonPeopleIds = filteredPhotos.filter((p) => !p.hasPerson).map((p) => p.id);
    setBatchSelectedIds(nonPeopleIds);
    showToast(`${nonPeopleIds.length} insan içermeyen fotoğraf seçildi.`);
  };

  const handleQueueBatchForTrash = () => {
    if (batchSelectedIds.length === 0) return;
    const selectedPhotos = filteredPhotos.filter((p) => batchSelectedIds.includes(p.id));
    setTrashQueue((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const newlyAdded = selectedPhotos.filter((p) => !existingIds.has(p.id));
      return [...prev, ...newlyAdded];
    });
    setBatchSelectedIds([]);
    setIsTrashModalOpen(true);
  };

  // Trash Confirmation Execution (Destructive operation per Workspace rules)
  const handleConfirmTrash = async (selectedIds: string[], permanent: boolean) => {
    setIsProcessingTrash(true);
    const token = cachedToken || (await getAccessToken());

    let successfullyDeletedBytes = 0;
    const deletedIdSet = new Set<string>();
    const statsCount = { trashed: 0, permanent: 0, failed: 0 };
    const failedItems: { name: string; error?: string }[] = [];

    try {
      for (const photoId of selectedIds) {
        const photo = trashQueue.find((p) => p.id === photoId);
        if (!photo) continue;

        if (photo.source === 'google-drive' && token) {
          const res = await safeDeleteOrTrashPhoto(token, photo.id, permanent);
          if (res.success) {
            if (res.action === 'permanently_deleted') {
              statsCount.permanent += 1;
            } else {
              statsCount.trashed += 1;
            }
            successfullyDeletedBytes += photo.sizeBytes;
            deletedIdSet.add(photo.id);
          } else {
            statsCount.failed += 1;
            failedItems.push({ name: photo.name, error: res.error });
          }
        } else {
          // Demo or local items
          successfullyDeletedBytes += photo.sizeBytes;
          deletedIdSet.add(photo.id);
          statsCount.trashed += 1;
        }
      }

      // Update state for successfully handled items
      if (deletedIdSet.size > 0) {
        setAllPhotos((prev) => prev.filter((p) => !deletedIdSet.has(p.id)));
        setTrashQueue((prev) => prev.filter((p) => !deletedIdSet.has(p.id)));
        setStats((prev) => ({
          ...prev,
          freedBytes: prev.freedBytes + successfullyDeletedBytes,
        }));
      }

      setIsTrashModalOpen(false);

      if (deletedIdSet.size > 0) {
        // Celebration confetti
        try {
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.5 },
          });
        } catch {
          // ignore
        }

        const actionText =
          statsCount.permanent > 0 && statsCount.trashed === 0
            ? 'kalıcı silindi'
            : 'çöp kutusuna taşındı';

        if (failedItems.length === 0) {
          showToast(
            `Tebrikler! ${deletedIdSet.size} fotoğraf ${actionText} (${formatBytes(
              successfullyDeletedBytes
            )} alan açıldı).`
          );
        } else {
          showToast(
            `${deletedIdSet.size} fotoğraf çöp kutusuna taşındı (${formatBytes(
              successfullyDeletedBytes
            )} alan açıldı). ${failedItems.length} adet korumalı fotoğraf Google izin kısıtlamasına takıldı.`
          );
        }
      } else if (failedItems.length > 0) {
        showToast(
          `İzin uyarısı: Bu fotoğraflar Google Fotoğraflar yedeklemesi olduğu için doğrudan Google Fotoğraflar uygulamasından silinmelidir.`
        );
      }
    } catch (err: any) {
      console.error('Silme işleminde beklenmedik hata:', err);
      showToast(`Hata: ${err.message || 'Silme işlemi tamamlanamadı'}`);
    } finally {
      setIsProcessingTrash(false);
    }
  };

  // Add Local Photos from Camera Roll
  const handleLocalPhotosAdded = (files: FileList) => {
    const newItems: PhotoItem[] = Array.from(files).map((file, idx) => ({
      id: `local-${Date.now()}-${idx}`,
      source: 'local',
      name: file.name,
      url: URL.createObjectURL(file),
      thumbnailUrl: URL.createObjectURL(file),
      sizeBytes: file.size,
      mimeType: file.type || 'image/jpeg',
      createdAt: new Date().toISOString(),
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      monthLabel: new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
      albumName: 'Cihaz Galerisi',
      hasPerson: false,
      category: 'other',
      description: 'Cihaz Galerisinden',
      status: 'pending',
    }));

    setAllPhotos((prev) => [...newItems, ...prev]);
    setCurrentIndex(0);
    showToast(`${newItems.length} yerel fotoğraf eklendi!`);
  };

  const trashedQueueBytes = useMemo(() => {
    return trashQueue.reduce((acc, p) => acc + p.sizeBytes, 0);
  }, [trashQueue]);

  return (
    <AndroidFrame
      isSimulatedFrame={isSimulatedFrame}
      onToggleFrame={() => setIsSimulatedFrame(!isSimulatedFrame)}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-10 inset-x-4 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="mx-auto max-w-sm px-4 py-2.5 rounded-2xl bg-neutral-800/95 border border-neutral-700/80 shadow-2xl flex items-center gap-2.5 text-xs text-neutral-100 backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="flex-1 font-medium leading-tight">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <Header
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isLoggingIn={isLoggingIn}
        onReload={() => loadUserPhotos()}
        isReloading={isLoadingPhotos}
        isDemoMode={isDemoMode}
        onSwitchToDemo={() => {
          setAllPhotos(getDemoPhotos());
          setIsDemoMode(true);
          setCurrentIndex(0);
          showToast('Örnek galeri yüklendi.');
        }}
        pendingCount={viewMode === 'swipe' ? pendingCount : filteredPhotos.length}
        onOpenAppInfo={() => setIsAppInfoOpen(true)}
      />

      {/* Filter Bar with Date / Album / Person / Mode */}
      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        onOpenFilterDrawer={() => setIsFilterDrawerOpen(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onLocalPhotosAdded={handleLocalPhotosAdded}
        isDemo={isDemoMode}
        onSwitchToDemo={() => {
          setAllPhotos(getDemoPhotos());
          setIsDemoMode(true);
          setCurrentIndex(0);
        }}
        activeFilterSummary={activeFilterSummary}
      />

      {/* Storage Cleaned Stats Bar */}
      <StorageStatsCard
        stats={stats}
        trashedQueueCount={trashQueue.length}
        trashedQueueBytes={trashedQueueBytes}
        onOpenTrashQueue={() => setIsTrashModalOpen(true)}
      />

      {/* Main Content: Swipe Mode VS Batch Multi-Select Grid Mode */}
      {viewMode === 'swipe' ? (
        <main className="flex-1 min-h-[350px] relative w-full flex flex-col items-center justify-center overflow-hidden px-2 py-1">
          {hasMorePhotos ? (
            <div className="relative w-full h-full min-h-[330px] max-h-[580px] flex items-center justify-center">
              {/* Render cards in reverse so top card renders on top */}
              {visibleCards
                .map((photo, idx) => (
                  <SwipeCard
                    key={photo.id}
                    photo={photo}
                    isFront={idx === 0}
                    depthIndex={idx}
                    accessToken={cachedToken}
                    onSwipe={handleSwipe}
                    onOpenPreview={setPreviewPhoto}
                  />
                ))
                .reverse()}
            </div>
          ) : (
            <BatchCompleteView
              stats={stats}
              trashedCount={trashQueue.length}
              trashedBytes={trashedQueueBytes}
              onOpenTrashModal={() => setIsTrashModalOpen(true)}
              onReset={() => {
                setCurrentIndex(0);
                setSwipeHistory([]);
              }}
              onFetchMore={() => loadUserPhotos()}
            />
          )}
        </main>
      ) : (
        /* Toplu Seç ve Sil (Batch Gallery Multi-Select Mode) */
        <main className="flex-1 min-h-0 relative w-full overflow-hidden flex flex-col">
          <BatchGalleryView
            photos={filteredPhotos}
            selectedIds={batchSelectedIds}
            onToggleSelect={handleToggleBatchSelect}
            onSelectAll={handleSelectAllBatch}
            onDeselectAll={handleDeselectAllBatch}
            onSelectPeopleOnly={handleSelectPeopleOnly}
            onSelectNonPeopleOnly={handleSelectNonPeopleOnly}
            onOpenPreview={setPreviewPhoto}
            onQueueSelectedForTrash={handleQueueBatchForTrash}
          />
        </main>
      )}

      {/* Bottom Floating Control Buttons (Only in Swipe mode) */}
      {viewMode === 'swipe' && (
        <ActionControls
          canUndo={swipeHistory.length > 0 && currentIndex > 0}
          onUndo={handleUndo}
          onSwipeAction={handleSwipe}
          trashedCount={trashQueue.length}
          onOpenTrashModal={() => setIsTrashModalOpen(true)}
        />
      )}

      {/* Modal: Full Resolution Preview */}
      <PhotoPreviewModal photo={previewPhoto} onClose={() => setPreviewPhoto(null)} />

      {/* Drawer: Detailed Timeline (Year / Month) & Album & Person Filter */}
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
        onRestorePhoto={(id) => {
          setTrashQueue((prev) => prev.filter((p) => p.id !== id));
        }}
        onConfirmTrash={handleConfirmTrash}
        isProcessing={isProcessingTrash}
      />

      {/* Modal: App & Icon Design Info */}
      <AppInfoModal isOpen={isAppInfoOpen} onClose={() => setIsAppInfoOpen(false)} />
    </AndroidFrame>
  );
}
