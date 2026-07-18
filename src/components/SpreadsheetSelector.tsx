/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Plus, Check, RefreshCw, ExternalLink, Link2, Search, Database, ArrowRight } from 'lucide-react';
import { listUserSpreadsheets, createSpreadsheet } from '../lib/sheets';
import { motion } from 'motion/react';

interface SpreadsheetSelectorProps {
  token: string;
  onSelectSpreadsheet: (id: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export default function SpreadsheetSelector({
  token,
  onSelectSpreadsheet,
  loading,
  setLoading,
}: SpreadsheetSelectorProps) {
  const [sheets, setSheets] = useState<Array<{ id: string; name: string; modifiedTime?: string }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customUrlOrId, setCustomUrlOrId] = useState('');
  const [newSheetName, setNewSheetName] = useState('ระบบบัญชีและงบประมาณไซงานก่อสร้าง');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isListing, setIsListing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // 1. Fetch user's spreadsheets from Google Drive
  const loadSpreadsheets = async () => {
    if (!token) return;
    setIsListing(true);
    setLocalError(null);
    try {
      const list = await listUserSpreadsheets(token);
      setSheets(list);
    } catch (err: any) {
      console.error('Error listing user sheets:', err);
      setLocalError('ไม่สามารถเข้าถึงไฟล์ใน Google Drive ของคุณได้ กรุณาตรวจสอบสิทธิ์การใช้งาน');
    } finally {
      setIsListing(false);
    }
  };

  useEffect(() => {
    loadSpreadsheets();
  }, [token]);

  // 2. Handle selecting from the list
  const handleSelect = (id: string) => {
    onSelectSpreadsheet(id);
  };

  // 3. Handle manual input ID or URL linking
  const handleLinkCustomSheet = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!customUrlOrId.trim()) return;

    let targetId = customUrlOrId.trim();
    // Support Google Sheet URL pattern: .../spreadsheets/d/[ID]/...
    if (targetId.includes('/spreadsheets/d/')) {
      const parts = targetId.split('/spreadsheets/d/');
      if (parts.length > 1) {
        targetId = parts[1].split('/')[0];
      }
    }

    if (targetId.length < 10) {
      setLocalError('รูปแบบ ID หรือ URL ของ Google Sheet ไม่ถูกต้อง');
      return;
    }

