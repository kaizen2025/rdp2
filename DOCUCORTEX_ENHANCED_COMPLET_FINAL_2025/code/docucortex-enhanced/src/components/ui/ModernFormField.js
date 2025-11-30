// src/components/ui/ModernFormField.js - Champs de formulaire modernes avec animations

import React, { useState, useRef, useEffect } from 'react';
import {
  TextField,
  InputAdornment,
  InputLabel,
  FormControl,
  FormHelperText,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
  Autocomplete,
  Switch,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  FormLabel,
  Slider,
  Rating,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Search,
  Clear,
  ExpandMore,
  Info,
  Warning,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

import { useReducedMotion, useAnimationContext } from '../animations/AnimationSystem';

/**
 * Wrapper pour les champs avec animations
 */
const AnimatedFormField = ({ 
  children, 
  error, 
  success, 
  warning,
  animated = true,
  showMessage = true,
  ...props 
}) => {
  const prefersReducedMotion = useReducedMotion();
  const controls = useAnimation();
  
  useEffect(() => {
    if (error && animated && !prefersReducedMotion) {
      controls.start({
        x: [-5, 5, -5, 5, 0],
        borderColor: 'error.main',
        transition: { duration: 0.4, ease: 'easeOut' }
      });
    } else if (success && animated && !prefersReducedMotion) {
      controls.start({
        scale: [1, 1.02, 1],
        borderColor: 'success.main',
        transition: { duration: 0.3, ease: 'easeOut' }
      });
    }
  }, [error, success, animated, controls, prefersReducedMotion]);
  
  return (
    <motion.div
      animate={controls}
      style={{ width: '100%' }}
      {...props}
    >
      <Box sx={{ position: 'relative', width: '100%' }}>
        {children}
        
        {/* Indicateur d'état */}
        <AnimatePresence>
          {(error || success || warning) && showMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1
              }}
            >
              {error && (
                <Tooltip title={error} arrow>
                  <ErrorIcon sx={{ color: 'error.main', fontSize: 20 }} />
                </Tooltip>
              )}
              {success && (
                <Tooltip title={success} arrow>
                  <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                </Tooltip>
              )}
              {warning && (
                <Tooltip title={warning} arrow>
                  <Warning sx={{ color: 'warning.main', fontSize: 20 }} />
                </Tooltip>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </motion.div>
  );
};

/**
 * Champ de texte moderne
 */
export const ModernTextField = ({
  label,
  value,
  onChange,
  onFocus,
  onBlur,
  error,
  success,
  warning,
  helperText,
  variant = 'outlined',
  size = 'medium',
  fullWidth = true,
  multiline = false,
  rows = 1,
  disabled = false,
  required = false,
  placeholder,
  startAdornment,
  endAdornment,
  animated = true,
  showClear = false,
  onClear,
  showPasswordToggle = false,
  type = 'text',
  maxLength,
  characterCount = false,
  ...props
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef(null);
  
  const handleFocus = (event) => {
    setFocused(true);
    onFocus?.(event);
  };
  
  const handleBlur = (event) => {
    setFocused(false);
    onBlur?.(event);
  };
  
  const handleClear = () => {
    onChange?.({ target: { value: '' } });
    onClear?.();
    inputRef.current?.focus();
  };
  
  const shouldShowPasswordToggle = showPasswordToggle && type === 'password';
  const finalType = shouldShowPasswordToggle ? (showPassword ? 'text' : 'password') : type;
  
  const getHelperText = () => {
    if (characterCount && maxLength) {
      const currentLength = value?.length || 0;
      return `${currentLength}/${maxLength} caractères`;
    }
    return helperText;
  };
  
  return (
    <AnimatedFormField 
      error={error}
      success={success}
      warning={warning}
      animated={animated}
    >
      <TextField
        ref={inputRef}
        label={label}
        value={value}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        error={!!error}
        helperText={getHelperText()}
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        multiline={multiline}
        rows={rows}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        type={finalType}
        inputProps={{
          maxLength,
          'aria-describedby': error ? `${props.id || 'field'}-error` : undefined
        }}
        InputProps={{
          ...(startAdornment && {
            startAdornment: (
              <InputAdornment position="start">
                {startAdornment}
              </InputAdornment>
            )
          }),
          ...(endAdornment && {
            endAdornment: (
              <InputAdornment position="end">
                {shouldShowPasswordToggle && (
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    tabIndex={-1}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                )}
                {showClear && value && (
                  <IconButton
                    onClick={handleClear}
                    edge="end"
                    tabIndex={-1}
                  >
                    <Clear />
                  </IconButton>
                )}
                {endAdornment}
              </InputAdornment>
            )
          }),
          sx: {
            '& .MuiOutlinedInput-root': {
              transition: animated && !prefersReducedMotion ? 'all 0.2s ease' : 'none',
              '&.Mui-focused fieldset': {
                borderWidth: 2
              },
              ...(success && {
                '& fieldset': {
                  borderColor: 'success.main'
                },
                '&:hover fieldset': {
                  borderColor: 'success.main'
                }
              }),
              ...(warning && {
                '& fieldset': {
                  borderColor: 'warning.main'
                }
              })
            }
          }
        }}
        sx={{
          '& .MuiFormHelperText-root': {
            marginTop: 1,
            marginLeft: 0,
            marginRight: 0,
            ...(characterCount && maxLength && {
              textAlign: 'right',
              fontSize: '0.75rem',
              color: 'text.secondary'
            })
          }
        }}
        {...props}
      />
    </AnimatedFormField>
  );
};

/**
 * Select moderne avec recherche
 */
export const ModernSelect = ({
  label,
  value,
  onChange,
  options = [],
  multiple = false,
  disabled = false,
  required = false,
  error,
  success,
  warning,
  helperText,
  placeholder,
  searchable = false,
  loading = false,
  clearable = true,
  grouped = false,
  getOptionLabel = (option) => option.label || option,
  getOptionValue = (option) => option.value || option,
  animated = true,
  ...props
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [searchTerm, setSearchTerm] = useState('');
  const [focused, setFocused] = useState(false);
  
  // Filtrage des options
  const filteredOptions = searchable && searchTerm
    ? options.filter(option => 
        getOptionLabel(option).toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;
  
  // Valeur d'affichage
  const displayValue = multiple 
    ? value 
    : options.find(option => getOptionValue(option) === value);
  
  const handleFocus = () => setFocused(true);
  const handleBlur = () => setFocused(false);
  
  const renderOption = (option, index) => {
    const optionValue = getOptionValue(option);
    const optionLabel = getOptionLabel(option);
    
    return (
      <MenuItem 
        key={index}
        value={optionValue}
        disabled={option.disabled}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          ...(option.icon && { py: 1.5 })
        }}
      >
        {option.icon && (
          <Box sx={{ color: 'text.secondary' }}>
            {option.icon}
          </Box>
        )}
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2">
            {optionLabel}
          </Typography>
          {option.description && (
            <Typography variant="caption" color="text.secondary">
              {option.description}
            </Typography>
          )}
        </Box>
      </MenuItem>
    );
  };
  
  return (
    <AnimatedFormField 
      error={error}
      success={success}
      warning={warning}
      animated={animated}
    >
      <FormControl
        fullWidth
        disabled={disabled}
        required={required}
        error={!!error}
        sx={{
          '& .MuiOutlinedInput-root': {
            transition: animated && !prefersReducedMotion ? 'all 0.2s ease' : 'none'
          }
        }}
      >
        {label && (
          <InputLabel 
            sx={{
              transform: (focused || (multiple && value?.length > 0)) ? 'translate(14px, -6px) scale(0.75)' : 'translate(14px, 16px) scale(1)',
              transition: animated && !prefersReducedMotion ? 'all 0.2s ease' : 'none'
            }}
          >
            {label}
          </InputLabel>
        )}
        
        <Select
          value={value || (multiple ? [] : '')}
          onChange={onChange}
          onOpen={handleFocus}
          onClose={handleBlur}
          multiple={multiple}
          input={(
            <OutlinedInput
              label={label}
              sx={{
                '& .MuiSelect-select': {
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  minHeight: (label ? 56 : 40),
                  py: 1.5
                }
              }}
            />
          )}
          displayEmpty={!!placeholder}
          renderValue={(selected) => {
            if (multiple) {
              if (!selected?.length) return placeholder;
              return (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.slice(0, 3).map((value) => {
                    const option = options.find(opt => getOptionValue(opt) === value);
                    return (
                      <Chip
                        key={value}
                        label={option ? getOptionLabel(option) : value}
                        size="small"
                        onDelete={clearable ? () => {
                          const newValue = selected.filter(v => v !== value);
                          onChange({ target: { value: newValue } });
                        } : undefined}
                        sx={{ maxWidth: 120 }}
                      />
                    );
                  })}
                  {selected.length > 3 && (
                    <Chip
                      label={`+${selected.length - 3}`}
                      size="small"
                      variant="outlined"
                      sx={{ maxWidth: 60 }}
                    />
                  )}
                </Box>
              );
            }
            
            if (!selected) return placeholder;
            
            const option = options.find(opt => getOptionValue(opt) === selected);
            return option ? getOptionLabel(option) : selected;
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                borderRadius: 2,
                mt: 0.5,
                maxHeight: 300,
                '& .MuiMenuItem-root': {
                  px: 2,
                  py: 1.5
                }
              }
            }
          }}
          sx={{
            '& .MuiSelect-select': {
              ...(success && { borderColor: 'success.main' }),
              ...(warning && { borderColor: 'warning.main' })
            }
          }}
          {...props}
        >
          {/* Recherche dans le menu */}
          {searchable && focused && (
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(224, 224, 224, 0.5)' }}>
              <ModernTextField
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                startAdornment={<Search />}
                size="small"
                fullWidth
                autoFocus
              />
            </Box>
          )}
          
          {/* Options groupées */}
          {grouped ? (
            Object.entries(options.reduce((groups, option) => {
              const group = option.group || 'Autres';
              if (!groups[group]) groups[group] = [];
              groups[group].push(option);
              return groups;
            }, {})).map(([groupName, groupOptions]) => (
              <Box key={groupName}>
                <Typography
                  variant="caption"
                  sx={{
                    px: 2,
                    py: 0.5,
                    color: 'text.secondary',
                    fontWeight: 500,
                    display: 'block'
                  }}
                >
                  {groupName}
                </Typography>
                {groupOptions.map(renderOption)}
              </Box>
            ))
          ) : (
            filteredOptions.map(renderOption)
          )}
        </Select>
        
        {helperText && (
          <FormHelperText>{helperText}</FormHelperText>
        )}
      </FormControl>
    </AnimatedFormField>
  );
};

