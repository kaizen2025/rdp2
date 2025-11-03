// src/tests/__mocks__/loanData.js - DONNÉES MOCKÉES POUR LES TESTS DES PRÊTS

// Génération de données mockées pour les tests
export const mockTechnicians = [
    { id: 1, name: 'Jean Dupont', email: 'jean.dupont@anecoop.fr' },
    { id: 2, name: 'Marie Martin', email: 'marie.martin@anecoop.fr' },
    { id: 3, name: 'Pierre Durand', email: 'pierre.durand@anecoop.fr' },
    { id: 4, name: 'Sophie Leroux', email: 'sophie.leroux@anecoop.fr' },
];

export const mockComputers = [
    {
        id: 1,
        name: 'PC-001',
        serial_number: 'SN001234',
        type: 'Laptop',
        brand: 'Dell',
        model: 'Latitude 7420',
        status: 'available',
        department: 'Informatique'
    },
    {
        id: 2,
        name: 'PC-002',
        serial_number: 'SN001235',
        type: 'Desktop',
        brand: 'HP',
        model: 'EliteDesk 800',
        status: 'available',
        department: 'Comptabilité'
    },
    {
        id: 3,
        name: 'PC-003',
        serial_number: 'SN001236',
        type: 'Laptop',
        brand: 'Lenovo',
        model: 'ThinkPad X1',
        status: 'available',
        department: 'Commercial'
    },
    {
        id: 4,
        name: 'PC-004',
        serial_number: 'SN001237',
        type: 'Tablet',
        brand: 'Microsoft',
        model: 'Surface Pro',
        status: 'available',
        department: 'Direction'
    },
    {
        id: 5,
        name: 'PC-005',
        serial_number: 'SN001238',
        type: 'Desktop',
        brand: 'Dell',
        model: 'OptiPlex 7090',
        status: 'available',
        department: 'R&D'
    }
];

export const mockUsers = [
    {
        id: 1,
        displayName: 'Jean Dupont',
        userName: 'j.dupont',
        department: 'Informatique',
        email: 'jean.dupont@anecoop.fr',
        position: 'Développeur'
    },
    {
        id: 2,
        displayName: 'Marie Martin',
        userName: 'm.martin',
        department: 'Comptabilité',
        email: 'marie.martin@anecoop.fr',
        position: 'Comptable'
    },
    {
        id: 3,
        displayName: 'Pierre Durand',
        userName: 'p.durand',
        department: 'Commercial',
        email: 'pierre.durand@anecoop.fr',
        position: 'Commercial'
    },
    {
        id: 4,
        displayName: 'Sophie Leroux',
        userName: 's.leroux',
        department: 'Direction',
        email: 'sophie.leroux@anecoop.fr',
        position: 'Directrice'
    },
    {
        id: 5,
        displayName: 'Antoine Blanc',
        userName: 'a.blanc',
        department: 'R&D',
        email: 'antoine.blanc@anecoop.fr',
        position: 'Ingénieur'
    }
];

export const mockLoans = [
    {
        id: 1,
        computerId: 1,
        computerName: 'PC-001',
        userId: 1,
        userName: 'j.dupont',
        userDisplayName: 'Jean Dupont',
        userDepartment: 'Informatique',
        technicianId: 1,
        technicianName: 'Jean Dupont',
        loanDate: '2024-11-01T09:00:00Z',
        expectedReturnDate: '2024-11-15T18:00:00Z',
        actualReturnDate: null,
        status: 'active',
        notes: 'Prêt pour développement projet X',
        accessories: ['Souris', 'Clavier'],
        location: 'Bureau 204',
        priority: 'normal',
        createdAt: '2024-11-01T09:00:00Z',
        updatedAt: '2024-11-01T09:00:00Z'
    },
    {
        id: 2,
        computerId: 2,
        computerName: 'PC-002',
        userId: 2,
        userName: 'm.martin',
        userDisplayName: 'Marie Martin',
        userDepartment: 'Comptabilité',
        technicianId: 2,
        technicianName: 'Marie Martin',
        loanDate: '2024-10-28T10:30:00Z',
        expectedReturnDate: '2024-11-10T17:00:00Z',
        actualReturnDate: null,
        status: 'overdue',
        notes: 'Révision comptes annuels',
        accessories: ['Écran externe'],
        location: 'Bureau 105',
        priority: 'high',
        createdAt: '2024-10-28T10:30:00Z',
        updatedAt: '2024-11-05T08:00:00Z'
    },
    {
        id: 3,
        computerId: 3,
        computerName: 'PC-003',
        userId: 3,
        userName: 'p.durand',
        userDisplayName: 'Pierre Durand',
        userDepartment: 'Commercial',
        technicianId: 3,
        technicianName: 'Pierre Durand',
        loanDate: '2024-11-02T14:15:00Z',
        expectedReturnDate: '2024-11-20T16:00:00Z',
        actualReturnDate: null,
        status: 'reserved',
        notes: 'Salon professionnel Lyon',
        accessories: ['Sacoche', 'Chargeur'],
        location: 'Déplacement',
        priority: 'normal',
        createdAt: '2024-11-02T14:15:00Z',
        updatedAt: '2024-11-02T14:15:00Z'
    },
    {
        id: 4,
        computerId: 4,
        computerName: 'PC-004',
        userId: 4,
        userName: 's.leroux',
        userDisplayName: 'Sophie Leroux',
        userDepartment: 'Direction',
        technicianId: 4,
        technicianName: 'Sophie Leroux',
        loanDate: '2024-10-25T08:00:00Z',
        expectedReturnDate: '2024-11-08T18:00:00Z',
        actualReturnDate: '2024-11-07T16:30:00Z',
        status: 'returned',
        notes: 'Présentation conseil d\'administration',
        accessories: ['Stylo tactile'],
        location: 'Salle de réunion',
        priority: 'urgent',
        createdAt: '2024-10-25T08:00:00Z',
        updatedAt: '2024-11-07T16:30:00Z'
    },
    {
        id: 5,
        computerId: 5,
        computerName: 'PC-005',
        userId: 5,
        userName: 'a.blanc',
        userDisplayName: 'Antoine Blanc',
        userDepartment: 'R&D',
        technicianId: 1,
        technicianName: 'Jean Dupont',
        loanDate: '2024-11-03T11:00:00Z',
        expectedReturnDate: '2024-11-03T23:59:00Z',
        actualReturnDate: null,
        status: 'critical',
        notes: 'Tests urgents sécurité',
        accessories: ['Clé USB chiffrée'],
        location: 'Lab R&D',
        priority: 'urgent',
        createdAt: '2024-11-03T11:00:00Z',
        updatedAt: '2024-11-04T06:00:00Z'
    }
];

