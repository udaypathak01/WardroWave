import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export default function GSAPTabTransition({ children, activeTab, className = '' }) {
  const container = useRef(null);
  const [displayChildren, setDisplayChildren] = useState(children);
  const prevTabRef = useRef(activeTab);

  useGSAP(() => {
    if (activeTab !== prevTabRef.current) {
      const isNext = activeTab.toString() > prevTabRef.current.toString();
      const dir = isNext ? 30 : -30;
      
      gsap.to(container.current, {
        opacity: 0,
        x: -dir,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
          prevTabRef.current = activeTab;
          setDisplayChildren(children);
          gsap.fromTo(
            container.current,
            { opacity: 0, x: dir },
            { opacity: 1, x: 0, duration: 0.4, ease: 'power3.out' }
          );
        },
      });
    } else if (children !== displayChildren) {
      setDisplayChildren(children);
    }
  }, { scope: container, dependencies: [activeTab, children] });

  return (
    <div ref={container} className={className}>
      {displayChildren}
    </div>
  );
}
