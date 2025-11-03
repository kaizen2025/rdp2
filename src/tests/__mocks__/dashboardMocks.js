/**
 * Mocks des services utilisés par le Dashboard
 */

// Mock d'apiService
export const mockApiService = {
  pingRdsServer: jest.fn(),
  getDashboardStats: jest.fn(),
  getHeatmapData: jest.fn(),
  getTopUsers: jest.fn(),
  getActiveLoans: jest.fn(),
  getOverdueLoans: jest.fn(),
  getServerStatuses: jest.fn(),
  refreshDashboard: jest.fn()
};

// Mock de CacheContext
export const mockCacheContextValue = {
  cache: {
    loans: [],
    computers: [],
    loan_history: [],
    technicians: [],
    config: {
      rds_servers: []
    }
  },
  isLoading: false,
  updateCache: jest.fn(),
  clearCache: jest.fn(),
  refreshCache: jest.fn()
};

// Mock de react-router-dom
export const mockNavigate = jest.fn();
export const mockLocationState = {};

// Mock des composants Material-UI
export const mockMuiComponents = {
  Box: ({ children, ...props }) => <div data-testid="mui-box" {...props}>{children}</div>,
  Grid: ({ children, ...props }) => <div data-testid="mui-grid" {...props}>{children}</div>,
  Paper: ({ children, ...props }) => <div data-testid="mui-paper" {...props}>{children}</div>,
  Typography: ({ children, ...props }) => <div data-testid="mui-typography" {...props}>{children}</div>,
  List: ({ children, ...props }) => <div data-testid="mui-list" {...props}>{children}</div>,
  ListItem: ({ children, ...props }) => <div data-testid="mui-listitem" {...props}>{children}</div>,
  ListItemText: ({ children, ...props }) => <div data-testid="mui-listitemtext" {...props}>{children}</div>,
  ListItemAvatar: ({ children, ...props }) => <div data-testid="mui-listitemavatar" {...props}>{children}</div>,
  Avatar: ({ children, ...props }) => <div data-testid="mui-avatar" {...props}>{children}</div>,
  Chip: ({ children, ...props }) => <div data-testid="mui-chip" {...props}>{children}</div>,
  CircularProgress: ({ ...props }) => <div data-testid="mui-circularprogress" {...props}>CircularProgress</div>,
  FormControl: ({ children, ...props }) => <div data-testid="mui-formcontrol" {...props}>{children}</div>,
  InputLabel: ({ children, ...props }) => <div data-testid="mui-inputlabel" {...props}>{children}</div>,
  Select: ({ children, ...props }) => <div data-testid="mui-select" {...props}>{children}</div>,
  MenuItem: ({ children, ...props }) => <div data-testid="mui-menuitem" {...props}>{children}</div>,
  Button: ({ children, ...props }) => <button data-testid="mui-button" {...props}>{children}</button>,
  ToggleButtonGroup: ({ children, ...props }) => <div data-testid="mui-togglebuttongroup" {...props}>{children}</div>,
  ToggleButton: ({ children, ...props }) => <div data-testid="mui-togglebutton" {...props}>{children}</div>,
  LinearProgress: ({ ...props }) => <div data-testid="mui-linearprogress" {...props}>LinearProgress</div>,
  Tooltip: ({ children, ...props }) => <div data-testid="mui-tooltip" {...props}>{children}</div>,
  Card: ({ children, ...props }) => <div data-testid="mui-card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }) => <div data-testid="mui-cardcontent" {...props}>{children}</div>,
  CardHeader: ({ children, ...props }) => <div data-testid="mui-cardheader" {...props}>{children}</div>,
  IconButton: ({ children, ...props }) => <button data-testid="mui-iconbutton" {...props}>{children}</button>,
  TextField: ({ ...props }) => <input data-testid="mui-textfield" {...props} />,
  Menu: ({ children, ...props }) => <div data-testid="mui-menu" {...props}>{children}</div>
};

