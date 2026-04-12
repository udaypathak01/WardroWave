import { useRef, useState, useEffect, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export default function GSAPTabTransition({ children, activeTab, className = '' }) {
  const container = useRef(null);
  const [displayChildren, setDisplayChildren] = useState(children);
  const prevTabRef = useRef(activeTab);

  // We need to know when we are preparing to animate in
  const [pendingAnimation, setPendingAnimation] = useState(false);
  const [direction, setDirection] = useState(30);

  const { contextSafe } = useGSAP({ scope: container });

  const triggerSwap = contextSafe(() => {
    // When displayChildren updates and we have a pending animation, we run the IN animation
    if (pendingAnimation) {
      gsap.fromTo(container.current, 
        { opacity: 0, x: direction },
        { opacity: 1, x: 0, duration: 0.4, ease: "power3.out" }
      );
      setPendingAnimation(false);
    }
  });

  useLayoutEffect(() => {
    triggerSwap();
  }, [displayChildren, pendingAnimation, triggerSwap]);

  useGSAP(() => {
    if (activeTab !== prevTabRef.current) {
      // Start out animation on current displayChildren
      const isNext = activeTab.toString() > prevTabRef.current.toString(); // Just arbitrary string comparison for direction
      const dir = isNext ? 30 : -30;
      setDirection(dir);
      
      gsap.to(container.current, {
        opacity: 0,
        x: -dir,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => {
          setTimeout(() => {
             // Let React swap children
             prevTabRef.current = activeTab;
             setPendingAnimation(true);
             setDisplayChildren(children);
          }, 0);
        }
      });
    } else if (children !== displayChildren && !pendingAnimation) {
       // Regular updates, like data loading without tab change
       setDisplayChildren(children);
    }
  }, { dependencies: [activeTab, children] });

  return (
    <div ref={container} className={className}>
      {displayChildren}
    </div>
  );
}
