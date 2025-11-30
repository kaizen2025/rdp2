import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver.js';

// Cache pour les images
const imageCache = new Map();
const CACHE_SIZE_LIMIT = 50;

// Générateur d'initiales
const generateInitials = (name) => {
  if (!name) return 'T';
  const names = name.trim().split(/\s+/);
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

// Générateur de couleur basé sur le nom
const generateColorFromName = (name) => {
  if (!name) return '#6366f1';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 65%, 55%)`;
};

// Composant d'initiales avec design amélioré
const InitialsAvatar = memo(({ name, size, className }) => {
  const initials = generateInitials(name);
  const color = generateColorFromName(name);
  
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex items-center justify-center rounded-full font-semibold text-white shadow-lg ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${color}, ${color}dd)`,
        fontSize: size * 0.4
      }}
    >
      {initials}
    </motion.div>
  );
});

// Hook pour l'intersection observer (lazy loading)
const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, ...options }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [elementRef, isIntersecting];
};

// Composant de photo avec lazy loading
const PhotoImage = memo(({ 
  src, 
  alt, 
  name, 
  size, 
  onLoad, 
  onError, 
  className,
  loading = 'lazy'
}) => {
  const [imageRef, isInView] = useIntersectionObserver({
    threshold: 0.1
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imageRefInternal = useRef(null);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  // Vérifier le cache
  const getCachedImage = useCallback((url) => {
    return imageCache.get(url);
  }, []);

  // Ajouter au cache
  const addToCache = useCallback((url, img) => {
    if (imageCache.size >= CACHE_SIZE_LIMIT) {
      const firstKey = imageCache.keys().next().value;
      imageCache.delete(firstKey);
    }
    imageCache.set(url, img);
  }, []);

  // Préchargement de l'image
  useEffect(() => {
    if (!isInView || !src) return;

    const cachedImage = getCachedImage(src);
    if (cachedImage) {
      setIsLoaded(true);
      return;
    }

    const img = new Image();
    img.onload = () => {
      addToCache(src, img);
      setIsLoaded(true);
    };
    img.onerror = handleError;
    img.src = src;

    imageRefInternal.current = img;
  }, [isInView, src, getCachedImage, addToCache, handleError]);

  if (hasError) {
    return (
      <InitialsAvatar 
        name={name} 
        size={size} 
        className={className}
      />
    );
  }

  return (
    <motion.div
      ref={imageRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: isLoaded ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      {isInView && src && (
        <AnimatePresence>
          {!isLoaded && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-200 rounded-full animate-pulse flex items-center justify-center"
            >
              <div className="w-6 h-6 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.img
          key={src}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: isLoaded ? 1 : 0.8, 
            opacity: isLoaded ? 1 : 0 
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          src={src}
          alt={alt}
          className={`w-full h-full rounded-full object-cover shadow-lg ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ width: size, height: size }}
          onLoad={handleLoad}
          onError={handleError}
          loading={loading}
        />
      )}
      
      {!isInView && (
        <div 
          className="w-full h-full bg-gray-200 rounded-full animate-pulse"
          style={{ width: size, height: size }}
        />
      )}
    </motion.div>
  );
});

// Composant principal TechnicianPhotoManager
const TechnicianPhotoManager = memo(({
  technician,
  size = 48,
  className = '',
  showBorder = true,
  borderColor = 'border-white',
  onPhotoClick,
  priority = 'normal' // 'high' pour les premières images visibles
}) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const {
    name = 'Technicien',
    photo,
    email,
    firstName,
    lastName
  } = technician || {};

  const fullName = name || `${firstName || ''} ${lastName || ''}`.trim() || email || 'Technicien';

  // Déterminer la source de l'image
  const getImageSrc = useCallback(() => {
    if (photo && !imageError) {
      if (typeof photo === 'string') {
        return photo;
      }
      if (photo.url) {
        return photo.url;
      }
      if (photo.base64) {
        return photo.base64;
      }
    }
    return null;
  }, [photo, imageError]);

  const imageSrc = getImageSrc();
  
  // Classes responsives
  const getResponsiveClasses = useCallback(() => {
    const baseClasses = [
      'rounded-full overflow-hidden flex-shrink-0',
      showBorder && `border-2 ${borderColor}`,
      'transition-all duration-200',
      onPhotoClick && 'cursor-pointer'
    ].filter(Boolean).join(' ');
    
    return `${baseClasses} ${className}`;
  }, [showBorder, borderColor, className, onPhotoClick]);

  // Tailles responsives
  const getSizeClass = useCallback(() => {
    if (typeof size === 'object') {
      return `w-${size.sm || '12'} h-${size.sm || '12'}`;
    }
    const sizeMap = {
      xs: 'w-6 h-6',
      sm: 'w-8 h-8',
      md: 'w-12 h-12',
      lg: 'w-16 h-16',
      xl: 'w-20 h-20',
      '2xl': 'w-24 h-24'
    };
    return sizeMap[size] || sizeMap.md;
  }, [size]);

  const handlePhotoClick = useCallback(() => {
    if (onPhotoClick) {
      onPhotoClick(technician);
    }
  }, [onPhotoClick, technician]);

  return (
    <motion.div
      className={getResponsiveClasses()}
      style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handlePhotoClick}
      whileHover={onPhotoClick ? { scale: 1.05 } : {}}
      whileTap={onPhotoClick ? { scale: 0.95 } : {}}
    >
      <AnimatePresence mode="wait">
        {imageSrc ? (
          <PhotoImage
            key={`photo-${fullName}`}
            src={imageSrc}
            alt={`Photo de ${fullName}`}
            name={fullName}
            size={typeof size === 'number' ? size : 48}
            className={getSizeClass()}
            onLoad={() => setImageError(false)}
            onError={() => setImageError(true)}
            loading={priority === 'high' ? 'eager' : 'lazy'}
          />
        ) : (
          <InitialsAvatar
            key={`initials-${fullName}`}
            name={fullName}
            size={typeof size === 'number' ? size : 48}
            className={getSizeClass()}
          />
        )}
      </AnimatePresence>
      
      {/* Effet de survol */}
      <AnimatePresence>
        {isHovered && onPhotoClick && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-20 rounded-full flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="w-6 h-6 bg-white bg-opacity-90 rounded-full flex items-center justify-center"
            >
              <svg className="w-3 h-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// Composant pour liste de techniciens avec optimisation
export const TechnicianPhotoGrid = memo(({
  technicians = [],
  size = 48,
  maxVisible = 5,
  className = '',
  onTechnicianClick,
  showMoreCount = true
}) => {
  const visibleTechnicians = technicians.slice(0, maxVisible);
  const remainingCount = Math.max(0, technicians.length - maxVisible);

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex -space-x-2">
        {visibleTechnicians.map((tech, index) => (
          <motion.div
            key={tech.id || index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            <TechnicianPhotoManager
              technician={tech}
              size={size}
              onPhotoClick={onTechnicianClick}
              priority={index < 2 ? 'high' : 'normal'}
            />
          </motion.div>
        ))}
        
        {remainingCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: visibleTechnicians.length * 0.1 }}
            className={`relative flex items-center justify-center rounded-full bg-gray-100 text-gray-600 font-semibold border-2 border-white shadow-sm ${size === 'xs' ? 'w-6 h-6 text-xs' : size === 'sm' ? 'w-8 h-8 text-sm' : size === 'lg' ? 'w-16 h-16 text-base' : 'w-12 h-12 text-sm'}`}
          >
            {showMoreCount ? `+${remainingCount}` : '...'}
          </motion.div>
        )}
      </div>
    </div>
  );
});

// Composant pour galerie de photos
export const TechnicianPhotoGallery = memo(({
  technicians = [],
  columns = 4,
  gap = 16,
  className = '',
  onPhotoSelect
}) => {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6'
  };

  return (
    <div 
      className={`grid ${gridCols[columns]} gap-${gap / 4}`}
      style={{ gap: `${gap}px` }}
    >
      {technicians.map((tech, index) => (
        <motion.div
          key={tech.id || index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="aspect-square"
        >
          <TechnicianPhotoManager
            technician={tech}
            size="100%"
            onPhotoClick={onPhotoSelect}
            className="w-full h-full"
          />
        </motion.div>
      ))}
    </div>
  );
});

// Utilitaires
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    if (imageCache.has(src)) {
      resolve(imageCache.get(src));
      return;
    }

    const img = new Image();
    img.onload = () => {
      addToCache(src, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
};

export const clearImageCache = () => {
  imageCache.clear();
};

export const getImageCacheSize = () => {
  return imageCache.size;
};

// Hook personnalisé pour la gestion des photos
export const useTechnicianPhotos = (technician) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!technician) return;

    setIsLoading(true);
    setError(null);

    const getImageUrl = async () => {
      try {
        let url = null;
        if (technician.photo) {
          if (typeof technician.photo === 'string') {
            url = technician.photo;
          } else if (technician.photo.url) {
            url = technician.photo.url;
          } else if (technician.photo.base64) {
            url = technician.photo.base64;
          }
        }

        if (url) {
          // Vérifier le cache
          if (imageCache.has(url)) {
            setImageSrc(url);
            setIsLoading(false);
            return;
          }

          // Précharger l'image
          await preloadImage(url);
          setImageSrc(url);
        } else {
          setImageSrc(null);
        }
      } catch (err) {
        setError(err);
        setImageSrc(null);
      } finally {
        setIsLoading(false);
      }
    };

    getImageUrl();
  }, [technician]);

  return {
    imageSrc,
    isLoading,
    error,
    initials: generateInitials(technician?.name || technician?.firstName + ' ' + technician?.lastName),
    hasImage: !!imageSrc
  };
};

TechnicianPhotoManager.displayName = 'TechnicianPhotoManager';
TechnicianPhotoGrid.displayName = 'TechnicianPhotoGrid';
TechnicianPhotoGallery.displayName = 'TechnicianPhotoGallery';

export default TechnicianPhotoManager;