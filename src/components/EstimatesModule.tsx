/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Estimate, Project, User, EstimateLineItem, Company, Client, UserRole } from '../types';
import { FileText, Plus, Trash2, Eye, RefreshCw, CheckCircle, XCircle, Sparkles, Building, ChevronDown, ChevronUp, Pencil, ShieldAlert, Users, Check, Clock } from 'lucide-react';

interface EstimatesModuleProps {
  estimates: Estimate[];
  projects: Project[];
  currentUser: User;
  company: Company;
  clients: Client[];
  onCreateClient: (client: Omit<Client, 'id' | 'companyId' | 'isApproved' | 'createdBy'>) => void;
  onApproveClient: (clientId: string) => void;
  onCreateEstimate: (estimate: Omit<Estimate, 'id' | 'companyId' | 'createdAt'>) => void;
  onApproveEstimate: (estimateId: string, approverId: string) => void;
  onApproveFinanceEstimate?: (estimateId: string, approverId: string) => void;
  onRejectEstimate: (estimateId: string, notes: string) => void;
  onEditEstimate?: (estimateId: string, updatedData: Partial<Estimate>) => void;
  onSyncQBO: (estimateId: string, qboId: string) => void;
  onCreateProject?: (project: Omit<Project, 'companyId' | 'costIncurred' | 'revenueRecognized'> & { id?: string }) => void;
  onLinkProjectToEstimate?: (estimateId: string, projectId: string, selectedLineItemIds: string[]) => void;
  onConvertToInvoice?: (estimateId: string) => void;
}