/**
 * Switch moderne
 */
export const ModernSwitch = ({
  label,
  checked,
  onChange,
  disabled = false,
  color = 'primary',
  size = 'medium',
  animated = true,
  helperText,
  ...props
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <FormControlLabel
      control={
        <motion.div
          animate={animated && !prefersReducedMotion && checked ? {
            scale: [1, 1.05, 1],
            transition: { duration: 0.2, ease: 'easeOut' }
          } : undefined}
        >
          <Switch
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            color={color}
            size={size}
            sx={{
              '& .MuiSwitch-track': {
                transition: animated && !prefersReducedMotion ? 'all 0.2s ease' : 'none'
              },
              '& .MuiSwitch-thumb': {
                transition: animated && !prefersReducedMotion ? 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
              }
            }}
            {...props}
          />
        </motion.div>
      }
      label={
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {label}
          </Typography>
          {helperText && (
            <Typography variant="caption" color="text.secondary">
              {helperText}
            </Typography>
          )}
        </Box>
      }
      sx={{
        alignItems: 'flex-start',
        '& .MuiFormControlLabel-label': {
          mt: 0.5
        }
      }}
    />
  );
};

/**
 * Checkbox moderne
 */
export const ModernCheckbox = ({
  label,
  checked,
  onChange,
  disabled = false,
  color = 'primary',
  indeterminate = false,
  size = 'medium',
  animated = true,
  helperText,
  ...props
}) => {
  const prefersReducedMotion = useReducedMotion();
  const checkboxRef = useRef(null);
  
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);
  
  return (
    <FormControlLabel
      control={
        <motion.div
          animate={animated && !prefersReducedMotion && checked ? {
            scale: [1, 1.1, 1],
            transition: { duration: 0.2, ease: 'easeOut' }
          } : undefined}
        >
          <Checkbox
            ref={checkboxRef}
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            color={color}
            size={size}
            sx={{
              '& .MuiSvgIcon-root': {
                transition: animated && !prefersReducedMotion ? 'all 0.2s ease' : 'none'
              }
            }}
            {...props}
          />
        </motion.div>
      }
      label={
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {label}
          </Typography>
          {helperText && (
            <Typography variant="caption" color="text.secondary">
              {helperText}
            </Typography>
          )}
        </Box>
      }
    />
  );
};

