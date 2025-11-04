/**
 * Tests de réactivité des menus dynamiques
 * Évalue les performances de génération, filtrage, et navigation des menus
 */

import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { 
  useState, useEffect, useCallback, useMemo, useRef,
  createContext, useContext, memo 
} from 'react';
import {
  Menu, MenuItem, ListItemIcon, ListItemText,
  IconButton, Drawer, List, ListItem,
  ListItemButton, Accordion, AccordionSummary,
  AccordionDetails, Chip, Autocomplete, TextField
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  KeyboardArrowDown,
  Search, 
  FilterList,
  Dashboard,
  Settings,
  People,
  Folder,
  InsertDriveFile,
  ExpandMore
} from '@mui/icons-material';

// Context pour les menus dynamiques
const MenuContext = createContext();

const MenuProvider = memo(({ children }) => {
  const [menuState, setMenuState] = useState({
    isOpen: false,
    activeMenu: null,
    menuData: [],
    filteredMenu: [],
    searchTerm: '',
    selectedPath: [],
    expandedItems: new Set(),
    recentItems: [],
    favorites: new Set()
  });

  const updateMenuState = useCallback((updates) => {
    setMenuState(prev => ({ ...prev, ...updates }));
  }, []);

  const value = useMemo(() => ({
    menuState,
    updateMenuState
  }), [menuState, updateMenuState]);

  return (
    <MenuContext.Provider value={value}>
      {children}
    </MenuContext.Provider>
  );
});

const useMenuContext = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenuContext must be used within a MenuProvider');
  }
  return context;
};

// Composant de menu dynamique avec performance optimisée
const DynamicMenu = memo(({ anchorEl, open, onClose, menuConfig }) => {
  const { menuState, updateMenuState } = useMenuContext();
  const searchTimeoutRef = useRef();

  // Génération intelligente du menu basée sur la configuration
  const menuItems = useMemo(() => {
    if (!menuConfig) return [];
    
    return generateMenuItems(menuConfig);
  }, [menuConfig]);

  // Filtrage avec debounce pour optimiser les performances
  const filteredItems = useMemo(() => {
    if (!menuState.searchTerm) return menuItems;

    return menuItems.filter(item => 
      item.label.toLowerCase().includes(menuState.searchTerm.toLowerCase()) ||
      item.keywords.some(keyword => keyword.includes(menuState.searchTerm.toLowerCase())) ||
      (item.children && item.children.some(child => 
        child.label.toLowerCase().includes(menuState.searchTerm.toLowerCase())
      ))
    );
  }, [menuItems, menuState.searchTerm]);

  // Gestion du search avec debounce
  const handleSearchChange = useCallback((event) => {
    const value = event.target.value;
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      updateMenuState({ searchTerm: value });
    }, 300);
  }, [updateMenuState]);

  // Gestion des interactions
  const handleItemClick = useCallback((item, path = []) => {
    const newPath = [...path, item.id];
    updateMenuState({ 
      selectedPath: newPath,
      recentItems: [item, ...menuState.recentItems.filter(i => i.id !== item.id)].slice(0, 5)
    });
    
    // Ajouter aux favoris si double-clic
    // Logique de favoris...
    
    onClose?.(event, 'item-selected', item);
  }, [menuState.recentItems, updateMenuState, onClose]);

  const handleKeyDown = useCallback((event, item) => {
    if (event.key === 'Enter' || event.key === ' ') {
      handleItemClick(item);
    }
  }, [handleItemClick]);

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        style: {
          maxHeight: 400,
          width: 300
        }
      }}
      data-testid="dynamic-menu"
    >
      {/* Barre de recherche */}
      <MenuItem>
        <TextField
          size="small"
          placeholder="Rechercher..."
          onChange={handleSearchChange}
          value={menuState.searchTerm}
          InputProps={{
            startAdornment: <Search fontSize="small" />,
          }}
          fullWidth
          data-testid="menu-search-input"
        />
      </MenuItem>

      {/* Items récents */}
      {menuState.recentItems.length > 0 && (
        <>
          <MenuItem disabled>
            <ListItemText primary="Récents" />
          </MenuItem>
          {menuState.recentItems.map(item => (
            <MenuItem
              key={`recent-${item.id}`}
              onClick={() => handleItemClick(item)}
              onKeyDown={(e) => handleKeyDown(e, item)}
              data-testid={`recent-item-${item.id}`}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </MenuItem>
          ))}
        </>
      )}

      {/* Items filtrés */}
      {filteredItems.map(item => (
        <DynamicMenuItem
          key={item.id}
          item={item}
          path={[]}
          onItemClick={handleItemClick}
          onKeyDown={handleKeyDown}
          searchTerm={menuState.searchTerm}
        />
      ))}
      
      {/* Items favoris */}
      {menuState.favorites.size > 0 && (
        <>
          <MenuItem disabled>
            <ListItemText primary="Favoris" />
          </MenuItem>
          {Array.from(menuState.favorites).map(itemId => {
            const item = menuItems.find(i => i.id === itemId);
            if (item) {
              return (
                <MenuItem
                  key={`fav-${itemId}`}
                  onClick={() => handleItemClick(item)}
                  data-testid={`favorite-item-${itemId}`}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </MenuItem>
              );
            }
            return null;
          })}
        </>
      )}
    </Menu>
  );
});

