import { useEffect } from 'react';

export type ShortcutAction =
  | 'save'
  | 'search'
  | 'new-entry'
  | 'delete-row'
  | 'insert-row'
  | 'escape'
  | 'toggle-command-palette';

export interface ShortcutDefinition {
  id: string;
  combo: string;
  description: string;
  action?: ShortcutAction;
  handler?: (event: KeyboardEvent) => void;
  allowInInput?: boolean;
  preventDefault?: boolean;
  group?: string;
}

export interface CommandDefinition {
  id: string;
  title: string;
  subtitle?: string;
  shortcut?: string;
  group?: string;
  run: () => void;
}

type ActionListener = (event: KeyboardEvent | null) => void;

const shortcuts = new Map<string, ShortcutDefinition>();
const actionListeners = new Map<ShortcutAction, Set<ActionListener>>();
const commands = new Map<string, CommandDefinition>();

const NORMALIZED_CTRL = /control/g;

function normalizeCombo(combo: string): string {
  return combo
    .toLowerCase()
    .replace(NORMALIZED_CTRL, 'ctrl')
    .replace(/\s+/g, '')
    .split('+')
    .filter(Boolean)
    .sort((a, b) => {
      const order = ['ctrl', 'meta', 'alt', 'shift'];
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    })
    .join('+');
}

function keyName(event: KeyboardEvent): string {
  if (event.key === ' ') return 'space';
  if (event.key === 'Escape') return 'escape';
  if (event.key === 'ArrowUp') return 'arrowup';
  if (event.key === 'ArrowDown') return 'arrowdown';
  if (event.key === 'ArrowLeft') return 'arrowleft';
  if (event.key === 'ArrowRight') return 'arrowright';
  return event.key.toLowerCase();
}

function eventToCombo(event: KeyboardEvent): string {
  const parts: string[] = [];
  if (event.ctrlKey) parts.push('ctrl');
  if (event.metaKey) parts.push('meta');
  if (event.altKey) parts.push('alt');
  if (event.shiftKey) parts.push('shift');
  parts.push(keyName(event));
  return normalizeCombo(parts.join('+'));
}

function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;

  if (el.closest('[data-kb-nav="off"]')) return true;

  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;

  if ((el as HTMLElement).isContentEditable) return true;

  return Boolean(el.closest('[contenteditable="true"]'));
}

export function registerShortcut(definition: ShortcutDefinition): () => void {
  shortcuts.set(definition.id, definition);
  return () => shortcuts.delete(definition.id);
}

export function listRegisteredShortcuts(): ShortcutDefinition[] {
  return [...shortcuts.values()].sort((a, b) => a.combo.localeCompare(b.combo));
}

export function subscribeShortcutAction(action: ShortcutAction, listener: ActionListener): () => void {
  const listeners = actionListeners.get(action) ?? new Set<ActionListener>();
  listeners.add(listener);
  actionListeners.set(action, listeners);

  return () => {
    const current = actionListeners.get(action);
    if (!current) return;
    current.delete(listener);
    if (current.size === 0) {
      actionListeners.delete(action);
    }
  };
}

export function emitShortcutAction(action: ShortcutAction, event: KeyboardEvent | null = null): void {
  const listeners = actionListeners.get(action);
  if (!listeners) return;
  listeners.forEach((listener) => listener(event));
}

export function registerCommand(command: CommandDefinition): () => void {
  commands.set(command.id, command);
  return () => commands.delete(command.id);
}

export function listCommands(): CommandDefinition[] {
  return [...commands.values()].sort((a, b) => a.title.localeCompare(b.title));
}

export function useShortcutAction(action: ShortcutAction, handler: ActionListener): void {
  useEffect(() => subscribeShortcutAction(action, handler), [action, handler]);
}

export function useRegisterShortcut(definition: ShortcutDefinition): void {
  useEffect(() => registerShortcut(definition), [definition]);
}

export function useRegisterCommand(command: CommandDefinition): void {
  useEffect(() => registerCommand(command), [command]);
}

export function handleGlobalKeyboardEvent(event: KeyboardEvent): boolean {
  const combo = eventToCombo(event);
  const editable = isEditableTarget(event.target);

  for (const shortcut of shortcuts.values()) {
    if (normalizeCombo(shortcut.combo) !== combo) continue;
    if (editable && !shortcut.allowInInput) continue;

    if (shortcut.preventDefault !== false) {
      event.preventDefault();
    }

    shortcut.handler?.(event);
    if (shortcut.action) {
      emitShortcutAction(shortcut.action, event);
    }

    return true;
  }

  if (event.key === 'Escape') {
    emitShortcutAction('escape', event);
  }

  return false;
}
