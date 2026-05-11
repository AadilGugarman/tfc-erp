import { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';

type BreakpointSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const breakpoints: Record<BreakpointSize, number> = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export function useBreakpoint(breakpoint: BreakpointSize) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const checkBreakpoint = () => {
      setIsActive(window.innerWidth >= breakpoints[breakpoint]);
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);

    return () => window.removeEventListener('resize', checkBreakpoint);
  }, [breakpoint]);

  return isActive;
}

export function useIsMobile() {
  return !useBreakpoint('md');
}

export function useIsTablet() {
  const md = useBreakpoint('md');
  const lg = useBreakpoint('lg');
  return md && !lg;
}

export function useIsDesktop() {
  return useBreakpoint('lg');
}

export function useScreenSize() {
  const [screenSize, setScreenSize] = useState<BreakpointSize>('md');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) setScreenSize('xs');
      else if (width < 768) setScreenSize('sm');
      else if (width < 1024) setScreenSize('md');
      else if (width < 1280) setScreenSize('lg');
      else if (width < 1536) setScreenSize('xl');
      else setScreenSize('2xl');
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screenSize;
}

interface ResponsiveProps {
  children: React.ReactNode;
  show?: BreakpointSize | BreakpointSize[];
  hide?: BreakpointSize | BreakpointSize[];
  className?: string;
}

export function Responsive({
  children,
  show,
  hide,
  className,
}: ResponsiveProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useDesktop();

  let shouldShow = true;

  if (show) {
    const showArr = Array.isArray(show) ? show : [show];
    shouldShow = showArr.some(bp => {
      if (bp === 'xs' || bp === 'sm') return isMobile;
      if (bp === 'md') return isTablet;
      if (bp === 'lg' || bp === 'xl' || bp === '2xl') return isDesktop;
      return false;
    });
  }

  if (hide) {
    const hideArr = Array.isArray(hide) ? hide : [hide];
    shouldShow = !hideArr.some(bp => {
      if (bp === 'xs' || bp === 'sm') return isMobile;
      if (bp === 'md') return isTablet;
      if (bp === 'lg' || bp === 'xl' || bp === '2xl') return isDesktop;
      return false;
    });
  }

  if (!shouldShow) return null;

  return <div className={className}>{children}</div>;
}

function useDesktop() {
  return useBreakpoint('lg');
}

export const responsiveClasses = {
  flexDirection: (direction: string) =>
    cn('flex-col sm:flex-row', `sm:flex-${direction}`),
  gridCols: (cols: Record<string, number>) =>
    cn(
      `grid-cols-${cols.xs || 1}`,
      `sm:grid-cols-${cols.sm || 2}`,
      `md:grid-cols-${cols.md || 3}`,
      `lg:grid-cols-${cols.lg || 4}`,
      `xl:grid-cols-${cols.xl || 5}`
    ),
  padding: (padding: Record<string, string>) =>
    cn(
      `p-${padding.xs || 4}`,
      `sm:p-${padding.sm || 5}`,
      `md:p-${padding.md || 6}`,
      `lg:p-${padding.lg || 8}`
    ),
};
