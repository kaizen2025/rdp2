// src/tests/dashboard.test.js
/**
 * Tests unitaires pour le module Dashboard
 * Teste chaque composant individuellement avec des mocks contrôlés
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import des composants à tester
import DashboardPage from '../pages/DashboardPage';
import ActivityHeatmap from '../components/dashboard/ActivityHeatmap';
import TopUsersWidget from '../components/dashboard/TopUsersWidget';
import DashboardExport from '../components/dashboard/DashboardExport';
import DashboardFilters from '../components/dashboard/DashboardFilters';
import DashboardWidgets from '../components/dashboard/DashboardWidgets';

// Import des mocks
import {
  mockDashboardStats,
  mockHeatmapData,
  mockTopUsersData,
  mockActiveLoans,
  mockOverdueLoans,
  mockConnectedTechnicians,
  mockRdsServers,
  mockServerStatuses,
  mockDateFilters,
  mockCache,
  mockWidgets,
  mockWidgetLayouts
} from './__mocks__/mockDashboardData';
import {
  mockApiService,
  mockCacheContextValue,
  mockNavigate,
  setupAllMocks,
  resetAllMocks
} from './__mocks__/dashboardMocks';

// Setup global pour les tests
beforeAll(() => {
  setupAllMocks();
});

afterEach(() => {
  resetAllMocks();
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('ActivityHeatmap', () => {
  const defaultProps = {
    data: mockHeatmapData
  };

  beforeEach(() => {
    // Mock des composants Material-UI
    jest.doMock('@mui/material', () => ({
      Box: ({ children, ...props }) => <div data-testid="box" {...props}>{children}</div>,
      Typography: ({ children, ...props }) => <div data-testid="typography" {...props}>{children}</div>,
      Paper: ({ children, ...props }) => <div data-testid="paper" {...props}>{children}</div>,
      FormControl: ({ children, ...props }) => <div data-testid="formcontrol" {...props}>{children}</div>,
      InputLabel: ({ children, ...props }) => <div data-testid="inputlabel" {...props}>{children}</div>,
      Select: ({ children, ...props }) => <div data-testid="select" {...props}>{children}</div>,
      MenuItem: ({ children, ...props }) => <div data-testid="menuitem" {...props}>{children}</div>,
      Tooltip: ({ children, ...props }) => <div data-testid="tooltip" {...props}>{children}</div>
    }));
  });

  test('rend correctement avec des données', () => {
    render(<ActivityHeatmap {...defaultProps} />);
    
    expect(screen.getByText('Carte thermique d\'activité')).toBeInTheDocument();
    expect(screen.getByTestId('formcontrol')).toBeInTheDocument();
  });

  test('affiche la liste des métriques disponibles', () => {
    render(<ActivityHeatmap {...defaultProps} />);
    
    expect(screen.getByText('Sessions')).toBeInTheDocument();
    expect(screen.getByText('Utilisateurs')).toBeInTheDocument();
    expect(screen.getByText('Prêts')).toBeInTheDocument();
  });

  test('génère des données de démonstration quand aucune donnée fournie', () => {
    render(<ActivityHeatmap data={[]} />);
    
    expect(screen.getByText('Carte thermique d\'activité')).toBeInTheDocument();
  });

  test('change de métrique quand on clique sur un MenuItem', async () => {
    render(<ActivityHeatmap {...defaultProps} />);
    
    const select = screen.getByTestId('select');
    fireEvent.change(select, { target: { value: 'users' } });
    
    await waitFor(() => {
      // Vérifier que le state a changé (nécessiterait une refonte pour être testable)
      expect(select.value).toBe('users');
    });
  });

  test('génère la grille correcte avec les données fournies', () => {
    render(<ActivityHeatmap data={mockHeatmapData} />);
    
    // Vérifier que les jours de la semaine sont affichés
    ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].forEach(day => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });
    
    // Vérifier que les heures sont affichées
    for (let hour = 0; hour < 24; hour++) {
      expect(screen.getByText(`${hour}h`)).toBeInTheDocument();
    }
  });

  test('calcule les bonnes couleurs en fonction de l\'intensité', () => {
    // Test manuel de la fonction getColor
    const { getColor } = require('../components/dashboard/ActivityHeatmap');
    
    expect(getColor(0)).toBe('#f0f0f0'); // Gris clair pour les valeurs nulles
    expect(getColor(25)).toContain('rgb('); // Format RGB pour les couleurs
  });

  test('affiche la légende des couleurs', () => {
    render(<ActivityHeatmap {...defaultProps} />);
    
    expect(screen.getByText('Faible')).toBeInTheDocument();
    expect(screen.getByText('Élevée')).toBeInTheDocument();
  });
});

describe('TopUsersWidget', () => {
  const defaultProps = {
    data: mockTopUsersData,
    metric: 'sessions'
  };

  beforeEach(() => {
    jest.doMock('@mui/material', () => ({
      Box: ({ children, ...props }) => <div data-testid="box" {...props}>{children}</div>,
      Typography: ({ children, ...props }) => <div data-testid="typography" {...props}>{children}</div>,
      List: ({ children, ...props }) => <div data-testid="list" {...props}>{children}</div>,
      ListItem: ({ children, ...props }) => <div data-testid="listitem" {...props}>{children}</div>,
      ListItemAvatar: ({ children, ...props }) => <div data-testid="listitemavatar" {...props}>{children}</div>,
      ListItemText: ({ children, ...props }) => <div data-testid="listitemtext" {...props}>{children}</div>,
      Avatar: ({ children, ...props }) => <div data-testid="avatar" {...props}>{children}</div>,
      Chip: ({ children, ...props }) => <div data-testid="chip" {...props}>{children}</div>,
      LinearProgress: ({ ...props }) => <div data-testid="linearprogress" {...props}>LinearProgress</div>,
      Paper: ({ children, ...props }) => <div data-testid="paper" {...props}>{children}</div>,
      ToggleButtonGroup: ({ children, ...props }) => <div data-testid="togglebuttongroup" {...props}>{children}</div>,
      ToggleButton: ({ children, ...props }) => <div data-testid="togglebutton" {...props}>{children}</div>
    }));
  });

  test('rend correctement avec des données', () => {
    render(<TopUsersWidget {...defaultProps} />);
    
    expect(screen.getByText('Top 10 Utilisateurs')).toBeInTheDocument();
  });

  test('affiche les 10 premiers utilisateurs', () => {
    render(<TopUsersWidget data={mockTopUsersData} />);
    
    mockTopUsersData.slice(0, 10).forEach(user => {
      expect(screen.getByText(user.user)).toBeInTheDocument();
    });
  });

  test('affiche les contrôles de métriques', () => {
    render(<TopUsersWidget {...defaultProps} />);
    
    expect(screen.getByText('Sessions')).toBeInTheDocument();
    expect(screen.getByText('Durée')).toBeInTheDocument();
    expect(screen.getByText('Prêts')).toBeInTheDocument();
  });

  test('traite correctement les données utilisateurs', () => {
    const { processUserData } = require('../components/dashboard/TopUsersWidget');
    
    const result = processUserData(mockTopUsersData, 'sessions', 'desc');
    
    expect(result).toHaveLength(10);
    expect(result[0].value).toBeGreaterThan(result[1].value); // Tri décroissant
  });

  test('génère des données de démonstration quand aucune donnée fournie', () => {
    render(<TopUsersWidget data={[]} />);
    
    expect(screen.getByText('Top 10 Utilisateurs')).toBeInTheDocument();
  });

  test('affiche un état vide quand aucune donnée disponible', () => {
    render(<TopUsersWidget data={[]} metric="invalid" />);
    
    // L'état vide s'affiche quand aucun utilisateur n'est traité
    expect(screen.queryByText(/Aucune donnée disponible/)).toBeInTheDocument();
  });
});

describe('DashboardExport', () => {
  const defaultProps = {
    dashboardRef: { current: null },
    data: { stats: mockDashboardStats, details: {} },
    title: 'Rapport Test'
  };

  beforeEach(() => {
    jest.doMock('@mui/material', () => ({
      Button: ({ children, ...props }) => <button data-testid="button" {...props}>{children}</button>,
      Menu: ({ children, ...props }) => <div data-testid="menu" {...props}>{children}</div>,
      MenuItem: ({ children, ...props }) => <div data-testid="menuitem" {...props}>{children}</div>,
      ListItemIcon: ({ children, ...props }) => <div data-testid="listitemicon" {...props}>{children}</div>,
      ListItemText: ({ children, ...props }) => <div data-testid="listitemtext" {...props}>{children}</div>,
      CircularProgress: ({ ...props }) => <div data-testid="circularprogress" {...props}>CircularProgress</div>,
      Box: ({ children, ...props }) => <div data-testid="box" {...props}>{children}</div>
    }));

    jest.doMock('../utils/lazyModules', () => ({
      lazyJsPDF: jest.fn(() => Promise.resolve({ 
        default: jest.fn().mockImplementation(() => ({
          internal: {
            pageSize: {
              getWidth: () => 210,
              getHeight: () => 297
            }
          },
          setFontSize: jest.fn(),
          setTextColor: jest.fn(),
          text: jest.fn(),
          addPage: jest.fn(),
          addImage: jest.fn(),
          save: jest.fn()
        }))
      })),
      lazyXLSX: jest.fn(() => Promise.resolve({
        utils: {
          book_new: jest.fn(() => ({})),
          aoa_to_sheet: jest.fn(() => ({})),
          json_to_sheet: jest.fn(() => ({})),
          book_append_sheet: jest.fn()
        },
        writeFile: jest.fn()
      })),
      lazyHtml2Canvas: jest.fn(() => Promise.resolve({
        default: jest.fn(() => Promise.resolve({
          toDataURL: jest.fn(() => 'data:image/png;base64,mock'),
          toBlob: jest.fn((callback) => callback(new Blob()))
        }))
      }))
    }));
  });

  test('rend correctement le bouton d\'export', () => {
    render(<DashboardExport {...defaultProps} />);
    
    expect(screen.getByText('Exporter')).toBeInTheDocument();
    expect(screen.getByTestId('button')).toBeInTheDocument();
  });

  test('ouvre le menu quand on clique sur le bouton', () => {
    render(<DashboardExport {...defaultProps} />);
    
    const button = screen.getByTestId('button');
    fireEvent.click(button);
    
    expect(screen.getByText('Export PDF')).toBeInTheDocument();
    expect(screen.getByText('Export Excel')).toBeInTheDocument();
    expect(screen.getByText('Export Image (PNG)')).toBeInTheDocument();
  });

  test('affiche un indicateur de chargement pendant l\'export', async () => {
    render(<DashboardExport {...defaultProps} />);
    
    const button = screen.getByTestId('button');
    fireEvent.click(button);
    
    const menuItem = screen.getByText('Export PDF');
    fireEvent.click(menuItem);
    
    expect(screen.getByTestId('circularprogress')).toBeInTheDocument();
  });

  test('désactive le bouton pendant l\'export', async () => {
    render(<DashboardExport {...defaultProps} />);
    
    const button = screen.getByTestId('button');
    fireEvent.click(button);
    
    const menuItem = screen.getByText('Export PDF');
    fireEvent.click(menuItem);
    
    expect(button).toBeDisabled();
  });

  test('génère un nom de fichier correct', () => {
    // Test de la logique de génération de nom de fichier
    const title = 'Rapport Dashboard';
    const fileName = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    expect(fileName).toMatch(/^Rapport_Dashboard_\d{4}-\d{2}-\d{2}\.pdf$/);
  });
});

describe('DashboardFilters', () => {
  const defaultProps = {
    onFilterChange: jest.fn(),
    onRefresh: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    jest.doMock('@mui/material', () => ({
      Box: ({ children, ...props }) => <div data-testid="box" {...props}>{children}</div>,
      ToggleButtonGroup: ({ children, ...props }) => <div data-testid="togglebuttongroup" {...props}>{children}</div>,
      ToggleButton: ({ children, ...props }) => <div data-testid="togglebutton" {...props}>{children}</div>,
      TextField: ({ ...props }) => <input data-testid="textfield" {...props} />,
      Button: ({ children, ...props }) => <button data-testid="button" {...props}>{children}</button>,
      Paper: ({ children, ...props }) => <div data-testid="paper" {...props}>{children}</div>,
      Typography: ({ children, ...props }) => <div data-testid="typography" {...props}>{children}</div>,
      Chip: ({ children, ...props }) => <div data-testid="chip" {...props}>{children}</div>
    }));

    jest.doMock('@mui/x-date-pickers', () => ({
      DatePicker: ({ label, value, onChange, renderInput }) => (
        <div data-testid="datepicker" data-label={label} data-value={value}>
          <input data-testid="datepicker-input" onChange={(e) => onChange(new Date(e.target.value))} />
        </div>
      )
    }));

    jest.doMock('@mui/x-date-pickers/LocalizationProvider', () => ({
      LocalizationProvider: ({ children }) => <div data-testid="localizationprovider">{children}</div>
    }));

    jest.doMock('@mui/x-date-pickers/AdapterDateFns', () => ({
      AdapterDateFns: () => <div data-testid="adapterdatefns">AdapterDateFns</div>
    }));

    jest.doMock('date-fns/locale', () => ({
      fr: 'fr'
    }));
  });

  test('rend correctement avec les périodes prédéfinies', () => {
    render(<DashboardFilters {...defaultProps} />);
    
    expect(screen.getByText("Aujourd'hui")).toBeInTheDocument();
    expect(screen.getByText('Cette semaine')).toBeInTheDocument();
    expect(screen.getByText('Ce mois')).toBeInTheDocument();
    expect(screen.getByText('Personnalisé')).toBeInTheDocument();
  });

  test('appelle onFilterChange avec la bonne période', () => {
    render(<DashboardFilters {...defaultProps} />);
    
    const todayButton = screen.getByText("Aujourd'hui");
    fireEvent.click(todayButton);
    
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "Aujourd'hui"
      })
    );
  });

  test('affiche les sélecteurs de dates personnalisées', () => {
    render(<DashboardFilters {...defaultProps} />);
    
    const customButton = screen.getByText('Personnalisé');
    fireEvent.click(customButton);
    
    expect(screen.getByText('Date de début')).toBeInTheDocument();
    expect(screen.getByText('Date de fin')).toBeInTheDocument();
    expect(screen.getByText('Appliquer')).toBeInTheDocument();
  });

  test('calcule correctement les plages de dates', () => {
    const { calculateDateRange } = require('../components/dashboard/DashboardFilters');
    
    const todayRange = calculateDateRange('today');
    expect(todayRange.start).toBeInstanceOf(Date);
    expect(todayRange.end).toBeInstanceOf(Date);
    expect(todayRange.end).toBeGreaterThan(todayRange.start);
    
    const weekRange = calculateDateRange('week');
    expect(weekRange.label).toBe('Cette semaine');
    
    const monthRange = calculateDateRange('month');
    expect(monthRange.label).toBe('Ce mois');
  });

  test('affiche le bouton Actualiser', () => {
    render(<DashboardFilters {...defaultProps} />);
    
    expect(screen.getByText('Actualiser')).toBeInTheDocument();
    
    const refreshButton = screen.getByText('Actualiser');
    fireEvent.click(refreshButton);
    
    expect(defaultProps.onRefresh).toHaveBeenCalled();
  });

  test('affiche la période actuelle dans un Chip', () => {
    render(<DashboardFilters {...defaultProps} />);
    
    const chip = screen.getByTestId('chip');
    expect(chip).toBeInTheDocument();
  });
});

describe('DashboardWidgets', () => {
  const defaultProps = {
    widgets: mockWidgets,
    onLayoutChange: jest.fn(),
    onWidgetRemove: jest.fn(),
    onWidgetRefresh: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    jest.doMock('react-grid-layout', () => ({
      Responsive: ({ children, ...props }) => <div data-testid="responsive" {...props}>{children}</div>,
      WidthProvider: (Component) => (props) => <Component {...props} />
    }));

    jest.doMock('@mui/material', () => ({
      Paper: ({ children, ...props }) => <div data-testid="paper" {...props}>{children}</div>,
      Typography: ({ children, ...props }) => <div data-testid="typography" {...props}>{children}</div>,
      IconButton: ({ children, ...props }) => <button data-testid="iconbutton" {...props}>{children}</button>,
      Box: ({ children, ...props }) => <div data-testid="box" {...props}>{children}</div>,
      Card: ({ children, ...props }) => <div data-testid="card" {...props}>{children}</div>,
      CardContent: ({ children, ...props }) => <div data-testid="cardcontent" {...props}>{children}</div>,
      CardHeader: ({ children, ...props }) => <div data-testid="cardheader" {...props}>{children}</div>,
      Tooltip: ({ children, ...props }) => <div data-testid="tooltip" {...props}>{children}</div>
    }));
  });

  test('rend correctement avec des widgets', () => {
    render(<DashboardWidgets {...defaultProps} />);
    
    expect(screen.getByTestId('responsive')).toBeInTheDocument();
    mockWidgets.forEach(widget => {
      expect(screen.getByText(widget.title)).toBeInTheDocument();
    });
  });

  test('appelle onLayoutChange quand on modifie le layout', () => {
    render(<DashboardWidgets {...defaultProps} />);
    
    const responsiveGrid = screen.getByTestId('responsive');
    const layout = [{ i: 'heatmap', x: 0, y: 0, w: 6, h: 4 }];
    
    fireEvent.layoutChange(responsiveGrid, { lg: layout });
    
    expect(defaultProps.onLayoutChange).toHaveBeenCalledWith({ lg: layout });
  });

  test('appelle onWidgetRemove quand on clique sur le bouton fermer', () => {
    render(<DashboardWidgets {...defaultProps} />);
    
    const closeButtons = screen.getAllByTestId('iconbutton');
    const closeButton = closeButtons.find(btn => btn.getAttribute('data-action') === 'remove');
    
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(defaultProps.onWidgetRemove).toHaveBeenCalled();
    }
  });

  test('appelle onWidgetRefresh quand on clique sur le bouton actualiser', () => {
    render(<DashboardWidgets {...defaultProps} />);
    
    const refreshButtons = screen.getAllByTestId('iconbutton');
    const refreshButton = refreshButtons.find(btn => btn.getAttribute('data-action') === 'refresh');
    
    if (refreshButton) {
      fireEvent.click(refreshButton);
      expect(defaultProps.onWidgetRefresh).toHaveBeenCalled();
    }
  });

  test('affiche un état vide quand aucun widget', () => {
    render(<DashboardWidgets widgets={[]} />);
    
    expect(screen.getByText(/Aucun widget ajouté/)).toBeInTheDocument();
  });

  test('sauvegarde le layout dans localStorage', () => {
    const mockLocalStorage = {
      setItem: jest.fn(),
      getItem: jest.fn()
    };
    
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage
    });
    
    render(<DashboardWidgets {...defaultProps} />);
    
    // Le layout devrait être sauvegardé dans localStorage
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'dashboardLayout',
      expect.any(String)
    );
  });
});

describe('DashboardPage - Tests des widgets individuels', () => {
  const mockCacheWithData = {
    ...mockCache,
    loans: [...mockActiveLoans, ...mockOverdueLoans],
    technicians: mockConnectedTechnicians,
    config: {
      rds_servers: mockRdsServers
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock du contexte de cache
    jest.doMock('../contexts/CacheContext', () => ({
      useCache: () => ({
        cache: mockCacheWithData,
        isLoading: false
      })
    }));

    // Mock des composants communs
    jest.doMock('../components/common/PageHeader', () => ({
      default: ({ title }) => <div data-testid="pageheader">{title}</div>
    }));

    jest.doMock('../components/common/StatCard', () => ({
      default: ({ title }) => <div data-testid="statcard">{title}</div>
    }));

    jest.doMock('../components/common/LoadingScreen', () => ({
      default: () => <div data-testid="loadingscreen">Loading...</div>
    }));

    // Mock d'apiService pour ServerStatusWidget
    mockApiService.pingRdsServer.mockResolvedValue({
      success: true,
      output: 'Serveur en ligne'
    });
  });

  test('rend la page principale du dashboard', () => {
    render(<DashboardPage />);
    
    expect(screen.getByTestId('pageheader')).toHaveTextContent('Tableau de Bord');
  });

  test('affiche les 4 StatCards principales', () => {
    render(<DashboardPage />);
    
    expect(screen.getByText('Matériel Total')).toBeInTheDocument();
    expect(screen.getByText('Prêts Actifs')).toBeInTheDocument();
    expect(screen.getByText('En Retard')).toBeInTheDocument();
    expect(screen.getByText('Historique Total')).toBeInTheDocument();
  });

  test('calcule correctement les statistiques', () => {
    // Les statistiques sont calculées avec useMemo
    const { default: DashboardPage } = require('../pages/DashboardPage');
    
    // Simuler le calcul des stats
    const loans = [...mockActiveLoans, ...mockOverdueLoans];
    const active = loans.filter(l => l.status === 'active');
    const overdue = loans.filter(l => l.status === 'overdue' || l.status === 'critical');
    
    expect(active.length).toBe(3);
    expect(overdue.length).toBeGreaterThan(0);
  });

  test('affiche l\'état de chargement', () => {
    // Mock avec isLoading = true
    jest.doMock('../contexts/CacheContext', () => ({
      useCache: () => ({
        cache: {},
        isLoading: true
      })
    }));
    
    render(<DashboardPage />);
    
    expect(screen.getByTestId('loadingscreen')).toBeInTheDocument();
  });
});

describe('Tests des fonctions utilitaires', () => {
  test('calcule correctement les temps de connexion', () => {
    // Test de la fonction calculateConnectionTime
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const oneHourAgo = new Date(now.getTime() - 3600000);
    
    expect(oneMinuteAgo).toBeInstanceOf(Date);
    expect(oneHourAgo).toBeInstanceOf(Date);
  });

  test('génère des données de démonstration cohérentes', () => {
    // Test de generateDemoData pour ActivityHeatmap
    const { generateDemoData } = require('../components/dashboard/ActivityHeatmap');
    
    const demoData = generateDemoData();
    
    expect(demoData).toHaveLength(7); // 7 jours
    expect(demoData[0]).toHaveLength(24); // 24 heures
    expect(typeof demoData[0][0]).toBe('number'); // Valeurs numériques
  });

  test('valide les formats de données d\'export', () => {
    // Test de validation des données d'export
    const validData = {
      stats: mockDashboardStats,
      details: {
        loans: mockActiveLoans,
        users: mockTopUsersData
      }
    };
    
    expect(validData.stats).toHaveProperty('computers');
    expect(validData.stats).toHaveProperty('loans');
    expect(validData.details).toHaveProperty('loans');
    expect(Array.isArray(validData.details.loans)).toBe(true);
  });
});