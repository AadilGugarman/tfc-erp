# Premium ERP Implementation Guide — Phase 8-9

## Overview
This document outlines all the premium components created and provides integration patterns for existing pages.

## Components Created (Phase 8-9)

### 1. **PremiumLayout.tsx** (Updated)
**Purpose**: Premium modal, page layout, and section containers

**Components**:
- `PremiumModal`: Reusable modal with backdrop, header, content, footer
- `PageLayout`: Page header with title, subtitle, actions
- `Section`: Content section container with optional header

**Usage**:
```tsx
import { PremiumModal, PageLayout, Section } from '@/components';

// Modal
<PremiumModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Add Payment"
  size="md"
  footer={<Button onClick={handleSave}>Save</Button>}
>
  {/* Modal content */}
</PremiumModal>

// Page Layout
<PageLayout
  title="Payments"
  subtitle="Manage incoming and outgoing payments"
  actions={<Button>Add Payment</Button>}
>
  {/* Page content */}
</PageLayout>

// Section
<Section title="Payment Details">
  {/* Form or content */}
</Section>
```

### 2. **PageTransition.tsx** (New)
**Purpose**: Smooth page transition animations

**Components**:
- `PageTransition`: Single child animation wrapper
- `PageTransitionGroup`: Multi-child animation wrapper

**Usage**:
```tsx
import { PageTransition } from '@/components';

<PageTransition variant="fade">
  {/* Page content */}
</PageTransition>
```

### 3. **Toast.tsx** (New)
**Purpose**: Toast/notification system for success, error, info, warning messages

**Components**:
- `Toast`: Individual toast notification
- `ToastContainer`: Container for all toasts
- `useToast()`: Hook for toast management

**Usage**:
```tsx
import { useToast, ToastContainer } from '@/components';

export function PaymentsPage() {
  const { toasts, removeToast, success, error } = useToast();

  const handleSave = async () => {
    try {
      // Save logic
      success('Payment created', 'Payment saved successfully');
    } catch (err) {
      error('Failed to create payment', err.message);
    }
  };

  return (
    <>
      {/* Page content */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
```

### 4. **useResponsive.ts** (New)
**Purpose**: Responsive design utilities and hooks

**Hooks**:
- `useBreakpoint(bp)`: Check if screen is at or above breakpoint
- `useIsMobile()`: Check if mobile (< md)
- `useIsTablet()`: Check if tablet (md-lg)
- `useIsDesktop()`: Check if desktop (>= lg)
- `useScreenSize()`: Get current screen size

**Components**:
- `Responsive`: Show/hide elements based on breakpoint

**Usage**:
```tsx
import { useIsMobile, useResponsive } from '@/hooks/useResponsive';

export function ResponsiveLayout() {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {!isMobile && <Sidebar />}
      <MainContent />
    </div>
  );
}
```

### 5. **Button.tsx** (Updated)
**Purpose**: Enhanced button component with new variants and sizes

**Variants**: primary, secondary, destructive, ghost, outline, soft
**Sizes**: xs, sm, md, lg
**Props**: 
- `icon`: Optional icon element
- `fullWidth`: Make button full width
- `loading`: Show loading spinner

**Usage**:
```tsx
import { Button } from '@/components';

<Button variant="primary" size="md" icon={<Plus size={16} />}>
  Add Payment
</Button>

<Button variant="soft" fullWidth>
  Cancel
</Button>
```

### 6. **Tailwind Config** (Updated)
**New Animations Added**:
- `fadeIn` / `fadeOut`: Opacity transitions
- `slideUp` / `slideDown` / `slideLeft` / `slideRight`: Position transitions
- `scaleIn`: Scale + opacity
- `pulseSubtle`: Subtle pulsing
- `shimmer`: Loading shimmer effect
- `bounceSubtle`: Subtle bouncing

**New Color**:
- `slate-950`: Very dark slate

**New Shadows**:
- `soft`, `md-soft`, `lg-soft`, `xl-soft`: Subtle shadows

## Integration Roadmap

### Phase 1: Form Integration (Next)
Replace all `<input>`, `<select>`, `<textarea>` with premium variants across pages:

**Pages to Update**:
1. [Payments.tsx](src/pages/Payments.tsx) - Use `PremiumInput`, `PremiumSelect`, `PremiumModal`
2. [Ledger.tsx](src/pages/Ledger.tsx) - Use `PremiumInput`, `PremiumTextarea`
3. [Inventory.tsx](src/pages/Inventory.tsx) - Use `PremiumInput`, `PremiumSelect`
4. [Parties.tsx](src/pages/Parties.tsx) - Form component with `PremiumForm` elements
5. [Suppliers.tsx](src/pages/Suppliers.tsx) - Form component with `PremiumForm` elements
6. [VehicleArrivalRegister.tsx](src/pages/VehicleArrivalRegister.tsx) - Form and `PremiumTable`

