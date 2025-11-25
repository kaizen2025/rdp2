// src/components/ui/ModernDataTable.js - Tableau de données moderne avec animations

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Typography,
  TextField,
  IconButton,
  Checkbox,
  Chip,
  Avatar,
  Tooltip,
  Menu,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
  InputAdornment,
  LinearProgress,
  Collapse
} from '@mui/material';
import {
  Search,
  FilterList,
  Sort,
  ArrowUpward,
  ArrowDownward,
  ViewColumn,
  Download,
  Print,
  Refresh,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  CheckCircle,
  Schedule,
  Warning,
  Error,
  AssignmentReturn,
  LocalOffer
} from '@mui/icons-material';
import { motion, AnimatePresence, useInView } from 'framer-motion';

import { 
  useReducedMotion, 
  StaggerContainer, 
  StaggerItem 
} from '../animations/AnimationSystem';
import { ModernIconButton } from './ModernUIComponents';

/**
 * Cellule de tableau personnalisée avec animations
 */
const AnimatedTableCell = ({ 
  children, 
  align = 'left',
  animated = true,
  delay = 0,
  ...props 
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.div
      initial={animated && !prefersReducedMotion ? { 
        opacity: 0, 
        x: align === 'right' ? 20 : -20 
      } : undefined}
      animate={animated && !prefersReducedMotion ? { 
        opacity: 1, 
        x: 0 
      } : undefined}
      transition={animated && !prefersReducedMotion ? { 
        delay,
        duration: 0.3,
        ease: 'easeOut'
      } : undefined}
    >
      <TableCell 
        align={align}
        sx={{
          borderBottom: '1px solid rgba(224, 224, 224, 0.5)',
          padding: '16px 24px',
          '&:first-child': {
            paddingLeft: '32px'
          },
          '&:last-child': {
            paddingRight: '32px'
          }
        }}
        {...props}
      >
        {children}
      </TableCell>
    </motion.div>
  );
};

/**
 * Statut de prêt avec animations
 */
const LoanStatusCell = ({ status, animated = true }) => {
  const prefersReducedMotion = useReducedMotion();
  
  const statusConfig = {
    active: {
      label: 'Actif',
      color: 'success',
      icon: <CheckCircle />,
      bgColor: 'rgba(76, 175, 80, 0.1)',
      animation: { scale: [1, 1.05, 1] }
    },
    overdue: {
      label: 'En retard',
      color: 'error',
      icon: <Warning />,
      bgColor: 'rgba(244, 67, 54, 0.1)',
      animation: { x: [-1, 1, -1, 1, 0] }
    },
    critical: {
      label: 'Critique',
      color: 'error',
      icon: <Error />,
      bgColor: 'rgba(244, 67, 54, 0.15)',
      animation: { scale: [1, 1.1, 1], rotate: [0, 2, -2, 0] }
    },
    reserved: {
      label: 'Réservé',
      color: 'warning',
      icon: <Schedule />,
      bgColor: 'rgba(255, 152, 0, 0.1)',
      animation: { scale: [1, 1.02, 1] }
    },
    returned: {
      label: 'Retourné',
      color: 'success',
      icon: <AssignmentReturn />,
      bgColor: 'rgba(76, 175, 80, 0.1)',
      animation: { scale: [1, 1.05, 1] }
    }
  };
  
  const config = statusConfig[status] || statusConfig.active;
  
  return (
    <motion.div
      animate={animated && !prefersReducedMotion ? config.animation : undefined}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    >
      <Chip
        icon={config.icon}
        label={config.label}
        size="small"
        sx={{
          bgcolor: config.bgColor,
          color: `${config.color}.main`,
          fontWeight: 500,
          fontSize: '0.75rem',
          height: 28,
          '& .MuiChip-icon': {
            fontSize: 14,
            color: `${config.color}.main`
          }
        }}
      />
    </motion.div>
  );
};

/**
 * Barre de progression dans le tableau
 */
const ProgressBarCell = ({ value, status }) => {
  const prefersReducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }
    
    const timer = setTimeout(() => {
      setDisplayValue(value);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [value, prefersReducedMotion]);
  
  const getProgressColor = () => {
    if (status === 'overdue' || status === 'critical') return 'error';
    if (displayValue > 80) return 'warning';
    return 'primary';
  };
  
  return (
    <Box sx={{ minWidth: 100 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          Progression
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {Math.round(displayValue)}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={displayValue}
        color={getProgressColor()}
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: 'rgba(0,0,0,0.1)',
          '& .MuiLinearProgress-bar': {
            borderRadius: 3,
            transition: prefersReducedMotion ? 'none' : 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
          }
        }}
      />
    </Box>
  );
};

/**
 * Actions rapides pour chaque ligne
 */
