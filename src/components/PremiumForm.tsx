import { cn } from '@/utils/cn';
import { ChevronDown } from 'lucide-react';
import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';

function focusInContainer(target: HTMLElement, direction: 'next' | 'prev') {
  const root =
    target.closest<HTMLElement>('[data-erp-form]') ??
    target.closest<HTMLElement>('form') ??
    target.closest<HTMLElement>('[role="dialog"]') ??
    document.body;

  const nodes = Array.from(
    root.querySelectorAll<HTMLElement>(
      'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((node) => {
    if (node.closest('[data-kb-nav="off"]')) return false;
    const style = window.getComputedStyle(node);
    return style.display !== 'none' && style.visibility !== 'hidden' && node.offsetParent !== null;
  });

  const index = nodes.indexOf(target);
  if (index === -1) return;

  const nextIndex = direction === 'next'
    ? Math.min(nodes.length - 1, index + 1)
    : Math.max(0, index - 1);

  const next = nodes[nextIndex];
  if (!next || next === target) return;

  next.focus();
  if (next instanceof HTMLInputElement) {
    next.select();
  }
}

function handleDirectionalKey(event: React.KeyboardEvent<HTMLElement>) {
  if (event.ctrlKey || event.metaKey || event.altKey) return;

  if (event.key === 'Enter') {
    const target = event.currentTarget as HTMLElement;
    if (target.tagName === 'TEXTAREA' && !target.hasAttribute('data-enter-nav')) return;
    event.preventDefault();
    focusInContainer(target, event.shiftKey ? 'prev' : 'next');
    return;
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    focusInContainer(event.currentTarget as HTMLElement, 'next');
    return;
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault();
    focusInContainer(event.currentTarget as HTMLElement, 'prev');
  }
}

interface PremiumInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  helper?: string;
}

export const PremiumInput = forwardRef<HTMLInputElement, PremiumInputProps>(
  ({ label, error, icon, helper, className, onKeyDown, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-slate-900 dark:text-slate-100">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            aria-invalid={Boolean(error)}
            onKeyDown={(event) => {
              onKeyDown?.(event);
              if (event.defaultPrevented) return;
              handleDirectionalKey(event);
            }}
            className={cn(
              'w-full px-4 py-2.5 rounded-xl',
              'text-slate-900 dark:text-[#e8edf5]',
              'transition-all duration-150',
              'disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed',
              icon && 'pl-10',
              error && 'erp-invalid',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        {helper && !error && <p className="text-xs text-slate-500 dark:text-slate-400">{helper}</p>}
      </div>
    );
  }
);

PremiumInput.displayName = 'PremiumInput';

interface PremiumSelectProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  helper?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  searchable?: boolean;
  placeholder?: string;
}

export const PremiumSelect = forwardRef<HTMLInputElement, PremiumSelectProps>(
  ({
    label,
    error,
    options,
    helper,
    className,
    value = '',
    onChange,
    searchable = true,
    placeholder,
    name,
    onBlur,
    ...props
  }, ref) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const selected = options.find((option) => option.value === value) ?? null;

    const filtered = useMemo(() => {
      const q = query.trim().toLowerCase();
      if (!q) return options;
      return options.filter((option) => option.label.toLowerCase().includes(q));
    }, [options, query]);

    useEffect(() => {
      if (!open) {
        setQuery('');
      }
    }, [open]);

    useEffect(() => {
      if (activeIndex >= filtered.length) {
        setActiveIndex(0);
      }
    }, [activeIndex, filtered.length]);

    useEffect(() => {
      const onDocumentClick = (event: MouseEvent) => {
        if (!containerRef.current) return;
        if (!containerRef.current.contains(event.target as Node)) {
          setOpen(false);
        }
      };

      document.addEventListener('mousedown', onDocumentClick);
      return () => document.removeEventListener('mousedown', onDocumentClick);
    }, []);

    const commitValue = (nextValue: string) => {
      const syntheticEvent = {
        target: { value: nextValue, name: name ?? '' },
        currentTarget: { value: nextValue, name: name ?? '' },
      } as React.ChangeEvent<HTMLSelectElement>;

      onChange?.(syntheticEvent);
      setOpen(false);
      setQuery('');
    };

    const displayValue = open ? query : selected?.label ?? '';

    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-slate-900 dark:text-slate-100">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div ref={containerRef} className="relative" data-kb-nav="off">
          <input
            ref={ref}
            aria-invalid={Boolean(error)}
            value={displayValue}
            name={name}
            readOnly={!searchable}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
              setActiveIndex(0);
            }}
            onFocus={() => {
              setOpen(true);
              setQuery('');
            }}
            onBlur={(event) => {
              onBlur?.(event);
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setOpen(true);
                setActiveIndex((prev) => Math.min(prev + 1, Math.max(filtered.length - 1, 0)));
                return;
              }

              if (event.key === 'ArrowUp') {
                event.preventDefault();
                setOpen(true);
                setActiveIndex((prev) => Math.max(prev - 1, 0));
                return;
              }

              if (event.key === 'Enter') {
                event.preventDefault();
                if (!open) {
                  setOpen(true);
                  return;
                }

                const selectedOption = filtered[activeIndex];
                if (selectedOption) {
                  commitValue(selectedOption.value);
                }
                return;
              }

              if (event.key === 'Escape') {
                event.preventDefault();
                setOpen(false);
                return;
              }

              if (event.key === 'Tab') {
                if (open && filtered[activeIndex]) {
                  commitValue(filtered[activeIndex].value);
                }
              }
            }}
            placeholder={placeholder ?? `Select ${label?.toLowerCase() || 'an option'}`}
            className={cn(
              'w-full px-4 py-2.5 rounded-xl',
              'text-slate-900 dark:text-[#e8edf5]',
              'transition-all duration-150',
              'disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed',
              'pr-10',
              error && 'erp-invalid',
              className
            )}
            {...props}
          />
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />

          {open && (
            <div className="erp-select-panel absolute z-30 mt-1 w-full overflow-hidden max-h-52 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-3 py-2 text-xs text-slate-500">No matches found</div>
              ) : (
                filtered.map((option, index) => (
                  <button
                    key={option.value || `option-${index}`}
                    type="button"
                    onClick={() => commitValue(option.value)}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm transition-colors',
                      index === activeIndex
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1b2335]'
                    )}
                  >
                    {option.label}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        {helper && !error && <p className="text-xs text-slate-500 dark:text-slate-400">{helper}</p>}
      </div>
    );
  }
);

PremiumSelect.displayName = 'PremiumSelect';

interface PremiumTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const PremiumTextarea = forwardRef<HTMLTextAreaElement, PremiumTextareaProps>(
  ({ label, error, helper, className, onKeyDown, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-slate-900 dark:text-slate-100">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          aria-invalid={Boolean(error)}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (event.defaultPrevented) return;
            handleDirectionalKey(event);
          }}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl resize-none',
            'text-slate-900 dark:text-[#e8edf5]',
            'transition-all duration-150',
            'disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed',
            error && 'erp-invalid',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        {helper && !error && <p className="text-xs text-slate-500 dark:text-slate-400">{helper}</p>}
      </div>
    );
  }
);

PremiumTextarea.displayName = 'PremiumTextarea';
