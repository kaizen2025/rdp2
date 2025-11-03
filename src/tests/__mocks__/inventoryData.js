// src/tests/__mocks__/inventoryData.js - DONNÉES MOCKÉES POUR LES TESTS D'INVENTAIRE

// Données mockées pour les tests du module Inventaire

export const mockInventoryTechnicians = [
    { id: 1, name: 'Jean Dupont', email: 'jean.dupont@anecoop.com' },
    { id: 2, name: 'Marie Martin', email: 'marie.martin@anecoop.com' },
    { id: 3, name: 'Pierre Durand', email: 'pierre.durand@anecoop.com' },
    { id: 4, name: 'Sophie Leroux', email: 'sophie.leroux@anecoop.com' },
];

export const mockComputers = [
    {
        id: 1,
        name: 'PC-001',
        brand: 'Dell',
        model: 'Latitude 7420',
        serialNumber: 'SN001234567',
        assetTag: 'AT-2024-001',
        type: 'laptop',
        status: 'available',
        location: 'Bureau 204',
        department: 'Informatique',
        purchaseDate: '2024-01-15',
        warrantyEndDate: '2027-01-15',
        lastMaintenance: '2024-10-15',
        maintenanceIntervalDays: 180,
        notes: 'Ordinateur portable Dell Latitude',
        specifications: {
            processor: 'Intel Core i7-1165G7',
            ram: '16GB',
            storage: '512GB SSD',
            graphics: 'Intel Iris Xe',
            os: 'Windows 11 Pro'
        },
        accessories: ['Chargeur', 'Souris Logitech'],
        photos: [
            'https://example.com/photos/pc001-front.jpg',
            'https://example.com/photos/pc001-back.jpg'
        ],
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-10-15T14:30:00Z'
    },
    {
        id: 2,
        name: 'PC-002',
        brand: 'HP',
        model: 'EliteDesk 800 G8',
        serialNumber: 'SN001234568',
        assetTag: 'AT-2024-002',
        type: 'desktop',
        status: 'maintenance',
        location: 'Atelier Maintenance',
        department: 'Informatique',
        purchaseDate: '2024-02-01',
        warrantyEndDate: '2027-02-01',
        lastMaintenance: '2024-11-01',
        maintenanceIntervalDays: 180,
        notes: 'PC de bureau en maintenance préventive',
        specifications: {
            processor: 'Intel Core i5-11400',
            ram: '8GB',
            storage: '256GB SSD',
            graphics: 'Intel UHD Graphics 730',
            os: 'Windows 11 Pro'
        },
        accessories: ['Clavier', 'Écran 24"'],
        photos: [
            'https://example.com/photos/pc002-side.jpg'
        ],
        createdAt: '2024-02-01T10:00:00Z',
        updatedAt: '2024-11-01T16:45:00Z'
    },
    {
        id: 3,
        name: 'PC-003',
        brand: 'Lenovo',
        model: 'ThinkPad X1 Carbon',
        serialNumber: 'SN001234569',
        assetTag: 'AT-2024-003',
        type: 'laptop',
        status: 'loaned',
        location: 'Bureau 105',
        department: 'Commercial',
        purchaseDate: '2024-03-10',
        warrantyEndDate: '2026-03-10',
        lastMaintenance: '2024-09-10',
        maintenanceIntervalDays: 180,
        notes: 'Portable léger pour déplacements',
        specifications: {
            processor: 'Intel Core i7-1165G7',
            ram: '32GB',
            storage: '1TB SSD',
            graphics: 'Intel Iris Xe',
            os: 'Windows 11 Pro'
        },
        accessories: ['Chargeur USB-C', 'Sacoche de transport'],
        photos: [
            'https://example.com/photos/pc003-open.jpg'
        ],
        createdAt: '2024-03-10T11:30:00Z',
        updatedAt: '2024-11-03T09:15:00Z'
    },
    {
        id: 4,
        name: 'PC-004',
        brand: 'Microsoft',
        model: 'Surface Pro 8',
        serialNumber: 'SN001234570',
        assetTag: 'AT-2024-004',
        type: 'tablet',
        status: 'reserved',
        location: 'Bureau Direction',
        department: 'Direction',
        purchaseDate: '2024-04-20',
        warrantyEndDate: '2026-04-20',
        lastMaintenance: '2024-10-20',
        maintenanceIntervalDays: 180,
        notes: 'Tablette pour la direction',
        specifications: {
            processor: 'Intel Core i7-1165G7',
            ram: '16GB',
            storage: '512GB SSD',
            graphics: 'Intel Iris Xe',
            os: 'Windows 11 Pro'
        },
        accessories: ['Stylo tactile', 'Clavier Type Cover'],
        photos: [],
        createdAt: '2024-04-20T14:00:00Z',
        updatedAt: '2024-10-20T11:00:00Z'
    },
    {
        id: 5,
        name: 'PC-005',
        brand: 'Dell',
        model: 'OptiPlex 7090',
        serialNumber: 'SN001234571',
        assetTag: 'AT-2024-005',
        type: 'desktop',
        status: 'available',
        location: 'Bureau R&D',
        department: 'R&D',
        purchaseDate: '2024-05-05',
        warrantyEndDate: '2027-05-05',
        lastMaintenance: '2024-08-05',
        maintenanceIntervalDays: 180,
        notes: 'PC haute performance pour R&D',
        specifications: {
            processor: 'Intel Core i9-11900K',
            ram: '32GB',
            storage: '1TB SSD + 2TB HDD',
            graphics: 'NVIDIA RTX 3060',
            os: 'Windows 11 Pro'
        },
        accessories: ['2x Écrans 27"', 'Clavier mécanique'],
        photos: [
            'https://example.com/photos/pc005-front.jpg',
            'https://example.com/photos/pc005-internal.jpg'
        ],
        createdAt: '2024-05-05T16:30:00Z',
        updatedAt: '2024-08-05T13:20:00Z'
    }
];

