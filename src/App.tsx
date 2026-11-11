import React, { useState, useMemo, useEffect } from 'react';
import './index.css'
import {
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  XCircle,
  BarChart3,
  Sliders,
  Settings,
  Flame,
  Info,
  RefreshCw,
  Zap,
  Filter,
  Check,
  Award,
  Calendar,
  Sparkles,
  ChevronRight,
  Search,
  Minus,
  LayoutGrid,
  List,
  Target,
  ArrowUpRight,
  SlidersHorizontal,
  PieChart
} from 'lucide-react';

// --- INITIAL REALISTIC DEMO DATA ---
const DEFAULT_SUBJECTS = [
  {
    id: '1',
    code: 'CS301',
    name: 'Data Structures & Algorithms',
    attended: 28,
    conducted: 40,
    target: 75,
    instructor: 'Dr. Alan Turing',
    room: 'Lab 3B'
  },
  {
    id: '2',
    code: 'CS304',
    name: 'Operating Systems',
    attended: 18,
    conducted: 30,
    target: 75,
    instructor: 'Prof. Linus T.',
    room: 'Hall 101'
  },
  {
    id: '3',
    code: 'MA202',
    name: 'Linear Algebra & Calculus',
    attended: 34,
    conducted: 36,
    target: 80,
    instructor: 'Dr. Ada Lovelace',
    room: 'Room 204'
  },
  {
    id: '4',
    code: 'CS308',
    name: 'Machine Learning Fundamentals',
    attended: 21,
    conducted: 35,
    target: 75,
    instructor: 'Dr. Andrew Ng',
    room: 'Auditorium A'
  },
  {
    id: '5',
    code: 'CS312',
    name: 'Full Stack Web Development',
    attended: 38,
    conducted: 40,
    target: 75,
    instructor: 'Prof. Tim B.L.',
    room: 'Lab 1A'
  }
];

// --- MATHEMATICAL FORMULAS & HELPER CALCULATIONS ---
/**
 * Safe Regime (Bunk Formula):   B = floor((A - T * C) / T)
 * Deficit Regime (Recovery):   R = ceil((T * C - A) / (1 - T))
 */
const calculateMetrics = (attended, conducted, targetPercent) => {
  const A = Math.max(0, Number(attended) || 0);
  const C = Math.max(A, Number(conducted) || 0);
  const t = (Math.min(100, Math.max(1, Number(targetPercent) || 75))) / 100;

  const currentPct = C > 0 ? (A / C) * 100 : 100;
  const roundedPct = Math.round(currentPct * 10) / 10;

  let safeBunks = 0;
  let recoveryNeeded = 0;
  let status = 'safe'; // 'safe' | 'warning' | 'deficit'

  if (C === 0) {
    return { currentPct: 100, roundedPct: 100, safeBunks: 0, recoveryNeeded: 0, status: 'safe' };
  }

  if (currentPct >= targetPercent) {
    const rawBunks = (A - t * C) / t;
    safeBunks = Math.max(0, Math.floor(rawBunks));
    
    // Near margin check: within 3% above target threshold
    status = currentPct < targetPercent + 3 ? 'warning' : 'safe';
  } else {
    const rawRecovery = (t * C - A) / (1 - t);
    recoveryNeeded = Math.max(0, Math.ceil(rawRecovery));
    status = 'deficit';
  }

  return {
    currentPct,
    roundedPct,
    safeBunks,
    recoveryNeeded,
    status
  };
};

