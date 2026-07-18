/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Project } from '../types';
import { X, Plus, AlertCircle, HardHat } from 'lucide-react';
import { motion } from 'motion/react';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Project) => Promise<void>;
  materialCategories: Array<{ key: string; label: string; color?: string }>;
}

export default function AddProjectModal({ isOpen, onClose, onSave, materialCategories }: AddProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [categoryBudgets, setCategoryBudgets] = useState({
    concrete: 0,
    steel: 0,
    wood: 0,
    electrical: 0,
    plumbing: 0,
    labor: 0,
    others: 0,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCategoryBudgetChange = (category: string, value: string) => {
    const numericVal = parseFloat(value) || 0;
    setCategoryBudgets(prev => ({
      ...prev,
      [category]: numericVal,
    }));
  };

  // Auto-fill or distribute budget evenly / calculate sum of category budgets
  const sumOfCategories = (Object.values(categoryBudgets) as number[]).reduce((sum, val) => sum + val, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('กรุณากรอกชื่อโครงการ');
      return;
    }

    if (totalBudget <= 0) {
      setError('งบประมาณรวมโครงการต้องมากกว่า 0 บาท');
      return;
    }

    if (sumOfCategories > totalBudget) {
      setError(`รวมงบประมาณย่อยแต่ละประเภท (${sumOfCategories.toLocaleString()} บาท) เกินกว่างบประมาณรวมของโครงการ (${totalBudget.toLocaleString()} บาท)`);
      return;
    }

    setSaving(true);
    try {
      const newProject: Project = {
        name: name.trim(),
        description: description.trim(),
        totalBudget,
        categoryBudgets,
      };
      await onSave(newProject);
      // Reset form
      setName('');
      setDescription('');
      setTotalBudget(0);
      setCategoryBudgets({
        concrete: 0,
        steel: 0,
        wood: 0,
        electrical: 0,
        plumbing: 0,
        labor: 0,
        others: 0,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกโครงการ');
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
        className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 bg-slate-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-lg text-white">
              <HardHat size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 font-sans tracking-tight">สร้างโครงการก่อสร้างใหม่</h3>
              <p className="text-xs text-slate-500">กำหนดรายละเอียดและงบประมาณวัสดุแยกประเภท</p>
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-700 border-b border-gray-100 pb-1">ข้อมูลทั่วไปของไซงาน</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">ชื่อโครงการ *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น บ้านเดี่ยว มหานคร ซอย 10"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500 text-slate-800 text-sm transition-colors bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">งบประมาณรวมของโครงการ (บาท) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  placeholder="เช่น 3500000"
                  value={totalBudget || ''}
                  onChange={e => setTotalBudget(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500 text-slate-800 text-sm transition-colors bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">คำอธิบายเพิ่มเติม / ข้อมูลสถานที่</label>
              <textarea
                placeholder="ระบุที่ตั้ง รายละเอียดผู้รับเหมาหลัก หรือข้อมูลสังเขป..."
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500 text-slate-800 text-sm transition-colors bg-white resize-none"
              />
            </div>
          </div>

          {/* Budget Allocation */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-1">
              <h4 className="text-sm font-semibold text-slate-700">การจัดสรรงบประมาณวัสดุแยกประเภท</h4>
              <span className={`text-xs font-mono px-2.5 py-0.5 rounded-full ${sumOfCategories > totalBudget ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-600'}`}>
                รวมที่ใช้: {sumOfCategories.toLocaleString()} / {totalBudget.toLocaleString()} บาท
              </span>
            </div>

            <p className="text-xs text-slate-500">
              กำหนดส่วนงบประมาณสำหรับวัสดุและค่าแรงเพื่อติดตามอัตราการจ่ายเงินในแดชบอร์ดสรุปผลแบบเรียลไทม์
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {materialCategories
                .filter(c => ['concrete', 'steel', 'wood', 'electrical', 'plumbing', 'labor', 'others'].includes(c.key))
                .map(category => (
                  <div key={category.key}>
                    <label className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
                      <span>{category.label}</span>
                      <span className="text-slate-400 font-normal">งบประมาณ (บาท)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-400 text-xs font-semibold" style={{ color: category.color || '#64748b' }}>●</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0"
                        value={categoryBudgets[category.key as keyof typeof categoryBudgets] || ''}
                        onChange={e => handleCategoryBudgetChange(category.key, e.target.value)}
                        className="w-full pl-7 pr-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500 text-slate-800 text-sm transition-colors bg-white"
                      />
                    </div>
                  </div>
                ))}
            </div>
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
            className="px-5 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 focus:ring-4 focus:ring-amber-200 disabled:opacity-50 transition-all flex items-center gap-2 shadow-xs"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>กำลังบันทึกแผ่นข้อมูล...</span>
              </>
            ) : (
              <>
                <Plus size={16} />
                <span>บันทึกและเปิดสเปรดชีต</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
