/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { VendorBill, WorkOrder, Vendor, Company } from '../types';
import { Check, ShieldAlert, FileText, CheckCircle, ExternalLink } from 'lucide-react';

interface VatAuditModuleProps {
  bills: VendorBill[];
  workOrders: WorkOrder[];
  vendors: Vendor[];
  company: Company;
  onVerifyVatDocs: (billId: string) => void;
}

export default function VatAuditModule({ bills, workOrders, vendors, company, onVerifyVatDocs }: VatAuditModuleProps) {
  const pendingVerificationBills = bills.filter(b => b.status === 'SUBMITTED' || !b.hardcopyReceivedConfirmation);

  return (
    <div id="vat-audit-module" className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-amber-900 font-sans">VAT Department Compliance & GRN Verification Queue</h3>
          <p className="text-xs text-amber-700 mt-1 leading-relaxed">
            As a VAT Audit Inspector, your responsibility is to ensure physical hardcopy documentation matches digital filings.
            Verify physical <strong>GRN (Goods Receipt Notes)</strong> and corresponding tax invoices (e.g. <strong>Mushok-6.3</strong>)
            before marking records as compliant. 
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 tracking-tight">GRN & Mushok Auditing Desk</h2>
          <p className="text-xs text-zinc-500 mt-1">Verify submitted supplier bills against work orders before payout release</p>
        </div>
        <span className="text-xs bg-zinc-100 text-zinc-700 border border-zinc-200 font-bold font-mono px-3 py-1 rounded-lg">
          {pendingVerificationBills.length} Pending Actions
        </span>
      </div>

      {pendingVerificationBills.length === 0 ? (
        <div className="p-8 text-center bg-white border border-zinc-200 rounded-xl text-zinc-500 text-sm">
          No bills are currently awaiting physical document auditing. Great job keeping the audit queue empty!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {pendingVerificationBills.map(bill => {
            const wo = workOrders.find(w => w.id === bill.workOrderId);
            const vend = vendors.find(v => v.id === wo?.vendorId);

            return (
              <div key={bill.id} className="bg-white border border-zinc-200 rounded-xl p-5 hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-bold text-zinc-900 text-sm">{bill.id}</span>
                      <p className="text-xs text-zinc-500 mt-0.5">Supplier: {vend?.businessName}</p>
                    </div>
                    <span className="text-[10px] bg-zinc-100 text-zinc-700 font-semibold px-2 py-0.5 rounded border">
                      Bill Status: {bill.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-zinc-50/50 p-3 rounded-lg border border-zinc-100/50 text-xs my-4">
                    <div>
                      <span className="text-zinc-500 block">Gross Amount:</span>
                      <span className="font-semibold text-zinc-900">{company.currency || 'BDT'} {bill.amount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Advance Deducted:</span>
                      <span className="text-rose-600 font-semibold">-{company.currency || 'BDT'} {bill.advanceDeductions.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Net Remittance:</span>
                      <span className="font-semibold text-zinc-900">{company.currency || 'BDT'} {(bill.amount - bill.advanceDeductions).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Work Order Ref:</span>
                      <span className="font-semibold text-zinc-900 font-mono text-[10px]">{bill.workOrderId}</span>
                    </div>
                  </div>

                  <div className="space-y-2 border-t pt-3 mt-1 text-xs">
                    <p className="font-medium text-zinc-700">Digital Scans Received:</p>
                    <div className="flex gap-2">
                      {bill.invoiceScanUrl && (
                        <a
                          href={bill.invoiceScanUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] text-indigo-600 hover:underline bg-indigo-50/50 px-2 py-1 rounded border border-indigo-100 font-medium"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Supplier Invoice</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {bill.supportingDocsUrl ? (
                        <a
                          href={bill.supportingDocsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] text-zinc-600 hover:underline bg-zinc-50 px-2 py-1 rounded border border-zinc-100 font-medium"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Supporting GRN Doc</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[10px] text-zinc-400 italic mt-1 bg-zinc-50 border border-dashed rounded px-2 py-1">
                          No Supporting GRN Scan Attached
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-zinc-100 pt-3 mt-4 flex gap-2">
                  <button
                    onClick={() => onVerifyVatDocs(bill.id)}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Verify Physical Hardcopies Match
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
