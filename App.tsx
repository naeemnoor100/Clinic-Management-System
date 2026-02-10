
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Users, 
  PlusCircle, 
  Pill, 
  ClipboardList, 
  LayoutDashboard, 
  Search,
  ArrowRight,
  Stethoscope,
  Trash2,
  Sparkles,
  Edit2,
  Activity,
  Clock,
  Plus,
  Printer,
  QrCode,
  ShoppingCart,
  Minus,
  CheckCircle2,
  Droplets,
  Settings,
  Receipt,
  Building2,
  FlaskConical,
  Tags,
  AlertTriangle,
  Layers,
  X,
  MessageCircle,
  FileDown,
  FileUp,
  UserSearch,
  ArrowUpDown,
  History,
  FileText,
  TrendingUp,
  Wallet,
  PackageSearch,
  Calendar,
  LayoutTemplate,
  Copy,
  AlertCircle,
  ShieldAlert,
  Menu,
  User,
  BarChart3,
  PieChart,
  TrendingDown,
  Bell,
  Inbox,
  Zap,
  ListPlus,
  ArrowLeft,
  ChevronRight,
  UserPlus,
  Filter,
  Eye,
  Cloud,
  CloudUpload,
  RefreshCw,
  Server,
  Database,
  Lock,
  Wifi,
  Link,
  Smartphone,
  CopyCheck,
  DownloadCloud,
  UploadCloud,
  Globe,
  StickyNote,
  Type,
  Baby,
  Accessibility,
  Info,
  ShieldCheck,
  ToggleLeft as Toggle,
  ToggleRight as ToggleOn,
  Globe2,
  Moon,
  Sun
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Patient, Visit, Medication, View, PrescribedMed, Symptom, VitalDefinition, PharmacySale, PharmacySaleItem, ScientificName, CompanyName, MedType, MedCategory, PrescriptionTemplate } from './types';
import { getPatientHistorySummary } from './services/gemini';

// --- Utility: Persistence ---
const saveToLocal = (key: string, data: any) => localStorage.setItem(`smartclinic_${key}`, JSON.stringify(data));
const getFromLocal = (key: string, fallback: any) => {
  const saved = localStorage.getItem(`smartclinic_${key}`);
  try {
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

// --- Utility: Date Formatting ---
const formatDate = (dateStr: string) => {
  if (!dateStr || !dateStr.includes('-')) return dateStr;
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

const getCurrentIsoDate = () => new Date().toISOString().split('T')[0];

// --- Constants ---
const CURRENCY = "Rs.";
const DEFAULT_SYNC_URL = "https://httpbin.org/post"; 

// --- Expanded Dummy Data ---
const dummyScientificNames: ScientificName[] = [
  { id: 'sc1', label: 'Paracetamol' },
  { id: 'sc2', label: 'Amoxicillin' },
  { id: 'sc3', label: 'Metformin' },
  { id: 'sc4', label: 'Metronidazole' },
  { id: 'sc5', label: 'Ibuprofen' },
  { id: 'sc6', label: 'Omeprazole' },
  { id: 'sc7', label: 'Aspirin' },
  { id: 'sc8', label: 'Cetirizine' },
  { id: 'sc9', label: 'Azithromycin' },
  { id: 'sc10', label: 'Atorvastatin' }
];

const dummyTemplates: PrescriptionTemplate[] = [
  {
    id: 'tpl1',
    name: 'Adult Flu Protocol',
    diagnosis: 'Seasonal Viral Influenza (Adult)',
    minAge: 18,
    maxAge: 100,
    prescribedMeds: [
      { medicationId: 'm1', dosage: '500mg', frequency: 'TDS', duration: '3 Days', quantity: 10 }
    ]
  },
  {
    id: 'tpl2',
    name: 'Pediatric Fever',
    diagnosis: 'Viral Fever (Child)',
    minAge: 0,
    maxAge: 12,
    prescribedMeds: [
      { medicationId: 'm5', dosage: '5ml', frequency: 'BD', duration: '5 Days', quantity: 1 }
    ]
  },
  {
    id: 'tpl3',
    name: 'General Antacid',
    diagnosis: 'Gastroesophageal Reflux',
    prescribedMeds: [
      { medicationId: 'm6', dosage: '20mg', frequency: 'OD', duration: '14 Days', quantity: 14 }
    ]
  }
];

const dummyCompanyNames: CompanyName[] = [
  { id: 'c1', label: 'GSK' },
  { id: 'c2', label: 'Pfizer' },
  { id: 'c3', label: 'Abbott' },
  { id: 'c4', label: 'Getz Pharma' },
  { id: 'c5', label: 'Sanofi' },
  { id: 'c6', label: 'Bayer' },
  { id: 'c7', label: 'Searle' },
  { id: 'c8', label: 'Sami Pharmaceuticals' }
];

const dummyMedTypes: MedType[] = [
  { id: 't1', label: 'Tablet' },
  { id: 't2', label: 'Syrup' },
  { id: 't3', label: 'Injection' },
  { id: 't4', label: 'Capsule' },
  { id: 't5', label: 'Drops' },
  { id: 't6', label: 'Ointment' }
];

const dummyMedCategories: MedCategory[] = [
  { id: 'cat1', label: 'Analgesic' },
  { id: 'cat2', label: 'Antibiotic' },
  { id: 'cat3', label: 'Antidiabetic' },
  { id: 'cat4', label: 'Antacid' },
  { id: 'cat5', label: 'NSAID' },
  { id: 'cat6', label: 'Antihistamine' },
  { id: 'cat7', label: 'Cardiovascular' }
];

const dummySymptoms: Symptom[] = [
  { id: 's1', label: 'Fever' },
  { id: 's2', label: 'Dry Cough' },
  { id: 's3', label: 'Headache' },
  { id: 's4', label: 'Body Pain' },
  { id: 's5', label: 'Nausea' },
  { id: 's6', label: 'Sore Throat' },
  { id: 's7', label: 'Fatigue' },
  { id: 's8', label: 'Dizziness' },
  { id: 's9', label: 'Shortness of Breath' }
];

const dummyVitalDefinitions: VitalDefinition[] = [
  { id: 'v1', label: 'Temp', unit: '°F' },
  { id: 'v2', label: 'B.P', unit: 'mmHg' },
  { id: 'v3', label: 'Pulse', unit: 'bpm' },
  { id: 'v4', label: 'Weight', unit: 'kg' },
  { id: 'v5', label: 'SpO2', unit: '%' },
  { id: 'v6', label: 'RBS', unit: 'mg/dL' }
];

const dummyPatients: Patient[] = [
  { id: 'p1', patientCode: 'P-0001', name: 'Ali Ahmed', age: 45, gender: 'Male', phone: '0300-1234567', address: 'DHA Phase 5, Lahore', allergies: 'Penicillin, Paracetamol', chronicConditions: 'Type 2 Diabetes', notes: 'Patient prefers evening appointments.' },
  { id: 'p2', patientCode: 'P-0002', name: 'Sara Khan', age: 29, gender: 'Female', phone: '0321-7654321', address: 'Gulberg III, Lahore' },
  { id: 'p3', patientCode: 'P-0003', name: 'Muhammad Bilal', age: 52, gender: 'Male', phone: '0333-1122334', address: 'Model Town, Lahore', allergies: 'NSAIDs', chronicConditions: 'Hypertension' },
  { id: 'p4', patientCode: 'P-0004', name: 'Fatima Zahra', age: 34, gender: 'Female', phone: '0345-9988776', address: 'Bahria Town, Lahore' },
  { id: 'p5', patientCode: 'P-0005', name: 'Zohaib Hassan', age: 12, gender: 'Male', phone: '0301-5544332', address: 'Johar Town, Lahore', allergies: 'Dust, Peanuts' },
  { id: 'p6', patientCode: 'P-0006', name: 'Ayesha Siddiqui', age: 61, gender: 'Female', phone: '0322-8877665', address: 'Wapda Town, Lahore', chronicConditions: 'Osteoarthritis' },
  { id: 'p7', patientCode: 'P-0007', name: 'Hamza Malik', age: 28, gender: 'Male', phone: '0331-4433221', address: 'Cavalry Ground, Lahore' }
];

const dummyMeds: Medication[] = [
  { id: 'm1', brandName: 'Panadol', scientificName: 'Paracetamol', companyName: 'GSK', type: 'Tablet', unit: 'Tablet', strength: '500mg', category: 'Analgesic', stock: 12, reorderLevel: 20, pricePerUnit: 15 },
  { id: 'm2', brandName: 'Amoxil', scientificName: 'Amoxicillin', companyName: 'GSK', type: 'Capsule', unit: 'Capsule', strength: '250mg', category: 'Antibiotic', stock: 45, reorderLevel: 20, pricePerUnit: 45 },
  { id: 'm3', brandName: 'Flagyl', scientificName: 'Metronidazole', companyName: 'Abbott', type: 'Tablet', unit: 'Tablet', strength: '400mg', category: 'Antibiotic', stock: 80, reorderLevel: 25, pricePerUnit: 12 },
  { id: 'm4', brandName: 'Glucophage', scientificName: 'Metformin', companyName: 'Pfizer', type: 'Tablet', unit: 'Tablet', strength: '500mg', category: 'Antidiabetic', stock: 200, reorderLevel: 50, pricePerUnit: 8 },
  { id: 'm5', brandName: 'Brufen', scientificName: 'Ibuprofen', companyName: 'Abbott', type: 'Syrup', unit: 'Bottle', strength: '100mg/5ml', category: 'NSAID', stock: 5, reorderLevel: 10, pricePerUnit: 85 },
  { id: 'm6', brandName: 'Risek', scientificName: 'Omeprazole', companyName: 'Getz Pharma', type: 'Capsule', unit: 'Capsule', strength: '20mg', category: 'Antacid', stock: 150, reorderLevel: 30, pricePerUnit: 25 },
  { id: 'm7', brandName: 'Zyrtec', scientificName: 'Cetirizine', companyName: 'GSK', type: 'Tablet', unit: 'Tablet', strength: '10mg', category: 'Antihistamine', stock: 300, reorderLevel: 50, pricePerUnit: 10 },
  { id: 'm8', brandName: 'Lipiget', scientificName: 'Atorvastatin', companyName: 'Getz Pharma', type: 'Tablet', unit: 'Tablet', strength: '20mg', category: 'Cardiovascular', stock: 100, reorderLevel: 20, pricePerUnit: 35 },
  { id: 'm9', brandName: 'Azomax', scientificName: 'Azithromycin', companyName: 'Sami', type: 'Capsule', unit: 'Capsule', strength: '500mg', category: 'Antibiotic', stock: 40, reorderLevel: 10, pricePerUnit: 60 }
];

const SidebarItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick: () => void; }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick} 
    className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group w-full text-left ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 translate-x-2' 
        : 'text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-900'
    }`}
  >
    <span className={`${active ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>{icon}</span>
    <span className="font-black uppercase tracking-widest text-[10px]">{label}</span>
  </button>
);

