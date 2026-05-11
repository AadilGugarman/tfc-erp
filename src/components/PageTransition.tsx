import { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';

interface PageTransitionProps {
  children: React.ReactNode;
  isLoading?: boolean;
  variant?: 'fade' | 'slide-up' | 'scale';
}

export function PageTransition({
  children,
  isLoading = false,
  variant = 'fade',
}: PageTransitionProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const animationClass = {
    fade: 'animate-fade-in',
    'slide-up': 'animate-slide-up',
    scale: 'animate-scale-in',
  }[variant];

  if (!mounted) {
    return null;
  }

  return (
    <div className={cn(
      animationClass,
      isLoading && 'opacity-50 pointer-events-none'
    )}>
      {children}
    </div>
  );
}