/**
 * Groupe de radio moderne
 */
export const ModernRadioGroup = ({
  label,
  value,
  onChange,
  options = [],
  disabled = false,
  row = false,
  animated = true,
  helperText,
  ...props
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <FormControl
      disabled={disabled}
      component="fieldset"
      sx={{ width: '100%' }}
    >
      {label && (
        <FormLabel
          component="legend"
          sx={{
            mb: 2,
            color: 'text.primary',
            '&.Mui-focused': {
              color: 'primary.main'
            }
          }}
        >
          {label}
        </FormLabel>
      )}
      
      <RadioGroup
        value={value}
        onChange={onChange}
        row={row}
        sx={{
          gap: 2,
          '& .MuiFormControlLabel-root': {
            alignItems: 'flex-start',
            '& .MuiRadio-root': {
              mt: 0.5
            },
            '& .MuiFormControlLabel-label': {
              pt: 0.5
            }
          }
        }}
        {...props}
      >
        {options.map((option, index) => (
          <motion.div
            key={option.value || index}
            initial={animated && !prefersReducedMotion ? { 
              opacity: 0, 
              x: -20 
            } : undefined}
            animate={animated && !prefersReducedMotion ? { 
              opacity: 1, 
              x: 0 
            } : undefined}
            transition={animated && !prefersReducedMotion ? { 
              delay: index * 0.1,
              duration: 0.3 
            } : undefined}
          >
            <FormControlLabel
              value={option.value}
              control={
                <Radio
                  color="primary"
                  sx={{
                    '& .MuiSvgIcon-root': {
                      transition: animated && !prefersReducedMotion ? 'all 0.2s ease' : 'none'
                    }
                  }}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {option.label}
                  </Typography>
                  {option.description && (
                    <Typography variant="caption" color="text.secondary">
                      {option.description}
                    </Typography>
                  )}
                </Box>
              }
            />
          </motion.div>
        ))}
      </RadioGroup>
      
      {helperText && (
        <FormHelperText>{helperText}</FormHelperText>
      )}
    </FormControl>
  );
};