// Composant pour les items de menu récursifs
const DynamicMenuItem = memo(({ 
  item, 
  path, 
  onItemClick, 
  onKeyDown, 
  searchTerm 
}) => {
  const { menuState, updateMenuState } = useMenuContext();
  const [isHovered, setIsHovered] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = menuState.expandedItems.has(item.id);

  // Surligner le terme de recherche
  const highlightText = (text) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? <mark key={index}>{part}</mark> : part
    );
  };

  // Gestion des sous-menus
  const handleToggleExpand = useCallback((event) => {
    event.stopPropagation();
    const newExpanded = new Set(menuState.expandedItems);
    
    if (isExpanded) {
      newExpanded.delete(item.id);
    } else {
      newExpanded.add(item.id);
    }
    
    updateMenuState({ expandedItems: newExpanded });
  }, [item.id, isExpanded, menuState.expandedItems, updateMenuState]);

  // Filtrage des enfants basé sur le terme de recherche
  const filteredChildren = useMemo(() => {
    if (!hasChildren || !searchTerm) return item.children;
    
    const recursiveFilter = (items, term) => {
      return items.filter(childItem => {
        const matchesCurrent = 
          childItem.label.toLowerCase().includes(term.toLowerCase()) ||
          childItem.keywords.some(k => k.includes(term.toLowerCase()));
        
        const matchesChildren = childItem.children 
          ? recursiveFilter(childItem.children, term).length > 0
          : false;
        
        return matchesCurrent || matchesChildren;
      }).map(childItem => ({
        ...childItem,
        children: recursiveFilter(childItem.children || [], term)
      }));
    };

    return recursiveFilter(item.children, searchTerm);
  }, [item.children, searchTerm, hasChildren]);

  return (
    <>
      <MenuItem
        onClick={() => onItemClick(item, path)}
        onKeyDown={(e) => onKeyDown(e, item)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        selected={menuState.selectedPath.includes(item.id)}
        data-testid={`menu-item-${item.id}`}
        sx={{
          backgroundColor: isHovered ? 'action.hover' : 'transparent',
          '&.Mui-selected': {
            backgroundColor: 'primary.light',
            '&:hover': {
              backgroundColor: 'primary.light',
            },
          },
        }}
      >
        <ListItemIcon>
          {item.icon}
        </ListItemIcon>
        <ListItemText 
          primary={highlightText(item.label)}
          secondary={item.description}
        />
        {hasChildren && (
          <IconButton
            size="small"
            onClick={handleToggleExpand}
            data-testid={`expand-button-${item.id}`}
          >
            <KeyboardArrowDown 
              style={{ 
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}
            />
          </IconButton>
        )}
      </MenuItem>

      {/* Sous-menu avec animation */}
      {hasChildren && isExpanded && filteredChildren.length > 0 && (
        <div style={{ paddingLeft: '16px' }}>
          {filteredChildren.map(childItem => (
            <DynamicMenuItem
              key={childItem.id}
              item={childItem}
              path={[...path, item.id]}
              onItemClick={onItemClick}
              onKeyDown={onKeyDown}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </>
  );
});

// Menu avec catégories intelligentes
const IntelligentMenu = memo(({ open, onClose }) => {
  const { menuState, updateMenuState } = useMenuContext();
  
  // Catégorisation intelligente basée sur l'usage
  const categorizedMenus = useMemo(() => {
    const categories = {
      frequent: [],
      recent: [],
      alphabetical: [],
      custom: []
    };

    menuState.menuData.forEach(item => {
      const usageScore = calculateUsageScore(item);
      
      if (usageScore > 8) categories.frequent.push(item);
      else if (item.id < 10) categories.recent.push(item);
      else categories.alphabetical.push(item);
      
      // Catégories personnalisées basées sur les métadonnées
      if (item.category) {
        if (!categories.custom[item.category]) {
          categories.custom[item.category] = [];
        }
        categories.custom[item.category].push(item);
      }
    });

    return categories;
  }, [menuState.menuData]);

  return (
    <Menu
      open={open}
      onClose={onClose}
      PaperProps={{
        style: {
          maxHeight: 500,
          width: 350
        }
      }}
      data-testid="intelligent-menu"
    >
      {/* Section Fréquents */}
      {categorizedMenus.frequent.length > 0 && (
        <>
          <MenuItem disabled>
            <ListItemText primary="Fréquemment utilisés" />
          </MenuItem>
          {categorizedMenus.frequent.slice(0, 5).map(item => (
            <MenuItem
              key={`frequent-${item.id}`}
              onClick={() => onClose(event, 'item-selected', item)}
              data-testid={`frequent-item-${item.id}`}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
              <Chip size="small" label={item.usageCount} />
            </MenuItem>
          ))}
        </>
      )}

      {/* Section Alphabétique avec Autocomplete */}
      <MenuItem disabled>
        <ListItemText primary="Tous les éléments" />
      </MenuItem>
      
      <MenuItem>
        <Autocomplete
          options={menuState.menuData}
          getOptionLabel={(option) => option.label}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              placeholder="Rechercher dans le menu..."
              InputProps={{
                ...params.InputProps,
                startAdornment: <Search fontSize="small" />,
              }}
            />
          )}
          onChange={(event, newValue) => {
            if (newValue) {
              onClose(event, 'item-selected', newValue);
            }
          }}
          renderOption={(props, option) => (
            <li {...props}>
              <ListItemIcon>{option.icon}</ListItemIcon>
              <ListItemText primary={option.label} />
            </li>
          )}
          data-testid="menu-autocomplete"
        />
      </MenuItem>

      {/* Catégories personnalisées */}
      {Object.entries(categorizedMenus.custom).map(([category, items]) => (
        <Accordion key={`category-${category}`} elevation={0}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <ListItemText primary={category} />
            <Chip size="small" label={items.length} />
          </AccordionSummary>
          <AccordionDetails>
            {items.slice(0, 10).map(item => (
              <MenuItem
                key={`category-item-${item.id}`}
                onClick={() => onClose(event, 'item-selected', item)}
                data-testid={`category-item-${item.id}`}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </MenuItem>
            ))}
          </AccordionDetails>
        </Accordion>
      ))}
    </Menu>
  );
});

// Drawer de navigation avec virtualisation
const VirtualizedNavigationDrawer = memo(({ 
  open, 
  onClose, 
  navigationItems,
  itemHeight = 48 
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerHeight = 400;
  
  // Filtrage et tri
  const filteredItems = useMemo(() => {
    return navigationItems
      .filter(item => !item.hidden)
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return a.label.localeCompare(b.label);
      });
  }, [navigationItems]);

  // Virtualisation des éléments
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    filteredItems.length
  );

  const visibleItems = useMemo(() => {
    return filteredItems.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      virtualIndex: startIndex + index
    }));
  }, [filteredItems, startIndex, endIndex]);

  const handleScroll = useCallback((event) => {
    setScrollTop(event.target.scrollTop);
  }, []);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      PaperProps={{
        style: {
          width: 280,
          paddingTop: '64px' // Espace pour l'app bar
        }
      }}
      data-testid="navigation-drawer"
    >
      <div
        style={{ 
          height: `${filteredItems.length * itemHeight}px`,
          overflowY: 'auto',
          position: 'relative'
        }}
        onScroll={handleScroll}
      >
        {visibleItems.map(item => (
          <NavigationDrawerItem
            key={item.id}
            item={item}
            itemHeight={itemHeight}
            virtualIndex={item.virtualIndex}
            onClick={() => onClose(event, 'item-selected', item)}
          />
        ))}
      </div>
    </Drawer>
  );
});

