import { integer, real, sqliteTable, text, index } from 'drizzle-orm/sqlite-core';

const timestamps = {
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
};

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  username: text('username').notNull().unique(),
  role: text('role').notNull(),
  passwordHash: text('password_hash').notNull().default(''),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  ...timestamps,
});

export const settings = sqliteTable('settings', {
  id: text('id').primaryKey(),
  businessName: text('business_name').notNull(),
  businessAddress: text('business_address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  gstin: text('gstin').notNull(),
  commissionPercent: real('commission_percent').notNull(),
  taxPercent: real('tax_percent').notNull(),
  currency: text('currency').notNull(),
  billPrefix: text('bill_prefix').notNull(),
  purchasePrefix: text('purchase_prefix').notNull(),
  vehiclePrefix: text('vehicle_prefix').notNull(),
  nextBillNo: integer('next_bill_no').notNull(),
  nextPurchaseNo: integer('next_purchase_no').notNull(),
  nextVehicleEntryNo: integer('next_vehicle_entry_no').notNull(),
  language: text('language').notNull(),
  darkMode: integer('dark_mode', { mode: 'boolean' }).notNull().default(false),
  lowStockAlert: integer('low_stock_alert', { mode: 'boolean' }).notNull().default(true),
  ...timestamps,
});

export const parties = sqliteTable('parties', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  gstin: text('gstin').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  openingBalance: real('opening_balance').notNull().default(0),
  balanceType: text('balance_type').notNull(),
  isSupplier: integer('is_supplier', { mode: 'boolean' }).notNull().default(false),
  commissionPercent: real('commission_percent').notNull().default(0),
  notes: text('notes').notNull().default(''),
  ...timestamps,
}, (table) => ({
  partiesNameIndex: index('idx_parties_name').on(table.name),
  partiesPhoneIndex: index('idx_parties_phone').on(table.phone),
}));

export const suppliers = sqliteTable('suppliers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  openingBalance: real('opening_balance').notNull().default(0),
  balanceType: text('balance_type').notNull(),
  commissionPercent: real('commission_percent').notNull().default(0),
  notes: text('notes').notNull().default(''),
  ...timestamps,
}, (table) => ({
  suppliersNameIndex: index('idx_suppliers_name').on(table.name),
  suppliersPhoneIndex: index('idx_suppliers_phone').on(table.phone),
}));

export const ledgerEntries = sqliteTable('ledger_entries', {
  id: text('id').primaryKey(),
  partyId: text('party_id').notNull().references(() => parties.id, { onDelete: 'cascade' }),
  partyName: text('party_name').notNull(),
  date: text('date').notNull(),
  type: text('type').notNull(),
  amount: real('amount').notNull(),
  description: text('description').notNull(),
  referenceType: text('reference_type').notNull(),
  referenceId: text('reference_id').notNull(),
  runningBalance: real('running_balance').notNull().default(0),
  ...timestamps,
}, (table) => ({
  ledgerPartyDateIndex: index('idx_ledger_party_date').on(table.partyId, table.date),
}));

export const inventoryItems = sqliteTable('inventory_items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  grade: text('grade').notNull(),
  category: text('category').notNull(),
  currentStock: real('current_stock').notNull().default(0),
  unit: text('unit').notNull(),
  lowStockThreshold: real('low_stock_threshold').notNull().default(0),
  status: text('status').notNull(),
  warehouse: text('warehouse').notNull(),
  lastUpdated: text('last_updated').notNull(),
  ...timestamps,
}, (table) => ({
  inventoryNameGradeIndex: index('idx_inventory_name_grade').on(table.name, table.grade),
  inventoryStatusIndex: index('idx_inventory_status').on(table.status),
}));

export const inventoryTransactions = sqliteTable('inventory_transactions', {
  id: text('id').primaryKey(),
  itemId: text('item_id').notNull().references(() => inventoryItems.id, { onDelete: 'cascade' }),
  itemName: text('item_name').notNull(),
  type: text('type').notNull(),
  quantity: real('quantity').notNull(),
  rate: real('rate').notNull(),
  referenceType: text('reference_type').notNull(),
  referenceId: text('reference_id').notNull(),
  date: text('date').notNull(),
  notes: text('notes').notNull().default(''),
  ...timestamps,
}, (table) => ({
  inventoryTxnItemDateIndex: index('idx_inventory_txn_item_date').on(table.itemId, table.date),
  inventoryTxnRefIndex: index('idx_inventory_txn_ref').on(table.referenceType, table.referenceId),
}));

export const bills = sqliteTable('bills', {
  id: text('id').primaryKey(),
  billNo: text('bill_no').notNull().unique(),
  date: text('date').notNull(),
  partyId: text('party_id').notNull().references(() => parties.id, { onDelete: 'restrict' }),
  partyName: text('party_name').notNull(),
  subtotal: real('subtotal').notNull(),
  commission: real('commission').notNull(),
  taxAmount: real('tax_amount').notNull(),
  taxPercent: real('tax_percent').notNull(),
  total: real('total').notNull(),
  previousBalance: real('previous_balance').notNull(),
  paidAmount: real('paid_amount').notNull(),
  netBalance: real('net_balance').notNull(),
  notes: text('notes').notNull().default(''),
  status: text('status').notNull(),
  ...timestamps,
}, (table) => ({
  billsDateIndex: index('idx_bills_date').on(table.date),
  billsPartyIndex: index('idx_bills_party').on(table.partyId),
}));

