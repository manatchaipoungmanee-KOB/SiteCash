/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Trash2, RotateCcw, Check, Sparkles, Settings2, Coins, HardHat } from 'lucide-react';
import { motion } from 'motion/react';

export interface Category {
  key: string;
  label: string;
  color?: string; // only for expense
}

interface ManageCategoriesProps {
  materialCategories: Category[];
  incomeCategories: Category[];
  onUpdateMaterialCategories: (cats: Category[]) => void;
  onUpdateIncomeCategories: (cats: Category[]) => void;
  onResetToDefaults: () => void;
}

// 16 Aesthetic professional theme color presets for categories
const COLOR_PRESETS = [
  { value: '#64748b', name: 'Slate' },
  { value: '#475569', name: 'Charcoal' },
  { value: '#ef4444', name: 'Red' },
  { value: '#f97316', name: 'Orange' },
  { value: '#b45309', name: 'Amber' },
  { value: '#eab308', name: 'Yellow' },
  { value: '#10b981', name: 'Green' },
  { value: '#059669', name: 'Emerald' },
  { value: '#0d9488', name: 'Teal' },
  { value: '#0ea5e9', name: 'Sky' },
  { value: '#3b82f6', name: 'Blue' },
  { value: '#1d318e', name: 'Royal' },
  { value: '#6366f1', name: 'Indigo' },
  { value: '#7c3aed', name: 'Violet' },
  { value: '#ec4899', name: 'Pink' },
  { value: '#f43f5e', name: 'Rose' },
];

const CORE_EXPENSE_KEYS = ['concrete', 'steel', 'wood', 'electrical', 'plumbing', 'labor', 'others'];

