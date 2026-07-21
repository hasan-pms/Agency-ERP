/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Collection, Invoice, User, Company, Client, Estimate } from '../types';
import { 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Plus, 
  Search, 
  SlidersHorizontal, 
  X, 
  FileText, 
  Calculator, 
  ShieldCheck, 
  AlertCircle, 
  Building,
  Info
} from 'lucide-react';

interface CollectionsModuleProps {
  collections: Collection[];
  invoices: Invoice[];
  clients: Client[];
  estimates: Estimate[];
  currentUser: User;
  company: Company;
  onCreateCollection: (collection: Omit<Collection, 'id' | 'companyId' | 'createdAt'>) => void;
  onUpdateCollectionStatus: (collectionId: string, status: Collection['status']) => void;
}

export default function CollectionsModule({
  collections,
  invoices,
  clients,
  estimates,
  currentUser,
  company,
  onCreateCollection,
  onUpdateCollectionStatus
}: CollectionsModuleProps) {
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [vdsDeduction, setVdsDeduction] = useState<number>(0);
  const [tdsDeduction, setTdsDeduction] = useState<number>(0);
  const [otherDeduction, setOtherDeduction] = useState<number>(0);
  const [otherDeductionReason, setOtherDeductionReason] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [referenceNo, setReferenceNo] = useState('');
  const [remarks, setRemarks] = useState('');

  // Consolidate clients list (including text-only client names from estimates, to be fully safe)
  const uniqueClientNamesFromEstimates = Array.from(
    new Set(estimates.map(e => e.clientName).filter((name): name is string => typeof name === 'string' && name.trim().length > 0))
  );
  
  const clientAccounts = [...clients];
  uniqueClientNamesFromEstimates.forEach(name => {
    if (!clientAccounts.some(c => c.name.trim().toLowerCase() === name.trim().toLowerCase())) {
      clientAccounts.push({
        id: `unregistered-${name.replace(/\s+/g, '-').toLowerCase()}`,
        companyId: company.id,
        name: name,
        address: '',
        isApproved: true
      });
    }
  });

  // Filter invoices that are not paid yet
  const receivableInvoices = invoices.filter(inv => inv.status !== 'PAID' && inv.status !== 'CANCELLED');

  // Find receivable invoices of the selected client
  const clientInvoices = selectedClientId ? receivableInvoices.filter(inv => {
    const selectedClientObj = clientAccounts.find(c => c.id === selectedClientId);
    if (!selectedClientObj) return false;
    
    // Find linked estimate to get clientName
    const linkedEst = estimates.find(e => inv.estimateIds.includes(e.id));
    return linkedEst && linkedEst.clientName?.trim().toLowerCase() === selectedClientObj.name.trim().toLowerCase();
  }) : [];

  // Helper to check if an invoice's bill has matured (due date is reached or passed)
  const isInvoiceMatured = (inv: Invoice) => {
    if (!inv.dueDate) return false;
    const due = new Date(inv.dueDate);
    const today = new Date();
    due.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    return due <= today;
  };

  // Sort invoices: matured ones first, then normal sorted by due date ascending
  const sortedClientInvoices = [...clientInvoices].sort((a, b) => {
    const aMatured = isInvoiceMatured(a);
    const bMatured = isInvoiceMatured(b);
    if (aMatured && !bMatured) return -1;
    if (!aMatured && bMatured) return 1;
    
    const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    return aDate - bDate;
  });

  // Sum of all selected invoices' amounts
  const originalInvoiceAmount = invoices
    .filter(inv => selectedInvoiceIds.includes(inv.id))
    .reduce((sum, inv) => sum + inv.totalAmount, 0);
  
  // Real-time Net Collected computation
  const calculatedNetCollected = Math.max(
    0,
    originalInvoiceAmount - Number(vdsDeduction || 0) - Number(tdsDeduction || 0) - Number(otherDeduction || 0)
  );

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | Collection['status']>('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);

  // Filtered Collections list
  const filteredCollections = collections.filter(col => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term ||
      col.clientName.toLowerCase().includes(term) ||
      col.invoiceRef.toLowerCase().includes(term) ||
      col.referenceNo.toLowerCase().includes(term) ||
      (col.remarks && col.remarks.toLowerCase().includes(term));

    const matchesStatus = statusFilter === 'ALL' || col.status === statusFilter;
    const matchesMethod = methodFilter === 'ALL' || col.paymentMethod === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  // Calculate Quick Stats
  const clearedCollections = collections.filter(c => c.status === 'CLEARED');
  const pendingCollections = collections.filter(c => c.status === 'PENDING_CLEARING');
  
  const totalNetCollected = clearedCollections.reduce((acc, c) => acc + c.netCollected, 0);
  const totalPendingClearing = pendingCollections.reduce((acc, c) => acc + c.netCollected, 0);
  const totalVDSDeducted = clearedCollections.reduce((acc, c) => acc + c.vdsDeduction, 0);
  const totalTDSDeducted = clearedCollections.reduce((acc, c) => acc + c.tdsDeduction, 0);
  const totalOtherDeducted = clearedCollections.reduce((acc, c) => acc + c.otherDeduction, 0);

  const handleApplyQuickVDS = (percentage: number) => {
    if (!originalInvoiceAmount) return;
    setVdsDeduction(Math.round((originalInvoiceAmount * percentage) / 100));
  };

  const handleApplyQuickTDS = (percentage: number) => {
    if (!originalInvoiceAmount) return;
    setTdsDeduction(Math.round((originalInvoiceAmount * percentage) / 100));
  };

  const handleSubmitCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedInvoiceIds.length === 0) return;

    if (Number(otherDeduction) > 0 && !otherDeductionReason.trim()) {
      alert('Please provide a reason for the Other Deduction amount.');
      return;
    }

    // Resolve client name
    const selectedClientObj = clientAccounts.find(c => c.id === selectedClientId);
    const clientNameDisplay = selectedClientObj?.name || 'Client Account';

    onCreateCollection({
      invoiceId: selectedInvoiceIds[0] || 'MULTI',
      invoiceRef: selectedInvoiceIds.join(', '),
      invoiceIds: selectedInvoiceIds,
      clientName: clientNameDisplay,
      invoiceAmount: originalInvoiceAmount,
      vdsDeduction: Number(vdsDeduction || 0),
      tdsDeduction: Number(tdsDeduction || 0),
      otherDeduction: Number(otherDeduction || 0),
      otherDeductionReason: otherDeductionReason.trim() || undefined,
      netCollected: calculatedNetCollected,
      collectionDate,
      paymentMethod,
      referenceNo: referenceNo.trim() || 'REF-' + Date.now().toString().slice(-6),
      status: 'PENDING_CLEARING',
      recordedBy: currentUser.name,
      remarks: remarks.trim() || undefined
    });

    // Reset Form
    setSelectedClientId('');
    setSelectedInvoiceIds([]);
    setVdsDeduction(0);
    setTdsDeduction(0);
    setOtherDeduction(0);
    setOtherDeductionReason('');
    setPaymentMethod('Bank Transfer');
    setReferenceNo('');
    setRemarks('');
    setShowNewModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight">Receivable Collections Registry</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Record customer payments, track VDS (VAT Deduct Source) & TDS (Tax Deduct Source) withholdings, and reconcile balances.
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm active:scale-95 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Collection</span>
        </button>
      </div>

      {/* KPI Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-zinc-200 p-4 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-semibold text-zinc-400 block uppercase">Total Net Collected</span>
            <span className="text-lg font-bold text-emerald-600 mt-1">
              {company.currency || 'BDT'} {totalNetCollected.toLocaleString()}
            </span>
            <span className="text-[10px] text-zinc-400 block mt-0.5">Cleared Collections</span>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-lg border border-emerald-100">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-zinc-200 p-4 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-semibold text-zinc-400 block uppercase">Pending Clearing</span>
            <span className="text-lg font-bold text-amber-600 mt-1">
              {company.currency || 'BDT'} {totalPendingClearing.toLocaleString()}
            </span>
            <span className="text-[10px] text-zinc-400 block mt-0.5">In Clearing Pipeline</span>
          </div>
          <div className="bg-amber-50 text-amber-600 p-2.5 rounded-lg border border-amber-100">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-zinc-200 p-4 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-semibold text-zinc-400 block uppercase">VDS Withheld</span>
            <span className="text-lg font-bold text-indigo-600 mt-1">
              {company.currency || 'BDT'} {totalVDSDeducted.toLocaleString()}
            </span>
            <span className="text-[10px] text-indigo-400 block mt-0.5">VAT Deducted Source</span>
          </div>
          <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-lg border border-indigo-100">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-zinc-200 p-4 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-semibold text-zinc-400 block uppercase">TDS Withheld</span>
            <span className="text-lg font-bold text-purple-600 mt-1">
              {company.currency || 'BDT'} {totalTDSDeducted.toLocaleString()}
            </span>
            <span className="text-[10px] text-purple-400 block mt-0.5">Tax Deducted Source</span>
          </div>
          <div className="bg-purple-50 text-purple-600 p-2.5 rounded-lg border border-purple-100">
            <Calculator className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 5 */}
        <div className="bg-white border border-zinc-200 p-4 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-semibold text-zinc-400 block uppercase">Other Adjustments</span>
            <span className="text-lg font-bold text-zinc-600 mt-1">
              {company.currency || 'BDT'} {totalOtherDeducted.toLocaleString()}
            </span>
            <span className="text-[10px] text-zinc-400 block mt-0.5">Discounts/Waivers</span>
          </div>
          <div className="bg-zinc-50 text-zinc-500 p-2.5 rounded-lg border border-zinc-200">
            <Info className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table card */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs p-5 space-y-4">
        {/* Filters Panel */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search collections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all border ${
                showFilters 
                  ? 'bg-zinc-100 border-zinc-300 text-zinc-800' 
                  : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3.5 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_CLEARING">Pending Clearing</option>
              <option value="CLEARED">Cleared / Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Expandable Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-zinc-100 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Payment Method</label>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All Methods</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
                <option value="Pay Order">Pay Order</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setMethodFilter('ALL');
                  setStatusFilter('ALL');
                  setSearchTerm('');
                }}
                className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs py-1.5"
              >
                Reset Advanced Filters
              </button>
            </div>
          </div>
        )}

        {/* Collections Table */}
        <div className="overflow-x-auto border border-zinc-100 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-600 font-semibold uppercase tracking-wider">
                <th className="p-4">Collection Ref / Date</th>
                <th className="p-4">Invoice Reference</th>
                <th className="p-4 text-right">Invoice Amt</th>
                <th className="p-4 text-right">VDS Withheld</th>
                <th className="p-4 text-right">TDS Withheld</th>
                <th className="p-4 text-right">Other Adj.</th>
                <th className="p-4 text-right bg-emerald-50/20 text-emerald-800 font-bold">Net Received</th>
                <th className="p-4">Method & Ref No</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {filteredCollections.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-zinc-400 italic">
                    No receivable collections recorded yet.
                  </td>
                </tr>
              ) : (
                filteredCollections.map((col) => {
                  return (
                    <tr key={col.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-zinc-900">{col.id}</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">
                          {new Date(col.collectionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-zinc-800">{col.invoiceRef}</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">{col.clientName}</div>
                      </td>
                      <td className="p-4 text-right font-semibold text-zinc-800">
                        {company.currency || 'BDT'} {col.invoiceAmount.toLocaleString()}
                      </td>
                      <td className="p-4 text-right text-rose-500 font-medium">
                        {col.vdsDeduction > 0 ? `-${company.currency || 'BDT'} ${col.vdsDeduction.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-4 text-right text-purple-600 font-medium">
                        {col.tdsDeduction > 0 ? `-${company.currency || 'BDT'} ${col.tdsDeduction.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-4 text-right text-zinc-500" title={col.otherDeductionReason}>
                        {col.otherDeduction > 0 ? (
                          <div>
                            <span className="text-zinc-700">-{company.currency || 'BDT'} {col.otherDeduction.toLocaleString()}</span>
                            <span className="block text-[9px] text-zinc-400 truncate max-w-[120px]">{col.otherDeductionReason}</span>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="p-4 text-right font-extrabold text-emerald-600 bg-emerald-50/10">
                        {company.currency || 'BDT'} {col.netCollected.toLocaleString()}
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-zinc-800">{col.paymentMethod}</div>
                        <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{col.referenceNo}</div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          col.status === 'CLEARED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : col.status === 'PENDING_CLEARING'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {col.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {col.status === 'PENDING_CLEARING' && (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => onUpdateCollectionStatus(col.id, 'CLEARED')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors"
                              title="Confirm Receipt & Clear Funds"
                            >
                              Clear
                            </button>
                            <button
                              onClick={() => onUpdateCollectionStatus(col.id, 'REJECTED')}
                              className="bg-rose-600 hover:bg-rose-700 text-white px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors"
                              title="Reject / Bounce Collection"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {col.status === 'CLEARED' && (
                          <span className="text-[10px] text-emerald-600 font-semibold flex items-center justify-end gap-1">
                            <CheckCircle className="w-3 h-3" /> Reconciled
                          </span>
                        )}
                        {col.status === 'REJECTED' && (
                          <span className="text-[10px] text-rose-600 font-semibold flex items-center justify-end gap-1">
                            <XCircle className="w-3 h-3" /> Bounced
                          </span>
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

      {/* Record Collection Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs flex justify-center items-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-zinc-150 flex justify-between items-center bg-zinc-50 rounded-t-2xl">
              <div>
                <h3 className="font-extrabold text-zinc-900 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-indigo-600" />
                  <span>Record Customer Collection</span>
                </h3>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Specify VDS/TDS withholding taxes to automatically calculate the net cash collection.
                </p>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1 hover:bg-zinc-200 rounded-lg text-zinc-400 hover:text-zinc-700 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitCollection} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Select Client Account */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Select Client Account <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedClientId}
                  onChange={(e) => {
                    setSelectedClientId(e.target.value);
                    setSelectedInvoiceIds([]);
                    setVdsDeduction(0);
                    setTdsDeduction(0);
                    setOtherDeduction(0);
                    setOtherDeductionReason('');
                  }}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="">-- Choose Customer Account --</option>
                  {clientAccounts.map(c => {
                    const clientUnpaidCount = receivableInvoices.filter(inv => {
                      const linkedEst = estimates.find(e => inv.estimateIds.includes(e.id));
                      return linkedEst && linkedEst.clientName?.trim().toLowerCase() === c.name.trim().toLowerCase();
                    }).length;

                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} {clientUnpaidCount > 0 ? `(${clientUnpaidCount} Unpaid Bills)` : '(No Unpaid Bills)'}
                      </option>
                    );
                  })}
                </select>
                {receivableInvoices.length === 0 && (
                  <p className="text-[10px] text-amber-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> No pending or unpaid invoices found in the system.
                  </p>
                )}
              </div>

              {/* Multi-Invoice Selector section */}
              {selectedClientId && (
                <div className="space-y-2 animate-slideDown">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                      Select Outstanding Invoices <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-indigo-600 font-semibold">
                      Multi-invoice selection allowed
                    </span>
                  </div>
                  
                  {sortedClientInvoices.length === 0 ? (
                    <div className="p-4 bg-zinc-50 border border-zinc-200 text-zinc-500 text-xs text-center rounded-xl">
                      No unpaid outstanding invoices found for this client.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-52 overflow-y-auto border border-zinc-200 rounded-xl p-3 bg-zinc-50/40">
                      {sortedClientInvoices.map(inv => {
                        const isMatured = isInvoiceMatured(inv);
                        const isSelected = selectedInvoiceIds.includes(inv.id);
                        return (
                          <label
                            key={inv.id}
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-indigo-50/80 border-indigo-400 text-indigo-950 font-semibold ring-1 ring-indigo-400'
                                : isMatured
                                  ? 'bg-emerald-50/55 border-emerald-300 hover:bg-emerald-50 text-emerald-950 font-medium'
                                  : 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-800'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  if (isSelected) {
                                    setSelectedInvoiceIds(selectedInvoiceIds.filter(id => id !== inv.id));
                                  } else {
                                    setSelectedInvoiceIds([...selectedInvoiceIds, inv.id]);
                                  }
                                }}
                                className="w-4.5 h-4.5 text-indigo-600 border-zinc-300 rounded focus:ring-indigo-500 cursor-pointer"
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`font-bold ${isMatured && !isSelected ? 'text-emerald-800' : ''}`}>{inv.id}</span>
                                  {isMatured ? (
                                    <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full animate-pulse">
                                      Matured (Priority)
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 text-[9px] font-medium bg-zinc-100 text-zinc-600 rounded-full">
                                      Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'Immediate'}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-zinc-400 mt-0.5 font-medium">
                                  Issued {new Date(inv.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`text-sm font-extrabold ${isMatured ? 'text-emerald-700' : 'text-zinc-900'}`}>
                                {company.currency || 'BDT'} {inv.totalAmount.toLocaleString()}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {selectedInvoiceIds.length > 0 && (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 text-xs space-y-1 animate-slideDown">
                  <div className="flex justify-between text-zinc-600 font-semibold">
                    <span>Selected Invoice(s) Sum:</span>
                    <span className="text-zinc-900 font-bold">{company.currency || 'BDT'} {originalInvoiceAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-zinc-500 text-[11px]">
                    <span>Invoices Listed:</span>
                    <span>{selectedInvoiceIds.join(', ')}</span>
                  </div>
                </div>
              )}

              {/* Date & Reference */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">Collection Date</label>
                  <input
                     type="date"
                     required
                     value={collectionDate}
                     onChange={(e) => setCollectionDate(e.target.value)}
                     className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-sm focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">Payment Method</label>
                  <select
                     value={paymentMethod}
                     onChange={(e) => setPaymentMethod(e.target.value)}
                     className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-sm focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                  >
                     <option value="Bank Transfer">Bank Transfer</option>
                     <option value="Cheque">Cheque</option>
                     <option value="Cash">Cash</option>
                     <option value="Pay Order">Pay Order</option>
                  </select>
                </div>
              </div>

              {/* Withholding Taxes Breakdown */}
              <div className="border border-zinc-200 rounded-xl p-4 space-y-4 bg-zinc-50/50">
                <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-200 pb-2">
                  <Building className="w-4 h-4 text-zinc-500" />
                  <span>Deductions & Withholding Adjustments</span>
                </h4>

                {/* VDS Deduction */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-zinc-700">VAT Deducted at Source (VDS)</label>
                    {selectedInvoiceIds.length > 0 && (
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleApplyQuickVDS(5)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded text-[10px] font-semibold cursor-pointer"
                        >
                          Apply 5%
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyQuickVDS(7.5)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded text-[10px] font-semibold cursor-pointer"
                        >
                          Apply 7.5%
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-semibold">
                      {company.currency || 'BDT'}
                    </span>
                    <input
                      type="number"
                      min={0}
                      disabled={selectedInvoiceIds.length === 0}
                      value={vdsDeduction || ''}
                      onChange={(e) => setVdsDeduction(Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full pl-12 pr-4 py-2.5 bg-white border border-zinc-300 rounded-lg text-sm focus:outline-hidden focus:border-indigo-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* TDS Deduction */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-zinc-700">Tax Deducted at Source (TDS)</label>
                    {selectedInvoiceIds.length > 0 && (
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleApplyQuickTDS(10)}
                          className="bg-purple-50 hover:bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded text-[10px] font-semibold cursor-pointer"
                        >
                          Apply 10%
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyQuickTDS(12)}
                          className="bg-purple-50 hover:bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded text-[10px] font-semibold cursor-pointer"
                        >
                          Apply 12%
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-semibold">
                      {company.currency || 'BDT'}
                    </span>
                    <input
                      type="number"
                      min={0}
                      disabled={selectedInvoiceIds.length === 0}
                      value={tdsDeduction || ''}
                      onChange={(e) => setTdsDeduction(Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full pl-12 pr-4 py-2.5 bg-white border border-zinc-300 rounded-lg text-sm focus:outline-hidden focus:border-indigo-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Other Deduction */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Other Adjustments / Waiver</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-semibold">
                        {company.currency || 'BDT'}
                      </span>
                      <input
                        type="number"
                        min={0}
                        disabled={selectedInvoiceIds.length === 0}
                        value={otherDeduction || ''}
                        onChange={(e) => setOtherDeduction(Number(e.target.value))}
                        placeholder="0.00"
                        className="w-full pl-12 pr-4 py-2.5 bg-white border border-zinc-300 rounded-lg text-sm focus:outline-hidden focus:border-indigo-500 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Adjustment Reason {Number(otherDeduction) > 0 && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type="text"
                      disabled={selectedInvoiceIds.length === 0}
                      value={otherDeductionReason}
                      onChange={(e) => setOtherDeductionReason(e.target.value)}
                      placeholder="e.g. Prompt payment discount"
                      className="w-full p-2.5 bg-white border border-zinc-300 rounded-lg text-sm focus:outline-hidden focus:border-indigo-500 disabled:opacity-50"
                      required={Number(otherDeduction) > 0}
                    />
                  </div>
                </div>
              </div>

              {/* Transaction Ref & Remarks */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Cheque / Transaction Ref <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder="e.g. CHQ-990812, TXN-8820"
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-sm focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">Remarks / Ledger Notes</label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Standard clearing period"
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-sm focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Net Cash Collection display */}
              <div className="bg-emerald-600 text-white p-4 rounded-xl flex items-center justify-between shadow-md">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-85 block">Net Cash Received</span>
                  <span className="text-2xl font-extrabold">
                    {company.currency || 'BDT'} {calculatedNetCollected.toLocaleString()}
                  </span>
                </div>
                <div className="text-right text-[10px] opacity-85">
                  <div>Invoice: - {company.currency || 'BDT'} {(Number(vdsDeduction || 0) + Number(tdsDeduction || 0) + Number(otherDeduction || 0)).toLocaleString()} Adjustments</div>
                  <div className="font-semibold italic">Awaiting Treasury Clearing</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-zinc-150">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 px-4 py-2.5 border border-zinc-300 hover:bg-zinc-100 rounded-xl text-xs font-semibold text-zinc-700 cursor-pointer transition-colors text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedInvoiceIds.length === 0}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm text-center"
                >
                  Save Collection Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
