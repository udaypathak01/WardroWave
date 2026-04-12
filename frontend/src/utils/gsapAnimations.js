import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Carousel Slider Animation
 * Creates smooth sliding effect for featured products carousel
 */
export const animateCarouselSlide = (containerRef, itemsRef, direction = 'next') => {
  if (!containerRef.current || itemsRef.current.length === 0) return;

  const items = itemsRef.current;
  
  // Stagger animation for items appearing
  gsap.timeline()
    .from(items, {
      opacity: 0,
      x: direction === 'next' ? 100 : -100,
      duration: 0.6,
      stagger: 0.08
    })
    .to(items, {
      opacity: 1,
      x: 0,
      duration: 0.6,
      stagger: 0.08
    }, 0);
};

/**
 * Individual Item Scale Animation
 * Animates individual carousel item on hover
 */
export const animateItemHover = (itemRef) => {
  if (!itemRef) return;

  gsap.to(itemRef, {
    scale: 1.05,
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
    duration: 0.3,
    ease: 'power2.out'
  });
};

/**
 * Individual Item Scale Reset
 * Resets item animation on mouse leave
 */
export const resetItemHover = (itemRef) => {
  if (!itemRef) return;

  gsap.to(itemRef, {
    scale: 1,
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
    duration: 0.3,
    ease: 'power2.out'
  });
};

/**
 * Navigation Button Animation
 * Animates prev/next buttons
 */
export const animateNavButton = (buttonRef) => {
  if (!buttonRef) return;

  gsap.to(buttonRef, {
    scale: 0.9,
    duration: 0.1,
    yoyo: true,
    repeat: 1
  });
};

/**
 * Indicator Dots Animation
 * Animates the active indicator dot
 */
export const animateIndicatorDot = (dotRef) => {
  if (!dotRef) return;

  gsap.timeline()
    .to(dotRef, {
      backgroundColor: '#7c3aed', // purple-600
      width: 32,
      duration: 0.3,
      ease: 'power2.out'
    });
};

/**
 * Reset Inactive Indicator Dots
 * Resets non-active dots
 */
export const resetIndicatorDot = (dotRef) => {
  if (!dotRef) return;

  gsap.timeline()
    .to(dotRef, {
      backgroundColor: '#d1d5db', // gray-300
      width: 8,
      duration: 0.3,
      ease: 'power2.out'
    });
};

/**
 * Carousel Container Auto-Scroll Animation
 * Creates continuous smooth scrolling effect
 */
export const animateCarouselAutoScroll = (containerRef, duration = 0.6) => {
  if (!containerRef.current) return;

  return gsap.to(containerRef.current, {
    x: -300, // Scroll left by item width
    duration: duration,
    ease: 'power1.inOut'
  });
};

/**
 * Carousel Item Fade and Slide
 * Creates entrance animation for carousel items
 */
export const animateCarouselItems = (itemsRef, staggerDelay = 0.1) => {
  if (!itemsRef || itemsRef.length === 0) return;

  return gsap.from(itemsRef, {
    opacity: 0,
    y: 30,
    duration: 0.6,
    stagger: staggerDelay,
    ease: 'back.out'
  });
};

/**
 * Carousel Item Scale Animation
 * Individual item entrance with scale
 */
export const animateItemScale = (itemRef) => {
  if (!itemRef) return;

  return gsap.from(itemRef, {
    opacity: 0,
    scale: 0.8,
    duration: 0.5,
    ease: 'back.out'
  });
};

/**
 * Indicator Dots Stagger Animation
 * Animates all dots with stagger
 */
export const animateIndicatorDots = (dotsRef) => {
  if (!dotsRef || dotsRef.length === 0) return;

  return gsap.from(dotsRef, {
    opacity: 0,
    scale: 0,
    duration: 0.4,
    stagger: 0.05,
    ease: 'back.out'
  });
};

/**
 * Navigation Buttons Entrance
 * Animates prev/next buttons entrance
 */
