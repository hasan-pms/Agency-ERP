/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Vendor, WorkOrder, VendorBill, AdvanceRequest, Project, User, Company } from '../types';
import { Clipboard, FileText, Send, DollarSign, Edit3, Check } from 'lucide-react';

interface VendorModuleProps {
  vendors: Vendor[];
  workOrders: WorkOrder[];
  bills: VendorBill[];
  advances: AdvanceRequest[];
  projects: Project[];
  currentUser: User;
  company: Company;
  onUpdateVendorBank: (vendorId: string, bankName: string, accountNo: string, routingNo: string) => void;
  onSubmitBill: (bill: Omit<VendorBill, 'id' | 'createdAt'>) => void;
  onSubmitAdvance: (advance: Omit<AdvanceRequest, 'id' | 'createdAt'>) => void;
}

export default function VendorModule({
  vendors,
  workOrders,
  bills,
  advances,
  projects,
  currentUser,
  company,
  onUpdateVendorBank,
  onSubmitBill,
  onSubmitAdvance
}: VendorModuleProps) {
  // Identify corresponding active vendor
  const activeVendor = vendors.find(v => v.email === currentUser.email) || vendors[0];

  const vendorWorkOrders = workOrders.filter(wo => wo.vendorId === activeVendor?.id);
  const vendorBills = bills.filter(b => vendorWorkOrders.some(wo => wo.id === b.workOrderId));
  const vendorAdvances = advances.filter(a => vendorWorkOrders.some(wo => wo.id === a.workOrderId));

  // Edit State
  const [bankName, setBankName] = useState(activeVendor?.bankDetails?.bankName || '');
  const [accountNo, setAccountNo] = useState(activeVendor?.bankDetails?.accountNo || '');
  const [routingNo, setRoutingNo] = useState(activeVendor?.bankDetails?.routingNo || '');
  const [isSaved, setIsSaved] = useState(false);

  // Bill Submit state
  const [selectedWoId, setSelectedWoId] = useState(vendorWorkOrders[0]?.id || '');
  const [billAmount, setBillAmount] = useState(25000);
  const [deductions, setDeductions] = useState(2000);
  const [scanUrl, setScanUrl] = useState('https://images.unsplash.com/photo-1450133064473-71024230f91b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3');
  const [showBillModal, setShowBillModal] = useState(false);

  // Advance state
  const [advanceWoId, setAdvanceWoId] = useState(vendorWorkOrders[0]?.id || '');
  const [advanceAmt, setAdvanceAmt] = useState(10000);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);

  const handleUpdateBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVendor) return;
    onUpdateVendorBank(activeVendor.id, bankName, accountNo, routingNo);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleBillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWoId) return;

    onSubmitBill({
      workOrderId: selectedWoId,
      amount: Number(billAmount),
      invoiceScanUrl: scanUrl,
      advanceDeductions: Number(deductions),
      grnGenerated: false,
      hardcopyReceivedConfirmation: false,
      status: 'SUBMITTED'
    });

    setShowBillModal(false);
  };

  const handleAdvanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advanceWoId) return;

    onSubmitAdvance({
      workOrderId: advanceWoId,
      amountRequested: Number(advanceAmt),
      status: 'PENDING'
    });

    setShowAdvanceModal(false);
  };

  if (!activeVendor) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-100 rounded-xl text-rose-700">
        No vendor profile was found matching email: <strong>{currentUser.email}</strong>.
      </div>
    );
  }

  return (
    <div id="vendor-module" className="space-y-6">
      {/* Supplier Profile Info */}
      <div className="bg-zinc-900 text-white rounded-2xl p-6 border border-zinc-800 shadow-xl flex flex-col md:flex-row justify-between gap-6">
        <div>
          <span className="text-zinc-400 font-mono text-xs uppercase tracking-wider">Active Secure Node</span>
          <h2 className="text-2xl font-bold tracking-tight mt-1">{activeVendor.businessName}</h2>
          <p className="text-sm text-zinc-400 mt-1">Primary Supplier Contact: {activeVendor.contactName} ({activeVendor.email})</p>
          <div className="flex gap-4 mt-4 text-xs font-mono">
            <div className="bg-zinc-800 border border-zinc-700/60 px-3 py-1.5 rounded-lg">
              Status: <span className="text-emerald-400 font-bold">ACTIVE PORTAL</span>
            </div>
            <div className="bg-zinc-800 border border-zinc-700/60 px-3 py-1.5 rounded-lg">
              Linked Tenant: <span className="text-sky-400">Acme Enterprise</span>
            </div>
          </div>
        </div>

        {/* Bank details update */}
        <form onSubmit={handleUpdateBank} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 w-full md:max-w-xs space-y-3">
          <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider border-b border-zinc-800 pb-2">Modify Remittance Details</h3>
          <div>
            <label className="block text-[10px] text-zinc-400">Bank Name</label>
            <input
              type="text"
              required
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 p-1.5 rounded text-xs focus:outline-hidden text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-zinc-400">Account No</label>
              <input
                type="text"
                required
                value={accountNo}
                onChange={(e) => setAccountNo(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 p-1.5 rounded text-xs focus:outline-hidden text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-400">Routing No</label>
              <input
                type="text"
                required
                value={routingNo}
                onChange={(e) => setRoutingNo(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 p-1.5 rounded text-xs focus:outline-hidden text-white"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5" /> Saved!
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5" /> Update Bank Profile
              </>
            )}
          </button>
        </form>
      </div>

      {/* Grid of Work Orders & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Work Orders List */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-zinc-900 tracking-tight">Active Work Orders</h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (vendorWorkOrders.length > 0) {
                    setSelectedWoId(vendorWorkOrders[0].id);
                  }
                  setShowBillModal(true);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                Submit Bill Invoice
              </button>
              <button
                onClick={() => {
                  if (vendorWorkOrders.length > 0) {
                    setAdvanceWoId(vendorWorkOrders[0].id);
                  }
                  setShowAdvanceModal(true);
                }}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                Request Advance
              </button>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-100 overflow-hidden shadow-xs">
            {vendorWorkOrders.map(wo => {
              const proj = projects.find(p => p.id === wo.projectId);
              return (
                <div key={wo.id} className="p-4 hover:bg-zinc-50/50 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-zinc-900 text-sm">{wo.id}</span>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {wo.status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-zinc-800 mt-1">Project: {proj?.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5 whitespace-pre-line">{wo.projectBreakdown}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-zinc-400 block">Total Budget Cap</span>
                    <span className="text-base font-bold text-zinc-900">{company.currency || 'BDT'} {wo.totalBudget.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Submitted Bills & Advances Tracking */}
        <div className="space-y-5">
          <h3 className="text-lg font-bold text-zinc-900 tracking-tight">Your Bills & Requests</h3>

          {/* Bills panel */}
          <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs space-y-4">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Submitted Billing (AP)</h4>
            {vendorBills.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">No bills submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {vendorBills.map(bill => (
                  <div key={bill.id} className="text-xs p-3 border border-zinc-100 rounded-lg bg-zinc-50/50 space-y-1.5">
                    <div className="flex justify-between font-mono">
                      <span className="font-bold text-zinc-900">{bill.id}</span>
                      <span className={`font-semibold uppercase px-2 py-0.5 rounded text-[10px] border ${
                        bill.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        bill.status === 'APPROVED' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                        bill.status === 'VAT_VERIFIED' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        'bg-zinc-100 text-zinc-600 border-zinc-200'
                      }`}>
                        {bill.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-600">
                      <span>Gross Amount:</span>
                      <span className="font-semibold text-zinc-900">{company.currency || 'BDT'} {bill.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-zinc-600">
                      <span>Deductions Applied:</span>
                      <span className="text-rose-600 font-semibold">-{company.currency || 'BDT'} {bill.advanceDeductions.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400 text-[10px] border-t pt-1.5 mt-1.5">
                      <span>GRN Status:</span>
                      <span className={bill.grnGenerated ? 'text-emerald-600 font-medium' : 'text-zinc-500'}>
                        {bill.grnGenerated ? '✓ GRN Issued' : 'Pending Verification'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Advance requests */}
          <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs space-y-4">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Advance Fund Requests</h4>
            {vendorAdvances.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">No advance requests drafted yet.</p>
            ) : (
              <div className="space-y-2">
                {vendorAdvances.map(adv => (
                  <div key={adv.id} className="text-xs p-2.5 border border-zinc-100 rounded-lg flex justify-between items-center bg-zinc-50/50">
                    <div>
                      <span className="font-semibold text-zinc-800">{company.currency || 'BDT'} {adv.amountRequested.toLocaleString()}</span>
                      <span className="text-[10px] text-zinc-400 block">{new Date(adv.createdAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${
                      adv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      adv.status === 'APPROVED' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                      adv.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                      'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {adv.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bill Submit modal */}
      {showBillModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-2xl max-w-sm w-full p-5 animate-scale-in">
            <h3 className="font-semibold text-zinc-900 mb-2">Submit Invoice / Bill to Client</h3>
            <p className="text-xs text-zinc-500 mb-3">Submits a digital bill against your approved Work Order allocation.</p>
            <form onSubmit={handleBillSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1">Target Work Order</label>
                <select
                  value={selectedWoId}
                  onChange={(e) => setSelectedWoId(e.target.value)}
                  className="w-full p-2 border border-zinc-300 rounded text-xs bg-white focus:outline-hidden"
                >
                  {vendorWorkOrders.map(wo => (
                    <option key={wo.id} value={wo.id}>{wo.id} - Cap: {company.currency || 'BDT'} {wo.totalBudget.toLocaleString()}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">Bill Amount ({company.currency || 'BDT'})</label>
                  <input
                    type="number"
                    required
                    value={billAmount}
                    onChange={(e) => setBillAmount(Number(e.target.value))}
                    className="w-full p-2 border border-zinc-300 rounded text-xs text-right bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">Advance Deductions ({company.currency || 'BDT'})</label>
                  <input
                    type="number"
                    required
                    value={deductions}
                    onChange={(e) => setDeductions(Number(e.target.value))}
                    className="w-full p-2 border border-zinc-300 rounded text-xs text-right bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1">Invoice Scan URL (Attachment)</label>
                <input
                  type="url"
                  required
                  value={scanUrl}
                  onChange={(e) => setScanUrl(e.target.value)}
                  className="w-full p-2 border border-zinc-300 rounded text-xs bg-white focus:outline-hidden"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowBillModal(false)}
                  className="px-3 py-1.5 border border-zinc-300 hover:bg-zinc-50 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                >
                  Submit Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Advance Request modal */}
      {showAdvanceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-2xl max-w-xs w-full p-5 animate-scale-in">
            <h3 className="font-semibold text-zinc-900 mb-2">Request Advance Payment</h3>
            <p className="text-xs text-zinc-500 mb-3">Ask for partial funds in advance to support materials purchase.</p>
            <form onSubmit={handleAdvanceSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1">Target Work Order</label>
                <select
                  value={advanceWoId}
                  onChange={(e) => setAdvanceWoId(e.target.value)}
                  className="w-full p-2 border border-zinc-300 rounded text-xs bg-white focus:outline-hidden"
                >
                  {vendorWorkOrders.map(wo => (
                    <option key={wo.id} value={wo.id}>{wo.id} - Cap: {company.currency || 'BDT'} {wo.totalBudget.toLocaleString()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1">Amount Requested ({company.currency || 'BDT'})</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={advanceAmt}
                  onChange={(e) => setAdvanceAmt(Number(e.target.value))}
                  className="w-full p-2 border border-zinc-300 rounded text-xs text-right bg-white"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(false)}
                  className="px-3 py-1.5 border border-zinc-300 hover:bg-zinc-50 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
