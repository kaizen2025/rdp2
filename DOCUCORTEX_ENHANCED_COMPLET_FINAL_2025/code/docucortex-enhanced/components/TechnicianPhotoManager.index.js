// Exportations principales
export { default as TechnicianPhotoManager } from './TechnicianPhotoManager.js';
export { TechnicianPhotoGrid, TechnicianPhotoGallery } from './TechnicianPhotoManager.js';
export { useTechnicianPhotos } from './TechnicianPhotoManager.js';

// Exportations utilitaires
export {
  preloadImage,
  clearImageCache,
  getImageCacheSize
} from './TechnicianPhotoManager.js';

// Exportation du hook
export { useIntersectionObserver } from './hooks/useIntersectionObserver.js';