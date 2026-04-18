import { useState, useEffect, useRef } from 'react';

export default function AnimatedValue({ value, prefix = '', suffix = '', color = '#FFF', flashColor = '#EAB30833' }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [flash, setFlash] = useState(false);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (value === prevValueRef.current || value == null) {
      if (value != null && displayValue == null) setDisplayValue(value);
      return;
    }
    
    const startValue = prevValueRef.current || 0;
    const endValue = value;
    const startTime = performance.now();
    const duration = 400; // ms
    
    // Auto-detect if value expects decimals based on original format or if it's explicitly a float
    const isFloat = !Number.isInteger(parseFloat(value)) || String(value).includes('.');

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      if (elapsed < duration) {
        const progress = Math.min(elapsed / duration, 1);
        // Ease out quad
        const easeProgress = progress * (2 - progress);
        const validCurrent = typeof currentVal === 'number' && !isNaN(currentVal) ? currentVal : 0;
        setDisplayValue(isFloat ? validCurrent.toFixed(2) : Math.round(validCurrent));
        requestAnimationFrame(animate);
      } else {
        const validEnd = typeof endValue === 'number' && !isNaN(endValue) ? endValue : (parseFloat(endValue) || 0);
        setDisplayValue(isFloat ? Number(validEnd).toFixed(2) : endValue);
      }
    };

    requestAnimationFrame(animate);
    
    setFlash(true);
    const flashTimeout = setTimeout(() => setFlash(false), 600);
    
    prevValueRef.current = value;
    
    return () => clearTimeout(flashTimeout);
  }, [value]);

  return (
    <span style={{ 
        color, 
        transition: 'background-color 0.6s ease',
        backgroundColor: flash ? flashColor : 'transparent',
        padding: '0 4px',
        borderRadius: 4
    }}>
      {prefix}{displayValue != null ? displayValue : '--'}{suffix}
    </span>
  );
}
