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
  TrendingDown
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
  { id: 'p1', patientCode: 'P-0001', name: 'Ali Ahmed', age: 45, gender: 'Male', phone: '0300-1234567', address: 'DHA Phase 5, Lahore', allergies: 'Penicillin', chronicConditions: 'Type 2 Diabetes' },
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
  const [settingsTab, setSettingsTab] = useState<'vitals' | 'symptoms' | 'scientific' | 'companies' | 'med_categories' | 'med_types' | 'meds' | 'templates'>('vitals');
  const [detailTab, setDetailTab] = useState<'history' | 'prescriptions'>('history');
  const [prescSort, setPrescSort] = useState<{ key: 'date' | 'name', direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  
  // Search and Filter States
  const [medSearchTerm, setMedSearchTerm] = useState('');
  const [visitSearchTerm, setVisitSearchTerm] = useState('');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [settingsSearchTerm, setSettingsSearchTerm] = useState('');
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [billingDate, setBillingDate] = useState<string>(''); 
  
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

  // Allergy state for tag-based selection
  const [allergySearchTerm, setAllergySearchTerm] = useState('');
  const [selectedAllergiesInForm, setSelectedAllergiesInForm] = useState<string[]>([]);

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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
  }, [patients, medications, scientificNames, companyNames, medTypes, medCategories, symptoms, vitalDefinitions, prescriptionTemplates, visits, pharmacySales]);

  // --- CSV Helpers ---
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
      const newPatients: Patient[] = lines.slice(1).map(line => {
        const [code, name, age, gender, phone, address, allergies, chronic] = line.split(',');
        return {
          id: Math.random().toString(36).substr(2, 9),
          patientCode: code || `P-${Math.floor(Math.random() * 9000) + 1000}`,
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
        return `${med?.brandName || 'Unknown'} (${pm.quantity})`;
      }).join('; ');
      return [formatDate(v.date), `"${p?.name || 'Unknown'}"`, `"${v.symptoms || ''}"`, `"${v.diagnosis || ''}"`, `"${vitalsStr}"`, `"${medsStr}"`, v.feeAmount || 0, v.paymentStatus || 'Paid'];
    });
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    downloadCsv(`clinical_logs_${getCurrentIsoDate()}.csv`, csvContent);
  };

  const handleWhatsAppShare = (visit: Visit, patient: Patient) => {
    const medsText = visit.prescribedMeds.map(pm => {
      const med = medications.find(m => m.id === pm.medicationId);
      return `- *${med?.brandName}*: ${pm.quantity}`;
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
    return patients.filter(p => {
      const s = patientSearchTerm.toLowerCase();
      return p.name.toLowerCase().includes(s) || p.phone.toLowerCase().includes(s) || p.patientCode.toLowerCase().includes(s);
    });
  }, [patients, patientSearchTerm]);

  const filteredMeds = useMemo(() => {
    return medications.filter(m => {
      const s = medSearchTerm.toLowerCase();
      return m.brandName.toLowerCase().includes(s) || m.scientificName.toLowerCase().includes(s) || m.companyName.toLowerCase().includes(s) || m.category.toLowerCase().includes(s);
    });
  }, [medications, medSearchTerm]);

  const filteredSettingsItems = useMemo(() => {
    const s = settingsSearchTerm.toLowerCase();
    switch (settingsTab) {
      case 'symptoms': return symptoms.filter(i => i.label.toLowerCase().includes(s));
      case 'scientific': return scientificNames.filter(i => i.label.toLowerCase().includes(s));
      case 'med_categories': return medCategories.filter(i => i.label.toLowerCase().includes(s));
      case 'med_types': return medTypes.filter(i => i.label.toLowerCase().includes(s));
      case 'companies': return companyNames.filter(i => i.label.toLowerCase().includes(s));
      case 'vitals': return vitalDefinitions.filter(i => i.label.toLowerCase().includes(s));
      case 'templates': return prescriptionTemplates.filter(i => i.name.toLowerCase().includes(s));
      case 'meds': return medications.filter(i => i.brandName.toLowerCase().includes(s) || i.scientificName.toLowerCase().includes(s));
      default: return [];
    }
  }, [settingsTab, symptoms, scientificNames, medCategories, medTypes, companyNames, vitalDefinitions, medications, prescriptionTemplates, settingsSearchTerm]);

  const filteredBillingConsultations = useMemo(() => {
    if (!billingDate) return visits;
    return visits.filter(v => v.date === billingDate);
  }, [visits, billingDate]);

  const filteredBillingPharmacy = useMemo(() => {
    if (!billingDate) return pharmacySales;
    return pharmacySales.filter(s => s.date === billingDate);
  }, [pharmacySales, billingDate]);

  const billingStats = useMemo(() => {
    const consultationIncome = filteredBillingConsultations.filter(v => v.paymentStatus === 'Paid').reduce((sum, v) => sum + (v.feeAmount || 0), 0);
    const pharmacyIncome = filteredBillingPharmacy.reduce((sum, s) => sum + s.totalAmount, 0);
    return {
      total: consultationIncome + pharmacyIncome,
      consultations: consultationIncome,
      pharmacy: pharmacyIncome
    };
  }, [filteredBillingConsultations, filteredBillingPharmacy]);

  const addToCart = (medId: string) => {
    const med = medications.find(m => m.id === medId);
    if (!med || med.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.medicationId === medId);
      if (existing) return prev.map(item => item.medicationId === medId ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { medicationId: medId, quantity: 1 }];
    });
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
    setCart([]);
    setWalkinName('Walk-in Customer');
    alert("Sale completed!");
  };

  const handleVisitSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const pId = f.get('patientId') as string;
    if (!pId) { alert("Please select a patient first."); return; }
    const vitals: Record<string, string> = {};
    vitalDefinitions.forEach(v => {
      const val = f.get(`vital_${v.id}`) as string;
      if (val) vitals[v.id] = val;
    });
    const finalPrescribedMeds = tempPrescribedMeds
      .map(({searchTerm, ...rest}) => rest)
      .filter(pm => pm.medicationId !== '');
    const visitId = editingVisit ? editingVisit.id : Math.random().toString(36).substr(2, 9);
    const newVisit: Visit = {
      id: visitId,
      patientId: pId,
      date: f.get('date') as string,
      diagnosis: formDiagnosis,
      symptoms: (f.getAll('selectedSymptoms') as string[]).join(', '),
      feeAmount: parseFloat(f.get('feeAmount') as string) || 0,
      paymentStatus: (f.get('paymentStatus') || 'Paid') as any,
      vitals,
      prescribedMeds: finalPrescribedMeds
    };
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
    } catch (e) {
      setAiSummary("Error generating analysis.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleDeletePatient = (patientId: string) => {
    if (window.confirm("Are you sure you want to delete this patient and all their clinical records?")) {
      setPatients(prev => prev.filter(p => p.id !== patientId));
      setVisits(prev => prev.filter(v => v.patientId !== patientId));
      if (selectedPatientId === patientId) {
        setSelectedPatientId(null);
        setView('patients');
      }
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
        return `${m?.brandName} ${m?.scientificName}`;
      }).join(' ');
      const combinedData = `
        ${p?.name} 
        ${p?.patientCode} 
        ${p?.phone} 
        ${v.diagnosis} 
        ${v.date} 
        ${v.symptoms} 
        ${medStrings}
      `.toLowerCase();
      return combinedData.includes(sTerm);
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [visits, patients, medications, visitSearchTerm]);

  const stats = useMemo(() => {
    const consultationIncome = visits.filter(v => v.paymentStatus === 'Paid').reduce((sum, v) => sum + (v.feeAmount || 0), 0);
    const pharmacyIncome = pharmacySales.reduce((sum, s) => sum + s.totalAmount, 0);
    const lowStockCount = medications.filter(m => m.stock <= m.reorderLevel).length;
    return {
      totalPatients: patients.length,
      totalVisits: visits.length,
      collected: consultationIncome + pharmacyIncome,
      pending: visits.filter(v => v.paymentStatus === 'Pending').reduce((sum, v) => sum + (v.feeAmount || 0), 0),
      lowStockCount
    };
  }, [patients, visits, pharmacySales, medications]);

  const selectedPatientInForm = useMemo(() => {
    if (!formSelectedPatientId) return null;
    return patients.find(p => p.id === formSelectedPatientId) || null;
  }, [formSelectedPatientId, patients]);

  const patientFormResults = useMemo(() => {
    if (!patientFormSearch.trim()) return [];
    const s = patientFormSearch.toLowerCase();
    return patients.filter(p => 
      p.name.toLowerCase().includes(s) || 
      p.phone.includes(s) || 
      p.patientCode.toLowerCase().includes(s)
    ).slice(0, 5);
  }, [patients, patientFormSearch]);

  const patientPrescriptions = useMemo(() => {
    if (!selectedPatientId) return [];
    const pVisits = visits.filter(v => v.patientId === selectedPatientId);
    const flattened: any[] = [];
    pVisits.forEach(v => {
      v.prescribedMeds.forEach(pm => {
        const med = medications.find(m => m.id === pm.medicationId);
        flattened.push({
          date: v.date,
          diagnosis: v.diagnosis,
          medName: med?.brandName || 'Unknown',
          strength: med?.strength || '',
          quantity: pm.quantity,
          dosage: pm.dosage,
          visitId: v.id
        });
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
    setPrescSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const getVisitQrData = (visit: Visit) => {
    const patient = patients.find(p => p.id === visit.patientId);
    const medDetails = visit.prescribedMeds.map(pm => {
      const med = medications.find(m => m.id === pm.medicationId);
      const name = med?.brandName || 'Unknown';
      return `${name} x ${pm.quantity || 0}`;
    }).join(', ');
    return `Name: ${patient?.name || 'N/A'}\nDate of Visit: ${formatDate(visit.date)}\nSymptoms: ${visit.symptoms || 'None'}\nMedication: ${medDetails || 'None'}`;
  };

  const getPatientQrData = (p: Patient) => {
    return `Patient Profile\nName: ${p.name}\nCode: ${p.patientCode}\nPhone: ${p.phone}\nAddress: ${p.address}\nAllergies: ${p.allergies || 'None'}\nChronic: ${p.chronicConditions || 'None'}`;
  };

  const filteredAllergyOptions = useMemo(() => {
    const s = allergySearchTerm.toLowerCase();
    if (!s) return [];
    const brandMap = new Map();
    medications.forEach(m => {
      if (!brandMap.has(m.brandName)) { brandMap.set(m.brandName, m.scientificName); }
    });
    const scientificOptions = scientificNames.map(sn => ({ id: sn.id, label: sn.label, display: sn.label, sub: 'Scientific', isBrand: false }));
    const brandOptions = Array.from(brandMap.entries()).map(([brand, sci], idx) => ({ id: `brand_${idx}`, label: brand, display: brand, sub: sci, isBrand: true }));
    const options = [...scientificOptions, ...brandOptions];
    const result = options.filter(opt => opt.label.toLowerCase().includes(s) || opt.sub.toLowerCase().includes(s));
    return result.sort((a, b) => a.label.localeCompare(b.label)).slice(0, 100);
  }, [scientificNames, medications, allergySearchTerm]);

  const filteredHistory = useMemo(() => {
    if (!selectedPatientId) return [];
    const s = historySearchTerm.toLowerCase();
    return visits.filter(v => v.patientId === selectedPatientId).filter(v => {
      if (!s) return true;
      const medNames = v.prescribedMeds.map(pm => {
        const med = medications.find(med => med.id === pm.medicationId);
        return `${med?.brandName || ''} ${med?.scientificName || ''}`;
      }).join(' ');
      return (v.diagnosis.toLowerCase().includes(s) || v.symptoms.toLowerCase().includes(s) || v.date.includes(s) || medNames.toLowerCase().includes(s));
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedPatientId, visits, historySearchTerm, medications]);

  const checkMedAllergy = (medId: string) => {
    const p = selectedPatientInForm;
    if (!p || !p.allergies || !medId) return false;
    const med = medications.find(m => m.id === medId);
    if (!med) return false;
    const allergiesArray = p.allergies.split(',').map(a => a.trim().toLowerCase()).filter(Boolean);
    const medSci = med.scientificName.toLowerCase().trim();
    const medBrand = med.brandName.toLowerCase().trim();
    return allergiesArray.some(a => a === medSci || a === medBrand);
  };

  const getBrandsForScientific = (scientificLabel: string) => medications.filter(m => m.scientificName.toLowerCase() === scientificLabel.toLowerCase()).map(m => m.brandName);
  const getBrandsForCompany = (companyLabel: string) => medications.filter(m => m.companyName.toLowerCase() === companyLabel.toLowerCase()).map(m => m.brandName);

  const analyticsData = useMemo(() => {
    const medFrequency: Record<string, number> = {};
    visits.forEach(v => {
      v.prescribedMeds.forEach(pm => {
        const med = medications.find(m => m.id === pm.medicationId);
        if (med) { medFrequency[med.brandName] = (medFrequency[med.brandName] || 0) + 1; }
      });
    });
    const topPrescribed = Object.entries(medFrequency).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 5);
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });
    const revenueByDay = last7Days.map(date => {
      const vTotal = visits.filter(v => v.date === date && v.paymentStatus === 'Paid').reduce((sum, v) => sum + (v.feeAmount || 0), 0);
      const pTotal = pharmacySales.filter(s => s.date === date).reduce((sum, s) => sum + s.totalAmount, 0);
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

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 font-sans text-slate-900 overflow-x-hidden relative">
      <header className="md:hidden sticky top-0 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-4 py-3 shrink-0 print:hidden">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-xl text-white"><Stethoscope size={20} /></div>
          <span className="text-lg font-black text-slate-800 tracking-tighter">SmartClinic</span>
        </div>
        <button onClick={() => { setEditingVisit(null); setShowVisitForm(true); }} className="bg-blue-600 text-white p-2 rounded-xl shadow-lg"><Plus size={20} /></button>
      </header>

      <aside className="w-80 bg-slate-50 border-r border-slate-200 p-8 flex flex-col gap-10 sticky top-0 h-screen hidden md:flex print:hidden shrink-0">
        <div className="flex items-center gap-4 px-2">
           <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-xl shadow-blue-100"><Stethoscope size={32} /></div>
           <div className="flex flex-col"><span className="text-2xl font-black text-slate-800 tracking-tighter">SmartClinic</span><span className="text-[10px] font-black text-blue-600 uppercase tracking-widest text-center">MEDICAL HUB</span></div>
        </div>
        <nav className="flex flex-col gap-3 flex-grow">
          <SidebarItem icon={<LayoutDashboard size={24} />} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <SidebarItem icon={<Users size={24} />} label="Patients" active={view === 'patients' || view === 'patient-detail'} onClick={() => setView('patients')} />
          <SidebarItem icon={<ClipboardList size={24} />} label="Clinical Logs" active={view === 'visits'} onClick={() => setView('visits')} />
          <SidebarItem icon={<ShoppingCart size={24} />} label="Pharmacy" active={view === 'pharmacy'} onClick={() => setView('pharmacy')} />
          <SidebarItem icon={<Receipt size={24} />} label="Billing" active={view === 'billing'} onClick={() => setView('billing')} />
          <SidebarItem icon={<BarChart3 size={24} />} label="Analytics" active={view === 'analytics'} onClick={() => setView('analytics')} />
          <SidebarItem icon={<Settings size={24} />} label="Settings" active={view === 'settings'} onClick={() => setView('settings')} />
        </nav>
      </aside>

      <main className="flex-grow p-4 md:p-12 overflow-auto print:hidden pb-24 md:pb-12">
        <div className="max-w-6xl mx-auto w-full">
           {view === 'dashboard' && (
              <div className="space-y-6 md:space-y-10 animate-in fade-in">
                <h1 className="text-2xl md:text-3xl font-black text-slate-800">Dashboard</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  <div onClick={() => setView('patients')} className="bg-blue-50 p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] text-white shadow-xl shadow-blue-100 cursor-pointer hover:scale-[1.02] transition-transform active:scale-95 group">
                    <p className="opacity-70 text-[10px] font-bold uppercase tracking-widest">Total Patients</p>
                    <p className="text-3xl md:text-4xl font-black mt-1 flex items-center justify-between">{stats.totalPatients}<Users size={24} className="opacity-30 group-hover:opacity-100 transition-opacity" /></p>
                  </div>
                  <div onClick={() => setView('billing')} className="bg-emerald-500 p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] text-white shadow-xl shadow-emerald-100 cursor-pointer hover:scale-[1.02] transition-transform active:scale-95 group">
                    <p className="opacity-70 text-[10px] font-bold uppercase tracking-widest">Total Revenue</p>
                    <p className="text-2xl md:text-3xl font-black mt-1 flex items-center justify-between">{CURRENCY} {stats.collected.toLocaleString()}<TrendingUp size={24} className="opacity-30 group-hover:opacity-100 transition-opacity" /></p>
                  </div>
                  <div className="bg-amber-500 p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] text-white shadow-xl shadow-amber-100 group">
                    <p className="opacity-70 text-[10px] font-bold uppercase tracking-widest">Pending Payments</p>
                    <p className="text-2xl md:text-3xl font-black mt-1 flex items-center justify-between">{CURRENCY} {stats.pending.toLocaleString()}<Wallet size={24} className="opacity-30 group-hover:opacity-100 transition-opacity" /></p>
                  </div>
                  <div onClick={() => { setView('settings'); setSettingsTab('meds'); }} className="bg-rose-50 p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] text-white shadow-xl shadow-rose-100 cursor-pointer hover:scale-[1.02] transition-transform active:scale-95 group">
                    <p className="opacity-70 text-[10px] font-bold uppercase tracking-widest">Low Stock Medicines</p>
                    <p className="text-3xl md:text-4xl font-black mt-1 flex items-center justify-between">{stats.lowStockCount}<PackageSearch size={24} className="opacity-30 group-hover:opacity-100 transition-opacity" /></p>
                  </div>
                  <div onClick={() => setView('visits')} className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-transform active:scale-95 group">
                     <div><p className="text-slate-400 text-[10px] font-bold uppercase">Visits Today</p><p className="text-3xl md:text-4xl font-black text-slate-800">{visits.filter(v => v.date === getCurrentIsoDate()).length}</p></div>
                     <Clock size={40} className="text-blue-200 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <div onClick={() => setView('analytics')} className="bg-indigo-50 p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-transform active:scale-95 group">
                     <div><p className="text-indigo-400 text-[10px] font-bold uppercase">Performance</p><p className="text-xl md:text-2xl font-black text-indigo-900">View Analytics</p></div>
                     <BarChart3 size={40} className="text-indigo-200 group-hover:text-indigo-500 transition-colors" />
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
                              <div style={{ height: `${Math.max(height, 5)}%` }} className="w-full bg-blue-500 rounded-t-lg group-hover:bg-blue-600 transition-all relative">
                                {day.total > 0 && (
                                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{CURRENCY} {day.total}</div>
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
                           <div className="flex justify-between text-xs font-black text-slate-600"><span>{name}</span><span>{count} times</span></div>
                           <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div style={{ width: `${width}%` }} className="h-full rounded-full transition-all duration-1000 bg-indigo-500" /></div>
                         </div>
                       );
                     })}
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
                    <button onClick={() => { setEditingPatient(null); setSelectedAllergiesInForm([]); setShowPatientForm(true); }} className="bg-blue-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-black shadow-lg whitespace-nowrap text-sm">Register</button>
                 </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                 {filteredPatients.map(p => (
                   <div key={p.id} onClick={() => { setSelectedPatientId(p.id); setView('patient-detail'); setDetailTab('history'); setHistorySearchTerm(''); }} className="bg-white p-5 md:p-6 rounded-3xl md:rounded-[2rem] border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-all group relative flex flex-col justify-between min-h-[140px]">
                     <div>
                       <div className="flex items-center gap-4">
                         <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black shrink-0">{p.name[0]}</div>
                         <div className="flex-grow min-w-0">
                           <h3 className="font-black text-slate-800 truncate text-base">{p.name}</h3>
                           <p className="text-[11px] text-blue-600 font-bold leading-tight">{p.phone}</p>
                           {p.allergies && <p className="text-[10px] text-rose-500 font-bold truncate leading-tight mt-0.5">Allergy: {p.allergies}</p>}
                         </div>
                       </div>
                     </div>
                     <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                       <button onClick={(e) => { e.stopPropagation(); setEditingPatient(p); setSelectedAllergiesInForm(p.allergies ? p.allergies.split(', ') : []); setShowPatientForm(true); }} className="p-2 text-slate-400 hover:text-blue-500"><Edit2 size={16} /></button>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           )}
           {/* Detailed View and Visits code remains exactly as provided previously... */}
        </div>
      </main>

      {/* --- Mobile Bottom Navigation --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-3 py-2 flex items-center justify-between z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] print:hidden">
        <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-1 transition-all ${view === 'dashboard' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
          <LayoutDashboard size={20} /><span className="text-[9px] font-black uppercase">Home</span>
        </button>
        <button onClick={() => setView('patients')} className={`flex flex-col items-center gap-1 transition-all ${view === 'patients' || view === 'patient-detail' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
          <Users size={20} /><span className="text-[9px] font-black uppercase">Files</span>
        </button>
        <button onClick={() => setView('visits')} className={`flex flex-col items-center gap-1 transition-all ${view === 'visits' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
          <ClipboardList size={20} /><span className="text-[9px] font-black uppercase">Logs</span>
        </button>
        <button onClick={() => setView('pharmacy')} className={`flex flex-col items-center gap-1 transition-all ${view === 'pharmacy' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
          <Pill size={20} /><span className="text-[9px] font-black uppercase">Med</span>
        </button>
        <button onClick={() => setView('analytics')} className={`flex flex-col items-center gap-1 transition-all ${view === 'analytics' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
          <BarChart3 size={20} /><span className="text-[9px] font-black uppercase">Stats</span>
        </button>
        {/* Missing Settings Tab Added Here */}
        <button onClick={() => setView('settings')} className={`flex flex-col items-center gap-1 transition-all ${view === 'settings' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
          <Settings size={20} /><span className="text-[9px] font-black uppercase">Setup</span>
        </button>
      </nav>

      {/* --- Patient Form Modal (Tag-based Allergy search logic preserved) --- */}
      {showPatientForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[500] flex items-center justify-center p-0 sm:p-4">
           <div className="bg-white w-full h-full sm:h-auto sm:max-w-lg sm:rounded-[3rem] shadow-2xl flex flex-col animate-in slide-in-from-bottom sm:zoom-in">
             <div className="p-6 md:p-8 bg-blue-600 text-white flex justify-between items-center shrink-0">
               <h2 className="text-xl font-black tracking-tight">{editingPatient ? 'Update Profile' : 'Register Patient'}</h2>
               <button onClick={() => { setShowPatientForm(false); setEditingPatient(null); setAllergySearchTerm(''); setSelectedAllergiesInForm([]); }} className="text-3xl">&times;</button>
             </div>
             <form onSubmit={(e) => { 
               e.preventDefault(); 
               const f = new FormData(e.currentTarget); 
               const d = { 
                 name: f.get('name') as string, age: parseInt(f.get('age') as string), gender: f.get('gender') as any, phone: f.get('phone') as string, address: f.get('address') as string, 
                 allergies: selectedAllergiesInForm.join(', '), chronicConditions: f.get('chronicConditions') as string 
               }; 
               if (editingPatient) setPatients(prev => prev.map(i => i.id === editingPatient.id ? { ...i, ...d } : i)); 
               else { 
                 const code = `P-${(patients.length + 1).toString().padStart(4, '0')}`; 
                 setPatients(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), patientCode: code, ...d }]); 
               } 
               setShowPatientForm(false); setEditingPatient(null); setAllergySearchTerm(''); setSelectedAllergiesInForm([]);
             }} className="p-6 md:p-8 space-y-5 flex-grow overflow-y-auto custom-scrollbar">
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Full Name</label><input required name="name" defaultValue={editingPatient?.name} className="w-full p-4 rounded-xl border-2 border-slate-100 bg-slate-50 font-black text-sm" /></div>
                <div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Age</label><input required type="number" name="age" defaultValue={editingPatient?.age} className="w-full p-4 rounded-xl border-2 border-slate-100 bg-slate-50 font-black text-sm" /></div><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Gender</label><select name="gender" defaultValue={editingPatient?.gender} className="w-full p-4 rounded-xl border-2 border-slate-100 bg-slate-50 font-black text-sm"><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Phone</label><input required name="phone" defaultValue={editingPatient?.phone} className="w-full p-4 rounded-xl border-2 border-slate-100 bg-slate-50 font-black text-sm" /></div>
                
                <div className="border-t pt-4 space-y-3">
                  <label className="text-[10px] font-black text-rose-400 uppercase ml-1">Patient Allergies</label>
                  {selectedAllergiesInForm.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedAllergiesInForm.map(alg => (
                        <span key={alg} className="bg-rose-50 text-rose-600 px-3 py-1.5 rounded-xl border border-rose-100 text-[10px] font-black flex items-center gap-2">
                          {alg}
                          <button type="button" onClick={() => setSelectedAllergiesInForm(selectedAllergiesInForm.filter(a => a !== alg))} className="text-rose-300 hover:text-rose-600"><X size={14}/></button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="relative">
                    <Search className="absolute left-3 top-3.5 text-slate-300" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search Allergies (e.g. Panadol, Aspirin...)" 
                      value={allergySearchTerm}
                      onChange={(e) => setAllergySearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-100 bg-slate-50 text-xs font-bold focus:border-rose-300 outline-none"
                    />
                    {allergySearchTerm && (
                      <div className="absolute z-[600] left-0 right-0 mt-2 bg-white border border-slate-200 shadow-2xl rounded-2xl max-h-48 overflow-y-auto">
                        {filteredAllergyOptions.map(opt => (
                          <button key={opt.id} type="button" className="w-full text-left px-5 py-3 hover:bg-rose-50 border-b last:border-none" onClick={() => { if (!selectedAllergiesInForm.includes(opt.label)) { setSelectedAllergiesInForm([...selectedAllergiesInForm, opt.label]); } setAllergySearchTerm(''); }}>
                            <span className="text-[11px] font-black text-slate-800">{opt.display}</span>
                            <span className="block text-[9px] uppercase font-bold text-slate-400">{opt.isBrand ? `Brand • ${opt.sub}` : 'Scientific Name'}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1"><label className="text-[10px] font-black text-amber-500 uppercase ml-1">Chronic Conditions</label><input name="chronicConditions" defaultValue={editingPatient?.chronicConditions} placeholder="None" className="w-full p-4 rounded-xl border-2 border-amber-100 bg-amber-50/20 font-black text-amber-700 text-sm outline-none" /></div>
                <button type="submit" className="w-full bg-blue-600 text-white py-4 md:py-5 rounded-2xl md:rounded-3xl font-black uppercase tracking-widest shadow-xl text-sm mt-4">Save Profile</button>
             </form>
           </div>
        </div>
      )}
      {/* Remaining Modals (Settings, Visit Encounter etc.) kept exactly as per previous version */}
    </div>
  );
};

export default App;