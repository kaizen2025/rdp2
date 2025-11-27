// src/config/accessoriesConfig.js - Configuration des accessoires

import React from 'react';
import {
  Mouse as MouseIcon,
  Keyboard as KeyboardIcon,
  Power as PowerIcon,
  School as SchoolIcon,
  Headphones as HeadphonesIcon,
  VideoCall as VideoCallIcon,
  Watch as WatchIcon,
  Smartphone as SmartphoneIcon,
  Speaker as SpeakerIcon,
  Memory as MemoryIcon
} from '@mui/icons-material';

// Configuration des icônes par type d'accessoire
export const getAccessoryIcon = (iconType) => {
  const iconProps = { 
    fontSize: 'small',
    color: 'primary'
  };
  
  switch (iconType?.toLowerCase()) {
    case 'mouse':
    case 'souris':
      return <MouseIcon {...iconProps} />;
    case 'keyboard':
    case 'clavier':
      return <KeyboardIcon {...iconProps} />;
    case 'charger':
    case 'power':
    case 'alimentation':
      return <PowerIcon {...iconProps} />;
    case 'bag':
    case 'sac':
    case 'housse':
      return <SchoolIcon {...iconProps} />;
    case 'headphones':
    case 'casque':
    case 'audio':
      return <HeadphonesIcon {...iconProps} />;
    case 'camera':
    case 'webcam':
    case 'vidéo':
      return <VideoCallIcon {...iconProps} />;
    case 'watch':
    case 'montre':
      return <WatchIcon {...iconProps} />;
    case 'phone':
    case 'téléphone':
      return <SmartphoneIcon {...iconProps} />;
    case 'speaker':
    case 'haut-parleur':
    case 'audio-externe':
      return <SpeakerIcon {...iconProps} />;
    case 'memory':
    case 'clé usb':
    case 'disque':
      return <MemoryIcon {...iconProps} />;
    default:
      return <SchoolIcon {...iconProps} />;
  }
};

// Catégories d'accessoires
export const ACCESSORY_CATEGORIES = {
  INPUT: 'Input',
  OUTPUT: 'Output',
  POWER: 'Alimentation',
  STORAGE: 'Stockage',
  CARRY: 'Transport',
  AUDIO: 'Audio',
  OTHER: 'Autre'
};

// Configuration par défaut des accessoires
export const DEFAULT_ACCESSORIES = [
  {
    id: 1,
    name: 'Souris',
    category: ACCESSORY_CATEGORIES.INPUT,
    icon: 'mouse',
    description: 'Souris optique USB',
    required: true
  },
  {
    id: 2,
    name: 'Clavier',
    category: ACCESSORY_CATEGORIES.INPUT,
    icon: 'keyboard',
    description: 'Clavier AZERTY USB',
    required: true
  },
  {
    id: 3,
    name: 'Chargeur',
    category: ACCESSORY_CATEGORIES.POWER,
    icon: 'charger',
    description: 'Chargeur secteur',
    required: true
  },
  {
    id: 4,
    name: 'Sac à dos',
    category: ACCESSORY_CATEGORIES.CARRY,
    icon: 'bag',
    description: 'Sac de transport padded',
    required: false
  },
  {
    id: 5,
    name: 'Casque audio',
    category: ACCESSORY_CATEGORIES.AUDIO,
    icon: 'headphones',
    description: 'Casque filaire ou sans fil',
    required: false
  },
  {
    id: 6,
    name: 'Webcam',
    category: ACCESSORY_CATEGORIES.OUTPUT,
    icon: 'camera',
    description: 'Caméra USB HD',
    required: false
  },
  {
    id: 7,
    name: 'Disque externe',
    category: ACCESSORY_CATEGORIES.STORAGE,
    icon: 'memory',
    description: 'Disque dur externe ou SSD',
    required: false
  },
  {
    id: 8,
    name: 'Adaptateur HDMI',
    category: ACCESSORY_CATEGORIES.OUTPUT,
    icon: 'memory',
    description: 'Adaptateur vidéo HDMI/VGA',
    required: false
  }
];

// Validation de la configuration
export const validateAccessory = (accessory) => {
  const required = ['id', 'name', 'category', 'icon'];
  const missing = required.filter(field => !accessory[field]);
  
  if (missing.length > 0) {
    throw new Error(`Accessoire incomplet. Champs manquants: ${missing.join(', ')}`);
  }
  
  return true;
};

// Fonction utilitaire pour obtenir un accessory par ID
export const getAccessoryById = (id, accessoriesList = DEFAULT_ACCESSORIES) => {
  return accessoriesList.find(acc => acc.id === id);
};

// Fonction utilitaire pour obtenir les accessoires par catégorie
export const getAccessoriesByCategory = (category, accessoriesList = DEFAULT_ACCESSORIES) => {
  return accessoriesList.filter(acc => acc.category === category);
};

// Fonction utilitaire pour vérifier si un accessory est requis
export const isRequiredAccessory = (accessoryId, accessoriesList = DEFAULT_ACCESSORIES) => {
  const accessory = getAccessoryById(accessoryId, accessoriesList);
  return accessory?.required || false;
};

export default {
  getAccessoryIcon,
  ACCESSORY_CATEGORIES,
  DEFAULT_ACCESSORIES,
  validateAccessory,
  getAccessoryById,
  getAccessoriesByCategory,
  isRequiredAccessory
};