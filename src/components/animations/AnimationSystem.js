// src/components/animations/AnimationSystem.js - Système d'animations avancé avec Framer Motion

import React, { useRef, useEffect, useState } from 'react';
import { motion, useAnimation, useInView, AnimatePresence } from 'framer-motion';
import { useTheme, useMediaQuery } from '@mui/material';

/**
 * Configuration des animations standardisées
 */
export const animationConfig = {
  // Animations de page
  pageTransitions: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: 'easeInOut' }
  },

  // Animations de carte
  cardAnimations: {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    hover: { 
      y: -4, 
      scale: 1.02,
      transition: { duration: 0.2, ease: 'easeOut' }
    },
    tap: { 
      scale: 0.98,
      transition: { duration: 0.1, ease: 'easeOut' }
    },
    exit: { opacity: 0, y: -20, scale: 0.95 }
  },

  // Animations de liste (stagger)
  listAnimations: {
    container: {
      initial: {},
      animate: {
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.1
        }
      }
    },
    item: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  },

  // Micro-interactions
  microInteractions: {
    button: {
      hover: { scale: 1.05 },
      tap: { scale: 0.95 },
      hoverTap: { scale: 0.95 },
      transition: { duration: 0.15, ease: 'easeOut' }
    },
    iconButton: {
      hover: { scale: 1.1, rotate: 5 },
      tap: { scale: 0.9 },
      transition: { duration: 0.1, ease: 'easeOut' }
    },
    toggle: {
      closed: { rotate: 0 },
      open: { rotate: 180 },
      transition: { duration: 0.2, ease: 'easeInOut' }
    }
  },

  // Animations de feedback
  feedback: {
    success: {
      scale: [1, 1.1, 1],
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    error: {
      x: [-10, 10, -10, 10, 0],
      transition: { duration: 0.4, ease: 'easeOut' }
    },
    warning: {
      y: [0, -10, 0],
      transition: { duration: 0.5, ease: 'easeInOut' }
    }
  },

  // Animations de loading
  loading: {
    spinner: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'linear'
      }
    },
    pulse: {
      scale: [1, 1.1, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    },
    skeleton: {
      backgroundColor: ['#f0f0f0', '#e0e0e0', '#f0f0f0'],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  },

  // Animations modales
  modal: {
    overlay: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.2, ease: 'easeOut' }
    },
    content: {
      initial: { 
        opacity: 0, 
        scale: 0.8, 
        y: 50,
        rotateX: -15 
      },
      animate: { 
        opacity: 1, 
        scale: 1, 
        y: 0,
        rotateX: 0 
      },
      exit: { 
        opacity: 0, 
        scale: 0.8, 
        y: 50,
        rotateX: 15 
      },
      transition: { 
        duration: 0.3, 
        ease: 'easeOut' 
      }
    }
  }
};

/**
 * Hook pour détecter la préférence de mouvement réduit
 */
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addListener(handleChange);
    
    return () => mediaQuery.removeListener(handleChange);
  }, []);
  
  return prefersReducedMotion;
};

/**
 * Composant d'animation de page
 */
