/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Project, Company } from '../types';
import { Briefcase, Calendar, DollarSign, TrendingUp, AlertTriangle, Search, SlidersHorizontal, X } from 'lucide-react';

interface ProjectTrackerProps {
  projects: Project[];
  estimates?: any[];
  invoices?: any[];
  workOrders?: any[];
  bills?: any[];
  payments?: any[];
  onCreateProject: (project: Omit<Project, 'id' | 'companyId' | 'costIncurred' | 'revenueRecognized'>) => void;
  canCreate: boolean;
  company: Company;
}

export default function ProjectTracker({ 
  projects, 
  estimates = [], 
  invoices = [], 
  workOrders = [], 
  bills = [], 
  payments = [], 
  onCreateProject, 
  canCreate, 
  company 
}: ProjectTrackerProps) {
  const [showNewModal, setShowNewModal] = useState(false);
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [budget, setBudget] = useState(100000);
  const [startDate, setStartDate] = useState('2026-07-01');
  const [endDate, setEndDate] = useState('2026-12-31');

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !clientName) return;
    onCreateProject({
      name,
      clientName,
      budget: Number(budget),
      startDate,
      endDate
    });
    setName('');
    setClientName('');
    setBudget(100000);
    setShowNewModal(false);
  };

  const filteredProjects = projects.filter(proj => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term || 
      proj.name.toLowerCase().includes(term) || 
      proj.clientName.toLowerCase().includes(term) ||
      proj.id.toLowerCase().includes(term);
    const matchesMinBudget = !minBudget || proj.budget >= Number(minBudget);
    const matchesMaxBudget = !maxBudget || proj.budget <= Number(maxBudget);
    return matchesSearch && matchesMinBudget && matchesMaxBudget;
  });

  const activeFiltersCount = (minBudget ? 1 : 0) + (maxBudget ? 1 : 0);

  return (
    <div id="project-tracker-module" className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 font-sans tracking-tight">Active Projects</h2>
          <p className="text-sm text-zinc-500 mt-1">Real-time cost tracking, budget management, and revenue mapping</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm cursor-pointer"
          >
            Create Project
          </button>
        )}
      </div>

      {/* Elegant Search & Filter Bar */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by project name, client name, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 placeholder:text-zinc-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 hover:text-zinc-600 text-zinc-400 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-all cursor-pointer ${
              showFilters || activeFiltersCount > 0
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-xs'
                : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Expandable Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-zinc-100 animate-fadeIn">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Min Budget ({company.currency || 'BDT'})</label>
              <input
                type="number"
                placeholder="No min limit"
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Max Budget ({company.currency || 'BDT'})</label>
              <input
                type="number"
                placeholder="No max limit"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

        {(searchTerm || activeFiltersCount > 0) && (
          <div className="flex justify-between items-center text-xs text-zinc-500 pt-1">
            <span>Found <strong>{filteredProjects.length}</strong> matching projects</span>
            <button
              onClick={() => {
                setSearchTerm('');
                setMinBudget('');
                setMaxBudget('');
              }}
              className="text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {filteredProjects.length === 0 ? (
        <div className="p-12 text-center bg-white border border-zinc-200 rounded-xl text-zinc-500 text-sm">
          No projects match your current search/filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {filteredProjects.map((proj) => {
          // Dynamic Sales Receive calculation
          const assignedItems = estimates.flatMap(e => e.lineItems || []).filter(item => item.projectId === proj.id);
          const assignedItemIds = assignedItems.map(item => item.id);

          let salesReceive = 0;
          invoices.forEach(inv => {
            let projectLineItemsSubtotal = 0;
            const hasLineItemReferences = inv.lineItems?.some((li: any) => li.sourceLineItemId && assignedItemIds.includes(li.sourceLineItemId));
            
            if (hasLineItemReferences) {
              inv.lineItems.forEach((li: any) => {
                if (li.sourceLineItemId && assignedItemIds.includes(li.sourceLineItemId)) {
                  projectLineItemsSubtotal += li.amount;
                }
              });
              
              if (inv.subTotal > 0) {
                const ratio = projectLineItemsSubtotal / inv.subTotal;
                salesReceive += projectLineItemsSubtotal + (inv.taxAmount + inv.vatAmount + (inv.paymentAdjustments?.otherCharges || 0)) * ratio;
              } else {
                salesReceive += projectLineItemsSubtotal;
              }
            } else {
              const hasAnyEstimateWithProj = inv.estimateIds?.some((estId: any) => {
                const est = estimates.find(e => e.id === estId);
                return est && est.projectId === proj.id;
              });
              if (hasAnyEstimateWithProj) {
                salesReceive += inv.totalAmount;
              }
            }
          });

          if (salesReceive === 0) {
            salesReceive = proj.revenueRecognized || 0;
          }

          // Dynamic Cost Incurred calculation
          const projectWorkOrders = workOrders.filter(wo => wo.projectId === proj.id);
          const projectBills = bills.filter(b => projectWorkOrders.some(wo => wo.id === b.workOrderId));
          let totalCost = projectBills.reduce((sum, b) => sum + b.amount, 0);

          if (totalCost === 0) {
            totalCost = proj.costIncurred || 0;
          }

          // Dynamic Payment Made calculation
          const paidPayments = payments.filter(p => p.status === 'PAID');
          const totalPayments = paidPayments.reduce((sum, p) => {
            if (p.vendorBillId && projectBills.some(b => b.id === p.vendorBillId)) {
              return sum + p.amount;
            }
            return sum;
          }, 0);

          const budgetPercent = Math.min(Math.round((totalCost / proj.budget) * 100), 100);
          const isOverBudget = totalCost > proj.budget;
          const currentMargin = salesReceive > 0 ? ((salesReceive - totalCost) / salesReceive) * 100 : 0;

          return (
            <div key={proj.id} className="bg-white border border-zinc-200 rounded-xl p-5 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-100">
                    <Briefcase className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span className={`text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${
                    isOverBudget ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  }`}>
                    {isOverBudget ? 'Budget Warning' : 'Within Budget'}
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="text-base font-semibold text-zinc-900 tracking-tight">{proj.name}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5 font-medium">Client: {proj.clientName}</p>
                </div>

                <div className="grid grid-cols-2 gap-3.5 my-4 bg-zinc-50 p-3.5 rounded-xl border border-zinc-100 text-xs">
                  <div>
                    <span className="text-zinc-400 font-medium block">Total Budget:</span>
                    <span className="font-bold text-zinc-900">{company.currency || 'BDT'} {proj.budget.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-medium block">Sales Received:</span>
                    <span className="font-bold text-indigo-600">{company.currency || 'BDT'} {salesReceive.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-medium block">Cost Incurred:</span>
                    <span className={`font-bold ${isOverBudget ? 'text-rose-600' : 'text-zinc-900'}`}>
                      {company.currency || 'BDT'} {totalCost.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-medium block">Payments Made:</span>
                    <span className="font-bold text-amber-600">{company.currency || 'BDT'} {totalPayments.toLocaleString()}</span>
                  </div>
                  <div className="col-span-2 border-t border-zinc-200/60 pt-2 flex justify-between items-center">
                    <span className="text-zinc-400 font-medium">Net Profit Margin:</span>
                    <span className={`font-black ${currentMargin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {currentMargin.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-zinc-400">Budget Depleted</span>
                    <span className={isOverBudget ? 'text-rose-600 font-bold' : 'text-zinc-700 font-semibold'}>{budgetPercent}%</span>
                  </div>
                  <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-rose-500' : 'bg-indigo-600'}`}
                      style={{ width: `${budgetPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-100 pt-3 mt-1 flex justify-between items-center text-[11px] text-zinc-400 font-medium">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Starts {proj.startDate}</span>
                </div>
                <span>Ends {proj.endDate}</span>
              </div>
            </div>
          );
        })}
      </div>
    )}

      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
            <div className="px-5 py-4 bg-zinc-50 border-b border-zinc-100 flex justify-between items-center">
              <h3 className="font-semibold text-zinc-900">Create New Project</h3>
              <button onClick={() => setShowNewModal(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer text-lg font-medium">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Skyline Office Expansion"
                  className="w-full p-2 border border-zinc-300 rounded-lg text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Client Business Name</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Skyline Assets Group"
                  className="w-full p-2 border border-zinc-300 rounded-lg text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Assigned Budget ({company.currency || 'BDT'})</label>
                <input
                  type="number"
                  required
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full p-2 border border-zinc-300 rounded-lg text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 border border-zinc-300 rounded-lg text-sm focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Estimated End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 border border-zinc-300 rounded-lg text-sm focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3 py-1.5 border border-zinc-300 hover:bg-zinc-50 rounded-lg text-xs text-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