**Pattern**:
```tsx
import { PageLayout, Section, PremiumInput, Button } from '@/components';

export function PaymentsPage() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  return (
    <PageLayout
      title="Create Payment"
      actions={<Button>Add Payment</Button>}
    >
      <Section title="Payment Details">
        <div className="space-y-4">
          <PremiumInput
            label="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={amount ? undefined : 'Amount is required'}
          />
          <PremiumInput
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </Section>
    </PageLayout>
  );
}
```

### Phase 2: Table Integration
Replace all table components with `PremiumTable`:

**Pages to Update**:
1. [VehicleArrivalRegister.tsx](src/pages/VehicleArrivalRegister.tsx)
2. [Parties.tsx](src/pages/Parties.tsx)
3. [Suppliers.tsx](src/pages/Suppliers.tsx)
4. [Ledger.tsx](src/pages/Ledger.tsx)
5. [Transactions.tsx](src/pages/Transactions.tsx)
6. [Inventory.tsx](src/pages/Inventory.tsx)
7. [Payments.tsx](src/pages/Payments.tsx)
8. [Billing.tsx](src/pages/Billing.tsx)
9. [Purchases.tsx](src/pages/Purchases.tsx)

**Pattern**:
```tsx
import { PremiumTable, PremiumTableHeader, PremiumTableRow, PremiumTableCell } from '@/components';

<div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
  <table className="w-full">
    <thead className="bg-slate-50 dark:bg-slate-900">
      <tr>
        <PremiumTableHeader>Reference No</PremiumTableHeader>
        <PremiumTableHeader>Amount</PremiumTableHeader>
        <PremiumTableHeader>Date</PremiumTableHeader>
        <PremiumTableHeader>Actions</PremiumTableHeader>
      </tr>
    </thead>
    <tbody>
      {payments.map((payment) => (
        <PremiumTableRow key={payment.id}>
          <PremiumTableCell>{payment.referenceNo}</PremiumTableCell>
          <PremiumTableCell numeric>{formatCurrency(payment.amount)}</PremiumTableCell>
          <PremiumTableCell>{formatDate(payment.date)}</PremiumTableCell>
          <PremiumTableCell>
            <Button size="sm" variant="ghost">Edit</Button>
          </PremiumTableCell>
        </PremiumTableRow>
      ))}
    </tbody>
  </table>
</div>
```

### Phase 3: Layout Standardization
- Wrap all pages with `PageLayout` component
- Use `Section` for content grouping
- Replace modals with `PremiumModal`
- Add `PageTransition` to pages

### Phase 4: Page Transitions
- Add fade-in animations to all page loads
- Integrate `SkeletonLoaders` during data fetching
- Add loading states to forms

### Phase 5: Mobile Responsiveness
- Test all components on mobile (< 768px)
- Use `useIsMobile()` hook for conditional rendering
- Ensure touch-friendly button sizes
- Collapse sidebar on mobile

### Phase 6: Error Handling
- Add error boundaries
- Integrate `useToast()` for errors/success messages
- Add validation feedback to forms

### Phase 7: Final Testing
- Dark/light mode consistency
- Keyboard navigation
- i18n across all new components
- Accessibility review

## Key CSS Classes to Use

### Colors (Indigo Theme)
- Primary: `from-indigo-600 to-indigo-700`
- Hover: `from-indigo-700 to-indigo-800`
- Soft: `bg-indigo-50 dark:bg-indigo-950/30`

### Borders
- Light: `border-slate-200 dark:border-slate-800`
- Darker: `border-slate-300 dark:border-slate-700`

### Backgrounds
- Cards: `bg-white dark:bg-slate-900/50`
- Hover: `hover:bg-slate-100 dark:hover:bg-slate-800/60`

### Animations
- Entry: `animate-fade-in` or `animate-slide-up`
- Exit: `animate-fade-out`

## Dependencies Summary
All new components use:
- React 18+ hooks
- Tailwind CSS v4
- Lucide React icons
- TypeScript
- Dark mode support via `dark:` classes

## Testing Checklist
- [ ] Dev server builds without errors
- [ ] All animations work smoothly
- [ ] Dark/light mode toggles correctly
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] All components accessible (focus states, ARIA labels)
- [ ] i18n keys complete for all new components
- [ ] Form validation working
- [ ] Toast notifications display correctly
- [ ] Page transitions smooth
- [ ] Keyboard navigation functional

## Next Immediate Tasks
1. Integrate `PremiumForm` components into Payments.tsx
2. Integrate `PremiumTable` into VehicleArrivalRegister.tsx
3. Update Payments.tsx with `PremiumModal`
4. Add `useToast()` to all pages
5. Wrap pages with `PageTransition`
6. Test responsive design on mobile