export const billItems = sqliteTable('bill_items', {
  id: text('id').primaryKey(),
  billId: text('bill_id').notNull().references(() => bills.id, { onDelete: 'cascade' }),
  fruitName: text('fruit_name').notNull(),
  grade: text('grade').notNull(),
  boxCount: real('box_count').notNull(),
  weightPerBox: real('weight_per_box').notNull(),
  totalWeight: real('total_weight').notNull(),
  rate: real('rate').notNull(),
  amount: real('amount').notNull(),
  lotNo: text('lot_no').notNull().default(''),
  ...timestamps,
}, (table) => ({
  billItemsBillIndex: index('idx_bill_items_bill').on(table.billId),
}));

export const purchases = sqliteTable('purchases', {
  id: text('id').primaryKey(),
  purchaseNo: text('purchase_no').notNull().unique(),
  date: text('date').notNull(),
  supplierId: text('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'restrict' }),
  supplierName: text('supplier_name').notNull(),
  subtotal: real('subtotal').notNull(),
  taxAmount: real('tax_amount').notNull(),
  total: real('total').notNull(),
  paidAmount: real('paid_amount').notNull(),
  netBalance: real('net_balance').notNull(),
  notes: text('notes').notNull().default(''),
  status: text('status').notNull(),
  ...timestamps,
}, (table) => ({
  purchasesDateIndex: index('idx_purchases_date').on(table.date),
  purchasesSupplierIndex: index('idx_purchases_supplier').on(table.supplierId),
}));

export const purchaseItems = sqliteTable('purchase_items', {
  id: text('id').primaryKey(),
  purchaseId: text('purchase_id').notNull().references(() => purchases.id, { onDelete: 'cascade' }),
  fruitName: text('fruit_name').notNull(),
  grade: text('grade').notNull(),
  quantity: real('quantity').notNull(),
  unit: text('unit').notNull(),
  rate: real('rate').notNull(),
  amount: real('amount').notNull(),
  lotNo: text('lot_no').notNull().default(''),
  ...timestamps,
}, (table) => ({
  purchaseItemsPurchaseIndex: index('idx_purchase_items_purchase').on(table.purchaseId),
}));

export const payments = sqliteTable('payments', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  partyId: text('party_id').notNull().references(() => parties.id, { onDelete: 'restrict' }),
  partyName: text('party_name').notNull(),
  amount: real('amount').notNull(),
  mode: text('mode').notNull(),
  type: text('type').notNull(),
  referenceNo: text('reference_no').notNull().default(''),
  notes: text('notes').notNull().default(''),
  ledgerEntryId: text('ledger_entry_id').notNull().default(''),
  ...timestamps,
}, (table) => ({
  paymentsDateIndex: index('idx_payments_date').on(table.date),
  paymentsPartyIndex: index('idx_payments_party').on(table.partyId),
}));

export const vehicleRegisters = sqliteTable('vehicle_registers', {
  id: text('id').primaryKey(),
  entryNo: text('entry_no').notNull().unique(),
  date: text('date').notNull(),
  vehicleNumber: text('vehicle_number').notNull(),
  driverName: text('driver_name').notNull(),
  status: text('status').notNull(),
  totalRows: integer('total_rows').notNull(),
  totalWeight: real('total_weight').notNull(),
  grandTotal: real('grand_total').notNull(),
  pendingAmount: real('pending_amount').notNull(),
  outstandingBalance: real('outstanding_balance').notNull(),
  notes: text('notes').notNull().default(''),
  ...timestamps,
}, (table) => ({
  vehicleDateIndex: index('idx_vehicle_register_date').on(table.date),
}));

export const vehicleRegisterRows = sqliteTable('vehicle_register_rows', {
  id: text('id').primaryKey(),
  vehicleRegisterId: text('vehicle_register_id').notNull().references(() => vehicleRegisters.id, { onDelete: 'cascade' }),
  partyId: text('party_id').references(() => parties.id, { onDelete: 'set null' }),
  partyName: text('party_name').notNull(),
  vakkal: text('vakkal').notNull(),
  carat: real('carat').notNull(),
  weight: real('weight').notNull(),
  rate: real('rate').notNull(),
  total: real('total').notNull(),
  remarks: text('remarks').notNull().default(''),
  inventoryItemId: text('inventory_item_id').references(() => inventoryItems.id, { onDelete: 'set null' }),
  ...timestamps,
}, (table) => ({
  vehicleRowsRegisterIndex: index('idx_vehicle_rows_register').on(table.vehicleRegisterId),
  vehicleRowsPartyIndex: index('idx_vehicle_rows_party').on(table.partyId),
  vehicleRowsInventoryIndex: index('idx_vehicle_rows_inventory').on(table.inventoryItemId),
}));