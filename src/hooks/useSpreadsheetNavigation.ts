import { useCallback, useMemo, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

export interface CellPosition {
  row: number;
  col: number;
}

interface Options {
  rowCount: number;
  colCount: number;
  onAddRow?: () => void;
  onDeleteRow?: (row: number) => void;
}

export function useSpreadsheetNavigation({ rowCount, colCount, onAddRow, onDeleteRow }: Options) {
  const [activeCell, setActiveCell] = useState<CellPosition>({ row: 0, col: 0 });

  const moveTo = useCallback((row: number, col: number) => {
    setActiveCell({
      row: Math.max(0, Math.min(row, Math.max(0, rowCount - 1))),
      col: Math.max(0, Math.min(col, Math.max(0, colCount - 1))),
    });
  }, [rowCount, colCount]);

  const onCellKeyDown = useCallback((event: ReactKeyboardEvent, row: number, col: number) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveTo(row, col + 1);
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveTo(row, col - 1);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveTo(row + 1, col);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveTo(row - 1, col);
      return;
    }

    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();

      const backwards = event.shiftKey;
      const atFirstCell = row === 0 && col === 0;
      const atLastCell = row === rowCount - 1 && col === colCount - 1;

      if (!backwards && atLastCell) {
        setActiveCell({ row: row + 1, col: 0 });
        onAddRow?.();
        return;
      }

      if (backwards && atFirstCell) {
        moveTo(0, 0);
        return;
      }

      if (backwards) {
        if (col === 0) {
          moveTo(row - 1, colCount - 1);
        } else {
          moveTo(row, col - 1);
        }
      } else {
        if (col === colCount - 1) {
          moveTo(row + 1, 0);
        } else {
          moveTo(row, col + 1);
        }
      }
      return;
    }

    if (event.key === 'Delete' && onDeleteRow) {
      event.preventDefault();
      onDeleteRow(row);
      return;
    }

    if (event.key === 'Insert' && onAddRow) {
      event.preventDefault();
      onAddRow();
    }
  }, [colCount, moveTo, onAddRow, onDeleteRow, rowCount]);

  const isActiveCell = useCallback((row: number, col: number) => {
    return activeCell.row === row && activeCell.col === col;
  }, [activeCell]);

  const api = useMemo(() => ({
    activeCell,
    setActiveCell: moveTo,
    onCellKeyDown,
    isActiveCell,
  }), [activeCell, moveTo, onCellKeyDown, isActiveCell]);

  return api;
}
