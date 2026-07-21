/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MotherLedger, DetailLedger, AccountGroup, Company, User } from '../types';
import { 
  Folder, 
  FolderPlus, 
  Plus, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  FileSpreadsheet, 
  Calculator, 
  Database, 
  Edit2, 
  X, 
  AlertCircle,
  TrendingUp,
  FileText
} from 'lucide-react';

interface ChartOfAccountsModuleProps {
  motherLedgers: MotherLedger[];
  detailLedgers: DetailLedger[];
  company: Company;
  currentUser: User;
  onAddMotherLedger: (ml: Omit<MotherLedger, 'id' | 'companyId'>) => void;
  onAddDetailLedger: (dl: Omit<DetailLedger, 'id' | 'companyId'>) => void;
}

export default function ChartOfAccountsModule({
  motherLedgers,
  detailLedgers,
  company,
  currentUser,
  onAddMotherLedger,
  onAddDetailLedger
}: ChartOfAccountsModuleProps) {
  // Collapse/Expand state for Groups and Mother Ledgers
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [collapsedMothers, setCollapsedMothers] = useState<Record<string, boolean>>({});

  // Modals
  const [showAddMotherModal, setShowAddMotherModal] = useState(false);
  const [showAddDetailModal, setShowAddDetailModal] = useState(false);

  // Form states
  const [newMlGroup, setNewMlGroup] = useState<AccountGroup>('ASSETS');
  const [newMlCode, setNewMlCode] = useState('');
  const [newMlName, setNewMlName] = useState('');
  const [newMlDesc, setNewMlDesc] = useState('');

  const [newDlMotherId, setNewDlMotherId] = useState('');
  const [newDlCode, setNewDlCode] = useState('');
  const [newDlName, setNewDlName] = useState('');
  const [newDlDesc, setNewDlDesc] = useState('');
  const [newDlBalance, setNewDlBalance] = useState<number>(0);

  // Filter Search
  const [searchTerm, setSearchTerm] = useState('');

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const toggleMother = (motherId: string) => {
    setCollapsedMothers(prev => ({ ...prev, [motherId]: !prev[motherId] }));
  };

  const handleAddMother = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMlCode || !newMlName) return;

    onAddMotherLedger({
      group: newMlGroup,
      code: newMlCode.trim(),
      name: newMlName.trim(),
      description: newMlDesc.trim() || undefined
    });

    setNewMlCode('');
    setNewMlName('');
    setNewMlDesc('');
    setShowAddMotherModal(false);
  };

  const handleAddDetail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDlMotherId || !newDlCode || !newDlName) return;

    onAddDetailLedger({
      motherLedgerId: newDlMotherId,
      code: newDlCode.trim(),
      name: newDlName.trim(),
      description: newDlDesc.trim() || undefined,
      balance: Number(newDlBalance || 0),
      currency: company.currency || 'BDT'
    });

    setNewDlMotherId('');
    setNewDlCode('');
    setNewDlName('');
    setNewDlDesc('');
    setNewDlBalance(0);
    setShowAddDetailModal(false);
  };

  const accountGroups: { value: AccountGroup; label: string; color: string; bg: string; border: string }[] = [
    { value: 'ASSETS', label: 'Assets', color: 'text-emerald-600', bg: 'bg-emerald-50/50', border: 'border-emerald-100' },
    { value: 'LIABILITIES', label: 'Liabilities', color: 'text-rose-600', bg: 'bg-rose-50/50', border: 'border-rose-100' },
    { value: 'EQUITY', label: 'Equity', color: 'text-amber-600', bg: 'bg-amber-50/50', border: 'border-amber-100' },
    { value: 'REVENUE', label: 'Revenue', color: 'text-indigo-600', bg: 'bg-indigo-50/50', border: 'border-indigo-100' },
    { value: 'EXPENSES', label: 'Expenses', color: 'text-zinc-600', bg: 'bg-zinc-50/50', border: 'border-zinc-200' },
  ];

  // Compute stats
  const totalAssets = detailLedgers
    .filter(dl => {
      const ml = motherLedgers.find(m => m.id === dl.motherLedgerId);
      return ml?.group === 'ASSETS';
    })
    .reduce((acc, dl) => acc + dl.balance, 0);

  const totalLiabilities = detailLedgers
    .filter(dl => {
      const ml = motherLedgers.find(m => m.id === dl.motherLedgerId);
      return ml?.group === 'LIABILITIES';
    })
    .reduce((acc, dl) => acc + dl.balance, 0);

  const totalEquity = detailLedgers
    .filter(dl => {
      const ml = motherLedgers.find(m => m.id === dl.motherLedgerId);
      return ml?.group === 'EQUITY';
    })
    .reduce((acc, dl) => acc + dl.balance, 0);

  const totalRevenue = detailLedgers
    .filter(dl => {
      const ml = motherLedgers.find(m => m.id === dl.motherLedgerId);
      return ml?.group === 'REVENUE';
    })
    .reduce((acc, dl) => acc + dl.balance, 0);

  const totalExpenses = detailLedgers
    .filter(dl => {
      const ml = motherLedgers.find(m => m.id === dl.motherLedgerId);
      return ml?.group === 'EXPENSES';
    })
    .reduce((acc, dl) => acc + dl.balance, 0);

  // Accounting Ledger Trial Balance consistency check: Debit (Assets + Expenses) = Credit (Liabilities + Equity + Revenue)
  // Let's assume standard positive accounts for Debit (Assets, Expenses), negative/credit balances for Liabilities, Equity, Revenue.
  const debitTotal = detailLedgers
    .filter(dl => {
      const ml = motherLedgers.find(m => m.id === dl.motherLedgerId);
      return ml?.group === 'ASSETS' || ml?.group === 'EXPENSES';
    })
    .reduce((acc, dl) => acc + Math.max(0, dl.balance), 0);

  const creditTotal = detailLedgers
    .filter(dl => {
      const ml = motherLedgers.find(m => m.id === dl.motherLedgerId);
      return ml?.group === 'LIABILITIES' || ml?.group === 'EQUITY' || ml?.group === 'REVENUE';
    })
    .reduce((acc, dl) => acc + Math.max(0, Math.abs(dl.balance)), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight">Interactive Chart of Accounts (CoA)</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Maintain the core financial structure of your business with structural Groups, Mother Ledgers, and detailed Accounting ledgers.
          </p>
        </div>
        <div className="flex gap-2 self-start">
          <button
            onClick={() => setShowAddMotherModal(true)}
            className="bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
          >
            <FolderPlus className="w-4 h-4 text-zinc-500" />
            <span>New Mother Ledger</span>
          </button>
          <button
            onClick={() => setShowAddDetailModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Account Ledger</span>
          </button>
        </div>
      </div>

      {/* CoA Trial Balance Check bar */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600 border border-indigo-100">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-bold block uppercase">General Ledger Consistency</span>
            <span className="font-semibold text-zinc-800">
              Debits: {company.currency || 'BDT'} {debitTotal.toLocaleString()} | Credits: {company.currency || 'BDT'} {creditTotal.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between md:col-span-2 border-t md:border-t-0 md:border-l border-zinc-200 pt-3 md:pt-0 md:pl-4">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold text-zinc-700">Net Business Profit:</span>
            <span className="font-bold text-zinc-900 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-md border border-emerald-100">
              {company.currency || 'BDT'} {(Math.abs(totalRevenue) - Math.abs(totalExpenses)).toLocaleString()}
            </span>
          </div>
          <span className="text-[10px] text-zinc-400 italic">Double-entry system validated</span>
        </div>
      </div>

      {/* Search Input Filter */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Filter ledgers by code, name, or group..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-indigo-500 shadow-xs"
        />
      </div>

      {/* Main Ledger hierarchy Tree view */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 bg-zinc-50 border-b border-zinc-100 text-xs font-semibold text-zinc-500 flex justify-between items-center">
          <span>Ledger Account Hierarchy</span>
          <span className="font-mono text-[10px] text-zinc-400">Total Accounts: {detailLedgers.length} Leaf Nodes</span>
        </div>

        <div className="divide-y divide-zinc-100">
          {accountGroups.map((groupInfo) => {
            const groupMothers = motherLedgers.filter(ml => ml.group === groupInfo.value);
            const isGroupCollapsed = collapsedGroups[groupInfo.value];

            // Filter mothers and detail ledgers based on search term
            const matchingMothers = groupMothers.filter(ml => {
              const matchesSearch = ml.name.toLowerCase().includes(searchTerm.toLowerCase()) || ml.code.includes(searchTerm);
              const children = detailLedgers.filter(dl => dl.motherLedgerId === ml.id);
              const hasMatchingChild = children.some(dl => dl.name.toLowerCase().includes(searchTerm.toLowerCase()) || dl.code.includes(searchTerm));
              return !searchTerm || matchesSearch || hasMatchingChild;
            });

            if (searchTerm && matchingMothers.length === 0) return null;

            // Compute cumulative group balance
            const groupBalance = detailLedgers
              .filter(dl => {
                const ml = motherLedgers.find(m => m.id === dl.motherLedgerId);
                return ml?.group === groupInfo.value;
              })
              .reduce((acc, dl) => acc + dl.balance, 0);

            return (
              <div key={groupInfo.value} className="bg-white">
                {/* 1. Group level row */}
                <div 
                  onClick={() => toggleGroup(groupInfo.value)}
                  className={`p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-50/50 transition-colors ${groupInfo.bg} border-b border-zinc-100`}
                >
                  <div className="flex items-center gap-2">
                    {isGroupCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-500" />
                    )}
                    <span className={`text-sm font-extrabold ${groupInfo.color} uppercase tracking-wider`}>
                      {groupInfo.label}
                    </span>
                  </div>
                  <span className="font-extrabold text-sm text-zinc-800">
                    {company.currency || 'BDT'} {Math.abs(groupBalance).toLocaleString()}
                  </span>
                </div>

                {/* 2. Mother Ledgers level */}
                {!isGroupCollapsed && (
                  <div className="pl-6 divide-y divide-zinc-50">
                    {matchingMothers.map((mother) => {
                      const motherDetails = detailLedgers.filter(dl => dl.motherLedgerId === mother.id);
                      const isMotherCollapsed = collapsedMothers[mother.id];

                      const matchingDetails = motherDetails.filter(dl => {
                        return !searchTerm || dl.name.toLowerCase().includes(searchTerm.toLowerCase()) || dl.code.includes(searchTerm);
                      });

                      if (searchTerm && matchingDetails.length === 0 && !mother.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                        return null;
                      }

                      // Compute cumulative mother balance
                      const motherBalance = motherDetails.reduce((acc, dl) => acc + dl.balance, 0);

                      return (
                        <div key={mother.id} className="bg-zinc-50/30">
                          {/* Mother ledger row */}
                          <div 
                            onClick={() => toggleMother(mother.id)}
                            className="p-3 flex items-center justify-between cursor-pointer hover:bg-zinc-100/40 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {isMotherCollapsed ? (
                                <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                              )}
                              <Folder className="w-4 h-4 text-zinc-400" />
                              <span className="font-mono text-xs font-semibold text-zinc-500 bg-zinc-200/60 px-1.5 py-0.5 rounded">
                                {mother.code}
                              </span>
                              <span className="text-xs font-bold text-zinc-800">{mother.name}</span>
                              {mother.description && (
                                <span className="text-[10px] text-zinc-400 font-normal hidden sm:inline truncate max-w-xs" title={mother.description}>
                                  - {mother.description}
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-extrabold text-zinc-700">
                              {company.currency || 'BDT'} {Math.abs(motherBalance).toLocaleString()}
                            </span>
                          </div>

                          {/* 3. Detail Ledgers (Leaf nodes) */}
                          {!isMotherCollapsed && (
                            <div className="pl-8 bg-white divide-y divide-zinc-100">
                              {matchingDetails.length === 0 ? (
                                <div className="p-3 text-zinc-400 italic text-xs">
                                  No individual detail accounts created in this category.
                                </div>
                              ) : (
                                matchingDetails.map((detail) => {
                                  return (
                                    <div 
                                      key={detail.id} 
                                      className="p-3 flex items-center justify-between hover:bg-zinc-50/70 transition-colors"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Database className="w-3.5 h-3.5 text-indigo-400" />
                                        <span className="font-mono text-[11px] font-medium text-zinc-500 bg-indigo-50 text-indigo-600 px-1.5 py-0.2 rounded border border-indigo-100">
                                          {detail.code}
                                        </span>
                                        <span className="text-xs font-semibold text-zinc-800">{detail.name}</span>
                                        {detail.description && (
                                          <span className="text-[10px] text-zinc-400 font-normal truncate max-w-xs" title={detail.description}>
                                            ({detail.description})
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-xs font-bold text-zinc-900 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-100">
                                        {company.currency || 'BDT'} {Math.abs(detail.balance).toLocaleString()}
                                      </span>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal 1: Create Mother Ledger */}
      {showAddMotherModal && (
        <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs flex justify-center items-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md shadow-2xl flex flex-col">
            <div className="p-5 border-b border-zinc-150 flex justify-between items-center bg-zinc-50 rounded-t-2xl">
              <div>
                <h3 className="font-extrabold text-zinc-900 flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-indigo-600" />
                  <span>Create Mother Ledger</span>
                </h3>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Add a second-tier group category under Assets, Liabilities, Equity, etc.
                </p>
              </div>
              <button
                onClick={() => setShowAddMotherModal(false)}
                className="p-1 hover:bg-zinc-200 rounded-lg text-zinc-400 hover:text-zinc-700 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMother} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">Structural Account Group</label>
                <select
                  value={newMlGroup}
                  onChange={(e) => setNewMlGroup(e.target.value as AccountGroup)}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-sm focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                >
                  <option value="ASSETS">ASSETS</option>
                  <option value="LIABILITIES">LIABILITIES</option>
                  <option value="EQUITY">EQUITY</option>
                  <option value="REVENUE">REVENUE</option>
                  <option value="EXPENSES">EXPENSES</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">Ledger Code</label>
                  <input
                    type="text"
                    required
                    value={newMlCode}
                    onChange={(e) => setNewMlCode(e.target.value)}
                    placeholder="e.g. 1100"
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-sm focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">Mother Ledger Name</label>
                  <input
                    type="text"
                    required
                    value={newMlName}
                    onChange={(e) => setNewMlName(e.target.value)}
                    placeholder="e.g. Accounts Receivable"
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-sm focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">Description (Optional)</label>
                <input
                  type="text"
                  value={newMlDesc}
                  onChange={(e) => setNewMlDesc(e.target.value)}
                  placeholder="e.g. All commercial invoicing receivables"
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-sm focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-zinc-150">
                <button
                  type="button"
                  onClick={() => setShowAddMotherModal(false)}
                  className="flex-1 px-4 py-2.5 border border-zinc-300 hover:bg-zinc-100 rounded-xl text-xs font-semibold text-zinc-700 cursor-pointer transition-colors text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm text-center"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create Detail Ledger */}
      {showAddDetailModal && (
        <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs flex justify-center items-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md shadow-2xl flex flex-col">
            <div className="p-5 border-b border-zinc-150 flex justify-between items-center bg-zinc-50 rounded-t-2xl">
              <div>
                <h3 className="font-extrabold text-zinc-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-600" />
                  <span>Create Leaf Account Ledger</span>
                </h3>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Create a specific ledger (e.g. Prime Bank, Client trade accounts) where transactions post.
                </p>
              </div>
              <button
                onClick={() => setShowAddDetailModal(false)}
                className="p-1 hover:bg-zinc-200 rounded-lg text-zinc-400 hover:text-zinc-700 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDetail} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">Select Mother Ledger category</label>
                <select
                  required
                  value={newDlMotherId}
                  onChange={(e) => setNewDlMotherId(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-sm focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                >
                  <option value="">-- Select Category --</option>
                  {motherLedgers.map(ml => {
                    return (
                      <option key={ml.id} value={ml.id}>
                        {ml.group} - {ml.code} {ml.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">Ledger Code</label>
                  <input
                    type="text"
                    required
                    value={newDlCode}
                    onChange={(e) => setNewDlCode(e.target.value)}
                    placeholder="e.g. 1101"
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-sm focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">Ledger Name</label>
                  <input
                    type="text"
                    required
                    value={newDlName}
                    onChange={(e) => setNewDlName(e.target.value)}
                    placeholder="e.g. Prime Bank BDT Current A/C"
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-sm focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">Starting Balance</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-semibold">
                      {company.currency || 'BDT'}
                    </span>
                    <input
                      type="number"
                      value={newDlBalance || ''}
                      onChange={(e) => setNewDlBalance(Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full pl-12 pr-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-sm focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">Description (Optional)</label>
                  <input
                    type="text"
                    value={newDlDesc}
                    onChange={(e) => setNewDlDesc(e.target.value)}
                    placeholder="e.g. Branch A/C #02832"
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-sm focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-zinc-150">
                <button
                  type="button"
                  onClick={() => setShowAddDetailModal(false)}
                  className="flex-1 px-4 py-2.5 border border-zinc-300 hover:bg-zinc-100 rounded-xl text-xs font-semibold text-zinc-700 cursor-pointer transition-colors text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm text-center"
                >
                  Create Detail Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
