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
  Wifi
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Patient, Visit, Medication, View, PrescribedMed, Symptom, VitalDefinition, PharmacySale, PharmacySaleItem, ScientificName, CompanyName, MedType, MedCategory, PrescriptionTemplate } from './types';
import { getPatientHistorySummary } from './services/gemini';

// --- Broadcast Channel for Real-time Synchronization ---
const syncChannel = new BroadcastChannel('smartclinic_sync_v2');

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

// --- Dummy Data (Fallbacks) ---
const dummyScientificNames: ScientificName[] = [
  { id: 'sc1', label: 'Paracetamol' },
  { id: 'sc2', label: 'Amoxicillin' },
  { id: 'sc3', label: 'Metformin' },
  { id: 'sc4', label: 'Metronidazole' },
  { id: 'sc5', label: 'Ibuprofen' },
  { id: 'sc6', label: 'Omeprazole' }
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
  
  const [patients, setPatients] = useState<Patient[]>(() => getFromLocal('patients', []));
  const [medications, setMedications] = useState<Medication[]>(() => getFromLocal('meds', []));
  const [scientificNames, setScientificNames] = useState<ScientificName[]>(() => getFromLocal('scientific', dummyScientificNames));
  const [companyNames, setCompanyNames] = useState<CompanyName[]>(() => getFromLocal('companies', []));
  const [medTypes, setMedTypes] = useState<MedType[]>(() => getFromLocal('med_types', []));
  const [medCategories, setMedCategories] = useState<MedCategory[]>(() => getFromLocal('med_categories', []));
  const [symptoms, setSymptoms] = useState<Symptom[]>(() => getFromLocal('symptoms', []));
  const [vitalDefinitions, setVitalDefinitions] = useState<VitalDefinition[]>(() => getFromLocal('vitals', []));
  const [prescriptionTemplates, setPrescriptionTemplates] = useState<PrescriptionTemplate[]>(() => getFromLocal('templates', []));
  const [visits, setVisits] = useState<Visit[]>(() => getFromLocal('visits', []));
  const [pharmacySales, setPharmacySales] = useState<PharmacySale[]>(() => getFromLocal('pharmacy_sales', []));
  
  const [cart, setCart] = useState<{ medicationId: string, quantity: number }[]>([]);
  const [walkinName, setWalkinName] = useState('Walk-in Customer');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  
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
  
  const [formSelectedPatientId, setFormSelectedPatientId] = useState<string | null>(null);
  const [patientFormSearch, setPatientFormSearch] = useState('');
  const [showPatientResults, setShowPatientResults] = useState(false);
  const [allergySearchTerm, setAllergySearchTerm] = useState('');

  // --- Real-Time Sync Engine ---
  const isInternalUpdate = useRef(false);

  useEffect(() => {
    const handleSync = (event: MessageEvent) => {
      if (isInternalUpdate.current) return;
      const { type, payload } = event.data;
      if (type === 'SYNC_ALL') {
        isInternalUpdate.current = true;
        if (payload.patients) setPatients(payload.patients);
        if (payload.medications) setMedications(payload.medications);
        if (payload.visits) setVisits(payload.visits);
        if (payload.scientificNames) setScientificNames(payload.scientificNames);
        if (payload.companyNames) setCompanyNames(payload.companyNames);
        if (payload.medTypes) setMedTypes(payload.medTypes);
        if (payload.medCategories) setMedCategories(payload.medCategories);
        if (payload.symptoms) setSymptoms(payload.symptoms);
        if (payload.vitalDefinitions) setVitalDefinitions(payload.vitalDefinitions);
        if (payload.prescriptionTemplates) setPrescriptionTemplates(payload.prescriptionTemplates);
        if (payload.pharmacySales) setPharmacySales(payload.pharmacySales);
        setLastSync(new Date());
        // Small delay to allow react to settle
        setTimeout(() => { isInternalUpdate.current = false; }, 100);
      }
    };
    syncChannel.addEventListener('message', handleSync);
    return () => syncChannel.removeEventListener('message', handleSync);
  }, []);

  useEffect(() => {
    if (isInternalUpdate.current) return;
    
    const fullState = {
      patients, medications, visits, scientificNames, companyNames, 
      medTypes, medCategories, symptoms, vitalDefinitions, 
      prescriptionTemplates, pharmacySales
    };

    // Persistence
    Object.entries(fullState).forEach(([key, val]) => saveToLocal(key, val));
    
    // Broadcast change
    syncChannel.postMessage({ type: 'SYNC_ALL', payload: fullState });
  }, [patients, medications, visits, scientificNames, companyNames, medTypes, medCategories, symptoms, vitalDefinitions, prescriptionTemplates, pharmacySales]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowVisitForm(false); setShowPatientForm(false); setShowMedForm(false);
        setShowSymptomForm(false); setShowScientificForm(false); setShowCompanyForm(false);
        setShowTypeForm(false); setShowCategoryForm(false); setShowVitalDefForm(false);
        setShowTemplateForm(false); setQrVisit(null); setQrPatient(null); setPrintingVisit(null);
        setEditingVisit(null); setEditingPatient(null); setActiveMedSearchIndex(null);
        setFormSelectedPatientId(null); setPatientFormSearch(''); setShowPatientResults(false);
        setAllergySearchTerm('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      if (window.confirm(`Import ${newPatients.length} patients?`)) setPatients(newPatients);
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
    const message = `*Clinic Visit Summary*\n\n*Name:* ${patient.name}\n*Date:* ${formattedDate}\n\n*Medications:*\n${medsText || 'None'}\n\n_SmartClinic_`;
    const formattedPhone = patient.phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${formattedPhone.startsWith('0') ? '92' + formattedPhone.substring(1) : formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const triggerPrint = (visit: Visit) => {
    setPrintingVisit(visit);
    setTimeout(() => { window.print(); }, 300);
  };

  const filteredPatients = useMemo(() => {
    const s = patientSearchTerm.toLowerCase();
    return patients.filter(p => p.name.toLowerCase().includes(s) || p.phone.toLowerCase().includes(s) || p.patientCode.toLowerCase().includes(s));
  }, [patients, patientSearchTerm]);

  const filteredMeds = useMemo(() => {
    const s = medSearchTerm.toLowerCase();
    return medications.filter(m => m.brandName.toLowerCase().includes(s) || m.scientificName.toLowerCase().includes(s) || m.companyName.toLowerCase().includes(s) || m.category.toLowerCase().includes(s));
  }, [medications, medSearchTerm]);

  const filteredSettingsItems = useMemo(() => {
    const s = settingsSearchTerm.toLowerCase();
    switch (settingsTab) {
      case 'symptoms': return symptoms.filter(i => i.label.toLowerCase().includes(s));
      case 'scientific': return scientificNames.filter(i => i.label.toLowerCase().includes(s));
      case 'companies': return companyNames.filter(i => i.label.toLowerCase().includes(s));
      case 'vitals': return vitalDefinitions.filter(i => i.label.toLowerCase().includes(s));
      case 'templates': return prescriptionTemplates.filter(i => i.name.toLowerCase().includes(s));
      case 'meds': return medications.filter(i => i.brandName.toLowerCase().includes(s) || i.scientificName.toLowerCase().includes(s));
      default: return [];
    }
  }, [settingsTab, symptoms, scientificNames, companyNames, vitalDefinitions, medications, prescriptionTemplates, settingsSearchTerm]);

  const billingStats = useMemo(() => {
    const consultations = visits.filter(v => (!billingDate || v.date === billingDate) && v.paymentStatus === 'Paid').reduce((sum, v) => sum + (v.feeAmount || 0), 0);
    const pharmacy = pharmacySales.filter(s => !billingDate || s.date === billingDate).reduce((sum, s) => sum + s.totalAmount, 0);
    return { total: consultations + pharmacy, consultations, pharmacy };
  }, [visits, pharmacySales, billingDate]);

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

  const completeSale = () => {
    if (cart.length === 0) return;
    const items: PharmacySaleItem[] = cart.map(c => ({ medicationId: c.medicationId, quantity: c.quantity, priceAtTime: medications.find(m => m.id === c.medicationId)!.pricePerUnit }));
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.priceAtTime), 0);
    const newSale: PharmacySale = { id: Math.random().toString(36).substr(2, 9), customerName: walkinName, date: getCurrentIsoDate(), items, totalAmount, paymentStatus: 'Paid' };
    setMedications(prev => prev.map(med => {
      const cartItem = cart.find(ci => ci.medicationId === med.id);
      return cartItem ? { ...med, stock: med.stock - cartItem.quantity } : med;
    }));
    setPharmacySales(prev => [...prev, newSale]);
    setCart([]); setWalkinName('Walk-in Customer');
    alert("Checkout Complete");
  };

  const handleVisitSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const pId = f.get('patientId') as string;
    if (!pId) return alert("Select patient");

    const vitals: Record<string, string> = {};
    vitalDefinitions.forEach(v => {
      const val = f.get(`vital_${v.id}`) as string;
      if (val) vitals[v.id] = val;
    });

    const finalPrescribedMeds = tempPrescribedMeds.map(({searchTerm, ...rest}) => rest).filter(pm => pm.medicationId !== '');

    const newVisit: Visit = {
      id: editingVisit ? editingVisit.id : Math.random().toString(36).substr(2, 9),
      patientId: pId, date: f.get('date') as string, diagnosis: formDiagnosis,
      symptoms: (f.getAll('selectedSymptoms') as string[]).join(', '),
      feeAmount: parseFloat(f.get('feeAmount') as string) || 0,
      paymentStatus: (f.get('paymentStatus') || 'Paid') as any,
      vitals, prescribedMeds: finalPrescribedMeds
    };

    setMedications(prev => {
      let updated = [...prev];
      finalPrescribedMeds.forEach(pm => {
        updated = updated.map(m => m.id === pm.medicationId ? { ...m, stock: Math.max(0, m.stock - (pm.quantity || 0)) } : m);
      });
      return updated;
    });

    if (editingVisit) setVisits(v => v.map(i => i.id === editingVisit.id ? newVisit : i));
    else setVisits(v => [...v, newVisit]);
    
    setShowVisitForm(false); setEditingVisit(null); setTempPrescribedMeds([]); setFormDiagnosis('');
    setFormSelectedPatientId(null); setPatientFormSearch(''); triggerPrint(newVisit);
  };

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

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 font-sans text-slate-900 overflow-x-hidden relative">
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-4 py-3 shrink-0 print:hidden">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-xl text-white"><Stethoscope size={20} /></div>
          <span className="text-lg font-black text-slate-800 tracking-tighter">SmartClinic</span>
        </div>
        <button onClick={() => { setEditingVisit(null); setShowVisitForm(true); }} className="bg-blue-600 text-white p-2 rounded-xl shadow-lg"><Plus size={20} /></button>
      </header>

      {/* Sidebar */}
      <aside className="w-80 bg-slate-50 border-r border-slate-200 p-8 flex flex-col gap-10 sticky top-0 h-screen hidden md:flex print:hidden shrink-0">
        <div className="flex items-center gap-4 px-2">
           <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-xl shadow-blue-100"><Stethoscope size={32} /></div>
           <div className="flex flex-col"><span className="text-2xl font-black text-slate-800 tracking-tighter">SmartClinic</span><span className="text-[10px] font-black text-blue-600 uppercase tracking-widest text-center">Medical Hub</span></div>
        </div>

        {/* Sync Status Badge */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
           <div className="relative flex h-3 w-3">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
           </div>
           <div>
             <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Live Sync Active</p>
             <p className="text-[8px] text-emerald-400 font-bold uppercase">Terminal Synced: {lastSync.toLocaleTimeString()}</p>
           </div>
        </div>

        <nav className="flex flex-col gap-3 flex-grow">
          <SidebarItem icon={<LayoutDashboard size={24} />} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <SidebarItem icon={<Users size={24} />} label="Patients" active={view === 'patients' || view === 'patient-detail'} onClick={() => setView('patients')} />
          <SidebarItem icon={<ClipboardList size={24} />} label="Clinical Logs" active={view === 'visits'} onClick={() => setView('visits')} />
          <SidebarItem icon={<ShoppingCart size={24} />} label="Pharmacy" active={view === 'pharmacy'} onClick={() => setView('pharmacy')} />
          <SidebarItem icon={<Receipt size={24} />} label="Billing" active={view === 'billing'} onClick={() => setView('billing')} />
          <SidebarItem icon={<Settings size={24} />} label="Settings" active={view === 'settings'} onClick={() => setView('settings')} />
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-4 md:p-12 overflow-auto print:hidden pb-24 md:pb-12">
        <div className="max-w-6xl mx-auto w-full">
           {view === 'dashboard' && (
              <div className="space-y-10 animate-in fade-in">
                <h1 className="text-3xl font-black text-slate-800">Clinic Overview</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div onClick={() => setView('patients')} className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-100 cursor-pointer hover:scale-[1.02] transition-transform active:scale-95 group">
                    <p className="opacity-70 text-[10px] font-bold uppercase tracking-widest">Active Records</p>
                    <p className="text-4xl font-black mt-1 flex items-center justify-between">{stats.totalPatients}<Users size={24} className="opacity-30 group-hover:opacity-100 transition-opacity" /></p>
                  </div>
                  <div onClick={() => setView('billing')} className="bg-emerald-500 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-100 cursor-pointer hover:scale-[1.02] transition-transform active:scale-95 group">
                    <p className="opacity-70 text-[10px] font-bold uppercase tracking-widest">Total Collected</p>
                    <p className="text-3xl font-black mt-1 flex items-center justify-between">{CURRENCY} {stats.collected.toLocaleString()}<TrendingUp size={24} className="opacity-30" /></p>
                  </div>
                  <div onClick={() => { setView('settings'); setSettingsTab('meds'); }} className="bg-rose-500 p-8 rounded-[2.5rem] text-white shadow-xl shadow-rose-100 cursor-pointer hover:scale-[1.02] transition-transform active:scale-95 group">
                    <p className="opacity-70 text-[10px] font-bold uppercase tracking-widest">Low Stock Alert</p>
                    <p className="text-4xl font-black mt-1 flex items-center justify-between">{stats.lowStockCount}<PackageSearch size={24} className="opacity-30" /></p>
                  </div>
                </div>
              </div>
           )}

           {view === 'patients' && (
             <div className="space-y-6 animate-in fade-in">
               <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                 <h1 className="text-3xl font-black text-slate-800 w-full text-left">Patient Files</h1>
                 <div className="flex items-center gap-2 md:gap-4 w-full sm:w-auto">
                    <button onClick={exportPatientsCsv} className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-blue-600 rounded-xl shadow-sm"><FileDown size={18} /></button>
                    <div className="relative flex-grow sm:w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Search..." value={patientSearchTerm} onChange={(e) => setPatientSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-slate-100 font-bold text-sm" /></div>
                    <button onClick={() => { setEditingPatient(null); setShowPatientForm(true); }} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg">Register</button>
                 </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {filteredPatients.map(p => (
                   <div key={p.id} onClick={() => { setSelectedPatientId(p.id); setView('patient-detail'); }} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-all group border-b-4 border-b-transparent hover:border-b-blue-500">
                     <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black text-xl">{p.name[0]}</div>
                       <div><h3 className="font-black text-slate-800 truncate">{p.name}</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{p.patientCode}</p></div>
                     </div>
                     <div className="mt-6 flex justify-between items-center text-[10px] font-black uppercase text-slate-400"><span>{p.phone}</span><ArrowRight size={16} className="text-blue-500" /></div>
                   </div>
                 ))}
               </div>
             </div>
           )}

           {view === 'visits' && (
             <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center"><h1 className="text-3xl font-black text-slate-800">Clinical Logs</h1><button onClick={() => setShowVisitForm(true)} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg">+ New Entry</button></div>
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <tr><th className="px-8 py-5">Date</th><th className="px-8 py-5">Patient</th><th className="px-8 py-5">Diagnosis</th><th className="px-8 py-5">Status</th><th className="px-8 py-5"></th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {visits.map(v => (
                        <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-5 font-bold text-slate-400 text-xs">{formatDate(v.date)}</td>
                          <td className="px-8 py-5 font-black text-slate-800">{patients.find(p => p.id === v.patientId)?.name}</td>
                          <td className="px-8 py-5 text-slate-500 font-medium text-sm">{v.diagnosis}</td>
                          <td className="px-8 py-5"><span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${v.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{v.paymentStatus}</span></td>
                          <td className="px-8 py-5 text-right"><button onClick={() => triggerPrint(v)} className="text-slate-300 hover:text-blue-600"><Printer size={18}/></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
           )}

           {view === 'pharmacy' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in">
               <div className="lg:col-span-2 space-y-6">
                 <h1 className="text-3xl font-black text-slate-800">Pharmacy Inventory</h1>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredMeds.map(med => (
                      <div key={med.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-blue-500 transition-all">
                        <div><h3 className="text-lg font-black text-slate-800 leading-tight">{med.brandName}</h3><p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-1">{med.scientificName}</p><p className="mt-4 font-black text-emerald-600 text-xl">{CURRENCY} {med.pricePerUnit}</p></div>
                        <div className="mt-4 pt-4 border-t flex justify-between items-center"><span className={`text-[10px] font-black uppercase ${med.stock <= med.reorderLevel ? 'text-rose-500' : 'text-slate-400'}`}>Stock: {med.stock}</span><button onClick={() => addToCart(med.id)} disabled={med.stock <= 0} className="bg-blue-600 text-white p-2 rounded-xl disabled:opacity-20 active:scale-90 transition-all"><Plus size={20}/></button></div>
                      </div>
                    ))}
                 </div>
               </div>
               <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 h-fit lg:sticky lg:top-12">
                  <h2 className="text-2xl font-black mb-6 flex items-center gap-2"><ShoppingCart className="text-blue-600" /> Checkout</h2>
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    {cart.map(item => {
                      const med = medications.find(m => m.id === item.medicationId)!;
                      return (
                        <div key={item.medicationId} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                          <div><p className="font-bold text-slate-800 text-xs">{med.brandName}</p><p className="text-[10px] text-slate-400 font-black">{CURRENCY} {med.pricePerUnit} × {item.quantity}</p></div>
                          <div className="flex gap-1"><button onClick={() => updateCartQty(item.medicationId, -1)} className="p-1 border rounded bg-white"><Minus size={12}/></button><button onClick={() => updateCartQty(item.medicationId, 1)} className="p-1 border rounded bg-white"><Plus size={12}/></button></div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-8 pt-6 border-t"><div className="flex justify-between items-center mb-6"><span className="text-[10px] font-black uppercase text-slate-400">Total</span><span className="text-3xl font-black text-blue-600">{CURRENCY} {cart.reduce((sum, i) => sum + (i.quantity * (medications.find(m => m.id === i.medicationId)?.pricePerUnit || 0)), 0)}</span></div><button onClick={completeSale} disabled={cart.length === 0} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Complete Sale</button></div>
               </div>
             </div>
           )}

           {view === 'settings' && (
             <div className="space-y-8 animate-in fade-in">
                <div className="flex flex-col gap-4">
                  <h1 className="text-2xl font-black text-slate-800">Clinic Configuration</h1>
                  <div className="flex gap-2 bg-slate-200/50 p-1 rounded-xl w-full overflow-x-auto no-scrollbar">
                    {[{ id: 'meds', label: 'Medicine', icon: <Pill size={12}/> }, { id: 'vitals', label: 'Vitals', icon: <Activity size={12}/> }, { id: 'templates', label: 'Templates', icon: <LayoutTemplate size={12}/> }].map(tab => (
                      <button key={tab.id} onClick={() => setSettingsTab(tab.id as any)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${settingsTab === tab.id ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>{tab.icon} {tab.label}</button>
                    ))}
                  </div>
                  <input type="text" placeholder="Filter settings..." value={settingsSearchTerm} onChange={(e) => setSettingsSearchTerm(e.target.value)} className="w-full p-4 rounded-xl border-2 border-slate-100 font-bold text-sm" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                   <button onClick={() => { if(settingsTab === 'meds') setShowMedForm(true); else if(settingsTab === 'templates') setShowTemplateForm(true); }} className="border-4 border-dashed border-slate-200 rounded-3xl p-8 text-slate-300 flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:text-blue-500 transition-all bg-white"><Plus size={32} /><span className="font-black uppercase tracking-widest text-[9px]">Add Entry</span></button>
                   {filteredSettingsItems.map(item => (<div key={item.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between"><h3 className="font-black text-slate-800 text-base">{item.brandName || item.name || item.label}</h3><p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Configuration Item</p></div>))}
                </div>
             </div>
           )}

           {view === 'patient-detail' && selectedPatientId && (
              <div className="space-y-8 animate-in slide-in-from-right">
                <button onClick={() => setView('patients')} className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-black uppercase text-xs"><ArrowRight className="rotate-180" size={18} /> Back</button>
                {(() => {
                  const p = patients.find(pat => pat.id === selectedPatientId);
                  return p ? (
                    <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100"><h2 className="text-4xl font-black text-slate-800 tracking-tight">{p.name}</h2><p className="text-slate-400 font-bold mt-2 uppercase text-xs tracking-wider">{p.patientCode} • {p.age}Y • {p.gender}</p><div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6"><div className="p-5 bg-slate-50 rounded-3xl border border-slate-100"><p className="text-[9px] font-black uppercase text-slate-400 mb-1">Phone</p><p className="font-bold text-slate-700">{p.phone}</p></div><div className="p-5 bg-rose-50/50 rounded-3xl border border-rose-100"><p className="text-[9px] font-black uppercase text-rose-400 mb-1">Allergies</p><p className="font-bold text-rose-700">{p.allergies || 'None'}</p></div></div></div>
                  ) : null;
                })()}
              </div>
           )}
        </div>
      </main>

      {/* Forms/Modals */}
      {showVisitForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[600] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in">
             <div className="p-8 bg-blue-600 text-white flex justify-between items-center shrink-0"><h2 className="text-xl font-black tracking-tight">Clinical Encounter</h2><button onClick={() => setShowVisitForm(false)} className="text-3xl">&times;</button></div>
             <form onSubmit={handleVisitSubmit} className="p-8 space-y-5 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Date</label><input required type="date" name="date" defaultValue={getCurrentIsoDate()} className="w-full p-4 rounded-xl border-2 border-slate-100 bg-slate-50 font-black text-sm" /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Patient</label><select required name="patientId" onChange={(e) => setFormSelectedPatientId(e.target.value)} className="w-full p-4 rounded-xl border-2 border-slate-100 bg-slate-50 font-black text-sm"><option value="">Select...</option>{patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                </div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Diagnosis</label><textarea required name="diagnosis" value={formDiagnosis} onChange={e => setFormDiagnosis(e.target.value)} rows={3} className="w-full p-4 rounded-xl border-2 border-slate-100 bg-slate-50 font-black text-sm outline-none focus:border-blue-500" placeholder="Primary diagnosis..."></textarea></div>
                <div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Fee</label><input required type="number" name="feeAmount" defaultValue={500} className="w-full p-4 rounded-xl border-2 border-slate-100 bg-slate-50 font-black text-sm" /></div><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Status</label><select name="paymentStatus" className="w-full p-4 rounded-xl border-2 border-slate-100 bg-slate-50 font-black text-sm"><option value="Paid">Paid</option><option value="Pending">Pending</option></select></div></div>
                <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl text-sm">Save Log Entry</button>
             </form>
           </div>
        </div>
      )}

      {showPatientForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[600] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl animate-in zoom-in overflow-hidden">
             <div className="p-8 bg-blue-600 text-white flex justify-between items-center shrink-0"><h2 className="text-xl font-black tracking-tight">{editingPatient ? 'Modify Record' : 'Registration'}</h2><button onClick={() => setShowPatientForm(false)} className="text-3xl">&times;</button></div>
             <form onSubmit={(e) => {
               e.preventDefault();
               const f = new FormData(e.currentTarget);
               const d = { name: f.get('name') as string, age: parseInt(f.get('age') as string), gender: f.get('gender') as any, phone: f.get('phone') as string, address: f.get('address') as string, allergies: f.get('allergies') as string };
               if (editingPatient) setPatients(prev => prev.map(p => p.id === editingPatient.id ? { ...p, ...d } : p));
               else setPatients(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), patientCode: `P-${Math.floor(Math.random()*9000)+1000}`, ...d }]);
               setShowPatientForm(false);
             }} className="p-8 space-y-6">
                <input required name="name" defaultValue={editingPatient?.name} placeholder="Full Name" className="w-full p-4 rounded-xl border-2 border-slate-100 bg-slate-50 font-black text-sm" />
                <div className="grid grid-cols-2 gap-4"><input required type="number" name="age" defaultValue={editingPatient?.age} placeholder="Age" className="w-full p-4 rounded-xl border-2 border-slate-100 bg-slate-50 font-black text-sm" /><select name="gender" defaultValue={editingPatient?.gender} className="w-full p-4 rounded-xl border-2 border-slate-100 bg-slate-50 font-black text-sm"><option value="Male">Male</option><option value="Female">Female</option></select></div>
                <input required name="phone" defaultValue={editingPatient?.phone} placeholder="Phone" className="w-full p-4 rounded-xl border-2 border-slate-100 bg-slate-50 font-black text-sm" />
                <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl">Register Patient</button>
             </form>
           </div>
        </div>
      )}

      {showMedForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[700] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl animate-in zoom-in overflow-hidden">
              <div className="p-6 bg-blue-600 text-white flex justify-between items-center"><h2 className="font-black">New Medicine</h2><button onClick={() => setShowMedForm(false)} className="text-xl">&times;</button></div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const d = { brandName: f.get('brandName') as string, scientificName: f.get('scientificName') as string, companyName: '', type: 'Tablet', unit: 'Tablet', strength: '', category: '', stock: parseInt(f.get('stock') as string) || 0, reorderLevel: 5, pricePerUnit: parseFloat(f.get('price') as string) || 0 };
                setMedications(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), ...d }]);
                setShowMedForm(false);
              }} className="p-6 space-y-4">
                <input required name="brandName" placeholder="Brand Name" className="w-full p-4 rounded-xl border-2 border-slate-100 font-bold" />
                <input required name="scientificName" placeholder="Formula" className="w-full p-4 rounded-xl border-2 border-slate-100 font-bold" />
                <div className="grid grid-cols-2 gap-4"><input required type="number" name="stock" placeholder="Initial Stock" className="w-full p-4 rounded-xl border-2 border-slate-100 font-bold" /><input required type="number" name="price" placeholder="Price" className="w-full p-4 rounded-xl border-2 border-slate-100 font-bold" /></div>
                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase text-xs">Register</button>
              </form>
           </div>
        </div>
      )}

      {/* Printing View */}
      <div className="hidden print:block print-only fixed inset-0 bg-white text-black font-sans leading-tight z-[1000]">
        {printingVisit && (() => {
          const p = patients.find(pat => pat.id === printingVisit.patientId);
          return (
            <div className="w-full p-4 space-y-4 text-[13px]">
              <div className="text-center border-b-2 border-black pb-4 mb-4">
                <h1 className="text-2xl font-black">SmartClinic</h1>
                <p className="font-bold uppercase text-[10px]">Medical Hub</p>
              </div>
              <div className="space-y-2">
                <p><strong>Name:</strong> {p?.name}</p>
                <p><strong>Date:</strong> {formatDate(printingVisit.date)}</p>
                <p><strong>Diagnosis:</strong> {printingVisit.diagnosis}</p>
              </div>
              <div className="pt-6 mt-6 border-t border-black text-center italic">Thank you for visiting SmartClinic</div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default App;