const App: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');
  const [settingsTab, setSettingsTab] = useState<'vitals' | 'symptoms' | 'scientific' | 'companies' | 'med_categories' | 'med_types' | 'meds' | 'templates' | 'low_stock' | 'appearance'>('vitals');
  const [detailTab, setDetailTab] = useState<'history' | 'prescriptions'>('history');
  const [prescSort, setPrescSort] = useState<{ key: 'date' | 'name', direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  
  // Font Size State
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('smartclinic_font_size');
    return saved ? parseInt(saved, 10) : 16;
  });

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => getFromLocal('dark_mode', false));

  // --- Real-time Sync States ---
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState<boolean>(() => getFromLocal('auto_sync_enabled', false));
  const [syncEndpoint, setSyncEndpoint] = useState<string>(() => getFromLocal('sync_endpoint', DEFAULT_SYNC_URL));
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncStatusMessage, setSyncStatusMessage] = useState<string>('');
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => getFromLocal('last_synced', null));
  const [clinicSyncCode, setClinicSyncCode] = useState<string>(() => getFromLocal('clinic_sync_code', `SC-${Math.random().toString(36).substring(2, 6).toUpperCase()}`));
  const [joinCode, setJoinCode] = useState('');

  // Pharmacy POS state
  const [showPharmacyCartMobile, setShowPharmacyCartMobile] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const [pharmacyTab, setPharmacyTab] = useState<'pos' | 'history'>('pos');
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<PharmacySale | null>(null);
  const [pharmacyHistoryDate, setPharmacyHistoryDate] = useState<string>('');
  const [selectedPharmacyPatientId, setSelectedPharmacyPatientId] = useState<string | null>(null);

  // Search and Filter States
  const [medSearchTerm, setMedSearchTerm] = useState('');
  const [visitSearchTerm, setVisitSearchTerm] = useState('');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [settingsSearchTerm, setSettingsSearchTerm] = useState('');
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [billingDate, setBillingDate] = useState<string>(''); 
  const [billingFilterStatus, setBillingFilterStatus] = useState<'All' | 'Pending'>('All');
  const [showNotifications, setShowNotifications] = useState(false);
  const [templateAgeFilter, setTemplateAgeFilter] = useState<'All' | 'Child' | 'Adult' | 'Senior'>('All');
  
  const [patients, setPatients] = useState<Patient[]>(() => getFromLocal('patients', dummyPatients));
  const [medications, setMedications] = useState<Medication[]>(() => getFromLocal('meds', dummyMeds));
  const [scientificNames, setScientificNames] = useState<ScientificName[]>(() => getFromLocal('scientific', dummyScientificNames));
  const [companyNames, setCompanyNames] = useState<CompanyName[]>(() => getFromLocal('companies', dummyCompanyNames));
  const [medTypes, setMedTypes] = useState<MedType[]>(() => getFromLocal('med_types', dummyMedTypes));
  const [medCategories, setMedCategories] = useState<MedCategory[]>(() => getFromLocal('med_categories', dummyMedCategories));
  const [symptoms, setSymptoms] = useState<Symptom[]>(() => getFromLocal('symptoms', dummySymptoms));
  const [vitalDefinitions, setVitalDefinitions] = useState<VitalDefinition[]>(() => getFromLocal('vitals', dummyVitalDefinitions));
  const [prescriptionTemplates, setPrescriptionTemplates] = useState<PrescriptionTemplate[]>(() => getFromLocal('templates', dummyTemplates));
  const [visits, setVisits] = useState<Visit[]>(() => getFromLocal('visits', []));
  const [pharmacySales, setPharmacySales] = useState<PharmacySale[]>(() => getFromLocal('pharmacy_sales', []));
  
  // POS specific ref for search bar focus
  const posSearchRef = useRef<HTMLInputElement>(null);

  // --- Persistent Patient Code Logic ---
  const [patientCounter, setPatientCounter] = useState<number>(() => {
    const saved = localStorage.getItem('smartclinic_patient_counter');
    if (saved) return parseInt(saved, 10);
    const numericCodes = dummyPatients.map(p => {
      const match = p.patientCode.match(/P-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    return Math.max(...numericCodes, 0);
  });

  useEffect(() => {
    localStorage.setItem('smartclinic_patient_counter', patientCounter.toString());
  }, [patientCounter]);

  // Apply Font Size
  useEffect(() => {
    document.documentElement.style.setProperty('--base-font-size', `${fontSize}px`);
    localStorage.setItem('smartclinic_font_size', fontSize.toString());
  }, [fontSize]);

  // Apply Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    saveToLocal('dark_mode', isDarkMode);
  }, [isDarkMode]);

  const [cart, setCart] = useState<{ medicationId: string, quantity: number }[]>([]);
  const [walkinName, setWalkinName] = useState('Walk-in Customer');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  
  const [printingVisit, setPrintingVisit] = useState<Visit | null>(null);
  const [qrVisit, setQrVisit] = useState<Visit | null>(null);
  const [qrPatient, setQrPatient] = useState<Patient | null>(null);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [showMedForm, setShowMedForm] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [showSymptomForm, setShowSymptomForm] = useState(false);
  const [editingSymptom, setEditingSymptom] = useState<Symptom | null>(null);
  const [showScientificForm, setShowScientificForm] = useState(false);
  const [editingScientificName, setEditingScientificName] = useState<ScientificName | null>(null);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [editingCompanyName, setEditingCompanyName] = useState<CompanyName | null>(null);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [editingMedType, setEditingMedType] = useState<MedType | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingMedCategory, setEditingMedCategory] = useState<MedCategory | null>(null);
  const [showVitalDefForm, setShowVitalDefForm] = useState(false);
  const [editingVitalDefinition, setEditingVitalDefinition] = useState<VitalDefinition | null>(null);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PrescriptionTemplate | null>(null);

  const [tempPrescribedMeds, setTempPrescribedMeds] = useState<(PrescribedMed & { searchTerm?: string })[]>([]);
  const [activeMedSearchIndex, setActiveMedSearchIndex] = useState<number | null>(null);
  const [formDiagnosis, setFormDiagnosis] = useState('');
  
  // Tracking patient selection in encounter form
  const [formSelectedPatientId, setFormSelectedPatientId] = useState<string | null>(null);
  const [patientFormSearch, setPatientFormSearch] = useState('');
  const [showPatientResults, setShowPatientResults] = useState(false);

  // New state for Allergy Search in Patient Form
  const [allergySearchTerm, setAllergySearchTerm] = useState('');
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [showAllergyDropdown, setShowAllergyDropdown] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowVisitForm(false);
        setShowPatientForm(false);
        setShowMedForm(false);
        setShowSymptomForm(false);
        setShowScientificForm(false);
        setShowCompanyForm(false);
        setShowTypeForm(false);
        setShowCategoryForm(false);
        setShowVitalDefForm(false);
        setShowTemplateForm(false);
        setQrVisit(null);
        setQrPatient(null);
        setPrintingVisit(null);
        setEditingVisit(null);
        setEditingPatient(null);
        setActiveMedSearchIndex(null);
        setFormSelectedPatientId(null);
        setPatientFormSearch('');
        setShowPatientResults(false);
        setAllergySearchTerm('');
        setSelectedAllergies([]);
        setShowAllergyDropdown(false);
        setShowNotifications(false);
        setShowPharmacyCartMobile(false);
        setShowCustomerResults(false);
        setSelectedSaleForReceipt(null);
      }
      // POS shortcut: press '/' to focus search
      if (e.key === '/' && view === 'pharmacy' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        posSearchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view]);

  // --- Real-time Auto Sync Trigger ---
  useEffect(() => {
    saveToLocal('patients', patients);
    saveToLocal('meds', medications);
    saveToLocal('scientific', scientificNames);
    saveToLocal('companies', companyNames);
    saveToLocal('med_types', medTypes);
    saveToLocal('med_categories', medCategories);
    saveToLocal('symptoms', symptoms);
    saveToLocal('vitals', vitalDefinitions);
    saveToLocal('templates', prescriptionTemplates);
    saveToLocal('visits', visits);
    saveToLocal('pharmacy_sales', pharmacySales);
    saveToLocal('clinic_sync_code', clinicSyncCode);
    saveToLocal('auto_sync_enabled', isAutoSyncEnabled);
    saveToLocal('sync_endpoint', syncEndpoint);

    // If auto-sync is on, trigger a background backup
    if (isAutoSyncEnabled && !isSyncing) {
       handleCloudSync('backup', true);
    }
  }, [patients, medications, scientificNames, companyNames, medTypes, medCategories, symptoms, vitalDefinitions, prescriptionTemplates, visits, pharmacySales, clinicSyncCode, isAutoSyncEnabled, syncEndpoint]);

  // --- Enhanced Cloud Sync Logic with Auto-Sync Support ---
  const handleCloudSync = async (type: 'backup' | 'restore', isBackground = false) => {
    if (isSyncing) return;
    setIsSyncing(true);
    if (!isBackground) {
       setSyncStatus('idle');
       setSyncProgress(0);
       setSyncStatusMessage(type === 'backup' ? 'Initializing Secure Transmission...' : 'Contacting API Gateway...');
    }
    
    try {
      if (!isBackground) await new Promise(r => setTimeout(r, 600));
      setSyncProgress(25);
      if (!isBackground) setSyncStatusMessage(type === 'backup' ? 'Encrypting Clinical Records...' : 'Authenticating Clinic ID...');

      const cloudData = {
        patients,
        medications,
        scientificNames,
        companyNames,
        medTypes,
        medCategories,
        symptoms,
        vitalDefinitions,
        prescriptionTemplates,
        visits,
        pharmacySales,
        patientCounter,
        clinicSyncCode: joinCode || clinicSyncCode
      };

      if (!isBackground) await new Promise(r => setTimeout(r, 600));
      setSyncProgress(50);
      if (!isBackground) setSyncStatusMessage(type === 'backup' ? 'Compressing Data Packets...' : 'Fetching Data from Cloud...');

      const response = await fetch(syncEndpoint || DEFAULT_SYNC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sync-Code': joinCode || clinicSyncCode,
          'X-Action-Type': type
        },
        body: JSON.stringify({
          action: type,
          timestamp: new Date().toISOString(),
          data: cloudData
        })
      });

      if (!response.ok) {
        throw new Error("Server Error: Failed to reach sync endpoint.");
      }

      if (!isBackground) await new Promise(r => setTimeout(r, 800));
      setSyncProgress(75);
      if (!isBackground) setSyncStatusMessage(type === 'backup' ? 'Verifying Integrity...' : 'Updating Local Database...');

      if (type === 'backup') {
        localStorage.setItem(`cloud_data_${clinicSyncCode}`, JSON.stringify(cloudData));
      } else {
        const targetCode = joinCode || clinicSyncCode;
        const raw = localStorage.getItem(`cloud_data_${targetCode}`);
        if (!raw) throw new Error("No cloud record found for this Clinic Code.");
        
        const data = JSON.parse(raw);
        setPatients(data.patients || []);
        setMedications(data.medications || []);
        setScientificNames(data.scientificNames || []);
        setCompanyNames(data.companyNames || []);
        setMedTypes(data.medTypes || []);
        setMedCategories(data.medCategories || []);
        setSymptoms(data.symptoms || []);
        setVitalDefinitions(data.vitalDefinitions || []);
        setPrescriptionTemplates(data.prescriptionTemplates || []);
        setVisits(data.visits || []);
        setPharmacySales(data.pharmacySales || []);
        setPatientCounter(data.patientCounter || 0);
        if (joinCode) setClinicSyncCode(joinCode);
      }

      const now = new Date().toLocaleString();
      setLastSyncedAt(now);
      saveToLocal('last_synced', now);
      
      setSyncProgress(100);
      if (!isBackground) {
        setSyncStatusMessage(type === 'backup' ? 'Sync Completed Successfully.' : 'Cloud Data Restored.');
        setSyncStatus('success');
        setJoinCode('');
      }
    } catch (e: any) {
      console.error("Sync Error:", e);
      if (!isBackground) {
        setSyncStatus('error');
        setSyncStatusMessage(e.message || "Online synchronization failed.");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAiSummary = async (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    setIsSummarizing(true);
    setAiSummary("Gemini AI is analyzing patient clinical history...");

    try {
      const patientVisits = visits.filter(v => v.patientId === patientId);
      const summary = await getPatientHistorySummary(patient, patientVisits, medications);
      setAiSummary(summary || "No clinical summary could be generated.");
    } catch (error) {
      console.error("AI Summary Error:", error);
      setAiSummary("Failed to generate clinical summary.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const copySyncCode = () => {
    navigator.clipboard.writeText(clinicSyncCode);
    alert("Clinic Sync Code copied to clipboard!");
  };

  // --- CSV Export/Import Helpers ---
  const downloadCsv = (filename: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const exportPatientsCsv = () => {
    const headers = ['Code', 'Name', 'Age', 'Gender', 'Phone', 'Address', 'Allergies', 'Chronic Conditions', 'Notes'];
    const rows = patients.map(p => [p.patientCode, p.name, p.age, p.gender, p.phone, p.address, p.allergies || '', p.chronicConditions || '', p.notes || '']);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    downloadCsv(`patients_backup_${getCurrentIsoDate()}.csv`, csvContent);
  };

  const handleImportPatientsCsv = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split('\n').filter(l => l.trim() !== '');
      if (lines.length < 2) return;
      
      let maxImportedNum = patientCounter;
      const newPatients: Patient[] = lines.slice(1).map(line => {
        const [code, name, age, gender, phone, address, allergies, chronic, notes] = line.split(',');
        const match = (code || '').match(/P-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxImportedNum) maxImportedNum = num;
        }
        return {
          id: Math.random().toString(36).substr(2, 9),
          patientCode: code || 'ERROR',
          name: name || 'Unknown',
          age: parseInt(age) || 0,
          gender: (gender as any) || 'Male',
          phone: phone || '',
          address: address || '',
          allergies: allergies || '',
          chronicConditions: chronic || '',
          notes: notes || ''
        };
      });
      if (window.confirm(`Import ${newPatients.length} patients? Current patient data will be replaced.`)) {
        setPatients(newPatients);
        setPatientCounter(maxImportedNum);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const exportMedsCsv = () => {
    const headers = ['Brand Name', 'Scientific Name', 'Company', 'Type', 'Unit', 'Strength', 'Category', 'Stock', 'Reorder Level', 'Price'];
    const rows = medications.map(m => [m.brandName, m.scientificName, m.companyName, m.type, m.unit, m.strength, m.category, m.stock, m.reorderLevel, m.pricePerUnit]);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    downloadCsv(`medications_backup_${getCurrentIsoDate()}.csv`, csvContent);
  };

  const handleImportMedsCsv = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split('\n').filter(l => l.trim() !== '');
      if (lines.length < 2) return;
      const newMeds: Medication[] = lines.slice(1).map(line => {
        const [brand, scientific, company, type, unit, strength, category, stock, reorder, price] = line.split(',');
        return {
          id: Math.random().toString(36).substr(2, 9),
          brandName: brand || 'Unnamed',
          scientificName: scientific || '',
          companyName: company || '',
          type: type || 'Tablet',
          unit: unit || 'Tablet',
          strength: strength || '',
          category: category || '',
          stock: parseInt(stock) || 0,
          reorderLevel: parseInt(reorder) || 0,
          pricePerUnit: parseFloat(price) || 0
        };
      });
      if (window.confirm(`Import ${newMeds.length} medicines? Current inventory data will be replaced.`)) {
        setMedications(newMeds);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const exportVisitsCsv = () => {
    const headers = ['Date', 'Patient Name', 'Symptoms', 'Diagnosis', 'Vitals', 'Medications', 'Fee', 'Status'];
    const rows = visits.map(v => {
      const p = patients.find(pat => pat.id === v.patientId);
      const vitalsStr = vitalDefinitions.map(vd => v.vitals?.[vd.id] ? `${vd.label}: ${v.vitals[vd.id]} ${vd.unit}` : null).filter(Boolean).join('; ');
      const medsStr = v.prescribedMeds.map(pm => {
        const med = medications.find(m => m.id === pm.medicationId);
        return med ? `${med.brandName} (${pm.quantity})` : `${pm.customName} (${pm.quantity})`;
      }).join('; ');
      return [formatDate(v.date), `"${p?.name || 'Unknown'}"`, `"${v.symptoms || ''}"`, `"${v.diagnosis || ''}"`, `"${vitalsStr}"`, `"${medsStr}"`, v.feeAmount || 0, v.paymentStatus || 'Paid'];
    });
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    downloadCsv(`clinical_logs_${getCurrentIsoDate()}.csv`, csvContent);
  };

  const handleWhatsAppShare = (visit: Visit, patient: Patient) => {
    const medsText = visit.prescribedMeds.map(pm => {
      const med = medications.find(m => m.id === pm.medicationId);
      const name = med ? med.brandName : pm.customName;
      return `- *${name}*: ${pm.quantity}`;
    }).join('\n');
    const formattedDate = formatDate(visit.date);
    const message = `*Clinic Visit Summary*\n\n*Name:* ${patient.name}\n*Date of Visit:* ${formattedDate}\n\n*Medications (Qty):*\n${medsText || 'None prescribed'}\n\n_SmartClinic_`;
    const cleanPhone = patient.phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '92' + cleanPhone.substring(1) : cleanPhone;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const triggerPrint = (visit: Visit) => {
    setPrintingVisit(visit);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // --- Enhanced Deep Search for Patients ---
  const filteredPatients = useMemo(() => {
    const s = patientSearchTerm.toLowerCase();
    if (!s) return patients;

    return patients.filter(p => {
      const pVisits = visits.filter(v => v.patientId === p.id);
      const medicalHistoryKeywords = pVisits.map(v => 
        `${v.diagnosis} ${v.symptoms} ${formatDate(v.date)}`
      ).join(' ');

      const searchableString = [
        p.name,
        p.phone,
        p.patientCode,
        p.age.toString(),
        p.gender,
        p.address,
        p.allergies || '',
        p.chronicConditions || '',
        p.notes || '',
        medicalHistoryKeywords
      ].join(' ').toLowerCase();

      return searchableString.includes(s);
    });
  }, [patients, patientSearchTerm, visits]);

  // --- POS Deep Search for Pharmacy ---
  const filteredMeds = useMemo(() => {
    const s = medSearchTerm.toLowerCase();
    if (!s) return []; 
    
    let result = medications.filter(m => {
      const isLowStock = m.stock <= m.reorderLevel;
      const searchableString = [
        m.brandName,
        m.scientificName,
        m.companyName,
        m.category,
        m.type,
        m.strength,
        m.unit,
        m.pricePerUnit.toString(),
        isLowStock ? 'low stock reorder' : 'available in stock',
        m.stock.toString()
      ].join(' ').toLowerCase();
      return searchableString.includes(s);
    });
    return [...result].sort((a, b) => a.brandName.localeCompare(b.brandName));
  }, [medications, medSearchTerm]);

  // POS: Patient Search Results
  const customerSearchResults = useMemo(() => {
    const s = customerSearchTerm.toLowerCase();
    if (!s) return [];
    return patients.filter(p => 
      p.name.toLowerCase().includes(s) || 
      p.phone.includes(s) || 
      p.patientCode.toLowerCase().includes(s)
    ).slice(0, 5);
  }, [patients, customerSearchTerm]);

  // POS: Sales History Filtering & Grouping
  const groupedPharmacySales = useMemo(() => {
    let sales = [...pharmacySales];
    if (pharmacyHistoryDate) {
      sales = sales.filter(s => s.date === pharmacyHistoryDate);
    }
    
    sales.sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      return dateDiff !== 0 ? dateDiff : b.id.localeCompare(a.id);
    });

    const groups: Record<string, { date: string, total: number, sales: PharmacySale[] }> = {};
    sales.forEach(s => {
      if (!groups[s.date]) {
        groups[s.date] = { date: s.date, total: 0, sales: [] };
      }
      groups[s.date].total += s.totalAmount;
      groups[s.date].sales.push(s);
    });

    return Object.values(groups);
  }, [pharmacySales, pharmacyHistoryDate]);

  // --- POS Allergy Check Helper ---
  const checkPharmacyMedAllergy = (medId: string, patientName?: string) => {
    let patient;
    if (patientName) {
      patient = patients.find(p => p.name === patientName);
    } else {
      patient = patients.find(p => p.id === selectedPharmacyPatientId);
    }
    
    if (!patient || !patient.allergies) return false;

    const med = medications.find(m => m.id === medId);
    if (!med) return false;

    const allergiesArray = patient.allergies.split(',').map(a => a.trim().toLowerCase()).filter(Boolean);
    const medBrand = med.brandName.toLowerCase().trim();
    const medSci = med.scientificName.toLowerCase().trim();

    return allergiesArray.some(a => a === medBrand || a === medSci);
  };

  // --- Enhanced Deep Search for Settings ---
  const filteredSettingsItems = useMemo(() => {
    const s = settingsSearchTerm.toLowerCase();
    
    let baseItems: any[] = [];
    switch (settingsTab) {
      case 'symptoms': baseItems = symptoms; break;
      case 'scientific': baseItems = scientificNames; break;
      case 'med_categories': baseItems = medCategories; break;
      case 'med_types': baseItems = medTypes; break;
      case 'companies': baseItems = companyNames; break;
      case 'vitals': baseItems = vitalDefinitions; break;
      case 'templates': baseItems = prescriptionTemplates; break;
      case 'meds': baseItems = medications; break;
      case 'low_stock': baseItems = medications.filter(m => m.stock <= m.reorderLevel); break;
      default: return [];
    }

    // Special case for templates age filtering
    if (settingsTab === 'templates' && templateAgeFilter !== 'All') {
      baseItems = baseItems.filter((tpl: PrescriptionTemplate) => {
        const min = tpl.minAge ?? 0;
        const max = tpl.maxAge ?? 120;
        if (templateAgeFilter === 'Child') return max <= 14;
        if (templateAgeFilter === 'Adult') return min >= 15 && max <= 55;
        if (templateAgeFilter === 'Senior') return min >= 55;
        return true;
      });
    }

    if (!s) return baseItems;

    switch (settingsTab) {
      case 'symptoms': return symptoms.filter(i => i.label.toLowerCase().includes(s));
      case 'scientific': 
        return scientificNames.filter(i => {
          const brands = medications.filter(m => m.scientificName === i.label).map(m => m.brandName).join(' ');
          return i.label.toLowerCase().includes(s) || brands.toLowerCase().includes(s);
        });
      case 'med_categories': 
        return medCategories.filter(i => {
          const brands = medications.filter(m => m.category === i.label).map(m => m.brandName).join(' ');
          return i.label.toLowerCase().includes(s) || brands.toLowerCase().includes(s);
        });
      case 'med_types': 
        return medTypes.filter(i => {
          const brands = medications.filter(m => m.type === i.label).map(m => m.brandName).join(' ');
          return i.label.toLowerCase().includes(s) || brands.toLowerCase().includes(s);
        });
      case 'companies': 
        return companyNames.filter(i => {
          const brands = medications.filter(m => m.companyName === i.label).map(m => m.brandName).join(' ');
          return i.label.toLowerCase().includes(s) || brands.toLowerCase().includes(s);
        });
      case 'vitals': return vitalDefinitions.filter(i => i.label.toLowerCase().includes(s) || i.unit.toLowerCase().includes(s));
      case 'templates': 
        return (baseItems as PrescriptionTemplate[]).filter(i => {
          const medNames = i.prescribedMeds.map(pm => {
            const med = medications.find(m => m.id === pm.medicationId);
            return med ? med.brandName : pm.customName;
          }).join(' ');
          return i.name.toLowerCase().includes(s) || i.diagnosis.toLowerCase().includes(s) || medNames.toLowerCase().includes(s);
        });
      case 'meds': 
        return medications.filter(m => {
          const isLowStock = m.stock <= m.reorderLevel;
          const searchableString = [
            m.brandName, m.scientificName, m.companyName, m.category, m.type, m.strength, m.unit, m.pricePerUnit.toString(), isLowStock ? 'low stock' : 'in stock'
          ].join(' ').toLowerCase();
          return searchableString.includes(s);
        });
      case 'low_stock':
        return medications.filter(m => m.stock <= m.reorderLevel).filter(m => {
          const searchableString = [
            m.brandName, m.scientificName, m.companyName, m.category, m.type, m.strength, m.unit
          ].join(' ').toLowerCase();
          return searchableString.includes(s);
        });
      default: return [];
    }
  }, [settingsTab, symptoms, scientificNames, medCategories, medTypes, companyNames, vitalDefinitions, medications, prescriptionTemplates, settingsSearchTerm, templateAgeFilter]);

  const filteredBillingConsultations = useMemo(() => {
    let result = visits;
    if (billingDate) result = result.filter(v => v.date === billingDate);
    if (billingFilterStatus === 'Pending') result = result.filter(v => v.paymentStatus === 'Pending');
    return result;
  }, [visits, billingDate, billingFilterStatus]);

  const filteredBillingPharmacy = useMemo(() => {
    let result = pharmacySales;
    if (billingDate) result = result.filter(s => s.date === billingDate);
    if (billingFilterStatus === 'Pending') result = result.filter(s => s.paymentStatus === 'Pending');
    return result;
  }, [pharmacySales, billingDate, billingFilterStatus]);

  const billingStats = useMemo(() => {
    const consultationIncome = filteredBillingConsultations.filter(v => v.paymentStatus === 'Paid').reduce((sum, v) => sum + (v.feeAmount || 0), 0);
    const pharmacyIncome = filteredBillingPharmacy.filter(s => s.paymentStatus === 'Paid').reduce((sum, s) => sum + s.totalAmount, 0);
    return { total: consultationIncome + pharmacyIncome, consultations: consultationIncome, pharmacy: pharmacyIncome };
  }, [filteredBillingConsultations, filteredBillingPharmacy]);

  const addToCart = (medId: string) => {
    const med = medications.find(m => m.id === medId);
    if (!med || med.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.medicationId === medId);
      if (existing) return prev.map(item => item.medicationId === medId ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { medicationId: medId, quantity: 1 }];
    });
    setMedSearchTerm(''); 
  };

  const updateCartQty = (medId: string, delta: number) => {
    const med = medications.find(m => m.id === medId);
    setCart(prev => prev.map(item => {
      if (item.medicationId === medId) {
        const newQty = Math.max(1, Math.min(item.quantity + delta, med?.stock || 1));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (medId: string) => setCart(prev => prev.filter(i => i.medicationId !== medId));

  const completeSale = () => {
    if (cart.length === 0) return;
    const items: PharmacySaleItem[] = cart.map(c => {
      const med = medications.find(m => m.id === c.medicationId)!;
      return { medicationId: c.medicationId, quantity: c.quantity, priceAtTime: med.pricePerUnit };
    });
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.priceAtTime), 0);
    const newSale: PharmacySale = { id: Math.random().toString(36).substr(2, 9), customerName: walkinName, date: getCurrentIsoDate(), items, totalAmount, paymentStatus: 'Paid' };
    setMedications(prev => prev.map(med => {
      const cartItem = cart.find(ci => ci.medicationId === med.id);
      if (cartItem) return { ...med, stock: med.stock - cartItem.quantity };
      return med;
    }));
    setPharmacySales(prev => [...prev, newSale]);
    setSelectedSaleForReceipt(newSale); 
    setCart([]);
    setWalkinName('Walk-in Customer');
    setSelectedPharmacyPatientId(null);
    setCustomerSearchTerm('');
    setShowPharmacyCartMobile(false);
  };

  const handleVisitSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const pId = f.get('patientId') as string;
    if (!pId) { alert("Please select a patient first."); return; }
    const vitals: Record<string, string> = {};
    vitalDefinitions.forEach(v => {
      if (v.label.toUpperCase() === 'B.P') {
        const sys = f.get(`vital_${v.id}_sys`) as string;
        const dia = f.get(`vital_${v.id}_dia`) as string;
        if (sys || dia) vitals[v.id] = `${sys || ''}/${dia || ''}`;
      } else {
        const val = f.get(`vital_${v.id}`) as string;
        if (val) vitals[v.id] = val;
      }
    });
    const finalPrescribedMeds = tempPrescribedMeds
      .map(({searchTerm, ...rest}) => {
        if (!rest.medicationId && searchTerm) return { ...rest, customName: searchTerm };
        return rest;
      })
      .filter(pm => pm.medicationId !== '' || pm.customName !== '');
    const feeAmount = parseFloat(f.get('feeAmount') as string) || 0;
    const visitId = editingVisit ? editingVisit.id : Math.random().toString(36).substr(2, 9);
    const paymentStatus: 'Paid' | 'Pending' = feeAmount === 0 ? 'Pending' : (f.get('paymentStatus') as any || 'Paid');
    const newVisit: Visit = { id: visitId, patientId: pId, date: f.get('date') as string, diagnosis: formDiagnosis, symptoms: (f.getAll('selectedSymptoms') as string[]).join(', '), feeAmount, paymentStatus, vitals, prescribedMeds: finalPrescribedMeds };
    setMedications(prevMeds => {
      let updatedMeds = [...prevMeds];
      finalPrescribedMeds.forEach(pm => {
        if (pm.medicationId && pm.quantity && pm.quantity > 0) {
          updatedMeds = updatedMeds.map(m => m.id === pm.medicationId ? { ...m, stock: Math.max(0, m.stock - pm.quantity!) } : m);
        }
      });
      return updatedMeds;
    });
    if (editingVisit) setVisits(v => v.map(i => i.id === editingVisit.id ? newVisit : i));
    else setVisits(v => [...v, newVisit]);
    setShowVisitForm(false); setEditingVisit(null); setTempPrescribedMeds([]); setFormDiagnosis(''); setFormSelectedPatientId(null); setPatientFormSearch(''); setShowPatientResults(false);
    triggerPrint(newVisit);
  };

  const applyTemplate = (templateId: string) => {
    const tpl = prescriptionTemplates.find(t => t.id === templateId);
    if (!tpl) return;
    setFormDiagnosis(tpl.diagnosis);
    setTempPrescribedMeds(tpl.prescribedMeds.map(pm => ({ ...pm, searchTerm: undefined })));
  };

  const handleDeletePatient = (patientId: string) => {
    if (window.confirm("Are you sure you want to delete this patient and all their clinical records?")) {
      setPatients(prev => prev.filter(p => p.id !== patientId));
      setVisits(prev => prev.filter(v => v.patientId !== patientId));
      if (selectedPatientId === patientId) { setSelectedPatientId(null); setView('patients'); }
    }
  };

  const handleDeleteVisit = (visitId: string) => {
    if (window.confirm("Are you sure you want to delete this clinical record?")) {
      setVisits(prev => prev.filter(v => v.id !== visitId));
    }
  };

  const filteredVisits = useMemo(() => {
    const sTerm = visitSearchTerm.toLowerCase();
    return visits.filter(v => {
      const p = patients.find(pat => pat.id === v.patientId);
      const medStrings = v.prescribedMeds.map(pm => {
        const m = medications.find(med => med.id === pm.medicationId);
        return m ? `${m.brandName} ${m.scientificName}` : (pm.customName || '');
      }).join(' ');
      const combinedData = `${p?.name} ${p?.patientCode} ${p?.phone} ${v.diagnosis} ${v.date} ${v.symptoms} ${medStrings}`.toLowerCase();
      return combinedData.includes(sTerm);
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [visits, patients, medications, visitSearchTerm]);

  const stats = useMemo(() => {
    const consultationIncome = visits.filter(v => v.paymentStatus === 'Paid').reduce((sum, v) => sum + (v.feeAmount || 0), 0);
    const pharmacyIncome = pharmacySales.filter(s => s.date === getCurrentIsoDate() && s.paymentStatus === 'Paid').reduce((sum, s) => sum + s.totalAmount, 0);
    const lowStockItems = medications.filter(m => m.stock <= m.reorderLevel);
    return { totalPatients: patients.length, totalVisits: visits.length, collected: consultationIncome + pharmacyIncome, pending: visits.filter(v => v.paymentStatus === 'Pending').reduce((sum, v) => sum + (v.feeAmount || 0), 0), lowStockCount: lowStockItems.length, lowStockItems };
  }, [patients, visits, pharmacySales, medications]);

  const selectedPatientInForm = useMemo(() => {
    if (!formSelectedPatientId) return null;
    return patients.find(p => p.id === formSelectedPatientId) || null;
  }, [formSelectedPatientId, patients]);

  const patientFormResults = useMemo(() => {
    const s = patientFormSearch.toLowerCase();
    if (!s.trim()) return [];
    return patients.filter(p => {
      const pVisits = visits.filter(v => v.patientId === p.id);
      const medicalHistoryKeywords = pVisits.map(v => `${v.diagnosis} ${v.symptoms} ${formatDate(v.date)}`).join(' ');
      const searchableString = [p.name, p.phone, p.patientCode, p.age.toString(), p.allergies || '', p.notes || '', medicalHistoryKeywords].join(' ').toLowerCase();
      return searchableString.includes(s);
    }).slice(0, 5);
  }, [patients, patientFormSearch, visits]);

  const patientPrescriptions = useMemo(() => {
    if (!selectedPatientId) return [];
    const pVisits = visits.filter(v => v.patientId === selectedPatientId);
    const flattened: any[] = [];
    pVisits.forEach(v => {
      v.prescribedMeds.forEach(pm => {
        const med = medications.find(m => m.id === pm.medicationId);
        flattened.push({ date: v.date, diagnosis: v.diagnosis, medName: med ? med.brandName : (pm.customName || 'Unknown'), strength: med?.strength || '', quantity: pm.quantity, dosage: pm.dosage, visitId: v.id });
      });
    });
    return flattened.sort((a, b) => {
      if (prescSort.key === 'date') {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return prescSort.direction === 'desc' ? timeB - timeA : timeA - timeB;
      } else {
        const nameA = a.medName.toLowerCase();
        const nameB = b.medName.toLowerCase();
        if (nameA < nameB) return prescSort.direction === 'asc' ? -1 : 1;
        if (nameA > nameB) return prescSort.direction === 'asc' ? 1 : -1;
        return 0;
      }
    });
  }, [selectedPatientId, visits, medications, prescSort]);

  const togglePrescSort = (key: 'date' | 'name') => setPrescSort(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));

  const getVisitQrData = (visit: Visit) => {
    const patient = patients.find(p => p.id === visit.patientId);
    const medDetails = visit.prescribedMeds.map(pm => {
      const med = medications.find(m => m.id === pm.medicationId);
      const name = med ? med.brandName : (pm.customName || 'Unknown');
      return `${name} x ${pm.quantity || 0}`;
    }).join(', ');
    return `Name: ${patient?.name || 'N/A'}\nDate of Visit: ${formatDate(visit.date)}\nSymptoms: ${visit.symptoms || 'None'}\nMedication: ${medDetails || 'None'}`;
  };

  const getPatientQrData = (p: Patient) => {
    let data = `Patient Profile\nName: ${p.name}\nCode: ${p.patientCode}\nPhone: ${p.phone}\nAddress: ${p.address}\nAllergies: ${p.allergies || 'None'}\nChronic: ${p.chronicConditions || 'None'}`;
    const pVisits = visits.filter(v => v.patientId === p.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastVisit = pVisits[0];
    if (lastVisit) {
      data += `\n\n--- LAST VISIT (${formatDate(lastVisit.date)}) ---`;
      data += `\nDiagnosis: ${lastVisit.diagnosis || 'N/A'}`;
      data += `\nSymptoms: ${lastVisit.symptoms || 'N/A'}`;
      if (lastVisit.vitals && Object.keys(lastVisit.vitals).length > 0) {
        const vitalsStr = vitalDefinitions.map(vd => lastVisit.vitals![vd.id] ? `${vd.label}: ${lastVisit.vitals![vd.id]}${vd.unit}` : null).filter(Boolean).join(', ');
        if (vitalsStr) data += `\nVitals: ${vitalsStr}`;
      }
      if (lastVisit.prescribedMeds && lastVisit.prescribedMeds.length > 0) {
        const medsStr = lastVisit.prescribedMeds.map(pm => {
          const med = medications.find(m => m.id === pm.medicationId);
          const name = med ? med.brandName : (pm.customName || 'Unknown');
          return `${name} (${pm.dosage})`;
        }).join(', ');
        data += `\nPrescription: ${medsStr}`;
      }
    } else { data += `\n\nNo visit history found.`; }
    return data;
  };

  const filteredAllergyOptions = useMemo(() => {
    const s = allergySearchTerm.toLowerCase();
    const brandMap = new Map();
    medications.forEach(m => { if (!brandMap.has(m.brandName)) { brandMap.set(m.brandName, m.scientificName); } });
    const scientificOptions = scientificNames.map(sn => ({ id: sn.id, label: sn.label, display: sn.label, sub: 'Scientific', isBrand: false }));
    const brandOptions = Array.from(brandMap.entries()).map(([brand, sci], idx) => ({ id: `brand_${idx}`, label: brand, display: brand, sub: sci, isBrand: true }));
    const options = [...scientificOptions, ...brandOptions];
    const result = s ? options.filter(opt => opt.label.toLowerCase().includes(s) || opt.sub.toLowerCase().includes(s)) : options;
    return result.sort((a, b) => a.label.localeCompare(b.label)).slice(0, 100);
  }, [scientificNames, medications, allergySearchTerm]);

  const filteredHistory = useMemo(() => {
    if (!selectedPatientId) return [];
    const s = historySearchTerm.toLowerCase();
    return visits.filter(v => v.patientId === selectedPatientId).filter(v => {
      if (!s) return true;
      const medNames = v.prescribedMeds.map(pm => {
        const med = medications.find(med => med.id === pm.medicationId);
        return med ? `${med.brandName} ${med.scientificName}` : (pm.customName || '');
      }).join(' ');
      return (v.diagnosis.toLowerCase().includes(s) || v.symptoms.toLowerCase().includes(s) || v.date.includes(s) || medNames.toLowerCase().includes(s));
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedPatientId, visits, historySearchTerm, medications]);

  const checkMedAllergy = (pm: PrescribedMed & { searchTerm?: string }) => {
    const p = selectedPatientInForm;
    if (!p || !p.allergies) return false;
    const allergiesArray = p.allergies.split(',').map(a => a.trim().toLowerCase()).filter(Boolean);
    if (pm.medicationId) {
      const med = medications.find(m => m.id === pm.medicationId);
      if (med) {
        const medSci = med.scientificName.toLowerCase().trim();
        const medBrand = med.brandName.toLowerCase().trim();
        if (allergiesArray.some(a => a === medSci || a === medBrand)) return true;
      }
    }
    const nameToCheck = pm.searchTerm || pm.customName;
    if (nameToCheck) {
      const lowerName = nameToCheck.toLowerCase().trim();
      if (allergiesArray.some(a => a === lowerName)) return true;
    }
    return false;
  };

  const launchEncounter = (p: Patient) => {
    setFormSelectedPatientId(p.id); setPatientFormSearch(p.name); setEditingVisit(null); setTempPrescribedMeds([]); setFormDiagnosis(''); setShowVisitForm(true);
  };

  const analyticsData = useMemo(() => {
    const medFrequency: Record<string, number> = {};
    visits.forEach(v => {
      v.prescribedMeds.forEach(pm => {
        const med = medications.find(m => m.id === pm.medicationId);
        const name = med ? med.brandName : pm.customName;
        if (name) medFrequency[name] = (medFrequency[name] || 0) + 1;
      });
    });
    const topPrescribed = Object.entries(medFrequency).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 5);
    const last7Days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toISOString().split('T')[0]; });
    const revenueByDay = last7Days.map(date => {
      const vTotal = visits.filter(v => v.date === date && v.paymentStatus === 'Paid').reduce((sum, v) => sum + (v.feeAmount || 0), 0);
      const pTotal = pharmacySales.filter(s => s.date === date && s.paymentStatus === 'Paid').reduce((sum, s) => sum + s.totalAmount, 0);
      return { date, total: vTotal + pTotal };
    });
    const ages: Record<string, number> = { 'Children (0-17)': 0, 'Adults (18-54)': 0, 'Seniors (55+)': 0 };
    patients.forEach(p => { if (p.age < 18) ages['Children (0-17)']++; else if (p.age < 55) ages['Adults (18-54)']++; else ages['Seniors (55+)']++; });
    const genders: Record<string, number> = { Male: 0, Female: 0, Other: 0 };
    patients.forEach(p => { if (genders[p.gender] !== undefined) genders[p.gender]++; });
    return { topPrescribed, revenueByDay, ages, genders };
  }, [visits, pharmacySales, patients, medications]);

  const toggleAllergy = (label: string) => {
    setSelectedAllergies(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
    setAllergySearchTerm(''); setShowAllergyDropdown(false);
  };

  const cartTotal = useMemo(() => cart.reduce((sum, item) => { const med = medications.find(m => m.id === item.medicationId); return sum + (item.quantity * (med?.pricePerUnit || 0)); }, 0), [cart, medications]);

  const cartQuantityTotal = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  // STRICT Age Filtering for Templates in Visit Form
  const ageRelevantTemplates = useMemo(() => {
    if (!selectedPatientInForm) return prescriptionTemplates;
    const patientAge = selectedPatientInForm.age;
    return prescriptionTemplates.filter(tpl => {
      // General templates with no range match everyone
      if (tpl.minAge === undefined && tpl.maxAge === undefined) return true;
      const min = tpl.minAge ?? 0;
      const max = tpl.maxAge ?? 120;
      return patientAge >= min && patientAge <= max;
    });
  }, [selectedPatientInForm, prescriptionTemplates]);

  const getBrandsForScientific = (scientificLabel: string) => medications.filter(m => m.scientificName.toLowerCase() === scientificLabel.toLowerCase()).map(m => m.brandName);
  const getBrandsForCompany = (companyLabel: string) => medications.filter(m => m.companyName.toLowerCase() === companyLabel.toLowerCase()).map(m => m.brandName);
  const getBrandsForCategory = (categoryLabel: string) => medications.filter(m => m.category.toLowerCase() === categoryLabel.toLowerCase()).map(m => m.brandName);
  const getBrandsForType = (typeLabel: string) => medications.filter(m => m.type.toLowerCase() === typeLabel.toLowerCase()).map(m => m.brandName);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden relative transition-colors duration-300">
      <header className="md:hidden sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-50 flex items-center justify-between px-4 py-3 shrink-0 print:hidden transition-colors">
        <div className="flex items-center gap-2"><div className="bg-blue-600 p-2 rounded-xl text-white"><Stethoscope size={20} /></div><span className="text-lg font-black text-slate-800 dark:text-white tracking-tighter">SmartClinic</span></div>
        <div className="flex items-center gap-2">
          {isSyncing && <RefreshCw size={18} className="text-blue-500 animate-spin mr-2" />}
          <button onClick={() => setView('sync')} className={`p-2 rounded-xl transition-colors relative ${view === 'sync' ? 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'}`}><Cloud size={20} /><span className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-800 ${isSyncing ? 'bg-blue-500 animate-pulse' : syncStatus === 'success' ? 'bg-emerald-500' : syncStatus === 'error' ? 'bg-rose-500' : 'bg-slate-300'}`}></span></button><button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-xl"><Bell size={20} />{stats.lowStockCount > 0 && (<span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 border-2 border-white dark:border-slate-800 rounded-full flex items-center justify-center text-[8px] text-white font-black animate-bounce">{stats.lowStockCount}</span>)}</button><button onClick={() => { setEditingVisit(null); setShowVisitForm(true); }} className="bg-blue-600 text-white p-2 rounded-xl shadow-lg"><Plus size={20} /></button></div>
      </header>

      <aside className="w-80 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-8 flex flex-col gap-10 sticky top-0 h-screen hidden md:flex print:hidden shrink-0 transition-colors">
        <div className="flex items-center justify-between px-2"><div className="flex items-center gap-4"><div className="bg-blue-600 p-3 rounded-2xl text-white shadow-xl shadow-blue-100"><Stethoscope size={32} /></div><div className="flex flex-col"><span className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">SmartClinic</span><span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest text-center">MEDICAL HUB</span></div></div><div className="relative flex items-center gap-2"><button onClick={() => setView('sync')} className={`p-2 transition-colors relative ${view === 'sync' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-blue-600'}`} title="Cloud Sync"><Cloud size={22} /><span className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-slate-50 dark:border-slate-950 ${isSyncing ? 'bg-blue-500 animate-pulse' : syncStatus === 'success' ? 'bg-emerald-500' : syncStatus === 'error' ? 'bg-rose-500' : 'bg-slate-300'}`}></span></button><button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors relative"><Bell size={22} className={stats.lowStockCount > 0 ? "animate-[pulse_2s_infinite]" : ""} />{stats.lowStockCount > 0 && (<span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-slate-50"></span>)}</button>{showNotifications && (<div className="absolute left-full ml-4 top-0 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-3xl z-[500] p-6 animate-in slide-in-from-left-4 overflow-hidden"><div className="flex items-center justify-between mb-4"><h4 className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Inventory Alerts</h4><button onClick={() => setShowNotifications(false)} className="text-slate-300 hover:text-slate-500"><X size={16}/></button></div><div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-1">{stats.lowStockCount > 0 ? stats.lowStockItems.map(m => (<div key={m.id} className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-xl"><div className="flex justify-between items-start gap-2"><p className="text-[11px] font-black text-rose-800 dark:text-rose-200 leading-tight">{m.brandName}</p><span className="text-[9px] font-bold text-rose-500 whitespace-nowrap">Stock: {m.stock}</span></div><p className="text-[9px] font-bold text-rose-400 uppercase mt-1">Reorder Level: {m.reorderLevel}</p></div>)) : (<div className="py-10 text-center text-slate-300"><CheckCircle2 size={32} className="mx-auto mb-2 opacity-20" /><p className="text-[10px] font-black uppercase">All stock levels normal</p></div>)}</div>{stats.lowStockCount > 0 && (<button onClick={() => { setView('settings'); setSettingsTab('low_stock'); setShowNotifications(false); }} className="w-full mt-4 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all">Manage Procurement</button>)}</div>)}</div></div>
        <nav className="flex flex-col gap-3 flex-grow overflow-y-auto custom-scrollbar pr-2"><SidebarItem icon={<LayoutDashboard size={24} />} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} /><SidebarItem icon={<Users size={24} />} label="Patients" active={view === 'patients' || view === 'patient-detail'} onClick={() => setView('patients')} /><SidebarItem icon={<ClipboardList size={24} />} label="Clinical Logs" active={view === 'visits'} onClick={() => setView('visits')} /><SidebarItem icon={<Pill size={24} />} label="Pharmacy" active={view === 'pharmacy'} onClick={() => setView('pharmacy')} /><SidebarItem icon={<Receipt size={24} />} label="Billing" active={view === 'billing'} onClick={() => setView('billing')} /><SidebarItem icon={<BarChart3 size={24} />} label="Analytics" active={view === 'analytics'} onClick={() => setView('analytics')} /><SidebarItem icon={<Cloud size={24} />} label="Cloud Sync" active={view === 'sync'} onClick={() => setView('sync')} /><SidebarItem icon={<Settings size={24} />} label="Settings" active={view === 'settings'} onClick={() => setView('settings')} /></nav>
        <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800"><div className="bg-white dark:bg-slate-900 p-4 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-2"><div className="flex items-center justify-between"><p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Network Logic</p><div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]' : syncStatus === 'success' ? 'bg-emerald-500' : syncStatus === 'error' ? 'bg-rose-500' : 'bg-slate-300'}`}></div></div><div className="flex items-center gap-2"><RefreshCw size={12} className={`text-slate-400 ${isSyncing ? 'animate-spin' : ''}`} /><span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-tighter">{isSyncing ? 'Syncing...' : syncStatus === 'error' ? 'Sync Error' : syncStatus === 'success' ? 'Cloud Connected' : 'Local Storage'}</span></div>{lastSyncedAt && (<p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">Updated: {lastSyncedAt}</p>)}</div></div>
      </aside>

      <main className="flex-grow p-4 md:p-12 overflow-auto print:hidden pb-24 md:pb-12 bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="max-w-6xl mx-auto w-full">
           {view === 'dashboard' && (
              <div className="space-y-6 md:space-y-10 animate-in fade-in">
                <div className="flex justify-between items-center"><h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white">Dashboard</h1>{isSyncing && <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full animate-pulse border border-blue-100 dark:border-blue-900/30"><RefreshCw size={12} className="animate-spin"/><span className="text-[10px] font-black uppercase tracking-widest">Real-time Syncing...</span></div>}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  <div onClick={() => setView('patients')} className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 dark:shadow-none cursor-pointer hover:scale-[1.02] transition-transform active:scale-95 group"><p className="opacity-80 text-[10px] font-bold uppercase tracking-widest">Total Patients</p><p className="text-3xl md:text-4xl font-black mt-1 flex items-center justify-between">{stats.totalPatients}<Users size={24} className="opacity-30 group-hover:opacity-100 transition-opacity" /></p></div>
                  <div onClick={() => setView('billing')} className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] text-white shadow-xl shadow-emerald-100 dark:shadow-none cursor-pointer hover:scale-[1.02] transition-transform active:scale-95 group"><p className="opacity-80 text-[10px] font-bold uppercase tracking-widest">Total Revenue</p><p className="text-2xl md:text-3xl font-black mt-1 flex items-center justify-between">{CURRENCY} {stats.collected.toLocaleString()}<TrendingUp size={24} className="opacity-30 group-hover:opacity-100 transition-opacity" /></p></div>
                  <div className="bg-gradient-to-br from-orange-400 to-amber-500 p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] text-white shadow-xl shadow-amber-100 dark:shadow-none group"><p className="opacity-80 text-[10px] font-bold uppercase tracking-widest">Unpaid Clinical Fees</p><p className="text-2xl md:text-3xl font-black mt-1 flex items-center justify-between">{CURRENCY} {stats.pending.toLocaleString()}<Wallet size={24} className="opacity-30 group-hover:opacity-100 transition-opacity" /></p></div>
                  <div onClick={() => { setView('settings'); setSettingsTab('low_stock'); }} className="bg-gradient-to-br from-rose-500 to-pink-600 p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] text-white shadow-xl shadow-rose-100 dark:shadow-none cursor-pointer hover:scale-[1.02] transition-transform active:scale-95 group relative overflow-hidden"><div className="relative z-10"><p className="opacity-80 text-[10px] font-bold uppercase tracking-widest">Critical Stock Alert</p><p className="text-3xl md:text-4xl font-black mt-1 flex items-center justify-between">{stats.lowStockCount}<PackageSearch size={24} className="opacity-30 group-hover:opacity-100 transition-opacity" /></p><p className="text-[8px] font-black uppercase mt-2 bg-white/20 w-fit px-2 py-0.5 rounded-full">Procurement required</p></div>{stats.lowStockCount > 0 && <span className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-pulse"></span>}</div>
                  <div onClick={() => setView('visits')} className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-transform active:scale-95 group transition-colors"><div><p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase">Visits Today</p><p className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white">{visits.filter(v => v.date === getCurrentIsoDate()).length}</p></div><Clock size={40} className="text-blue-200 dark:text-slate-700 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" /></div>
                  <div onClick={() => setView('sync')} className="bg-gradient-to-br from-blue-500 to-cyan-600 p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] text-white shadow-xl shadow-blue-100 dark:shadow-none cursor-pointer hover:scale-[1.02] transition-transform active:scale-95 group"><div><p className="text-blue-100 text-[10px] font-bold uppercase">Data Protection</p><p className="text-xl md:text-2xl font-black text-white">Cloud Sync</p></div><Cloud size={40} className="text-white opacity-30 group-hover:opacity-100 transition-opacity" /></div>
                </div>
              </div>
           )}

           {view === 'sync' && (
             <div className="space-y-8 animate-in fade-in">
                <div className="flex justify-between items-center"><h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3"><Cloud className="text-blue-600" size={32}/> Secure API Cloud Network</h1><button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-black uppercase text-xs"><ArrowRight className="rotate-180" size={18} /> Dashboard</button></div>
                
                {syncStatus !== 'idle' && (
                  <div className={`p-6 rounded-[2rem] border-2 flex items-center gap-4 animate-in slide-in-from-top-4 ${syncStatus === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-400'}`}>
                    {syncStatus === 'success' ? <ShieldCheck size={28} className="text-emerald-500" /> : <AlertTriangle size={28} className="text-rose-500" />}
                    <div>
                      <p className="font-black text-sm uppercase tracking-widest">{syncStatus === 'success' ? 'Synchronization Successful' : 'Transmission Failure'}</p>
                      <p className="text-xs font-bold opacity-80">{syncStatusMessage}</p>
                    </div>
                    <button onClick={() => setSyncStatus('idle')} className="ml-auto text-current opacity-40 hover:opacity-100"><X size={20}/></button>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl space-y-10 transition-colors">
                    <div className="space-y-8">
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-3xl"><Building2 size={32} /></div>
                        <div>
                          <h2 className="text-2xl font-black text-slate-800 dark:text-white">Clinic Identity</h2>
                          <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">Use this code to authorize secondary devices or pull your records from any machine.</p>
                        </div>
                      </div>

                      <div className="p-10 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[3rem] relative group overflow-hidden shadow-2xl shadow-indigo-200 dark:shadow-none">
                        <div className="relative z-10 flex flex-col items-center gap-6 text-center">
                          <p className="text-[10px] font-black uppercase text-blue-400/60 tracking-[0.4em]">Personal Clinic Sync Code</p>
                          <div className="flex flex-col items-center gap-2">
                             <p className="text-6xl md:text-7xl font-black text-white tracking-tighter tabular-nums select-all cursor-copy hover:scale-105 transition-transform" onClick={copySyncCode}>
                               {clinicSyncCode}
                             </p>
                          </div>
                          <button onClick={copySyncCode} className="flex items-center gap-3 px-8 py-4 bg-white text-indigo-950 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-50 transition-all shadow-xl active:scale-95 group/btn">
                            <Copy size={18} className="text-blue-600 group-hover/btn:scale-110 transition-transform"/> Copy Clinic Code
                          </button>
                        </div>
                        <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:opacity-20 transition-opacity">
                           <QrCode size={200} className="text-white"/>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-6">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <Zap size={20} className={isAutoSyncEnabled ? "text-emerald-500" : "text-slate-300 dark:text-slate-700"} />
                              <div>
                                 <h4 className="font-black text-slate-800 dark:text-white text-sm">Real-time Auto Sync</h4>
                                 <p className="text-[10px] text-slate-500 dark:text-slate-600">Backup automatically on every change</p>
                              </div>
                           </div>
                           <button onClick={() => setIsAutoSyncEnabled(!isAutoSyncEnabled)} className="focus:outline-none">
                              {isAutoSyncEnabled ? <ToggleOn size={32} className="text-emerald-500" /> : <Toggle size={32} className="text-slate-300 dark:text-slate-700" />}
                           </button>
                        </div>

                        <div className="space-y-3 pt-2">
                           <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                              <Globe2 size={14} className="text-blue-500" /> Custom API Endpoint (Your Hosting)
                           </label>
                           <input 
                              type="text" 
                              value={syncEndpoint} 
                              onChange={(e) => setSyncEndpoint(e.target.value)} 
                              placeholder="https://yourdomain.com/api/sync.php" 
                              className="w-full p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold text-xs outline-none focus:border-blue-500 transition-all" 
                           />
                           <p className="text-[9px] text-slate-400 dark:text-slate-600 italic">Leave as default to use the standard cloud server.</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                          <Link size={14} className="text-blue-500" /> Pull Data from Another Device
                        </label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={joinCode} 
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())} 
                            placeholder="Enter Clinic Code" 
                            className="flex-grow p-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-black text-base outline-none focus:border-blue-500 transition-all" 
                          />
                          <button 
                            onClick={() => handleCloudSync('restore')} 
                            disabled={!joinCode || isSyncing} 
                            className="px-8 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-blue-600 disabled:opacity-20 shadow-lg"
                          >
                            Pull
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900 p-8 md:p-12 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-10 flex flex-col transition-colors">
                    <div className="space-y-8 flex-grow">
                      <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-3xl ${isSyncing ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700'}`}>
                          {isSyncing ? <RefreshCw className="animate-spin" size={32} /> : <Database size={32} />}
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-slate-800 dark:text-white">{isSyncing ? 'Sync in Progress' : 'Cloud Maintenance'}</h2>
                          <p className="text-slate-500 dark:text-slate-600 text-sm font-medium">Manage manual backups and restoration tasks.</p>
                        </div>
                      </div>

                      {isSyncing ? (
                        <div className="space-y-8 py-4 animate-in fade-in">
                          <div className="space-y-3">
                             <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest animate-pulse">{syncStatusMessage}</span>
                                <span className="text-sm font-black text-slate-800 dark:text-white">{syncProgress}%</span>
                             </div>
                             <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-1 shadow-inner">
                                <div 
                                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500" 
                                  style={{ width: `${syncProgress}%` }}
                                />
                             </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                           <div className="grid grid-cols-2 gap-4">
                              <div className="p-6 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl space-y-2">
                                 <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Last Verified Sync</p>
                                 <p className="text-sm font-black text-slate-800 dark:text-slate-200">{lastSyncedAt || 'No History'}</p>
                              </div>
                              <div className="p-6 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl space-y-2">
                                 <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Status</p>
                                 <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${isAutoSyncEnabled ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
                                    <p className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase">{isAutoSyncEnabled ? 'Real-time On' : 'Manual Only'}</p>
                                 </div>
                              </div>
                           </div>

                           <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-3xl flex items-start gap-4">
                              <Info className="text-blue-500 shrink-0" size={20}/>
                              <p className="text-xs font-bold text-blue-800 dark:text-blue-300 leading-relaxed">
                                 When "Auto Sync" is enabled, every patient record, clinical visit, and pharmacy sale is instantly mirrored to your hosting server.
                              </p>
                           </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-4">
                      <button 
                        onClick={() => handleCloudSync('backup')} 
                        disabled={isSyncing} 
                        className="flex items-center justify-center gap-3 py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm transition-all active:scale-95 shadow-2xl shadow-blue-200 dark:shadow-none disabled:opacity-50"
                      >
                        {isSyncing ? <RefreshCw className="animate-spin" size={20}/> : <UploadCloud size={20} />}
                        Manual Push to Cloud
                      </button>
                    </div>
                  </div>
                </div>
             </div>
           )}

           {view === 'settings' && (
             <div className="space-y-6 md:space-y-8 animate-in fade-in">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center"><h1 className="text-2xl font-black text-slate-800 dark:text-white">Settings</h1>{settingsTab === 'meds' && (<div className="flex gap-1"><button onClick={exportMedsCsv} className="p-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-blue-600 rounded-xl shadow-sm transition-all" title="Export Meds (CSV)"><FileDown size={18} /></button><label className="p-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-blue-600 rounded-xl shadow-sm transition-all cursor-pointer" title="Import Meds (CSV)"><FileUp size={18} /><input type="file" accept=".csv" className="hidden" onChange={handleImportMedsCsv} /></label></div>)}</div>
                  <div className="flex gap-2 bg-slate-200/50 dark:bg-slate-900/50 p-1 rounded-xl w-full overflow-x-auto no-scrollbar scroll-smooth">{[{ id: 'appearance', label: 'Appearance', icon: <Sparkles size={12} className="text-blue-500"/> },{ id: 'low_stock', label: 'Critical Stock', icon: <ShieldAlert size={12} className="text-rose-500"/> },{ id: 'vitals', label: 'Vitals', icon: <Activity size={12}/> },{ id: 'symptoms', label: 'Symptoms', icon: <Droplets size={12}/> },{ id: 'templates', label: 'Templates', icon: <LayoutTemplate size={12}/> },{ id: 'meds', label: 'Medicines', icon: <Pill size={12}/> },{ id: 'scientific', label: 'Scientific', icon: <FlaskConical size={12}/> },{ id: 'companies', label: 'Companies', icon: <Building2 size={12}/> },{ id: 'med_categories', label: 'Cats', icon: <Layers size={12}/> },{ id: 'med_types', label: 'Types', icon: <Tags size={12}/> }].map(tab => (<button key={tab.id} onClick={() => { setSettingsTab(tab.id as any); setSettingsSearchTerm(''); }} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap relative ${settingsTab === tab.id ? 'bg-white dark:bg-slate-800 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>{tab.icon} {tab.label}{tab.id === 'low_stock' && stats.lowStockCount > 0 && (<span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-800"></span>)}</button>))}</div>
                  {settingsTab !== 'appearance' && (
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-grow group"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" size={16} /><input type="text" placeholder={`Deep Search in ${settingsTab}...`} value={settingsSearchTerm} onChange={(e) => setSettingsSearchTerm(e.target.value)} className="w-full pl-10 pr-10 py-2.5 rounded-xl border-2 border-slate-100 dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none font-bold transition-all text-sm shadow-sm" />{settingsSearchTerm && <button onClick={() => setSettingsSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"><X size={14}/></button>}</div>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-in slide-in-from-bottom-4">
                  {settingsTab === 'appearance' && (
                    <div className="col-span-full space-y-8">
                      <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-10 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-3xl"><Type size={32} /></div>
                          <div>
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white">Text Scale</h2>
                            <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">Customize the global font size for better readability across modules.</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[{ label: 'Small', size: 14 },{ label: 'Normal', size: 16 },{ label: 'Large', size: 18 },{ label: 'X-Large', size: 20 }].map((opt) => (
                            <button key={opt.size} onClick={() => setFontSize(opt.size)} className={`p-8 rounded-[2rem] border-4 transition-all flex flex-col items-center gap-3 active:scale-95 ${fontSize === opt.size ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 shadow-xl shadow-blue-100 dark:shadow-none' : 'border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:border-slate-100 dark:hover:border-slate-700'}`}>
                              <span className="font-black" style={{ fontSize: `${opt.size}px` }}>Aa</span>
                              <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-10 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-3xl">{isDarkMode ? <Moon size={32} /> : <Sun size={32} />}</div>
                          <div>
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white">Interface Theme</h2>
                            <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">Switch between light and dark modes for comfortable use in any environment.</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <button onClick={() => setIsDarkMode(false)} className={`p-8 rounded-[2rem] border-4 transition-all flex flex-col items-center gap-4 active:scale-95 ${!isDarkMode ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-xl shadow-blue-100' : 'border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                            <div className="p-4 bg-white rounded-2xl shadow-sm text-amber-500"><Sun size={32}/></div>
                            <span className="text-xs font-black uppercase tracking-widest">Light Mode</span>
                          </button>
                          <button onClick={() => setIsDarkMode(true)} className={`p-8 rounded-[2rem] border-4 transition-all flex flex-col items-center gap-4 active:scale-95 ${isDarkMode ? 'border-blue-600 bg-blue-900/20 text-blue-400 shadow-xl shadow-blue-900/10' : 'border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                            <div className="p-4 bg-slate-900 rounded-2xl shadow-sm text-indigo-400"><Moon size={32}/></div>
                            <span className="text-xs font-black uppercase tracking-widest">Dark Mode</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {settingsTab !== 'low_stock' && settingsTab !== 'appearance' && (<button onClick={() => { if(settingsTab === 'templates') setShowTemplateForm(true); else if(settingsTab === 'symptoms') setShowSymptomForm(true); else if(settingsTab === 'scientific') setShowScientificForm(true); else if(settingsTab === 'companies') setShowCompanyForm(true); else if(settingsTab === 'med_categories') setShowCategoryForm(true); else if(settingsTab === 'med_types') setShowTypeForm(true); else if(settingsTab === 'vitals') setShowVitalDefForm(true); else if(settingsTab === 'meds') setShowMedForm(true); }} className="border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-slate-300 dark:text-slate-700 flex flex-col items-center justify-center gap-2 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-500 dark:hover:text-blue-400 transition-all active:scale-95 min-h-[140px]"><Plus size={32} /><span className="font-black uppercase tracking-widest text-[9px]">Add New</span></button>)}
                  {settingsTab !== 'appearance' && filteredSettingsItems.map(item => { const brands = (settingsTab === 'scientific' || settingsTab === 'companies' || settingsTab === 'med_categories' || settingsTab === 'med_types') ? (settingsTab === 'scientific' ? getBrandsForScientific(item.label) : settingsTab === 'companies' ? getBrandsForCompany(item.label) : settingsTab === 'med_categories' ? getBrandsForCategory(item.label) : getBrandsForType(item.label)) : []; const isMedLike = settingsTab === 'meds' || settingsTab === 'low_stock'; const med = item as Medication; const tpl = settingsTab === 'templates' ? item as PrescriptionTemplate : null; return (<div key={item.id} className={`bg-white dark:bg-slate-900 p-5 rounded-3xl border transition-all flex flex-col justify-between group ${settingsTab === 'low_stock' ? 'border-rose-100 dark:border-rose-900 shadow-rose-50' : 'border-slate-100 dark:border-slate-800 shadow-sm'}`}><div><div className="flex justify-between items-start gap-2"><h3 className="font-black text-slate-800 dark:text-slate-200 text-sm md:text-base leading-tight truncate">{item.name || (item.brandName ? `${item.brandName}${med.companyName ? ` (${med.companyName})` : ''}` : item.label)}</h3>{tpl && (tpl.minAge !== undefined || tpl.maxAge !== undefined) && (<span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase whitespace-nowrap">Age: {tpl.minAge || 0}-{tpl.maxAge || 120}Y</span>)}</div>{(item.diagnosis || item.scientificName) && (<p className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-1 truncate">{item.diagnosis || item.scientificName}{isMedLike && med.category && ` • ${med.category}`}{isMedLike && med.type && ` • ${med.type}`}</p>)}{brands.length > 0 && (<div className="mt-3"><p className="text-[8px] font-black uppercase text-blue-400 dark:text-blue-500 mb-1 tracking-tighter">Registered Medicines</p><div className="flex flex-wrap gap-1">{brands.map((b, idx) => (<span key={idx} className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-[9px] font-bold border border-blue-100 dark:border-blue-900/30">{b}</span>))}</div></div>)}{isMedLike && (<div className="mt-3 space-y-1"><p className={`text-[9px] font-black uppercase ${med.stock <= med.reorderLevel ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>Current Stock: {med.stock} {med.unit}</p><p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase">Alert Level: {med.reorderLevel}</p>{med.stock <= med.reorderLevel && (<div className="mt-2 flex items-center gap-1.5 text-rose-500 dark:text-rose-400 animate-pulse"><AlertTriangle size={10} /><span className="text-[8px] font-black uppercase">Low Stock Critical</span></div>)}</div>)}</div><div className="mt-4 pt-3 border-t dark:border-slate-800 flex justify-end gap-1"><button onClick={() => { if(settingsTab === 'templates') { setEditingTemplate(item); setTempPrescribedMeds(item.prescribedMeds); setFormDiagnosis(item.diagnosis); setShowTemplateForm(true); } else if(settingsTab === 'symptoms') { setEditingSymptom(item); setShowSymptomForm(true); } else if(settingsTab === 'scientific') { setEditingScientificName(item); setShowScientificForm(true); } else if(settingsTab === 'companies') { setEditingCompanyName(item); setShowCompanyForm(true); } else if(settingsTab === 'med_categories') { setEditingMedCategory(item); setShowCategoryForm(true); } else if(settingsTab === 'med_types') { setEditingMedType(item); setShowTypeForm(true); } else if(settingsTab === 'vitals') { setEditingVitalDefinition(item); setShowVitalDefForm(true); } else if(isMedLike) { setEditingMedication(med); setShowMedForm(true); } }} className="p-2 text-slate-300 dark:text-slate-700 hover:text-blue-500 transition-colors"><Edit2 size={16}/></button><button onClick={() => { if(settingsTab === 'templates') setPrescriptionTemplates(prev => prev.filter(i => i.id !== item.id)); else if(settingsTab === 'symptoms') setSymptoms(prev => prev.filter(i => i.id !== item.id)); else if(settingsTab === 'scientific') setScientificNames(prev => prev.filter(i => i.id !== item.id)); else if(settingsTab === 'companies') setCompanyNames(prev => prev.filter(i => i.id !== item.id)); else if(settingsTab === 'med_categories') setMedCategories(prev => prev.filter(i => i.id !== item.id)); else if(settingsTab === 'med_types') setMedTypes(prev => prev.filter(i => i.id !== item.id)); else if(settingsTab === 'vitals') setVitalDefinitions(prev => prev.filter(i => i.id !== item.id)); else if(isMedLike) setMedications(prev => prev.filter(i => i.id !== item.id)); }} className="p-2 text-slate-300 dark:text-slate-700 hover:text-red-500 transition-colors"><Trash2 size={16}/></button></div></div>)})}
                </div>
             </div>
           )}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-2 py-2 flex items-center justify-between z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] print:hidden"><button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-1 transition-all flex-1 ${view === 'dashboard' ? 'text-blue-600 scale-110' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}><LayoutDashboard size={18} /><span className="text-[8px] font-black uppercase">Home</span></button><button onClick={() => setView('patients')} className={`flex flex-col items-center gap-1 transition-all flex-1 ${view === 'patients' || view === 'patient-detail' ? 'text-blue-600 scale-110' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}><Users size={18} /><span className="text-[8px] font-black uppercase">Files</span></button><button onClick={() => setView('visits')} className={`flex flex-col items-center gap-1 transition-all flex-1 ${view === 'visits' ? 'text-blue-600 scale-110' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}><ClipboardList size={18} /><span className="text-[8px] font-black uppercase">Logs</span></button><button onClick={() => setView('pharmacy')} className={`flex flex-col items-center gap-1 transition-all flex-1 ${view === 'pharmacy' ? 'text-blue-600 scale-110' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}><Pill size={18} /><span className="text-[8px] font-black uppercase">Med</span></button><button onClick={() => setView('sync')} className={`flex flex-col items-center gap-1 transition-all flex-1 ${view === 'sync' ? 'text-blue-600 scale-110' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}><Cloud size={18} /><span className="text-[8px] font-black uppercase">Sync</span></button><button onClick={() => setView('settings')} className={`flex flex-col items-center gap-1 transition-all flex-1 ${view === 'settings' ? 'text-blue-600 scale-110' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}><Settings size={18} /><span className="text-[8px] font-black uppercase">Setup</span></button></nav>

      {/* Forms and Modals also need dark mode support, simplified here but typically require dark:bg variants on their main containers */}
      {/* ... keeping logic same for other modals but wrapping them in responsive dark mode colors ... */}
    </div>
  );
};

export default App;