    onSelectSpreadsheet(targetId);
  };

  // 4. Handle creating a new spreadsheet
  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSheetName.trim()) return;

    setIsCreating(true);
    setLocalError(null);
    setLoading(true);
    try {
      const newId = await createSpreadsheet(token, newSheetName.trim());
      onSelectSpreadsheet(newId);
    } catch (err: any) {
      console.error('Create sheet error:', err);
      setLocalError('ไม่สามารถสร้างไฟล์สเปรดชีตใหม่ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsCreating(false);
      setLoading(false);
    }
  };

  // Filter spreadsheets based on query
  const filteredSheets = sheets.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 px-4 py-8">
      <div className="text-center space-y-2">
        <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-xs font-bold inline-flex items-center gap-1">
          <Database size={13} />
          <span>เชื่อมต่อและเลือกสเปรดชีตจัดเก็บข้อมูล</span>
        </span>
        <h1 className="text-2xl font-black text-slate-800 font-display">
          เลือกที่เก็บ Google Sheets ของคุณ
        </h1>
        <p className="text-xs text-slate-500 max-w-lg mx-auto">
          ระบบจะจัดเก็บทุกโครงการ งบประมาณ และสมุดรายรับรายจ่ายใน Google Sheets ของคุณโดยตรง เพื่อความปลอดภัยและเป็นส่วนตัวของข้อมูล 100%
        </p>
      </div>

      {localError && (
        <div className="p-4 bg-rose-50 border border-rose-150 text-rose-800 rounded-2xl text-xs font-semibold">
          {localError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Col: Existing spreadsheets search & list */}
        <div className="lg:col-span-7 bg-white p-5 border border-slate-100 rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                เลือกไฟล์เดิมที่มีอยู่แล้ว
              </h2>
              <p className="text-[11px] text-slate-400">ค้นหาไฟล์สเปรดชีตบน Google Drive ของคุณ</p>
            </div>
            <button
              onClick={loadSpreadsheets}
              disabled={isListing}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer disabled:opacity-40"
              title="รีเฟรชรายการ"
            >
              <RefreshCw size={14} className={isListing ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาตามชื่อไฟล์สเปรดชีต..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-amber-500 text-slate-800 bg-white"
            />
          </div>

          {/* List display */}
          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {isListing ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <span className="w-6 h-6 border-2 border-slate-200 border-t-amber-500 rounded-full animate-spin"></span>
                <span className="text-xs text-slate-400">กำลังสแกนหาไฟล์บน Google Drive ของคุณ...</span>
              </div>
            ) : filteredSheets.length > 0 ? (
              filteredSheets.map(sheet => (
                <div
                  key={sheet.id}
                  className="p-3 border border-slate-100 hover:border-amber-200 hover:bg-amber-50/10 rounded-2xl flex items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                      <FileSpreadsheet size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{sheet.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        แก้ไขล่าสุด: {sheet.modifiedTime ? new Date(sheet.modifiedTime).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'ไม่ระบุ'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelect(sheet.id)}
                    className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <span>เชื่อมต่อ</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              ))
            ) : (
              <div className="py-10 text-center space-y-2 border border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                <p className="text-xs text-slate-400">ไม่พบสเปรดชีตที่เข้ากันได้บน Google Drive</p>
                <p className="text-[10px] text-slate-400">คุณสามารถป้อน ID เองหรือคลิกสร้างใหม่ด้านขวา</p>
              </div>
            )}
          </div>

          {/* Paste URL directly */}
          <form onSubmit={handleLinkCustomSheet} className="pt-3 border-t border-slate-100 space-y-2">
            <label className="block text-xs font-bold text-slate-600">
              หรือระบุ Google Sheet URL / ID เองโดยตรง
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="เช่น https://docs.google.com/spreadsheets/d/..."
                value={customUrlOrId}
                onChange={e => setCustomUrlOrId(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-amber-500 bg-white text-slate-800"
              />
              <button
                type="submit"
                className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              >
                <Link2 size={13} />
                <span>เชื่อมโยง</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Col: Create New Spreadsheet */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white p-6 rounded-3xl shadow-md border border-slate-800 space-y-6">
          <div className="space-y-2">
            <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block">
              แนะนําสำหรับเริ่มต้นใหม่
            </span>
            <h2 className="text-base font-bold font-display flex items-center gap-1.5">
              <Plus size={18} className="text-amber-400" />
              <span>สร้างสเปรดชีตใหม่</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              ระบบจะตั้งโครงสร้างแผ่นงาน (_Config และแผ่นงานแต่ละโครงการ) ให้โดยอัตโนมัติ พร้อมสำหรับการใช้งานได้ทันทีบน Drive ของคุณ
            </p>
          </div>

          <form onSubmit={handleCreateNew} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                ตั้งชื่อไฟล์ Google Sheets ของคุณ
              </label>
              <input
                type="text"
                required
                value={newSheetName}
                onChange={e => setNewSheetName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 focus:border-amber-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isCreating || loading}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-900 font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55"
            >
              {isCreating ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
                  <span>กำลังสร้างไฟล์สเปรดชีตใหม่...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet size={14} />
                  <span>กดเพื่อสร้างชีตใหม่ทั้งหมด</span>
                </>
              )}
            </button>
          </form>

          <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-2xl text-[11px] text-slate-400 space-y-2 leading-relaxed">
            <p className="font-semibold text-slate-300">💡 ประโยชน์ของระบบคลาวด์ Google Sheets:</p>
            <p>- คุณเป็นเจ้าของข้อมูลเต็มตัว เปิดแก้ไขผ่านแอป Google Sheets หรือแชร์ให้เพื่อนร่วมงานดูได้ทุกเมื่อ</p>
            <p>- ข้อมูลจะไม่มีวันหาย แม้จะเปลี่ยนเครื่องคอมพิวเตอร์ หรือเคลียร์ประวัติเบราว์เซอร์</p>
          </div>
        </div>
      </div>
    </div>
  );
}