const RowActions = ({ 
  row, 
  onEdit, 
  onDelete, 
  onExtend, 
  onReturn, 
  onHistory,
  animated = true 
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleAction = (action) => {
    handleMenuClose();
    const actionMap = {
      edit: onEdit,
      delete: onDelete,
      extend: onExtend,
      return: onReturn,
      history: onHistory
    };
    
    if (actionMap[action]) {
      actionMap[action](row);
    }
  };
  
  const getAvailableActions = () => {
    const actions = [
      { key: 'edit', label: 'Modifier', icon: <Edit /> },
      { key: 'history', label: 'Historique', icon: <Visibility /> }
    ];
    
    if (row.status === 'active') {
      actions.push({ key: 'extend', label: 'Prolonger', icon: <LocalOffer /> });
      actions.push({ key: 'return', label: 'Retourner', icon: <AssignmentReturn /> });
    }
    
    if (row.status === 'active' || row.status === 'overdue') {
      actions.push({ key: 'delete', label: 'Supprimer', icon: <Delete />, color: 'error' });
    }
    
    return actions;
  };
  
  return (
    <>
      <ModernIconButton
        size="small"
        onClick={handleMenuOpen}
        sx={{ 
          opacity: animated && !prefersReducedMotion ? 0 : 1,
          transition: 'opacity 0.2s'
        }}
      >
        <MoreVert />
      </ModernIconButton>
      
      <AnimatePresence>
        {animated && !prefersReducedMotion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ModernIconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{ 
                position: 'absolute',
                top: '50%',
                right: 8,
                transform: 'translateY(-50%)'
              }}
            >
              <MoreVert />
            </ModernIconButton>
          </motion.div>
        )}
      </AnimatePresence>
      
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            mt: 1,
            minWidth: 160
          }
        }}
      >
        {getAvailableActions().map((action) => (
          <MenuItem 
            key={action.key} 
            onClick={() => handleAction(action.key)}
            sx={{ color: action.color === 'error' ? 'error.main' : 'text.primary' }}
          >
            {React.cloneElement(action.icon, { 
              sx: { mr: 1, fontSize: 20 } 
            })}
            {action.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

/**
 * Tableau principal moderne
 */
const ModernDataTable = ({
  // Données
  data = [],
  columns = [],
  
  // Configuration
  loading = false,
  selectable = true,
  searchable = true,
  filterable = true,
  sortable = true,
  exportable = false,
  pagination = true,
  
  // Actions
  onEdit,
  onDelete,
  onExtend,
  onReturn,
  onHistory,
  onExport,
  onRefresh,
  onSelectionChange,
  
  // États
  selected = [],
  searchTerm = '',
  filterStatus = 'all',
  sortField = '',
  sortDirection = 'asc',
  page = 0,
  rowsPerPage = 10,
  
  // Callbacks de changement d'état
  onSearch,
  onFilter,
  onSort,
  onPageChange,
  onRowsPerPageChange,
  onSelectAll,
  onSelectRow,
  
  // Configuration d'animation
  animated = true,
  staggerDelay = 0.05,
  
  // Styles
  maxHeight = 600,
  
  ...props
}) => {
  const prefersReducedMotion = useReducedMotion();
  const tableRef = useRef(null);
  const isInView = useInView(tableRef, { once: true, amount: 0.1 });
  
  // États locaux
  const [localSelected, setLocalSelected] = useState(selected);
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [localFilter, setLocalFilter] = useState(filterStatus);
  const [localSort, setLocalSort] = useState({ field: sortField, direction: sortDirection });
  
  // Synchronisation avec les props
  useEffect(() => {
    setLocalSelected(selected);
  }, [selected]);
  
  useEffect(() => {
    setLocalSearch(searchTerm);
  }, [searchTerm]);
  
  useEffect(() => {
    setLocalFilter(filterStatus);
  }, [filterStatus]);
  
  useEffect(() => {
    setLocalSort({ field: sortField, direction: sortDirection });
  }, [sortField, sortDirection]);
  
  // Données filtrées et triées
  const filteredData = useMemo(() => {
    let filtered = [...data];
    
    // Filtrage par recherche
    if (localSearch) {
      filtered = filtered.filter(item =>
        columns.some(column =>
          String(item[column.field] || '').toLowerCase()
            .includes(localSearch.toLowerCase())
        )
      );
    }
    
    // Filtrage par statut
    if (localFilter !== 'all') {
      filtered = filtered.filter(item => item.status === localFilter);
    }
    
    // Tri
    if (localSort.field) {
      filtered.sort((a, b) => {
        const aValue = a[localSort.field];
        const bValue = b[localSort.field];
        
        if (aValue === bValue) return 0;
        
        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;
        
        return localSort.direction === 'desc' ? -comparison : comparison;
      });
    }
    
    return filtered;
  }, [data, localSearch, localFilter, localSort, columns]);
  
  // Données paginées
  const paginatedData = useMemo(() => {
    if (!pagination) return filteredData;
    
    const startIndex = page * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, page, rowsPerPage, pagination]);
  
  // Total des pages
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  
  // Gestion de la sélection
  const handleSelectAll = (event) => {
    const checked = event.target.checked;
    const newSelected = checked ? filteredData.map(row => row.id) : [];
    
    setLocalSelected(newSelected);
    onSelectAll?.(newSelected);
    onSelectionChange?.(newSelected);
  };
  
  const handleSelectRow = (id) => {
    const newSelected = localSelected.includes(id)
      ? localSelected.filter(selectedId => selectedId !== id)
      : [...localSelected, id];
    
    setLocalSelected(newSelected);
    onSelectRow?.(id);
    onSelectionChange?.(newSelected);
  };
  
  // Gestion du tri
  const handleSort = (field) => {
    const newDirection = localSort.field === field && localSort.direction === 'asc' ? 'desc' : 'asc';
    const newSort = { field, direction: newDirection };
    
    setLocalSort(newSort);
    onSort?.(field, newDirection);
  };
  
  // Rendu des headers de colonnes
  const renderColumnHeader = (column) => {
    const isSorted = localSort.field === column.field;
    
    return (
      <TableCell
        key={column.field}
        align={column.align || 'left'}
        sx={{
          fontWeight: 600,
          color: 'text.primary',
          backgroundColor: 'background.paper',
          position: 'sticky',
          top: 0,
          zIndex: 1,
          borderBottom: '2px solid rgba(224, 224, 224, 0.5)',
          cursor: sortable ? 'pointer' : 'default',
          '&:hover': sortable ? {
            backgroundColor: 'rgba(0, 0, 0, 0.04)'
          } : {}
        }}
        onClick={sortable ? () => handleSort(column.field) : undefined}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle2">
            {column.label}
          </Typography>
          
          {sortable && (
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {isSorted ? (
                localSort.direction === 'asc' ? (
                  <ArrowUpward sx={{ fontSize: 16, color: 'primary.main' }} />
                ) : (
                  <ArrowDownward sx={{ fontSize: 16, color: 'primary.main' }} />
                )
              ) : (
                <Sort sx={{ fontSize: 16, color: 'text.disabled' }} />
              )}
            </Box>
          )}
        </Box>
      </TableCell>
    );
  };
  
  // Rendu des cellules
  const renderCell = (row, column, index) => {
    const value = row[column.field];
    const delay = index * staggerDelay;
    
    // Types de cellules spéciales
    if (column.type === 'status') {
      return (
        <AnimatedTableCell key={column.field} align={column.align} delay={delay}>
          <LoanStatusCell status={value} animated={animated} />
        </AnimatedTableCell>
      );
    }
    
    if (column.type === 'progress') {
      return (
        <AnimatedTableCell key={column.field} align={column.align} delay={delay}>
          <ProgressBarCell value={value} status={row.status} />
        </AnimatedTableCell>
      );
    }
    
    if (column.type === 'avatar') {
      return (
        <AnimatedTableCell key={column.field} align={column.align} delay={delay}>
          <Avatar
            sx={{
              bgcolor: value?.color || 'primary.main',
              width: 32,
              height: 32,
              fontSize: '0.875rem',
              fontWeight: 'bold'
            }}
          >
            {value?.name?.charAt(0) || 'U'}
          </Avatar>
        </AnimatedTableCell>
      );
    }
    
    if (column.type === 'actions') {
      return (
        <AnimatedTableCell key={column.field} align={column.align} delay={delay}>
          <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'flex-end' }}>
            <RowActions
              row={row}
              onEdit={onEdit}
              onDelete={onDelete}
              onExtend={onExtend}
              onReturn={onReturn}
              onHistory={onHistory}
              animated={animated}
            />
          </Box>
        </AnimatedTableCell>
      );
    }
    
    // Cellule standard
    return (
      <AnimatedTableCell key={column.field} align={column.align} delay={delay}>
        <Typography variant="body2" color="text.primary">
          {column.format ? column.format(value, row) : value || '-'}
        </Typography>
      </AnimatedTableCell>
    );
  };
  
  return (
    <motion.div
      ref={tableRef}
      initial={animated && !prefersReducedMotion ? { opacity: 0, y: 20 } : undefined}
      animate={animated && !prefersReducedMotion && isInView ? { opacity: 1, y: 0 } : undefined}
      transition={animated && !prefersReducedMotion ? { duration: 0.5 } : undefined}
    >
      <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: 2 }}>
        {/* Barre de recherche et filtres */}
        <Box sx={{ p: 3, borderBottom: '1px solid rgba(224, 224, 224, 0.5)' }}>
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            flexWrap: 'wrap',
            alignItems: 'center',
            mb: searchTerm || filterStatus !== 'all' ? 2 : 0
          }}>
            {searchable && (
              <TextField
                size="small"
                placeholder="Rechercher..."
                value={localSearch}
                onChange={(e) => {
                  setLocalSearch(e.target.value);
                  onSearch?.(e.target.value);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2 }
                }}
                sx={{ flex: 1, minWidth: 200 }}
              />
            )}
            
            {filterable && (
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <Select
                  value={localFilter}
                  onChange={(e) => {
                    setLocalFilter(e.target.value);
                    onFilter?.(e.target.value);
                  }}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">Tous les statuts</MenuItem>
                  <MenuItem value="active">Actifs</MenuItem>
                  <MenuItem value="overdue">En retard</MenuItem>
                  <MenuItem value="critical">Critiques</MenuItem>
                  <MenuItem value="reserved">Réservés</MenuItem>
                  <MenuItem value="returned">Retournés</MenuItem>
                </Select>
              </FormControl>
            )}
            
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
              {onRefresh && (
                <ModernIconButton onClick={onRefresh}>
                  <Refresh />
                </ModernIconButton>
              )}
              
              {exportable && onExport && (
                <ModernIconButton onClick={onExport}>
                  <Download />
                </ModernIconButton>
              )}
            </Box>
          </Box>
          
          {/* Indicateur de résultats */}
          <AnimatePresence>
            {(localSearch || localFilter !== 'all') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Typography variant="body2" color="text.secondary">
                  {filteredData.length} résultat(s) trouvé(s)
                  {localSearch && ` pour "${localSearch}"`}
                  {localFilter !== 'all' && ` • Statut: ${localFilter}`}
                </Typography>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
        
        {/* Tableau */}
        <TableContainer sx={{ maxHeight, overflow: 'auto' }}>
          {loading && (
            <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }} />
          )}
          
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {selectable && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={localSelected.length > 0 && localSelected.length < filteredData.length}
                      checked={filteredData.length > 0 && localSelected.length === filteredData.length}
                      onChange={handleSelectAll}
                      inputProps={{ 'aria-label': 'sélectionner tous' }}
                      sx={{ 
                        color: 'primary.main',
                        '&.Mui-checked': {
                          color: 'primary.main'
                        }
                      }}
                    />
                  </TableCell>
                )}
                
                {columns.map((column, index) => renderColumnHeader(column))}
                
                {(onEdit || onDelete || onExtend || onReturn || onHistory) && (
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Actions
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            
            <TableBody>
              <StaggerContainer delay={staggerDelay}>
                {paginatedData.map((row, rowIndex) => (
                  <StaggerItem key={row.id}>
                    <TableRow
                      hover
                      selected={localSelected.includes(row.id)}
                      sx={{
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(25, 118, 210, 0.08)',
                          '&:hover': {
                            backgroundColor: 'rgba(25, 118, 210, 0.12)'
                          }
                        },
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      {selectable && (
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={localSelected.includes(row.id)}
                            onChange={() => handleSelectRow(row.id)}
                            inputProps={{ 'aria-labelledby': `row-${row.id}` }}
                            sx={{ 
                              color: 'primary.main',
                              '&.Mui-checked': {
                                color: 'primary.main'
                              }
                            }}
                          />
                        </TableCell>
                      )}
                      
                      {columns.map((column, colIndex) => 
                        renderCell(row, column, rowIndex * columns.length + colIndex)
                      )}
                      
                      {(onEdit || onDelete || onExtend || onReturn || onHistory) && (
                        <TableCell align="right">
                          <RowActions
                            row={row}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onExtend={onExtend}
                            onReturn={onReturn}
                            onHistory={onHistory}
                            animated={animated}
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  </StaggerItem>
                ))}
              </StaggerContainer>
              
              {paginatedData.length === 0 && !loading && (
                <TableRow>
                  <TableCell 
                    colSpan={columns.length + (selectable ? 1 : 0) + 1} 
                    sx={{ textAlign: 'center', py: 6 }}
                  >
                    <Typography variant="body1" color="text.secondary">
                      {localSearch || localFilter !== 'all' 
                        ? 'Aucun résultat trouvé' 
                        : 'Aucune donnée disponible'
                      }
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        {pagination && (
          <Box sx={{ borderTop: '1px solid rgba(224, 224, 224, 0.5)' }}>
            <TablePagination
              component="div"
              count={filteredData.length}
              page={page}
              onPageChange={(event, newPage) => onPageChange?.(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                onRowsPerPageChange?.(parseInt(event.target.value, 10));
              }}
              labelRowsPerPage="Lignes par page:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`
              }
              sx={{
                '& .MuiTablePagination-select': {
                  borderRadius: 1
                }
              }}
            />
          </Box>
        )}
      </Paper>
    </motion.div>
  );
};

export default ModernDataTable;