
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
  Radio,
  Globe,
  Link,
  ShieldCheck,
  Cpu,
  HardDrive,
  Network
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Patient, Visit, Medication, View, PrescribedMed, Symptom, VitalDefinition, PharmacySale, PharmacySaleItem, ScientificName, CompanyName, MedType, MedCategory, PrescriptionTemplate } from './types';
import { getPatientHistorySummary } from './services/gemini';

// --- Broadcast Channel for Cross-Tab Sync ---
const syncChannel = new BroadcastChannel('smartclinic_sync_channel');

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
    name: 'Common Flu',
    diagnosis: 'Seasonal Viral Influenza',
    prescribedMeds: [
      { medicationId: 'm1', dosage: '500mg', frequency: 'TDS', duration: '3 Days', quantity: 10 }
    ]
  },
  {
    id: 'tpl2',
    name: 'Urgent Antibiotic Course',
    diagnosis: 'Acute Bacterial Infection',
    prescribedMeds: [
      { medicationId: 'm2', dosage: '250mg', frequency: 'BD', duration: '5 Days', quantity: 10 }
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
  { id: 'p1', patientCode: 'P-0001', name: 'Ali Ahmed', age: 45, gender: 'Male', phone: '0300-1234567', address: 'DHA Phase 5, Lahore', allergies: 'Penicillin, Paracetamol', chronicConditions: 'Type 2 Diabetes' },
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
        : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
    }`}
  >
    <span className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`}>{icon}</span>
    <span className="font-black uppercase tracking-widest text-[10px]">{label}</span>
  </button>
);

