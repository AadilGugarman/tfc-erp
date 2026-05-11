import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

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

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefix?: string;
  suffix?: string;
}

export function Input({ label, error, prefix, suffix, className, id, onKeyDown, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      {label && (
          <label htmlFor={inputId} className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[12px] select-none">{prefix}</span>
          )}
          <input
            id={inputId}
            aria-invalid={Boolean(error)}
            onKeyDown={(event) => {
              onKeyDown?.(event);
              if (event.defaultPrevented) return;
              handleDirectionalKey(event);
            }}
            className={cn(
              'w-full h-10 px-3 text-[13px] rounded-xl',
              'transition-all duration-150',
              prefix && 'pl-8',
              suffix && 'pr-10',
              error && 'erp-invalid',
              className
            )}
            {...props}
          />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none">{suffix}</span>
        )}
      </div>
      {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function TextArea({ label, error, className, id, onKeyDown, ...props }: TextAreaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        aria-invalid={Boolean(error)}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          handleDirectionalKey(event);
        }}
        className={cn(
          'w-full px-3 py-2.5 text-[13px] rounded-xl min-h-[96px] resize-y',
          'transition-all duration-150',
          error && 'erp-invalid',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

interface SelectProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  searchable?: boolean;
}

export function Select({ label, options, error, className, id, value = '', onChange, searchable = true, onBlur, name, ...props }: SelectProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
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
    <div className="space-y-1.5" data-kb-nav="off">
      {label && (
        <label htmlFor={inputId} className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
          {label}
        </label>
      )}

      <div ref={containerRef} className="relative">
        <input
          id={inputId}
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
          onBlur={(event) => onBlur?.(event)}
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
            if (event.key === 'Tab' && open && filtered[activeIndex]) {
              commitValue(filtered[activeIndex].value);
            }
          }}
          className={cn(
            'w-full h-10 px-3 text-[13px] rounded-xl transition-all duration-150 pr-10',
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
                  type="button"
                  key={option.value || `option-${index}`}
                  onClick={() => commitValue(option.value)}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm transition-colors',
                    index === activeIndex
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  )}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}
