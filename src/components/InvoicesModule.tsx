/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Invoice, Estimate, Project, User, Company, InvoiceLineItem, UserRole } from '../types';
import { 
  FileText, 
  Eye, 
  RefreshCw, 
  Plus, 
  UploadCloud, 
  CheckCircle, 
  Pencil, 
  Trash2, 
  X, 
  Check, 
  Printer, 
  AlertTriangle, 
  Building, 
  PlusCircle,
  HelpCircle
} from 'lucide-react';

interface InvoicesModuleProps {
  invoices: Invoice[];
  estimates: Estimate[];
  projects: Project[];
  currentUser: User;
  company: Company;
  onCreateInvoice: (invoice: Omit<Invoice, 'id' | 'companyId' | 'createdAt'>) => void;
  onUpdateInvoice: (invoiceId: string, updatedData: Partial<Invoice>) => void;
  onSyncQBO: (invoiceId: string, qboId: string) => void;
  preselectedEstimateId?: string | null;
  onClearPreselectedEstimateId?: () => void;
}

interface TempInvoiceLineItem {
  id: string;
  description: string;
  qty: number;
  rate: number;
  amount: number;
  sourceEstimateId: string;
  sourceLineItemId: string;
  isSelected: boolean;
}

export default function InvoicesModule({
  invoices,
  estimates,
  projects,
  currentUser,
  company,
  onCreateInvoice,
  onUpdateInvoice,
  onSyncQBO,
  preselectedEstimateId,
  onClearPreselectedEstimateId
}: InvoicesModuleProps) {
  // New creation states
  const [showNewModal, setShowNewModal] = useState(false);

  // Column width resizing state and handler
  const [colWidths, setColWidths] = useState<Record<string, number>>({
    ref: 120,
    estimates: 150,
    subtotal: 130,
    adjustments: 160,
    grandTotal: 140,
    receipt: 130,
    sync: 130,
    status: 120,
    actions: 140,
  });

  const handleMouseDown = (colKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = colWidths[colKey] || 140;

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

  const [selectedEstimateIds, setSelectedEstimateIds] = useState<string[]>([]);
  const [invoiceLineItems, setInvoiceLineItems] = useState<TempInvoiceLineItem[]>([]);
  
  const [taxRate, setTaxRate] = useState(0);
  const [vatRate, setVatRate] = useState(7);
  const [otherCharges, setOtherCharges] = useState(0);

  // Editing states (Finance review & adjust)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editingLineItems, setEditingLineItems] = useState<{ id: string; description: string; qty: number; rate: number }[]>([]);
  const [editingTaxRate, setEditingTaxRate] = useState(0);
  const [editingVatRate, setEditingVatRate] = useState(7);
  const [editingOtherCharges, setEditingOtherCharges] = useState(0);
  const [editingStatus, setEditingStatus] = useState<Invoice['status']>('DRAFT');

  // Preview & uploads
  const [activePreviewHTML, setActivePreviewHTML] = useState<string | null>(null);
  const [activePreviewTitle, setActivePreviewTitle] = useState('');
  const [simulatedReceiptUrl, setSimulatedReceiptUrl] = useState('');
  const [receiptingInvId, setReceiptingInvId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Handle preselected estimates from Estimates page converting
  useEffect(() => {
    if (preselectedEstimateId) {
      setSelectedEstimateIds([preselectedEstimateId]);
      setShowNewModal(true);
      
      const est = estimates.find(e => e.id === preselectedEstimateId);
      if (est) {
        const items = est.lineItems.map((item, idx) => ({
          id: `inv-item-pre-${Date.now()}-${idx}-${item.id}`,
          description: item.description,
          qty: item.qty,
          rate: item.rate,
          amount: item.qty * item.rate,
          sourceEstimateId: est.id,
          sourceLineItemId: item.id,
          isSelected: true
        }));
        setInvoiceLineItems(items);

        // Copy the VAT rate from the estimate's line items (default to 15 if not specified)
        const estVatRate = est.lineItems.find(item => item.vatRate !== undefined)?.vatRate ?? 15;
        setVatRate(estVatRate);
      }
      
      // Clear preselection state in App so it doesn't trigger again
      if (onClearPreselectedEstimateId) {
        onClearPreselectedEstimateId();
      }
    }
  }, [preselectedEstimateId, estimates]);

  // Roles access checks
  // User says "cs will convert estimate to invoice". So both CS and Finance can create/generate invoices!
  const canCreate = ['CS_USER', 'CS_MANAGER', 'FINANCE_USER', 'FINANCE_MANAGER', 'ADMIN', 'MASTER_ADMIN'].includes(currentUser.role);
  // Finance reviewers
  const isFinanceOrAdmin = ['FINANCE_USER', 'FINANCE_MANAGER', 'ADMIN', 'MASTER_ADMIN'].includes(currentUser.role);

  // Group estimates for selection
  // Filter for approved ones or client approved, but display all so user has full control
  const availableEstimates = estimates.filter(est => est.clientStatus === 'APPROVED' || est.csManagerApproved);

  const handleToggleEstimate = (estId: string) => {
    const isSelected = selectedEstimateIds.includes(estId);
    let updatedIds: string[];
    
    if (isSelected) {
      updatedIds = selectedEstimateIds.filter(id => id !== estId);
    } else {
      updatedIds = [...selectedEstimateIds, estId];
    }
    
    setSelectedEstimateIds(updatedIds);

    // Filter current line items to keep only those from remaining selected estimates
    const remainingItems = invoiceLineItems.filter(item => updatedIds.includes(item.sourceEstimateId));

    if (!isSelected) {
      // Add lines from the newly selected estimate
      const est = estimates.find(e => e.id === estId);
      if (est) {
        const newLines: TempInvoiceLineItem[] = est.lineItems.map((li, idx) => ({
          id: `inv-item-${estId}-${idx}-${Date.now()}`,
          description: li.description,
          qty: li.qty,
          rate: li.rate,
          amount: li.qty * li.rate,
          sourceEstimateId: estId,
          sourceLineItemId: li.id,
          isSelected: true
        }));
        setInvoiceLineItems([...remainingItems, ...newLines]);

        // Automatically update the VAT rate to match the newly added estimate's VAT rate
        const estVatRate = est.lineItems.find(item => item.vatRate !== undefined)?.vatRate ?? 15;
        setVatRate(estVatRate);
      }
    } else {
      setInvoiceLineItems(remainingItems);
      // If we deselected and there is still another selected estimate, update to its VAT rate
      if (updatedIds.length > 0) {
        const firstRemainingEst = estimates.find(e => e.id === updatedIds[0]);
        if (firstRemainingEst) {
          const estVatRate = firstRemainingEst.lineItems.find(item => item.vatRate !== undefined)?.vatRate ?? 15;
          setVatRate(estVatRate);
        }
      }
    }
  };

  const handleLineItemChange = (itemId: string, field: 'qty' | 'rate' | 'isSelected' | 'description', value: any) => {
    setInvoiceLineItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, [field]: value };
        if (field === 'qty' || field === 'rate') {
          updated.amount = Number(updated.qty || 0) * Number(updated.rate || 0);
        }
        return updated;
      }
      return item;
    }));
  };

  // Sum calculations for dynamic invoice state
  const selectedLines = invoiceLineItems.filter(item => item.isSelected);
  const subTotal = selectedLines.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = (subTotal * taxRate) / 100;
  const vatAmount = (subTotal * vatRate) / 100;
  const grandTotal = subTotal + taxAmount + vatAmount + otherCharges;

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEstimateIds.length === 0) {
      alert('Please select at least one estimate.');
      return;
    }
    if (selectedLines.length === 0) {
      alert('Please include at least one line item in the invoice.');
      return;
    }

    onCreateInvoice({
      estimateIds: selectedEstimateIds,
      csUserId: currentUser.id,
      paymentAdjustments: {
        taxRate,
        vatRate,
        otherCharges
      },
      status: 'DRAFT', // Starts as DRAFT, routing to Finance team queue for approval & review
      lineItems: selectedLines.map(item => ({
        id: item.id,
        description: item.description,
        qty: item.qty,
        rate: item.rate,
        amount: item.amount,
        sourceLineItemId: item.sourceLineItemId
      })),
      subTotal,
      taxAmount,
      vatAmount,
      totalAmount: grandTotal
    });

    // Reset fields
    setShowNewModal(false);
    setSelectedEstimateIds([]);
    setInvoiceLineItems([]);
    setTaxRate(0);
    setVatRate(7);
    setOtherCharges(0);
  };

  // Editing helpers
  const handleStartEdit = (inv: Invoice) => {
    setEditingInvoice(inv);
    setEditingLineItems(inv.lineItems.map(li => ({
      id: li.id,
      description: li.description,
      qty: li.qty,
      rate: li.rate
    })));
    setEditingTaxRate(inv.paymentAdjustments.taxRate);
    setEditingVatRate(inv.paymentAdjustments.vatRate);
    setEditingOtherCharges(inv.paymentAdjustments.otherCharges);
    setEditingStatus(inv.status);
    setShowEditModal(true);
  };

  const handleEditLineItemChange = (idx: number, field: 'description' | 'qty' | 'rate', value: any) => {
    setEditingLineItems(prev => prev.map((item, i) => {
      if (i === idx) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleDeleteEditLine = (idx: number) => {
    setEditingLineItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddEditLine = () => {
    setEditingLineItems(prev => [
      ...prev,
      {
        id: `added-item-${Date.now()}`,
        description: 'Additional adjustment / item',
        qty: 1,
        rate: 0
      }
    ]);
  };

  // Calculation for Edit Modal sums
  const editSubTotal = editingLineItems.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.rate || 0)), 0);
  const editTaxAmount = (editSubTotal * editingTaxRate) / 100;
  const editVatAmount = (editSubTotal * editingVatRate) / 100;
  const editGrandTotal = editSubTotal + editTaxAmount + editVatAmount + editingOtherCharges;

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;
    if (editingLineItems.length === 0) {
      alert('The invoice must contain at least one line item.');
      return;
    }

    onUpdateInvoice(editingInvoice.id, {
      lineItems: editingLineItems.map(item => ({
        id: item.id,
        description: item.description,
        qty: Number(item.qty),
        rate: Number(item.rate),
        amount: Number(item.qty) * Number(item.rate)
      })),
      paymentAdjustments: {
        taxRate: editingTaxRate,
        vatRate: editingVatRate,
        otherCharges: editingOtherCharges
      },
      subTotal: editSubTotal,
      taxAmount: editTaxAmount,
      vatAmount: editVatAmount,
      totalAmount: editGrandTotal,
      status: editingStatus
    });

    setShowEditModal(false);
    setEditingInvoice(null);
  };

  const handleSyncInvoiceQBO = (invId: string) => {
    setSyncingId(invId);
    setTimeout(() => {
      onSyncQBO(invId, `QBO-INV-${Math.floor(Math.random() * 89999) + 10000}`);
      setSyncingId(null);
    }, 1500);
  };

  const handleShowTemplate = (inv: Invoice) => {
    const estId = inv.estimateIds[0];
    const est = estimates.find(e => e.id === estId);
    const proj = est ? projects.find(p => p.id === est.projectId) : null;
    const template = company.templates.invoiceTemplate || '';

    const currencySymbol = company.currency || 'BDT';
    const linesHTML = inv.lineItems.map(item => `
      <tr class="border-b">
        <td class="p-2">${item.description}</td>
        <td class="p-2 text-center">${item.qty}</td>
        <td class="p-2 text-right">${currencySymbol} ${item.rate.toLocaleString()}</td>
        <td class="p-2 text-right font-medium">${currencySymbol} ${(item.qty * item.rate).toLocaleString()}</td>
      </tr>
    `).join('');

    const populated = template
      .replace('{{companyName}}', company.name)
      .replace('{{invoiceId}}', inv.id)
      .replace('{{clientName}}', proj?.clientName || est?.clientName || 'N/A')
      .replace('{{bankName}}', company.bankDetails.bankName)
      .replace('{{accountNo}}', company.bankDetails.accountNo)
      .replace('{{lineItemsHTML}}', linesHTML)
      .replace('{{subTotal}}', `${currencySymbol} ${inv.subTotal.toLocaleString()}`)
      .replace('{{taxRate}}', inv.paymentAdjustments.taxRate.toString())
      .replace('{{taxAmount}}', `${currencySymbol} ${inv.taxAmount.toLocaleString()}`)
      .replace('{{vatRate}}', inv.paymentAdjustments.vatRate.toString())
      .replace('{{vatAmount}}', `${currencySymbol} ${inv.vatAmount.toLocaleString()}`)
      .replace('{{otherCharges}}', `${currencySymbol} ${inv.paymentAdjustments.otherCharges.toLocaleString()}`)
      .replace('{{totalAmount}}', `${currencySymbol} ${inv.totalAmount.toLocaleString()}`);

    setActivePreviewHTML(populated);
    setActivePreviewTitle(`Invoice: ${inv.id}`);
  };

  const handleSimulateUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptingInvId) return;
    const inv = invoices.find(i => i.id === receiptingInvId);
    if (inv) {
      inv.financeReceiptCopyUrl = simulatedReceiptUrl || 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3';
      inv.receiptDate = new Date().toISOString().split('T')[0];
    }
    setReceiptingInvId(null);
    setSimulatedReceiptUrl('');
  };

  return (
    <div id="invoices-module" className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 tracking-tight">Invoice Management</h2>
          <p className="text-sm text-zinc-500 mt-1">CS commercial invoice engine, tax, VAT edits, and finance review dashboards</p>
        </div>
        {canCreate && (
          <button
            onClick={() => {
              setSelectedEstimateIds([]);
              setInvoiceLineItems([]);
              setShowNewModal(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Generate Invoice
          </button>
        )}
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse" style={{ tableLayout: 'fixed', minWidth: tableMinWidth }}>
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-600 font-semibold text-xs uppercase tracking-wider select-none">
                <th className="p-4 relative group" style={{ width: colWidths.ref }}>
                  <span className="truncate block pr-2">Invoice Ref</span>
                  <div
                    onMouseDown={(e) => handleMouseDown('ref', e)}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-400 bg-transparent active:bg-indigo-600 transition-colors z-10 select-none border-r border-zinc-200/50"
                  />
                </th>
                <th className="p-4 relative group" style={{ width: colWidths.estimates }}>
                  <span className="truncate block pr-2">Linked Estimate(s)</span>
                  <div
                    onMouseDown={(e) => handleMouseDown('estimates', e)}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-400 bg-transparent active:bg-indigo-600 transition-colors z-10 select-none border-r border-zinc-200/50"
                  />
                </th>
                <th className="p-4 text-right relative group" style={{ width: colWidths.subtotal }}>
                  <span className="truncate block pr-2">Subtotal</span>
                  <div
                    onMouseDown={(e) => handleMouseDown('subtotal', e)}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-400 bg-transparent active:bg-indigo-600 transition-colors z-10 select-none border-r border-zinc-200/50"
                  />
                </th>
                <th className="p-4 text-right relative group" style={{ width: colWidths.adjustments }}>
                  <span className="truncate block pr-2">Adjustments (VAT)</span>
                  <div
                    onMouseDown={(e) => handleMouseDown('adjustments', e)}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-400 bg-transparent active:bg-indigo-600 transition-colors z-10 select-none border-r border-zinc-200/50"
                  />
                </th>
                <th className="p-4 text-right relative group" style={{ width: colWidths.grandTotal }}>
                  <span className="truncate block pr-2">Grand Total</span>
                  <div
                    onMouseDown={(e) => handleMouseDown('grandTotal', e)}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-400 bg-transparent active:bg-indigo-600 transition-colors z-10 select-none border-r border-zinc-200/50"
                  />
                </th>
                <th className="p-4 text-center relative group" style={{ width: colWidths.receipt }}>
                  <span className="truncate block px-2">Receipt File</span>
                  <div
                    onMouseDown={(e) => handleMouseDown('receipt', e)}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-400 bg-transparent active:bg-indigo-600 transition-colors z-10 select-none border-r border-zinc-200/50"
                  />
                </th>
                <th className="p-4 text-center relative group" style={{ width: colWidths.sync }}>
                  <span className="truncate block px-2">Intuit Sync</span>
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
                <th className="p-4 text-right relative group" style={{ width: colWidths.actions }}>
                  <span className="truncate block pr-2">Actions</span>
                  <div
                    onMouseDown={(e) => handleMouseDown('actions', e)}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-400 bg-transparent active:bg-indigo-600 transition-colors z-10 select-none"
                  />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-zinc-400 italic">No invoices issued yet.</td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const isPaid = inv.status === 'PAID';
                  const isSent = inv.status === 'SENT';
                  const isDraft = inv.status === 'DRAFT';
                  return (
                    <tr key={inv.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="p-4 font-mono font-bold text-zinc-900 truncate whitespace-nowrap" title={inv.id}>{inv.id}</td>
                      <td className="p-4 font-mono text-xs truncate whitespace-nowrap" title={inv.estimateIds.join(', ')}>
                        <div className="flex flex-nowrap gap-1 overflow-hidden select-none">
                          {inv.estimateIds.map(estId => (
                            <span key={estId} className="bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 text-[10px] font-semibold shrink-0">
                              {estId}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-right font-medium truncate whitespace-nowrap" title={`${company.currency || 'BDT'} ${inv.subTotal.toLocaleString()}`}>{company.currency || 'BDT'} {inv.subTotal.toLocaleString()}</td>
                      <td className="p-4 text-right text-xs text-zinc-500 truncate whitespace-nowrap" title={`VAT: ${inv.paymentAdjustments.vatRate}% (+${company.currency || 'BDT'} ${inv.vatAmount.toLocaleString()})`}>
                        <div className="truncate font-semibold">VAT: {inv.paymentAdjustments.vatRate}% (+{inv.vatAmount.toLocaleString()})</div>
                      </td>
                      <td className="p-4 text-right font-bold text-zinc-900 truncate whitespace-nowrap" title={`${company.currency || 'BDT'} ${inv.totalAmount.toLocaleString()}`}>{company.currency || 'BDT'} {inv.totalAmount.toLocaleString()}</td>
                      <td className="p-4 text-center truncate whitespace-nowrap">
                        {inv.financeReceiptCopyUrl ? (
                          <a
                            href={inv.financeReceiptCopyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline font-medium select-none"
                          >
                            <span className="truncate">View Receipt</span>
                          </a>
                        ) : (
                          <button
                            onClick={() => setReceiptingInvId(inv.id)}
                            className="px-2 py-1 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded text-xs text-zinc-600 inline-flex items-center gap-1 cursor-pointer select-none"
                          >
                            <UploadCloud className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Upload File</span>
                          </button>
                        )}
                      </td>
                      <td className="p-4 text-center truncate whitespace-nowrap">
                        {inv.qboId ? (
                          <div className="text-emerald-700 font-mono text-xs flex items-center justify-center gap-1 font-semibold truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                            <span className="truncate">Synced ({inv.qboId})</span>
                          </div>
                        ) : (inv.status !== 'DRAFT' && inv.status !== 'CANCELLED' && !!inv.financeReceiptCopyUrl) ? (
                          <button
                            disabled={syncingId !== null}
                            onClick={() => handleSyncInvoiceQBO(inv.id)}
                            className="px-2.5 py-1 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded border border-zinc-300 inline-flex items-center gap-1 cursor-pointer disabled:opacity-50 select-none"
                          >
                            {syncingId === inv.id ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin shrink-0" /> <span className="truncate">Syncing...</span>
                              </>
                            ) : (
                              <span className="truncate">Sync Intuit</span>
                            )}
                          </button>
                        ) : (
                          <span className="text-zinc-400 font-sans text-xs select-none">—</span>
                        )}
                      </td>
                      <td className="p-4 text-center truncate whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-0.5 text-xs rounded-full font-semibold border truncate max-w-full ${
                          isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          isSent ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          isDraft ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-zinc-50 text-zinc-700 border-zinc-200'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-4 text-right truncate whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleShowTemplate(inv)}
                            className="p-1.5 hover:bg-zinc-100 text-zinc-600 hover:text-indigo-600 rounded-lg cursor-pointer transition-colors"
                            title="Render/Print Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isFinanceOrAdmin && (
                            <button
                              onClick={() => handleStartEdit(inv)}
                              className="p-1.5 hover:bg-zinc-100 text-zinc-600 hover:text-emerald-600 rounded-lg cursor-pointer transition-colors"
                              title="Review, Edit and Adjust Invoice"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* HTML invoice rendering Modal */}
      {activePreviewHTML && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-scale-in">
            <div className="px-5 py-4 bg-zinc-50 border-b border-zinc-100 flex justify-between items-center">
              <h3 className="font-semibold text-zinc-900">{activePreviewTitle}</h3>
              <button onClick={() => setActivePreviewHTML(null)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer text-lg">✕</button>
            </div>
            <div className="p-6 max-h-[500px] overflow-y-auto bg-zinc-50">
              <div className="bg-white shadow-sm p-6" dangerouslySetInnerHTML={{ __html: activePreviewHTML }} />
            </div>
            <div className="p-4 border-t border-zinc-100 flex justify-end gap-3 bg-zinc-50">
              <button
                onClick={() => {
                  const printWin = window.open('', '_blank');
                  if (printWin) {
                    printWin.document.write(`<html><head><title>${activePreviewTitle}</title><script src="https://cdn.tailwindcss.com"></script></head><body class="p-6">${activePreviewHTML}</body></html>`);
                    printWin.document.close();
                    setTimeout(() => printWin.print(), 800);
                  }
                }}
                className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Send to Printer
              </button>
              <button
                onClick={() => setActivePreviewHTML(null)}
                className="px-3.5 py-1.5 border border-zinc-300 hover:bg-zinc-100 text-zinc-700 rounded-lg text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Image Upload Modal */}
      {receiptingInvId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-2xl max-w-sm w-full p-5 animate-scale-in">
            <h3 className="font-semibold text-zinc-900 mb-2 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-indigo-600" />
              Upload Finance Receipt Scan
            </h3>
            <p className="text-xs text-zinc-500 mb-3">Simulates linking a secure receipt image file.</p>
            <form onSubmit={handleSimulateUpload} className="space-y-3">
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1">Image URL Address</label>
                <input
                  type="url"
                  required
                  value={simulatedReceiptUrl}
                  onChange={(e) => setSimulatedReceiptUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full p-2 border border-zinc-300 rounded text-xs bg-white focus:outline-hidden"
                />
              </div>
              <div className="text-[10px] text-zinc-400 leading-relaxed italic bg-zinc-50 p-2 rounded border border-zinc-100">
                Tip: Leave as default or input any image URL to represent your digital transaction scan.
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setReceiptingInvId(null)}
                  className="px-3 py-1.5 border border-zinc-300 hover:bg-zinc-50 rounded-lg text-xs text-zinc-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Confirm Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Invoice Modal (Supports Multi-Estimates and Items Selection) */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-2xl max-w-4xl w-full my-8 overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-5 py-4 bg-zinc-50 border-b border-zinc-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-bold text-zinc-900">Generate Commercial Invoice</h3>
                  <p className="text-xs text-zinc-400">Combine estimates, filter lines, adjust quantity & rates</p>
                </div>
              </div>
              <button 
                onClick={() => setShowNewModal(false)} 
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer text-lg p-1 hover:bg-zinc-100 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="flex-1 overflow-y-auto flex flex-col min-h-0">
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                {/* Checklist of Approved/Active Estimates */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                    Step 1: Select Estimates to Combine ({selectedEstimateIds.length} Selected)
                  </label>
                  {availableEstimates.length === 0 ? (
                    <div className="p-4 bg-amber-50 text-amber-800 text-xs rounded-lg border border-amber-100 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      No client-approved or CS manager approved estimates were found. You can still select from any active estimates below.
                    </div>
                  ) : null}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[160px] overflow-y-auto border border-zinc-200 rounded-lg p-3 bg-zinc-50/50">
                    {estimates.map(est => {
                      const proj = projects.find(p => p.id === est.projectId);
                      const isSelected = selectedEstimateIds.includes(est.id);
                      return (
                        <label 
                          key={est.id} 
                          className={`flex items-start gap-2.5 p-2 rounded-lg border transition-all cursor-pointer text-xs ${
                            isSelected 
                              ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900' 
                              : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                          }`}
                        >
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => handleToggleEstimate(est.id)}
                            className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="font-bold flex justify-between items-center">
                              <span>Ref: {est.id}</span>
                              <span className="text-zinc-500">{company.currency || 'BDT'} {est.totalAmount.toLocaleString()}</span>
                            </div>
                            <div className="text-[10px] text-zinc-500 mt-0.5">
                              {proj?.name || est.clientName || 'Unnamed client'}
                            </div>
                            <div className="mt-1 flex items-center gap-1.5">
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                                est.clientStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {est.clientStatus}
                              </span>
                              {est.csManagerApproved && (
                                <span className="bg-blue-50 text-blue-800 text-[9px] px-1 py-0.2 rounded font-semibold border border-blue-100">
                                  CS Mgr OK
                                </span>
                              )}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Combined Line Items Table with adjustments */}
                {selectedEstimateIds.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                      Step 2: Filter Selected Line Items & Adjust Qty/Rate
                    </label>

                    <div className="border border-zinc-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-bold">
                            <th className="p-2.5 text-center w-12">Include</th>
                            <th className="p-2.5">Source Ref</th>
                            <th className="p-2.5">Item Description</th>
                            <th className="p-2.5 text-center w-24">Qty</th>
                            <th className="p-2.5 text-right w-28">Rate ({company.currency || 'BDT'})</th>
                            <th className="p-2.5 text-right w-28">Total ({company.currency || 'BDT'})</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {invoiceLineItems.map(item => (
                            <tr key={item.id} className={`hover:bg-zinc-50/50 ${!item.isSelected ? 'opacity-50 bg-zinc-50/30' : ''}`}>
                              <td className="p-2.5 text-center">
                                <input 
                                  type="checkbox"
                                  checked={item.isSelected}
                                  onChange={(e) => handleLineItemChange(item.id, 'isSelected', e.target.checked)}
                                  className="rounded text-indigo-600 cursor-pointer"
                                />
                              </td>
                              <td className="p-2.5 font-mono text-[10px] text-zinc-500">
                                {item.sourceEstimateId}
                              </td>
                              <td className="p-1.5">
                                <input 
                                  type="text"
                                  value={item.description}
                                  disabled={!item.isSelected}
                                  onChange={(e) => handleLineItemChange(item.id, 'description', e.target.value)}
                                  className="w-full p-1 border border-zinc-200 rounded bg-white text-xs disabled:bg-zinc-50 focus:outline-hidden"
                                />
                              </td>
                              <td className="p-1.5">
                                <input 
                                  type="number"
                                  min={0}
                                  step="any"
                                  disabled={!item.isSelected}
                                  value={item.qty}
                                  onChange={(e) => handleLineItemChange(item.id, 'qty', Number(e.target.value))}
                                  className="w-full p-1 border border-zinc-200 rounded text-center text-xs bg-white disabled:bg-zinc-50 focus:outline-hidden"
                                />
                              </td>
                              <td className="p-1.5">
                                <input 
                                  type="number"
                                  min={0}
                                  step="any"
                                  disabled={!item.isSelected}
                                  value={item.rate}
                                  onChange={(e) => handleLineItemChange(item.id, 'rate', Number(e.target.value))}
                                  className="w-full p-1 border border-zinc-200 rounded text-right text-xs bg-white disabled:bg-zinc-50 focus:outline-hidden"
                                />
                              </td>
                              <td className="p-2.5 text-right font-semibold text-zinc-800">
                                {company.currency || 'BDT'} {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Adjustments: VAT and Other Charges */}
                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">VAT Rate (%)</label>
                    <input 
                      type="number"
                      min={0}
                      value={vatRate}
                      onChange={(e) => setVatRate(Number(e.target.value))}
                      className="w-full max-w-xs p-2 bg-white border border-zinc-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                {/* Invoice calculations display card */}
                <div className="flex justify-end pt-4">
                  <div className="w-full max-w-sm bg-zinc-900 text-white p-4 rounded-xl space-y-2.5 border-b border-zinc-800 pb-2">
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>Invoiced Subtotal:</span>
                      <span className="font-mono">{company.currency || 'BDT'} {subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>Government VAT ({vatRate}%):</span>
                      <span className="font-mono">+{company.currency || 'BDT'} {vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold pt-1 border-t border-zinc-800">
                      <span className="text-indigo-400">Estimated Grand Total:</span>
                      <span className="font-mono text-indigo-400">{company.currency || 'BDT'} {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="px-5 py-4 bg-zinc-50 border-t border-zinc-150 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedEstimateIds.length === 0 || selectedLines.length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Generate Invoice Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review, Edit and Adjust Invoice Modal (For Finance Team Queue) */}
      {showEditModal && editingInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-2xl max-w-4xl w-full my-8 overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 bg-zinc-50 border-b border-zinc-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-zinc-900">Finance Review & Adjust: {editingInvoice.id}</h3>
                  <p className="text-xs text-zinc-400">Modify description, edit rates, adjust quantities, tax, and status</p>
                </div>
              </div>
              <button 
                onClick={() => setShowEditModal(false)} 
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer text-lg p-1 hover:bg-zinc-100 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto flex flex-col min-h-0">
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                
                {/* Warning header for compliance and auditing */}
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-100 flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Finance Control Compliance</strong>
                    You are editing an active commercial invoice. Any changes to quantities, rates, or surcharge adjustments will automatically recalibrate the grand total and sync onto downstream general ledger reports upon saved changes.
                  </div>
                </div>

                {/* Line Items List */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                      Invoice Line Scopes ({editingLineItems.length} lines)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddEditLine}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Add custom charge
                    </button>
                  </div>

                  <div className="border border-zinc-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-bold">
                          <th className="p-2.5">Line Description</th>
                          <th className="p-2.5 text-center w-24">Qty</th>
                          <th className="p-2.5 text-right w-28">Rate ({company.currency || 'BDT'})</th>
                          <th className="p-2.5 text-right w-28">Total ({company.currency || 'BDT'})</th>
                          <th className="p-2.5 text-center w-12">Delete</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {editingLineItems.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-zinc-50/50">
                            <td className="p-1.5">
                              <input 
                                type="text"
                                required
                                value={item.description}
                                onChange={(e) => handleEditLineItemChange(idx, 'description', e.target.value)}
                                className="w-full p-1 border border-zinc-200 rounded bg-white text-xs focus:outline-hidden"
                              />
                            </td>
                            <td className="p-1.5">
                              <input 
                                type="number"
                                min={0}
                                step="any"
                                required
                                value={item.qty}
                                onChange={(e) => handleEditLineItemChange(idx, 'qty', Number(e.target.value))}
                                className="w-full p-1 border border-zinc-200 rounded text-center text-xs bg-white focus:outline-hidden"
                              />
                            </td>
                            <td className="p-1.5">
                              <input 
                                type="number"
                                min={0}
                                step="any"
                                required
                                value={item.rate}
                                onChange={(e) => handleEditLineItemChange(idx, 'rate', Number(e.target.value))}
                                className="w-full p-1 border border-zinc-200 rounded text-right text-xs bg-white focus:outline-hidden"
                              />
                            </td>
                            <td className="p-2.5 text-right font-semibold text-zinc-800 font-mono">
                              {company.currency || 'BDT'} {(Number(item.qty || 0) * Number(item.rate || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-1.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteEditLine(idx)}
                                className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg cursor-pointer"
                                title="Remove line item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Edit Adjustments */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">VAT rate (%)</label>
                    <input 
                      type="number"
                      min={0}
                      value={editingVatRate}
                      onChange={(e) => setEditingVatRate(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-zinc-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Invoice Status</label>
                    <select
                      value={editingStatus}
                      onChange={(e) => setEditingStatus(e.target.value as Invoice['status'])}
                      className="w-full p-2 bg-white border border-zinc-300 rounded-lg text-sm focus:outline-hidden cursor-pointer"
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="SENT">SENT (Approved & Issued)</option>
                      <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                      <option value="PAID">PAID</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                </div>

                {/* Recalculated Card */}
                <div className="flex justify-end pt-4">
                  <div className="w-full max-w-sm bg-zinc-900 text-white p-4 rounded-xl space-y-2.5 border-b border-zinc-800 pb-2">
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>Recalculated Subtotal:</span>
                      <span className="font-mono">{company.currency || 'BDT'} {editSubTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>Adjusted VAT ({editingVatRate}%):</span>
                      <span className="font-mono">+{company.currency || 'BDT'} {editVatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold pt-1 border-t border-zinc-800">
                      <span className="text-emerald-400">Audited Grand Total:</span>
                      <span className="font-mono text-emerald-400">{company.currency || 'BDT'} {editGrandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

              </div>

              <div className="px-5 py-4 bg-zinc-50 border-t border-zinc-150 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer transition-all"
                >
                  Save Audited Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