export default function App() {
  // State initialization with LocalStorage
  const [subjects, setSubjects] = useState(() => {
    try {
      const saved = localStorage.getItem('bunk_smart_subjects_v2');
      return saved ? JSON.parse(saved) : DEFAULT_SUBJECTS;
    } catch {
      return DEFAULT_SUBJECTS;
    }
  });

  const [globalTarget, setGlobalTarget] = useState(() => {
    try {
      const saved = localStorage.getItem('bunk_smart_target_v2');
      return saved ? Number(saved) : 75;
    } catch {
      return 75;
    }
  });

  // UI state
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'simulator' | 'matrix' | 'insights'
  const [matrixView, setMatrixView] = useState('table'); // 'table' | 'grid'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'deficit' | 'warning' | 'safe'
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjectForm, setSubjectForm] = useState({
    code: '',
    name: '',
    attended: 0,
    conducted: 0,
    target: 75,
    instructor: '',
    room: ''
  });

  // What-If Simulator State
  const [simSubjectId, setSimSubjectId] = useState('');
  const [simAttendedDelta, setSimAttendedDelta] = useState(0);
  const [simMissedDelta, setSimMissedDelta] = useState(0);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('bunk_smart_subjects_v2', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('bunk_smart_target_v2', globalTarget.toString());
  }, [globalTarget]);

  // Set default simulation target if not set
  useEffect(() => {
    if (subjects.length > 0 && !simSubjectId) {
      setSimSubjectId(subjects[0].id);
    }
  }, [subjects, simSubjectId]);

  // Global Aggregate Calculations
  const aggregateMetrics = useMemo(() => {
    const totalAttended = subjects.reduce((acc, s) => acc + Number(s.attended), 0);
    const totalConducted = subjects.reduce((acc, s) => acc + Number(s.conducted), 0);
    const metrics = calculateMetrics(totalAttended, totalConducted, globalTarget);

    const safeCount = subjects.filter(s => calculateMetrics(s.attended, s.conducted, s.target || globalTarget).status === 'safe').length;
    const warningCount = subjects.filter(s => calculateMetrics(s.attended, s.conducted, s.target || globalTarget).status === 'warning').length;
    const deficitCount = subjects.filter(s => calculateMetrics(s.attended, s.conducted, s.target || globalTarget).status === 'deficit').length;

    return {
      totalAttended,
      totalConducted,
      ...metrics,
      safeCount,
      warningCount,
      deficitCount
    };
  }, [subjects, globalTarget]);

  // Quick Counter Actions
  const handleModifyClass = (id, field, delta) => {
    setSubjects(prev =>
      prev.map(s => {
        if (s.id !== id) return s;
        let newAttended = s.attended;
        let newConducted = s.conducted;

        if (field === 'attended') {
          newAttended = Math.max(0, s.attended + delta);
          // Auto adjust conducted if attended exceeds conducted
          if (newAttended > newConducted) {
            newConducted = newAttended;
          }
        } else if (field === 'conducted') {
          newConducted = Math.max(newAttended, s.conducted + delta);
        } else if (field === 'missed') {
          // Missed means +1 to conducted without increasing attended
          newConducted = Math.max(newAttended, s.conducted + delta);
        }

        return { ...s, attended: newAttended, conducted: newConducted };
      })
    );
  };

  // CRUD Actions
  const handleOpenModal = (sub = null) => {
    if (sub) {
      setEditingSubject(sub);
      setSubjectForm({ ...sub });
    } else {
      setEditingSubject(null);
      setSubjectForm({
        code: '',
        name: '',
        attended: 0,
        conducted: 0,
        target: globalTarget,
        instructor: '',
        room: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveSubject = (e) => {
    e.preventDefault();
    if (!subjectForm.name || !subjectForm.code) return;

    const attended = Math.max(0, parseInt(subjectForm.attended) || 0);
    const conducted = Math.max(attended, parseInt(subjectForm.conducted) || 0);

    if (editingSubject) {
      setSubjects(prev =>
        prev.map(s => (s.id === editingSubject.id ? { ...subjectForm, attended, conducted } : s))
      );
    } else {
      const newSubject = {
        ...subjectForm,
        id: Date.now().toString(),
        attended,
        conducted
      };
      setSubjects(prev => [...prev, newSubject]);
      if (!simSubjectId) setSimSubjectId(newSubject.id);
    }
    setIsModalOpen(false);
  };

  const handleDeleteSubject = (id) => {
    if (subjects.length <= 1) {
      alert("You need at least one subject in your dashboard.");
      return;
    }
    setSubjects(prev => prev.filter(s => s.id !== id));
    if (simSubjectId === id) {
      const next = subjects.find(s => s.id !== id);
      if (next) setSimSubjectId(next.id);
    }
  };

  const handleResetDemoData = () => {
    if (window.confirm("Reset all subjects back to initial sample dataset?")) {
      setSubjects(DEFAULT_SUBJECTS);
      setSimSubjectId(DEFAULT_SUBJECTS[0].id);
    }
  };

  // Filtered Subject List
  const filteredSubjects = useMemo(() => {
    return subjects.filter(s => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase());

      const m = calculateMetrics(s.attended, s.conducted, s.target || globalTarget);

      if (!matchesSearch) return false;
      if (filterStatus === 'deficit') return m.status === 'deficit';
      if (filterStatus === 'safe') return m.status === 'safe';
      if (filterStatus === 'warning') return m.status === 'warning';
      return true;
    });
  }, [subjects, searchQuery, filterStatus, globalTarget]);

  // Selected Simulation Subject Calculation
  const simSubject = useMemo(() => {
    return subjects.find(s => s.id === simSubjectId) || subjects[0];
  }, [subjects, simSubjectId]);

  const simMetrics = useMemo(() => {
    if (!simSubject) return null;
    const target = simSubject.target || globalTarget;

    const original = calculateMetrics(simSubject.attended, simSubject.conducted, target);

    const projAttended = Number(simSubject.attended) + Number(simAttendedDelta);
    const projConducted = Number(simSubject.conducted) + Number(simAttendedDelta) + Number(simMissedDelta);
    const projected = calculateMetrics(projAttended, projConducted, target);

    return { original, projected, projAttended, projConducted };
  }, [simSubject, simAttendedDelta, simMissedDelta, globalTarget]);

  // Actionable Strategy Priority Generator
  const strategyPriorities = useMemo(() => {
    return subjects
      .map(s => {
        const m = calculateMetrics(s.attended, s.conducted, s.target || globalTarget);
        return { ...s, metrics: m };
      })
      .sort((a, b) => a.metrics.currentPct - b.metrics.currentPct);
  }, [subjects, globalTarget]);

  // Color Mapping Helper
  const getThemeColors = (status) => {
    if (status === 'safe') {
      return {
        text: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        border: 'border-emerald-200 dark:border-emerald-800/60',
        stroke: '#10b981',
        pill: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
      };
    }
    if (status === 'warning') {
      return {
        text: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        border: 'border-amber-200 dark:border-amber-800/60',
        stroke: '#f59e0b',
        pill: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
      };
    }
    return {
      text: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      border: 'border-rose-200 dark:border-rose-800/60',
      stroke: '#f43f5e',
      pill: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
    };
  };

  const aggColors = getThemeColors(aggregateMetrics.status);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* ======================================================== */}
      {/* HEADER & NAV BAR */}
      {/* ======================================================== */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-30 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl text-slate-950 font-black shadow-lg shadow-emerald-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 fill-current stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight text-white flex items-center gap-2">
                BunkSmart <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/30 uppercase tracking-widest">Analytics v2.4</span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">Smart Attendance Shortage Prevention Dashboard</p>
            </div>
          </div>

          {/* Quick Global Target Selector */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800">
              <span className="text-[11px] font-medium text-slate-400 px-2.5 hidden md:inline">Rule Benchmark:</span>
              {[75, 80, 85].map(t => (
                <button
                  key={t}
                  onClick={() => setGlobalTarget(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    globalTarget === t
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {t}%
                </button>
              ))}
            </div>

            <button
              onClick={() => handleOpenModal()}
              className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-3.5 py-2 rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">Add Course</span>
            </button>
          </div>
        </div>
      </header>

      {/* --- TAB NAVIGATION BAR --- */}
      <div className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center overflow-x-auto no-scrollbar py-2">
          <nav className="flex space-x-2">
            {[
              { id: 'dashboard', label: 'Live Score Card', icon: Target },
              { id: 'simulator', label: 'Bunk & Recovery Simulator', icon: SlidersHorizontal },
              { id: 'matrix', label: 'Academic Matrix', icon: BookOpen },
              { id: 'insights', label: 'Analytics & Insights', icon: BarChart3 }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center space-x-2 text-xs">
            <span className="text-slate-500">Overall State:</span>
            <span className={`font-bold px-2.5 py-1 rounded-full border ${aggColors.bg} ${aggColors.text} ${aggColors.border}`}>
              {aggregateMetrics.status === 'safe' ? 'SAFE REGIME' : aggregateMetrics.status === 'warning' ? 'WARNING REGIME' : 'DEFICIT REGIME'}
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MAIN CONTAINER */}
      {/* ======================================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow w-full space-y-6">

        {/* -------------------------------------------------------- */}
        {/* HERO LIVE SCORE CARD (PERSISTENT SUMMARY) */}
        {/* -------------------------------------------------------- */}
        <section className="bg-slate-950/70 rounded-2xl p-6 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* SVG Circular Ring Gauge */}
            <div className="md:col-span-5 lg:col-span-4 flex flex-col items-center justify-center p-4 bg-slate-900/80 rounded-2xl border border-slate-800/80 relative">
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    className="stroke-slate-800"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke={aggColors.stroke}
                    strokeWidth="10"
                    strokeDasharray={314.159}
                    strokeDashoffset={
                      314.159 - (314.159 * Math.min(100, aggregateMetrics.currentPct)) / 100
                    }
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>

                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-black tracking-tight text-white">
                    {aggregateMetrics.roundedPct}%
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    Aggregate
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5 border ${aggColors.bg} ${aggColors.text} ${aggColors.border}`}>
                    Rule: {globalTarget}%
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mt-4 flex items-center space-x-2 text-xs font-bold">
                {aggregateMetrics.status === 'safe' && (
                  <div className="flex items-center space-x-1.5 text-emerald-400 bg-emerald-950/60 px-3.5 py-1.5 rounded-full border border-emerald-800/60">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Safe Attendance Regime</span>
                  </div>
                )}
                {aggregateMetrics.status === 'warning' && (
                  <div className="flex items-center space-x-1.5 text-amber-400 bg-amber-950/60 px-3.5 py-1.5 rounded-full border border-amber-800/60">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Near Shortage Margin</span>
                  </div>
                )}
                {aggregateMetrics.status === 'deficit' && (
                  <div className="flex items-center space-x-1.5 text-rose-400 bg-rose-950/60 px-3.5 py-1.5 rounded-full border border-rose-800/60">
                    <XCircle className="w-4 h-4" />
                    <span>Shortage Deficit Warning</span>
                  </div>
                )}
              </div>
            </div>

            {/* Aggregated Quick Metrics */}
            <div className="md:col-span-7 lg:col-span-8 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-xl font-extrabold text-white">Overall Attendance Health</h2>
                  <p className="text-xs text-slate-400">
                    Calculated over {subjects.length} active course module{subjects.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* 4 Stat Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Attended</p>
                  <p className="text-2xl font-black text-white mt-1">
                    {aggregateMetrics.totalAttended} <span className="text-xs font-normal text-slate-500">/ {aggregateMetrics.totalConducted}</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Classes held</p>
                </div>

                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Safe Bunk Buffer</p>
                  <p className={`text-2xl font-black mt-1 ${aggregateMetrics.safeBunks > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {aggregateMetrics.safeBunks} <span className="text-xs font-normal text-slate-500">classes</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Can safely skip</p>
                </div>

                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recovery Needed</p>
                  <p className={`text-2xl font-black mt-1 ${aggregateMetrics.recoveryNeeded > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                    {aggregateMetrics.recoveryNeeded} <span className="text-xs font-normal text-slate-500">classes</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Consecutive required</p>
                </div>

                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Course Status</p>
                  <div className="flex items-center space-x-1.5 mt-2">
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-md">
                      {aggregateMetrics.safeCount} Safe
                    </span>
                    <span className="text-xs font-bold text-rose-400 bg-rose-950/80 border border-rose-800/60 px-2 py-0.5 rounded-md">
                      {aggregateMetrics.deficitCount} Short
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Banner Banner */}
              <div className={`p-4 rounded-xl border text-xs flex items-start space-x-3 ${aggColors.bg} ${aggColors.border}`}>
                <Sparkles className={`w-5 h-5 flex-shrink-0 mt-0.5 ${aggColors.text}`} />
                <div className="flex-1">
                  <span className={`font-bold ${aggColors.text}`}>System Recommendation: </span>
                  {aggregateMetrics.status === 'safe' ? (
                    <span className="text-slate-300">
                      You are well within the <strong>Safe Regime</strong> with a global cushion of {aggregateMetrics.safeBunks} classes. Strategic bunks are permitted!
                    </span>
                  ) : aggregateMetrics.status === 'warning' ? (
                    <span className="text-slate-300">
                      Caution! You are within 3% of your target threshold. Maintain consistency to prevent entering shortage deficit.
                    </span>
                  ) : (
                    <span className="text-slate-300">
                      Shortage Alert! You must attend <strong>{aggregateMetrics.recoveryNeeded}</strong> upcoming aggregate classes consecutively without missing to recover your {globalTarget}% benchmark.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* TAB 1: LIVE DASHBOARD OVERVIEW */}
        {/* ======================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Priorities & Urgent Actions */}
            <div className="bg-slate-950/70 rounded-2xl p-5 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Flame className="w-5 h-5 text-amber-500" />
                  <h3 className="font-extrabold text-white text-base">Course Strategic Priorities</h3>
                </div>
                <span className="text-xs text-slate-400">{subjects.length} Modules Active</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {strategyPriorities.map((item, idx) => {
                  const colors = getThemeColors(item.metrics.status);
                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border text-xs space-y-2 ${colors.bg} ${colors.border}`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-slate-200">{item.code} - {item.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${colors.pill}`}>
                          {item.metrics.roundedPct}%
                        </span>
                      </div>
                      <p className="text-slate-300 leading-relaxed font-medium">
                        {item.metrics.status === 'deficit' && (
                          <span className="text-rose-400 font-bold">
                            ⚠️ DEFICIT: Attend next {item.metrics.recoveryNeeded} class{item.metrics.recoveryNeeded > 1 ? 'es' : ''} consecutively.
                          </span>
                        )}
                        {item.metrics.status === 'warning' && (
                          <span className="text-amber-400 font-bold">
                            ⚡ WARNING: Only {item.metrics.safeBunks} bunk left before shortage.
                          </span>
                        )}
                        {item.metrics.status === 'safe' && (
                          <span className="text-emerald-400 font-semibold">
                            ✅ SAFE: You can safely skip {item.metrics.safeBunks} upcoming class{item.metrics.safeBunks > 1 ? 'es' : ''}.
                          </span>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Cards with Log Incrementors */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Course Attendance Quick Log</h3>
                <button
                  onClick={() => setActiveTab('matrix')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1"
                >
                  <span>Open Academic Matrix</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map(subject => {
                  const target = subject.target || globalTarget;
                  const m = calculateMetrics(subject.attended, subject.conducted, target);
                  const colors = getThemeColors(m.status);

                  return (
                    <div
                      key={subject.id}
                      className="bg-slate-950/70 rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-all"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              {subject.code}
                            </span>
                            <h4 className="font-bold text-white text-base mt-1 line-clamp-1">{subject.name}</h4>
                          </div>
                          <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
                            {m.roundedPct}%
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4">
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1.5 font-semibold">
                            <span>{subject.attended} / {subject.conducted} Attended</span>
                            <span>Target: {target}%</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, m.currentPct)}%`,
                                backgroundColor: colors.stroke
                              }}
                            />
                          </div>
                        </div>

                        {/* Regime Guidance Box */}
                        <div className={`mt-4 p-3 rounded-xl border text-xs font-bold ${colors.bg} ${colors.border}`}>
                          {m.status === 'safe' && (
                            <div className="flex justify-between items-center text-emerald-400">
                              <span>Safe Bunks Remaining:</span>
                              <span className="text-base font-black">{m.safeBunks} Classes</span>
                            </div>
                          )}
                          {m.status === 'warning' && (
                            <div className="flex justify-between items-center text-amber-400">
                              <span>Warning Buffer:</span>
                              <span className="text-base font-black">{m.safeBunks} Bunk Left</span>
                            </div>
                          )}
                          {m.status === 'deficit' && (
                            <div className="flex justify-between items-center text-rose-400">
                              <span>Required Recovery:</span>
                              <span className="text-base font-black">{m.recoveryNeeded} Classes</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Interactive Log Control Buttons */}
                      <div className="mt-5 pt-3 border-t border-slate-900 flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => handleModifyClass(subject.id, 'attended', 1)}
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-all active:scale-95"
                            title="Add Attended Class (+1 Attended, +1 Conducted)"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Attended</span>
                          </button>

                          <button
                            onClick={() => handleModifyClass(subject.id, 'missed', 1)}
                            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-all active:scale-95"
                            title="Log Missed Class (+1 Conducted)"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Missed</span>
                          </button>
                        </div>

                        <button
                          onClick={() => handleOpenModal(subject)}
                          className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-900 rounded-lg transition-all"
                          title="Edit Subject"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: BUNK & RECOVERY SIMULATOR */}
        {/* ======================================================== */}
        {activeTab === 'simulator' && simSubject && simMetrics && (
          <div className="space-y-6">
            <div className="bg-slate-950/70 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-black text-white flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-emerald-400" />
                    Interactive Bunk & Recovery Simulator
                  </h3>
                  <p className="text-xs text-slate-400">
                    Test "What If" scenarios to see how skipping or attending future classes impacts your eligibility.
                  </p>
                </div>

                {/* Course Switcher */}
                <div className="flex items-center space-x-2">
                  <label className="text-xs font-bold text-slate-300">Subject:</label>
                  <select
                    value={simSubjectId}
                    onChange={(e) => {
                      setSimSubjectId(e.target.value);
                      setSimAttendedDelta(0);
                      setSimMissedDelta(0);
                    }}
                    className="bg-slate-900 text-white text-xs font-bold rounded-xl px-3 py-2 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Baseline vs Projected Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Baseline Card */}
                <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Baseline</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getThemeColors(simMetrics.original.status).bg} ${getThemeColors(simMetrics.original.status).text} ${getThemeColors(simMetrics.original.status).border}`}>
                      {simMetrics.original.roundedPct}%
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-base">{simSubject.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Attended {simSubject.attended} of {simSubject.conducted} classes held
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 text-xs font-bold space-y-1">
                    {simMetrics.original.status !== 'deficit' ? (
                      <div className="flex justify-between text-emerald-400">
                        <span>Safe Bunk Margin:</span>
                        <span>{simMetrics.original.safeBunks} Classes</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-rose-400">
                        <span>Recovery Required:</span>
                        <span>{simMetrics.original.recoveryNeeded} Classes</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Projected Card */}
                <div className={`rounded-2xl p-5 border space-y-3 transition-all ${getThemeColors(simMetrics.projected.status).bg} ${getThemeColors(simMetrics.projected.status).border}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Projected Outcome</span>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 ${getThemeColors(simMetrics.projected.status).text}`}>
                      {simMetrics.projected.roundedPct}%
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-base">
                      After +{simAttendedDelta} Attended & +{simMissedDelta} Missed
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      New Score: {simMetrics.projAttended} / {simMetrics.projConducted} Classes
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/60 text-xs font-bold space-y-1">
                    {simMetrics.projected.status !== 'deficit' ? (
                      <div className="flex justify-between text-emerald-300">
                        <span>New Safe Bunk Margin:</span>
                        <span>{simMetrics.projected.safeBunks} Classes</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-rose-300">
                        <span>New Recovery Required:</span>
                        <span>{simMetrics.projected.recoveryNeeded} Classes</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SLIDERS CONTROLS */}
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-6">
                <h4 className="font-bold text-white text-sm">Simulate Future Class Attendance</h4>

                {/* Slider 1: Missed Classes */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <label className="text-rose-400 flex items-center space-x-1.5">
                      <XCircle className="w-4 h-4" />
                      <span>What if I BUNK (MISS) upcoming classes?</span>
                    </label>
                    <span className="bg-rose-950 text-rose-300 border border-rose-800/60 px-3 py-1 rounded-full">
                      +{simMissedDelta} Missed Class{simMissedDelta !== 1 ? 'es' : ''}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={simMissedDelta}
                    onChange={(e) => setSimMissedDelta(parseInt(e.target.value) || 0)}
                    className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0 classes</span>
                    <span>5 classes</span>
                    <span>10 classes</span>
                    <span>20 classes</span>
                  </div>
                </div>

                {/* Slider 2: Attended Classes */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <label className="text-emerald-400 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>What if I ATTEND upcoming classes?</span>
                    </label>
                    <span className="bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-3 py-1 rounded-full">
                      +{simAttendedDelta} Attended Class{simAttendedDelta !== 1 ? 'es' : ''}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={simAttendedDelta}
                    onChange={(e) => setSimAttendedDelta(parseInt(e.target.value) || 0)}
                    className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0 classes</span>
                    <span>5 classes</span>
                    <span>10 classes</span>
                    <span>20 classes</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setSimAttendedDelta(0);
                      setSimMissedDelta(0);
                    }}
                    className="text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset Simulation Sliders</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: ACADEMIC TRACKER MATRIX */}
        {/* ======================================================== */}
        {activeTab === 'matrix' && (
          <div className="space-y-4">
            {/* Filter and View Toggles Header */}
            <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search course code or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-900 text-slate-200 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Status Filters & View Switches */}
              <div className="flex items-center space-x-3 overflow-x-auto">
                <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'deficit', label: 'Shortage' },
                    { id: 'warning', label: 'Warning' },
                    { id: 'safe', label: 'Safe' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setFilterStatus(f.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                        filterStatus === f.id
                          ? 'bg-emerald-500 text-slate-950 shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setMatrixView('table')}
                    className={`p-1.5 rounded-lg transition-all ${matrixView === 'table' ? 'bg-slate-800 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
                    title="Table View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setMatrixView('grid')}
                    className={`p-1.5 rounded-lg transition-all ${matrixView === 'grid' ? 'bg-slate-800 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* TABLE VIEW */}
            {matrixView === 'table' ? (
              <div className="bg-slate-950/70 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900/90 text-slate-400 font-extrabold uppercase tracking-widest text-[10px] border-b border-slate-800">
                        <th className="p-4 pl-6">Course Module</th>
                        <th className="p-4">Attendance</th>
                        <th className="p-4">Score & Progress</th>
                        <th className="p-4">Target</th>
                        <th className="p-4">Strategic Action Plan</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right pr-6">Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredSubjects.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="p-8 text-center text-slate-500">
                            No courses match your filter or search query.
                          </td>
                        </tr>
                      ) : (
                        filteredSubjects.map(subject => {
                          const target = subject.target || globalTarget;
                          const m = calculateMetrics(subject.attended, subject.conducted, target);
                          const colors = getThemeColors(m.status);

                          return (
                            <tr key={subject.id} className="hover:bg-slate-900/40 transition-colors">
                              {/* Subject info */}
                              <td className="p-4 pl-6">
                                <div className="font-bold text-white text-sm">{subject.name}</div>
                                <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                                  <span className="font-mono bg-slate-900 px-1.5 py-0.5 rounded text-slate-300 border border-slate-800">{subject.code}</span>
                                  {subject.instructor && <span>• {subject.instructor}</span>}
                                </div>
                              </td>

                              {/* Attended / Conducted */}
                              <td className="p-4 font-semibold text-slate-300 whitespace-nowrap">
                                <span className="text-sm font-bold text-white">{subject.attended}</span> / {subject.conducted}
                                <span className="text-[10px] text-slate-500 block">Classes</span>
                              </td>

                              {/* Score & Progress Bar */}
                              <td className="p-4 min-w-[140px]">
                                <div className="flex items-center justify-between font-bold mb-1">
                                  <span className={colors.text}>{m.roundedPct}%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${Math.min(100, m.currentPct)}%`,
                                      backgroundColor: colors.stroke
                                    }}
                                  />
                                </div>
                              </td>

                              {/* Target */}
                              <td className="p-4 font-bold text-slate-400">
                                {target}%
                              </td>

                              {/* Guidance Actionable */}
                              <td className="p-4 font-bold">
                                {m.status === 'safe' && (
                                  <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-lg inline-block">
                                    Safe to bunk <strong>{m.safeBunks}</strong> class{m.safeBunks !== 1 ? 'es' : ''}
                                  </span>
                                )}
                                {m.status === 'warning' && (
                                  <span className="text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2.5 py-1 rounded-lg inline-block">
                                    Caution: <strong>{m.safeBunks}</strong> bunk left
                                  </span>
                                )}
                                {m.status === 'deficit' && (
                                  <span className="text-rose-400 bg-rose-950/60 border border-rose-800/60 px-2.5 py-1 rounded-lg inline-block">
                                    Must attend <strong>{m.recoveryNeeded}</strong> consecutive
                                  </span>
                                )}
                              </td>

                              {/* Status Badge */}
                              <td className="p-4">
                                <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${colors.bg} ${colors.text} ${colors.border}`}>
                                  <span className="capitalize">{m.status}</span>
                                </span>
                              </td>

                              {/* Interactive Incrementors & Action buttons */}
                              <td className="p-4 pr-6 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end space-x-1">
                                  <button
                                    onClick={() => handleModifyClass(subject.id, 'attended', 1)}
                                    className="p-1.5 text-emerald-400 hover:bg-emerald-950/60 rounded-lg transition-all border border-transparent hover:border-emerald-800/60"
                                    title="Add Attended (+1)"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleModifyClass(subject.id, 'missed', 1)}
                                    className="p-1.5 text-rose-400 hover:bg-rose-950/60 rounded-lg transition-all border border-transparent hover:border-rose-800/60"
                                    title="Log Missed (+1 Conducted)"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenModal(subject)}
                                    className="p-1.5 text-slate-400 hover:bg-slate-900 rounded-lg transition-all"
                                    title="Edit Subject"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSubject(subject.id)}
                                    className="p-1.5 text-rose-400 hover:bg-slate-900 rounded-lg transition-all"
                                    title="Delete Subject"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* GRID VIEW */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSubjects.map(subject => {
                  const target = subject.target || globalTarget;
                  const m = calculateMetrics(subject.attended, subject.conducted, target);
                  const colors = getThemeColors(m.status);

                  return (
                    <div
                      key={subject.id}
                      className="bg-slate-950/70 rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              {subject.code}
                            </span>
                            <h4 className="font-bold text-white text-base mt-1">{subject.name}</h4>
                          </div>
                          <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
                            {m.roundedPct}%
                          </span>
                        </div>

                        <div className="mt-4">
                          <div className="flex justify-between text-xs text-slate-400 mb-1 font-semibold">
                            <span>{subject.attended} / {subject.conducted} Attended</span>
                            <span>Target: {target}%</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, m.currentPct)}%`,
                                backgroundColor: colors.stroke
                              }}
                            />
                          </div>
                        </div>

                        <div className={`mt-4 p-3 rounded-xl border text-xs font-bold ${colors.bg} ${colors.border}`}>
                          {m.status === 'safe' && (
                            <p className="text-emerald-400">Safe to skip next <strong>{m.safeBunks}</strong> classes</p>
                          )}
                          {m.status === 'warning' && (
                            <p className="text-amber-400">Caution! <strong>{m.safeBunks}</strong> bunk remaining</p>
                          )}
                          {m.status === 'deficit' && (
                            <p className="text-rose-400">Must attend next <strong>{m.recoveryNeeded}</strong> classes</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-900 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleModifyClass(subject.id, 'attended', 1)}
                            className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg text-xs font-bold border border-emerald-500/30"
                          >
                            + Attended
                          </button>
                          <button
                            onClick={() => handleModifyClass(subject.id, 'missed', 1)}
                            className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 px-2.5 py-1 rounded-lg text-xs font-bold border border-rose-500/30"
                          >
                            + Missed
                          </button>
                        </div>
                        <div className="flex space-x-1">
                          <button onClick={() => handleOpenModal(subject)} className="p-1.5 text-slate-400 hover:text-white">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteSubject(subject.id)} className="p-1.5 text-rose-400 hover:text-rose-300">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: VISUAL ANALYTICS & STRATEGY INSIGHTS */}
        {/* ======================================================== */}
        {activeTab === 'insights' && (
          <div className="space-y-6">
            <div className="bg-slate-950/70 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
              <div>
                <h3 className="text-xl font-black text-white">Target Benchmark vs. Actual Performance</h3>
                <p className="text-xs text-slate-400">Visual comparison of actual score against required threshold lines</p>
              </div>

              {/* Comparative Visual Bar Charts */}
              <div className="space-y-4 pt-3">
                {subjects.map(subject => {
                  const target = subject.target || globalTarget;
                  const m = calculateMetrics(subject.attended, subject.conducted, target);
                  const colors = getThemeColors(m.status);

                  return (
                    <div key={subject.id} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-200">
                          {subject.code} - {subject.name}
                        </span>
                        <div className="flex items-center space-x-3">
                          <span className="text-slate-500">Target Line: {target}%</span>
                          <span className={colors.text}>Actual: {m.roundedPct}%</span>
                        </div>
                      </div>

                      <div className="relative w-full h-6 bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
                        {/* Target Threshold Vertical Line */}
                        <div
                          className="absolute top-0 bottom-0 w-1 bg-white z-10 shadow-lg"
                          style={{ left: `${target}%` }}
                          title={`Target: ${target}%`}
                        />

                        {/* Actual Percentage Progress */}
                        <div
                          className="h-full transition-all duration-700"
                          style={{
                            width: `${Math.min(100, m.currentPct)}%`,
                            backgroundColor: colors.stroke
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chart Legend */}
              <div className="flex flex-wrap items-center justify-center gap-6 pt-4 border-t border-slate-800 text-xs font-semibold text-slate-400">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded" />
                  <span>Safe Regime (&gt; Target)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-amber-500 rounded" />
                  <span>Warning (&lt; 3% Margin)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-rose-500 rounded" />
                  <span>Shortage Deficit</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1 h-3 bg-white" />
                  <span>Target Benchmark Line</span>
                </div>
              </div>
            </div>

            {/* Strategy Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-1">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Top Performing Course</h4>
                {(() => {
                  const sorted = [...subjects].sort((a, b) => (b.attended / (b.conducted || 1)) - (a.attended / (a.conducted || 1)));
                  const top = sorted[0];
                  if (!top) return null;
                  const pct = top.conducted ? Math.round((top.attended / top.conducted) * 1000) / 10 : 100;
                  return (
                    <div>
                      <p className="font-bold text-white text-base mt-1">{top.name}</p>
                      <p className="text-xs text-emerald-400 font-extrabold">{pct}% Attendance</p>
                    </div>
                  );
                })()}
              </div>

              <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-1">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Highest Recovery Priority</h4>
                {(() => {
                  const deficits = subjects
                    .map(s => ({ ...s, m: calculateMetrics(s.attended, s.conducted, s.target || globalTarget) }))
                    .filter(s => s.m.status === 'deficit')
                    .sort((a, b) => b.m.recoveryNeeded - a.m.recoveryNeeded);
                  const worst = deficits[0];
                  if (!worst) {
                    return <p className="text-xs font-bold text-emerald-400 mt-2">Zero subjects in shortage!</p>;
                  }
                  return (
                    <div>
                      <p className="font-bold text-white text-base mt-1">{worst.name}</p>
                      <p className="text-xs text-rose-400 font-extrabold">Requires {worst.m.recoveryNeeded} consecutive classes</p>
                    </div>
                  );
                })()}
              </div>

              <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-1">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aggregate Safe Bunk Reserve</h4>
                {(() => {
                  const totalBunks = subjects.reduce((sum, s) => {
                    const m = calculateMetrics(s.attended, s.conducted, s.target || globalTarget);
                    return sum + m.safeBunks;
                  }, 0);
                  return (
                    <div>
                      <p className="font-bold text-white text-base mt-1">{totalBunks} Classes Total</p>
                      <p className="text-xs text-slate-400 font-medium">Safe skips available across all courses</p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-950 border-t border-slate-800 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>BunkSmart Analytics &copy; {new Date().getFullYear()} — Smart Attendance Shortage Prevention</span>
          <button
            onClick={handleResetDemoData}
            className="text-slate-500 hover:text-rose-400 transition-colors underline flex items-center space-x-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </footer>

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT SUBJECT MODULE */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                {editingSubject ? 'Edit Subject Module' : 'Add New Subject Module'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Structures & Algorithms"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 text-white rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Subject Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS301"
                    value={subjectForm.code}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 text-white rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Target %</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={subjectForm.target}
                    onChange={(e) => setSubjectForm({ ...subjectForm, target: parseInt(e.target.value) || 75 })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 text-white rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Classes Attended</label>
                  <input
                    type="number"
                    min="0"
                    value={subjectForm.attended}
                    onChange={(e) => setSubjectForm({ ...subjectForm, attended: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 text-white rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Total Conducted</label>
                  <input
                    type="number"
                    min="0"
                    value={subjectForm.conducted}
                    onChange={(e) => setSubjectForm({ ...subjectForm, conducted: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 text-white rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Instructor (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Turing"
                    value={subjectForm.instructor || ''}
                    onChange={(e) => setSubjectForm({ ...subjectForm, instructor: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 text-white rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Room (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Lab 3B"
                    value={subjectForm.room || ''}
                    onChange={(e) => setSubjectForm({ ...subjectForm, room: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 text-white rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}