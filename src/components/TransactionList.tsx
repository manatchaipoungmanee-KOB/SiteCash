/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import {
  Search,
  SlidersHorizontal,
  Trash2,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Download,
  Info
} from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteTransaction: (transactionId: string) => Promise<void>;
  loading: boolean;
  materialCategories: Array<{ key: string; label: string; color?: string }>;
  incomeCategories: Array<{ key: string; label: string }>;
}

export default function TransactionList({
  transactions,
  onDeleteTransaction,
  loading,
  materialCategories,
  incomeCategories,
}: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Delete modal state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  // Sorting: Newest Date first, then ID
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.id.localeCompare(a.id);
    });
  }, [transactions]);

  // Filtering
  const filteredTransactions = useMemo(() => {
    return sortedTransactions.filter(t => {
      const matchesSearch =
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.notes.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = selectedType === 'all' || t.type === selectedType;

      const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;

      return matchesSearch && matchesType && matchesCategory;
    });
  }, [sortedTransactions, searchTerm, selectedType, selectedCategory]);

  const targetDeleteTransaction = useMemo(() => {
    return transactions.find(t => t.id === deletingId);
  }, [transactions, deletingId]);

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setDeletingLoading(true);
    try {
      await onDeleteTransaction(deletingId);
      setDeletingId(null);
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeletingLoading(false);
    }
  };

  // Extract all active categories present in current list to filter
  const activeCategories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => set.add(t.category));
    return Array.from(set);
  }, [transactions]);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
      {/* Controls & Filters Header */}
      <div className="p-5 border-b border-gray-100 bg-slate-50/50 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="ค้นหารายการ, เลขใบเสร็จ, หมายเหตุ..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 text-sm bg-white text-slate-800 transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-2.5 items-center">
            {/* Filter by Type */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shrink-0">
              <button
                onClick={() => {
                  setSelectedType('all');
                  setSelectedCategory('all');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  selectedType === 'all' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => {
                  setSelectedType('Income');
                  setSelectedCategory('all');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  selectedType === 'Income' ? 'bg-emerald-500 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                รายรับ
              </button>
              <button
                onClick={() => {
                  setSelectedType('Expense');
                  setSelectedCategory('all');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  selectedType === 'Expense' ? 'bg-rose-500 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                รายจ่าย
              </button>
            </div>

            {/* Filter by Category */}
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:border-amber-500"
            >
              <option value="all">หมวดหมู่ทั้งหมด ({activeCategories.length})</option>
              {selectedType !== 'Income' &&
                materialCategories.map(c => (
                  <option key={c.key} value={c.label}>
                    {c.label}
                  </option>
                ))}
              {selectedType !== 'Expense' &&
                incomeCategories.map(c => (
                  <option key={c.key} value={c.label}>
                    {c.label}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="px-6 py-3.5 font-medium">วันที่ / เลขที่อ้างอิง</th>
              <th className="px-6 py-3.5 font-medium">หมวดหมู่</th>
              <th className="px-6 py-3.5 font-medium">รายละเอียดรายการ</th>
              <th className="px-6 py-3.5 font-medium text-right">จำนวนเงิน (บาท)</th>
              <th className="px-6 py-3.5 font-medium">หมายเหตุ</th>
              <th className="px-6 py-3.5 font-medium text-center w-20">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map(t => {
                const isIncome = t.type === 'Income';
                
                // Dynamically look up category color
                const matchedCategory = materialCategories.find(c => c.label === t.category || c.key === t.category);
                const catColor = matchedCategory ? matchedCategory.color || '#64748b' : '#10b981';

                return (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Date & Ref */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="font-medium text-slate-700">{t.date}</span>
                      </div>
                      {t.referenceNo ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 mt-1 font-semibold">
                          <Receipt size={10} />
                          {t.referenceNo}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-350 italic block mt-1">- ไม่มีเลขที่อ้างอิง -</span>
                      )}
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50" style={{ borderLeft: `3px solid ${catColor}` }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catColor }} />
                        {t.category}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="px-6 py-4">
                      <div className="text-slate-800 font-medium line-clamp-1">{t.description}</div>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className={`font-semibold font-mono ${isIncome ? 'text-emerald-600' : 'text-slate-700'}`}>
                        {isIncome ? '+' : '-'} {t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>

                    {/* Notes */}
                    <td className="px-6 py-4 max-w-[180px] truncate">
                      {t.notes ? (
                        <span className="text-slate-500 text-xs inline-flex items-center gap-1" title={t.notes}>
                          <Info size={12} className="text-slate-300 shrink-0" />
                          <span className="truncate">{t.notes}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300 italic text-xs">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => setDeletingId(t.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="ลบรายการ"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <SlidersHorizontal size={24} className="text-slate-300 animate-pulse" />
                    <p className="text-sm">ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา</p>
                    <p className="text-xs text-slate-400">ลองล้างตัวกรองหรือใช้คำค้นหาอื่น</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Safe Deletion Confirmation Modal */}
      {deletingId && targetDeleteTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-base font-bold font-sans">ยืนยันการลบรายการบัญชี?</h3>
            </div>

            <div className="text-sm text-slate-600 space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div className="flex justify-between">
                <span>รายละเอียด:</span>
                <span className="font-semibold text-slate-800">{targetDeleteTransaction.description}</span>
              </div>
              <div className="flex justify-between">
                <span>ประเภท:</span>
                <span className={`font-semibold ${targetDeleteTransaction.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {targetDeleteTransaction.type === 'Income' ? 'รายรับ (เบิกงวด)' : 'รายจ่าย (ต้นทุน)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>จำนวนเงิน:</span>
                <span className="font-bold font-mono text-slate-800">{targetDeleteTransaction.amount.toLocaleString()} บาท</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              * การดำเนินการนี้จะทำการลบแถวข้อมูลออกจากแผ่นงานโครงการบน Google Sheets ของคุณแบบถาวร และอัปเดตสัดส่วนบัญชีให้เรียลไทม์ คุณแน่ใจที่จะดำเนินงานนี้ต่อหรือไม่?
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deletingLoading}
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 text-xs font-semibold hover:bg-slate-100 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={deletingLoading}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
              >
                {deletingLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>กำลังลบจาก Google Sheets...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>ใช่, ยืนยันลบข้อมูล</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