export const mockUsers = [
    {
        id: 1,
        displayName: 'Jean Dupont',
        username: 'j.dupont',
        email: 'jean.dupont@anecoop.com',
        department: 'Informatique',
        position: 'Développeur Senior'
    },
    {
        id: 2,
        displayName: 'Marie Martin',
        username: 'm.martin',
        email: 'marie.martin@anecoop.com',
        department: 'Commercial',
        position: 'Responsable Commercial'
    },
    {
        id: 3,
        displayName: 'Pierre Durand',
        username: 'p.durand',
        email: 'pierre.durand@anecoop.com',
        department: 'Direction',
        position: 'Directeur Général'
    },
    {
        id: 4,
        displayName: 'Sophie Leroux',
        username: 's.leroux',
        email: 'sophie.leroux@anecoop.com',
        department: 'R&D',
        position: 'Ingénieur R&D'
    },
    {
        id: 5,
        displayName: 'Antoine Blanc',
        username: 'a.blanc',
        email: 'antoine.blanc@anecoop.com',
        department: 'Finance',
        position: 'Comptable'
    }
];

export const mockLoans = [
    {
        id: 1,
        computerId: 3,
        computerName: 'PC-003',
        userName: 'm.martin',
        userDisplayName: 'Marie Martin',
        userDepartment: 'Commercial',
        itStaff: 'Jean Dupont',
        loanDate: '2024-11-01T09:00:00Z',
        expectedReturnDate: '2024-11-15T18:00:00Z',
        actualReturnDate: null,
        status: 'active',
        notes: 'Salon professionnel Lyon',
        accessories: ['Sacoche', 'Chargeur USB-C'],
        location: 'Déplacement',
        createdAt: '2024-11-01T09:00:00Z',
        updatedAt: '2024-11-01T09:00:00Z'
    },
    {
        id: 2,
        computerId: 4,
        computerName: 'PC-004',
        userName: 'p.durand',
        userDisplayName: 'Pierre Durand',
        userDepartment: 'Direction',
        itStaff: 'Marie Martin',
        loanDate: '2024-10-28T10:30:00Z',
        expectedReturnDate: '2024-11-10T17:00:00Z',
        actualReturnDate: null,
        status: 'reserved',
        notes: 'Présentation conseil d\'administration',
        accessories: ['Stylo tactile'],
        location: 'Bureau Direction',
        createdAt: '2024-10-28T10:30:00Z',
        updatedAt: '2024-10-28T10:30:00Z'
    }
];