export default function ManageCategories({
  materialCategories,
  incomeCategories,
  onUpdateMaterialCategories,
  onUpdateIncomeCategories,
  onResetToDefaults,
}: ManageCategoriesProps) {
  const [activeSubTab, setActiveSubTab] = useState<'expense' | 'income'>('expense');
  
  // States for adding new custom categories
  const [newExpenseLabel, setNewExpenseLabel] = useState('');
  const [newExpenseColor, setNewExpenseColor] = useState('#64748b');
  const [newIncomeLabel, setNewIncomeLabel] = useState('');

  // States for inline editing
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [editingColor, setEditingColor] = useState('');

  // Reset confirm state
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Add custom expense category
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseLabel.trim()) return;
    
    // Check for duplicates
    if (materialCategories.some(c => c.label.toLowerCase() === newExpenseLabel.trim().toLowerCase())) {
      alert('มีหมวดหมู่นี้อยู่แล้ว');
      return;
    }

    const newCat: Category = {
      key: `custom_expense_${Date.now()}`,
      label: newExpenseLabel.trim(),
      color: newExpenseColor,
    };

    onUpdateMaterialCategories([...materialCategories, newCat]);
    setNewExpenseLabel('');
  };

  // Add custom income category
  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncomeLabel.trim()) return;

    if (incomeCategories.some(c => c.label.toLowerCase() === newIncomeLabel.trim().toLowerCase())) {
      alert('มีหมวดหมู่นี้อยู่แล้ว');
      return;
    }

    const newCat: Category = {
      key: `custom_income_${Date.now()}`,
      label: newIncomeLabel.trim(),
    };

    onUpdateIncomeCategories([...incomeCategories, newCat]);
    setNewIncomeLabel('');
  };

  // Delete category
  const handleDeleteCategory = (key: string, type: 'expense' | 'income') => {
    if (type === 'expense') {
      // Cannot delete core keys because they map to budget columns, but can edit them!
      if (CORE_EXPENSE_KEYS.includes(key)) {
        alert('ไม่สามารถลบหมวดหมู่หลักที่มีการจัดสรรงบประมาณในคอลัมน์ Excel ได้ แต่คุณสามารถกดแก้ไขเพื่อเปลี่ยนชื่อและสีได้ตามต้องการ!');
        return;
      }
      onUpdateMaterialCategories(materialCategories.filter(c => c.key !== key));
    } else {
      // Allow deleting income categories, but warn
      if (confirm('ยืนยันที่จะลบหมวดหมู่รายรับนี้? รายการเดิมในสมุดบัญชีที่ใช้หมวดหมู่นี้จะไม่หาย แต่หมวดหมู่จะถูกถอดออกจากตัวเลือก')) {
        onUpdateIncomeCategories(incomeCategories.filter(c => c.key !== key));
      }
    }
  };

  // Start inline editing
  const handleStartEdit = (cat: Category) => {
    setEditingKey(cat.key);
    setEditingLabel(cat.label);
    setEditingColor(cat.color || '#64748b');
  };

  // Save inline editing
  const handleSaveEdit = (type: 'expense' | 'income') => {
    if (!editingLabel.trim()) return;

    if (type === 'expense') {
      const updated = materialCategories.map(c => {
        if (c.key === editingKey) {
          return { ...c, label: editingLabel.trim(), color: editingColor };
        }
        return c;
      });
      onUpdateMaterialCategories(updated);
    } else {
      const updated = incomeCategories.map(c => {
        if (c.key === editingKey) {
          return { ...c, label: editingLabel.trim() };
        }
        return c;
      });
      onUpdateIncomeCategories(updated);
    }

    setEditingKey(null);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden flex flex-col">
      {/* Tab Header inside Panel */}
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 font-display flex items-center gap-2">
            <Settings2 size={18} className="text-amber-500" />
            <span>ตั้งค่าและจัดการหมวดหมู่ทางบัญชี</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            ปรับแต่งชื่อ สี หรือเพิ่มหมวดหมู่รายรับ-รายจ่ายที่ตรงกับหน้างานจริงของคุณ
          </p>
        </div>

        {/* Inner tab selectors */}
        <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => { setActiveSubTab('expense'); setEditingKey(null); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'expense'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <HardHat size={13} />
            <span>หมวดรายจ่าย</span>
          </button>
          <button
            onClick={() => { setActiveSubTab('income'); setEditingKey(null); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'income'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Coins size={13} />
            <span>หมวดรายรับ</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Core explanation banner */}
        <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl text-xs text-amber-800 space-y-1">
          <p className="font-semibold flex items-center gap-1.5 text-amber-900">
            <Sparkles size={14} />
            ข้อแนะนำเกี่ยวกับการจัดสรรงบประมาณไซงาน:
          </p>
          <p className="leading-relaxed">
            - <strong>หมวดหมู่หลัก (Core 7 หมวด)</strong> เชื่อมโยงโดยตรงกับคอลัมน์งบประมาณหลักใน Google Sheets 
            หากท่านเปลี่ยนชื่อ เช่น เปลี่ยน "งานโครงสร้าง / คอนกรีต" เป็น "เสาเข็มและคานคอนกรีต" ยอดงบประมาณและยอดใช้จ่ายจะลิ้งก์ให้โดยอัตโนมัติ!<br />
            - <strong>หมวดหมู่เพิ่มเติม</strong> ที่สร้างเพิ่มจะถือเป็นงบสำรอง/งบเสริม ซึ่งใช้บันทึกรายจ่ายได้ตามปกติแต่จะไม่มีคอลัมน์แยกงบเฉพาะตัวในชีตโครงสร้างงบ
          </p>
        </div>

        {/* 1. Expense Tab Content */}
        {activeSubTab === 'expense' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Col: Add New Custom Category */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 border border-slate-100 bg-slate-50/50 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  เพิ่มหมวดหมู่รายจ่ายเพิ่มเติม
                </h3>

                <form onSubmit={handleAddExpense} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">ชื่อหมวดหมู่รายจ่ายใหม่</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น ค่าเช่าเครื่องจักร, ค่าน้ำมันรถขนส่ง"
                      value={newExpenseLabel}
                      onChange={e => setNewExpenseLabel(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500 text-slate-800 text-sm bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-2">เลือกสัญลักษณ์สีประจำหมวด</label>
                    <div className="grid grid-cols-8 gap-2">
                      {COLOR_PRESETS.map(preset => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => setNewExpenseColor(preset.value)}
                          className="w-8 h-8 rounded-full flex items-center justify-center border transition-all cursor-pointer relative"
                          style={{ backgroundColor: preset.value, borderColor: preset.value === newExpenseColor ? '#000' : 'transparent' }}
                          title={preset.name}
                        >
                          {preset.value === newExpenseColor && (
                            <Check size={14} className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] font-bold" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>เพิ่มหมวดหมู่รายจ่าย</span>
                  </button>
                </form>
              </div>

              {/* Reset defaults actions */}
              <div className="pt-2">
                {!showResetConfirm ? (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="w-full py-2 border border-dashed border-slate-200 text-slate-500 hover:border-red-200 hover:text-red-600 hover:bg-red-50/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>คืนค่าหมวดหมู่เริ่มต้นจากระบบ</span>
                  </button>
                ) : (
                  <div className="p-4 bg-red-50 border border-red-150 rounded-xl space-y-3">
                    <p className="text-xs text-red-800 font-semibold text-center">
                      ท่านแน่ใจหรือไม่ที่จะรีเซ็ตหมวดหมู่ทั้งหมดกลับเป็นค่าเริ่มต้น? การตั้งค่าชื่อและสีที่ท่านกำหนดเองจะถูกลบทั้งหมด
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          onResetToDefaults();
                          setShowResetConfirm(false);
                        }}
                        className="flex-1 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 cursor-pointer"
                      >
                        ยืนยันรีเซ็ต
                      </button>
                      <button
                        onClick={() => setShowResetConfirm(false)}
                        className="flex-1 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Categories List */}
            <div className="lg:col-span-7 space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-1">
                รายการหมวดหมู่รายจ่ายปัจจุบัน ({materialCategories.length})
              </h3>

              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {materialCategories.map(cat => {
                  const isCore = CORE_EXPENSE_KEYS.includes(cat.key);
                  const isEditing = editingKey === cat.key;

                  return (
                    <div
                      key={cat.key}
                      className="p-3.5 border border-slate-100 rounded-xl flex items-center justify-between gap-4 bg-white hover:shadow-xs transition-shadow"
                    >
                      {isEditing ? (
                        <div className="flex-1 flex flex-col gap-2.5">
                          <div className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={editingLabel}
                              onChange={e => setEditingLabel(e.target.value)}
                              className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold"
                            />
                            <button
                              onClick={() => handleSaveEdit('expense')}
                              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                            >
                              บันทึก
                            </button>
                            <button
                              onClick={() => setEditingKey(null)}
                              className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg cursor-pointer"
                            >
                              ยกเลิก
                            </button>
                          </div>
                          
                          {/* Color Palette Inline Pick */}
                          <div className="flex flex-wrap gap-1 items-center pt-1">
                            <span className="text-[10px] text-slate-400 font-medium mr-1">เปลี่ยนสี:</span>
                            {COLOR_PRESETS.map(preset => (
                              <button
                                key={preset.value}
                                type="button"
                                onClick={() => setEditingColor(preset.value)}
                                className="w-5 h-5 rounded-full border border-white hover:scale-110 transition-transform cursor-pointer relative"
                                style={{ backgroundColor: preset.value, outline: preset.value === editingColor ? '1px solid black' : 'none' }}
                                title={preset.name}
                              />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Label display */}
                          <div className="flex items-center gap-3">
                            <span
                              className="w-3.5 h-3.5 rounded-full border shrink-0"
                              style={{ backgroundColor: cat.color || '#64748b', borderColor: 'rgba(0,0,0,0.05)' }}
                            />
                            <div>
                              <p className="text-xs font-bold text-slate-800">{cat.label}</p>
                              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block mt-0.5">
                                {isCore ? '● หมวดหมู่หลัก (มีช่องงบประมาณในชีต)' : '● หมวดหมู่เสริมเฉพาะทาง'}
                              </span>
                            </div>
                          </div>

                          {/* Action tools */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleStartEdit(cat)}
                              className="px-2.5 py-1 text-[10px] font-bold text-[#1d318e] hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                            >
                              แก้ไขชื่อ/สี
                            </button>
                            {!isCore && (
                              <button
                                onClick={() => handleDeleteCategory(cat.key, 'expense')}
                                className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition-colors cursor-pointer"
                                title="ลบหมวดหมู่"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 2. Income Tab Content */}
        {activeSubTab === 'income' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Col: Add New Income Category */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 border border-slate-100 bg-slate-50/50 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  เพิ่มหมวดหมู่รายรับเพิ่มเติม
                </h3>

                <form onSubmit={handleAddIncome} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">ชื่อหมวดหมู่รายรับใหม่</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น เงินมัดจำก้อนแรก, ดอกเบี้ยธนาคาร"
                      value={newIncomeLabel}
                      onChange={e => setNewIncomeLabel(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500 text-slate-800 text-sm bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>เพิ่มหมวดหมู่รายรับ</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Right Col: Categories List */}
            <div className="lg:col-span-7 space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-1">
                รายการหมวดหมู่รายรับปัจจุบัน ({incomeCategories.length})
              </h3>

              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {incomeCategories.map(cat => {
                  const isEditing = editingKey === cat.key;

                  return (
                    <div
                      key={cat.key}
                      className="p-3.5 border border-slate-100 rounded-xl flex items-center justify-between gap-4 bg-white hover:shadow-xs transition-shadow"
                    >
                      {isEditing ? (
                        <div className="flex-1 flex gap-2 items-center">
                          <input
                            type="text"
                            value={editingLabel}
                            onChange={e => setEditingLabel(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold"
                          />
                          <button
                            onClick={() => handleSaveEdit('income')}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                          >
                            บันทึก
                          </button>
                          <button
                            onClick={() => setEditingKey(null)}
                            className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg cursor-pointer"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            </span>
                            <p className="text-xs font-bold text-slate-800">{cat.label}</p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleStartEdit(cat)}
                              className="px-2.5 py-1 text-[10px] font-bold text-[#1d318e] hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                            >
                              แก้ไขชื่อ
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat.key, 'income')}
                              className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition-colors cursor-pointer"
                              title="ลบหมวดหมู่"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
