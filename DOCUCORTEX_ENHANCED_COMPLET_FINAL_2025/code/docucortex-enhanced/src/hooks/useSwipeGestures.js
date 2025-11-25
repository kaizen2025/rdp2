// src/hooks/useSwipeGestures.js - Gestes de navigation tactile

import { useRef, useEffect, useCallback } from 'react';
import { useBreakpoint } from './useBreakpoint';

/**
 * Configuration des seuils de détection
 */
const SWIPE_THRESHOLD = 50;
const SWIPE_VELOCITY = 0.3;

/**
 * Hook pour gérer les gestes de swipe sur les composants
 */
export const useSwipeGestures = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onTap,
  enableSwipe = true,
  enableTap = true,
  preventDefault = true,
  elementRef
}) => {
  const { isTouch } = useBreakpoint();
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const isDraggingRef = useRef(false);

  // Calculer la distance et la vélocité du swipe
  const calculateSwipeInfo = useCallback((touchStart, touchEnd) => {
    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const time = touchEnd.time - touchStart.time;
    const velocity = distance / time;

    return {
      deltaX,
      deltaY,
      distance,
      time,
      velocity,
      isHorizontal: Math.abs(deltaX) > Math.abs(deltaY),
      isVertical: Math.abs(deltaY) > Math.abs(deltaX),
      isLeftSwipe: deltaX < 0,
      isRightSwipe: deltaX > 0,
      isUpSwipe: deltaY < 0,
      isDownSwipe: deltaY > 0
    };
  }, []);

  // Gérer le début du touch
  const handleTouchStart = useCallback((e) => {
    if (!isTouch || !enableSwipe) return;
    
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    isDraggingRef.current = false;
  }, [isTouch, enableSwipe]);

  // Gérer le mouvement de touch
  const handleTouchMove = useCallback((e) => {
    if (!isTouch || !enableSwipe) return;
    
    if (preventDefault) {
      e.preventDefault();
    }
    
    isDraggingRef.current = true;
  }, [isTouch, enableSwipe, preventDefault]);

  // Gérer la fin du touch
  const handleTouchEnd = useCallback((e) => {
    if (!isTouch) return;
    
    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
      time: Date.now()
    };

    const swipeInfo = calculateSwipeInfo(touchStartRef.current, touchEnd);
    
    // Déterminer le type de geste
    const isTap = enableTap && 
                  swipeInfo.distance < SWIPE_THRESHOLD && 
                  swipeInfo.time < 300 &&
                  !isDraggingRef.current;

    if (isTap) {
      onTap?.(e);
      return;
    }

    // Vérifier les conditions de swipe
    const isValidSwipe = swipeInfo.distance > SWIPE_THRESHOLD && 
                        swipeInfo.velocity > SWIPE_VELOCITY;

    if (enableSwipe && isValidSwipe) {
      // Swipe horizontal
      if (swipeInfo.isHorizontal && swipeInfo.distance > SWIPE_THRESHOLD) {
        if (swipeInfo.isLeftSwipe && onSwipeLeft) {
          onSwipeLeft(swipeInfo);
        } else if (swipeInfo.isRightSwipe && onSwipeRight) {
          onSwipeRight(swipeInfo);
        }
      }
      // Swipe vertical
      else if (swipeInfo.isVertical && swipeInfo.distance > SWIPE_THRESHOLD) {
        if (swipeInfo.isUpSwipe && onSwipeUp) {
          onSwipeUp(swipeInfo);
        } else if (swipeInfo.isDownSwipe && onSwipeDown) {
          onSwipeDown(swipeInfo);
        }
      }
    }

    isDraggingRef.current = false;
  }, [
    isTouch,
    enableSwipe,
    enableTap,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    calculateSwipeInfo
  ]);

  // Attacher les événements
  useEffect(() => {
    const element = elementRef?.current || document;
    
    if (!isTouch) return;

    const touchStartHandler = (e) => handleTouchStart(e);
    const touchMoveHandler = (e) => handleTouchMove(e);
    const touchEndHandler = (e) => handleTouchEnd(e);

    element.addEventListener('touchstart', touchStartHandler, { passive: false });
    element.addEventListener('touchmove', touchMoveHandler, { passive: false });
    element.addEventListener('touchend', touchEndHandler, { passive: false });

    return () => {
      element.removeEventListener('touchstart', touchStartHandler);
      element.removeEventListener('touchmove', touchMoveHandler);
      element.removeEventListener('touchend', touchEndHandler);
    };
  }, [
    isTouch,
    elementRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  ]);

  // Retournes les propriétés à attacher aux éléments
  return {
    touchHandlers: isTouch ? {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    } : {},
    isTouchDevice: isTouch,
    swipeEnabled: enableSwipe,
    tapEnabled: enableTap
  };
};

export default useSwipeGestures;