export const mockMaintenanceRecords = [
    {
        id: 1,
        computerId: 1,
        date: '2024-10-15T14:30:00Z',
        type: 'preventive',
        technician: 'Jean Dupont',
        description: 'Maintenance préventive mensuelle',
        tasks: [
            'Nettoyage interne',
            'Vérification des ventilateurs',
            'Mise à jour système',
            'Antivirus scan'
        ],
        parts: [
            { name: 'Pâte thermique', quantity: 1, cost: 15.50 }
        ],
        duration: 90, // minutes
        cost: 45.50,
        status: 'completed',
        nextMaintenanceDate: '2025-01-15',
        createdAt: '2024-10-15T14:30:00Z'
    },
    {
        id: 2,
        computerId: 2,
        date: '2024-11-01T16:45:00Z',
        type: 'corrective',
        technician: 'Pierre Durand',
        description: 'Remplacement disque dur',
        tasks: [
            'Diagnostic disque',
            'Sauvegarde données',
            'Remplacement disque',
            'Réinstallation système'
        ],
        parts: [
            { name: 'SSD 500GB', quantity: 1, cost: 89.90 }
        ],
        duration: 180,
        cost: 149.90,
        status: 'in_progress',
        nextMaintenanceDate: null,
        createdAt: '2024-11-01T16:45:00Z'
    }
];

export const mockAlerts = [
    {
        id: 'warranty-expired-pc002',
        type: 'warranty_expired',
        severity: 'error',
        title: 'Garantie expirée',
        equipment: mockComputers[1],
        message: 'PC-002 - Expirée depuis 2 jours',
        date: new Date('2027-02-01'),
        computerId: 2,
        resolved: false
    },
    {
        id: 'warranty-expiring-pc003',
        type: 'warranty_expiring',
        severity: 'warning',
        title: 'Garantie expire bientôt',
        equipment: mockComputers[2],
        message: 'PC-003 - Expire dans 25 jours',
        date: new Date('2026-03-10'),
        computerId: 3,
        resolved: false
    },
    {
        id: 'maintenance-due-pc001',
        type: 'maintenance_due',
        severity: 'warning',
        title: 'Maintenance requise',
        equipment: mockComputers[0],
        message: 'PC-001 - Dernière maintenance il y a 185 jours',
        date: new Date('2024-10-15'),
        computerId: 1,
        resolved: false
    }
];

export const mockPhotos = [
    {
        id: 'photo-1',
        computerId: 1,
        filename: 'pc001-front.jpg',
        url: 'https://example.com/photos/pc001-front.jpg',
        thumbnailUrl: 'https://example.com/thumbs/pc001-front.jpg',
        size: 2048576,
        uploadDate: '2024-01-15T09:30:00Z',
        uploadedBy: 'Jean Dupont',
        description: 'Vue frontale de l\'ordinateur',
        tags: ['front', 'Dell', 'Latitude']
    },
    {
        id: 'photo-2',
        computerId: 1,
        filename: 'pc001-back.jpg',
        url: 'https://example.com/photos/pc001-back.jpg',
        thumbnailUrl: 'https://example.com/thumbs/pc001-back.jpg',
        size: 1893245,
        uploadDate: '2024-01-15T09:35:00Z',
        uploadedBy: 'Jean Dupont',
        description: 'Vue arrière avec connecteurs',
        tags: ['back', 'connectors']
    },
    {
        id: 'photo-3',
        computerId: 2,
        filename: 'pc002-side.jpg',
        url: 'https://example.com/photos/pc002-side.jpg',
        thumbnailUrl: 'https://example.com/thumbs/pc002-side.jpg',
        size: 1567890,
        uploadDate: '2024-02-01T10:15:00Z',
        uploadedBy: 'Marie Martin',
        description: 'Profil latéral PC HP',
        tags: ['side', 'HP', 'desktop']
    }
];

export const mockAccessories = [
    {
        id: 1,
        name: 'Souris Logitech MX Master 3',
        serialNumber: 'SN-SM-001',
        category: 'souris',
        status: 'available',
        location: 'Stock Informatique',
        description: 'Souris ergonomique sans fil',
        specifications: {
            brand: 'Logitech',
            model: 'MX Master 3',
            connectivity: 'Bluetooth/USB',
            color: 'Noir'
        },
        purchaseDate: '2023-06-15',
        warrantyEndDate: '2026-06-15',
        assignedTo: null,
        createdAt: '2023-06-15T10:00:00Z',
        updatedAt: '2024-01-20T14:30:00Z'
    },
    {
        id: 2,
        name: 'Écran Dell UltraSharp 27"',
        serialNumber: 'SN-MN-001',
        category: 'ecran',
        status: 'assigned',
        location: 'Bureau R&D',
        description: 'Moniteur 4K 27 pouces',
        specifications: {
            brand: 'Dell',
            model: 'UltraSharp U2720Q',
            resolution: '3840x2160',
            connectivity: 'HDMI/USB-C/DisplayPort',
            color: 'Argent'
        },
        purchaseDate: '2023-08-20',
        warrantyEndDate: '2026-08-20',
        assignedTo: 5, // Antoine Blanc
        computerId: 5,
        createdAt: '2023-08-20T11:00:00Z',
        updatedAt: '2024-05-05T16:30:00Z'
    },
    {
        id: 3,
        name: 'Clavier Mécanique Corsair K95',
        serialNumber: 'SN-KB-001',
        category: 'clavier',
        status: 'maintenance',
        location: 'Atelier Maintenance',
        description: 'Clavier gaming mécanique',
        specifications: {
            brand: 'Corsair',
            model: 'K95 RGB Platinum',
            switches: 'Cherry MX Brown',
            backlight: 'RGB',
            connectivity: 'USB'
        },
        purchaseDate: '2023-09-10',
        warrantyEndDate: '2026-09-10',
        assignedTo: null,
        createdAt: '2023-09-10T09:00:00Z',
        updatedAt: '2024-11-01T14:00:00Z'
    }
];

