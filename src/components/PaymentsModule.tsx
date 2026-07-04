/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Payment, VendorBill, User, Vendor, Company } from '../types';
import { CheckCircle, XCircle, RefreshCw, Send, DollarSign, ArrowUpRight } from 'lucide-react';

interface PaymentsModuleProps {
  payments: Payment[];
  bills: VendorBill[];
  vendors: Vendor[];
  currentUser: User;
  company: Company;
  onCreatePayment: (payment: Omit<Payment, 'id' | 'companyId' | 'createdAt'>) => void;
  onApprovePayment: (paymentId: string, approverId: string) => void;
  onRejectPayment: (paymentId: string) => void;
  onSyncQBO: (paymentId: string, qboId: string) => void;
}

export default function PaymentsModule({
  payments,
  bills,
  vendors,
  currentUser,
  company,
  onCreatePayment,
  onApprovePayment,
  onRejectPayment,
  onSyncQBO
}: PaymentsModuleProps) {
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [billId, setBillId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CHECK' | 'WIRE' | 'ACH'>('WIRE');
  const [details, setDetails] = useState('');
  const [customAmount, setCustomAmount] = useState<number>(0);

  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Column width resizing state and handler
  const [colWidths, setColWidths] = useState<Record<string, number>>({
    ref: 120,
    bill: 110,
    details: 250,
    amount: 150,
    sync: 130,
    status: 120,
    approvals: 150,
  });

  const handleMouseDown = (colKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = colWidths[colKey] || 150;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      setColWidths(prev => ({
        ...prev,
        [colKey]: Math.max(60, startWidth + deltaX)
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const tableMinWidth = Object.keys(colWidths).reduce((acc, key) => acc + colWidths[key], 0);

  const canCreate = ['FINANCE_USER', 'FINANCE_MANAGER', 'ADMIN'].includes(currentUser.role);
  const canApprove = ['FINANCE_MANAGER', 'ADMIN'].includes(currentUser.role);

  // Unpaid approved bills
  const payableBills = bills.filter(
    b => b.status === 'APPROVED' &&
    !payments.some(p => p.vendorBillId === b.id && p.status === 'PAID')
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billId) return;

    const targetBill = bills.find(b => b.id === billId);
    if (!targetBill) return;

    const amountToPay = customAmount > 0 ? customAmount : (targetBill.amount - targetBill.advanceDeductions);

    onCreatePayment({
      financeCreatorId: currentUser.id,
      paymentMethod,
      checkWireDetails: details || `Draft payment dispatch for Bill Ref: ${targetBill.id}`,
      amount: amountToPay,
      vendorBillId: targetBill.id,
      status: 'PENDING_APPROVAL'
    });

    setBillId('');
    setDetails('');
    setCustomAmount(0);
    setShowDraftModal(false);
  };

  const handleSyncPaymentQBO = (payId: string) => {
    setSyncingId(payId);
    setTimeout(() => {
      onSyncQBO(payId, `QBO-PAY-${Math.floor(Math.random() * 89999) + 10000}`);
      setSyncingId(null);
    }, 1500);
  };

  return (
    <div id="payments-module" className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 tracking-tight">Accounts Payable & Payments</h2>
          <p className="text-sm text-zinc-500 mt-1">Remittance flows, Finance Manager approvals, and QuickBooks syncs</p>
        </div>
        {canCreate && (
          <button
            onClick={() => {
              if (payableBills.length > 0) {
                setBillId(payableBills[0].id);
                setCustomAmount(payableBills[0].amount - payableBills[0].advanceDeductions);
              }
              setShowDraftModal(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm cursor-pointer"
          >
            Draft Remittance
          </button>
        )}
      </div>

      {/* Grid listing payments */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse" style={{ tableLayout: 'fixed', minWidth: tableMinWidth }}>
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-600 font-semibold text-xs uppercase tracking-wider select-none">
                <th className="p-4 relative group" style={{ width: colWidths.ref }}>
                  <span className="truncate block pr-2">Payment Ref</span>
                  <div
                    onMouseDown={(e) => handleMouseDown('ref', e)}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-400 bg-transparent active:bg-indigo-600 transition-colors z-10 select-none border-r border-zinc-200/50"
                  />
                </th>
                <th className="p-4 relative group" style={{ width: colWidths.bill }}>
                  <span className="truncate block pr-2">Linked Bill</span>
                  <div
                    onMouseDown={(e) => handleMouseDown('bill', e)}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-400 bg-transparent active:bg-indigo-600 transition-colors z-10 select-none border-r border-zinc-200/50"
                  />
                </th>
                <th className="p-4 relative group" style={{ width: colWidths.details }}>
                  <span className="truncate block pr-2">Method & Remittance Details</span>
                  <div
                    onMouseDown={(e) => handleMouseDown('details', e)}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-400 bg-transparent active:bg-indigo-600 transition-colors z-10 select-none border-r border-zinc-200/50"
                  />
                </th>
                <th className="p-4 text-right relative group" style={{ width: colWidths.amount }}>
                  <span className="truncate block pr-2">Amount Dispatched</span>
                  <div
                    onMouseDown={(e) => handleMouseDown('amount', e)}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-400 bg-transparent active:bg-indigo-600 transition-colors z-10 select-none border-r border-zinc-200/50"
                  />
                </th>
                <th className="p-4 text-center relative group" style={{ width: colWidths.sync }}>
                  <span className="truncate block px-2">QuickBooks Sync</span>
                  <div
                    onMouseDown={(e) => handleMouseDown('sync', e)}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-400 bg-transparent active:bg-indigo-600 transition-colors z-10 select-none border-r border-zinc-200/50"
                  />
                </th>
                <th className="p-4 text-center relative group" style={{ width: colWidths.status }}>
                  <span className="truncate block px-2">Status</span>
                  <div
                    onMouseDown={(e) => handleMouseDown('status', e)}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-400 bg-transparent active:bg-indigo-600 transition-colors z-10 select-none border-r border-zinc-200/50"
                  />
                </th>
                <th className="p-4 text-right relative group" style={{ width: colWidths.approvals }}>
                  <span className="truncate block pr-2">Approvals</span>
                  <div
                    onMouseDown={(e) => handleMouseDown('approvals', e)}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-400 bg-transparent active:bg-indigo-600 transition-colors z-10 select-none"
                  />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {payments.map(pay => {
                const targetBill = bills.find(b => b.id === pay.vendorBillId);
                return (
                  <tr key={pay.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-zinc-900 truncate whitespace-nowrap" title={pay.id}>{pay.id}</td>
                    <td className="p-4 font-mono text-xs truncate whitespace-nowrap" title={pay.vendorBillId || 'General AP'}>{pay.vendorBillId || 'General AP'}</td>
                    <td className="p-4 text-xs truncate whitespace-nowrap" title={`${pay.paymentMethod} - ${pay.checkWireDetails}`}>
                      <div className="font-semibold text-zinc-800 truncate">{pay.paymentMethod}</div>
                      <div className="text-zinc-500 font-sans truncate">
                        {pay.checkWireDetails}
                      </div>
                    </td>
                    <td className="p-4 text-right font-bold text-zinc-900 truncate whitespace-nowrap" title={`${company.currency || 'BDT'} ${pay.amount.toLocaleString()}`}>{company.currency || 'BDT'} {pay.amount.toLocaleString()}</td>
                    <td className="p-4 text-center truncate whitespace-nowrap">
                      {pay.qboId ? (
                        <div className="text-emerald-700 font-mono text-xs flex items-center justify-center gap-1 font-semibold truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                          <span className="truncate">Synced ({pay.qboId})</span>
                        </div>
                      ) : (
                        <button
                          disabled={syncingId !== null}
                          onClick={() => handleSyncPaymentQBO(pay.id)}
                          className="px-2.5 py-1 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded border border-zinc-300 inline-flex items-center gap-1 cursor-pointer disabled:opacity-50 select-none"
                        >
                          {syncingId === pay.id ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin shrink-0" /> <span className="truncate">Syncing...</span>
                            </>
                          ) : (
                            <span className="truncate">Sync Intuit</span>
                          )}
                        </button>
                      )}
                    </td>
                    <td className="p-4 text-center truncate whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-0.5 text-xs rounded-full font-semibold border truncate max-w-full ${
                        pay.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        pay.status === 'PENDING_APPROVAL' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        pay.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                        'bg-zinc-100 text-zinc-600 border-zinc-200'
                      }`}>
                        {pay.status}
                      </span>
                    </td>
                    <td className="p-4 text-right truncate whitespace-nowrap">
                      {pay.status === 'PENDING_APPROVAL' && canApprove ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => onApprovePayment(pay.id, currentUser.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium cursor-pointer"
                          >
                            Approve Pay
                          </button>
                          <button
                            onClick={() => onRejectPayment(pay.id)}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-medium cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      ) : pay.status === 'PAID' ? (
                        <span className="text-zinc-400 text-xs italic">Cleared Remittance</span>
                      ) : (
                        <span className="text-zinc-400 text-xs italic">Locked</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Draft Payment Modal */}
      {showDraftModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-2xl max-w-sm w-full p-5 animate-scale-in">
            <h3 className="font-semibold text-zinc-900 mb-2">Draft Vendor Remittance Check</h3>
            <p className="text-xs text-zinc-500 mb-3">Initiate a payment release request against approved vendor bills.</p>
            {payableBills.length === 0 ? (
              <div className="text-center py-4 text-zinc-500 text-xs">
                No approved, unpaid vendor bills are outstanding. Let vendors submit and get approved first!
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">Target Approved Bill</label>
                  <select
                    value={billId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setBillId(id);
                      const b = bills.find(x => x.id === id);
                      if (b) setCustomAmount(b.amount - b.advanceDeductions);
                    }}
                    className="w-full p-2 border border-zinc-300 rounded text-xs bg-white focus:outline-hidden"
                  >
                    {payableBills.map(b => (
                      <option key={b.id} value={b.id}>
                        Bill Ref: {b.id} - Net Sum: {company.currency || 'BDT'} {(b.amount - b.advanceDeductions).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">Remittance Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full p-2 border border-zinc-300 rounded text-xs bg-white focus:outline-hidden"
                  >
                    <option value="WIRE">SWIFT Wire Transfer</option>
                    <option value="CHECK">Physical Bank Check</option>
                    <option value="ACH">Automated Clearing House (ACH)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">Payment Amount ({company.currency || 'BDT'})</label>
                  <input
                    type="number"
                    required
                    value={customAmount}
                    onChange={(e) => setCustomAmount(Number(e.target.value))}
                    className="w-full p-2 border border-zinc-300 rounded text-xs text-right bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">Wire/Check Transaction Memo</label>
                  <textarea
                    rows={2}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="FedWire transaction confirmation code, bank account details, or print guidelines..."
                    className="w-full p-2 border border-zinc-300 rounded text-xs bg-white focus:outline-hidden"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setShowDraftModal(false)}
                    className="px-3 py-1.5 border border-zinc-300 hover:bg-zinc-50 rounded-lg text-xs text-zinc-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                  >
                    Draft Payment
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
