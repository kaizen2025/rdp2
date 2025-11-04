/**
 * Tests de fluidité des animations et transitions Material-UI
 * Évalue les performances des animations (60fps), CSS transitions, et GPU acceleration
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Fade, Slide, Collapse, Grow, Zoom,
  Dialog, Menu, Drawer, Snackbar,
  Card, CardContent, AppBar, Toolbar,
  List, ListItem, ListItemText
} from '@mui/material';
import { animated } from '@react-spring/web';

// Composant de test pour animations basiques
const BasicAnimationComponent = ({ isVisible, onAnimationComplete }) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setAnimatedValue(prev => {
          const next = prev + 1;
          if (next >= 100) {
            clearInterval(interval);
            onAnimationComplete?.();
            return 100;
          }
          return next;
        });
      }, 16); // ~60fps

      return () => clearInterval(interval);
    }
  }, [isVisible, onAnimationComplete]);

  return (
    <div
      style={{
        width: `${animatedValue}%`,
        height: '100px',
        backgroundColor: 'lightblue',
        transition: 'width 0.016s ease-in-out' // 60fps transition
      }}
      data-testid="animated-bar"
    />
  );
};

// Composant pour tester les animations CSS
const CSSTransitionComponent = ({ show, type }) => {
  const animationStyle = {
    opacity: show ? 1 : 0,
    transform: show ? 'scale(1)' : 'scale(0.8)',
    transition: 'all 300ms cubic-bezier(0.4, 0.0, 0.2, 1)',
    willChange: 'transform, opacity',
    backfaceVisibility: 'hidden',
    transformPerspective: '1000px'
  };

  const animations = {
    fade: <div style={animationStyle} data-testid="css-fade">Fade Animation</div>,
    slide: (
      <div 
        style={{
          ...animationStyle,
          transform: show ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 300ms ease-in-out'
        }}
        data-testid="css-slide"
      >
        Slide Animation
      </div>
    ),
    scale: (
      <div 
        style={{
          ...animationStyle,
          transform: show ? 'scale(1)' : 'scale(0.5)'
        }}
        data-testid="css-scale"
      >
        Scale Animation
      </div>
    )
  };

  return animations[type] || animations.fade;
};

// Composant MUI avec animations
const MUIAnimationComponent = ({ type, isOpen, onClose }) => {
  const [open, setOpen] = useState(isOpen || false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  const handleSnackbar = () => {
    setSnackbarOpen(true);
    setTimeout(() => setSnackbarOpen(false), 3000);
  };

  const animations = {
    fade: (
      <Fade in={open} timeout={300}>
        <div data-testid="mui-fade">Fade Content</div>
      </Fade>
    ),
    slide: (
      <Slide direction="up" in={open} timeout={300}>
        <div data-testid="mui-slide">Slide Content</div>
      </Slide>
    ),
    collapse: (
      <Collapse in={open} timeout={300}>
        <div data-testid="mui-collapse">
          <List>
            <ListItem><ListItemText primary="Item 1" /></ListItem>
            <ListItem><ListItemText primary="Item 2" /></ListItem>
          </List>
        </div>
      </Collapse>
    ),
    dialog: (
      <Dialog open={open} onClose={onClose || (() => setOpen(false))}>
        <Card>
          <CardContent>
            <h3>Dialog Animation</h3>
            <button onClick={handleSnackbar}>Show Snackbar</button>
          </CardContent>
        </Card>
      </Dialog>
    ),
    menu: (
      <Menu open={open} onClose={onClose || (() => setOpen(false))}>
        <ListItem button data-testid="menu-item">
          <ListItemText primary="Menu Item 1" />
        </ListItem>
        <ListItem button data-testid="menu-item">
          <ListItemText primary="Menu Item 2" />
        </ListItem>
      </Menu>
    ),
    drawer: (
      <Drawer open={open} onClose={onClose || (() => setOpen(false))}>
        <div data-testid="drawer-content" style={{ padding: '20px' }}>
          Drawer Content
        </div>
      </Drawer>
    ),
    snackbar: (
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
      >
        <div data-testid="snackbar-content">
          Notification Message
        </div>
      </Snackbar>
    )
  };

  return animations[type] || animations.fade;
};

// Composant React Spring pour tests avancés
const ReactSpringComponent = ({ isVisible }) => {
  const [springValue, setSpringValue] = useState(0);
  const requestRef = useRef();
  const previousTimeRef = useRef();

  const animate = useCallback((time) => {
    if (previousTimeRef.current != null) {
      const deltaTime = time - previousTimeRef.current;
      const newValue = Math.min(springValue + deltaTime * 0.1, 100);
      
      if (newValue >= 100) {
        cancelAnimationFrame(requestRef.current);
        return;
      }
      
      setSpringValue(newValue);
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [springValue]);

  useEffect(() => {
    if (isVisible) {
      previousTimeRef.current = undefined;
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isVisible, animate]);

  return (
    <animated.div
      data-testid="react-spring-element"
      style={{
        opacity: springValue / 100,
        transform: `scale(${springValue / 100})`,
        willChange: 'transform, opacity'
      }}
    >
      React Spring Animation: {Math.round(springValue)}%
    </animated.div>
  );
};

describe('Tests de Fluidité des Animations et Transitions MUI', () => {
  let frameRates = [];
  let animationDurations = [];

  beforeEach(() => {
    frameRates = [];
    animationDurations = [];
  });

  afterEach(() => {
    frameRates = [];
    animationDurations = [];
  });

  describe('Tests de FPS et fluidité', () => {
    test('Mesure le FPS des animations CSS simples', async () => {
      const user = userEvent.setup();
      
      const onAnimationComplete = jest.fn();
      const { container } = render(
        <BasicAnimationComponent 
          isVisible={true} 
          onAnimationComplete={onAnimationComplete}
        />
      );

      const animatedBar = container.querySelector('[data-testid="animated-bar"]');
      const startTime = performance.now();
      let lastTime = startTime;
      let frameCount = 0;

      // Moniteur de frame rate via MutationObserver
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(() => {
          const now = performance.now();
          const frameTime = now - lastTime;
          const fps = 1000 / frameTime;
          frameRates.push(fps);
          lastTime = now;
          frameCount++;
        });
      });

      observer.observe(animatedBar, {
        attributes: true,
        attributeFilter: ['style']
      });

      // Attendre que l'animation se termine
      await waitFor(() => expect(onAnimationComplete).toHaveBeenCalled(), {
        timeout: 5000
      });

      observer.disconnect();

      const averageFPS = frameRates.reduce((a, b) => a + b) / frameRates.length;
      const minFPS = Math.min(...frameRates);

      expect(averageFPS).toBeGreaterThan(55); // Moyenne > 55fps
      expect(minFPS).toBeGreaterThan(30); // Minimum > 30fps
      expect(frameCount).toBeGreaterThan(90); // Au moins 90 frames sur 100%
    });

    test('Teste 60fps pour animations CSS pures', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <CSSTransitionComponent show={true} type="fade" />
      );

      const element = container.querySelector('[data-testid="css-fade"]');
      const animations = [
        { property: 'opacity', from: '0', to: '1' },
        { property: 'transform', from: 'scale(0.8)', to: 'scale(1)' }
      ];

      for (const animation of animations) {
        const startTime = performance.now();
        
        // Appliquer l'animation
        element.style[animation.property] = animation.from;
        element.offsetHeight; // Force reflow
        
        requestAnimationFrame(() => {
          element.style[animation.property] = animation.to;
        });

        // Mesurer la durée
        const duration = performance.now() - startTime;
        expect(duration).toBeLessThan(16.67); // 60fps = 16.67ms max
      }
    });

    test('Teste la performance avec 10 animations simultanées', async () => {
      const { container } = render(
        <div>
          {Array.from({ length: 10 }, (_, i) => (
            <BasicAnimationComponent
              key={i}
              isVisible={true}
              onAnimationComplete={() => {}}
            />
          ))}
        </div>
      );

      const animatedBars = container.querySelectorAll('[data-testid="animated-bar"]');
      const totalStartTime = performance.now();

      // Attendre que toutes les animations se terminent
      await waitFor(() => {
        const completedBars = Array.from(animatedBars).filter(bar => {
          const width = parseFloat(bar.style.width);
          return width >= 99;
        });
        return completedBars.length === 10;
      }, { timeout: 10000 });

      const totalDuration = performance.now() - totalStartTime;

      expect(totalDuration).toBeLessThan(2000); // 10 animations simultanées < 2s
      expect(animatedBars.length).toBe(10);
    });

    test('Benchmark GPU vs CPU animations', async () => {
      const gpuAnimations = [];
      const cpuAnimations = [];

      // Test animations GPU (transform, opacity)
      const testGPUAnimation = () => {
        const startTime = performance.now();
        const element = document.createElement('div');
        element.style.willChange = 'transform';
        element.style.transform = 'translateX(0px)';
        
        for (let i = 0; i < 60; i++) {
          element.style.transform = `translateX(${i}px) translateY(${i}px)`;
        }
        
        const duration = performance.now() - startTime;
        return duration;
      };

      // Test animations CPU (layout properties)
      const testCPUAnimation = () => {
        const startTime = performance.now();
        const element = document.createElement('div');
        
        for (let i = 0; i < 60; i++) {
          element.style.width = `${i}px`;
          element.style.height = `${i}px`;
          element.style.top = `${i}px`;
          element.style.left = `${i}px`;
        }
        
        const duration = performance.now() - startTime;
        return duration;
      };

      // Mesurer performances GPU
      for (let i = 0; i < 10; i++) {
        gpuAnimations.push(testGPUAnimation());
      }

      // Mesurer performances CPU
      for (let i = 0; i < 10; i++) {
        cpuAnimations.push(testCPUAnimation());
      }

      const avgGPU = gpuAnimations.reduce((a, b) => a + b) / gpuAnimations.length;
      const avgCPU = cpuAnimations.reduce((a, b) => a + b) / cpuAnimations.length;

      expect(avgGPU).toBeLessThan(avgCPU); // GPU doit être plus rapide
      expect(avgGPU).toBeLessThan(10); // GPU < 10ms
    });
  });

  describe('Tests des animations MUI', () => {
    test('Mesure les temps de transition MUI Fade', async () => {
      const user = userEvent.setup();
      
      const { container, rerender } = render(
        <MUIAnimationComponent type="fade" isOpen={false} />
      );

      // Mesurer l'ouverture
      const openStartTime = performance.now();
      rerender(<MUIAnimationComponent type="fade" isOpen={true} />);
      
      await waitFor(() => {
        const fadeElement = container.querySelector('[data-testid="mui-fade"]');
        return fadeElement && window.getComputedStyle(fadeElement).opacity !== '0';
      });
      
      const openDuration = performance.now() - openStartTime;
      expect(openDuration).toBeLessThan(350); // Timeout + buffer

      // Mesurer la fermeture
      const closeStartTime = performance.now();
      rerender(<MUIAnimationComponent type="fade" isOpen={false} />);
      
      await waitFor(() => {
        const fadeElement = container.querySelector('[data-testid="mui-fade"]');
        return !fadeElement || window.getComputedStyle(fadeElement).opacity === '0';
      });
      
      const closeDuration = performance.now() - closeStartTime;
      expect(closeDuration).toBeLessThan(350);
    });

    test('Teste les performances de Dialog MUI', async () => {
      const user = userEvent.setup();
      
      const { container } = render(
        <MUIAnimationComponent type="dialog" isOpen={true} />
      );

      const dialog = container.querySelector('[data-testid="mui-dialog"]');
      expect(dialog).toBeInTheDocument();

      // Vérifier que le backdrop est présent
      const backdrop = dialog.closest('[role="presentation"]');
      if (backdrop) {
        const style = window.getComputedStyle(backdrop);
        expect(style.opacity).toBe('1');
      }
    });

    test('Teste la performance des animations de Menu', async () => {
      const user = userEvent.setup();
      
      const { container, rerender } = render(
        <MUIAnimationComponent type="menu" isOpen={false} />
      );

      const openStartTime = performance.now();
      rerender(<MUIAnimationComponent type="menu" isOpen={true} />);
      
      await waitFor(() => {
        const menuItems = container.querySelectorAll('[data-testid="menu-item"]');
        return menuItems.length > 0;
      });
      
      const menuItems = container.querySelectorAll('[data-testid="menu-item"]');
      expect(menuItems.length).toBe(2);
      
      const openDuration = performance.now() - openStartTime;
      expect(openDuration).toBeLessThan(200);
    });

    test('Teste les performances avec 5 animations MUI simultanées', async () => {
      const { container } = render(
        <div>
          <MUIAnimationComponent type="fade" isOpen={true} />
          <MUIAnimationComponent type="slide" isOpen={true} />
          <MUIAnimationComponent type="collapse" isOpen={true} />
          <MUIAnimationComponent type="dialog" isOpen={true} />
          <MUIAnimationComponent type="menu" isOpen={true} />
        </div>
      );

      // Vérifier que tous les éléments sont présents
      await waitFor(() => {
        const fade = container.querySelector('[data-testid="mui-fade"]');
        const slide = container.querySelector('[data-testid="mui-slide"]');
        const collapse = container.querySelector('[data-testid="mui-collapse"]');
        const dialog = container.querySelector('[data-testid="mui-dialog"]');
        const menuItems = container.querySelectorAll('[data-testid="menu-item"]');

        expect(fade).toBeInTheDocument();
        expect(slide).toBeInTheDocument();
        expect(collapse).toBeInTheDocument();
        expect(dialog).toBeInTheDocument();
        expect(menuItems.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Tests de performance mémoire des animations', () => {
    test('Détecte les fuites mémoire lors d\'animations répétées', async () => {
      const user = userEvent.setup();
      
      const memoryMonitor = performanceMonitor.monitorMemoryLeaks();
      
      const { rerender } = render(
        <MUIAnimationComponent type="fade" isOpen={false} />
      );

      // 100 cycles d'ouverture/fermeture
      for (let i = 0; i < 100; i++) {
        rerender(<MUIAnimationComponent type="fade" isOpen={true} />);
        await waitFor(() => {
          const fade = screen.queryByTestId('mui-fade');
          return fade && window.getComputedStyle(fade).opacity !== '0';
        });

        rerender(<MUIAnimationComponent type="fade" isOpen={false} />);
        await waitFor(() => {
          const fade = screen.queryByTestId('mui-fade');
          return !fade || window.getComputedStyle(fade).opacity === '0';
        });

        if (i % 10 === 0) {
          // Force garbage collection simulation
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      const memoryResults = memoryMonitor.checkAfter();
      expect(memoryResults.hasMemoryLeak).toBe(false);
      expect(memoryResults.memoryIncrease).toBeLessThan(3 * 1024 * 1024); // 3MB max
    });

    test('Teste la performance avec animations CSS3 hardware acceleration', () => {
      const testHardwareAcceleration = () => {
        const element = document.createElement('div');
        
        // Styles pour hardware acceleration
        const acceleratedStyles = {
          transform: 'translateZ(0)',
          willChange: 'transform, opacity',
          backfaceVisibility: 'hidden',
          perspective: '1000px'
        };

        const startTime = performance.now();
        
        // Appliquer les styles
        Object.assign(element.style, acceleratedStyles);
        element.offsetHeight; // Force layout

        // Animation GPU-accélérée
        for (let i = 0; i < 60; i++) {
          element.style.transform = `translateZ(0) scale(${1 + i * 0.01}) rotateY(${i}deg)`;
        }

        const duration = performance.now() - startTime;
        return duration;
      };

      const acceleratedDuration = testHardwareAcceleration();
      expect(acceleratedDuration).toBeLessThan(20); // GPU acceleration < 20ms
    });
  });

  describe('Tests des animations React Spring', () => {
    test('Teste les performances des animations basées sur requestAnimationFrame', async () => {
      const user = userEvent.setup();
      
      const onAnimationComplete = jest.fn();
      const { container } = render(
        <ReactSpringComponent isVisible={true} />
      );

      const springElement = container.querySelector('[data-testid="react-spring-element"]');

      // Attendre que l'animation atteigne 100%
      await waitFor(() => {
        const text = springElement.textContent;
        const progress = parseInt(text.match(/\d+/)?.[0] || '0');
        return progress >= 95;
      }, { timeout: 5000 });

      expect(onAnimationComplete).toHaveBeenCalled();
      expect(springElement.style.willChange).toBe('transform, opacity');
    });

    test('Benchmark animations: CSS vs React Spring vs MUI', async () => {
      const results = {
        css: 0,
        reactSpring: 0,
        mui: 0
      };

      // Test CSS
      const cssStartTime = performance.now();
      const cssElement = document.createElement('div');
      cssElement.style.transition = 'all 300ms ease-in-out';
      
      requestAnimationFrame(() => {
        cssElement.style.transform = 'scale(2)';
        cssElement.style.opacity = '0.5';
      });

      await new Promise(resolve => setTimeout(resolve, 300));
      results.css = performance.now() - cssStartTime;

      // Test React Spring (simulation)
      const reactSpringStartTime = performance.now();
      let reactSpringValue = 0;
      const animateReactSpring = () => {
        if (reactSpringValue < 1) {
          reactSpringValue += 0.1;
          requestAnimationFrame(animateReactSpring);
        }
      };
      requestAnimationFrame(animateReactSpring);
      
      await new Promise(resolve => {
        const check = () => {
          if (reactSpringValue >= 1) {
            resolve();
          } else {
            requestAnimationFrame(check);
          }
        };
        requestAnimationFrame(check);
      });
      results.reactSpring = performance.now() - reactSpringStartTime;

      // Test MUI (simulation)
      const muiStartTime = performance.now();
      const muiElement = document.createElement('div');
      muiElement.style.transition = 'opacity 300ms ease-in-out, transform 300ms ease-in-out';
      muiElement.style.opacity = '1';
      muiElement.style.transform = 'translateY(0)';
      muiElement.offsetHeight; // Force reflow
      
      muiElement.style.opacity = '0';
      muiElement.style.transform = 'translateY(-10px)';
      
      await new Promise(resolve => setTimeout(resolve, 300));
      results.mui = performance.now() - muiStartTime;

      // Vérifier que toutes les animations sont dans une fourchette acceptable
      expect(results.css).toBeLessThan(500);
      expect(results.reactSpring).toBeLessThan(500);
      expect(results.mui).toBeLessThan(500);
      
      // React Spring doit être proche du CSS pour les performances
      expect(Math.abs(results.css - results.reactSpring)).toBeLessThan(200);
    });
  });
});