// Fonction pour générer des données de test de grande taille
export const generateLargeInventoryData = (count = 1000) => {
    const computers = [];
    const brands = ['Dell', 'HP', 'Lenovo', 'ASUS', 'Microsoft', 'Apple', 'Acer'];
    const types = ['laptop', 'desktop', 'tablet'];
    const statuses = ['available', 'loaned', 'maintenance', 'reserved', 'retired'];
    const departments = ['Informatique', 'Commercial', 'Direction', 'R&D', 'Finance', 'RH', 'Marketing'];
    const locations = Array.from({ length: 50 }, (_, i) => `Bureau ${100 + i}`);
    
    for (let i = 1; i <= count; i++) {
        const brand = brands[i % brands.length];
        const type = types[i % types.length];
        const status = statuses[i % statuses.length];
        const department = departments[i % departments.length];
        const location = locations[i % locations.length];
        
        const purchaseDate = new Date('2023-01-01');
        purchaseDate.setDate(purchaseDate.getDate() + Math.floor(Math.random() * 365));
        
        const warrantyEndDate = new Date(purchaseDate);
        warrantyEndDate.setFullYear(warrantyEndDate.getFullYear() + 3);
        
        const lastMaintenance = new Date(purchaseDate);
        lastMaintenance.setDate(lastMaintenance.getDate() + Math.floor(Math.random() * 180));
        
        computers.push({
            id: i,
            name: `PC-${String(i).padStart(3, '0')}`,
            brand: brand,
            model: `${brand} Model ${i}`,
            serialNumber: `SN${String(i).padStart(9, '0')}`,
            assetTag: `AT-2024-${String(i).padStart(4, '0')}`,
            type: type,
            status: status,
            location: location,
            department: department,
            purchaseDate: purchaseDate.toISOString().split('T')[0],
            warrantyEndDate: warrantyEndDate.toISOString().split('T')[0],
            lastMaintenance: lastMaintenance.toISOString().split('T')[0],
            maintenanceIntervalDays: 180,
            notes: `Matériel de test ${i}`,
            specifications: {
                processor: `Intel Core i${5 + (i % 5)}-${1000 + (i % 900)}`,
                ram: `${4 + (i % 4) * 4}GB`,
                storage: `${256 + (i % 4) * 256}GB SSD`,
                graphics: 'Intel UHD Graphics',
                os: 'Windows 11 Pro'
            },
            accessories: [],
            photos: [],
            createdAt: purchaseDate.toISOString(),
            updatedAt: lastMaintenance.toISOString()
        });
    }
    
    return computers;
};

// Fonctions utilitaires pour créer des données de test spécifiques
export const createMockComputer = (overrides = {}) => {
    const defaultComputer = {
        id: Date.now(),
        name: 'PC-TEST',
        brand: 'TestBrand',
        model: 'TestModel',
        serialNumber: 'SN-TEST-001',
        assetTag: 'AT-TEST-001',
        type: 'laptop',
        status: 'available',
        location: 'Bureau Test',
        department: 'Test',
        purchaseDate: '2024-01-01',
        warrantyEndDate: '2027-01-01',
        lastMaintenance: '2024-10-01',
        maintenanceIntervalDays: 180,
        notes: 'Ordinateur de test',
        specifications: {
            processor: 'Intel Core i5',
            ram: '8GB',
            storage: '256GB SSD',
            graphics: 'Intel UHD',
            os: 'Windows 11 Pro'
        },
        accessories: [],
        photos: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-10-01T00:00:00Z'
    };
    
    return { ...defaultComputer, ...overrides };
};

