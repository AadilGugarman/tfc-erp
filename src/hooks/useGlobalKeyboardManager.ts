import { useEffect, useState } from 'react';
import type { PageId } from '@/stores/useAppStore';
import {
  emitShortcutAction,
  handleGlobalKeyboardEvent,
  registerCommand,
  registerShortcut,
  subscribeShortcutAction,
} from '@/keyboard/shortcutManager';

interface Options {
  setCurrentPage: (page: PageId) => void;
}

export function useGlobalKeyboardManager({ setCurrentPage }: Options) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const unregisterShortcuts = [
      registerShortcut({ id: 'nav-dashboard', combo: 'Alt+1', description: 'Go to Dashboard', handler: () => setCurrentPage('dashboard'), group: 'Navigation' }),
      registerShortcut({ id: 'nav-vehicle', combo: 'Alt+V', description: 'Go to Vehicle Register', handler: () => setCurrentPage('vehicle-register'), group: 'Navigation' }),
      registerShortcut({ id: 'nav-billing', combo: 'Alt+B', description: 'Go to Billing', handler: () => setCurrentPage('billing'), group: 'Navigation' }),
      registerShortcut({ id: 'nav-purchases', combo: 'Alt+P', description: 'Go to Purchases', handler: () => setCurrentPage('purchases'), group: 'Navigation' }),
      registerShortcut({ id: 'nav-parties', combo: 'Alt+2', description: 'Go to Parties', handler: () => setCurrentPage('parties'), group: 'Navigation' }),
      registerShortcut({ id: 'nav-suppliers', combo: 'Alt+3', description: 'Go to Suppliers', handler: () => setCurrentPage('suppliers'), group: 'Navigation' }),
      registerShortcut({ id: 'nav-ledger', combo: 'Alt+4', description: 'Go to Ledger', handler: () => setCurrentPage('ledger'), group: 'Navigation' }),
      registerShortcut({ id: 'nav-transactions', combo: 'Alt+5', description: 'Go to Sales/Purchase', handler: () => setCurrentPage('transactions'), group: 'Navigation' }),
      registerShortcut({ id: 'nav-inventory', combo: 'Alt+6', description: 'Go to Inventory', handler: () => setCurrentPage('inventory'), group: 'Navigation' }),
      registerShortcut({ id: 'nav-payments', combo: 'Alt+7', description: 'Go to Payments', handler: () => setCurrentPage('payments'), group: 'Navigation' }),
      registerShortcut({ id: 'nav-reports', combo: 'Alt+8', description: 'Go to Reports', handler: () => setCurrentPage('reports'), group: 'Navigation' }),
      registerShortcut({ id: 'nav-settings', combo: 'Alt+9', description: 'Go to Settings', handler: () => setCurrentPage('settings'), group: 'Navigation' }),
      registerShortcut({ id: 'open-search', combo: 'Ctrl+F', description: 'Open Search', handler: () => setCurrentPage('search'), allowInInput: true, group: 'Global' }),
      registerShortcut({ id: 'save-action', combo: 'Ctrl+S', description: 'Save current entry', action: 'save', allowInInput: true, group: 'Global' }),
      registerShortcut({ id: 'new-action', combo: 'Ctrl+N', description: 'Create new entry', action: 'new-entry', allowInInput: true, group: 'Global' }),
      registerShortcut({ id: 'delete-row-action', combo: 'Delete', description: 'Delete selected row', action: 'delete-row', allowInInput: true, group: 'Grid' }),
      registerShortcut({ id: 'insert-row-action', combo: 'Insert', description: 'Insert a new row', action: 'insert-row', allowInInput: true, group: 'Grid' }),
      registerShortcut({ id: 'palette-toggle', combo: 'Ctrl+K', description: 'Open command palette', action: 'toggle-command-palette', allowInInput: true, group: 'Global' }),
    ];

    const unregisterCommands = [
      registerCommand({ id: 'command-new-entry', title: 'New Entry', subtitle: 'Trigger new entry workflow', shortcut: 'Ctrl+N', group: 'Actions', run: () => emitShortcutAction('new-entry') }),
      registerCommand({ id: 'command-save', title: 'Save', subtitle: 'Save current record', shortcut: 'Ctrl+S', group: 'Actions', run: () => emitShortcutAction('save') }),
      registerCommand({ id: 'command-search', title: 'Search', subtitle: 'Open search page', shortcut: 'Ctrl+F', group: 'Actions', run: () => setCurrentPage('search') }),
    ];

    const onKeydown = (event: KeyboardEvent) => {
      handleGlobalKeyboardEvent(event);
    };

    const unregisterPalette = subscribeShortcutAction('toggle-command-palette', () => {
      setCommandPaletteOpen((prev) => !prev);
    });

    document.addEventListener('keydown', onKeydown);

    return () => {
      document.removeEventListener('keydown', onKeydown);
      unregisterPalette();
      unregisterShortcuts.forEach((unregister) => unregister());
      unregisterCommands.forEach((unregister) => unregister());
    };
  }, [setCurrentPage]);

  return {
    commandPaletteOpen,
    openCommandPalette: () => setCommandPaletteOpen(true),
    closeCommandPalette: () => setCommandPaletteOpen(false),
  };
}