// Mock des icônes Material-UI
export const mockMuiIcons = {
  Dashboard: () => <div data-testid="icon-dashboard">DashboardIcon</div>,
  Dns: () => <div data-testid="icon-dns">DnsIcon</div>,
  CheckCircle: () => <div data-testid="icon-checkcircle">CheckCircleIcon</div>,
  Cancel: () => <div data-testid="icon-cancel">CancelIcon</div>,
  People: () => <div data-testid="icon-people">PeopleIcon</div>,
  AccessTime: () => <div data-testid="icon-accesstime">AccessTimeIcon</div>,
  History: () => <div data-testid="icon-history">HistoryIcon</div>,
  Assignment: () => <div data-testid="icon-assignment">AssignmentIcon</div>,
  TrendingUp: () => <div data-testid="icon-trendingup">TrendingUpIcon</div>,
  Warning: () => <div data-testid="icon-warning">WarningIcon</div>,
  LaptopChromebook: () => <div data-testid="icon-laptop">LaptopChromebookIcon</div>,
  ErrorOutline: () => <div data-testid="icon-error">ErrorOutlineIcon</div>,
  Person: () => <div data-testid="icon-person">PersonIcon</div>,
  TrendingDown: () => <div data-testid="icon-trendingdown">TrendingDownIcon</div>,
  Download: () => <div data-testid="icon-download">DownloadIcon</div>,
  PictureAsPdf: () => <div data-testid="icon-pdf">PictureAsPdfIcon</div>,
  TableChart: () => <div data-testid="icon-excel">TableChartIcon</div>,
  Image: () => <div data-testid="icon-image">ImageIcon</div>,
  Today: () => <div data-testid="icon-today">TodayIcon</div>,
  DateRange: () => <div data-testid="icon-daterange">DateRangeIcon</div>,
  CalendarMonth: () => <div data-testid="icon-calendar">CalendarMonthIcon</div>,
  Refresh: () => <div data-testid="icon-refresh">RefreshIcon</div>,
  Close: () => <div data-testid="icon-close">CloseIcon</div>,
  DragIndicator: () => <div data-testid="icon-drag">DragIndicatorIcon</div>
};

// Mock des hooks React
export const mockUseCache = () => mockCacheContextValue;
export const mockUseNavigate = () => mockNavigate;
export const mockUseMemo = (fn, deps) => fn();
export const mockUseCallback = (fn, deps) => fn;
export const mockUseEffect = (fn, deps) => {
  if (deps === undefined || deps.length === 0) {
    fn();
    return () => {};
  }
};

// Mock des modules externes
export const mockLazyModules = {
  lazyJsPDF: jest.fn(() => Promise.resolve({ default: jest.fn() })),
  lazyXLSX: jest.fn(() => Promise.resolve({ utils: { book_new: jest.fn(), aoa_to_sheet: jest.fn(), json_to_sheet: jest.fn(), book_append_sheet: jest.fn(), writeFile: jest.fn() } })),
  lazyHtml2Canvas: jest.fn(() => Promise.resolve({ default: jest.fn(() => Promise.resolve({ toDataURL: jest.fn(), toBlob: jest.fn() })) }))
};

// Mock de react-grid-layout
export const mockResponsiveGridLayout = {
  Responsive: ({ children, ...props }) => <div data-testid="responsive-grid-layout" {...props}>{children}</div>,
  WidthProvider: (Component) => (props) => <Component {...props} />
};

// Mock de date-fns
export const mockDateFns = {
  fr: { locale: 'fr' },
  format: jest.fn((date) => date.toISOString().split('T')[0]),
  parse: jest.fn((date) => new Date(date))
};

// Mock de localStorage avec persistance
export const createLocalStorageMock = () => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
};

// Fonction pour configurer tous les mocks
export const setupAllMocks = () => {
  // Mock localStorage
  global.localStorage = createLocalStorageMock();

  // Mock fetch
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true, data: {} })
    })
  );

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // Mock ResizeObserver
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
};

// Fonction pour réinitialiser tous les mocks
export const resetAllMocks = () => {
  jest.clearAllMocks();
  if (global.localStorage) {
    global.localStorage.clear();
  }
  if (global.fetch) {
    global.fetch.mockClear();
  }
};

export default {
  mockApiService,
  mockCacheContextValue,
  mockNavigate,
  mockLocationState,
  mockMuiComponents,
  mockMuiIcons,
  mockUseCache,
  mockUseNavigate,
  mockUseMemo,
  mockUseCallback,
  mockUseEffect,
  mockLazyModules,
  mockResponsiveGridLayout,
  mockDateFns,
  createLocalStorageMock,
  setupAllMocks,
  resetAllMocks
};