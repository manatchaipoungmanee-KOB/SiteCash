/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType } from '../types';
import { X, Plus, AlertCircle, FileSpreadsheet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'motion/react';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  projectName: string;
  materialCategories: Array<{ key: string; label: string; color?: string }>;
  incomeCategories: Array<{ key: string; label: string }>;
}

export default function AddTransactionModal({
  isOpen,
  onClose,
  onSave,
  projectName,
  materialCategories,
  incomeCategories,
}: AddTransactionModalProps) {
  const [type, setType] = useState<TransactionType>('Expense');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default date to today
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      setDate(`${yyyy}-${mm}-${dd}`);

      // Set default category
      if (materialCategories.length > 0 && incomeCategories.length > 0) {
        setCategory(type === 'Expense' ? materialCategories[0].label : incomeCategories[0].label);
      }
    }
  }, [isOpen, materialCategories, incomeCategories]);

  // Adjust category default when type changes
  useEffect(() => {
    if (materialCategories.length > 0 && incomeCategories.length > 0) {
      setCategory(type === 'Expense' ? materialCategories[0].label : incomeCategories[0].label);
    }
  }, [type, materialCategories, incomeCategories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!date) {
      setError('กรุณาระบุวันที่ทำรายการ');
      return;
    }

    if (!category) {
      setError('กรุณาเลือกหมวดหมู่');
      return;
    }

    if (!description.trim()) {
      setError('กรุณากรอกรายละเอียดรายการ');
      return;
    }

    if (amount <= 0) {
      setError('จำนวนเงินต้องมากกว่า 0 บาท');
      return;
    }

    setSaving(true);
    try {
      const newTransaction: Omit<Transaction, 'id'> = {
        date,
        type,
        category,
        description: description.trim(),
        amount,
        referenceNo: referenceNo.trim(),
        notes: notes.trim(),
      };
      await onSave(newTransaction);
      // Reset
      setDescription('');
      setAmount(0);
      setReferenceNo('');
      setNotes('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกรายการ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 bg-slate-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg text-white ${type === 'Expense' ? 'bg-rose-500' : 'bg-emerald-500'}`}>
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 font-sans tracking-tight">บันทึกรายการบัญชี</h3>
              <p className="text-xs text-slate-500">โครงการ: {projectName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Toggle */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2">ประเภทธุรกรรม *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('Expense')}
                className={`py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold border-2 transition-all cursor-pointer ${
                  type === 'Expense'
                    ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-xs'
                    : 'border-slate-100 bg-slate-50/50 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowDownRight size={16} />
                <span>รายจ่าย (ค่าใช้จ่ายไซงาน)</span>
              </button>
              <button
                type="button"
                onClick={() => setType('Income')}
                className={`py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold border-2 transition-all cursor-pointer ${
                  type === 'Income'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-xs'
                    : 'border-slate-100 bg-slate-50/50 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowUpRight size={16} />
                <span>รายรับ (เบิกเงินงวด/ทุน)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">วันที่ทำรายการ *</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500 text-slate-800 text-sm bg-white"
              />
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">หมวดหมู่รายการ *</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500 text-slate-800 text-sm bg-white"
              >
                {type === 'Expense'
                  ? materialCategories.map(c => (
                      <option key={c.key} value={c.label}>
                        {c.label}
                      </option>
                    ))
                  : incomeCategories.map(c => (
                      <option key={c.key} value={c.label}>
                        {c.label}
                      </option>
                    ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">รายละเอียดงาน / ซัพพลายเออร์ / รายการ *</label>
            <input
              type="text"
              required
              placeholder={type === 'Expense' ? 'เช่น ซื้อคอนกรีตผสมเสร็จ CPAC 5 คิว' : 'เช่น เบิกเงินค่างวดงานงวดที่ 1 ฐานราก'}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500 text-slate-800 text-sm bg-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">จำนวนเงิน (บาท) *</label>
              <input
                type="number"
                required
                min="0"
                step="any"
                placeholder="0.00"
                value={amount || ''}
                onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500 text-slate-800 text-sm bg-white font-semibold text-slate-800"
              />
            </div>

            {/* Reference No */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">เลขที่อ้างอิง (ใบเสร็จ / บิลค้างจ่าย) (ถ้ามี)</label>
              <input
                type="text"
                placeholder="เช่น IV-2026-001"
                value={referenceNo}
                onChange={e => setReferenceNo(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500 text-slate-800 text-sm bg-white"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">หมายเหตุเพิ่มเติม</label>
            <textarea
              placeholder="ระบุสถานที่จัดเก็บ ข้อมูลผู้รับ หรือข้อสังเกตความคุ้มทุน..."
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500 text-slate-800 text-sm bg-white resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 text-sm hover:bg-slate-100 font-medium transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className={`px-5 py-2 text-white rounded-lg text-sm font-medium focus:ring-4 transition-all flex items-center gap-2 shadow-xs ${
              type === 'Expense' ? 'bg-rose-500 hover:bg-rose-600 focus:ring-rose-200' : 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-200'
            }`}
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>กำลังบันทึกแผ่นงาน...</span>
              </>
            ) : (
              <>
                <Plus size={16} />
                <span>บันทึกรายการ</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