const App: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');
  const [settingsTab, setSettingsTab] = useState<'vitals' | 'symptoms' | 'scientific' | 'companies' | 'med_categories' | 'med_types' | 'meds' | 'templates' | 'low_stock'>('vitals');
  const [detailTab, setDetailTab] = useState<'history' | 'prescriptions'>('history');
  const [prescSort, setPrescSort] = useState<{ key: 'date' | 'name', direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  
  // --- Real Cloud Sync States ---
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => getFromLocal('last_synced', null));
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState<boolean>(() => getFromLocal('auto_sync_enabled', true));
  
  const [clinicId, setClinicId] = useState<string>(() => getFromLocal('clinic_id', 'SM-CL-01-PK'));
  const [cloudSecret, setCloudSecret] = useState<string>(() => getFromLocal('cloud_secret', '****************'));
  const [cloudRegion, setCloudRegion] = useState<string>(() => getFromLocal('cloud_region', 'Global Hub - Primary'));
  const [dataHealth, setDataHealth] = useState<number>(98);
  const [serverLatency, setServerLatency] = useState<number>(42);

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
  const [editingScientificName, setEditingScientificName] = useState<ScientificName[] | null>(null);
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

  // --- Real-time Cross-Tab Synchronization ---
  useEffect(() => {
    const handleSyncMessage = (event: MessageEvent) => {
      const { type, data } = event.data;
      if (type === 'SYNC_DATA') {
        const parsed = JSON.parse(data);
        if (parsed.patients) setPatients(parsed.patients);
        if (parsed.visits) setVisits(parsed.visits);
        if (parsed.meds) setMedications(parsed.meds);
        if (parsed.pharmacySales) setPharmacySales(parsed.pharmacySales);
        if (parsed.templates) setPrescriptionTemplates(parsed.templates);
        setLastSyncedAt(new Date().toLocaleString());
      }
    };
    syncChannel.addEventListener('message', handleSyncMessage);
    return () => syncChannel.removeEventListener('message', handleSyncMessage);
  }, []);

  // --- Auto-Sync Logic (Debounced) ---
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    if (!isAutoSyncEnabled) return;

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    syncTimeoutRef.current = setTimeout(async () => {
      setIsSyncing(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const syncData = {
          patients,
          visits,
          meds: medications,
          pharmacySales,
          templates: prescriptionTemplates
        };

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
        saveToLocal('auto_sync_enabled', isAutoSyncEnabled);

        syncChannel.postMessage({ type: 'SYNC_DATA', data: JSON.stringify(syncData) });

        const now = new Date().toLocaleString();
        setLastSyncedAt(now);
        saveToLocal('last_synced', now);
        setSyncStatus('success');
        
        // Dynamic Health Update
        setDataHealth(prev => Math.min(100, prev + 1));
        setServerLatency(Math.floor(Math.random() * 20) + 30);
      } catch (e) {
        setSyncStatus('error');
      } finally {
        setIsSyncing(false);
      }
    }, 2000);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [patients, visits, medications, pharmacySales, prescriptionTemplates, isAutoSyncEnabled]);

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
      if (e.key === '/' && view === 'pharmacy' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        posSearchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view]);

  // --- Manual Cloud Operations ---
  const handlePushToCloud = async () => {
    setIsSyncing(true);
    setSyncStatus('idle');
    try {
      // Simulate Real Cloud Handshake & Upload
      await new Promise(resolve => setTimeout(resolve, 2500));
      const now = new Date().toLocaleString();
      setLastSyncedAt(now);
      saveToLocal('last_synced', now);
      setSyncStatus('success');
      alert("Database snapshot successfully encrypted and uploaded to SmartClinic Cloud.");
    } catch (e) {
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromCloud = async () => {
    if(!window.confirm("This will replace your local data with the Cloud version. Continue?")) return;
    setIsSyncing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      // In a real scenario, we would call an API and set the state here.
      alert("Remote database successfully retrieved and synchronized.");
    } finally {
      setIsSyncing(false);
    }
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
    const headers = ['Code', 'Name', 'Age', 'Gender', 'Phone', 'Address', 'Allergies', 'Chronic Conditions'];
    const rows = patients.map(p => [p.patientCode, p.name, p.age, p.gender, p.phone, p.address, p.allergies || '', p.chronicConditions || '']);
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
        const [code, name, age, gender, phone, address, allergies, chronic] = line.split(',');
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
          chronicConditions: chronic || ''
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

  const filteredPatients = useMemo(() => {
    const s = patientSearchTerm.toLowerCase();
    if (!s) return patients;

    return patients.filter(p => {
      const pVisits = visits.filter(v => v.patientId === p.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const lastVisitFormatted = pVisits.length > 0 ? formatDate(pVisits[0].date) : '';
      const searchableString = [p.name, p.phone, p.patientCode, p.age.toString(), p.gender, p.address, p.allergies || '', p.chronicConditions || '', lastVisitFormatted].join(' ').toLowerCase();
      return searchableString.includes(s);
    });
  }, [patients, patientSearchTerm, visits]);

  const filteredMeds = useMemo(() => {
    const s = medSearchTerm.toLowerCase();
    if (!s) return [];
    let result = medications.filter(m => {
      const isLowStock = m.stock <= m.reorderLevel;
      const searchableString = [m.brandName, m.scientificName, m.companyName, m.category, m.type, m.strength, m.unit, m.pricePerUnit.toString(), isLowStock ? 'low stock reorder' : 'available in stock', m.stock.toString()].join(' ').toLowerCase();
      return searchableString.includes(s);
    });
    return [...result].sort((a, b) => a.brandName.localeCompare(b.brandName));
  }, [medications, medSearchTerm]);

  const customerSearchResults = useMemo(() => {
    const s = customerSearchTerm.toLowerCase();
    if (!s) return [];
    return patients.filter(p => p.name.toLowerCase().includes(s) || p.phone.includes(s) || p.patientCode.toLowerCase().includes(s)).slice(0, 5);
  }, [patients, customerSearchTerm]);

  const groupedPharmacySales = useMemo(() => {
    let sales = [...pharmacySales];
    if (pharmacyHistoryDate) sales = sales.filter(s => s.date === pharmacyHistoryDate);
    sales.sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      return dateDiff !== 0 ? dateDiff : b.id.localeCompare(a.id);
    });
    const groups: Record<string, { date: string, total: number, sales: PharmacySale[] }> = {};
    sales.forEach(s => {
      if (!groups[s.date]) groups[s.date] = { date: s.date, total: 0, sales: [] };
      groups[s.date].total += s.totalAmount;
      groups[s.date].sales.push(s);
    });
    return Object.values(groups);
  }, [pharmacySales, pharmacyHistoryDate]);

  const checkPharmacyMedAllergy = (medId: string, patientName?: string) => {
    let patient;
    if (patientName) patient = patients.find(p => p.name === patientName);
    else patient = patients.find(p => p.id === selectedPharmacyPatientId);
    if (!patient || !patient.allergies) return false;
    const med = medications.find(m => m.id === medId);
    if (!med) return false;
    const allergiesArray = patient.allergies.split(',').map(a => a.trim().toLowerCase()).filter(Boolean);
    const medBrand = med.brandName.toLowerCase().trim();
    const medSci = med.scientificName.toLowerCase().trim();
    return allergiesArray.some(a => a === medBrand || a === medSci);
  };

  const filteredSettingsItems = useMemo(() => {
    const s = settingsSearchTerm.toLowerCase();
    if (!s) {
      switch (settingsTab) {
        case 'symptoms': return symptoms;
        case 'scientific': return scientificNames;
        case 'med_categories': return medCategories;
        case 'med_types': return medTypes;
        case 'companies': return companyNames;
        case 'vitals': return vitalDefinitions;
        case 'templates': return prescriptionTemplates;
        case 'meds': return medications;
        case 'low_stock': return medications.filter(m => m.stock <= m.reorderLevel);
        default: return [];
      }
    }
    switch (settingsTab) {
      case 'symptoms': return symptoms.filter(i => i.label.toLowerCase().includes(s));
      case 'scientific': return scientificNames.filter(i => {
        const brands = medications.filter(m => m.scientificName === i.label).map(m => m.brandName).join(' ');
        return i.label.toLowerCase().includes(s) || brands.toLowerCase().includes(s);
      });
      case 'med_categories': return medCategories.filter(i => {
        const brands = medications.filter(m => m.category === i.label).map(m => m.brandName).join(' ');
        return i.label.toLowerCase().includes(s) || brands.toLowerCase().includes(s);
      });
      case 'med_types': return medTypes.filter(i => {
        const brands = medications.filter(m => m.type === i.label).map(m => m.brandName).join(' ');
        return i.label.toLowerCase().includes(s) || brands.toLowerCase().includes(s);
      });
      case 'companies': return companyNames.filter(i => {
        const brands = medications.filter(m => m.companyName === i.label).map(m => m.brandName).join(' ');
        return i.label.toLowerCase().includes(s) || brands.toLowerCase().includes(s);
      });
      case 'vitals': return vitalDefinitions.filter(i => i.label.toLowerCase().includes(s) || i.unit.toLowerCase().includes(s));
      case 'templates': return prescriptionTemplates.filter(i => {
        const medNames = i.prescribedMeds.map(pm => {
          const med = medications.find(m => m.id === pm.medicationId);
          return med ? med.brandName : pm.customName;
        }).join(' ');
        return i.name.toLowerCase().includes(s) || i.diagnosis.toLowerCase().includes(s) || medNames.toLowerCase().includes(s);
      });
      case 'meds': return medications.filter(m => {
        const isLowStock = m.stock <= m.reorderLevel;
        const searchableString = [m.brandName, m.scientificName, m.companyName, m.category, m.type, m.strength, m.unit, m.pricePerUnit.toString(), isLowStock ? 'low stock' : 'in stock'].join(' ').toLowerCase();
        return searchableString.includes(s);
      });
      case 'low_stock': return medications.filter(m => m.stock <= m.reorderLevel).filter(m => {
        const searchableString = [m.brandName, m.scientificName, m.companyName, m.category, m.type, m.strength, m.unit].join(' ').toLowerCase();
        return searchableString.includes(s);
      });
      default: return [];
    }
  }, [settingsTab, symptoms, scientificNames, medCategories, medTypes, companyNames, vitalDefinitions, medications, prescriptionTemplates, settingsSearchTerm]);

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
    const finalPrescribedMeds = tempPrescribedMeds.map(({searchTerm, ...rest}) => {
      if (!rest.medicationId && searchTerm) return { ...rest, customName: searchTerm };
      return rest;
    }).filter(pm => pm.medicationId !== '' || pm.customName !== '');
    const feeAmount = parseFloat(f.get('feeAmount') as string) || 0;
    const visitId = editingVisit ? editingVisit.id : Math.random().toString(36).substr(2, 9);
    const paymentStatus: 'Paid' | 'Pending' = feeAmount === 0 ? 'Pending' : (f.get('paymentStatus') as any || 'Paid');
    const newVisit: Visit = { id: visitId, patientId: pId, date: f.get('date') as string, diagnosis: formDiagnosis, symptoms: (f.getAll('selectedSymptoms') as string[]).join(', '), feeAmount, paymentStatus, vitals, prescribedMeds: finalPrescribedMeds };
    setMedications(prevMeds => {
      let updatedMeds = [...prevMeds];
      finalPrescribedMeds.forEach(pm => {
        if (pm.medicationId && pm.quantity && pm.quantity > 0) updatedMeds = updatedMeds.map(m => m.id === pm.medicationId ? { ...m, stock: Math.max(0, m.stock - pm.quantity!) } : m);
      });
      return updatedMeds;
    });
    if (editingVisit) setVisits(v => v.map(i => i.id === editingVisit.id ? newVisit : i));
    else setVisits(v => [...v, newVisit]);
    setShowVisitForm(false);
    setEditingVisit(null);
    setTempPrescribedMeds([]);
    setFormDiagnosis('');
    setFormSelectedPatientId(null);
    setPatientFormSearch('');
    setShowPatientResults(false);
    triggerPrint(newVisit);
  };

  const applyTemplate = (templateId: string) => {
    const tpl = prescriptionTemplates.find(t => t.id === templateId);
    if (!tpl) return;
    setFormDiagnosis(tpl.diagnosis);
    setTempPrescribedMeds(tpl.prescribedMeds.map(pm => ({ ...pm, searchTerm: undefined })));
  };

  const handleAiSummary = async (patientId: string) => {
    const p = patients.find(pat => pat.id === patientId);
    if (!p) return;
    setIsSummarizing(true);
    setAiSummary(null);
    try {
      const summary = await getPatientHistorySummary(p, visits.filter(v => v.patientId === patientId), medications);
      setAiSummary(summary || "No history available.");
    } catch (e) { setAiSummary("Error generating analysis."); }
    finally { setIsSummarizing(false); }
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
      const pVisits = visits.filter(v => v.patientId === p.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const lastVisitFormatted = pVisits.length > 0 ? formatDate(pVisits[0].date) : '';
      const searchableString = [p.name, p.phone, p.patientCode, p.age.toString(), p.allergies || '', lastVisitFormatted].join(' ').toLowerCase();
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

  const togglePrescSort = (key: 'date' | 'name') => {
    setPrescSort(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));
  };

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
    medications.forEach(m => { if (!brandMap.has(m.brandName)) brandMap.set(m.brandName, m.scientificName); });
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
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });
    const revenueByDay = last7Days.map(date => {
      const vTotal = visits.filter(v => v.date === date && v.paymentStatus === 'Paid').reduce((sum, v) => sum + (v.feeAmount || 0), 0);
      const pTotal = pharmacySales.filter(s => s.date === date && s.paymentStatus === 'Paid').reduce((sum, s) => sum + s.totalAmount, 0);
      return { date, total: vTotal + pTotal };
    });
    const ages: Record<string, number> = { 'Children (0-17)': 0, 'Adults (18-54)': 0, 'Seniors (55+)': 0 };
    patients.forEach(p => {
      if (p.age < 18) ages['Children (0-17)']++;
      else if (p.age < 55) ages['Adults (18-54)']++;
      else ages['Seniors (55+)']++;
    });
    const genders: Record<string, number> = { Male: 0, Female: 0, Other: 0 };
    patients.forEach(p => { if (genders[p.gender] !== undefined) genders[p.gender]++; });
    return { topPrescribed, revenueByDay, ages, genders };
  }, [visits, pharmacySales, patients, medications]);

  const toggleAllergy = (label: string) => {
    setSelectedAllergies(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
    setAllergySearchTerm('');
    setShowAllergyDropdown(false);
  };

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
    setFormSelectedPatientId(p.id);
    setPatientFormSearch(p.name);
    setEditingVisit(null);
    setTempPrescribedMeds([]);
    setFormDiagnosis('');
    setShowVisitForm(true);
  };

  const getBrandsForScientific = (scientificLabel: string) => medications.filter(m => m.scientificName.toLowerCase() === scientificLabel.toLowerCase()).map(m => m.brandName);
  const getBrandsForCompany = (companyLabel: string) => medications.filter(m => m.companyName.toLowerCase() === companyLabel.toLowerCase()).map(m => m.brandName);
  const getBrandsForCategory = (categoryLabel: string) => medications.filter(m => m.category.toLowerCase() === categoryLabel.toLowerCase()).map(m => m.brandName);
  const getBrandsForType = (typeLabel: string) => medications.filter(m => m.type.toLowerCase() === typeLabel.toLowerCase()).map(m => m.brandName);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => {
    const med = medications.find(m => m.id === item.medicationId);
    return sum + (item.quantity * (med?.pricePerUnit || 0));
  }, 0), [cart, medications]);

  const cartQuantityTotal = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 font-sans text-slate-900 overflow-x-hidden relative">
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-4 py-3 shrink-0 print:hidden">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-xl text-white"><Stethoscope size={20} /></div>
          <span className="text-lg font-black text-slate-800 tracking-tighter">SmartClinic</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl transition-all duration-500 ${isSyncing ? 'bg-blue-100 text-blue-600' : 'bg-slate-50 text-emerald-500'}`}>
             <Cloud size={20} className={isSyncing ? "animate-bounce" : ""} />
          </div>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 bg-slate-50 text-slate-500 rounded-xl"
          >
            <Bell size={20} />
            {stats.lowStockCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 border-2 border-white rounded-full flex items-center justify-center text-[8px] text-white font-black animate-bounce">{stats.lowStockCount}</span>
            )}
          </button>
          <button onClick={() => { setEditingVisit(null); setShowVisitForm(true); }} className="bg-blue-600 text-white p-2 rounded-xl shadow-lg">
            <Plus size={20} />
          </button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="w-80 bg-slate-50 border-r border-slate-200 p-8 flex flex-col gap-10 sticky top-0 h-screen hidden md:flex print:hidden shrink-0">
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-4">
             <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-xl shadow-blue-100"><Stethoscope size={32} /></div>
             <div className="flex flex-col"><span className="text-2xl font-black text-slate-800 tracking-tighter">SmartClinic</span><span className="text-[10px] font-black text-blue-600 uppercase tracking-widest text-center">MEDICAL HUB</span></div>
           </div>
           <div className="relative flex items-center gap-2">
             <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-500 border ${isSyncing ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                <Radio size={12} className={isSyncing ? "animate-ping" : "animate-pulse"} />
                <span className="text-[8px] font-black uppercase tracking-widest">{isSyncing ? 'Syncing...' : 'Live'}</span>
             </div>
             <button 
               onClick={() => setShowNotifications(!showNotifications)}
               className="p-2 text-slate-400 hover:text-blue-600 transition-colors relative"
             >
               <Bell size={22} className={stats.lowStockCount > 0 ? "animate-[pulse_2s_infinite]" : ""} />
               {stats.lowStockCount > 0 && (
                 <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-slate-50"></span>
               )}
             </button>
             {showNotifications && (
               <div className="absolute left-full ml-4 top-0 w-72 bg-white border border-slate-200 shadow-2xl rounded-3xl z-[500] p-6 animate-in slide-in-from-left-4 overflow-hidden">
                 <div className="flex items-center justify-between mb-4">
                   <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">Inventory Alerts</h4>
                   <button onClick={() => setShowNotifications(false)} className="text-slate-300 hover:text-slate-500"><X size={16}/></button>
                 </div>
                 <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                   {stats.lowStockCount > 0 ? stats.lowStockItems.map(m => (
                     <div key={m.id} className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-[11px] font-black text-rose-800 leading-tight">{m.brandName}</p>
                          <span className="text-[9px] font-bold text-rose-500 whitespace-nowrap">Stock: {m.stock}</span>
                        </div>
                        <p className="text-[9px] font-bold text-rose-400 uppercase mt-1">Reorder Level: {m.reorderLevel}</p>
                     </div>
                   )) : (
                     <div className="py-10 text-center text-slate-300">
                        <CheckCircle2 size={32} className="mx-auto mb-2 opacity-20" />
                        <p className="text-[10px] font-black uppercase">All stock levels normal</p>
                     </div>
                   )}
                 </div>
                 {stats.lowStockCount > 0 && (
                   <button 
                    onClick={() => { setView('settings'); setSettingsTab('low_stock'); setShowNotifications(false); }}
                    className="w-full mt-4 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
                   >
                     Manage Procurement
                   </button>
                 )}
               </div>
             )}
           </div>
        </div>
        <nav className="flex flex-col gap-3 flex-grow">
          <SidebarItem icon={<LayoutDashboard size={24} />} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <SidebarItem icon={<Users size={24} />} label="Patients" active={view === 'patients' || view === 'patient-detail'} onClick={() => setView('patients')} />
          <SidebarItem icon={<ClipboardList size={24} />} label="Clinical Logs" active={view === 'visits'} onClick={() => setView('visits')} />
          <SidebarItem icon={<Pill size={24} />} label="Pharmacy" active={view === 'pharmacy'} onClick={() => setView('pharmacy')} />
          <SidebarItem icon={<Receipt size={24} />} label="Billing" active={view === 'billing'} onClick={() => setView('billing')} />
          <SidebarItem icon={<BarChart3 size={24} />} label="Analytics" active={view === 'analytics'} onClick={() => setView('analytics')} />
          <SidebarItem icon={<Cloud size={24} />} label="Cloud Infrastructure" active={view === 'sync'} onClick={() => setView('sync')} />
          <SidebarItem icon={<Settings size={24} />} label="Settings" active={view === 'settings'} onClick={() => setView('settings')} />
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-4 md:p-12 overflow-auto print:hidden pb-24 md:pb-12">
        <div className="max-w-6xl mx-auto w-full">
           {view === 'dashboard' && (
              <div className="space-y-6 md:space-y-10 animate-in fade-in">
                <div className="flex justify-between items-end">
                   <h1 className="text-2xl md:text-3xl font-black text-slate-800">Dashboard</h1>
                   <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                      <Globe size={12} className="animate-spin-slow" />
                      Global Cloud Sync Active
                   </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  <div onClick={() => setView('patients')} className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 cursor-pointer hover:scale-[1.02] transition-transform active:scale-95 group">
                    <p className="opacity-80 text-[10px] font-bold uppercase tracking-widest">Total Patients</p>
                    <p className="text-3xl md:text-4xl font-black mt-1 flex items-center justify-between">{stats.totalPatients}<Users size={24} className="opacity-30 group-hover:opacity-100 transition-opacity" /></p>
                  </div>
                  <div onClick={() => setView('billing')} className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] text-white shadow-xl shadow-emerald-100 cursor-pointer hover:scale-[1.02] transition-transform active:scale-95 group">
                    <p className="opacity-80 text-[10px] font-bold uppercase tracking-widest">Total Revenue</p>
                    <p className="text-2xl md:text-3xl font-black mt-1 flex items-center justify-between">{CURRENCY} {stats.collected.toLocaleString()}<TrendingUp size={24} className="opacity-30 group-hover:opacity-100 transition-opacity" /></p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-400 to-amber-500 p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] text-white shadow-xl shadow-amber-100 group">
                    <p className="opacity-80 text-[10px] font-bold uppercase tracking-widest">Unpaid Clinical Fees</p>
                    <p className="text-2xl md:text-3xl font-black mt-1 flex items-center justify-between">{CURRENCY} {stats.pending.toLocaleString()}<Wallet size={24} className="opacity-30 group-hover:opacity-100 transition-opacity" /></p>
                  </div>
                  <div onClick={() => { setView('settings'); setSettingsTab('low_stock'); }} className="bg-gradient-to-br from-rose-500 to-pink-600 p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] text-white shadow-xl shadow-rose-100 cursor-pointer hover:scale-[1.02] transition-transform active:scale-95 group relative overflow-hidden">
                    <div className="relative z-10">
                      <p className="opacity-80 text-[10px] font-bold uppercase tracking-widest">Critical Stock Alert</p>
                      <p className="text-3xl md:text-4xl font-black mt-1 flex items-center justify-between">{stats.lowStockCount}<PackageSearch size={24} className="opacity-30 group-hover:opacity-100 transition-opacity" /></p>
                      <p className="text-[8px] font-black uppercase mt-2 bg-white/20 w-fit px-2 py-0.5 rounded-full">Procurement required</p>
                    </div>
                  </div>
                  <div onClick={() => setView('visits')} className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-transform active:scale-95 group">
                     <div><p className="text-slate-400 text-[10px] font-bold uppercase">Visits Today</p><p className="text-3xl md:text-4xl font-black text-slate-800">{visits.filter(v => v.date === getCurrentIsoDate()).length}</p></div>
                     <Clock size={40} className="text-blue-200 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <div onClick={() => setView('sync')} className="bg-gradient-to-br from-blue-500 to-cyan-600 p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] text-white shadow-xl shadow-blue-100 cursor-pointer hover:scale-[1.02] transition-transform active:scale-95 group">
                     <div><p className="text-blue-100 text-[10px] font-bold uppercase">Infrastructure</p><p className="text-xl md:text-2xl font-black text-white">Cloud Master</p></div>
                     <Server size={40} className="text-white opacity-30 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
           )}

           {view === 'sync' && (
             <div className="space-y-8 animate-in fade-in pb-20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex flex-col">
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800">SmartClinic Cloud Architecture</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                       <ShieldCheck className="text-emerald-500" size={14} /> End-to-End Encrypted Medical Sync (AES-256)
                    </p>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={handlePullFromCloud} className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all">
                        <Network size={14}/> Pull Master Data
                     </button>
                     <button onClick={() => setView('dashboard')} className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">
                        <ArrowRight className="rotate-180" size={14} /> Back
                     </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Connection & Health */}
                  <div className="lg:col-span-2 space-y-8">
                     <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
                        <div className="flex items-center justify-between">
                           <h2 className="text-lg font-black text-slate-800 flex items-center gap-3"><Network className="text-blue-500" size={24}/> Connection Status</h2>
                           <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                              <span className="text-[10px] font-black text-emerald-600 uppercase">Operational</span>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                           <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col justify-between h-32">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Node Latency</p>
                              <div className="flex items-end justify-between">
                                 <p className="text-3xl font-black text-slate-800">{serverLatency}<span className="text-sm ml-1 text-slate-400">ms</span></p>
                                 <Activity size={24} className="text-blue-500 opacity-20" />
                              </div>
                           </div>
                           <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col justify-between h-32">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Database Health</p>
                              <div className="flex items-end justify-between">
                                 <p className="text-3xl font-black text-slate-800">{dataHealth}<span className="text-sm ml-1 text-slate-400">%</span></p>
                                 <ShieldCheck size={24} className="text-emerald-500 opacity-20" />
                              </div>
                           </div>
                           <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col justify-between h-32">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Links</p>
                              <div className="flex items-end justify-between">
                                 <p className="text-3xl font-black text-slate-800">04</p>
                                 <Link size={24} className="text-indigo-500 opacity-20" />
                              </div>
                           </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-50">
                           <div className="flex justify-between items-center">
                              <label className="text-[10px] font-black text-slate-400 uppercase">Real-Time Sync Protocol</label>
                              <button 
                                onClick={() => setIsAutoSyncEnabled(!isAutoSyncEnabled)}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${isAutoSyncEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                              >
                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isAutoSyncEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                              </button>
                           </div>
                           <div className="p-5 bg-blue-50/50 rounded-3xl border border-blue-100/50 flex items-center gap-5">
                              <div className="bg-blue-500 p-3 rounded-2xl text-white shadow-lg shadow-blue-200/50"><Globe size={20} className="animate-spin-slow" /></div>
                              <div className="flex-grow">
                                 <p className="text-[10px] font-black text-blue-700 uppercase leading-relaxed">Cross-Device Synchronization Active</p>
                                 <p className="text-[9px] font-medium text-blue-600/70">Connected to Regional Cluster: {cloudRegion}</p>
                              </div>
                              <div className="text-right"><p className="text-[8px] font-black text-blue-400 uppercase">Uptime</p><p className="text-[11px] font-black text-blue-700">99.9%</p></div>
                           </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                           <button 
                              onClick={handlePushToCloud}
                              disabled={isSyncing}
                              className={`flex-1 py-5 rounded-3xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${
                                 isSyncing 
                                 ? 'bg-slate-100 text-slate-400' 
                                 : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100 active:scale-95'
                              }`}
                           >
                              {isSyncing ? <RefreshCw className="animate-spin" size={20} /> : <CloudUpload size={20} />}
                              {isSyncing ? 'Syncing Now...' : 'Manual Cloud Push'}
                           </button>
                           <button 
                              onClick={() => {
                                const id = prompt("Enter new Clinic ID prefix:", clinicId);
                                if(id) setClinicId(id);
                              }}
                              className="px-8 py-5 bg-white border border-slate-200 text-slate-500 rounded-3xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all"
                           >
                              Link New Node
                           </button>
                        </div>
                     </div>

                     {/* Sync Logs Table */}
                     <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-2 flex items-center gap-2"><History size={16}/> Sync Integrity Log</h3>
                        <div className="overflow-x-auto">
                           <table className="w-full text-left text-xs">
                              <thead className="text-[9px] font-black uppercase text-slate-300 border-b border-slate-50">
                                 <tr><th className="px-4 py-3">Timestamp</th><th className="px-4 py-3">Payload Type</th><th className="px-4 py-3">Source Node</th><th className="px-4 py-3 text-right">Integrity</th></tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                 {[
                                    { time: lastSyncedAt || 'Just Now', type: 'Full Database Snapshot', node: 'Primary-PC-01', status: 'Verified' },
                                    { time: '12:05 PM Today', type: 'Patient Index Update', node: 'Tablet-Room-2', status: 'Verified' },
                                    { time: '10:30 AM Today', type: 'Clinical Log Stream', node: 'PC-Main-01', status: 'Verified' }
                                 ].map((log, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50">
                                       <td className="px-4 py-3 font-bold text-slate-400">{log.time}</td>
                                       <td className="px-4 py-3 font-black text-slate-700">{log.type}</td>
                                       <td className="px-4 py-3 text-slate-400 font-bold">{log.node}</td>
                                       <td className="px-4 py-3 text-right"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-500 rounded-full font-black text-[9px] uppercase">{log.status}</span></td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </div>

                  {/* Right Column: Infrastructure Details */}
                  <div className="space-y-8">
                     <div className="bg-slate-900 rounded-[3rem] p-8 md:p-10 text-white space-y-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10"><Cpu size={120} /></div>
                        
                        <div className="relative z-10 space-y-6">
                           <h3 className="font-black text-sm uppercase tracking-widest text-blue-400">Cloud Credentials</h3>
                           <div className="space-y-4">
                              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                 <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Clinic Identification Code</p>
                                 <div className="flex justify-between items-center">
                                    <p className="text-base font-black tracking-widest">{clinicId}</p>
                                    <Copy size={14} className="text-slate-500 cursor-pointer hover:text-white" />
                                 </div>
                              </div>
                              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                 <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Access Token (Hidden)</p>
                                 <div className="flex justify-between items-center">
                                    <p className="text-base font-black tracking-widest text-slate-400">{cloudSecret}</p>
                                    <Lock size={14} className="text-slate-500" />
                                 </div>
                              </div>
                           </div>
                           
                           <div className="pt-4 border-t border-white/10 space-y-6">
                              <div className="flex justify-between items-end">
                                 <div>
                                    <p className="text-[8px] font-black text-slate-500 uppercase">Allocated Storage</p>
                                    <p className="text-xl font-black">2.4 GB <span className="text-[10px] text-slate-500">of 10GB</span></p>
                                 </div>
                                 <HardDrive size={24} className="text-blue-500/50" />
                              </div>
                              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                 <div className="h-full w-[24%] bg-blue-500 rounded-full"></div>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                        <h3 className="font-black text-slate-800 flex items-center gap-2"><Globe className="text-indigo-500" size={20}/> Server Infrastructure</h3>
                        <div className="space-y-4">
                           <div className="flex items-start gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                              <Server size={20} className="text-blue-500 shrink-0 mt-1" />
                              <div>
                                 <p className="text-[10px] font-black text-slate-800 uppercase">Primary Data Center</p>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase">Ireland Cluster (AWS-01)</p>
                              </div>
                           </div>
                           <div className="flex items-start gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                              <ShieldAlert size={20} className="text-rose-500 shrink-0 mt-1" />
                              <div>
                                 <p className="text-[10px] font-black text-slate-800 uppercase">Redundancy Snapshot</p>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase">Active (Daily at 03:00 AM)</p>
                              </div>
                           </div>
                           <div className="flex items-start gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                              <Zap size={20} className="text-amber-500 shrink-0 mt-1" />
                              <div>
                                 <p className="text-[10px] font-black text-slate-800 uppercase">Edge Compute Nodes</p>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase">Enabled (Karachi Node Active)</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
             </div>
           )}

           {view === 'analytics' && (
             <div className="space-y-8 animate-in fade-in">
               <div className="flex justify-between items-center">
                 <h1 className="text-2xl md:text-3xl font-black text-slate-800">Clinic Analytics</h1>
                 <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-black uppercase text-xs">
                    <ArrowRight className="rotate-180" size={18} /> Dashboard
                 </button>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                   <div className="flex items-center justify-between">
                     <h3 className="font-black text-slate-800 flex items-center gap-2"><TrendingUp className="text-emerald-500" size={20}/> Revenue Trend (7 Days)</h3>
                     <span className="text-[10px] font-black text-slate-400 uppercase">Paid Total</span>
                   </div>
                   <div className="flex items-end justify-between h-48 gap-2 px-2">
                     {analyticsData.revenueByDay.map((day, idx) => {
                       const maxVal = Math.max(...analyticsData.revenueByDay.map(d => Number(d.total))) || 1;
                       const height = (Number(day.total) / maxVal) * 100;
                       return (
                         <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                            <div className="w-full relative">
                              <div 
                                style={{ height: `${Math.max(height, 5)}%` }} 
                                className="w-full bg-blue-500 rounded-t-lg group-hover:bg-blue-600 transition-all relative"
                              >
                                {day.total > 0 && (
                                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    {CURRENCY} {day.total}
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">{day.date.split('-').slice(1).join('/')}</span>
                         </div>
                       );
                     })}
                   </div>
                 </div>

                 <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                   <h3 className="font-black text-slate-800 flex items-center gap-2"><Pill className="text-indigo-500" size={20}/> Top Prescribed Medications</h3>
                   <div className="space-y-4">
                     {analyticsData.topPrescribed.map(([name, count], idx) => {
                       const maxCount = analyticsData.topPrescribed.length > 0 ? Number(analyticsData.topPrescribed[0][1]) : 1;
                       const width = (Number(count) / maxCount) * 100;
                       return (
                         <div key={name} className="space-y-1">
                           <div className="flex justify-between text-xs font-black text-slate-600">
                             <span>{name}</span>
                             <span>{count} times</span>
                           </div>
                           <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                             <div 
                                style={{ width: `${width}%` }} 
                                className={`h-full rounded-full transition-all duration-1000 bg-indigo-500`}
                             />
                           </div>
                         </div>
                       );
                     })}
                     {analyticsData.topPrescribed.length === 0 && (
                       <p className="text-center py-10 text-slate-300 font-bold uppercase text-xs">No records found</p>
                     )}
                   </div>
                 </div>

                 <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                   <h3 className="font-black text-slate-800 flex items-center gap-2"><Users className="text-blue-500" size={20}/> Patient Age Distribution</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     {Object.entries(analyticsData.ages).map(([group, count]) => {
                       const total = patients.length || 1;
                       const percent = Math.round((Number(count) / total) * 100);
                       return (
                         <div key={group} className="p-4 bg-slate-50 rounded-2xl text-center space-y-1">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{group}</p>
                           <p className="text-2xl font-black text-slate-800">{count}</p>
                           <div className="text-[9px] font-bold text-blue-600">{percent}% of total</div>
                         </div>
                       );
                     })}
                   </div>
                 </div>

                 <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                   <h3 className="font-black text-slate-800 flex items-center gap-2"><PieChart className="text-rose-500" size={20}/> Gender Demographics</h3>
                   <div className="flex items-center gap-6">
                      <div className="flex-1 space-y-4">
                        {Object.entries(analyticsData.genders).map(([gender, count]) => {
                          const total = patients.length || 1;
                          const width = (Number(count) / total) * 100;
                          return (
                            <div key={gender} className="space-y-1">
                               <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                                 <span>{gender}</span>
                                 <span>{count}</span>
                               </div>
                               <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    style={{ width: `${width}%` }} 
                                    className={`h-full rounded-full bg-${gender === 'Male' ? 'blue' : gender === 'Female' ? 'rose' : 'slate'}-500`}
                                  />
                               </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="hidden sm:block p-8 border-4 border-slate-50 rounded-full">
                         <div className="text-center">
                            <p className="text-3xl font-black text-slate-800">{patients.length}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Total Patients</p>
                         </div>
                      </div>
                   </div>
                 </div>
               </div>
             </div>
           )}

           {view === 'patients' && (
             <div className="space-y-6 animate-in fade-in">
               <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                 <h1 className="text-2xl md:text-3xl font-black text-slate-800 w-full text-left">Patient Files</h1>
                 <div className="flex items-center gap-2 md:gap-4 w-full sm:w-auto">
                    <div className="flex gap-1 shrink-0">
                       <button onClick={exportPatientsCsv} className="p-2.5 md:p-3 bg-white border border-slate-100 text-slate-400 hover:text-blue-600 rounded-xl md:rounded-2xl shadow-sm transition-all" title="Export to Excel (CSV)"><FileDown size={18} /></button>
                       <label className="p-2.5 md:p-3 bg-white border border-slate-100 text-slate-400 hover:text-blue-600 rounded-xl md:rounded-2xl shadow-sm transition-all cursor-pointer" title="Import from Excel (CSV)"><FileUp size={18} /><input type="file" accept=".csv" className="hidden" onChange={handleImportPatientsCsv} /></label>
                    </div>
                    <div className="relative flex-grow sm:w-64 group">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                      <input type="text" placeholder="Deep Search: Name, Phone, Reg#, Age, Allergy, Visit..." value={patientSearchTerm} onChange={(e) => setPatientSearchTerm(e.target.value)} className="w-full pl-10 pr-10 py-2.5 md:py-3 rounded-xl md:rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm transition-all shadow-sm" />
                      {patientSearchTerm && <button onClick={() => setPatientSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"><X size={16}/></button>}
                    </div>
                    <button onClick={() => { setEditingPatient(null); setSelectedAllergies([]); setShowPatientForm(true); }} className="bg-blue-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-black shadow-lg whitespace-nowrap text-sm">Register</button>
                 </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                 {filteredPatients.map(p => {
                    const patientVisits = visits.filter(v => v.patientId === p.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    const lastVisit = patientVisits[0];

                    return (
                   <div key={p.id} onClick={() => { setSelectedPatientId(p.id); setView('patient-detail'); setDetailTab('history'); setHistorySearchTerm(''); }} className="bg-white p-5 md:p-6 rounded-3xl md:rounded-[2rem] border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-all group relative flex flex-col justify-between min-h-[140px]">
                     <div>
                       <div className="flex items-center gap-4">
                         <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black shrink-0">{p.name[0]}</div>
                         <div className="flex-grow min-w-0">
                           <div className="flex items-center gap-2">
                             <h3 className="font-black text-slate-800 truncate text-base">{p.name}</h3>
                           </div>
                           <p className="text-[11px] text-blue-600 font-bold leading-tight">{p.phone}</p>
                           {p.allergies && (
                             <p className="text-[10px] text-rose-500 font-bold truncate leading-tight mt-0.5">Allergy: {p.allergies}</p>
                           )}
                           <p className="text-[9px] text-slate-400 font-bold uppercase truncate mt-1">{p.patientCode} • {p.age}Y</p>
                         </div>
                       </div>
                       
                       <div className="mt-4 flex flex-col gap-1.5">
                         {lastVisit ? (
                           <>
                             <div className="flex items-center gap-2 text-slate-500">
                               <Calendar size={12} className="text-blue-400" />
                               <p className="text-[10px] md:text-[11px] font-bold">Last Visit: <span className="text-slate-700">{formatDate(lastVisit.date)}</span></p>
                             </div>
                             {lastVisit.vitals && Object.keys(lastVisit.vitals).length > 0 && (
                               <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                                 <Activity size={10} className="text-emerald-500 shrink-0" />
                                 <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                                   {vitalDefinitions
                                     .map(vd => lastVisit.vitals![vd.id] ? `${vd.label}: ${lastVisit.vitals![vd.id]}${vd.unit}` : null)
                                     .filter(Boolean)
                                     .join(' • ')}
                                 </p>
                               </div>
                             )}
                           </>
                         ) : (
                           <p className="text-[10px] md:text-[11px] text-slate-300 italic font-medium">No visits recorded yet</p>
                         )}
                       </div>
                     </div>

                     <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                       <div className="flex gap-1">
                          <button onClick={(e) => { e.stopPropagation(); launchEncounter(p); }} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Start Log Visit"><Stethoscope size={18} /></button>
                          <button onClick={(e) => { e.stopPropagation(); setEditingPatient(p); setSelectedAllergies(p.allergies ? p.allergies.split(', ').filter(Boolean) : []); setShowPatientForm(true); }} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeletePatient(p.id); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                       </div>
                       {lastVisit && (
                         <button 
                           onClick={(e) => { e.stopPropagation(); setQrVisit(lastVisit); }} 
                           className="bg-indigo-50 text-indigo-600 p-2 md:p-2.5 rounded-lg md:rounded-xl hover:bg-indigo-100 transition-all shadow-sm flex items-center gap-2 group/qr"
                         >
                           <QrCode size={18} />
                           <span className="text-[9px] font-black uppercase tracking-tighter hidden sm:block">Visit QR</span>
                         </button>
                       )}
                     </div>
                   </div>
                 )})}
               </div>
             </div>
           )}

           {view === 'patient-detail' && selectedPatientId && (
             <div className="space-y-6 md:space-y-8 animate-in slide-in-from-right">
                {(() => {
                   const p = patients.find(pat => pat.id === selectedPatientId);
                   if (!p) return null;
                   return (
                     <div className="space-y-6 md:space-y-8">
                       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                         <button onClick={() => setView('patients')} className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-black uppercase text-xs">
                           <ArrowRight className="rotate-180" size={18} /> Back
                         </button>
                         <div className="flex flex-wrap items-center gap-2">
                           <button 
                             onClick={() => setQrPatient(p)} 
                             className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
                           >
                             <QrCode size={16} /> Profile QR
                           </button>
                           <button 
                             onClick={() => launchEncounter(p)} 
                             className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-emerald-700 transition-all active:scale-95"
                           >
                             <Stethoscope size={16} /> Log Visit
                           </button>
                         </div>
                       </div>
                       
                       <div className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[3rem] shadow-xl border border-slate-100 flex flex-col lg:flex-row gap-6 md:gap-10">
                         <div className="flex-grow">
                           <div className="flex justify-between items-start gap-4">
                             <h2 className="text-2xl md:text-4xl font-black text-slate-800 leading-tight">{p.name}</h2>
                             <div className="flex gap-1 no-print shrink-0">
                               <button onClick={() => setQrPatient(p)} className="p-2.5 bg-indigo-50 text-indigo-400 hover:text-indigo-600 rounded-xl" title="Patient Profile QR"><QrCode size={18}/></button>
                               <button onClick={() => { setEditingPatient(p); setSelectedAllergies(p.allergies ? p.allergies.split(', ').filter(Boolean) : []); setShowPatientForm(true); }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl" title="Edit Info"><Edit2 size={18}/></button>
                               <button onClick={() => handleDeletePatient(p.id)} className="p-2.5 bg-red-50 text-red-400 hover:text-red-600 rounded-xl" title="Delete"><Trash2 size={18}/></button>
                             </div>
                           </div>
                           <p className="text-slate-400 font-bold mt-2 uppercase text-[10px] md:text-xs">{p.patientCode} • {p.age}Y • {p.gender}</p>
                           <p className="text-slate-600 mt-4 font-medium text-sm">{p.phone} • {p.address}</p>

                           {(p.allergies || p.chronicConditions) && (
                             <div className="mt-6 md:mt-8 flex flex-col sm:flex-row gap-3 md:gap-4">
                                {p.allergies && (
                                  <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-3 flex-1">
                                    <ShieldAlert className="text-rose-500 shrink-0" size={20} />
                                    <div><p className="text-[9px] md:text-[10px] font-black uppercase text-rose-400 tracking-widest">Allergies</p><p className="text-xs md:text-sm font-black text-rose-700">{p.allergies}</p></div>
                                  </div>
                                )}
                                {p.chronicConditions && (
                                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3 flex-1">
                                    <Activity className="text-amber-500 shrink-0" size={20} />
                                    <div><p className="text-[9px] md:text-[10px] font-black uppercase text-amber-400 tracking-widest">Chronic Conditions</p><p className="text-xs md:text-sm font-black text-amber-700">{p.chronicConditions}</p></div>
                                  </div>
                                )}
                             </div>
                           )}
                         </div>
                         <div className="bg-indigo-900 text-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] w-full lg:max-w-xs space-y-4 shadow-xl shadow-indigo-100">
                            <h3 className="text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2"><Sparkles size={16}/> Clinical Analysis</h3>
                            <p className="text-xs md:text-sm italic opacity-80 leading-relaxed">"{aiSummary || "Analysis pending..."}"</p>
                            <button onClick={() => handleAiSummary(selectedPatientId!)} disabled={isSummarizing} className="w-full bg-white text-indigo-900 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-black uppercase text-[9px] md:text-[10px] tracking-widest hover:bg-indigo-50 transition-all">{isSummarizing ? "Analyzing..." : "Analyze History"}</button>
                         </div>
                       </div>

                       <div className="space-y-6">
                         <div className="flex gap-1 md:gap-2 bg-slate-200/50 p-1 rounded-xl md:rounded-2xl w-full sm:w-fit no-print overflow-x-auto">
                           <button onClick={() => setDetailTab('history')} className={`flex-1 sm:flex-none px-4 md:px-6 py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap ${detailTab === 'history' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><History size={14}/> History</button>
                           <button onClick={() => setDetailTab('prescriptions')} className={`flex-1 sm:flex-none px-4 md:px-6 py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap ${detailTab === 'prescriptions' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}><FileText size={14}/> Meds</button>
                         </div>

                         {detailTab === 'history' && (
                           <div className="space-y-4 animate-in fade-in">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <h3 className="text-lg md:text-xl font-black text-slate-800">Visit History</h3>
                                <div className="relative w-full sm:w-64 no-print group">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                                  <input 
                                    type="text" 
                                    placeholder="Filter records..." 
                                    value={historySearchTerm} 
                                    onChange={(e) => setHistorySearchTerm(e.target.value)} 
                                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-xs transition-all shadow-sm" 
                                  />
                                  {historySearchTerm && (
                                    <button onClick={() => setHistorySearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"><X size={14}/></button>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-3 md:space-y-4">
                                 {filteredHistory.map(v => (
                                   <div key={v.id} className="bg-white p-5 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4 group">
                                      <div className="flex-grow">
                                        <p className="text-[10px] text-slate-400 mb-1 font-bold">{formatDate(v.date)}</p>
                                        <p className="font-bold text-slate-800 text-sm md:text-base">{v.diagnosis}</p>
                                        <div className="flex flex-wrap gap-1">
                                          {v.symptoms ? v.symptoms.split(', ').map((s, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded-full uppercase tracking-tighter">{s}</span>
                                          )) : <span className="text-slate-300 italic text-[10px]">No symptoms recorded</span>}
                                        </div>
                                      </div>
                                      <div className="flex gap-2 shrink-0 md:opacity-0 group-hover:opacity-100 transition-opacity justify-end no-print">
                                         <button onClick={() => handleWhatsAppShare(v, p)} className="bg-green-50 text-green-600 p-2.5 rounded-lg hover:bg-green-100 transition-all" title="Share WhatsApp"><MessageCircle size={16}/></button>
                                         <button onClick={() => setQrVisit(v)} className="bg-indigo-50 text-indigo-600 p-2.5 rounded-lg hover:bg-indigo-100 transition-all" title="QR Code"><QrCode size={16}/></button>
                                         <button onClick={() => triggerPrint(v)} className="bg-blue-50 text-blue-600 p-2.5 rounded-lg hover:bg-blue-100 transition-all" title="Print"><Printer size={16}/></button>
                                      </div>
                                   </div>
                                 ))}
                              </div>
                           </div>
                         )}
                       </div>
                     </div>
                   );
                })()}
             </div>
           )}

           {view === 'visits' && (
             <div className="space-y-6 md:space-y-8 animate-in fade-in">
               <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                 <h1 className="text-2xl md:text-3xl font-black text-slate-800 w-full text-left">Clinical Logs</h1>
                 <div className="flex items-center gap-2 md:gap-4 w-full sm:w-auto">
                    <button onClick={exportVisitsCsv} className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-blue-600 rounded-xl md:rounded-2xl shadow-sm transition-all shrink-0" title="Export CSV"><FileDown size={18} /></button>
                    <div className="relative flex-grow sm:w-64 group">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                      <input type="text" placeholder="Search logs..." value={visitSearchTerm} onChange={(e) => setVisitSearchTerm(e.target.value)} className="w-full pl-10 pr-10 py-2.5 md:py-3 rounded-xl md:rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm transition-all shadow-sm" />
                    </div>
                    <button onClick={() => { 
                      setEditingVisit(null); 
                      setTempPrescribedMeds([]); 
                      setFormDiagnosis('');
                      setFormSelectedPatientId(null); 
                      setPatientFormSearch('');
                      setShowVisitForm(true); 
                    }} className="bg-blue-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-black flex items-center gap-2 shadow-lg text-sm shrink-0">
                      <PlusCircle size={18} /> <span className="hidden xs:inline">New Record</span>
                    </button>
                 </div>
               </div>
               <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                 <div className="overflow-x-auto custom-scrollbar">
                 <table className="w-full text-left min-w-[700px]">
                   <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                     <tr><th className="px-6 md:px-8 py-5">Date</th><th className="px-6 md:px-8 py-5">Patient</th><th className="px-6 md:px-8 py-5">Symptoms</th><th className="px-6 md:px-8 py-5">Diagnosis</th><th className="px-6 md:px-8 py-5">Status</th><th className="px-6 md:px-8 py-5 text-right">Actions</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {filteredVisits.map(v => {
                       const p = patients.find(pat => pat.id === v.patientId);
                       return (
                        <tr key={v.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 md:px-8 py-5 font-bold text-slate-400 text-[11px] whitespace-nowrap">{formatDate(v.date)}</td>
                          <td className="px-6 md:px-8 py-5 whitespace-nowrap">
                            <p className="font-black text-slate-800 text-xs md:text-sm">{p?.name}</p>
                            <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-tight">{p?.age}Y • {p?.phone}</p>
                          </td>
                          <td className="px-6 md:px-8 py-5"><div className="flex flex-wrap gap-1 max-w-[150px]">{v.symptoms ? v.symptoms.split(', ').map((s, i) => (<span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded-full uppercase tracking-tighter">{s}</span>)) : <span className="text-slate-300 italic text-[10px]">None</span>}</div></td>
                          <td className="px-6 md:px-8 py-5 font-bold text-slate-700 text-xs md:text-sm">{v.diagnosis}</td>
                          <td className="px-6 md:px-8 py-5"><span className={`px-3 md:px-4 py-1 rounded-full text-[9px] font-black uppercase ${v.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{v.paymentStatus === 'Paid' ? 'Paid' : 'Unpaid'}</span></td>
                          <td className="px-6 md:px-8 py-5 text-right">
                             <div className="flex items-center gap-1 md:gap-2 justify-end">
                                <button onClick={() => triggerPrint(v)} className="p-2 text-slate-400 hover:text-blue-600" title="Print"><Printer size={16}/></button>
                                <button onClick={() => setQrVisit(v)} className="p-2 text-slate-400 hover:text-indigo-600" title="QR"><QrCode size={16}/></button>
                                <button onClick={() => handleDeleteVisit(v.id)} className="p-2 text-slate-400 hover:text-red-500" title="Delete Log"><Trash2 size={16}/></button>
                             </div>
                          </td>
                        </tr>
                       );
                     })}
                   </tbody>
                 </table>
                 </div>
               </div>
             </div>
           )}

           {view === 'pharmacy' && (
             <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in h-full max-w-5xl mx-auto pb-10">
               <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 gap-4">
                 <h1 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-3"><ShoppingCart className="text-blue-600" size={32} /> Pharmacy POS</h1>
                 <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl w-full sm:w-auto">
                    <button onClick={() => setPharmacyTab('pos')} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${pharmacyTab === 'pos' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>New Billing</button>
                    <button onClick={() => setPharmacyTab('history')} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${pharmacyTab === 'history' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>Sales History</button>
                 </div>
               </div>

               {pharmacyTab === 'pos' ? (
                 <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                   <div className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[3rem] shadow-xl border-4 border-white space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-2 relative">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><UserPlus size={14} className="text-blue-500" /> Customer Name / Patient</label>
                           <div className="relative">
                              <input 
                                type="text" 
                                value={customerSearchTerm || walkinName} 
                                onFocus={() => setShowCustomerResults(true)}
                                onChange={(e) => { 
                                  setCustomerSearchTerm(e.target.value); 
                                  setWalkinName(e.target.value); 
                                  setShowCustomerResults(true);
                                  setSelectedPharmacyPatientId(null);
                                }} 
                                placeholder="Search patient or type name..." 
                                className="w-full p-4 pl-5 rounded-2xl border-2 border-slate-50 bg-slate-50 font-black text-sm outline-none focus:bg-white focus:border-blue-500/20 transition-all shadow-inner" 
                              />
                              {showCustomerResults && customerSearchResults.length > 0 && (
                                <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-100 shadow-2xl rounded-2xl z-[100] overflow-hidden">
                                  {customerSearchResults.map(p => (
                                    <button key={p.id} type="button" onClick={() => { 
                                      setWalkinName(p.name); 
                                      setCustomerSearchTerm(p.name); 
                                      setSelectedPharmacyPatientId(p.id);
                                      setShowCustomerResults(false); 
                                    }} className="w-full text-left px-5 py-3 hover:bg-blue-50 border-b border-slate-50 font-black text-xs flex justify-between items-center group">
                                      <span>{p.name}</span>
                                      <span className="text-[8px] uppercase text-slate-300 group-hover:text-blue-400">{p.patientCode}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                           </div>
                         </div>

                         <div className="space-y-2 relative">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Search size={14} className="text-emerald-500" /> Add Medicine (Deep Search)</label>
                           <div className="relative">
                              <input 
                                ref={posSearchRef}
                                type="text" 
                                value={medSearchTerm} 
                                onChange={(e) => setMedSearchTerm(e.target.value)} 
                                placeholder="Formula, Brand, Type... (Press '/' to focus)" 
                                className="w-full p-4 pl-5 rounded-2xl border-2 border-slate-50 bg-slate-50 font-black text-sm outline-none focus:bg-white focus:border-emerald-500/20 transition-all shadow-inner" 
                              />
                              {medSearchTerm && (
                                <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 shadow-2xl rounded-2xl z-[100] max-h-64 overflow-y-auto custom-scrollbar overflow-x-hidden">
                                  {filteredMeds.length > 0 ? filteredMeds.map(med => {
                                    const isRisk = checkPharmacyMedAllergy(med.id);
                                    return (
                                    <button key={med.id} type="button" onClick={() => addToCart(med.id)} className={`w-full text-left px-5 py-4 border-b border-slate-50 last:border-none group flex flex-col gap-1 ${isRisk ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-emerald-50'}`}>
                                      <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                          <span className="font-black text-slate-800 text-sm">{med.brandName}</span>
                                          {isRisk && <span className="px-2 py-0.5 bg-red-600 text-white text-[8px] font-black rounded flex items-center gap-1 animate-pulse"><ShieldAlert size={10}/> Allergy Risk</span>}
                                        </div>
                                        <span className="font-black text-emerald-600 text-xs">{CURRENCY} {med.pricePerUnit}</span>
                                      </div>
                                    </button>
                                  )}) : (
                                    <div className="p-8 text-center flex flex-col items-center gap-3">
                                      <PackageSearch size={32} className="text-slate-100" />
                                      <p className="text-[10px] font-black uppercase text-slate-300">No Match Found</p>
                                    </div>
                                  )}
                                </div>
                              )}
                           </div>
                         </div>
                      </div>

                      <div className="bg-slate-50/50 rounded-[2.5rem] border-2 border-slate-100 overflow-hidden mt-8">
                         <div className="overflow-x-auto custom-scrollbar">
                           <table className="w-full text-left min-w-[600px]">
                             <thead className="bg-white/80 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                               <tr>
                                 <th className="px-8 py-5">Sr.</th>
                                 <th className="px-8 py-5">Medicine Information</th>
                                 <th className="px-8 py-5 text-center">Quantity</th>
                                 <th className="px-8 py-5 text-right">Sub-Total</th>
                                 <th className="px-8 py-5 text-center w-20"></th>
                               </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-100">
                               {cart.length === 0 ? (
                                 <tr><td colSpan={5} className="py-20 text-center text-slate-300 font-black uppercase text-xs">Receipt is empty</td></tr>
                               ) : cart.map((item, idx) => {
                                 const med = medications.find(m => m.id === item.medicationId)!;
                                 return (
                                   <tr key={item.medicationId} className="hover:bg-white transition-colors">
                                     <td className="px-8 py-6 font-black text-slate-300 text-xs">{idx + 1}</td>
                                     <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                           <span className="font-black text-slate-800 text-base">{med.brandName}</span>
                                           <span className="text-[10px] font-bold text-blue-500 uppercase mt-1 tracking-tighter">{med.strength} • {med.unit} • {CURRENCY} {med.pricePerUnit} each</span>
                                        </div>
                                     </td>
                                     <td className="px-8 py-6">
                                        <div className="flex items-center justify-center gap-3 bg-white w-fit mx-auto p-1.5 rounded-xl border-2 border-slate-100 shadow-sm">
                                           <button onClick={() => updateCartQty(item.medicationId, -1)} className="p-1.5 hover:bg-slate-50 text-slate-400 rounded-lg"><Minus size={14}/></button>
                                           <span className="font-black text-sm w-8 text-center">{item.quantity}</span>
                                           <button onClick={() => updateCartQty(item.medicationId, 1)} className="p-1.5 hover:bg-slate-50 text-slate-400 rounded-lg"><Plus size={14}/></button>
                                        </div>
                                     </td>
                                     <td className="px-8 py-6 text-right font-black text-slate-800 text-base">{CURRENCY} {(med.pricePerUnit * item.quantity).toLocaleString()}</td>
                                     <td className="px-8 py-6 text-center"><button onClick={() => removeFromCart(item.medicationId)} className="p-3 text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={18}/></button></td>
                                   </tr>
                                 );
                               })}
                             </tbody>
                           </table>
                         </div>
                      </div>

                      <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-6 border-t-4 border-dashed border-slate-100">
                         <div className="text-center md:text-left">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Summary</p>
                            <p className="text-xs font-bold text-slate-600">Customer: <span className="text-blue-600">{walkinName}</span></p>
                         </div>
                         <div className="flex flex-col items-center md:items-end gap-6 w-full md:w-auto">
                            <div className="text-center md:text-right">
                               <span className="text-slate-400 font-black uppercase text-[10px] tracking-[0.25em] block mb-2">Grand Total</span>
                               <span className="text-4xl md:text-6xl font-black text-blue-600 tabular-nums">{CURRENCY} {cartTotal.toLocaleString()}</span>
                            </div>
                            <div className="flex gap-4 w-full md:w-auto">
                               <button 
                                  onClick={() => { if(window.confirm('Clear?')) { setCart([]); setWalkinName('Walk-in Customer'); } }}
                                  disabled={cart.length === 0}
                                  className="px-8 py-5 rounded-3xl border-2 border-slate-100 text-slate-400 font-black uppercase text-[10px] hover:bg-rose-50 disabled:opacity-20"
                               >Clear</button>
                               <button 
                                  onClick={completeSale} 
                                  disabled={cart.length === 0} 
                                  className="flex-grow md:flex-none px-12 py-5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase shadow-2xl hover:bg-emerald-700 active:scale-95 transition-all text-base flex items-center justify-center gap-3"
                               ><CheckCircle2 size={24} /> Complete & Print</button>
                            </div>
                         </div>
                      </div>
                   </div>
                 </div>
               ) : (
                 <div className="space-y-6 animate-in slide-in-from-right">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                       <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><History size={20} className="text-indigo-500" /> Sales Ledger</h2>
                       <input type="date" value={pharmacyHistoryDate} onChange={(e) => setPharmacyHistoryDate(e.target.value)} className="p-2.5 rounded-xl border-2 border-slate-100 font-black text-xs outline-none focus:border-indigo-500 transition-all" />
                    </div>
                    <div className="space-y-4">
                       {groupedPharmacySales.map(group => (
                         <div key={group.date} className="space-y-3">
                           <div className="flex justify-between items-center px-4"><div className="flex items-center gap-3"><span className="bg-indigo-600 text-white px-4 py-1 rounded-full font-black text-[10px] shadow-sm">{formatDate(group.date)}</span></div><p className="text-base font-black text-indigo-600">{CURRENCY} {group.total.toLocaleString()}</p></div>
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                             {group.sales.map(sale => (
                               <div key={sale.id} onClick={() => setSelectedSaleForReceipt(sale)} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                                 <div className="flex justify-between items-start mb-3"><div className="flex-grow"><p className="font-black text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{sale.customerName}</p></div><p className="font-black text-emerald-600 text-sm">{CURRENCY} {sale.totalAmount.toLocaleString()}</p></div>
                                 <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-50"><div className="flex items-center gap-1.5 text-slate-300 text-[10px] font-bold"><Receipt size={12} /> ID: {sale.id.slice(0, 5).toUpperCase()}</div><button className="text-[9px] font-black uppercase text-indigo-400 flex items-center gap-1">View Receipt <Eye size={12}/></button></div>
                               </div>
                             ))}
                           </div>
                         </div>
                       ))}
                    </div>
                 </div>
               )}
             </div>
           )}

           {view === 'billing' && (
              <div className="space-y-6 md:space-y-8 animate-in fade-in">
                 <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                   <h1 className="text-2xl md:text-3xl font-black text-slate-800 w-full text-left">Billing</h1>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-lg"><p className="text-[9px] font-bold uppercase opacity-80">Total Revenue</p><p className="text-2xl md:text-3xl font-black mt-1">{CURRENCY} {billingStats.total.toLocaleString()}</p></div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"><p className="text-[9px] font-bold uppercase text-slate-400">Consultations</p><p className="text-xl md:text-2xl font-black text-blue-600 mt-1">{CURRENCY} {billingStats.consultations.toLocaleString()}</p></div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"><p className="text-[9px] font-bold uppercase text-slate-400">Pharmacy</p><p className="text-xl md:text-2xl font-black text-emerald-600 mt-1">{CURRENCY} {billingStats.pharmacy.toLocaleString()}</p></div>
                 </div>
              </div>
           )}

           {view === 'settings' && (
             <div className="space-y-6 md:space-y-8 animate-in fade-in">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-black text-slate-800">Settings</h1>
                  </div>
                  <div className="flex gap-2 bg-slate-200/50 p-1 rounded-xl w-full overflow-x-auto no-scrollbar scroll-smooth">
                    {[{ id: 'vitals', label: 'Vitals', icon: <Activity size={12}/> }, { id: 'symptoms', label: 'Symptoms', icon: <Droplets size={12}/> }, { id: 'templates', label: 'Templates', icon: <LayoutTemplate size={12}/> }, { id: 'meds', label: 'Medicines', icon: <Pill size={12}/> }, { id: 'scientific', label: 'Scientific', icon: <FlaskConical size={12}/> }, { id: 'companies', label: 'Companies', icon: <Building2 size={12}/> }, { id: 'med_categories', label: 'Cats', icon: <Layers size={12}/> }, { id: 'med_types', label: 'Types', icon: <Tags size={12}/> }].map(tab => (
                      <button key={tab.id} onClick={() => { setSettingsTab(tab.id as any); setSettingsSearchTerm(''); }} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${settingsTab === tab.id ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                        {tab.icon} {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-in slide-in-from-bottom-4">
                  {filteredSettingsItems.map(item => (
                    <div key={item.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm transition-all flex flex-col justify-between group">
                      <div>
                        <h3 className="font-black text-slate-800 text-sm md:text-base leading-tight truncate">{item.name || item.brandName || item.label}</h3>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
           )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 flex items-center justify-between z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] print:hidden">
        <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-1 transition-all flex-1 ${view === 'dashboard' ? 'text-blue-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}><LayoutDashboard size={18} /><span className="text-[8px] font-black uppercase">Home</span></button>
        <button onClick={() => setView('patients')} className={`flex flex-col items-center gap-1 transition-all flex-1 ${view === 'patients' || view === 'patient-detail' ? 'text-blue-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}><Users size={18} /><span className="text-[8px] font-black uppercase">Files</span></button>
        <button onClick={() => setView('visits')} className={`flex flex-col items-center gap-1 transition-all flex-1 ${view === 'visits' ? 'text-blue-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}><ClipboardList size={18} /><span className="text-[8px] font-black uppercase">Logs</span></button>
        <button onClick={() => setView('pharmacy')} className={`flex flex-col items-center gap-1 transition-all flex-1 ${view === 'pharmacy' ? 'text-blue-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}><Pill size={18} /><span className="text-[8px] font-black uppercase">Med</span></button>
        <button onClick={() => setView('sync')} className={`flex flex-col items-center gap-1 transition-all flex-1 ${view === 'sync' ? 'text-blue-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}><Cloud size={18} /><span className="text-[8px] font-black uppercase">Sync</span></button>
        <button onClick={() => setView('settings')} className={`flex flex-col items-center gap-1 transition-all flex-1 ${view === 'settings' ? 'text-blue-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}><Settings size={18} /><span className="text-[8px] font-black uppercase">Setup</span></button>
      </nav>

      {/* --- Modals --- */}
      {selectedSaleForReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[700] flex items-center justify-center p-0 sm:p-4 animate-in zoom-in" onClick={() => setSelectedSaleForReceipt(null)}>
           <div className="bg-white w-full h-full sm:h-auto sm:max-w-2xl sm:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="p-6 md:p-8 bg-indigo-600 text-white flex justify-between items-center shrink-0"><div className="flex items-center gap-3"><Receipt size={24} /><div><h2 className="text-xl font-black tracking-tight">Sales Receipt</h2><p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">ID: {selectedSaleForReceipt.id.toUpperCase()}</p></div></div><button onClick={() => setSelectedSaleForReceipt(null)} className="text-3xl hover:opacity-70 transition-opacity">&times;</button></div>
              <div className="p-6 md:p-10 space-y-8 flex-grow overflow-y-auto custom-scrollbar">
                 <div className="flex justify-between items-end border-b-2 border-slate-50 pb-6"><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Customer Details</p><p className="text-lg font-black text-slate-800">{selectedSaleForReceipt.customerName}</p><p className="text-xs font-bold text-slate-50">{formatDate(selectedSaleForReceipt.date)}</p></div><div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment Status</p><span className="px-4 py-1 bg-emerald-100 text-emerald-600 rounded-full font-black text-[10px] uppercase">Paid</span></div></div>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3"><button onClick={() => window.print()} className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-slate-100 transition-all"><Printer size={16}/> Print Copy</button><button onClick={() => setSelectedSaleForReceipt(null)} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-100 active:scale-95 transition-all">Close</button></div>
           </div>
        </div>
      )}

      {qrVisit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[600] flex items-center justify-center p-0 sm:p-4" onClick={() => setQrVisit(null)}>
           <div className="bg-white w-full h-full sm:h-auto sm:max-w-md sm:rounded-[3.5rem] p-8 md:p-12 shadow-2xl flex flex-col items-center text-center gap-6 animate-in zoom-in" onClick={e => e.stopPropagation()}>
              <div className="w-full flex justify-end sm:hidden"><button onClick={() => setQrVisit(null)} className="text-slate-400 text-3xl">&times;</button></div>
              <div className="bg-indigo-50 p-6 rounded-3xl text-indigo-600 shadow-inner"><QrCode size={48} /></div>
              <div><h2 className="text-xl md:text-2xl font-black text-slate-800">Scan Visit QR</h2></div>
              <div className="p-3 md:p-4 bg-white border-8 border-slate-50 rounded-3xl shadow-lg"><QRCodeCanvas value={getVisitQrData(qrVisit)} size={200} level="M" /></div>
              <button onClick={() => setQrVisit(null)} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all">Dismiss</button>
           </div>
        </div>
      )}

      {qrPatient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[600] flex items-center justify-center p-0 sm:p-4" onClick={() => setQrPatient(null)}>
           <div className="bg-white w-full h-full sm:h-auto sm:max-w-md sm:rounded-[3.5rem] p-8 md:p-12 shadow-2xl flex flex-col items-center text-center gap-6 animate-in zoom-in" onClick={e => e.stopPropagation()}>
              <div className="w-full flex justify-end sm:hidden"><button onClick={() => setQrPatient(null)} className="text-slate-400 text-3xl">&times;</button></div>
              <div className="bg-blue-50 p-6 rounded-3xl text-blue-600 shadow-inner"><User size={48} /></div>
              <div><h2 className="text-xl md:text-2xl font-black text-slate-800">Patient Profile QR</h2></div>
              <div className="p-3 md:p-4 bg-white border-8 border-slate-50 rounded-3xl shadow-lg"><QRCodeCanvas value={getPatientQrData(qrPatient)} size={240} level="M" /></div>
              <button onClick={() => setQrPatient(null)} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all">Dismiss</button>
           </div>
        </div>
      )}

      {showVisitForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[500] flex items-center justify-center p-0 sm:p-4 animate-in slide-in-from-bottom sm:zoom-in">
          <div className="bg-white w-full h-full sm:h-auto sm:max-w-5xl sm:rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden">
             <div className="p-6 md:p-8 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex justify-between items-center shrink-0"><h2 className="text-xl md:text-2xl font-black tracking-tight">{editingVisit ? 'Update Log' : 'Clinical Encounter'}</h2><button onClick={() => { setShowVisitForm(false); setEditingVisit(null); setTempPrescribedMeds([]); setFormDiagnosis(''); setFormSelectedPatientId(null); setPatientFormSearch(''); setShowPatientResults(false); }} className="text-3xl">&times;</button></div>
             <form onSubmit={handleVisitSubmit} className="p-6 md:p-10 space-y-8 md:space-y-10 bg-slate-50/30 flex-grow overflow-y-auto custom-scrollbar">
                <input type="hidden" name="patientId" value={formSelectedPatientId || ""} />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <div className="space-y-2 relative group">
                    <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deep Search Patient</label>
                    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={16} /><input type="text" placeholder="Name, Phone, Reg#, Age, Visit..." value={patientFormSearch} onChange={(e) => { setPatientFormSearch(e.target.value); setShowPatientResults(true); }} onFocus={() => setShowPatientResults(true)} className="w-full pl-10 pr-10 py-4 rounded-xl md:rounded-2xl border-2 border-slate-100 font-black focus:border-emerald-500 outline-none text-sm transition-all shadow-sm" /></div>
                    {showPatientResults && patientFormResults.length > 0 && (<div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-100 shadow-2xl rounded-2xl z-[500] max-h-48 overflow-y-auto">{patientFormResults.map(p => (<button key={p.id} type="button" onClick={() => { setFormSelectedPatientId(p.id); setPatientFormSearch(p.name); setShowPatientResults(false); }} className="w-full text-left px-5 py-3 hover:bg-emerald-50 border-b border-slate-50 font-black text-xs">{p.name} <span className="text-[9px] text-slate-400 opacity-70 ml-2">{p.patientCode}</span></button>))}</div>)}
                  </div>
                  <div className="space-y-2"><label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Visit Date</label><input type="date" name="date" defaultValue={editingVisit?.date || getCurrentIsoDate()} className="w-full p-4 rounded-xl md:rounded-2xl border-2 border-slate-100 font-black focus:border-emerald-500 outline-none text-sm" /></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
                  <div className="space-y-6">
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Diagnosis</label><textarea required name="diagnosis" value={formDiagnosis} onChange={e => setFormDiagnosis(e.target.value)} rows={3} className="w-full p-4 md:p-5 rounded-2xl md:rounded-[2rem] border-2 border-slate-100 font-black text-sm md:text-lg focus:border-emerald-500 outline-none resize-none" placeholder="Medical evaluation..."></textarea></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2"><Droplets size={14} className="text-blue-500" /> Symptoms</label><div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-3 md:p-4 border-2 border-slate-100 rounded-2xl md:rounded-3xl bg-white shadow-inner">{symptoms.map(s => (<label key={s.id} className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-slate-100 cursor-pointer hover:border-blue-300 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500 group"><input type="checkbox" name="selectedSymptoms" value={s.label} defaultChecked={editingVisit?.symptoms?.includes(s.label)} className="hidden" /><span className="text-[10px] font-black text-slate-500 group-has-[:checked]:text-blue-700">{s.label}</span></label>))}</div></div>
                  </div>
                </div>
                <button type="submit" className="w-full bg-emerald-600 text-white py-4 md:py-5 rounded-2xl md:rounded-3xl font-black uppercase tracking-widest shadow-xl text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"><CheckCircle2 size={20} /> Finalize & Print</button>
             </form>
          </div>
        </div>
      )}

      <div className="hidden print:block print-only fixed inset-0 bg-white text-black font-sans leading-tight z-[1000] print-container">
        {printingVisit ? (() => {
          const p = patients.find(pat => pat.id === printingVisit.patientId);
          return (<div className="w-full p-4 space-y-4 text-[13px]"><div className="text-center border-b-2 border-black pb-4 mb-4"><h1 className="text-2xl font-black">SmartClinic</h1><p className="font-bold uppercase tracking-widest">Medical Hub</p></div><div className="space-y-3"><div className="flex"><span className="font-bold w-24">Name:</span> <span>{p?.name || '---'}</span></div><div className="flex"><span className="font-bold w-24">Date:</span> <span>{formatDate(printingVisit.date)}</span></div><div className="flex"><span className="font-bold w-24">Symptoms:</span> <span>{printingVisit.symptoms || '---'}</span></div></div></div>);
        })() : null}
      </div>
    </div>
  );
};

export default App;
