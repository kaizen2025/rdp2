// src/utils/accessoriesConfig.js - Configuration des accessoires

import React from 'react';
import {
  Mouse as MouseIcon,
  Keyboard as KeyboardIcon,
  BatteryFull as BatteryIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  SportsEsports as GamepadIcon,
  Headphones as HeadphonesIcon,
  PhoneIphone as PhoneIcon,
  TabletAndroid as TabletIcon,
  Laptop as LaptopIcon,
  CameraAlt as CameraIcon,
  Bluetooth as BluetoothIcon,
  Wifi as WifiIcon
} from '@mui/icons-material';

/**
 * Configuration des accessoires disponibles
 */
export const ACCESSORIES_CONFIG = [
  {
    id: 1,
    name: 'Souris',
    icon: 'mouse',
    category: 'peripherals',
    description: 'Souris optique USB',
    required: false,
    color: '#2196f3'
  },
  {
    id: 2,
    name: 'Clavier',
    icon: 'keyboard',
    category: 'peripherals',
    description: 'Clavier AZERTY USB',
    required: false,
    color: '#4caf50'
  },
  {
    id: 3,
    name: 'Chargeur',
    icon: 'charger',
    category: 'power',
    description: 'Chargeur secteur 65W',
    required: true,
    color: '#ff9800'
  },
  {
    id: 4,
    name: 'Sac de transport',
    icon: 'bag',
    category: 'storage',
    description: 'Housse de protection',
    required: false,
    color: '#9c27b0'
  },
  {
    id: 5,
    name: 'Manette',
    icon: 'gamepad',
    category: 'gaming',
    description: 'Manette de jeu sans fil',
    required: false,
    color: '#f44336'
  },
  {
    id: 6,
    name: 'Casque audio',
    icon: 'headphones',
    category: 'audio',
    description: 'Casque avec micro',
    required: false,
    color: '#00bcd4'
  },
  {
    id: 7,
    name: 'Tablette de dessin',
    icon: 'tablet',
    category: 'design',
    description: 'Tablette graphique',
    required: false,
    color: '#e91e63'
  },
  {
    id: 8,
    name: 'Caméra externe',
    icon: 'camera',
    category: 'video',
    description: 'Webcam HD 1080p',
    required: false,
    color: '#607d8b'
  },
  {
    id: 9,
    name: 'Adaptateur Bluetooth',
    icon: 'bluetooth',
    category: 'connectivity',
    description: 'Clé USB Bluetooth 5.0',
    required: false,
    color: '#3f51b5'
  },
  {
    id: 10,
    name: 'Réseau mobile',
    icon: 'wifi',
    category: 'connectivity',
    description: 'Clé 4G/LTE',
    required: false,
    color: '#8bc34a'
  }
];

/**
 * Obtenir l'icône correspondante à un accessory
 */
export const getAccessoryIcon = (iconName, size = 'medium', color = 'inherit') => {
  const iconProps = {
    fontSize: size,
    color: color
  };

  switch (iconName) {
    case 'mouse':
      return <MouseIcon {...iconProps} />;
    case 'keyboard':
      return <KeyboardIcon {...iconProps} />;
    case 'charger':
    case 'battery':
      return <BatteryIcon {...iconProps} />;
    case 'bag':
    case 'case':
      return <SchoolIcon {...iconProps} />;
    case 'work':
      return <WorkIcon {...iconProps} />;
    case 'gamepad':
      return <GamepadIcon {...iconProps} />;
    case 'headphones':
      return <HeadphonesIcon {...iconProps} />;
    case 'phone':
      return <PhoneIcon {...iconProps} />;
    case 'tablet':
      return <TabletIcon {...iconProps} />;
    case 'laptop':
      return <LaptopIcon {...iconProps} />;
    case 'camera':
      return <CameraIcon {...iconProps} />;
    case 'bluetooth':
      return <BluetoothIcon {...iconProps} />;
    case 'wifi':
      return <WifiIcon {...iconProps} />;
    default:
      return <WorkIcon {...iconProps} />;
  }
};