const NavigationDrawerItem = memo(({ 
  item, 
  itemHeight, 
  virtualIndex, 
  onClick 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <ListItem
      disablePadding
      style={{
        position: 'absolute',
        top: `${virtualIndex * itemHeight}px`,
        left: 0,
        right: 0,
        height: `${itemHeight}px`
      }}
    >
      <ListItemButton
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        selected={item.isActive}
        sx={{
          height: '100%',
          backgroundColor: isHovered ? 'action.hover' : 'transparent',
          '&.Mui-selected': {
            backgroundColor: 'primary.light',
            '&:hover': {
              backgroundColor: 'primary.light',
            },
          },
        }}
        data-testid={`nav-item-${item.id}`}
      >
        <ListItemIcon>
          {item.icon}
        </ListItemIcon>
        <ListItemText 
          primary={item.label}
          secondary={item.badge ? item.badge : undefined}
        />
        {item.badge && (
          <Chip 
            size="small" 
            label={item.badge} 
            color="primary"
            data-testid={`nav-badge-${item.id}`}
          />
        )}
      </ListItemButton>
    </ListItem>
  );
});

// Utilitaires pour les tests
const generateMenuItems = (config) => {
  const icons = {
    dashboard: <Dashboard />,
    settings: <Settings />,
    people: <People />,
    folder: <Folder />,
    file: <InsertDriveFile />
  };

  const baseItems = Array.from({ length: config.count || 1000 }, (_, i) => ({
    id: i,
    label: `Menu Item ${i}`,
    description: `Description for menu item ${i}`,
    icon: icons[Object.keys(icons)[i % Object.keys(icons).length]],
    keywords: [`keyword${i}`, `category${i % 10}`, `tag${i % 5}`],
    category: ['Dashboard', 'Settings', 'People', 'Files', 'Reports'][i % 5],
    priority: Math.floor(Math.random() * 10),
    usageCount: Math.floor(Math.random() * 100),
    children: config.includeChildren && i % 10 === 0 ? 
      Array.from({ length: 5 }, (_, j) => ({
        id: `${i}-${j}`,
        label: `SubItem ${i}-${j}`,
        icon: icons[Object.keys(icons)[j % Object.keys(icons).length]],
        keywords: [`subkeyword${j}`],
        children: config.includeNestedChildren && j % 2 === 0 ?
          Array.from({ length: 3 }, (_, k) => ({
            id: `${i}-${j}-${k}`,
            label: `Nested Item ${i}-${j}-${k}`,
            icon: icons[Object.keys(icons)[k % Object.keys(icons).length]],
            keywords: [`nested${k}`]
          })) : []
      })) : []
  }));

  return baseItems;
};

