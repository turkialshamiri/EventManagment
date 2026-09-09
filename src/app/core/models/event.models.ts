export type EventStatus =
  | 'draft'
  | 'tentative'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type CustomerCategory =
  | 'family'
  | 'corporate'
  | 'government'
  | 'bank'
  | 'education'
  | 'automotive'
  | 'vip';

export type AlertSeverity = 'critical' | 'warning' | 'info';

export type TimelineTaskStatus = 'completed' | 'in_progress' | 'scheduled';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  category: CustomerCategory;
  isVip?: boolean;
  company?: string;
}

export interface EventType {
  id: string;
  code: string;
  name: string;
  icon: string;
  description?: string;
  active: boolean;
  displayOrder: number;
}

export interface EventTypeWritePayload {
  code: string;
  name: string;
  description: string;
  active: boolean;
  displayOrder: number;
  icon: string;
}

export interface VenueSetup {
  id: string;
  name: string;
  capacity: number;
}

export interface Venue {
  id: string;
  code: string;
  name: string;
  description?: string;
  floor?: string;
  capacity: number;
  setups: VenueSetup[];
  imageUrl?: string;
  active: boolean;
}

export interface VenueWritePayload {
  code: string;
  name: string;
  description: string;
  floor: string;
  capacity: number;
  active: boolean;
  imageUrl: string;
  setups: Array<{
    name: string;
    capacity: number;
  }>;
}

/** Catalog of common hotel setup types for venue configuration */
export const VENUE_SETUP_CATALOG: ReadonlyArray<{ id: string; name: string }> = [
  { id: 'setup-theater', name: 'مسرحي' },
  { id: 'setup-classroom', name: 'صفوف دراسية' },
  { id: 'setup-u', name: 'شكل U' },
  { id: 'setup-board', name: 'طاولة اجتماعات' },
  { id: 'setup-banquet', name: 'مأدبة' },
  { id: 'setup-cocktail', name: 'كوكتيل' },
  { id: 'setup-lounge', name: 'صالة استقبال' },
  { id: 'setup-outdoor', name: 'خارجي مفتوح' },
];

export interface PackageItem {
  id: string;
  name: string;
  quantity: number | string;
  unitPrice: number;
  included: boolean;
  gift?: boolean;
}

export interface EventPackage {
  id: string;
  code: string;
  name: string;
  description?: string;
  /** مدة الباقة بالساعات */
  durationHours: number;
  basePrice: number;
  items: PackageItem[];
  active: boolean;
}

