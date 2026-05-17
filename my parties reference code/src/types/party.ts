export type PartyType = 'customer' | 'vendor' | 'both';
export type PartyStatus = 'active' | 'inactive' | 'pending';
export type PaymentTerms = 'net15' | 'net30' | 'net45' | 'net60' | 'immediate' | 'custom';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'INR' | 'AED' | 'SGD';

export interface Address {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Party {
  id: string;
  code: string;
  name: string;
  type: PartyType;
  status: PartyStatus;
  email: string;
  phone: string;
  website: string;
  contactPerson: string;
  designation: string;
  address: Address;
  currency: Currency;
  creditLimit: number;
  paymentTerms: PaymentTerms;
  taxId: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  balance: number;
  totalOrders: number;
  avatarColor: string;
}

export interface NewPartyForm {
  // Basic Information
  name: string;
  code: string;
  type: PartyType | '';
  status: PartyStatus;
  email: string;
  phone: string;
  website: string;
  contactPerson: string;
  designation: string;
  // Address
  address: Address;
  // Financial
  currency: Currency;
  creditLimit: string;
  paymentTerms: PaymentTerms | '';
  taxId: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  // Notes
  notes: string;
  tags: string;
}

export const INITIAL_FORM: NewPartyForm = {
  name: '',
  code: '',
  type: '',
  status: 'active',
  email: '',
  phone: '',
  website: '',
  contactPerson: '',
  designation: '',
  address: {
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  },
  currency: 'USD',
  creditLimit: '',
  paymentTerms: '',
  taxId: '',
  bankName: '',
  accountNumber: '',
  ifsc: '',
  notes: '',
  tags: '',
};
