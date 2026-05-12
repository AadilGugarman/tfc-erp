# Creating Invoices in TFC ERP

## Overview
The TFC ERP application now has a unified "Sales & Purchase" page that displays all sales (bills) and purchase transactions. This guide explains how to create invoices (bills and purchase orders).

## Accessing the Sales & Purchase Page

1. From the main dashboard, click on **"Sales/Purchase"** in the left sidebar
2. Or use the keyboard shortcut **Alt+5**

## Current Features

### Viewing Transactions
The Sales & Purchase page displays:
- **Sales Bills**: All created sales/invoice transactions
- **Purchase Orders**: All created purchase transactions
- Filters by transaction type (all, sales only, purchases only)
- Search by transaction number or party name
- Date range filtering
- Summary totals (total sales, total purchases, pending amounts)

### Transaction Information Displayed
For each transaction:
- Transaction number (Bill No / PO No)
- Date
- Party name (Customer or Supplier)
- Total amount
- Paid amount
- Outstanding balance
- Payment status (Paid / Partial / Unpaid)
- Print option for each transaction

## Creating Invoices (Future Enhancement)

The invoice creation interface will be accessible from:
1. **Quick Actions** on the Dashboard (when restored)
2. **Direct navigation button** on the Sales & Purchase page (to be added)
3. **Alt+N keyboard shortcut** for new entry

### Bill (Sales Invoice) Creation
To create a sales bill, you will need to:
1. Select a customer/party
2. Add line items with:
   - Fruit name
   - Grade
   - Number of boxes
   - Weight per box
   - Rate per unit
3. System automatically calculates:
   - Total weight
   - Item amount
   - Commission (deducted)
   - Tax (added)
   - Net total
4. Record advance payment (optional)
5. Save and generate invoice

### Purchase Order Creation
To create a purchase order, you will need to:
1. Select a supplier
2. Add line items with:
   - Fruit name
   - Grade
   - Quantity
   - Unit
   - Rate
3. System automatically calculates:
   - Item amount
   - Total
4. Record advance payment (optional)
5. Save and generate PO

## Printing & Sharing

From the Sales & Purchase page, you can:
- **Print**: Opens print dialog to print or save as PDF
- **Download**: Save transaction as PDF
- **WhatsApp**: Share transaction summary via WhatsApp (when implemented)

## Database Schema

### Bill Interface
```typescript
interface Bill {
  id: string;
  billNo: string;              // Auto-generated bill number
  date: string;                 // Bill date
  partyId: string;              // Reference to customer
  partyName: string;            // Customer name
  items: BillItem[];            // Array of line items
  subtotal: number;             // Sum of all item amounts
  commission: number;           // Deducted commission
  taxAmount: number;            // Added tax
  taxPercent: number;           // Tax percentage used
  total: number;                // Final amount
  previousBalance: number;      // Customer's prior balance
  paidAmount: number;           // Amount paid upfront
  netBalance: number;           // Outstanding balance
  notes: string;                // Additional notes
  status: 'paid' | 'partial' | 'unpaid';  // Payment status
  createdAt: string;
  updatedAt: string;
}
```

### BillItem Interface
```typescript
interface BillItem {
  id: string;
  fruitName: string;           // Type of fruit
  grade: string;               // Quality grade (A, B, C, etc)
  boxCount: number;            // Number of boxes
  weightPerBox: number;        // Weight of each box (in kg)
  totalWeight: number;         // boxCount * weightPerBox
  rate: number;                // Price per unit weight
  amount: number;              // totalWeight * rate
  lotNo: string;               // Batch/lot reference number
}
```

### Purchase Interface
Similar to Bill but for purchases from suppliers, with supplier information instead of customer.

## API Integration

The invoices are stored and managed through:
- **Frontend**: React components in `src/pages/SalesAndPurchase.tsx`
- **State Management**: Zustand store in `src/stores/useAppStore.ts`
- **Backend Simulation**: `src/db/db.ts` with localStorage persistence
- **Types**: Defined in `src/db/schema.ts`

## Features Status

✅ **Implemented**
- View all sales and purchase transactions
- Filter by type, search, and date range
- Display comprehensive transaction details
- Print transactions

🚧 **In Progress / Planned**
- Create new bills with full invoice generation
- Create new purchase orders
- Edit existing transactions
- Delete transactions
- Advanced reporting and analytics

## Troubleshooting

### No transactions appear
- Ensure you have created parties/suppliers first
- Check that the database is properly initialized
- Try refreshing the page (F5)

### Print not working
- Ensure pop-ups are not blocked by your browser
- Try the PDF download option instead

### Data not saving
- Check browser's localStorage is enabled
- Clear cache if you see stale data
- Check browser console for errors (F12)

## Related Pages

- **Parties**: Manage customers
- **Suppliers**: Manage vendors
- **Ledger**: View account transactions
- **Payments**: Track payment records
- **Reports**: Generate business reports

## Keyboard Shortcuts

- **Alt+5**: Go to Sales & Purchase page
- **Alt+K**: Open Command Palette (to search features)
- **F5**: Refresh page
- **Ctrl+P**: Print current page