export interface PackageWritePayload {
  code: string;
  name: string;
  description: string;
  durationHours: number;
  active: boolean;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export function calcPackageItemTotal(item: Pick<PackageItem, 'quantity' | 'unitPrice'>): number {
  const qty = typeof item.quantity === 'number' ? item.quantity : 0;
  return qty * item.unitPrice;
}

export function calcPackageTotal(
  items: Array<Pick<PackageItem, 'quantity' | 'unitPrice'>>
): number {
  return items.reduce((sum, item) => sum + calcPackageItemTotal(item), 0);
}

export interface EventItemLine {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  included?: boolean;
  gift?: boolean;
}

export interface ReservationBlock {
  id: string;
  roomName: string;
  roomNumber?: string;
  guestName?: string;
  nights: number;
  status: string;
  note?: string;
}

export interface TimelineTask {
  id: string;
  time: string;
  title: string;
  description?: string;
  status: TimelineTaskStatus;
}

export interface TeamContact {
  id: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  avatarInitials: string;
}

export interface PaymentInstallment {
  id: string;
  label: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  paidDate?: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface FinancialSummary {
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  paid: number;
  balance: number;
  currency: string;
  depositPercent?: number;
  depositAmount?: number;
  installments?: PaymentInstallment[];
}

export interface HotelEvent {
  id: string;
  code: string;
  contractNumber?: string;
  name: string;
  status: EventStatus;
  eventTypeId: string;
  eventTypeName: string;
  eventTypeIcon: string;
  customer: Customer;
  groupId?: string;
  groupName?: string;
  venueId: string;
  venueName: string;
  setupName?: string;
  startDate: string;
  endDate: string;
  setupTime?: string;
  startTime: string;
  endTime: string;
  teardownTime?: string;
  expectedGuests: number;
  guaranteedGuests: number;
  packageId?: string;
  packageName?: string;
  items: EventItemLine[];
  notesCustomer?: string;
  notesInternal?: string;
  beoInstructions?: string;
  finance: FinancialSummary;
  reservations?: ReservationBlock[];
  timeline?: TimelineTask[];
  team?: TeamContact[];
  checklist?: ChecklistItem[];
  readinessPercent?: number;
  hasCapacityWarning?: boolean;
  hasConflict?: boolean;
  images?: string[];
}

export interface EventGroup {
  id: string;
  name: string;
  customerName: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
  eventCount: number;
  expectedGuests: number;
  totalAmount: number;
  paidAmount: number;
}

export interface OperationalAlert {
  id: string;
  severity: AlertSeverity;
  category: string;
  title: string;
  description: string;
  eventId?: string;
  venueName?: string;
  timeLabel: string;
  actionLabel: string;
  meta?: string;
}

export interface VenueOccupancySlot {
  venueId: string;
  venueName: string;
  capacity: number;
  occupancyPercent: number;
  status: 'free' | 'booked' | 'active' | 'overbooked';
  eventName?: string;
  startHour: number;
  endHour: number;
}

export interface StaffOnDuty {
  id: string;
  name: string;
  role: string;
  phone?: string;
  avatarInitials: string;
}

export interface DashboardKpis {
  todayEvents: number;
  todayActive: number;
  todayConfirmed: number;
  todayPrep: number;
  expectedGuests: number;
  capacityUtilization: number;
  todayRevenue: number;
  todayCollected: number;
  todayBalance: number;
  upcoming7Days: number;
  upcomingGrowthPercent: number;
  venueOccupancyPercent: number;
  venuesOccupied: number;
  venuesTotal: number;
  venuesFree: number;
}

export interface ListKpis {
  monthlyEvents: number;
  monthlyGrowthPercent: number;
  confirmationRate: number;
  todayLive: number;
  venuesFull: number;
  todayGuests: number;
  hallOccupancy: number;
  contractRevenue: number;
  collectedPercent: number;
  remainingCollect: number;
  beoApproved: number;
  beoTotal: number;
  beoNeedsReview: number;
  venueReadiness: number;
}

export interface EventFilters {
  search: string;
  status: EventStatus | 'all';
  venueId: string;
  eventTypeId: string;
  dateRange: string;
  capacityBand: string;
}

export interface CreateEventFormValue {
  name: string;
  eventTypeId: string;
  groupId: string;
  customerId: string;
  status: EventStatus;
  startDate: string;
  endDate: string;
  setupTime: string;
  startTime: string;
  endTime: string;
  teardownTime: string;
  venueId: string;
  setupId: string;
  expectedGuests: number;
  guaranteedGuests: number;
  packageId: string;
  notesCustomer: string;
  notesInternal: string;
  linkRooms: boolean;
}

export function calcLineTotal(item: EventItemLine): number {
  const gross = item.quantity * item.unitPrice;
  const afterDiscount = gross * (1 - item.discountPercent / 100);
  return afterDiscount * (1 + item.taxPercent / 100);
}

export function calcFinancials(
  items: EventItemLine[],
  discountPercent = 0,
  taxPercent = 15,
  paid = 0,
  currency = 'ر.س'
): FinancialSummary {
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const taxable = subtotal - discountAmount;
  const taxAmount = taxable * (taxPercent / 100);
  const total = taxable + taxAmount;
  const depositPercent = 50;
  return {
    subtotal,
    discountPercent,
    discountAmount,
    taxPercent,
    taxAmount,
    total,
    paid,
    balance: Math.max(0, total - paid),
    currency,
    depositPercent,
    depositAmount: total * (depositPercent / 100),
  };
}

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: 'مسودة',
  tentative: 'مبدئية',
  confirmed: 'مؤكدة',
  in_progress: 'قيد التنفيذ',
  completed: 'منتهية',
  cancelled: 'ملغاة',
};

export const CUSTOMER_CATEGORY_LABELS: Record<CustomerCategory, string> = {
  family: 'عائلي',
  corporate: 'شركات',
  government: 'حكومي',
  bank: 'بنوك',
  education: 'تعليمي',
  automotive: 'سيارات',
  vip: 'VIP',
};