/**
 * Slider moderne avec animations
 */
export const ModernSlider = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  marks = false,
  disabled = false,
  color = 'primary',
  size = 'medium',
  animated = true,
  showValue = true,
  helperText,
  ...props
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  const formatValue = (value) => value;
  
  return (
    <FormControl fullWidth sx={{ mb: 2 }}>
      {label && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          {showValue && (
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {formatValue(value)}
            </Typography>
          )}
        </Box>
      )}
      
      <motion.div
        animate={animated && !prefersReducedMotion && value === max ? {
          scale: [1, 1.02, 1],
          transition: { duration: 0.3, ease: 'easeOut' }
        } : undefined}
      >
        <Slider
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
          marks={marks}
          disabled={disabled}
          color={color}
          size={size}
          sx={{
            '& .MuiSlider-thumb': {
              transition: animated && !prefersReducedMotion ? 'all 0.2s ease' : 'none'
            },
            '& .MuiSlider-track': {
              transition: animated && !prefersReducedMotion ? 'all 0.2s ease' : 'none'
            }
          }}
          {...props}
        />
      </motion.div>
      
      {helperText && (
        <FormHelperText>{helperText}</FormHelperText>
      )}
    </FormControl>
  );
};

/**
 * Section collapsible
 */
export const ModernAccordion = ({
  title,
  children,
  icon,
  defaultExpanded = false,
  disabled = false,
  animated = true,
  ...props
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.div
      initial={animated && !prefersReducedMotion ? { opacity: 0, y: -10 } : undefined}
      animate={animated && !prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
      transition={animated && !prefersReducedMotion ? { duration: 0.3 } : undefined}
    >
      <Accordion
        defaultExpanded={defaultExpanded}
        disabled={disabled}
        sx={{
          borderRadius: 2,
          mb: 1,
          '&:before': { display: 'none' },
          '&.Mui-expanded': {
            margin: 0
          }
        }}
        {...props}
      >
        <AccordionSummary
          expandIcon={<ExpandMore />}
          sx={{
            minHeight: 56,
            '&.Mui-expanded': {
              minHeight: 56
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {icon && (
              <Box sx={{ color: 'primary.main' }}>
                {icon}
              </Box>
            )}
            <Typography variant="h6" sx={{ flex: 1 }}>
              {title}
            </Typography>
          </Box>
        </AccordionSummary>
        
        <AccordionDetails sx={{ pt: 2 }}>
          <AnimatePresence>
            <motion.div
              initial={animated && !prefersReducedMotion ? { opacity: 0, height: 0 } : undefined}
              animate={animated && !prefersReducedMotion ? { opacity: 1, height: 'auto' } : undefined}
              exit={animated && !prefersReducedMotion ? { opacity: 0, height: 0 } : undefined}
              transition={animated && !prefersReducedMotion ? { duration: 0.2 } : undefined}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </AccordionDetails>
      </Accordion>
    </motion.div>
  );
};

export default {
  ModernTextField,
  ModernSelect,
  ModernSwitch,
  ModernCheckbox,
  ModernRadioGroup,
  ModernSlider,
  ModernAccordion,
  AnimatedFormField
};