export const animateNavButtons = (prevRef, nextRef) => {
  const tl = gsap.timeline();

  if (prevRef) {
    tl.from(prevRef, {
      opacity: 0,
      x: -30,
      duration: 0.5,
      ease: 'power2.out'
    }, 0);
  }

  if (nextRef) {
    tl.from(nextRef, {
      opacity: 0,
      x: 30,
      duration: 0.5,
      ease: 'power2.out'
    }, 0);
  }

  return tl;
};

/**
 * Savings Badge Animation
 * Animates the savings badge on product cards
 */
export const animateSavingsBadge = (badgeRef) => {
  if (!badgeRef) return;

  gsap.timeline()
    .from(badgeRef, {
      opacity: 0,
      scale: 0,
      duration: 0.4,
      ease: 'back.out'
    })
    .to(badgeRef, {
      rotation: 5,
      duration: 0.3,
      ease: 'sine.inOut'
    }, 0.2)
    .to(badgeRef, {
      rotation: -5,
      duration: 0.3,
      ease: 'sine.inOut'
    })
    .to(badgeRef, {
      rotation: 0,
      duration: 0.3,
      ease: 'sine.inOut'
    });
};

/**
 * Heart/Favorite Button Animation
 * Animates the favorite heart button
 */
export const animateFavoriteButton = (buttonRef, isFavorite) => {
  if (!buttonRef) return;

  if (isFavorite) {
    gsap.timeline()
      .to(buttonRef, {
        scale: 1.3,
        duration: 0.2,
        ease: 'back.out'
      })
      .to(buttonRef, {
        scale: 1,
        duration: 0.2,
        ease: 'elastic.out(1.2, 0.5)'
      });
  } else {
    gsap.to(buttonRef, {
      scale: 0.9,
      duration: 0.2,
      ease: 'power2.out'
    });
  }
};

/**
 * Product Rating Stars Animation
 * Animates stars appearing one by one
 */
export const animateRatingStars = (starsRef) => {
  if (!starsRef || starsRef.length === 0) return;

  return gsap.from(starsRef, {
    opacity: 0,
    scale: 0,
    duration: 0.3,
    stagger: 0.08,
    ease: 'back.out'
  });
};

/**
 * Price Tag Animation
 * Animates price information entrance
 */
export const animatePriceTag = (priceRef) => {
  if (!priceRef) return;

  return gsap.from(priceRef, {
    opacity: 0,
    y: 10,
    duration: 0.4,
    ease: 'power2.out'
  });
};

/**
 * Create Carousel Rotation Effect
 * Continuous rotation animation for featured products
 */
export const createCarouselRotation = (itemsRef, duration = 5) => {
  if (!itemsRef || itemsRef.length === 0) return;

  const tl = gsap.timeline({ repeat: -1 });

  itemsRef.forEach((item, index) => {
    tl.to(item, {
      opacity: 1,
      duration: 0.5
    }, index * duration);

    tl.to(item, {
      opacity: 0,
      duration: 0.5
    }, index * duration + duration - 0.5);
  });

  return tl;
};

/**
 * Smooth Scroll to Element
 * Smoothly scrolls to a specific element
 */
export const smoothScrollTo = (targetRef, duration = 1) => {
  if (!targetRef) return;

  gsap.to(window, {
    scrollTo: targetRef,
    duration: duration,
    ease: 'power2.inOut'
  });
};

/**
 * Pulse Animation
 * Creates a pulsing effect on elements
 */
export const animatePulse = (elementRef, scale = 1.1) => {
  if (!elementRef) return;

  return gsap.timeline({ repeat: -1, yoyo: true })
    .to(elementRef, {
      scale: scale,
      duration: 0.6,
      ease: 'sine.inOut'
    });
};

/**
 * Bounce Animation
 * Creates a bouncing effect
 */
export const animateBounce = (elementRef, distance = 10, duration = 0.6) => {
  if (!elementRef) return;

  return gsap.timeline({ repeat: -1 })
    .to(elementRef, {
      y: -distance,
      duration: duration / 2,
      ease: 'power1.out'
    })
    .to(elementRef, {
      y: 0,
      duration: duration / 2,
      ease: 'bounce.out'
    });
};