export const createMockAlert = (overrides = {}) => {
    const defaultAlert = {
        id: `alert-${Date.now()}`,
        type: 'maintenance_due',
        severity: 'warning',
        title: 'Maintenance requise',
        equipment: createMockComputer(),
        message: 'Maintenance requise',
        date: new Date(),
        computerId: 1,
        resolved: false
    };
    
    return { ...defaultAlert, ...overrides };
};

export const createMockPhoto = (overrides = {}) => {
    const defaultPhoto = {
        id: `photo-${Date.now()}`,
        computerId: 1,
        filename: 'test-photo.jpg',
        url: 'https://example.com/photos/test.jpg',
        thumbnailUrl: 'https://example.com/thumbs/test.jpg',
        size: 1024000,
        uploadDate: new Date().toISOString(),
        uploadedBy: 'Test User',
        description: 'Photo de test',
        tags: ['test']
    };
    
    return { ...defaultPhoto, ...overrides };
};

// Données pour scénarios spécifiques de tests
export const mockScenarioData = {
    // Scénario ordinateur avec garantie expirée
    expiredWarranty: createMockComputer({
        id: 999,
        name: 'PC-EXPIRED',
        warrantyEndDate: '2024-10-01',
        lastMaintenance: '2024-09-01'
    }),
    
    // Scénario ordinateur avec maintenance due
    maintenanceDue: createMockComputer({
        id: 998,
        name: 'PC-MAINTENANCE',
        lastMaintenance: '2024-05-01', // Plus de 6 mois
        maintenanceIntervalDays: 180
    }),
    
    // Scénario ordinateur prêt
    loanedComputer: createMockComputer({
        id: 997,
        name: 'PC-LOANED',
        status: 'loaned',
        lastMaintenance: '2024-09-01'
    }),
    
    // Scénario ordinateur en maintenance
    maintenanceComputer: createMockComputer({
        id: 996,
        name: 'PC-MAINT',
        status: 'maintenance',
        lastMaintenance: '2024-11-01'
    }),
    
    // Scénario avec photos multiples
    computerWithPhotos: createMockComputer({
        id: 995,
        name: 'PC-PHOTOS',
        photos: [
            'https://example.com/photos/pc995-1.jpg',
            'https://example.com/photos/pc995-2.jpg',
            'https://example.com/photos/pc995-3.jpg',
            'https://example.com/photos/pc995-4.jpg',
            'https://example.com/photos/pc995-5.jpg'
        ]
    })
};

// Données pour tests de performance
export const mockPerformanceData = {
    small: generateLargeInventoryData(10),
    medium: generateLargeInventoryData(100),
    large: generateLargeInventoryData(1000),
    xlarge: generateLargeInventoryData(5000)
};

// Données pour tests d'export
export const mockExportData = {
    excelColumns: [
        'ID',
        'Nom',
        'Marque',
        'Modèle',
        'Numéro de série',
        'Tag Actif',
        'Type',
        'Statut',
        'Localisation',
        'Département',
        'Date d\'achat',
        'Fin de garantie',
        'Dernière maintenance',
        'Notes'
    ],
    
    csvFields: [
        'id', 'name', 'brand', 'model', 'serialNumber', 'assetTag',
        'type', 'status', 'location', 'department', 'purchaseDate',
        'warrantyEndDate', 'lastMaintenance', 'notes'
    ]
};

// Données pour tests QR Code
export const mockQRCodeData = {
    basicQR: {
        type: 'computer',
        id: 1,
        name: 'PC-001',
        serial: 'SN001234567',
        assetTag: 'AT-2024-001'
    },
    
    enhancedQR: {
        type: 'computer',
        id: 1,
        name: 'PC-001',
        serial: 'SN001234567',
        assetTag: 'AT-2024-001',
        location: 'Bureau 204',
        department: 'Informatique',
        status: 'available',
        warrantyEnd: '2027-01-15'
    }
};

// Export par défaut de toutes les données mockées
export default {
    technicians: mockInventoryTechnicians,
    computers: mockComputers,
    users: mockUsers,
    loans: mockLoans,
    maintenanceRecords: mockMaintenanceRecords,
    alerts: mockAlerts,
    photos: mockPhotos,
    accessories: mockAccessories,
    generateLargeInventoryData,
    createMockComputer,
    createMockAlert,
    createMockPhoto,
    mockScenarioData,
    mockPerformanceData,
    mockExportData,
    mockQRCodeData
};
