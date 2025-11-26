import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * Composant ChatTechnicianPhoto - Gestion des photos de techniciens dans l'interface chat
 * Fonctionnalités:
 * - Intégration photos dans interface chat
 * - Affichage initiales si pas de photo
 * - Cercle avatar avec couleur de fond
 * - Animations d'apparition des messages
 * - Support multi-dimension (mobile/desktop)
 * - Performance temps réel optimisée
 */
const ChatTechnicianPhoto = ({
  technician,
  size = 'medium',
  showAnimations = true,
  className = '',
  onError = () => {}
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Calcul des initiales du technicien
  const initials = useMemo(() => {
    if (!technician?.name) return '?';
    const names = technician.name.split(' ').filter(n => n);
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return technician.name.substring(0, 2).toUpperCase();
  }, [technician?.name]);

  // Génération de couleur de fond basée sur le nom
  const backgroundColor = useMemo(() => {
    if (!technician?.name) return '#6B7280';
    
    let hash = 0;
    for (let i = 0; i < technician.name.length; i++) {
      hash = technician.name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colors = [
      '#3B82F6', '#8B5CF6', '#EF4444', '#10B981', '#F59E0B',
      '#06B6D4', '#EC4899', '#84CC16', '#F97316', '#6366F1'
    ];
    
    return colors[Math.abs(hash) % colors.length];
  }, [technician?.name]);

  // Tailles adaptatives selon l'écran
  const sizeClasses = {
    small: 'w-8 h-8 text-xs',
    medium: 'w-10 h-10 text-sm',
    large: 'w-12 h-12 text-base',
    xlarge: 'w-16 h-16 text-lg'
  };

  const currentSize = sizeClasses[size] || sizeClasses.medium;

  // Gestion du lazy loading et de l'animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, showAnimations ? 100 : 0);

    return () => clearTimeout(timer);
  }, [showAnimations]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
    onError(new Error('Erreur de chargement de l\'image'));
  };

  const getImageSource = () => {
    if (!technician?.photoUrl) return null;
    return technician.photoUrl;
  };

  // Avatar avec photo ou initiales
  const renderAvatar = () => {
    const photoUrl = getImageSource();
    const hasPhoto = photoUrl && !imageError;

    return (
      <div 
        className={`
          ${currentSize} 
          rounded-full 
          flex items-center justify-center 
          font-medium text-white 
          transition-all duration-300 ease-in-out
          ${!imageLoaded && hasPhoto ? 'opacity-50' : 'opacity-100'}
          ${isVisible && showAnimations ? 'animate-fade-in' : ''}
          ${className}
        `}
        style={{ 
          backgroundColor: hasPhoto ? 'transparent' : backgroundColor,
          backgroundImage: hasPhoto ? `url(${photoUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Overlay pour uniformiser le fond si photo */}
        {hasPhoto && (
          <div 
            className="absolute inset-0 rounded-full opacity-20"
            style={{ backgroundColor }}
          />
        )}
        
        {/* Initiales */}
        {!hasPhoto && (
          <span className="select-none pointer-events-none">
            {initials}
          </span>
        )}
        
        {/* Indicateur de chargement */}
        {hasPhoto && !imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Image cachée pour le chargement */}
      {getImageSource() && (
        <img
          src={getImageSource()}
          alt={`Photo de ${technician?.name || 'technicien'}`}
          className="hidden"
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
      )}
      
      {renderAvatar()}
    </div>
  );
};

// Composant pour l'animation des messages
export const ChatMessageAvatar = ({ technician, isOwnMessage = false }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`
        transition-all duration-300 ease-out
        ${isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}
        ${isOwnMessage ? 'ml-3' : 'mr-3'}
      `}
    >
      <ChatTechnicianPhoto
        technician={technician}
        size="medium"
        showAnimations={true}
        className={`
          ${isOwnMessage ? 'order-2' : 'order-1'}
        `}
      />
    </div>
  );
};

// Composant optimisé pour les listes de techniciens
export const ChatTechnicianList = ({ technicians = [], selectedTechnician, onSelect }) => {
  const [visibleTechnicians, setVisibleTechnicians] = useState([]);

  useEffect(() => {
    // Animation d'apparition progressive pour les performances
    technicians.forEach((tech, index) => {
      setTimeout(() => {
        setVisibleTechnicians(prev => [...prev, tech]);
      }, index * 50);
    });
  }, [technicians]);

  return (
    <div className="flex flex-wrap gap-3 p-2">
      {visibleTechnicians.map((technician) => (
        <div
          key={technician.id}
          className={`
            cursor-pointer transition-all duration-200 hover:scale-105
            ${selectedTechnician?.id === technician.id 
              ? 'ring-2 ring-blue-500 ring-offset-2' 
              : ''
            }
          `}
          onClick={() => onSelect(technician)}
        >
          <ChatTechnicianPhoto
            technician={technician}
            size="medium"
            showAnimations={true}
          />
        </div>
      ))}
    </div>
  );
};

// Composant responsive pour l'interface chat complète
export const ChatInterfaceAvatar = ({ 
  technician, 
  messageCount = 0, 
  isOnline = false,
  size = 'medium'
}) => {
  return (
    <div className="relative">
      <ChatTechnicianPhoto
        technician={technician}
        size={size}
        showAnimations={true}
      />
      
      {/* Indicateur de statut en ligne */}
      {isOnline && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full">
          <div className="w-full h-full bg-green-500 rounded-full animate-pulse"></div>
        </div>
      )}
      
      {/* Badge de compteur de messages */}
      {messageCount > 0 && (
        <div className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1">
          {messageCount > 99 ? '99+' : messageCount}
        </div>
      )}
    </div>
  );
};

// Configuration des breakpoints responsive
export const getResponsiveConfig = () => ({
  mobile: {
    avatarSize: 'small',
    showLabels: false,
    maxVisibleAvatars: 3
  },
  tablet: {
    avatarSize: 'medium',
    showLabels: true,
    maxVisibleAvatars: 5
  },
  desktop: {
    avatarSize: 'large',
    showLabels: true,
    maxVisibleAvatars: 8
  }
});

// Hook personnalisé pour la gestion responsive
export const useChatPhotoResponsive = () => {
  const [screenSize, setScreenSize] = useState('desktop');

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);

    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  const config = useMemo(() => {
    const responsiveConfig = getResponsiveConfig();
    return responsiveConfig[screenSize] || responsiveConfig.desktop;
  }, [screenSize]);

  return { screenSize, config };
};

ChatTechnicianPhoto.propTypes = {
  technician: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    photoUrl: PropTypes.string,
    email: PropTypes.string
  }).isRequired,
  size: PropTypes.oneOf(['small', 'medium', 'large', 'xlarge']),
  showAnimations: PropTypes.bool,
  className: PropTypes.string,
  onError: PropTypes.func
};

ChatMessageAvatar.propTypes = {
  technician: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    photoUrl: PropTypes.string
  }).isRequired,
  isOwnMessage: PropTypes.bool
};

ChatTechnicianList.propTypes = {
  technicians: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      photoUrl: PropTypes.string
    })
  ),
  selectedTechnician: PropTypes.object,
  onSelect: PropTypes.func.isRequired
};

ChatInterfaceAvatar.propTypes = {
  technician: PropTypes.object.isRequired,
  messageCount: PropTypes.number,
  isOnline: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large', 'xlarge'])
};

export default ChatTechnicianPhoto;