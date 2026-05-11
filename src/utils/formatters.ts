export function formatCurrency(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function formatNumber(num: number): string {
  return num.toLocaleString('en-IN');
}

export function generateShortcutsHelp(): { key: string; action: string }[] {
  return [
    { key: 'Alt+1', action: 'Dashboard' },
    { key: 'Alt+2', action: 'Parties' },
    { key: 'Alt+3', action: 'Suppliers' },
    { key: 'Alt+4', action: 'Ledger/Khata' },
    { key: 'Alt+5', action: 'Billing' },
    { key: 'Alt+6', action: 'Inventory' },
    { key: 'Alt+7', action: 'Purchases' },
    { key: 'Alt+8', action: 'Payments' },
    { key: 'Alt+9', action: 'Reports' },
    { key: 'Alt+0', action: 'Settings' },
    { key: 'Ctrl+N', action: 'New Entry' },
    { key: 'Ctrl+S', action: 'Save' },
    { key: 'Ctrl+P', action: 'Print' },
    { key: 'Ctrl+F', action: 'Search' },
    { key: 'Esc', action: 'Close/Cancel' },
    { key: 'Ctrl+/', action: 'Shortcuts Help' },
  ];
}

export const INDIAN_FRUITS = [
  'કેળા (Banana)', 'સફરજન (Apple)', 'દ્રાક્ષ (Grapes)', 'નારંગી (Orange)',
  'કેરી (Mango)', 'નારીયેળ (Coconut)', 'પપૈયું (Papaya)', 'દાડમ (Pomegranate)',
  'ચિકુ (Chikoo)', 'લીંબુ (Lemon)', 'તરબૂચ (Watermelon)', 'કપૂસી (Muskmelon)',
  'લીચી (Lychee)', 'જામફળ (Guava)', 'અનાનસ (Pineapple)', 'સ્ટ્રોબેરી (Strawberry)',
  'નાસપતી (Pear)', 'આડુ (Peach)', 'ફાલસું (Falsa)', 'જાંબુ (Jamun)',
];

export const GUJARATI_NUMBERS: Record<string, string> = {
  '0': '૦', '1': '૧', '2': '૨', '3': '૩', '4': '૪',
  '5': '૫', '6': '૬', '7': '૭', '8': '૮', '9': '૯',
};

export function toGujaratiNumbers(text: string): string {
  return text.replace(/[0-9]/g, (d) => GUJARATI_NUMBERS[d] || d);
}
