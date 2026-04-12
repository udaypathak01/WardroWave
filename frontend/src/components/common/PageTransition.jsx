import { motion } from 'framer-motion';
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export default function PageTransition({ children, className = '' }) {
  const container = useRef(null);

  useGSAP(() => {
    gsap.from(container.current, {
      opacity: 0,
      y: 20,
      duration: 0.6,
      ease: "power3.out",
    });
  }, { scope: container });

  return (
    <motion.div
      ref={container}
      className={className}
      initial={{ opacity: 1 }} // Prevent conflict with GSAP
      exit={{ opacity: 0, transition: { duration: 0.2 } }} // Handled strictly by framer-motion AnimatePresence for routing
    >
      {children}
    </motion.div>
  );
}

// Retain Stagger functionality using GSAP hook
export function StaggerContainer({ children, className = '' }) {
  const container = useRef(null);
  
  useGSAP(() => {
    gsap.from(container.current.children, {
      opacity: 0,
      y: 30,
      duration: 0.6,
      stagger: 0.1,
      ease: "power3.out",
    });
  }, { scope: container });

  return (
    <div ref={container} className={`stagger-container ${className}`}>
      {children}
    </div>
  );
}

export function StaggerItem({ children, className = '' }) {
  return (
    <div className={`stagger-item ${className}`}>
      {children}
    </div>
  );
}

export function FadeIn({ children, delay = 0, className = '' }) {
  const container = useRef(null);

  useGSAP(() => {
    gsap.from(container.current, {
      opacity: 0,
      y: 20,
      duration: 0.6,
      delay: delay,
      ease: "power3.out",
    });
  }, { scope: container });

  return (
    <div ref={container} className={`fade-in ${className}`}>
      {children}
    </div>
  );
}