export const mockLoanHistory = [
    {
        id: 1,
        loanId: 1,
        action: 'created',
        userId: 1,
        userName: 'Jean Dupont',
        timestamp: '2024-11-01T09:00:00Z',
        details: 'Prêt créé',
        previousStatus: null,
        newStatus: 'active'
    },
    {
        id: 2,
        loanId: 1,
        action: 'extended',
        userId: 1,
        userName: 'Jean Dupont',
        timestamp: '2024-11-05T14:30:00Z',
        details: 'Prêt prolongé de 7 jours',
        previousStatus: 'active',
        newStatus: 'active',
        reason: 'Développement en cours'
    },
    {
        id: 3,
        loanId: 2,
        action: 'status_changed',
        userId: 2,
        userName: 'Marie Martin',
        timestamp: '2024-11-10T18:00:00Z',
        details: 'Statut changé en retard',
        previousStatus: 'active',
        newStatus: 'overdue'
    },
    {
        id: 4,
        loanId: 4,
        action: 'returned',
        userId: 4,
        userName: 'Sophie Leroux',
        timestamp: '2024-11-07T16:30:00Z',
        details: 'Matériel retourné en bon état',
        previousStatus: 'active',
        newStatus: 'returned',
        condition: 'excellent'
    }
];

export const mockLoanNotifications = [
    {
        id: 1,
        loanId: 2,
        type: 'overdue_warning',
        title: 'Prêt en retard',
        message: 'Le prêt PC-002 de Marie Martin est en retard',
        priority: 'high',
        read: false,
        createdAt: '2024-11-11T09:00:00Z'
    },
    {
        id: 2,
        loanId: 5,
        type: 'critical_alert',
        title: 'Prêt critique',
        message: 'Le prêt PC-005 nécessite une attention immédiate',
        priority: 'urgent',
        read: false,
        createdAt: '2024-11-04T06:00:00Z'
    },
    {
        id: 3,
        loanId: 1,
        type: 'return_reminder',
        title: 'Rappel de retour',
        message: 'Le prêt PC-001 arrive à échéance demain',
        priority: 'medium',
        read: true,
        createdAt: '2024-11-14T08:00:00Z'
    }
];

// Fonction pour générer des données de test de grande taille
export const generateLargeMockData = (count = 1000) => {
    const loans = [];
    const statuses = ['active', 'overdue', 'returned', 'reserved', 'critical', 'cancelled'];
    const departments = ['Informatique', 'Comptabilité', 'Commercial', 'Direction', 'R&D', 'RH', 'Marketing'];
    const priorities = ['low', 'normal', 'high', 'urgent'];
    
    for (let i = 1; i <= count; i++) {
        const userIndex = (i - 1) % mockUsers.length;
        const computerIndex = (i - 1) % mockComputers.length;
        const technicianIndex = (i - 1) % mockTechnicians.length;
        
        const loanDate = new Date('2024-01-01T00:00:00Z');
        loanDate.setDate(loanDate.getDate() + Math.floor(Math.random() * 300));
        
        const expectedReturnDate = new Date(loanDate);
        expectedReturnDate.setDate(expectedReturnDate.getDate() + Math.floor(Math.random() * 30) + 1);
        
        const actualReturnDate = Math.random() > 0.6 ? new Date(expectedReturnDate) : null;
        if (actualReturnDate) {
            actualReturnDate.setDate(actualReturnDate.getDate() + Math.floor(Math.random() * 7) - 3);
        }
        
        loans.push({
            id: i,
            computerId: mockComputers[computerIndex].id,
            computerName: `PC-${String(i).padStart(3, '0')}`,
            userId: mockUsers[userIndex].id,
            userName: mockUsers[userIndex].userName,
            userDisplayName: mockUsers[userIndex].displayName,
            userDepartment: departments[i % departments.length],
            technicianId: mockTechnicians[technicianIndex].id,
            technicianName: mockTechnicians[technicianIndex].name,
            loanDate: loanDate.toISOString(),
            expectedReturnDate: expectedReturnDate.toISOString(),
            actualReturnDate: actualReturnDate ? actualReturnDate.toISOString() : null,
            status: statuses[i % statuses.length],
            notes: `Prêt de test ${i} - Notes automatiques`,
            accessories: Math.random() > 0.5 ? ['Accessoire 1', 'Accessoire 2'] : [],
            location: `Bureau ${100 + (i % 50)}`,
            priority: priorities[i % priorities.length],
            createdAt: loanDate.toISOString(),
            updatedAt: new Date().toISOString()
        });
    }
    
    return loans;
};

