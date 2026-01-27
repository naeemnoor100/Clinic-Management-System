export interface Medication {
  id: string;
  brandName: string;
  scientificName: string; 
  companyName: string; 
  type: string; // Physical form (e.g., Tablet, Syrup)
  unit: string; // Packaging unit (e.g., Tablet, Strip, Bottle)
  strength: string;
  category: string; // Therapeutic category (e.g., Antibiotic, Analgesic)
  stock: number;
  reorderLevel: number;
  pricePerUnit: number;
}

export interface MedType {
  id: string;
  label: string;
}

export interface MedCategory {
  id: string;
  label: string;
}

export interface ScientificName {
  id: string;
  label: string;
}

export interface CompanyName {
  id: string;
  label: string;
}

export interface Symptom {
  id: string;
  label: string;
}

export interface VitalDefinition {
  id: string;
  label: string;
  unit: string;
}

export interface PrescribedMed {
  medicationId: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity?: number; // Numerical quantity to deduct from stock
}

export interface PrescriptionTemplate {
  id: string;
  name: string;
  diagnosis: string;
  prescribedMeds: PrescribedMed[];
}

export interface Visit {
  id: string;
  patientId: string;
  date: string;
  symptoms: string;
  diagnosis: string;
  prescribedMeds: PrescribedMed[];
  vitals?: Record<string, string>; 
  feeAmount?: number;
  paymentStatus?: 'Paid' | 'Pending';
}

export interface PharmacySaleItem {
  medicationId: string;
  quantity: number;
  priceAtTime: number;
}

export interface PharmacySale {
  id: string;
  customerName: string;
  date: string;
  items: PharmacySaleItem[];
  totalAmount: number;
  paymentStatus: 'Paid' | 'Pending';
}

export interface Patient {
  id: string;
  patientCode: string; 
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  address: string;
  allergies?: string;
  chronicConditions?: string;
}

export interface ScheduleDay {
  day: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface BlockedSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

export type QueueStatus = 'Waiting' | 'In-Consultation' | 'Completed' | 'Skipped';

export interface QueueItem {
  id: string;
  patientId: string;
  tokenNumber: number;
  status: QueueStatus;
  checkInTime: string;
}

export type View = 'dashboard' | 'patients' | 'visits' | 'patient-detail' | 'settings' | 'queue' | 'billing' | 'pharmacy';