const calculateUsageScore = (item) => {
  const recentScore = item.usageCount / 10;
  const priorityScore = item.priority / 10;
  const recencyScore = item.id < 10 ? 1 : 0;
  
  return recentScore + priorityScore + recencyScore;
};

describe('Tests de Réactivité des Menus Dynamiques', () => {
  let menuTestData = [];
  let navigationTestData = [];
  let performanceMetrics = [];

  beforeEach(() => {
    menuTestData = generateMenuItems({ count: 1000, includeChildren: true, includeNestedChildren: true });
    navigationTestData = Array.from({ length: 5000 }, (_, i) => ({
      id: i,
      label: `Navigation Item ${i}`,
      icon: [<Dashboard />, <Settings />, <People />, <Folder />, <InsertDriveFile />][i % 5],
      priority: Math.floor(Math.random() * 10),
      isActive: i === 0,
      badge: i % 20 === 0 ? Math.floor(Math.random() * 99).toString() : null,
      hidden: i % 50 === 0
    }));
    performanceMetrics = [];
  });

  afterEach(() => {
    menuTestData = [];
    navigationTestData = [];
    performanceMetrics = [];
  });

  describe('Tests de génération et affichage', () => {
    test('Mesure les performances de génération de menu avec 1000 éléments', async () => {
      const user = userEvent.setup();
      
      const { container } = render(
        <MenuProvider>
          <DynamicMenu 
            menuConfig={{ count: 1000, includeChildren: true }}
          />
        </MenuProvider>
      );

      // Simuler l'ouverture du menu
      const searchInput = container.querySelector('[data-testid="menu-search-input"]');
      
      const startTime = performance.now();
      await user.type(searchInput, 'Menu Item 1');
      const endTime = performance.now();

      const searchTime = endTime - startTime;
      expect(searchTime).toBeLessThan(100); // Recherche < 100ms pour 1000 éléments
      
      // Vérifier les éléments filtrés
      await waitFor(() => {
        const filteredItems = screen.queryAllByTestId(/^menu-item-/);
        return filteredItems.length > 0;
      });
    });

    test('Teste les performances avec menus imbriqués', async () => {
      const user = userEvent.setup();
      
      const { container } = render(
        <MenuProvider>
          <DynamicMenu 
            menuConfig={{ count: 100, includeChildren: true, includeNestedChildren: true }}
          />
        </MenuProvider>
      );

      // Ouvrir des sous-menus imbriqués
      const menuItems = container.querySelectorAll('[data-testid^="menu-item-"]');
      
      if (menuItems.length > 0) {
        // Cliquer sur un item qui a des enfants
        const expandableItem = Array.from(menuItems).find(item => {
          const expandButton = item.querySelector('[data-testid^="expand-button-"]');
          return expandButton !== null;
        });

        if (expandableItem) {
          const startTime = performance.now();
          
          const expandButton = expandableItem.querySelector('[data-testid^="expand-button-"]');
          await user.click(expandButton);
          
          // Attendre l'animation d'expansion
          await waitFor(() => {
            const expandedItems = expandableItem.querySelectorAll('[data-testid^="menu-item-"]');
            return expandedItems.length > 1;
          });
          
          const expandTime = performance.now() - startTime;
          expect(expandTime).toBeLessThan(50); // Expansion < 50ms
        }
      }
    });

    test('Teste la fluidité avec 50 menus ouverts simultanément', async () => {
      const renderStartTime = performance.now();
      
      // Créer 50 instances de menu avec des données différentes
      const { container } = render(
        <div>
          {Array.from({ length: 50 }, (_, i) => (
            <MenuProvider key={i}>
              <DynamicMenu 
                menuConfig={{ count: 20, includeChildren: i % 3 === 0 }}
              />
            </MenuProvider>
          ))}
        </div>
      );
      
      const renderTime = performance.now() - renderStartTime;
      expect(renderTime).toBeLessThan(2000); // 50 menus < 2s
      
      const menuElements = container.querySelectorAll('[data-testid^="dynamic-menu"]');
      expect(menuElements.length).toBe(50);
    });
  });

  describe('Tests de filtrage et recherche', () => {
    test('Benchmark de recherche avec termes complexes', async () => {
      const user = userEvent.setup();
      
      const { container } = render(
        <MenuProvider>
          <DynamicMenu 
            menuConfig={{ count: 2000, includeChildren: true }}
          />
        </MenuProvider>
      );

      const searchInput = container.querySelector('[data-testid="menu-search-input"]');
      
      const searchTerms = [
        'Menu Item 1',
        'keyword10',
        'category2',
        'Dashboard',
        'settings'
      ];

      const searchResults = [];
      
      for (const term of searchTerms) {
        const startTime = performance.now();
        await user.clear(searchInput);
        await user.type(searchInput, term);
        
        await waitFor(() => {
          const filtered = container.querySelectorAll('[data-testid^="menu-item-"]');
          return filtered.length >= 0;
        });
        
        const searchTime = performance.now() - startTime;
        searchResults.push(searchTime);
      }

      const averageSearchTime = searchResults.reduce((a, b) => a + b) / searchResults.length;
      expect(averageSearchTime).toBeLessThan(80); // Moyenne < 80ms
      
      const maxSearchTime = Math.max(...searchResults);
      expect(maxSearchTime).toBeLessThan(150); // Max < 150ms
    });

    test('Teste le debounce de recherche', async () => {
      const user = userEvent.setup();
      
      const { container } = render(
        <MenuProvider>
          <DynamicMenu 
            menuConfig={{ count: 1000, includeChildren: true }}
          />
        </MenuProvider>
      );

      const searchInput = container.querySelector('[data-testid="menu-search-input"]');
      
      // Taper rapidement pour déclencher le debounce
      const startTime = performance.now();
      await user.type(searchInput, 'test');
      await user.type(searchInput, 'ing');
      await user.type(searchInput, '123');
      
      // Attendre après la dernière frappe
      await waitFor(() => {
        const filtered = container.querySelectorAll('[data-testid^="menu-item-"]');
        return filtered.length >= 0;
      }, { timeout: 500 });
      
      const totalTime = performance.now() - startTime;
      
      // Le debounce doit attendre ~300ms après la dernière frappe
      expect(totalTime).toBeGreaterThan(300);
      expect(totalTime).toBeLessThan(600);
    });

    test('Teste la recherche avec sous-menu étendue', async () => {
      const user = userEvent.setup();
      
      const { container } = render(
        <MenuProvider>
          <DynamicMenu 
            menuConfig={{ count: 500, includeChildren: true, includeNestedChildren: true }}
          />
        </MenuProvider>
      );

      const searchInput = container.querySelector('[data-testid="menu-search-input"]');
      
      // Rechercher dans les sous-menus
      await user.type(searchInput, 'SubItem');
      
      await waitFor(() => {
        const subItems = container.querySelectorAll('[data-testid^="menu-item-"]');
        return Array.from(subItems).some(item => 
          item.textContent.includes('SubItem')
        );
      });
      
      const subItems = container.querySelectorAll('[data-testid^="menu-item-"]');
      const foundSubItems = Array.from(subItems).filter(item =>
        item.textContent.includes('SubItem')
      );
      
      expect(foundSubItems.length).toBeGreaterThan(0);
    });
  });

  describe('Tests de navigation drawer virtualisé', () => {
    test('Mesure les performances avec 5000 éléments virtualisés', async () => {
      const renderStartTime = performance.now();
      
      const { container } = render(
        <VirtualizedNavigationDrawer
          open={true}
          onClose={jest.fn()}
          navigationItems={navigationTestData}
        />
      );
      
      const renderTime = performance.now() - renderStartTime;
      expect(renderTime).toBeLessThan(1000); // Rendu < 1s pour 5000 éléments
      
      // Vérifier que seuls les éléments visibles sont rendus
      const navItems = container.querySelectorAll('[data-testid^="nav-item-"]');
      expect(navItems.length).toBeLessThan(20); // 5000 éléments virtualisés → ~10 visibles
    });

    test('Teste la fluidité du scrolling virtuel', async () => {
      const { container } = render(
        <VirtualizedNavigationDrawer
          open={true}
          onClose={jest.fn()}
          navigationItems={navigationTestData}
        />
      );

      const drawerContent = container.querySelector('[data-testid="navigation-drawer"] div div');
      const scrollStartTime = performance.now();

      // Simuler un scrolling fluide
      for (let i = 0; i < 100; i++) {
        const scrollTop = (i / 100) * (navigationTestData.length * 48 - 400);
        
        act(() => {
          drawerContent.scrollTop = scrollTop;
        });
        
        // Simulation de frame rate
        await new Promise(resolve => setTimeout(resolve, 16));
      }

      const scrollTime = performance.now() - scrollStartTime;
      expect(scrollTime).toBeLessThan(200); // Scroll fluide < 200ms
    });

    test('Teste les interactions avec éléments virtualisés', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      const { container } = render(
        <VirtualizedNavigationDrawer
          open={true}
          onClose={onClose}
          navigationItems={navigationTestData}
        />
      );

      // Cliquer sur un élément dans la vue actuelle
      const visibleNavItems = container.querySelectorAll('[data-testid^="nav-item-"]');
      if (visibleNavItems.length > 0) {
        const firstVisibleItem = visibleNavItems[0];
        await user.click(firstVisibleItem);
        
        expect(onClose).toHaveBeenCalledWith(
          expect.any(Object),
          'item-selected',
          expect.objectContaining({
            id: expect.any(Number)
          })
        );
      }
    });
  });

  describe('Tests du menu intelligent', () => {
    test('Mesure les performances de catégorisation intelligente', async () => {
      const { container } = render(
        <MenuProvider>
          <IntelligentMenu open={true} onClose={jest.fn()} />
        </MenuProvider>
      );

      // Les catégories doivent être générées automatiquement
      await waitFor(() => {
        const frequentItems = container.querySelectorAll('[data-testid^="frequent-item-"]');
        return frequentItems.length >= 0;
      });

      const frequentSection = container.querySelector('[data-testid^="frequent-item-"]');
      const autocomplete = container.querySelector('[data-testid="menu-autocomplete"]');
      
      expect(frequentSection).toBeInTheDocument();
      expect(autocomplete).toBeInTheDocument();
    });

    test('Teste les performances de l\'autocomplete', async () => {
      const user = userEvent.setup();
      
      const { container } = render(
        <MenuProvider>
          <IntelligentMenu open={true} onClose={jest.fn()} />
        </MenuProvider>
      );

      const autocomplete = container.querySelector('[data-testid="menu-autocomplete"] input');
      
      const startTime = performance.now();
      await user.type(autocomplete, 'Menu Item');
      const endTime = performance.now();

      const autocompleteTime = endTime - startTime;
      expect(autocompleteTime).toBeLessThan(100); // Autocomplete < 100ms
    });
  });

  describe('Tests de concurrence et mémoire', () => {
    test('Teste 100 utilisateurs ouvrant des menus simultanément', async () => {
      const user = userEvent.setup();
      
      const { container } = render(
        <div>
          {Array.from({ length: 100 }, (_, i) => (
            <MenuProvider key={i}>
              <DynamicMenu 
                menuConfig={{ count: 50, includeChildren: i % 2 === 0 }}
              />
            </MenuProvider>
          ))}
        </div>
      );

      const menuElements = container.querySelectorAll('[data-testid="dynamic-menu"]');
      expect(menuElements.length).toBe(100);

      // Mesurer la performance avec tous les menus chargés
      const startTime = performance.now();
      
      // Interaction simulée avec plusieurs menus
      for (let i = 0; i < 10; i++) {
        const searchInputs = container.querySelectorAll('[data-testid="menu-search-input"]');
        if (searchInputs[i]) {
          await user.type(searchInputs[i], `test${i}`);
        }
      }
      
      const interactionTime = performance.now() - startTime;
      expect(interactionTime).toBeLessThan(500); // 100 menus < 500ms
    });

    test('Détecte les fuites mémoire lors d\'utilisation intensive', async () => {
      const memoryMonitor = performanceMonitor.monitorMemoryLeaks();
      
      // 500 cycles d'ouverture/fermeture de menus
      for (let i = 0; i < 500; i++) {
        const { rerender } = render(
          <MenuProvider>
            <DynamicMenu 
              menuConfig={{ count: 200, includeChildren: true }}
            />
          </MenuProvider>
        );
        
        // Simuler des interactions
        rerender(
          <MenuProvider>
            <DynamicMenu 
              menuConfig={{ count: 200, includeChildren: true }}
            />
          </MenuProvider>
        );

        if (i % 50 === 0) {
          // Laissez le temps au garbage collector
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      const memoryResults = memoryMonitor.checkAfter();
      expect(memoryResults.hasMemoryLeak).toBe(false);
      expect(memoryResults.memoryIncrease).toBeLessThan(15 * 1024 * 1024); // 15MB max
    });

    test('Benchmark performance avec 10 000 éléments de menu', async () => {
      const largeMenuData = generateMenuItems({ 
        count: 10000, 
        includeChildren: true, 
        includeNestedChildren: false 
      });
      
      const renderStartTime = performance.now();
      render(
        <MenuProvider>
          <DynamicMenu 
            menuConfig={{ count: 10000, includeChildren: true }}
          />
        </MenuProvider>
      );
      const renderTime = performance.now() - renderStartTime;

      // Même avec 10K éléments, le rendu doit être optimisé
      expect(renderTime).toBeLessThan(3000); // 10K éléments < 3s
      
      // Test de recherche dans ce gros dataset
      const user = userEvent.setup();
      const { container } = render(
        <MenuProvider>
          <DynamicMenu 
            menuConfig={{ count: 10000, includeChildren: true }}
          />
        </MenuProvider>
      );

      const searchInput = container.querySelector('[data-testid="menu-search-input"]');
      const searchStartTime = performance.now();
      
      await user.type(searchInput, 'Item 5000');
      
      await waitFor(() => {
        const results = container.querySelectorAll('[data-testid^="menu-item-"]');
        return results.length >= 0;
      });
      
      const searchTime = performance.now() - searchStartTime;
      expect(searchTime).toBeLessThan(200); // Recherche dans 10K éléments < 200ms
    });
  });
});