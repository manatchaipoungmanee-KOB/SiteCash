/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Project, Transaction } from '../types';
import {
  TrendingUp,
  TrendingDown,
  CircleAlert,
  CalendarDays,
  HardHat,
  BadgeAlert,
  Wallet,
  Activity,
  Award
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DashboardProps {
  project: Project;
  transactions: Transaction[];
  materialCategories: Array<{ key: string; label: string; color?: string }>;
  incomeCategories: Array<{ key: string; label: string }>;
}

export default function Dashboard({ project, transactions, materialCategories, incomeCategories }: DashboardProps) {
  // 1. Calculate general stats
  const stats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
      if (t.type === 'Income') {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
      }
    });

    const remainingProjectBudget = project.totalBudget - totalExpense;
    const currentBalance = totalIncome - totalExpense;

    return {
      totalIncome,
      totalExpense,
      remainingProjectBudget,
      currentBalance,
    };
  }, [project, transactions]);

  // 2. Calculate category actual spend vs budgeted
  const categorySummary = useMemo<Record<string, { budgeted: number; actual: number; color: string; percent: number }>>(() => {
    const summary: Record<string, { budgeted: number; actual: number; color: string; percent: number }> = {};

    // Initialize with project budget categories
    materialCategories.forEach(cat => {
      const budgeted = project.categoryBudgets[cat.key as keyof typeof project.categoryBudgets] || 0;
      summary[cat.label] = {
        budgeted,
        actual: 0,
        color: cat.color || '#64748b',
        percent: 0,
      };
    });

    // Accumulate expense amounts
    transactions.forEach(t => {
      if (t.type === 'Expense') {
        const catLabel = t.category;
        if (summary[catLabel]) {
          summary[catLabel].actual += t.amount;
        } else {
          // If a custom category or something else
          summary[catLabel] = {
            budgeted: 0,
            actual: t.amount,
            color: '#6b7280',
            percent: 0,
          };
        }
      }
    });

    // Calculate percentages
    Object.keys(summary).forEach(key => {
      const item = summary[key];
      if (item.budgeted > 0) {
        item.percent = Math.min((item.actual / item.budgeted) * 100, 100);
      } else {
        item.percent = item.actual > 0 ? 100 : 0;
      }
    });

    return summary;
  }, [project, transactions, materialCategories]);

  // 3. Prepare Pie Chart Data (Material distribution)
  const pieChartData = useMemo(() => {
    return (Object.entries(categorySummary) as [string, { budgeted: number; actual: number; color: string; percent: number }][])
      .map(([name, val]) => ({
        name,
        value: val.actual,
        color: val.color,
      }))
      .filter(item => item.value > 0);
  }, [categorySummary]);

  // 4. Prepare Monthly Summary Chart (Income vs Expense)
  const monthlyChartData = useMemo(() => {
    const monthsData: Record<string, { month: string; income: number; expense: number }> = {};

    transactions.forEach(t => {
      if (!t.date) return;
      const [year, month] = t.date.split('-');
      if (!year || !month) return;
      
      // Convert e.g., '2026-07' to Thai visual format 'ก.ค. 2026'
      const monthNamesTh = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      const monthIdx = parseInt(month, 10) - 1;
      const formattedMonth = `${monthNamesTh[monthIdx] || month} ${year}`;
      const rawMonthKey = `${year}-${month}`; // for sorting

      if (!monthsData[rawMonthKey]) {
        monthsData[rawMonthKey] = {
          month: formattedMonth,
          income: 0,
          expense: 0,
        };
      }

      if (t.type === 'Income') {
        monthsData[rawMonthKey].income += t.amount;
      } else {
        monthsData[rawMonthKey].expense += t.amount;
      }
    });

    // Sort months chronologically
    return Object.keys(monthsData)
      .sort()
      .map(key => monthsData[key]);
  }, [transactions]);

  // 5. Generate threshold warnings
  const warnings = useMemo(() => {
    const list: { category: string; actual: number; budgeted: number; status: 'exceeded' | 'approaching' }[] = [];

    (Object.entries(categorySummary) as [string, { budgeted: number; actual: number; color: string; percent: number }][]).forEach(([name, val]) => {
      if (val.budgeted > 0) {
        const ratio = val.actual / val.budgeted;
        if (ratio >= 1.0) {
          list.push({ category: name, actual: val.actual, budgeted: val.budgeted, status: 'exceeded' });
        } else if (ratio >= 0.85) {
          list.push({ category: name, actual: val.actual, budgeted: val.budgeted, status: 'approaching' });
        }
      }
    });

    return list;
  }, [categorySummary]);

  return (
    <div className="space-y-6">
      {/* 4 Core Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Budget */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500">งบประมาณโครงการ</span>
            <div className="text-2xl font-bold text-slate-800">
              {project.totalBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-slate-400">วงเงินงบประมาณที่อนุมัติ</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <HardHat size={24} />
          </div>
        </div>

        {/* Total Income */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500">เบิกงวดงานสะสม</span>
            <div className="text-2xl font-bold text-emerald-600">
              {stats.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-emerald-500/80">รายรับจากนายจ้างทั้งหมด</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500">ค่าใช้จ่ายจริงสะสม</span>
            <div className="text-2xl font-bold text-rose-600">
              {stats.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-rose-500/80">
              {(project.totalBudget > 0 ? (stats.totalExpense / project.totalBudget * 100).toFixed(1) : 0)}% ของโครงการ
            </p>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
            <TrendingDown size={24} />
          </div>
        </div>

        {/* Cash balance or remaining budget */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500">กระแสเงินสดสำรอง (คงเหลือ)</span>
            <div className={`text-2xl font-bold ${stats.currentBalance >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
              {stats.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-slate-400">เงินสดคงเหลือ ณ ไซงาน</p>
          </div>
          <div className={`p-3 rounded-xl ${stats.currentBalance >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
            <Wallet size={24} />
          </div>
        </div>
      </div>

      {/* Warnings & Alerts */}
      {warnings.length > 0 && (
        <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl space-y-2.5">
          <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
            <CircleAlert size={18} />
            <span>การแจ้งเตือนงบประมาณควบคุมรายหมวดหมู่</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {warnings.map((warn, index) => (
              <div
                key={index}
                className={`p-2.5 rounded-xl border flex justify-between items-center ${
                  warn.status === 'exceeded'
                    ? 'bg-rose-50/50 border-rose-150 text-rose-800'
                    : 'bg-amber-50/80 border-amber-150 text-amber-800'
                }`}
              >
                <div>
                  <span className="font-semibold block">{warn.category}</span>
                  <span>
                    จ่ายแล้ว {warn.actual.toLocaleString()} จากงบ {warn.budgeted.toLocaleString()} บาท
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                  warn.status === 'exceeded' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {warn.status === 'exceeded' ? 'เกินงบแล้ว!' : 'ใกล้เต็มวงเงิน (85%+)'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Monthly Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Activity size={16} className="text-amber-500" />
                <span>กราฟสรุปยอดรวมรายรับ-รายจ่าย รายเดือน</span>
              </h4>
              <p className="text-xs text-slate-400">เปรียบเทียบเบิกจ่ายงวดงานและต้นทุนค่าวัสดุรายเดือน</p>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <CalendarDays size={12} />
              <span>อัปเดตเรียลไทม์จากชีต</span>
            </div>
          </div>

          <div className="h-64 w-full">
            {monthlyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value: any) => [`${Number(value).toLocaleString()} บาท`]}
                    contentStyle={{ borderRadius: '12px', borderColor: '#f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" fontSize={12} />
                  <Bar dataKey="income" name="รายรับ (เบิกงวด)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="expense" name="รายจ่าย (ต้นทุน)" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col justify-center items-center text-slate-400 text-sm py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <p>ยังไม่มีประวัติรายรับรายจ่ายในระบบ</p>
                <p className="text-xs text-slate-400 mt-1">เพิ่มข้อมูลค่าใช้จ่ายโครงการเพื่อแสดงแนวโน้มทางบัญชี</p>
              </div>
            )}
          </div>
        </div>

        {/* Material Pie Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Award size={16} className="text-slate-500" />
              <span>สัดส่วนค่าใช้จ่ายจริง</span>
            </h4>
            <p className="text-xs text-slate-400">สัดส่วนวัสดุและค่าแรงแยกประเภท</p>
          </div>

          <div className="h-64 w-full flex flex-col justify-center items-center relative">
            {pieChartData.length > 0 ? (
              <>
                <div className="w-full h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`${Number(value).toLocaleString()} บาท`]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* List Legend in small font */}
                <div className="w-full max-h-20 overflow-y-auto text-[10px] space-y-1 scrollbar-thin px-2 mt-2">
                  {pieChartData.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="truncate max-w-[130px]">{item.name}</span>
                      </div>
                      <span className="font-semibold text-slate-700 font-mono">
                        {item.value.toLocaleString()} ({((item.value / stats.totalExpense) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full w-full flex flex-col justify-center items-center text-slate-400 text-sm py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <p className="text-center px-4">ไม่มีสัดส่วนค่าวัสดุ</p>
                <p className="text-[10px] text-center px-4 text-slate-400 mt-1">รายจ่ายที่บันทึกจะแสดงแบบแยกประเภทสีทันที</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Categories Budget Progress Tracking */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-800">สรุปความคืบหน้างบประมาณวัสดุ (Budget Utilization)</h4>
          <p className="text-xs text-slate-400">เปรียบเทียบเงินที่จ่ายจริงไปแล้วกับวงเงินของโครงการที่ตั้งไว้</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
          {(Object.entries(categorySummary) as [string, { budgeted: number; actual: number; color: string; percent: number }][]).map(([name, item]) => {
            const hasExceeded = item.actual > item.budgeted && item.budgeted > 0;
            const utilizationPercent = item.budgeted > 0 ? (item.actual / item.budgeted) * 100 : 0;
            return (
              <div key={name} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-700">{name}</span>
                  <span className={`font-mono font-semibold ${hasExceeded ? 'text-rose-600' : 'text-slate-600'}`}>
                    {item.actual.toLocaleString()} / {item.budgeted > 0 ? item.budgeted.toLocaleString() : 'ไม่มีงบ'} บาท
                  </span>
                </div>
                {/* Bar */}
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(utilizationPercent, 100)}%`,
                      backgroundColor: hasExceeded ? '#f43f5e' : item.color,
                    }}
                  />
                </div>
                {/* Label text */}
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>
                    {item.budgeted > 0 ? `${utilizationPercent.toFixed(1)}% ที่ใช้ไป` : 'ค่าใช้จ่ายนอกวงเงินที่ตั้ง'}
                  </span>
                  {hasExceeded && <span className="text-rose-500 font-bold">เกินงบแล้ว!</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
