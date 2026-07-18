/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ProjectBudget {
  concrete: number;
  steel: number;
  wood: number;
  electrical: number;
  plumbing: number;
  labor: number;
  others: number;
}

export interface Project {
  name: string;
  totalBudget: number;
  description: string;
  categoryBudgets: ProjectBudget;
}

export type TransactionType = 'Income' | 'Expense';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  category: string;
  description: string;
  amount: number;
  referenceNo: string;
  notes: string;
}

export interface SpreadsheetState {
  spreadsheetId: string | null;
  projects: Project[];
  loading: boolean;
  error: string | null;
}

export const MATERIAL_CATEGORIES = [
  { key: 'concrete', label: 'งานโครงสร้าง / คอนกรีต', color: '#64748b' },
  { key: 'steel', label: 'งานเหล็กและโลหะ', color: '#475569' },
  { key: 'wood', label: 'งานไม้และตกแต่ง', color: '#b45309' },
  { key: 'electrical', label: 'งานระบบไฟฟ้า', color: '#eab308' },
  { key: 'plumbing', label: 'งานระบบประปา', color: '#0284c7' },
  { key: 'labor', label: 'ค่าแรงงาน', color: '#10b981' },
  { key: 'others', label: 'อื่นๆ / ทั่วไป', color: '#6b7280' },
];

export const INCOME_CATEGORIES = [
  { key: 'installment', label: 'เบิกงวดงาน (ค่างวด)' },
  { key: 'capital', label: 'เงินสำรอง / ทุนหมุนเวียน' },
  { key: 'others', label: 'รายรับอื่นๆ' },
];

export function getCategoryLabel(key: string): string {
  const material = MATERIAL_CATEGORIES.find(c => c.key === key || c.label === key);
  if (material) return material.label;
  const income = INCOME_CATEGORIES.find(c => c.key === key || c.label === key);
  if (income) return income.label;
  return key;
}

export function getCategoryColor(key: string): string {
  const material = MATERIAL_CATEGORIES.find(c => c.key === key || c.label === key);
  if (material) return material.color;
  return '#10b981'; // Default green for income
}
