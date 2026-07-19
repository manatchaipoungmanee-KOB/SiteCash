/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useTransition } from 'react';
import { User } from 'firebase/auth';
import { Project, Transaction } from './types';
import {
  initAuth,
  googleSignIn,
  logout
} from './lib/firebase';
import {
  findSpreadsheet,
  createSpreadsheet,
  fetchProjects,
  saveProject,
  fetchTransactions,
  saveTransaction,
  deleteTransaction
} from './lib/sheets';
import AddProjectModal from './components/AddProjectModal';
import AddTransactionModal from './components/AddTransactionModal';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import ManageCategories from './components/ManageCategories';
import SpreadsheetSelector from './components/SpreadsheetSelector';
import PPLogo from './components/PPLogo';
import {
  HardHat,
  Plus,
  RefreshCw,
  LogOut,
  FolderKanban,
  FileSpreadsheet,
  LayoutDashboard,
  Receipt,
  FileCode,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Search,
  Hammer,
  TrendingUp,
  Coins,
  Settings2,
  Link2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Authentication states
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Sheets and Projects states
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectName, setSelectedProjectName] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'categories' | 'projects'>('dashboard');

  // Dynamic Categories states
  const [materialCategories, setMaterialCategories] = useState(() => {
    const saved = localStorage.getItem('material_categories');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      { key: 'concrete', label: 'งานโครงสร้าง / คอนกรีต', color: '#64748b' },
      { key: 'steel', label: 'งานเหล็กและโลหะ', color: '#475569' },
      { key: 'wood', label: 'งานไม้และตกแต่ง', color: '#b45309' },
      { key: 'electrical', label: 'งานระบบไฟฟ้า', color: '#eab308' },
      { key: 'plumbing', label: 'งานระบบประปา', color: '#0284c7' },
      { key: 'labor', label: 'ค่าแรงงาน', color: '#10b981' },
      { key: 'others', label: 'อื่นๆ / ทั่วไป', color: '#6b7280' },
    ];
  });

  const [incomeCategories, setIncomeCategories] = useState(() => {
    const saved = localStorage.getItem('income_categories');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      { key: 'installment', label: 'เบิกงวดงาน (ค่างวด)' },
      { key: 'capital', label: 'เงินสำรอง / ทุนหมุนเวียน' },
      { key: 'others', label: 'รายรับอื่นๆ' },
    ];
  });

  const handleUpdateMaterialCategories = (updated: any[]) => {
    setMaterialCategories(updated);
    localStorage.setItem('material_categories', JSON.stringify(updated));
  };

  const handleUpdateIncomeCategories = (updated: any[]) => {
    setIncomeCategories(updated);
    localStorage.setItem('income_categories', JSON.stringify(updated));
  };

  const handleResetCategoriesToDefaults = () => {
    const defaultMat = [
      { key: 'concrete', label: 'งานโครงสร้าง / คอนกรีต', color: '#64748b' },
      { key: 'steel', label: 'งานเหล็กและโลหะ', color: '#475569' },
      { key: 'wood', label: 'งานไม้และตกแต่ง', color: '#b45309' },
      { key: 'electrical', label: 'งานระบบไฟฟ้า', color: '#eab308' },
      { key: 'plumbing', label: 'งานระบบประปา', color: '#0284c7' },
      { key: 'labor', label: 'ค่าแรงงาน', color: '#10b981' },
      { key: 'others', label: 'อื่นๆ / ทั่วไป', color: '#6b7280' },
    ];
    const defaultInc = [
      { key: 'installment', label: 'เบิกงวดงาน (ค่างวด)' },
      { key: 'capital', label: 'เงินสำรอง / ทุนหมุนเวียน' },
      { key: 'others', label: 'รายรับอื่นๆ' },
    ];
    setMaterialCategories(defaultMat);
    setIncomeCategories(defaultInc);
    localStorage.setItem('material_categories', JSON.stringify(defaultMat));
    localStorage.setItem('income_categories', JSON.stringify(defaultInc));
  };

  // Loading and Error states
  const [loading, setLoading] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);

  // Transition for tab changes or selections
  const [isPending, startTransition] = useTransition();

  // 1. Listen to Auth State
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setNeedsAuth(false);
      },
      () => {
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // 2. Trigger Google Sign In
  const handleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('ไม่สามารถเข้าสู่ระบบผ่าน Google ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 3. Log out
  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setSpreadsheetId(null);
      setProjects([]);
      setTransactions([]);
      setSelectedProjectName(null);
      setNeedsAuth(true);
      localStorage.removeItem('construction_spreadsheet_id');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // 4. Onboard or discover the Google Spreadsheet once token is ready or load local projects
  useEffect(() => {
    if (!token) {
      const localProjectsRaw = localStorage.getItem('local_projects');
      if (localProjectsRaw) {
        try {
          const parsed = JSON.parse(localProjectsRaw);
          setProjects(parsed);
          if (parsed.length > 0) {
            setSelectedProjectName(parsed[0].name);
          } else {
            setSelectedProjectName(null);
          }
        } catch (e) {
          console.error('Error parsing local projects:', e);
          setProjects([]);
          setSelectedProjectName(null);
        }
      } else {
        setProjects([]);
        setSelectedProjectName(null);
      }
      return;
    }

    const initializeSheetsData = async () => {
      setLoading(true);
      setError(null);
      try {
        const currentId = localStorage.getItem('construction_spreadsheet_id');

        if (currentId) {
          setSpreadsheetId(currentId);
          // Fetch the project configuration sheet
          const loadedProjects = await fetchProjects(currentId, token);
          setProjects(loadedProjects);

          if (loadedProjects.length > 0) {
            setSelectedProjectName(loadedProjects[0].name);
          }
        } else {
          // No spreadsheet currently configured, let user choose manually in UI
          setSpreadsheetId(null);
          setProjects([]);
          setTransactions([]);
          setSelectedProjectName(null);
        }
      } catch (err: any) {
        console.error('Init sheets error:', err);
        setError(err.message || 'การเชื่อมต่อ Google Sheets ขัดข้อง กรุณาลงชื่อเข้าใช้งานใหม่อีกครั้ง');
        // If unauthorized/token expired, trigger re-auth
        if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
          handleLogout();
        }
      } finally {
        setLoading(false);
      }
    };

    initializeSheetsData();
  }, [token]);

  // 4.1. Link or select a spreadsheet manually
  const handleSelectSpreadsheet = async (id: string) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      localStorage.setItem('construction_spreadsheet_id', id);
      setSpreadsheetId(id);
      
      const loadedProjects = await fetchProjects(id, token);
      setProjects(loadedProjects);

      if (loadedProjects.length > 0) {
        setSelectedProjectName(loadedProjects[0].name);
      } else {
        setSelectedProjectName(null);
      }
    } catch (err: any) {
      console.error('Error selecting spreadsheet:', err);
      setError('ไม่สามารถซิงค์โครงการในไฟล์นี้ได้ กรุณาตรวจสอบให้แน่ใจว่าเป็นไฟล์สเปรดชีตที่ถูกต้อง');
      localStorage.removeItem('construction_spreadsheet_id');
      setSpreadsheetId(null);
    } finally {
      setLoading(false);
    }
  };

  // 4.2. Disconnect/unlink the current spreadsheet
  const handleDisconnectSpreadsheet = () => {
    localStorage.removeItem('construction_spreadsheet_id');
    setSpreadsheetId(null);
    setProjects([]);
    setTransactions([]);
    setSelectedProjectName(null);
  };

  // 5. Fetch transactions whenever Selected Project changes
  useEffect(() => {
    if (!token) {
      if (!selectedProjectName) {
        setTransactions([]);
        return;
      }
      const localTrxRaw = localStorage.getItem(`local_transactions_${selectedProjectName}`);
      if (localTrxRaw) {
        try {
          setTransactions(JSON.parse(localTrxRaw));
        } catch (e) {
          console.error('Error parsing local transactions:', e);
          setTransactions([]);
        }
      } else {
        setTransactions([]);
      }
      return;
    }

    if (!spreadsheetId || !selectedProjectName) {
      setTransactions([]);
      return;
    }

    const loadProjectTransactions = async () => {
      setLoadingTransactions(true);
      try {
        const list = await fetchTransactions(spreadsheetId, selectedProjectName, token);
        setTransactions(list);
      } catch (err) {
        console.error('Fetch transactions error:', err);
      } finally {
        setLoadingTransactions(false);
      }
    };

    loadProjectTransactions();
  }, [selectedProjectName, spreadsheetId, token]);

  // 6. Manual Sync Refresh
  const handleRefresh = async () => {
    if (!token) return; // Local mode updates immediately
    if (!spreadsheetId) return;
    setLoading(true);
    setError(null);
    try {
      const loadedProjects = await fetchProjects(spreadsheetId, token);
      setProjects(loadedProjects);

      if (loadedProjects.length > 0) {
        // If selected project is no longer present, select first
        const stillExists = loadedProjects.some(p => p.name === selectedProjectName);
        if (!stillExists) {
          setSelectedProjectName(loadedProjects[0].name);
        } else if (selectedProjectName) {
          // Refresh transactions for selected project
          setLoadingTransactions(true);
          const list = await fetchTransactions(spreadsheetId, selectedProjectName, token);
          setTransactions(list);
          setLoadingTransactions(false);
        }
      } else {
        setSelectedProjectName(null);
        setTransactions([]);
      }
    } catch (err: any) {
      console.error('Refresh error:', err);
      setError('ไม่สามารถซิงค์ข้อมูลล่าสุดกับ Google Sheets ได้');
    } finally {
      setLoading(false);
    }
  };

  // 7. Save new project from modal
  const handleSaveProject = async (newProject: Project) => {
    setError(null);
    if (!token) {
      // Local mode
      const isDuplicate = projects.some(p => p.name.trim().toLowerCase() === newProject.name.trim().toLowerCase());
      if (isDuplicate) {
        throw new Error('มีโครงการชื่อนี้อยู่แล้วในระบบ');
      }
      const updated = [...projects, newProject];
      setProjects(updated);
      localStorage.setItem('local_projects', JSON.stringify(updated));
      setSelectedProjectName(newProject.name);
      setActiveTab('dashboard');
      return;
    }

    if (!spreadsheetId) return;
    try {
      // Check duplicate name
      const isDuplicate = projects.some(p => p.name.trim().toLowerCase() === newProject.name.trim().toLowerCase());
      if (isDuplicate) {
        throw new Error('มีโครงการชื่อนี้อยู่แล้วในระบบสเปรดชีต');
      }

      await saveProject(spreadsheetId, newProject, token);
      
      // Update local state and select it
      setProjects(prev => [...prev, newProject]);
      setSelectedProjectName(newProject.name);
      setActiveTab('dashboard');
    } catch (err: any) {
      console.error('Save project error:', err);
      throw err;
    }
  };

  // 8. Save new transaction from modal
  const handleSaveTransaction = async (newTrx: Omit<Transaction, 'id'>) => {
    setError(null);
    const transactionId = `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const transaction: Transaction = {
      ...newTrx,
      id: transactionId,
    };

    if (!token) {
      if (!selectedProjectName) return;
      const updated = [transaction, ...transactions];
      setTransactions(updated);
      localStorage.setItem(`local_transactions_${selectedProjectName}`, JSON.stringify(updated));
      return;
    }

    if (!spreadsheetId || !selectedProjectName) return;
    try {
      await saveTransaction(spreadsheetId, selectedProjectName, transaction, token);

      // Instantly append to local list to reflect changes in UI
      setTransactions(prev => [transaction, ...prev]);
    } catch (err: any) {
      console.error('Save transaction error:', err);
      throw new Error('ไม่สามารถบันทึกรายการลง Google Sheets ได้สำเร็จ');
    }
  };

  // 9. Delete transaction
  const handleDeleteTransaction = async (trxId: string) => {
    setError(null);
    if (!token) {
      if (!selectedProjectName) return;
      const updated = transactions.filter(t => t.id !== trxId);
      setTransactions(updated);
      localStorage.setItem(`local_transactions_${selectedProjectName}`, JSON.stringify(updated));
      return;
    }

    if (!spreadsheetId || !selectedProjectName) return;
    try {
      await deleteTransaction(spreadsheetId, selectedProjectName, trxId, token);
      // Remove from local list
      setTransactions(prev => prev.filter(t => t.id !== trxId));
    } catch (err: any) {
      console.error('Delete transaction error:', err);
      setError('ไม่สามารถลบรายการออกจาก Google Sheets ได้สำเร็จ');
    }
  };

  // Currently active project details
  const currentProject = projects.find(p => p.name === selectedProjectName);

  // Render welcome screen when user is not logged in
  const renderNotLoggedIn = () => {
    return (
      <div className="w-full max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="inline-flex p-4 bg-amber-50 text-amber-600 rounded-3xl border border-amber-100">
          <FileSpreadsheet size={36} />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-black text-slate-800 font-display">
            ระบบจัดเก็บและควบคุมบัญชีงบประมาณไซงานก่อสร้าง
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
            บันทึกรายรับ-รายจ่าย คุมค่าวัสดุก่อสร้าง และติดตามงบประมาณแบบเรียลไทม์ โดยข้อมูลจะซิงค์กับแผ่นงาน Google Sheets ส่วนตัวของคุณโดยตรงปลอดภัย 100%
          </p>
        </div>

        <div className="p-5 bg-white border border-slate-100 rounded-2xl max-w-md mx-auto space-y-3 text-left shadow-xs">
          <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" />
            เริ่มต้นใช้งานง่ายๆ:
          </h3>
          <ul className="text-xs text-slate-500 space-y-2 list-none pl-1 leading-relaxed font-sans">
            <li className="flex gap-2">
              <span className="w-4 h-4 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">1</span>
              <span><strong>ลงชื่อเข้าใช้งานด้วย Google</strong> เพื่ออนุญาตให้ระบบเข้าถึงสเปรดชีตจัดเก็บข้อมูล</span>
            </li>
            <li className="flex gap-2">
              <span className="w-4 h-4 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">2</span>
              <span><strong>เลือกหรือสร้างสเปรดชีตใหม่</strong> โดยระบบจะจัดรูปแบบแผ่นงานหลักและสูตรให้ทั้งหมดโดยอัตโนมัติ</span>
            </li>
            <li className="flex gap-2">
              <span className="w-4 h-4 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">3</span>
              <span><strong>เริ่มใช้งาน</strong> เพิ่มชื่อไซงานก่อสร้าง บันทึกงบประมาณ และรายจ่ายตามหมวดหมู่ได้ทันที</span>
            </li>
          </ul>
        </div>

        <button
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="px-6 py-3 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer disabled:opacity-60"
        >
          {isLoggingIn ? (
            <>
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
              <span>กำลังเชื่อมต่อบัญชี Google...</span>
            </>
          ) : (
            <>
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span>กดเพื่อเชื่อมต่อบัญชี Google</span>
            </>
          )}
        </button>
      </div>
    );
  };

  const renderMainContent = () => {
    if (token && !spreadsheetId) {
      return (
        <SpreadsheetSelector
          token={token}
          onSelectSpreadsheet={handleSelectSpreadsheet}
          loading={loading}
          setLoading={setLoading}
        />
      );
    }

    return (
      <div className="flex flex-col md:flex-row gap-6 w-full items-start">
        {/* Left Project Panel */}
        <aside className={`w-full md:w-64 shrink-0 flex flex-col gap-4 ${activeTab === 'projects' ? 'block' : 'hidden md:flex'}`}>
          {/* Projects Switcher */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3 flex flex-col">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <FolderKanban size={14} className="text-amber-500" />
                โครงการทั้งหมด ({projects.length})
              </h2>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
                title="รีเฟรชสเปรดชีต"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {loading && projects.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                <span className="inline-block w-5 h-5 border-2 border-slate-200 border-t-amber-500 rounded-full animate-spin"></span>
                <p>กำลังค้นหาข้อมูล...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 space-y-3">
                <p>ยังไม่มีโครงการก่อสร้าง</p>
                <button
                  onClick={() => setIsAddProjectOpen(true)}
                  className="w-full py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-colors"
                >
                  <Plus size={12} />
                  <span>สร้างโครงการแรก</span>
                </button>
              </div>
            ) : (
              <div className="space-y-1 max-h-[40vh] overflow-y-auto scrollbar-thin">
                {projects.map(proj => {
                  const isSelected = proj.name === selectedProjectName;
                  return (
                    <button
                      key={proj.name}
                      onClick={() => {
                        startTransition(() => {
                          setSelectedProjectName(proj.name);
                          setActiveTab('dashboard');
                        });
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate max-w-[150px]">{proj.name}</span>
                      <ChevronRight size={12} className={isSelected ? 'text-white' : 'text-slate-400'} />
                    </button>
                  );
                })}
                <button
                  onClick={() => setIsAddProjectOpen(true)}
                  className="w-full mt-2 py-2 border border-dashed border-slate-200 text-slate-500 hover:border-amber-500 hover:text-amber-600 hover:bg-amber-50/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  <span>เพิ่มโครงการใหม่</span>
                </button>
              </div>
            )}
          </div>

          {/* Guidelines info card */}
          <div className="bg-slate-900 text-slate-300 p-4 rounded-2xl border border-slate-800 space-y-2.5 shadow-xs">
            {token && spreadsheetId ? (
              <>
                <h3 className="text-[11px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                  <FileSpreadsheet size={12} />
                  ลิงก์เปิด Google Sheets
                </h3>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  ข้อมูลรายรับรายจ่ายจะถูกบันทึกลงในแผ่นงานแยกแต่ละโครงการของคุณโดยตรงในสเปรดชีต Google Sheets เรียลไทม์
                </p>
                <a
                  href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  rel="noopener noreferrer"
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-amber-400"
                >
                  <span>เปิดดูแผ่นงานสเปรดชีต</span>
                  <ExternalLink size={12} />
                </a>
              </>
            ) : (
              <>
                <h3 className="text-[11px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={12} />
                  โหมดบันทึกข้อมูลในเครื่อง (Local Mode)
                </h3>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  ข้อมูลจะถูกบันทึกในอุปกรณ์นี้ คุณสามารถกดเชื่อมต่อ Google เพื่อบันทึกออนไลน์และซิงค์ข้อมูลลงใน Google Sheets ได้ตลอดเวลา
                </p>
                <button
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <span>เชื่อมต่อ Google Sheets</span>
                </button>
              </>
            )}
          </div>
        </aside>

        {/* Right Dashboard / Ledger Panel */}
        <section className={`flex-1 flex flex-col gap-6 w-full ${activeTab === 'projects' ? 'hidden md:flex' : 'flex'}`}>
          {error && (
            <div className="p-4 bg-red-50 border border-red-150 text-red-800 rounded-2xl text-xs font-medium flex justify-between items-center shadow-xs">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-bold font-sans cursor-pointer">ปิด</button>
            </div>
          )}

          {/* Conditional rendering based on Projects existence */}
          {projects.length === 0 ? (
            <div className="flex-1 bg-white border border-slate-100 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-6 shadow-xs min-h-[50vh]">
              <div className="p-4 bg-amber-50 text-amber-600 rounded-3xl">
                <Hammer size={36} className="animate-bounce" />
              </div>
              <div className="space-y-2 max-w-md">
                <h2 className="text-xl font-bold font-display text-slate-800">ยินดีต้อนรับเข้าสู่แผงควบคุมหลัก</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {token ? (
                    "ขณะนี้ระบบตรวจสอบพบว่าสเปรดชีต Google Sheets ของคุณยังไม่มีแผ่นงานโครงการใดๆ กรุณาคลิกสร้างโครงการด้านล่างเพื่อเริ่มสร้าง แผ่นงาน (Sheet Tab) และสูตรควบคุมแบบอัตโนมัติ"
                  ) : (
                    "ขณะนี้ในระบบยังไม่มีข้อมูลโครงการก่อสร้างของคุณ กรุณาคลิกปุ่มด้านล่างเพื่อเริ่มสร้างโครงการและบริหารงบประมาณก่อสร้างได้ทันที"
                  )}
                </p>
              </div>
              <button
                onClick={() => setIsAddProjectOpen(true)}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus size={16} />
                <span>สร้างโครงการแรกของคุณ</span>
              </button>
            </div>
          ) : currentProject ? (
            <div className="space-y-6 w-full">
              {/* Project Title Area */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 font-display flex items-center gap-2">
                    <span>{currentProject.name}</span>
                    <span className="text-xs font-normal font-sans text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      ไซงานทำงานอยู่
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {currentProject.description || 'ไม่มีคำอธิบายเพิ่มเติมเกี่ยวกับพื้นที่ก่อสร้างนี้'}
                  </p>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setIsAddTransactionOpen(true)}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>บันทึกรายรับ / รายจ่าย</span>
                  </button>
                </div>
              </div>

              {/* Navigation tabs */}
              <div className="flex justify-between items-center border-b border-slate-200">
                <div className="flex gap-4">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
                      activeTab === 'dashboard' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <span>สรุปแดชบอร์ด</span>
                    {activeTab === 'dashboard' && (
                      <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('transactions')}
                    className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
                      activeTab === 'transactions' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <span>สมุดบัญชีรายรับรายจ่าย ({transactions.length})</span>
                    {activeTab === 'transactions' && (
                      <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('categories')}
                    className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
                      activeTab === 'categories' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <span>จัดการหมวดหมู่บัญชี</span>
                    {activeTab === 'categories' && (
                      <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
                    )}
                  </button>
                </div>
              </div>

              {/* Active Tab Panel */}
              <div className="w-full">
                {loading && transactions.length === 0 ? (
                  <div className="py-24 flex flex-col items-center justify-center gap-3 bg-white border border-slate-100 rounded-3xl shadow-xs">
                    <span className="w-8 h-8 border-2 border-slate-200 border-t-amber-500 rounded-full animate-spin"></span>
                    <span className="text-xs text-slate-400">กำลังดาวน์โหลดข้อมูลธุรกรรมจากแผ่นงาน...</span>
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="w-full"
                    >
                      {activeTab === 'dashboard' ? (
                        <Dashboard
                          project={currentProject}
                          transactions={transactions}
                          materialCategories={materialCategories}
                          incomeCategories={incomeCategories}
                        />
                      ) : activeTab === 'transactions' ? (
                        <TransactionList
                          transactions={transactions}
                          onDeleteTransaction={handleDeleteTransaction}
                          loading={loadingTransactions}
                          materialCategories={materialCategories}
                          incomeCategories={incomeCategories}
                        />
                      ) : activeTab === 'categories' ? (
                        <ManageCategories
                          materialCategories={materialCategories}
                          incomeCategories={incomeCategories}
                          onUpdateMaterialCategories={handleUpdateMaterialCategories}
                          onUpdateIncomeCategories={handleUpdateIncomeCategories}
                          onResetToDefaults={handleResetCategoriesToDefaults}
                        />
                      ) : (
                        <div className="py-10 text-center text-xs text-slate-400">
                          เลือกเมนูจากแถบนำทางด้านล่าง
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-sm text-slate-500">
              กรุณาเลือกโครงการไซงานเพื่อดูแผงข้อมูลการเงิน
            </div>
          )}
        </section>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-700">
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <PPLogo variant="horizontal" size="md" textColor="white" />
            
            {spreadsheetId && (
              <div className="hidden lg:flex flex-row items-center gap-3 border-l border-slate-800 pl-4 h-9">
                <div className="flex flex-col justify-center">
                  <span className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">Spreadsheet Realtime</span>
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    rel="noopener noreferrer"
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1 transition-colors mt-0.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    เปิด Google Sheets <ExternalLink size={10} />
                  </a>
                </div>
                <button
                  onClick={handleDisconnectSpreadsheet}
                  className="px-2 py-1 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-md text-[9px] font-bold uppercase cursor-pointer flex items-center gap-1 transition-colors"
                  title="สลับหรือเลือกไฟล์สเปรดชีตใหม่"
                >
                  <Link2 size={9} />
                  <span>เปลี่ยนชีต</span>
                </button>
              </div>
            )}

            {/* Mobile Sheet Indicator */}
            {spreadsheetId && (
              <div className="lg:hidden flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <a
                  href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  rel="noopener noreferrer"
                  className="text-[9px] text-slate-400 hover:text-emerald-400 inline-flex items-center gap-0.5"
                  title="เปิด Google Sheets"
                >
                  Sheets <ExternalLink size={8} />
                </a>
                <button
                  onClick={handleDisconnectSpreadsheet}
                  className="p-1 text-slate-400 hover:text-rose-400 border border-slate-800 rounded-md text-[8px]"
                  title="เปลี่ยนชีต"
                >
                  <Link2 size={8} />
                </button>
              </div>
            )}
          </div>

          {/* User Section */}
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <span className="text-xs font-semibold block text-slate-200 truncate max-w-[150px]">
                  {user.displayName || 'ผู้ควบคุมงาน'}
                </span>
                <span className="text-[10px] text-slate-400 block truncate max-w-[150px] font-mono">
                  {user.email}
                </span>
              </div>
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Profile'}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full border border-slate-700 shrink-0"
                />
              )}
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                title="ออกจากระบบ"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shrink-0"
            >
              {isLoggingIn ? (
                <>
                  <span className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin inline-block"></span>
                  <span>เชื่อมต่อ...</span>
                </>
              ) : (
                <>
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-3.5 h-3.5">
                    <path fill="#000000" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#000000" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#000000" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#000000" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  <span>เชื่อมต่อ Google</span>
                </>
              )}
            </button>
          )}
        </div>
      </header>

      {/* 2. Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 w-full flex flex-col md:flex-row gap-6 pb-24 md:pb-6">
        {renderMainContent()}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/90 backdrop-blur-md border-t border-slate-100 px-4 py-2 flex justify-around items-center shadow-lg">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 p-1 transition-all cursor-pointer ${
            activeTab === 'dashboard' ? 'text-amber-500 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <LayoutDashboard size={20} />
          <span className="text-[10px]">สรุปแดชบอร์ด</span>
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex flex-col items-center gap-1 p-1 transition-all cursor-pointer ${
            activeTab === 'transactions' ? 'text-amber-500 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Receipt size={20} />
          <span className="text-[10px]">สมุดบัญชี</span>
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex flex-col items-center gap-1 p-1 transition-all cursor-pointer ${
            activeTab === 'projects' ? 'text-amber-500 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <FolderKanban size={20} />
          <span className="text-[10px]">โครงการ</span>
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex flex-col items-center gap-1 p-1 transition-all cursor-pointer ${
            activeTab === 'categories' ? 'text-amber-500 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Settings2 size={20} />
          <span className="text-[10px]">หมวดหมู่บัญชี</span>
        </button>
      </div>

      {/* 3. Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-12 shrink-0 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            &copy; {new Date().getFullYear()} ระบบบัญชีและงบประมาณไซงานก่อสร้าง. สงวนลิขสิทธิ์.
          </div>
          <div className="flex gap-4 font-mono">
            <span>Powered by Google Workspace APIs & Google AI Studio Build</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AddProjectModal
        isOpen={isAddProjectOpen}
        onClose={() => setIsAddProjectOpen(false)}
        onSave={handleSaveProject}
        materialCategories={materialCategories}
      />

      <AddTransactionModal
        isOpen={isAddTransactionOpen}
        onClose={() => setIsAddTransactionOpen(false)}
        projectName={selectedProjectName || ''}
        onSave={handleSaveTransaction}
        materialCategories={materialCategories}
        incomeCategories={incomeCategories}
      />
    </div>
  );
}
