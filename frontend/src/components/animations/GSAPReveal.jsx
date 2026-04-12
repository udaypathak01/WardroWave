import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function GSAPReveal({ children, stagger = false, className = '' }) {
  const container = useRef(null);

  useGSAP(() => {
    if (stagger) {
      const elements = container.current.children;
      gsap.fromTo(elements, 
        {
          y: 50,
          opacity: 0,
        },
        {
          scrollTrigger: {
            trigger: container.current,
            start: "top 85%",
          },
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
        }
      );
    } else {
      gsap.fromTo(container.current, 
        {
          y: 50,
          opacity: 0,
        },
        {
          scrollTrigger: {
            trigger: container.current,
            start: "top 85%",
          },
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
        }
      );
    }
  }, { scope: container });

  return (
    <div ref={container} className={className}>
      {children}
    </div>
  );
}