export default function EstimatesModule({
  estimates,
  projects,
  currentUser,
  company,
  clients,
  onCreateClient,
  onApproveClient,
  onCreateEstimate,
  onApproveEstimate,
  onApproveFinanceEstimate,
  onRejectEstimate,
  onEditEstimate,
  onSyncQBO,
  onCreateProject,
  onLinkProjectToEstimate,
  onConvertToInvoice
}: EstimatesModuleProps) {
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingEst, setEditingEst] = useState<Estimate | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedClientName, setSelectedClientName] = useState('');

  // States for creating project from estimate
  const [showCreateProjModal, setShowCreateProjModal] = useState(false);
  const [activeEstForProj, setActiveEstForProj] = useState<Estimate | null>(null);
  const [newProjName, setNewProjName] = useState('');
  const [newProjStartDate, setNewProjStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newProjEndDate, setNewProjEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split('T')[0];
  });
  const [selectedLineItemIds, setSelectedLineItemIds] = useState<string[]>([]);
  const [lineItems, setLineItems] = useState<Omit<EstimateLineItem, 'id' | 'projectId'>[]>([
    { description: '', qty: 1, rate: 0, amount: 0 }
  ]);

  const [activeSubTab, setActiveSubTab] = useState<'estimates' | 'clients'>('estimates');
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');

  const [activePreviewHTML, setActivePreviewHTML] = useState<string | null>(null);
  const [activePreviewTitle, setActivePreviewTitle] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [expandedEstId, setExpandedEstId] = useState<string | null>(null);
  const [showPreviewInModal, setShowPreviewInModal] = useState(true);

  // Column width resizing state and handler
  const [colWidths, setColWidths] = useState<Record<string, number>>({
    expand: 50,
    ref: 120,
    project: 200,
    amount: 140,
    csApproved: 150,
    financeApproved: 150,
    status: 140,
    qbo: 150,
    actions: 180,
  });

  const handleMouseDown = (colKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = colWidths[colKey] || 150;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      setColWidths(prev => ({
        ...prev,
        [colKey]: Math.max(40, startWidth + deltaX)
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

  const canCreate = ['CS_USER', 'CS_MANAGER', 'ADMIN'].includes(currentUser.role);
  const canApproveCS = ['CS_MANAGER', 'ADMIN'].includes(currentUser.role);
  const canApproveFinance = ['FINANCE_MANAGER', 'ADMIN'].includes(currentUser.role);

  const recalculateLineItems = (items: any[]): any[] => {
    return items.map((item, idx) => {
      const isAgencyFee = !!item.isAgencyFee;
      const vatRate = item.vatRate !== undefined ? item.vatRate : 15;
      
      if (isAgencyFee) {
        const agencyFeeRate = item.agencyFeeRate ?? 10;
        const selectedIndices = item.selectedLineIndices || [];
        
        // Sum amount of selected items from ABOVE (only indices less than current index)
        const sumPreceding = selectedIndices.reduce((acc: number, selectedIdx: number) => {
          if (selectedIdx < idx && items[selectedIdx]) {
            return acc + (items[selectedIdx].amount || 0);
          }
          return acc;
        }, 0);
        
        const rate = sumPreceding * (agencyFeeRate / 100);
        const qty = 1;
        const amount = rate * qty;
        const vatAmount = amount * (vatRate / 100);
        const grandTotal = amount + vatAmount;
        
        // Ensure description contains the breakdown details
        let autoDescription = item.description;
        if (!autoDescription || autoDescription === '' || autoDescription.startsWith('Agency Fee (')) {
          // Find description names of selected indices
          const selectedNames = selectedIndices
            .filter((selectedIdx: number) => selectedIdx < idx && items[selectedIdx])
            .map((selectedIdx: number) => items[selectedIdx].description || `Line ${selectedIdx + 1}`)
            .join(', ');
          
          if (selectedNames) {
            autoDescription = `Agency Fee (${agencyFeeRate}% on: ${selectedNames})`;
          } else {
            autoDescription = `Agency Fee (${agencyFeeRate}%)`;
          }
        }
        
        return {
          ...item,
          qty,
          rate,
          amount,
          vatRate,
          vatAmount,
          grandTotal,
          description: autoDescription,
          agencyFeeRate,
          selectedLineIndices: selectedIndices
        };
      } else {
        const qty = item.qty !== undefined ? item.qty : 1;
        const rate = item.rate !== undefined ? item.rate : 0;
        const amount = qty * rate;
        const vatAmount = amount * (vatRate / 100);
        const grandTotal = amount + vatAmount;
        
        return {
          ...item,
          qty,
          rate,
          amount,
          vatRate,
          vatAmount,
          grandTotal
        };
      }
    });
  };

  const handleAddLine = () => {
    setLineItems([...lineItems, { description: '', qty: 1, rate: 0, amount: 0, vatRate: 15, vatAmount: 0, grandTotal: 0 }]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lineItems.length === 1) return;
    const filtered = lineItems.filter((_, i) => i !== idx);
    // Adjust indices for agency fee lines
    const adjusted = filtered.map(item => {
      if (item.isAgencyFee && item.selectedLineIndices) {
        const nextIndices = item.selectedLineIndices
          .filter(selectedIdx => selectedIdx !== idx) // remove the deleted one
          .map(selectedIdx => selectedIdx > idx ? selectedIdx - 1 : selectedIdx); // shift down those above
        return { ...item, selectedLineIndices: nextIndices };
      }
      return item;
    });
    setLineItems(recalculateLineItems(adjusted));
  };

  const handleLineChange = (idx: number, field: string, value: string | number | boolean) => {
    const updated = [...lineItems];
    const item = { ...updated[idx] };
    
    if (field === 'isAgencyFee') {
      const checked = !!value;
      item.isAgencyFee = checked;
      if (checked) {
        item.qty = 1;
        item.agencyFeeRate = item.agencyFeeRate ?? 10;
        // select all preceding items by default
        item.selectedLineIndices = Array.from({ length: idx }, (_, i) => i);
        item.description = ''; // Force regeneration of description
      } else {
        item.qty = 1;
        item.rate = 0;
        item.amount = 0;
        item.selectedLineIndices = [];
        item.description = '';
      }
    } else {
      (item as any)[field] = value;
    }
    
    updated[idx] = item;
    setLineItems(recalculateLineItems(updated));
  };

  const togglePrecedingLineSelection = (currentIdx: number, targetPrecedingIdx: number) => {
    const updated = [...lineItems];
    const item = { ...updated[currentIdx] };
    if (item.isAgencyFee) {
      const currentIndices = item.selectedLineIndices || [];
      if (currentIndices.includes(targetPrecedingIdx)) {
        item.selectedLineIndices = currentIndices.filter(i => i !== targetPrecedingIdx);
      } else {
        item.selectedLineIndices = [...currentIndices, targetPrecedingIdx];
      }
      updated[currentIdx] = item;
      setLineItems(recalculateLineItems(updated));
    }
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  };

  const calculateTotalVat = () => {
    return lineItems.reduce((acc, curr) => {
      const vatRate = curr.vatRate !== undefined ? curr.vatRate : 15;
      const vatAmount = curr.vatAmount !== undefined ? curr.vatAmount : (curr.amount * (vatRate / 100));
      return acc + vatAmount;
    }, 0);
  };

  const calculateGrandTotal = () => {
    return lineItems.reduce((acc, curr) => {
      const vatRate = curr.vatRate !== undefined ? curr.vatRate : 15;
      const vatAmount = curr.vatAmount !== undefined ? curr.vatAmount : (curr.amount * (vatRate / 100));
      const grandTotal = curr.grandTotal !== undefined ? curr.grandTotal : (curr.amount + vatAmount);
      return acc + grandTotal;
    }, 0);
  };

  const calculateTotal = () => {
    return calculateGrandTotal();
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientName) return;

    if (editingEst) {
      const itemsWithProject = lineItems.map((item, idx) => {
        const existingId = (editingEst.lineItems || [])[idx]?.id;
        return {
          ...item,
          id: existingId || `item-gen-${Date.now()}-${idx}`,
          projectId: (editingEst.lineItems || [])[idx]?.projectId || ''
        };
      });

      if (onEditEstimate) {
        onEditEstimate(editingEst.id, {
          clientName: selectedClientName,
          lineItems: itemsWithProject as any,
          totalAmount: calculateTotal()
        });
      }
      setEditingEst(null);
    } else {
      const itemsWithProject = lineItems.map((item, idx) => ({
        ...item,
        id: `item-gen-${Date.now()}-${idx}`,
        projectId: ''
      }));

      onCreateEstimate({
        projectId: '',
        clientName: selectedClientName,
        csUserId: currentUser.id,
        csManagerApproved: false,
        clientStatus: 'DRAFT',
        lineItems: itemsWithProject as any,
        totalAmount: calculateTotal(),
        financeApproved: false
      });
    }

    setLineItems([{ description: '', qty: 1, rate: 0, amount: 0, vatRate: 15, vatAmount: 0, grandTotal: 0 }]);
    setSelectedClientName('');
    setShowNewModal(false);
  };

  const handleStartEdit = (est: Estimate) => {
    setEditingEst(est);
    setSelectedClientName(est.clientName || '');
    setLineItems(est.lineItems.map(li => ({
      description: li.description,
      qty: li.qty,
      rate: li.rate,
      amount: li.amount,
      vatRate: li.vatRate !== undefined ? li.vatRate : 15,
      vatAmount: li.vatAmount !== undefined ? li.vatAmount : (li.amount * 0.15),
      grandTotal: li.grandTotal !== undefined ? li.grandTotal : (li.amount * 1.15),
      isAgencyFee: li.isAgencyFee || false,
      agencyFeeRate: li.agencyFeeRate || 10,
      selectedLineIndices: li.selectedLineIndices || []
    })));
    setShowNewModal(true);
  };

  const handleStartCreateProjectFromEstimate = (est: Estimate) => {
    setActiveEstForProj(est);
    setNewProjName(`${est.clientName || 'Client'} Project`);
    setSelectedLineItemIds((est.lineItems || []).map(li => li.id));
    setShowCreateProjModal(true);
  };

  const handleConfirmCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEstForProj || !onCreateProject || !onLinkProjectToEstimate) return;

    const selectedItems = (activeEstForProj.lineItems || []).filter(li => selectedLineItemIds.includes(li.id));
    const budgetSum = selectedItems.reduce((acc, curr) => {
      const vatRate = curr.vatRate !== undefined ? curr.vatRate : 15;
      const vatAmount = curr.vatAmount !== undefined ? curr.vatAmount : (curr.amount * (vatRate / 100));
      const grandTotal = curr.grandTotal !== undefined ? curr.grandTotal : (curr.amount + vatAmount);
      return acc + grandTotal;
    }, 0);

    const generatedProjectId = `proj-gen-${Date.now()}`;

    onCreateProject({
      id: generatedProjectId,
      name: newProjName,
      clientName: activeEstForProj.clientName || 'Unknown Client',
      budget: budgetSum,
      startDate: newProjStartDate,
      endDate: newProjEndDate
    });

    onLinkProjectToEstimate(activeEstForProj.id, generatedProjectId, selectedLineItemIds);

    setShowCreateProjModal(false);
    setActiveEstForProj(null);
  };

  const handleTriggerSync = (estId: string) => {
    setSyncingId(estId);
    setTimeout(() => {
      onSyncQBO(estId, `QBO-EST-${Math.floor(Math.random() * 8999) + 1000}`);
      setSyncingId(null);
    }, 1500);
  };

  const handleShowTemplate = (est: Estimate) => {
    const proj = projects.find(p => p.id === est.projectId);
    const client = clients.find(c => c.name.toLowerCase() === proj?.clientName.toLowerCase());
    const clientAddress = client ? client.address : 'No address on file';
    const template = company.templates.estimateTemplate || '';

    // Populate lines HTML
    const currencySymbol = company.currency || 'BDT';
    const linesHTML = est.lineItems.map(item => {
      const vatRate = item.vatRate !== undefined ? item.vatRate : 15;
      const vatAmount = item.vatAmount !== undefined ? item.vatAmount : (item.amount * (vatRate / 100));
      const grandTotal = item.grandTotal !== undefined ? item.grandTotal : (item.amount + vatAmount);
      return `
        <tr class="border-b">
          <td class="p-2">${item.description}</td>
          <td class="p-2 text-center">${item.qty}</td>
          <td class="p-2 text-right">${currencySymbol} ${item.rate.toLocaleString()}</td>
          <td class="p-2 text-right">${currencySymbol} ${item.amount.toLocaleString()}</td>
          <td class="p-2 text-right">${vatRate}%</td>
          <td class="p-2 text-right">${currencySymbol} ${vatAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
          <td class="p-2 text-right font-medium">${currencySymbol} ${grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        </tr>
      `;
    }).join('');

    // Estimate total should be calculated from line items grand total if not explicitly defined
    const grandTotalSum = est.lineItems.reduce((acc, item) => {
      const vatRate = item.vatRate !== undefined ? item.vatRate : 15;
      const vatAmount = item.vatAmount !== undefined ? item.vatAmount : (item.amount * (vatRate / 100));
      return acc + (item.grandTotal !== undefined ? item.grandTotal : (item.amount + vatAmount));
    }, 0);

    let populated = template
      .replace('{{companyName}}', company.name)
      .replace('{{estimateId}}', est.id)
      .replace('{{clientName}}', proj?.clientName || 'N/A')
      .replace('{{clientAddress}}', clientAddress)
      .replace('{{projectName}}', proj?.name || 'N/A')
      .replace('{{dateCreated}}', new Date(est.createdAt || Date.now()).toLocaleDateString())
      .replace('{{lineItemsHTML}}', linesHTML)
      .replace('{{totalAmount}}', `${currencySymbol} ${grandTotalSum.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);

    // Fallback if template doesn't contain {{clientAddress}} placeholder
    if (!template.includes('{{clientAddress}}')) {
      populated = populated.replace(
        `class="text-zinc-600 mt-1">${proj?.clientName || 'N/A'}</p>`,
        `class="text-zinc-600 mt-1">${proj?.clientName || 'N/A'}</p>\n      <p class="text-zinc-500 italic text-[11px]">${clientAddress}</p>`
      );
    }

    setActivePreviewHTML(populated);
    setActivePreviewTitle(`Estimate: ${est.id}`);
  };

  const getLivePreviewHTML = () => {
    const proj = projects.find(p => p.id === selectedProjectId);
    const client = clients.find(c => c.name.toLowerCase() === selectedClientName.toLowerCase()) || 
                   (proj ? clients.find(c => c.name.toLowerCase() === proj.clientName.toLowerCase()) : undefined);
    const clientAddress = client ? client.address : 'Select client to view address';
    const clientNameDisplay = selectedClientName || proj?.clientName || 'N/A';
    const template = company.templates.estimateTemplate || '';

    // Populate lines HTML
    const currencySymbol = company.currency || 'BDT';
    const linesHTML = lineItems.map(item => {
      const vatRate = item.vatRate !== undefined ? item.vatRate : 15;
      const vatAmount = item.vatAmount !== undefined ? item.vatAmount : (item.amount * (vatRate / 100));
      const grandTotal = item.grandTotal !== undefined ? item.grandTotal : (item.amount + vatAmount);
      return `
        <tr class="border-b">
          <td class="p-2">${item.description || '<span class="text-zinc-400 italic">No description</span>'}</td>
          <td class="p-2 text-center">${item.qty}</td>
          <td class="p-2 text-right">${currencySymbol} ${item.rate.toLocaleString()}</td>
          <td class="p-2 text-right">${currencySymbol} ${item.amount.toLocaleString()}</td>
          <td class="p-2 text-right">${vatRate}%</td>
          <td class="p-2 text-right">${currencySymbol} ${vatAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
          <td class="p-2 text-right font-medium">${currencySymbol} ${grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        </tr>
      `;
    }).join('');

    let populated = template
      .replace('{{companyName}}', company.name)
      .replace('{{estimateId}}', 'EST-DRAFT')
      .replace('{{clientName}}', clientNameDisplay)
      .replace('{{clientAddress}}', clientAddress)
      .replace('{{projectName}}', proj?.name || 'N/A')
      .replace('{{dateCreated}}', new Date().toLocaleDateString())
      .replace('{{lineItemsHTML}}', linesHTML)
      .replace('{{totalAmount}}', `${currencySymbol} ${calculateGrandTotal().toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);

    // Fallback if template doesn't contain {{clientAddress}} placeholder
    if (!template.includes('{{clientAddress}}')) {
      populated = populated.replace(
        `class="text-zinc-600 mt-1">${clientNameDisplay}</p>`,
        `class="text-zinc-600 mt-1">${clientNameDisplay}</p>\n      <p class="text-zinc-500 italic text-[11px]">${clientAddress}</p>`
      );
    }

    return populated;
  };

  const submitRejection = () => {
    if (!rejectingId) return;
    onRejectEstimate(rejectingId, rejectionNotes || 'Budget adjustments needed.');
    setRejectingId(null);
    setRejectionNotes('');
  };

  return (
    <div id="estimates-module" className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 tracking-tight">Estimate Management</h2>
          <p className="text-sm text-zinc-500 mt-1">CS team drafting and commercial workflow controls</p>
        </div>
        {canCreate && activeSubTab === 'estimates' && (
          <button
            onClick={() => {
              setSelectedProjectId('');
              setSelectedClientName('');
              setLineItems([{ description: '', qty: 1, rate: 0, amount: 0, vatRate: 15, vatAmount: 0, grandTotal: 0 }]);
              setShowNewModal(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm cursor-pointer"
          >
            Create Estimate
          </button>
        )}
        {activeSubTab === 'clients' && (
          <button
            onClick={() => {
              setNewClientName('');
              setNewClientAddress('');
              setShowNewClientModal(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 inline-block mr-1.5" />
            Add New Client
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200">
        <button
          onClick={() => setActiveSubTab('estimates')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'estimates'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Estimates Workbench
        </button>
        <button
          onClick={() => setActiveSubTab('clients')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'clients'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Client Partner Registry
          {clients.filter(c => !c.isApproved).length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
              {clients.filter(c => !c.isApproved).length} pending
            </span>
          )}
        </button>
      </div>

      {activeSubTab === 'estimates' ? (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse" style={{ tableLayout: 'fixed', minWidth: tableMinWidth }}>
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-600 font-semibold text-xs uppercase tracking-wider select-none">
                <th className="p-4 relative group" style={{ width: colWidths.expand }}>
                  <div
                    onMouseDown={(e) => handleMouseDown('expand', e)}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-400 bg-transparent active:bg-indigo-600 transition-colors z-10 select-none border-r border-zinc-200/50"
                  />
                </th>
                <th className="p-4 relative group" style={{ width: colWidths.ref }}>
                  <span className="truncate block pr-2">Estimate Ref</span>
                  <div
                    onMouseDown={(e) => handleMouseDown('ref', e)}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-400 bg-transparent active:bg-indigo-600 transition-colors z-10 select-none border-r border-zinc-200/50"
                  />
                </th>
                <th className="p-4 relative group" style={{ width: colWidths.project }}>
                  <span className="truncate block pr-2">Project</span>
                  <div
                    onMouseDown={(e) => handleMouseDown('project', e)}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-400 bg-transparent active:bg-indigo-600 transition-colors z-10 select-none border-r border-zinc-200/50"
                  />
                </th>
                <th className="p-4 text-right relative group" style={{ width: colWidths.amount }}>
                  <span className="truncate block pr-2">Total Amount</span>
                  <div
                    onMouseDown={(e) => handleMouseDown('amount', e)}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-400 bg-transparent active:bg-indigo-600 transition-colors z-10 select-none border-r border-zinc-200/50"
                  />
                </th>
                <th className="p-4 text-center relative group" style={{ width: colWidths.csApproved }}>
                  <span className="truncate block px-2">CS Mgr Approved</span>
                  <div
                    onMouseDown={(e) => handleMouseDown('csApproved', e)}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-400 bg-transparent active:bg-indigo-600 transition-colors z-10 select-none border-r border-zinc-200/50"
                  />
                </th>
                <th className="p-4 text-center relative group" style={{ width: colWidths.financeApproved }}>
                  <span className="truncate block px-2">Finance Approved</span>
                  <div
                    onMouseDown={(e) => handleMouseDown('financeApproved', e)}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-400 bg-transparent active:bg-indigo-600 transition-colors z-10 select-none border-r border-zinc-200/50"
                  />
                </th>
                <th className="p-4 text-center relative group" style={{ width: colWidths.status }}>
                  <span className="truncate block px-2">Live Status</span>
                  <div
                    onMouseDown={(e) => handleMouseDown('status', e)}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-400 bg-transparent active:bg-indigo-600 transition-colors z-10 select-none border-r border-zinc-200/50"
                  />
                </th>
                <th className="p-4 text-center relative group" style={{ width: colWidths.qbo }}>
                  <span className="truncate block px-2">QuickBooks Sync</span>
                  <div
                    onMouseDown={(e) => handleMouseDown('qbo', e)}
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
              {estimates.map((est) => {
                const proj = projects.find(p => p.id === est.projectId);
                const isExpanded = expandedEstId === est.id;
                
                // Determine Live Status Display
                const isFullyApproved = est.csManagerApproved && est.financeApproved;
                const displayStatus = est.clientStatus === 'REJECTED' ? 'REJECTED' : 
                                      isFullyApproved ? 'APPROVED' : 'AWAITING APPROVAL';

                return (
                  <React.Fragment key={est.id}>
                    <tr className="hover:bg-zinc-50/50 transition-colors">
                      <td className="p-4 text-center truncate whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setExpandedEstId(isExpanded ? null : est.id)}
                          className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer select-none"
                          title={isExpanded ? "Hide Line Scopes" : "Show Line Scopes"}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-600" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="p-4 font-mono font-bold text-zinc-900 truncate whitespace-nowrap" title={est.id}>{est.id}</td>
                      <td className="p-4 truncate whitespace-nowrap" title={proj ? `${proj.name} - ${proj.clientName}` : "No Project Assigned"}>
                        {proj ? (
                          <>
                            <div className="font-medium text-zinc-900 truncate">{proj.name}</div>
                            <div className="text-xs text-zinc-500 truncate">{proj.clientName}</div>
                          </>
                        ) : (
                          <div className="flex flex-col gap-1 items-start truncate">
                            <span className="text-xs text-zinc-400 italic font-medium truncate">No Project Assigned</span>
                            {onCreateProject && onLinkProjectToEstimate && (
                              <button
                                onClick={() => handleStartCreateProjectFromEstimate(est)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-500 bg-indigo-50 hover:bg-indigo-100/80 px-2 py-0.5 rounded border border-indigo-100 transition-colors cursor-pointer select-none"
                              >
                                <Plus className="w-2.5 h-2.5 shrink-0" /> <span className="truncate">Create Project</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right font-semibold text-zinc-900 truncate whitespace-nowrap" title={`${company.currency || 'BDT'} ${est.totalAmount.toLocaleString()}`}>{company.currency || 'BDT'} {est.totalAmount.toLocaleString()}</td>
                      
                      {/* CS Mgr Approved Column */}
                      <td className="p-4 text-center truncate whitespace-nowrap">
                        {est.csManagerApproved ? (
                          <span className={`inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full font-medium truncate max-w-full`}>
                            <CheckCircle className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Approved</span>
                          </span>
                        ) : est.clientStatus === 'REJECTED' ? (
                          <span className={`inline-flex items-center gap-1 text-xs text-rose-700 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-full font-medium truncate max-w-full`}>
                            <XCircle className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Rejected by CS</span>
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full font-medium truncate max-w-full`}>
                            <span className="truncate">Pending CS Mgr</span>
                          </span>
                        )}
                      </td>
 
                      {/* Finance Approved Column */}
                      <td className="p-4 text-center truncate whitespace-nowrap">
                        {est.financeApproved ? (
                          <span className={`inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full font-medium truncate max-w-full`}>
                            <CheckCircle className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Approved</span>
                          </span>
                        ) : est.clientStatus === 'REJECTED' ? (
                          <span className={`inline-flex items-center gap-1 text-xs text-rose-700 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-full font-medium truncate max-w-full`}>
                            <XCircle className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Rejected</span>
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full font-medium truncate max-w-full`}>
                            <span className="truncate">Pending Finance</span>
                          </span>
                        )}
                      </td>
 
                      {/* Live Status Column */}
                      <td className="p-4 text-center truncate whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-0.5 text-xs rounded-full font-semibold border truncate max-w-full ${
                          displayStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          displayStatus === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {displayStatus}
                        </span>
                        {est.rejectionNotes && est.clientStatus === 'REJECTED' && (
                          <div className="text-[10px] text-rose-600 mt-1 italic font-medium truncate max-w-full" title={est.rejectionNotes}>
                            "{est.rejectionNotes}"
                          </div>
                        )}
                      </td>
 
                      {/* QuickBooks Sync Column */}
                      <td className="p-4 text-center truncate whitespace-nowrap">
                        {est.qboId ? (
                          <div className="text-emerald-700 font-mono text-xs flex items-center justify-center gap-1 font-semibold truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                            <span className="truncate">Synced ({est.qboId})</span>
                          </div>
                        ) : displayStatus === 'APPROVED' ? (
                          <button
                            disabled={syncingId !== null}
                            onClick={() => handleTriggerSync(est.id)}
                            className="px-2.5 py-1 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded border border-zinc-300 inline-flex items-center gap-1 cursor-pointer disabled:opacity-50 transition-colors select-none"
                          >
                            {syncingId === est.id ? (
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
 
                      {/* Actions Column */}
                      <td className="p-4 text-right truncate whitespace-nowrap">
                        <div className="flex justify-end items-center gap-1.5">
                          <button
                            onClick={() => handleShowTemplate(est)}
                            className="p-1.5 hover:bg-zinc-100 text-zinc-600 hover:text-indigo-600 rounded-lg cursor-pointer transition-colors"
                            title="Print/Preview Proposal"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {onConvertToInvoice && (
                            <button
                              onClick={() => onConvertToInvoice(est.id)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 rounded text-xs font-semibold cursor-pointer transition-colors border border-indigo-150 inline-flex items-center gap-1"
                              title="Convert this estimate into a commercial invoice"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              Convert to Invoice
                            </button>
                          )}

                          {canCreate && (
                            <button
                              onClick={() => handleStartEdit(est)}
                              className="p-1.5 hover:bg-zinc-100 text-zinc-600 hover:text-indigo-600 rounded-lg cursor-pointer transition-colors"
                              title="Edit Proposal Scope"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}

                          {est.clientStatus !== 'REJECTED' && (
                            <>
                              {/* CS Mgr Approval button */}
                              {!est.csManagerApproved && canApproveCS && (
                                <button
                                  onClick={() => onApproveEstimate(est.id, currentUser.id)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold cursor-pointer transition-colors"
                                  title="CS Manager Approve"
                                >
                                  Approve CS
                                </button>
                              )}

                              {/* Finance Approval button */}
                              {!est.financeApproved && canApproveFinance && onApproveFinanceEstimate && (
                                <button
                                  onClick={() => onApproveFinanceEstimate(est.id, currentUser.id)}
                                  className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-semibold cursor-pointer transition-colors"
                                  title="Finance Approve"
                                >
                                  Approve Finance
                                </button>
                              )}

                              {/* Reject button */}
                              {(!est.csManagerApproved || !est.financeApproved) && (canApproveCS || canApproveFinance) && (
                                <button
                                  onClick={() => setRejectingId(est.id)}
                                  className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold cursor-pointer transition-colors"
                                  title="Reject Proposal"
                                >
                                  Reject
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Collapsible Line Items ("Line Scope") Preview row */}
                    {isExpanded && (
                      <tr className="bg-zinc-50/40">
                        <td colSpan={9} className="p-4 border-t border-zinc-100">
                          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs">
                            <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-100">
                              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-500" /> 
                                Line Items Scope Preview
                              </h4>
                              <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded font-mono font-medium">
                                {est.lineItems?.length || 0} items
                              </span>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="border-b border-zinc-100 text-zinc-400 uppercase tracking-wider text-[10px]">
                                    <th className="pb-2 font-semibold">Scope Description</th>
                                    <th className="pb-2 text-center font-semibold w-24">Qty</th>
                                    <th className="pb-2 text-right font-semibold w-36">Rate</th>
                                    <th className="pb-2 text-right font-semibold w-36">Net Subtotal</th>
                                    <th className="pb-2 text-center font-semibold w-24">VAT Rate</th>
                                    <th className="pb-2 text-right font-semibold w-36">VAT Amount</th>
                                    <th className="pb-2 text-right font-semibold w-36">Grand Total</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-50 text-zinc-600">
                                  {(est.lineItems || []).map((item, idx) => {
                                    const vatRate = item.vatRate !== undefined ? item.vatRate : 15;
                                    const vatAmount = item.vatAmount !== undefined ? item.vatAmount : (item.amount * (vatRate / 100));
                                    const grandTotal = item.grandTotal !== undefined ? item.grandTotal : (item.amount + vatAmount);
                                    return (
                                      <tr key={item.id || idx} className="hover:bg-zinc-50/20">
                                        <td className="py-2.5 font-medium text-zinc-800">{item.description || <span className="text-zinc-400 italic font-normal">No description provided</span>}</td>
                                        <td className="py-2.5 text-center font-mono">{item.qty}</td>
                                        <td className="py-2.5 text-right font-mono">{company.currency || 'BDT'} {item.rate.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                        <td className="py-2.5 text-right font-mono">{company.currency || 'BDT'} {item.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                        <td className="py-2.5 text-center font-mono">{vatRate}%</td>
                                        <td className="py-2.5 text-right text-zinc-500 font-mono">{company.currency || 'BDT'} {vatAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                        <td className="py-2.5 text-right font-bold text-zinc-900 font-mono">{company.currency || 'BDT'} {grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Client Partner Registry</h3>
              <p className="text-xs text-zinc-500 mt-0.5">CS team logs client onboarding requests. Finance managers verify and sign off.</p>
            </div>
            {canCreate && (
              <button
                onClick={() => {
                  setNewClientName('');
                  setNewClientAddress('');
                  setShowNewClientModal(true);
                }}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Onboard New Client
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-600 font-semibold text-xs uppercase tracking-wider">
                  <th className="p-4">Client Name</th>
                  <th className="p-4">Billing Address</th>
                  <th className="p-4">Created By</th>
                  <th className="p-4 text-center">Verification Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-400 italic">No client accounts registered. Click Onboard New Client to begin.</td>
                  </tr>
                ) : (
                  clients.map((client) => {
                    const isApproved = client.isApproved;
                    return (
                      <tr key={client.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="p-4 font-semibold text-zinc-900">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-zinc-400" />
                            {client.name}
                          </div>
                        </td>
                        <td className="p-4 text-zinc-600 max-w-xs truncate" title={client.address}>
                          {client.address}
                        </td>
                        <td className="p-4 text-xs font-mono text-zinc-500">
                          {client.createdBy || 'System Preset'}
                        </td>
                        <td className="p-4 text-center">
                          {isApproved ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full font-medium">
                              <Check className="w-3.5 h-3.5" /> Approved by {client.approvedBy || 'Finance Director'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full font-medium animate-pulse">
                              <Clock className="w-3.5 h-3.5" /> Pending Finance Approval
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {!isApproved && (currentUser.role === UserRole.FINANCE_USER || currentUser.role === UserRole.FINANCE_MANAGER || currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MASTER_ADMIN) ? (
                            <button
                              onClick={() => onApproveClient(client.id)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold cursor-pointer transition-colors shadow-sm"
                            >
                              Approve & Activate
                            </button>
                          ) : !isApproved ? (
                            <span className="text-xs text-zinc-400 italic">Awaiting Finance Sign-off</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                              <Check className="w-3 h-3 text-emerald-500" /> Active
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
      )}

      {/* HTML template preview Modal */}
      {activePreviewHTML && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-scale-in">
            <div className="px-5 py-4 bg-zinc-50 border-b border-zinc-100 flex justify-between items-center">
              <h3 className="font-semibold text-zinc-900">{activePreviewTitle}</h3>
              <button onClick={() => setActivePreviewHTML(null)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer text-lg">✕</button>
            </div>
            <div className="p-6 max-h-[500px] overflow-y-auto bg-zinc-50">
              <div className="bg-white shadow-sm" dangerouslySetInnerHTML={{ __html: activePreviewHTML }} />
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
                className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Send to Printer
              </button>
              <button
                onClick={() => setActivePreviewHTML(null)}
                className="px-3.5 py-1.5 border border-zinc-300 hover:bg-zinc-100 text-zinc-700 rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-2xl max-w-sm w-full p-5 animate-scale-in">
            <h3 className="font-semibold text-zinc-900 mb-2">Estimate Rejection Notes</h3>
            <p className="text-xs text-zinc-500 mb-3">Provide feedback to CS reps describing required adjustments.</p>
            <textarea
              required
              rows={3}
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
              placeholder="e.g., Concrete unit rate exceeds target supplier budget..."
              className="w-full p-2 border border-zinc-300 rounded-lg text-xs focus:outline-hidden focus:border-rose-500 mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRejectingId(null)}
                className="px-3 py-1.5 border border-zinc-300 hover:bg-zinc-50 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={submitRejection}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
              >
                Submit Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Estimate Draft Side-by-Side Editor Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl max-w-7xl w-full h-[90vh] flex flex-col overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="px-6 py-4 bg-zinc-950 border-b border-zinc-800 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-semibold text-lg text-white">
                  {editingEst ? 'Edit Commercial Proposal' : 'Commercial Proposal Workbench'}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {editingEst ? `Editing Proposal Ref: ${editingEst.id}` : 'Draft client scopes, rates, and inspect live preview'}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {/* Live Preview Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowPreviewInModal(!showPreviewInModal)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    showPreviewInModal
                      ? 'bg-indigo-950/40 text-indigo-400 border-indigo-900/60 hover:bg-indigo-900/30'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  {showPreviewInModal ? 'Hide Live Preview' : 'Show Live Preview'}
                </button>

                <button 
                  onClick={() => {
                    setShowNewModal(false);
                    setEditingEst(null);
                    setLineItems([{ description: '', qty: 1, rate: 0, amount: 0, vatRate: 15, vatAmount: 0, grandTotal: 0 }]);
                    setSelectedClientName('');
                  }} 
                  className="text-zinc-400 hover:text-white cursor-pointer p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Split Body */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Left Column: Input Form (Scrollable) */}
              <form 
                onSubmit={handleCreate} 
                className={`flex-1 ${showPreviewInModal ? 'lg:max-w-[48%]' : 'lg:max-w-full w-full'} border-r border-zinc-800 flex flex-col overflow-hidden bg-zinc-900 transition-all duration-300`}
              >
                <div className="flex-1 p-6 space-y-5 overflow-y-auto">
                  {editingEst && (
                    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
                      <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                      <div>
                        <strong className="block font-semibold mb-0.5">Dual-Approval Required</strong>
                        Saving these edits will reset this estimate back to Draft and require both <strong className="text-white font-semibold">CS Manager</strong> and <strong className="text-white font-semibold">Finance Manager</strong> approval to go live.
                      </div>
                    </div>
                  )}
                  {/* Client Select & Address block */}
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">Client Partner</label>
                      <select
                        value={selectedClientName}
                        onChange={(e) => {
                          setSelectedClientName(e.target.value);
                        }}
                        className="w-full p-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        required
                      >
                        <option value="">-- Select Client --</option>
                        {clients.filter(c => c.isApproved).map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-zinc-400 mt-1">
                        Only clients approved by Finance are available for selection. Create and submit a new client in the Client Registry tab first if needed.
                      </p>
                    </div>
                  </div>

                  {/* Auto-populated Client Address Banner */}
                  <div className="bg-indigo-950/30 border border-indigo-900/50 p-4 rounded-xl flex items-start gap-3">
                    <div className="mt-0.5 p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg shrink-0">
                      <Building className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Client Billing Address</span>
                      <p className="text-xs text-zinc-300 font-medium mt-0.5">
                        {clients.find(c => c.name.toLowerCase() === selectedClientName.toLowerCase())?.address || 'Select a client to view their address.'}
                      </p>
                    </div>
                  </div>

                  {/* Line Items Editor */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">Estimate Line Items</label>
                    </div>

                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                      {lineItems.map((item, idx) => {
                        const vatRate = item.vatRate !== undefined ? item.vatRate : 15;
                        const vatAmount = item.vatAmount !== undefined ? item.vatAmount : (item.amount * (vatRate / 100));
                        const grandTotal = item.grandTotal !== undefined ? item.grandTotal : (item.amount + vatAmount);
                        return (
                          <div key={idx} className={`border p-3.5 rounded-xl space-y-3 transition-all duration-300 ${
                            item.isAgencyFee 
                              ? 'border-indigo-500/50 bg-indigo-950/5' 
                              : 'border-zinc-800 bg-zinc-950/40'
                          }`}>
                            {/* Header / Type selector */}
                            <div className="flex justify-between items-center pb-2 border-b border-zinc-800/60">
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Line Item #{idx + 1}</span>
                              
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleLineChange(idx, 'isAgencyFee', false)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                                    !item.isAgencyFee 
                                      ? 'bg-zinc-800 text-white border border-zinc-700' 
                                      : 'bg-transparent text-zinc-500 hover:text-zinc-300'
                                  }`}
                                >
                                  Standard
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleLineChange(idx, 'isAgencyFee', true)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                                    item.isAgencyFee 
                                      ? 'bg-indigo-600 text-white border border-indigo-500' 
                                      : 'bg-transparent text-zinc-500 hover:text-indigo-400'
                                  }`}
                                >
                                  Agency Fee
                                </button>
                              </div>
                            </div>

                            {/* Scope Description and Remove Button */}
                            <div className="flex gap-2.5 items-end">
                              <div className="flex-1 min-w-0">
                                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                                  Scope Description {item.isAgencyFee && <span className="text-indigo-400 font-semibold">(Auto-Generated)</span>}
                                </label>
                                <input
                                  type="text"
                                  required
                                  placeholder={item.isAgencyFee ? "Agency fee details..." : "Scope details (e.g. Concrete slab foundations)..."}
                                  value={item.description}
                                  onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                                  className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-hidden focus:border-indigo-500"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveLine(idx)}
                                className="p-2 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-800/50 transition-all shrink-0 cursor-pointer"
                                title="Remove line"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Agency Fee Selection Block */}
                            {item.isAgencyFee && (
                              <div className="bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="block text-[9px] font-bold text-indigo-400 uppercase tracking-wider">
                                    Calculate from preceding lines
                                  </span>
                                  <span className="text-[10px] text-zinc-400">
                                    Total Selected Scopes: {company.currency || 'BDT'} {
                                      ((item.selectedLineIndices || [])
                                        .filter((selectedIdx: number) => selectedIdx < idx && lineItems[selectedIdx])
                                        .reduce((acc: number, selectedIdx: number) => acc + (lineItems[selectedIdx].amount || 0), 0)
                                      ).toLocaleString()
                                    }
                                  </span>
                                </div>
                                
                                {idx === 0 ? (
                                  <div className="text-[10px] text-amber-400 italic bg-amber-500/5 border border-amber-500/10 p-2 rounded-lg">
                                    Agency Fee requires at least one preceding scope line to calculate from. Please add standard lines above this one.
                                  </div>
                                ) : (
                                  <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                                    {lineItems.slice(0, idx).map((preced, pIdx) => {
                                      const isSelected = (item.selectedLineIndices || []).includes(pIdx);
                                      return (
                                        <label 
                                          key={pIdx} 
                                          className={`flex items-center gap-2.5 text-xs p-1.5 rounded-lg border transition-all cursor-pointer ${
                                            isSelected 
                                              ? 'bg-indigo-950/20 border-indigo-900/40 text-white' 
                                              : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-zinc-300'
                                          }`}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => togglePrecedingLineSelection(idx, pIdx)}
                                            className="rounded border-zinc-700 bg-zinc-950 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                                          />
                                          <span className="truncate flex-1 font-medium">
                                            Line #{pIdx + 1}: {preced.description || '(Empty details)'}
                                          </span>
                                          <span className="font-semibold shrink-0 text-zinc-300">
                                            {company.currency || 'BDT'} {(preced.amount || 0).toLocaleString()}
                                          </span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Line Item Inputs and totals */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-0.5">
                              <div>
                                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                                  {item.isAgencyFee ? 'Qty (Fixed)' : 'Qty'}
                                </label>
                                <input
                                  type="number"
                                  required
                                  disabled={item.isAgencyFee}
                                  min={1}
                                  value={item.qty}
                                  onChange={(e) => handleLineChange(idx, 'qty', Number(e.target.value))}
                                  className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-center text-white focus:outline-hidden focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                                  {item.isAgencyFee ? 'Fee Rate %' : `Rate (${company.currency || 'BDT'})`}
                                </label>
                                <input
                                  type="number"
                                  required
                                  min={0}
                                  value={item.isAgencyFee ? (item.agencyFeeRate ?? 10) : item.rate}
                                  onChange={(e) => handleLineChange(idx, item.isAgencyFee ? 'agencyFeeRate' : 'rate', Number(e.target.value))}
                                  className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-right text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">VAT Rate %</label>
                                <input
                                  type="number"
                                  required
                                  min={0}
                                  max={100}
                                  value={vatRate}
                                  onChange={(e) => handleLineChange(idx, 'vatRate', Number(e.target.value))}
                                  className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-center text-white focus:outline-hidden focus:border-indigo-500"
                                />
                              </div>

                              <div className="bg-zinc-950/80 border border-zinc-800/60 p-2 rounded-lg text-right flex flex-col justify-center">
                                <span className="block text-[8px] font-bold text-zinc-500 uppercase tracking-wider">VAT Amt</span>
                                <span className="text-[11px] font-semibold text-zinc-400 block mt-0.5">
                                  {company.currency || 'BDT'} {vatAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </span>
                              </div>

                              <div className="bg-indigo-950/20 border border-indigo-900/40 p-2 rounded-lg text-right col-span-2 sm:col-span-1 flex flex-col justify-center">
                                <span className="block text-[8px] font-bold text-indigo-400 uppercase tracking-wider">
                                  {item.isAgencyFee ? 'Fee Total' : 'Grand Total'}
                                </span>
                                <span className="text-[11px] font-bold text-white block mt-0.5">
                                  {company.currency || 'BDT'} {grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Add Scope Line Button Below Line Items */}
                      <button
                        type="button"
                        onClick={handleAddLine}
                        className="w-full py-2.5 border border-dashed border-zinc-800 hover:border-indigo-500 hover:bg-indigo-950/20 text-xs font-semibold text-zinc-400 hover:text-indigo-400 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-2"
                      >
                        <Plus className="w-4 h-4" /> Add Scope Line
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Controls of Left Column */}
                <div className="p-5 border-t border-zinc-800 bg-zinc-950 flex flex-col gap-2 shrink-0">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400 font-medium">Net Subtotal:</span>
                    <span className="text-zinc-300 font-bold">{company.currency || 'BDT'} {calculateSubtotal().toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400 font-medium">Total VAT Amt:</span>
                    <span className="text-zinc-300 font-bold">{company.currency || 'BDT'} {calculateTotalVat().toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t border-zinc-800 pt-2 mt-1">
                    <span className="font-semibold text-zinc-300">Grand Total Sum:</span>
                    <span className="text-xl font-black text-indigo-400">{company.currency || 'BDT'} {calculateGrandTotal().toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewModal(false);
                        setEditingEst(null);
                        setLineItems([{ description: '', qty: 1, rate: 0, amount: 0, vatRate: 15, vatAmount: 0, grandTotal: 0 }]);
                        setSelectedClientName('');
                      }}
                      className="flex-1 py-2.5 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      Cancel Draft
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedClientName}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {editingEst ? 'Save & Request Re-approval' : 'Save Estimate Draft'}
                    </button>
                  </div>
                </div>
              </form>

              {/* Right Column: Live Proposal Preview */}
              {showPreviewInModal && (
                <div className="flex-1 bg-zinc-950 p-6 flex flex-col overflow-hidden animate-fade-in">
                  <div className="flex justify-between items-center mb-3 shrink-0">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Real-time Client Proposal Preview
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium uppercase">
                      Interactive View
                    </span>
                  </div>
                  
                  {/* Live rendered content */}
                  <div className="flex-1 overflow-y-auto p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-start justify-center">
                    <div className="bg-white text-zinc-950 rounded-lg w-full max-w-2xl shadow-xl overflow-hidden my-auto p-1 text-left">
                      <div dangerouslySetInnerHTML={{ __html: getLivePreviewHTML() }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Project from Estimate Modal */}
      {showCreateProjModal && activeEstForProj && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden animate-scale-in text-zinc-800">
            {/* Header */}
            <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-100 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-semibold text-lg text-zinc-900">Create Project from Estimate</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Initialize a tracking project using estimate line scopes</p>
              </div>
              <button 
                onClick={() => {
                  setShowCreateProjModal(false);
                  setActiveEstForProj(null);
                }} 
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer p-1.5 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmCreateProject} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Project Name</label>
                    <input
                      type="text"
                      required
                      value={newProjName}
                      onChange={(e) => setNewProjName(e.target.value)}
                      className="w-full p-2.5 border border-zinc-300 rounded-lg text-sm bg-zinc-50 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Start Date</label>
                    <input
                      type="date"
                      required
                      value={newProjStartDate}
                      onChange={(e) => setNewProjStartDate(e.target.value)}
                      className="w-full p-2.5 border border-zinc-300 rounded-lg text-sm bg-zinc-50 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">End Date</label>
                    <input
                      type="date"
                      required
                      value={newProjEndDate}
                      onChange={(e) => setNewProjEndDate(e.target.value)}
                      className="w-full p-2.5 border border-zinc-300 rounded-lg text-sm bg-zinc-50 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="border-t border-zinc-100 pt-3">
                  <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Select Line Items to Assign</span>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {(activeEstForProj.lineItems || []).map((item) => {
                      const isChecked = selectedLineItemIds.includes(item.id);
                      const vatRate = item.vatRate !== undefined ? item.vatRate : 15;
                      const vatAmount = item.vatAmount !== undefined ? item.vatAmount : (item.amount * (vatRate / 100));
                      const grandTotal = item.grandTotal !== undefined ? item.grandTotal : (item.amount + vatAmount);

                      return (
                        <label 
                          key={item.id} 
                          className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                            isChecked 
                              ? 'border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50/60' 
                              : 'border-zinc-200 bg-white hover:bg-zinc-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedLineItemIds([...selectedLineItemIds, item.id]);
                              } else {
                                setSelectedLineItemIds(selectedLineItemIds.filter(id => id !== item.id));
                              }
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-zinc-900">{item.description || 'Untitled Line Item'}</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">
                              Qty: {item.qty} × Rate: {company.currency || 'BDT'} {item.rate.toLocaleString()} (Subtotal: {company.currency || 'BDT'} {item.amount.toLocaleString()})
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold text-zinc-900 block">{company.currency || 'BDT'} {grandTotal.toLocaleString()}</span>
                            <span className="text-[9px] text-zinc-400 block uppercase font-medium">Grand Total</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Live Budget Counter Banner */}
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Calculated Project Budget</span>
                    <p className="text-xs text-zinc-600 mt-0.5">Sum of selected line item grand totals</p>
                  </div>
                  <span className="text-lg font-black text-indigo-600 font-mono">
                    {company.currency || 'BDT'} {
                      (activeEstForProj.lineItems || [])
                        .filter(li => selectedLineItemIds.includes(li.id))
                        .reduce((acc, curr) => {
                          const vatRate = curr.vatRate !== undefined ? curr.vatRate : 15;
                          const vatAmount = curr.vatAmount !== undefined ? curr.vatAmount : (curr.amount * (vatRate / 100));
                          const grandTotal = curr.grandTotal !== undefined ? curr.grandTotal : (curr.amount + vatAmount);
                          return acc + grandTotal;
                        }, 0)
                        .toLocaleString()
                    }
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateProjModal(false);
                    setActiveEstForProj(null);
                  }}
                  className="px-4 py-2 border border-zinc-300 hover:bg-zinc-100 rounded-lg text-xs font-semibold text-zinc-700 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedLineItemIds.length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer transition-all"
                >
                  Confirm & Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 5. Create Client Modal */}
      {showNewClientModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-scale-up">
            {/* Header */}
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-500" />
                <div>
                  <h3 className="text-base font-bold text-white">Register New Client Account</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Initiate onboarding. Requires Finance approval before usage.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewClientModal(false)}
                className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg cursor-pointer transition-all"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newClientName.trim() || !newClientAddress.trim()) return;
                onCreateClient({
                  name: newClientName.trim(),
                  address: newClientAddress.trim()
                });
                setShowNewClientModal(false);
                setNewClientName('');
                setNewClientAddress('');
              }}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-200/90 leading-relaxed">
                    <strong className="font-semibold block mb-0.5">CS Onboarding Compliance</strong>
                    As a Client Services user, creating this account establishes a draft state. It will be routed to the <strong className="text-amber-300">Finance Team</strong> queue for approval. You will not be able to issue estimates until they approve.
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">Client Company Name</label>
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="e.g. Bangladesh Infrastructure Ltd"
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">Official Billing Address</label>
                  <textarea
                    rows={3}
                    value={newClientAddress}
                    onChange={(e) => setNewClientAddress(e.target.value)}
                    placeholder="e.g. House 42, Road 11, Banani, Dhaka 1213"
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                    required
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="px-4 py-2 border border-zinc-700 hover:bg-zinc-800 rounded-lg text-xs font-semibold text-zinc-300 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer transition-all"
                >
                  Submit & Request Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