/**
 * Filtrer les accessoires par catégorie
 */
export const getAccessoriesByCategory = (category) => {
  return ACCESSORIES_CONFIG.filter(accessory => accessory.category === category);
};

/**
 * Obtenir un accessory par ID
 */
export const getAccessoryById = (id) => {
  return ACCESSORIES_CONFIG.find(accessory => accessory.id === id);
};

/**
 * Obtenir les accessoires requis
 */
export const getRequiredAccessories = () => {
  return ACCESSORIES_CONFIG.filter(accessory => accessory.required);
};

/**
 * Obtenir les accessoires optionnels
 */
export const getOptionalAccessories = () => {
  return ACCESSORIES_CONFIG.filter(accessory => !accessory.required);
};

/**
 * Catégories disponibles
 */
export const ACCESSORY_CATEGORIES = [
  { id: 'peripherals', name: 'Périphériques', icon: <WorkIcon /> },
  { id: 'power', name: 'Alimentation', icon: <BatteryIcon /> },
  { id: 'storage', name: 'Transport', icon: <SchoolIcon /> },
  { id: 'gaming', name: 'Gaming', icon: <GamepadIcon /> },
  { id: 'audio', name: 'Audio', icon: <HeadphonesIcon /> },
  { id: 'design', name: 'Design', icon: <TabletIcon /> },
  { id: 'video', name: 'Vidéo', icon: <CameraIcon /> },
  { id: 'connectivity', name: 'Connectivité', icon: <WifiIcon /> }
];

/**
 * Helper pour formater les noms d'accessoires
 */
export const formatAccessoryName = (accessory) => {
  if (!accessory) return '';
  
  let name = accessory.name;
  if (accessory.description) {
    name += ` (${accessory.description})`;
  }
  
  return name;
};

/**
 * Helper pour obtenir les stats d'accessoires
 */
export const getAccessoriesStats = (accessories = []) => {
  const total = accessories.length;
  const required = accessories.filter(acc => acc.required).length;
  const optional = total - required;
  
  const categoryStats = accessories.reduce((acc, accessory) => {
    const category = accessory.category || 'other';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});
  
  return {
    total,
    required,
    optional,
    categories: categoryStats
  };
};

/**
 * Validation des accessoires
 */
export const validateAccessories = (selectedAccessories, loan) => {
  const errors = [];
  const warnings = [];
  
  // Vérifier les accessoires requis
  const required = getRequiredAccessories();
  required.forEach(req => {
    if (!selectedAccessories.includes(req.id)) {
      errors.push(`Accessoire requis manquant: ${req.name}`);
    }
  });
  
  // Vérifier les conflits d'accessoires (exemple)
  const hasMouse = selectedAccessories.includes(1);
  const hasKeyboard = selectedAccessories.includes(2);
  
  if (hasMouse && !hasKeyboard) {
    warnings.push('Une souris sans clavier peut limiter l\'utilisation');
  }
  
  // Vérifier les limites par catégorie
  const categoryCount = selectedAccessories.reduce((acc, id) => {
    const accessory = getAccessoryById(id);
    if (accessory) {
      acc[accessory.category] = (acc[accessory.category] || 0) + 1;
    }
    return acc;
  }, {});
  
  // Exemple: Limiter à 3 accessoires de catégorie 'peripherals'
  if ((categoryCount.peripherals || 0) > 3) {
    warnings.push('Trop d\'accessoires périphériques (maximum 3 recommandés)');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Configuration des couleurs par défaut
 */
export const getDefaultAccessoryColor = (category) => {
  const colors = {
    peripherals: '#2196f3',
    power: '#ff9800',
    storage: '#9c27b0',
    gaming: '#f44336',
    audio: '#00bcd4',
    design: '#e91e63',
    video: '#607d8b',
    connectivity: '#3f51b5'
  };
  
  return colors[category] || '#757575';
};

export default ACCESSORIES_CONFIG;