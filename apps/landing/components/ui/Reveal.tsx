import React, { useEffect, useRef, useState } from 'react';

interface RevealProps {
  children: React.ReactNode;
  width?: "fit-content" | "100%";
  delay?: number;
  className?: string;
}

export const Reveal: React.FC<RevealProps> = ({ children, width = "fit-content", delay = 0, className = "" }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.disconnect();
    };
  }, []);

  return (
    <div 
      ref={ref} 
      style={{ width }} 
      className={`relative overflow-hidden ${className}`}
    >
      <div
        style={{
          transform: isVisible ? "translateY(0)" : "translateY(75px)",
          opacity: isVisible ? 1 : 0,
          transition: `all 0.9s cubic-bezier(0.17, 0.55, 0.55, 1) ${delay}s`
        }}
      >
        {children}
      </div>
    </div>
  );
};