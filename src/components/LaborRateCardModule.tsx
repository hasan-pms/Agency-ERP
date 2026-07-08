import React, { useState } from 'react';
import { LaborRate } from '../types';
import { Plus, Trash2, Edit2, Check, X, Search, Clock } from 'lucide-react';

interface LaborRateCardModuleProps {
  laborRates: LaborRate[];
  onUpdateLaborRates: (rates: LaborRate[]) => void;
  currency: string;
}

export default function LaborRateCardModule({
  laborRates,
  onUpdateLaborRates,
  currency
}: LaborRateCardModuleProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  // Form states
  const [isEditingId, setIsEditingId] = useState<string | null>(null);
  const [editDept, setEditDept] = useState('');
  const [editDesig, setEditDesig] = useState('');
  const [editRate, setEditRate] = useState('');

  const [newDept, setNewDept] = useState('Planning Department');
  const [isAddingNewDept, setIsAddingNewDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDesig, setNewDesig] = useState('');
  const [newRate, setNewRate] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [newDeptInput, setNewDeptInput] = useState('');

  const [sessionDepts, setSessionDepts] = useState<string[]>(() => {
    const saved = localStorage.getItem('erp_custom_departments');
    return saved ? JSON.parse(saved) : [];
  });

  const DEFAULT_DEPARTMENTS = [
    'Planning Department',
    'Account Management',
    'Content Development (Art Department)',
    'Content Development (Copy Department)'
  ];

  const allDepts = Array.from(new Set([
    ...DEFAULT_DEPARTMENTS,
    ...laborRates.map(r => r.department),
    ...sessionDepts
  ])).filter(Boolean);

  const departments = allDepts;

  const filteredRates = laborRates.filter(rate => {
    const matchesSearch = rate.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          rate.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'ALL' || rate.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesig || !newRate) return;

    const deptName = isAddingNewDept ? newDeptName.trim() : newDept;
    if (!deptName) return;

    const newEntry: LaborRate = {
      id: `rate-gen-${Date.now()}`,
      department: deptName,
      designation: newDesig,
      hourlyRate: Number(newRate)
    };

    onUpdateLaborRates([...laborRates, newEntry]);

    if (isAddingNewDept && !sessionDepts.includes(deptName)) {
      const updatedDepts = [...sessionDepts, deptName];
      setSessionDepts(updatedDepts);
      localStorage.setItem('erp_custom_departments', JSON.stringify(updatedDepts));
    }

    setNewDesig('');
    setNewRate('');
    setNewDeptName('');
    setIsAddingNewDept(false);
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    onUpdateLaborRates(laborRates.filter(r => r.id !== id));
  };

  const startEdit = (rate: LaborRate) => {
    setIsEditingId(rate.id);
    setEditDept(rate.department);
    setEditDesig(rate.designation);
    setEditRate(String(rate.hourlyRate));
  };

  const cancelEdit = () => {
    setIsEditingId(null);
  };

  const handleSaveEdit = (id: string) => {
    if (!editDesig || !editRate || !editDept) return;
    onUpdateLaborRates(laborRates.map(r => r.id === id ? {
      ...r,
      department: editDept,
      designation: editDesig,
      hourlyRate: Number(editRate)
    } : r));
    setIsEditingId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Header banner */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-indigo-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] text-zinc-300 font-mono uppercase font-semibold">Costing Rate Cards</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1">Direct Labor Rate Card Settings</h1>
          <p className="text-xs text-zinc-300/80 mt-1">
            Define designation-wise hourly cost rates. These values are automatically fetched during Direct Labor estimate compilation.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setShowDeptForm(!showDeptForm);
              setShowAddForm(false);
            }}
            className="bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md cursor-pointer border border-slate-700"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            Add New Department
          </button>
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setShowDeptForm(false);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            {showAddForm ? 'Cancel New Designation' : 'Add Rate Designation'}
          </button>
        </div>
      </div>

      {/* Quick Add Department Category Form */}
      {showDeptForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs animate-fadeIn space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Create New Department Category</h3>
            <button
              type="button"
              onClick={() => setShowDeptForm(false)}
              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Enter new department name (e.g. Media Planning & Buying)"
                value={newDeptInput}
                onChange={(e) => setNewDeptInput(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (!newDeptInput.trim()) return;
                const trimmed = newDeptInput.trim();
                if (allDepts.includes(trimmed)) {
                  alert("This department already exists!");
                  return;
                }
                const updated = [...sessionDepts, trimmed];
                setSessionDepts(updated);
                localStorage.setItem('erp_custom_departments', JSON.stringify(updated));
                setNewDeptInput('');
                setShowDeptForm(false);
                setNewDept(trimmed);
                setIsAddingNewDept(false);
                setShowAddForm(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Create & Setup Rate
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Once created, the new department will instantly be available for direct labor designation mapping and category filtering.
          </p>
        </div>
      )}

      {/* Add rate form */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs animate-fadeIn space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Configure New Rate Designation</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Department</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNewDept(!isAddingNewDept);
                    if (!isAddingNewDept) {
                      setNewDeptName('');
                    }
                  }}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold uppercase tracking-wider cursor-pointer"
                >
                  {isAddingNewDept ? 'Select Existing' : '+ New Dept'}
                </button>
              </div>

              {isAddingNewDept ? (
                <input
                  type="text"
                  required
                  placeholder="e.g. Media Buying Dept"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-medium animate-fadeIn"
                />
              ) : (
                <select
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                >
                  {allDepts.map((d, di) => (
                    <option key={di} value={d}>{d}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Designation / Role Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Lead Animator"
                value={newDesig}
                onChange={(e) => setNewDesig(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Hourly Cost Rate ({currency})</label>
              <input
                type="number"
                required
                min={1}
                placeholder="e.g. 750"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-semibold"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
            >
              Save New Designation Rate
            </button>
          </div>
        </form>
      )}

      {/* Filter and Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Controls */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search designation or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Departments</option>
              {departments.map((dept, i) => (
                <option key={i} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Rates Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/55 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4 w-1/3">Department</th>
                <th className="p-4 w-1/3">Designation / Role</th>
                <th className="p-4 w-1/4 text-right">Hourly rate ({currency})</th>
                <th className="p-4 w-24 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredRates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400 font-medium italic">
                    No designation rate entries found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRates.map((rate) => {
                  const isEditing = isEditingId === rate.id;
                  return (
                    <tr key={rate.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Department column */}
                      <td className="p-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editDept}
                            onChange={(e) => setEditDept(e.target.value)}
                            className="w-full p-1 border border-slate-200 rounded text-xs"
                          />
                        ) : (
                          <span className="px-2 py-1 bg-slate-100 border text-slate-600 rounded-md text-[10px] font-mono tracking-wide font-semibold">
                            {rate.department}
                          </span>
                        )}
                      </td>

                      {/* Designation column */}
                      <td className="p-4 text-slate-900 font-semibold">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editDesig}
                            onChange={(e) => setEditDesig(e.target.value)}
                            className="w-full p-1 border border-slate-200 rounded text-xs"
                          />
                        ) : (
                          rate.designation
                        )}
                      </td>

                      {/* Hourly rate column */}
                      <td className="p-4 text-right font-bold text-slate-900">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editRate}
                            onChange={(e) => setEditRate(e.target.value)}
                            className="w-20 p-1 border border-slate-200 rounded text-xs text-right"
                          />
                        ) : (
                          `${currency} ${rate.hourlyRate.toLocaleString()}/hr`
                        )}
                      </td>

                      {/* Actions column */}
                      <td className="p-4 text-center">
                        {isEditing ? (
                          <div className="flex justify-center items-center gap-1.5">
                            <button
                              onClick={() => handleSaveEdit(rate.id)}
                              className="p-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded border border-emerald-100 cursor-pointer"
                              title="Save changes"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer"
                              title="Cancel editing"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-center items-center gap-1.5">
                            <button
                              onClick={() => startEdit(rate)}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all cursor-pointer"
                              title="Edit rate"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(rate.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                              title="Delete rate designation"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
