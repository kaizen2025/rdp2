import { useEffect, useRef, useState } from 'react';

/**
 * Hook personnalisé pour l'intersection observer
 * Permet de détecter quand un élément entre dans le viewport
 * 
 * @param {Object} options - Options de configuration
 * @param {number} options.threshold - Seuil de visibilité (0 à 1)
 * @param {string} options.root - Sélecteur de l'élément racine
 * @param {string} options.rootMargin - Marges de l'élément racine
 * @param {boolean} options.once - Ne observer qu'une seule fois
 * 
 * @returns {[React.RefObject, boolean, IntersectionObserverEntry?]} - Référence, état d'intersection, entrée d'observation
 */
export const useIntersectionObserver = (options = {}) => {
  const {
    threshold = 0.1,
    root = null,
    rootMargin = '0px',
    once = true
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState(null);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Résoudre l'élément racine
    const rootElement = root 
      ? document.querySelector(root) 
      : null;

    const observer = new IntersectionObserver(
      ([newEntry]) => {
        setEntry(newEntry);
        setIsIntersecting(newEntry.isIntersecting);
        
        // Si on ne doit observer qu'une fois et que l'élément est visible
        if (once && newEntry.isIntersecting) {
          observer.unobserve(element);
        }
      },
      {
        threshold,
        root: rootElement,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, once]);

  return [elementRef, isIntersecting, entry];
};

export default useIntersectionObserver;