export const PageTransition = ({ 
  children, 
  type = 'slide', 
  duration = 0.3,
  ...props 
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  const variants = {
    slide: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 }
    },
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 }
    },
    scale: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 1.1 }
    }
  };
  
  return (
    <motion.div
      initial={prefersReducedMotion ? 'animate' : variants[type].initial}
      animate={variants[type].animate}
      exit={prefersReducedMotion ? 'animate' : variants[type].exit}
      transition={{ duration: prefersReducedMotion ? 0 : duration }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Composant d'animation de liste avec stagger
 */
export const StaggerContainer = ({ 
  children, 
  delay = 0.1, 
  staggerDirection = 1,
  ...props 
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{
        initial: {},
        animate: {
          transition: {
            staggerChildren: prefersReducedMotion ? 0 : delay,
            delayChildren: 0
          }
        }
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem = ({ 
  children, 
  direction = 1,
  ...props 
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.div
      variants={{
        initial: { 
          opacity: 0, 
          y: 20 * direction,
          scale: 0.95
        },
        animate: { 
          opacity: 1, 
          y: 0,
          scale: 1
        }
      }}
      transition={{ 
        duration: prefersReducedMotion ? 0 : 0.3,
        ease: 'easeOut' 
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Composant d'animation au scroll
 */
export const ScrollAnimation = ({ 
  children, 
  animation = 'fadeUp',
  threshold = 0.1,
  ...props 
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold });
  const prefersReducedMotion = useReducedMotion();
  
  const animations = {
    fadeUp: {
      initial: { opacity: 0, y: 30 },
      animate: { opacity: 1, y: 0 }
    },
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 }
    },
    slideLeft: {
      initial: { opacity: 0, x: 30 },
      animate: { opacity: 1, x: 0 }
    },
    slideRight: {
      initial: { opacity: 0, x: -30 },
      animate: { opacity: 1, x: 0 }
    },
    scale: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 }
    }
  };
  
  return (
    <motion.div
      ref={ref}
      initial={animations[animation].initial}
      animate={isInView ? animations[animation].animate : animations[animation].initial}
      transition={{ 
        duration: prefersReducedMotion ? 0 : 0.5,
        ease: 'easeOut' 
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Composant de feedback animé
 */
export const AnimatedFeedback = ({ 
  type = 'success',
  children,
  trigger,
  ...props 
}) => {
  const controls = useAnimation();
  const prefersReducedMotion = useReducedMotion();
  
  useEffect(() => {
    if (trigger) {
      const animation = animationConfig.feedback[type];
      if (!prefersReducedMotion && animation) {
        controls.start(animation);
      }
    }
  }, [trigger, type, controls, prefersReducedMotion]);
  
  return (
    <motion.div
      animate={controls}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Composant de loading animé
 */
export const AnimatedLoader = ({ 
  type = 'spinner',
  size = 40,
  color = 'primary',
  ...props 
}) => {
  const theme = useTheme();
  const prefersReducedMotion = useReducedMotion();
  
  const loaders = {
    spinner: (
      <motion.div
        animate={!prefersReducedMotion && animationConfig.loading.spinner}
        style={{
          width: size,
          height: size,
          border: `3px solid ${theme.palette[color].light}`,
          borderTop: `3px solid ${theme.palette[color].main}`,
          borderRadius: '50%'
        }}
      />
    ),
    pulse: (
      <motion.div
        animate={!prefersReducedMotion && animationConfig.loading.pulse}
        style={{
          width: size,
          height: size,
          backgroundColor: theme.palette[color].main,
          borderRadius: '50%'
        }}
      />
    ),
    dots: (
      <div style={{ display: 'flex', gap: 4 }}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={!prefersReducedMotion && {
              scale: [1, 1.5, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.1,
              ease: 'easeInOut'
            }}
            style={{
              width: 8,
              height: 8,
              backgroundColor: theme.palette[color].main,
              borderRadius: '50%'
            }}
          />
        ))}
      </div>
    )
  };
  
  return <div {...props}>{loaders[type]}</div>;
};

/**
 * Skeleton animé pour les loading states
 */
export const AnimatedSkeleton = ({ 
  width = '100%',
  height = 100,
  borderRadius = 8,
  ...props 
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.div
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: '#f0f0f0'
      }}
      animate={!prefersReducedMotion && animationConfig.loading.skeleton}
      {...props}
    />
  );
};

/**
 * Wrapper d'animation conditionnel
 */
export const AnimatedWrapper = ({ 
  children,
  animation,
  shouldAnimate = true,
  ...props 
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  if (!shouldAnimate || prefersReducedMotion) {
    return <div {...props}>{children}</div>;
  }
  
  return (
    <motion.div
      initial={animation.initial}
      animate={animation.animate}
      whileHover={animation.hover}
      whileTap={animation.tap}
      exit={animation.exit}
      transition={animation.transition}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Animations contextuelles pour les actions
 */
export const useAnimationContext = () => {
  const controls = useAnimation();
  const prefersReducedMotion = useReducedMotion();
  
  const animateAction = (type, duration = 0.3) => {
    if (prefersReducedMotion) return;
    
    switch (type) {
      case 'success':
        return controls.start(animationConfig.feedback.success);
      case 'error':
        return controls.start(animationConfig.feedback.error);
      case 'warning':
        return controls.start(animationConfig.feedback.warning);
      case 'pulse':
        return controls.start(animationConfig.loading.pulse);
      default:
        return controls.start({ scale: [1, 1.05, 1] });
    }
  };
  
  return { controls, animateAction };
};

export default {
  animationConfig,
  useReducedMotion,
  PageTransition,
  StaggerContainer,
  StaggerItem,
  ScrollAnimation,
  AnimatedFeedback,
  AnimatedLoader,
  AnimatedSkeleton,
  AnimatedWrapper,
  useAnimationContext
};