// Fonctions utilitaires pour les tests
export const createMockLoan = (overrides = {}) => {
    const defaultLoan = {
        id: Date.now(),
        computerId: 1,
        computerName: 'PC-TEST',
        userId: 1,
        userName: 'test.user',
        userDisplayName: 'Utilisateur Test',
        userDepartment: 'Test',
        technicianId: 1,
        technicianName: 'Technicien Test',
        loanDate: new Date().toISOString(),
        expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        actualReturnDate: null,
        status: 'active',
        notes: 'Prêt de test',
        accessories: [],
        location: 'Bureau Test',
        priority: 'normal'
    };
    
    return { ...defaultLoan, ...overrides };
};

export const createMockComputer = (overrides = {}) => {
    const defaultComputer = {
        id: Date.now(),
        name: 'PC-TEST',
        serial_number: 'SN-TEST',
        type: 'Laptop',
        brand: 'TestBrand',
        model: 'TestModel',
        status: 'available',
        department: 'Test'
    };
    
    return { ...defaultComputer, ...overrides };
};

export const createMockUser = (overrides = {}) => {
    const defaultUser = {
        id: Date.now(),
        displayName: 'Utilisateur Test',
        userName: 'test.user',
        department: 'Test',
        email: 'test@anecoop.fr',
        position: 'Testeur'
    };
    
    return { ...defaultUser, ...overrides };
};

// Données de test pour des scénarios spécifiques
export const mockScenarioData = {
    // Scénario de prêt expiré
    expiredLoan: createMockLoan({
        id: 999,
        status: 'overdue',
        loanDate: '2024-10-01T00:00:00Z',
        expectedReturnDate: '2024-10-08T00:00:00Z',
        actualReturnDate: null
    }),
    
    // Scénario de prêt critique
    criticalLoan: createMockLoan({
        id: 998,
        status: 'critical',
        priority: 'urgent',
        notes: 'Demande urgente du directeur'
    }),
    
    // Scénario de prêt réservé
    reservedLoan: createMockLoan({
        id: 997,
        status: 'reserved',
        notes: 'Réservé pour événement spécial'
    }),
    
    // Scénario de prêt avec accessoires
    loanWithAccessories: createMockLoan({
        id: 996,
        accessories: [
            { name: 'Souris Logitech', serial: 'SM001', condition: 'good' },
            { name: 'Clavier mécanique', serial: 'KB001', condition: 'excellent' },
            { name: 'Écran 24"', serial: 'MN001', condition: 'good' }
        ]
    })
};

// Données pour tests d'export
export const mockExportData = {
    excelColumns: [
        'ID',
        'Ordinateur',
        'Utilisateur',
        'Département',
        'Technicien',
        'Date début',
        'Date retour prévue',
        'Date retour réelle',
        'Statut',
        'Notes'
    ],
    
    pdfFields: [
        'id',
        'computerName',
        'userDisplayName',
        'userDepartment',
        'technicianName',
        'loanDate',
        'expectedReturnDate',
        'actualReturnDate',
        'status',
        'notes'
    ]
};

// Données pour tests QR Code
export const mockQRCodeData = {
    basicQR: {
        type: 'computer',
        id: 1,
        name: 'PC-001',
        serial: 'SN001234',
        loanId: 1
    },
    
    enhancedQR: {
        type: 'computer',
        id: 1,
        name: 'PC-001',
        serial: 'SN001234',
        loanId: 1,
        location: 'Bureau 204',
        user: 'Jean Dupont',
        department: 'Informatique',
        returnDate: '2024-11-15'
    }
};

// Export par défaut de toutes les données mockées
export default {
    technicians: mockTechnicians,
    computers: mockComputers,
    users: mockUsers,
    loans: mockLoans,
    loanHistory: mockLoanHistory,
    notifications: mockLoanNotifications,
    generateLargeMockData,
    createMockLoan,
    createMockComputer,
    createMockUser,
    mockScenarioData,
    mockExportData,
    mockQRCodeData
};
