/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Estimate, Project, User, EstimateLineItem, Company, Client, UserRole, LaborRate, LaborBreakdownItem } from '../types';
import { FileText, Plus, Trash2, Eye, RefreshCw, CheckCircle, XCircle, Sparkles, Building, ChevronDown, ChevronUp, Pencil, ShieldAlert, Users, Check, Clock, Search, SlidersHorizontal, X, Menu } from 'lucide-react';

interface EstimatesModuleProps {
  estimates: Estimate[];
  projects: Project[];
  currentUser: User;
  company: Company;
  clients: Client[];
  isSidebarHidden?: boolean;
  onToggleSidebar?: () => void;
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
  laborRates?: LaborRate[];
}

export default function EstimatesModule({
  estimates,
  projects,
  currentUser,
  company,
  clients,
  isSidebarHidden,
  onToggleSidebar,
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
  onConvertToInvoice,
  laborRates = []
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

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [estimateStatus, setEstimateStatus] = useState<string>('ALL');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredEstimates = estimates.filter(est => {
    const term = searchTerm.toLowerCase().trim();
    const proj = projects.find(p => p.id === est.projectId);
    const matchesSearch = !term ||
      est.id.toLowerCase().includes(term) ||
      (est.clientName && est.clientName.toLowerCase().includes(term)) ||
      (proj && proj.name.toLowerCase().includes(term)) ||
      est.lineItems.some(li => li.description && li.description.toLowerCase().includes(term));
    
    let matchesStatus = true;
    if (estimateStatus !== 'ALL') {
      const isFullyApproved = est.csManagerApproved && est.financeApproved;
      const statusStr = est.clientStatus === 'REJECTED' ? 'REJECTED' :
                       isFullyApproved ? 'APPROVED' : 'AWAITING APPROVAL';
      matchesStatus = statusStr === estimateStatus || est.clientStatus === estimateStatus;
    }

    const matchesMinAmount = !minAmount || est.totalAmount >= Number(minAmount);
    const matchesMaxAmount = !maxAmount || est.totalAmount <= Number(maxAmount);

    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && new Date(est.createdAt) >= new Date(startDate);
    }
    if (endDate) {
      const eDate = new Date(endDate);
      eDate.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(est.createdAt) <= eDate;
    }

    return matchesSearch && matchesStatus && matchesMinAmount && matchesMaxAmount && matchesDate;
  });

  const filteredClients = clients.filter(c => {
    const term = clientSearchTerm.toLowerCase().trim();
    return !term ||
      c.name.toLowerCase().includes(term) ||
      (c.address && c.address.toLowerCase().includes(term)) ||
      c.id.toLowerCase().includes(term);
  });

  const activeFiltersCount = (estimateStatus !== 'ALL' ? 1 : 0) + (minAmount ? 1 : 0) + (maxAmount ? 1 : 0) + (startDate ? 1 : 0) + (endDate ? 1 : 0);

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
      const isReimbursementLabor = !!item.isReimbursementLabor;
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
      } else if (isReimbursementLabor) {
        const laborItems = (item.laborItems || []).map((labor: any) => {
          const fteStr = labor.ftePercentage || '';
          const numericFte = parseFloat(fteStr.replace('%', '').trim());
          let hours = labor.hours;
          if (!isNaN(numericFte)) {
            hours = Math.ceil(20.417 * 8 * (numericFte / 100));
          } else {
            hours = 0;
          }
          const hourlyRate = labor.hourlyRate !== undefined ? Number(labor.hourlyRate) : 0;
          const amount = hourlyRate * hours;
          return {
            ...labor,
            hours,
            amount
          };
        });
        const subtotal = laborItems.reduce((acc: number, labor: any) => acc + (Number(labor.amount) || 0), 0);
        const inputMode = item.discountInputMode || 'percentage';
        let discountPercentage = item.discountPercentage !== undefined ? Number(item.discountPercentage) : 0;
        let discountAmount = item.discountAmount !== undefined ? Number(item.discountAmount) : 0;

        if (inputMode === 'amount') {
          discountPercentage = subtotal > 0 ? (discountAmount / subtotal) * 100 : 0;
        } else {
          discountAmount = subtotal * (discountPercentage / 100);
        }

        const qty = 1;
        const rate = subtotal - discountAmount;
        const amount = subtotal - discountAmount;
        const vatAmount = amount * (vatRate / 100);
        const grandTotal = amount + vatAmount;
        
        return {
          ...item,
          qty,
          rate,
          amount,
          vatRate,
          vatAmount,
          grandTotal,
          description: item.description || 'Reimbursement Direct Labor Cost',
          laborItems,
          discountPercentage,
          discountAmount,
          discountInputMode: inputMode
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
    
    if (field === 'lineType') {
      const type = value as string;
      if (type === 'STANDARD') {
        item.isAgencyFee = false;
        item.isReimbursementLabor = false;
        item.qty = 1;
        item.rate = 0;
        item.amount = 0;
        item.selectedLineIndices = [];
        item.laborItems = [];
      } else if (type === 'AGENCY') {
        item.isAgencyFee = true;
        item.isReimbursementLabor = false;
        item.qty = 1;
        item.agencyFeeRate = item.agencyFeeRate ?? 10;
        // select all preceding items by default
        item.selectedLineIndices = Array.from({ length: idx }, (_, i) => i);
        item.description = ''; // Force regeneration of description
        item.laborItems = [];
      } else if (type === 'REIMBURSEMENT_LABOR') {
        item.isAgencyFee = false;
        item.isReimbursementLabor = true;
        item.qty = 1;
        item.selectedLineIndices = [];
        item.description = item.description || 'Reimbursement Direct Labor Cost';
        if (!item.laborItems || item.laborItems.length === 0) {
          item.laborItems = [
            { id: 'labor-1', department: 'Planning Department', designation: 'Planning Executive', ftePercentage: '6%', hourlyRate: 546, hours: 10, amount: 5460 },
            { id: 'labor-2', department: 'Account Management', designation: 'Account Manager', ftePercentage: '5%', hourlyRate: 1241, hours: 9, amount: 11169 },
            { id: 'labor-3', department: 'Account Management', designation: 'Account Executive', ftePercentage: '50%', hourlyRate: 546, hours: 82, amount: 44772 },
            { id: 'labor-4', department: 'Content Development (Art Department)', designation: 'Animator 01', ftePercentage: '50%', hourlyRate: 745, hours: 82, amount: 61090 },
            { id: 'labor-5', department: 'Content Development (Art Department)', designation: 'Visualizer 01', ftePercentage: '50%', hourlyRate: 546, hours: 82, amount: 44772 },
            { id: 'labor-6', department: 'Content Development (Copy Department)', designation: 'Copy Supervisor', ftePercentage: '5%', hourlyRate: 1489, hours: 9, amount: 13401 },
            { id: 'labor-7', department: 'Content Development (Copy Department)', designation: 'Copywriter', ftePercentage: '31%', hourlyRate: 546, hours: 51, amount: 27846 }
          ];
        }
      }
    } else if (field === 'isAgencyFee') {
      const checked = !!value;
      item.isAgencyFee = checked;
      if (checked) {
        item.isReimbursementLabor = false;
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

      const isClientNameEqual = selectedClientName === (editingEst.clientName || '');
      const isSameLineItems = lineItems.length === editingEst.lineItems.length && lineItems.every((item, idx) => {
        const orig = editingEst.lineItems[idx];
        if (!orig) return false;
        const isAgencyFeeEqual = (item.isAgencyFee || false) === (orig.isAgencyFee || false);
        const selectedIndicesEqual = JSON.stringify(item.selectedLineIndices || []) === JSON.stringify(orig.selectedLineIndices || []);
        return item.description === orig.description &&
          Number(item.qty) === Number(orig.qty) &&
          Number(item.rate) === Number(orig.rate) &&
          Number(item.amount) === Number(orig.amount) &&
          Number(item.vatRate ?? 15) === Number(orig.vatRate ?? 15) &&
          isAgencyFeeEqual &&
          Number(item.agencyFeeRate ?? 10) === Number(orig.agencyFeeRate ?? 10) &&
          selectedIndicesEqual;
      });

      const hasChanges = !isClientNameEqual || !isSameLineItems;

      if (onEditEstimate) {
        onEditEstimate(editingEst.id, {
          clientName: selectedClientName,
          lineItems: itemsWithProject as any,
          totalAmount: calculateTotal(),
          ...(hasChanges ? {} : {
            csManagerApproved: editingEst.csManagerApproved,
            financeApproved: editingEst.financeApproved,
            clientStatus: editingEst.clientStatus,
            rejectionNotes: editingEst.rejectionNotes
          })
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
    const client = clients.find(c => c.name.toLowerCase() === proj?.clientName.toLowerCase() || c.name.toLowerCase() === est.clientName?.toLowerCase());
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
      .replace('{{clientName}}', proj?.clientName || est.clientName || 'N/A')
      .replace('{{clientAddress}}', clientAddress)
      .replace('{{projectName}}', proj?.name || 'N/A')
      .replace('{{dateCreated}}', new Date(est.createdAt || Date.now()).toLocaleDateString())
      .replace('{{lineItemsHTML}}', linesHTML)
      .replace('{{totalAmount}}', `${currencySymbol} ${grandTotalSum.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);

    // Fallback if template doesn't contain {{clientAddress}} placeholder
    if (!template.includes('{{clientAddress}}')) {
      populated = populated.replace(
        `class="text-zinc-600 mt-1">${proj?.clientName || est.clientName || 'N/A'}</p>`,
        `class="text-zinc-600 mt-1">${proj?.clientName || est.clientName || 'N/A'}</p>\n      <p class="text-zinc-500 italic text-[11px]">${clientAddress}</p>`
      );
    }

    // Append Direct Labor Cost Breakdown Page
    const laborLineItems = est.lineItems.filter(item => item.isReimbursementLabor && item.laborItems && item.laborItems.length > 0);
    if (laborLineItems.length > 0) {
      const breakdownHTML = `
        <div class="p-8 font-sans border-2 border-zinc-200 rounded-lg bg-white mt-8" style="page-break-before: always; break-before: page;">
          <div class="flex justify-between border-b pb-6">
            <div>
              <h1 class="text-3xl font-extrabold text-indigo-600 tracking-tight">${company.name}</h1>
              <p class="text-xs text-zinc-500 mt-1">SaaS ERP Commercial Division</p>
            </div>
            <div class="text-right">
              <h2 class="text-xl font-bold text-zinc-800">DIRECT LABOR BREAKDOWN</h2>
              <p class="text-xs text-zinc-500">Ref: ${est.id}</p>
            </div>
          </div>
          <div class="my-6 grid grid-cols-2 gap-4 text-xs">
            <div>
              <p class="font-semibold text-zinc-700">PREPARED FOR:</p>
              <p class="text-zinc-600 mt-1 font-bold">${proj?.clientName || est.clientName || 'N/A'}</p>
              <p class="text-zinc-500 mt-0.5 italic text-[11px]">${clientAddress}</p>
              <p class="text-zinc-600 mt-1">Project: ${proj?.name || 'N/A'}</p>
            </div>
            <div class="text-right">
              <p class="font-semibold text-zinc-700">DATE CREATED:</p>
              <p class="text-zinc-600 mt-1">${new Date(est.createdAt || Date.now()).toLocaleDateString()}</p>
              <p class="text-zinc-600 mt-1">QBO Link Status: <span class="text-emerald-600">Connected</span></p>
            </div>
          </div>
          
          <div class="my-4 py-2 border-b border-t border-zinc-200">
            <p class="text-sm font-extrabold text-zinc-950 tracking-tight">Subject: Breakdown for direct labor cost</p>
          </div>

          <div class="space-y-6 mt-6">
            ${laborLineItems.map((laborLine, lIdx) => {
              const subtotal = (laborLine.laborItems || []).reduce((acc: number, cur: any) => acc + (cur.amount || 0), 0);
              return `
                <div class="border border-zinc-200 rounded-lg p-4 bg-zinc-50/30">
                  <div class="mb-3">
                    <h3 class="text-xs font-extrabold text-zinc-700 uppercase tracking-wide">Category: ${laborLine.description || 'Reimbursement Labor'}</h3>
                  </div>
                  <table class="w-full text-[11px] text-left border-collapse">
                    <thead>
                      <tr class="bg-zinc-100/80 text-zinc-800 uppercase font-semibold">
                        <th class="p-2 border-b w-10 text-center">SL#</th>
                        <th class="p-2 border-b">Department</th>
                        <th class="p-2 border-b">Designation</th>
                        <th class="p-2 border-b text-center">FTE Required</th>
                        <th class="p-2 border-b text-right font-mono">Time Cost/Hour</th>
                        <th class="p-2 border-b text-center font-mono">Hours</th>
                        <th class="p-2 border-b text-right font-mono">Total Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${(laborLine.laborItems || []).map((li, liIdx) => `
                        <tr class="border-b border-zinc-100 text-zinc-700 hover:bg-zinc-50">
                          <td class="p-2 text-center font-mono text-zinc-400">${liIdx + 1}</td>
                          <td class="p-2">${li.department || 'N/A'}</td>
                          <td class="p-2 font-medium text-zinc-900">${li.designation || 'N/A'}</td>
                          <td class="p-2 text-center">${li.ftePercentage || 'N/A'}</td>
                          <td class="p-2 text-right font-mono">${currencySymbol} ${(li.hourlyRate || 0).toLocaleString()}</td>
                          <td class="p-2 text-center font-mono font-semibold">${li.hours || 0}</td>
                          <td class="p-2 text-right font-mono font-bold text-zinc-900">${currencySymbol} ${(li.amount || 0).toLocaleString()}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                    <tfoot>
                      <tr class="bg-zinc-100/40 font-bold">
                        <td colspan="6" class="p-2 text-right text-zinc-600">Subtotal Direct Labor Cost:</td>
                        <td class="p-2 text-right text-indigo-600 font-mono">${currencySymbol} ${subtotal.toLocaleString()}</td>
                      </tr>
                      ${(laborLine.discountPercentage || 0) > 0 ? `
                      <tr class="bg-zinc-50 font-bold text-rose-600">
                        <td colspan="6" class="p-2 text-right text-zinc-600">Discount (${(laborLine.discountPercentage || 0).toFixed(2)}%):</td>
                        <td class="p-2 text-right font-mono">- ${currencySymbol} ${(laborLine.discountAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      </tr>
                      <tr class="bg-emerald-50 font-bold text-emerald-800">
                        <td colspan="6" class="p-2 text-right">Net Direct Labor Cost:</td>
                        <td class="p-2 text-right font-mono">${currencySymbol} ${(laborLine.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      </tr>
                      ` : ''}
                    </tfoot>
                  </table>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
      populated += breakdownHTML;
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

    // Append Direct Labor Cost Breakdown Page to Live Preview
    const laborLineItems = lineItems.filter(item => item.isReimbursementLabor && item.laborItems && item.laborItems.length > 0);
    if (laborLineItems.length > 0) {
      const breakdownHTML = `
        <div class="p-8 font-sans border-2 border-zinc-200 rounded-lg bg-white mt-8" style="page-break-before: always; break-before: page;">
          <div class="flex justify-between border-b pb-6">
            <div>
              <h1 class="text-3xl font-extrabold text-indigo-600 tracking-tight">${company.name}</h1>
              <p class="text-xs text-zinc-500 mt-1">SaaS ERP Commercial Division</p>
            </div>
            <div class="text-right">
              <h2 class="text-xl font-bold text-zinc-800">DIRECT LABOR BREAKDOWN</h2>
              <p class="text-xs text-zinc-500">Ref: EST-DRAFT</p>
            </div>
          </div>
          <div class="my-6 grid grid-cols-2 gap-4 text-xs">
            <div>
              <p class="font-semibold text-zinc-700">PREPARED FOR:</p>
              <p class="text-zinc-600 mt-1 font-bold">${clientNameDisplay}</p>
              <p class="text-zinc-500 mt-0.5 italic text-[11px]">${clientAddress}</p>
              <p class="text-zinc-600 mt-1">Project: ${proj?.name || 'N/A'}</p>
            </div>
            <div class="text-right">
              <p class="font-semibold text-zinc-700">DATE CREATED:</p>
              <p class="text-zinc-600 mt-1">${new Date().toLocaleDateString()}</p>
              <p class="text-zinc-600 mt-1">QBO Link Status: <span class="text-emerald-600">Connected</span></p>
            </div>
          </div>
          
          <div class="my-4 py-2 border-b border-t border-zinc-200">
            <p class="text-sm font-extrabold text-zinc-950 tracking-tight">Subject: Breakdown for direct labor cost</p>
          </div>

          <div class="space-y-6 mt-6">
            ${laborLineItems.map((laborLine, lIdx) => {
              const subtotal = (laborLine.laborItems || []).reduce((acc: number, cur: any) => acc + (cur.amount || 0), 0);
              return `
                <div class="border border-zinc-200 rounded-lg p-4 bg-zinc-50/30">
                  <div class="mb-3">
                    <h3 class="text-xs font-extrabold text-zinc-700 uppercase tracking-wide">Category: ${laborLine.description || 'Reimbursement Labor'}</h3>
                  </div>
                  <table class="w-full text-[11px] text-left border-collapse">
                    <thead>
                      <tr class="bg-zinc-100/80 text-zinc-800 uppercase font-semibold">
                        <th class="p-2 border-b w-10 text-center">SL#</th>
                        <th class="p-2 border-b">Department</th>
                        <th class="p-2 border-b">Designation</th>
                        <th class="p-2 border-b text-center">FTE Required</th>
                        <th class="p-2 border-b text-right font-mono">Time Cost/Hour</th>
                        <th class="p-2 border-b text-center font-mono">Hours</th>
                        <th class="p-2 border-b text-right font-mono">Total Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${(laborLine.laborItems || []).map((li, liIdx) => `
                        <tr class="border-b border-zinc-100 text-zinc-700 hover:bg-zinc-50">
                          <td class="p-2 text-center font-mono text-zinc-400">${liIdx + 1}</td>
                          <td class="p-2">${li.department || 'N/A'}</td>
                          <td class="p-2 font-medium text-zinc-900">${li.designation || 'N/A'}</td>
                          <td class="p-2 text-center">${li.ftePercentage || 'N/A'}</td>
                          <td class="p-2 text-right font-mono">${currencySymbol} ${(li.hourlyRate || 0).toLocaleString()}</td>
                          <td class="p-2 text-center font-mono font-semibold">${li.hours || 0}</td>
                          <td class="p-2 text-right font-mono font-bold text-zinc-900">${currencySymbol} ${(li.amount || 0).toLocaleString()}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                    <tfoot>
                      <tr class="bg-zinc-100/40 font-bold">
                        <td colspan="6" class="p-2 text-right text-zinc-600">Subtotal Direct Labor Cost:</td>
                        <td class="p-2 text-right text-indigo-600 font-mono">${currencySymbol} ${subtotal.toLocaleString()}</td>
                      </tr>
                      ${(laborLine.discountPercentage || 0) > 0 ? `
                      <tr class="bg-zinc-50 font-bold text-rose-600">
                        <td colspan="6" class="p-2 text-right text-zinc-600">Discount (${(laborLine.discountPercentage || 0).toFixed(2)}%):</td>
                        <td class="p-2 text-right font-mono">- ${currencySymbol} ${(laborLine.discountAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      </tr>
                      <tr class="bg-emerald-50 font-bold text-emerald-800">
                        <td colspan="6" class="p-2 text-right">Net Direct Labor Cost:</td>
                        <td class="p-2 text-right font-mono">${currencySymbol} ${(laborLine.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      </tr>
                      ` : ''}
                    </tfoot>
                  </table>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
      populated += breakdownHTML;
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
        <div className="space-y-4">
          {/* Elegant Search & Filter Bar */}
          <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search by ID, client name, project name, or scope details..."
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
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 pt-3 border-t border-zinc-100 animate-fadeIn text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Status</label>
                  <select
                    value={estimateStatus}
                    onChange={(e) => setEstimateStatus(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="DRAFT">Draft</option>
                    <option value="SENT">Sent</option>
                    <option value="APPROVED">Approved (CS + Finance)</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Min Amount ({company.currency || 'BDT'})</label>
                  <input
                    type="number"
                    placeholder="Min amount..."
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Max Amount ({company.currency || 'BDT'})</label>
                  <input
                    type="number"
                    placeholder="Max amount..."
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs"
                  />
                </div>
              </div>
            )}

            {(searchTerm || activeFiltersCount > 0) && (
              <div className="flex justify-between items-center text-xs text-zinc-500 pt-1">
                <span>Found <strong>{filteredEstimates.length}</strong> matching estimates</span>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setEstimateStatus('ALL');
                    setMinAmount('');
                    setMaxAmount('');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>

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
                {filteredEstimates.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-zinc-400 italic">No commercial estimates match your filter criteria.</td>
                  </tr>
                ) : (
                  filteredEstimates.map((est) => {
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
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
      ) : (
        <div className="space-y-4">
          {/* Client Search Bar */}
          <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search clients by name, ID, or billing address..."
                value={clientSearchTerm}
                onChange={(e) => setClientSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 placeholder:text-zinc-400"
              />
              {clientSearchTerm && (
                <button
                  onClick={() => setClientSearchTerm('')}
                  className="absolute right-3 top-2.5 hover:text-zinc-600 text-zinc-400 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

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
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-zinc-400 italic">No client accounts match your search.</td>
                    </tr>
                  ) : (
                    filteredClients.map((client) => {
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-7xl w-full h-[90vh] flex flex-col overflow-hidden animate-scale-in text-slate-850">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-bold text-lg text-slate-950">
                  {editingEst ? 'Edit Commercial Proposal' : 'Commercial Proposal Workbench'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingEst ? `Editing Proposal Ref: ${editingEst.id}` : 'Draft client scopes, rates, and inspect live preview'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Toggle Sidebar Option */}
                {onToggleSidebar && (
                  <button
                    type="button"
                    onClick={onToggleSidebar}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      isSidebarHidden
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                    title="Toggle application sidebar navigation to expand screen size"
                  >
                    <Menu className="w-3.5 h-3.5" />
                    {isSidebarHidden ? 'Show Sidebar' : 'Hide Sidebar'}
                  </button>
                )}

                {/* Live Preview Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowPreviewInModal(!showPreviewInModal)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    showPreviewInModal
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
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
                  className="text-slate-400 hover:text-slate-700 cursor-pointer p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
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
                className={`flex-1 ${showPreviewInModal ? 'lg:max-w-[48%]' : 'lg:max-w-full w-full'} border-r border-slate-200 flex flex-col overflow-hidden bg-white transition-all duration-300`}
              >
                <div className="flex-1 p-6 space-y-5 overflow-y-auto">
                  {editingEst && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
                      <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <strong className="block font-bold mb-0.5">Dual-Approval Required</strong>
                        Saving these edits will reset this estimate back to Draft and require both <strong className="text-slate-900 font-bold">CS Manager</strong> and <strong className="text-slate-900 font-bold">Finance Manager</strong> approval to go live.
                      </div>
                    </div>
                  )}
                  {/* Client Select & Address block */}
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Client Partner</label>
                      <select
                        value={selectedClientName}
                        onChange={(e) => {
                          setSelectedClientName(e.target.value);
                        }}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        required
                      >
                        <option value="">-- Select Client --</option>
                        {clients.filter(c => c.isApproved).map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Only clients approved by Finance are available for selection. Create and submit a new client in the Client Registry tab first if needed.
                      </p>
                    </div>
                  </div>

                  {/* Auto-populated Client Address Banner */}
                  <div className="bg-indigo-50/70 border border-indigo-100 p-4 rounded-xl flex items-start gap-3">
                    <div className="mt-0.5 p-1.5 bg-indigo-100 text-indigo-600 rounded-lg shrink-0">
                      <Building className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Client Billing Address</span>
                      <p className="text-xs text-slate-700 font-medium mt-0.5">
                        {clients.find(c => c.name.toLowerCase() === selectedClientName.toLowerCase())?.address || 'Select a client to view their address.'}
                      </p>
                    </div>
                  </div>

                  {/* Line Items Editor */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Estimate Line Items</label>
                    </div>

                    <div className="max-h-[380px] overflow-y-auto pr-1">
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse min-w-[950px]">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                                <th className="p-3 w-32">Type</th>
                                <th className="p-3">Scope Description</th>
                                <th className="p-3 w-20 text-center">Qty</th>
                                <th className="p-3 w-32 text-right">Rate ({company.currency || 'BDT'})</th>
                                <th className="p-3 w-20 text-center">VAT %</th>
                                <th className="p-3 w-28 text-right">VAT Amt</th>
                                <th className="p-3 w-32 text-right">Grand Total</th>
                                <th className="p-3 w-12 text-center"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {lineItems.map((item, idx) => {
                                const vatRate = item.vatRate !== undefined ? item.vatRate : 15;
                                const vatAmount = item.vatAmount !== undefined ? item.vatAmount : (item.amount * (vatRate / 100));
                                const grandTotal = item.grandTotal !== undefined ? item.grandTotal : (item.amount + vatAmount);
                                return (
                                  <React.Fragment key={idx}>
                                    <tr className={`group transition-colors ${
                                      item.isReimbursementLabor 
                                        ? 'bg-emerald-50/10 hover:bg-emerald-50/20' 
                                        : item.isAgencyFee 
                                          ? 'bg-indigo-50/20 hover:bg-indigo-50/30' 
                                          : 'bg-white hover:bg-slate-50/60'
                                    }`}>
                                      {/* Type Selector (Standard / Agency Fee / Reimbursement Labor) */}
                                      <td className="p-3">
                                        <select
                                          value={
                                            item.isReimbursementLabor 
                                              ? 'REIMBURSEMENT_LABOR' 
                                              : item.isAgencyFee 
                                                ? 'AGENCY' 
                                                : 'STANDARD'
                                          }
                                          onChange={(e) => handleLineChange(idx, 'lineType', e.target.value)}
                                          className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-semibold text-slate-700 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                                        >
                                          <option value="STANDARD">Standard</option>
                                          <option value="AGENCY">Agency Fee</option>
                                          <option value="REIMBURSEMENT_LABOR">Reimbursement Labor</option>
                                        </select>
                                      </td>

                                      {/* Description Input */}
                                      <td className="p-3">
                                        <input
                                          type="text"
                                          required
                                          placeholder={
                                            item.isReimbursementLabor
                                              ? "Direct labor category name..."
                                              : item.isAgencyFee 
                                                ? "Agency fee description..." 
                                                : "e.g. Concrete slab foundations..."
                                          }
                                          value={item.description}
                                          onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                                          className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-1 focus:ring-indigo-500 font-medium"
                                        />
                                      </td>

                                      {/* Qty Input */}
                                      <td className="p-3">
                                        <input
                                          type="number"
                                          required
                                          disabled={item.isAgencyFee || item.isReimbursementLabor}
                                          min={1}
                                          value={item.qty}
                                          onChange={(e) => handleLineChange(idx, 'qty', Number(e.target.value))}
                                          className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-center text-slate-900 focus:bg-white focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                        />
                                      </td>

                                      {/* Rate Input */}
                                      <td className="p-3">
                                        <input
                                          type="number"
                                          required
                                          min={0}
                                          disabled={item.isReimbursementLabor}
                                          value={item.isAgencyFee ? (item.agencyFeeRate ?? 10) : item.rate}
                                          onChange={(e) => handleLineChange(idx, item.isAgencyFee ? 'agencyFeeRate' : 'rate', Number(e.target.value))}
                                          className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-right text-slate-900 font-semibold focus:bg-white focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                      </td>

                                      {/* VAT Rate Input */}
                                      <td className="p-3">
                                        <input
                                          type="number"
                                          required
                                          min={0}
                                          max={100}
                                          value={vatRate}
                                          onChange={(e) => handleLineChange(idx, 'vatRate', Number(e.target.value))}
                                          className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-center text-slate-900 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                                        />
                                      </td>

                                      {/* VAT Amt */}
                                      <td className="p-3 text-right font-mono font-medium text-slate-500 text-xs">
                                        {vatAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                      </td>

                                      {/* Grand Total */}
                                      <td className="p-3 text-right font-bold text-slate-900 text-xs">
                                        {grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                      </td>

                                      {/* Trash Action */}
                                      <td className="p-3 text-center">
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveLine(idx)}
                                          className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-all cursor-pointer"
                                          title="Remove line"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    </tr>

                                    {/* Agency Fee Configuration Sub-row */}
                                    {item.isAgencyFee && (
                                      <tr className="bg-indigo-50/10">
                                        <td colSpan={8} className="p-3 border-b border-indigo-100">
                                          <div className="bg-white/80 border border-indigo-100/60 p-3 rounded-lg space-y-2 text-xs">
                                            <div className="flex items-center justify-between">
                                              <span className="block text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                                                Select preceding lines to include in the agency fee calculation:
                                              </span>
                                              <span className="text-[10px] font-bold text-slate-500">
                                                Subtotal sum: {company.currency || 'BDT'} {
                                                  ((item.selectedLineIndices || [])
                                                    .filter((selectedIdx: number) => selectedIdx < idx && lineItems[selectedIdx])
                                                    .reduce((acc: number, selectedIdx: number) => acc + (lineItems[selectedIdx].amount || 0), 0)
                                                  ).toLocaleString()
                                                }
                                              </span>
                                            </div>
                                            
                                            {idx === 0 ? (
                                              <div className="text-[10px] text-amber-600 italic">
                                                Add standard lines above this agency fee item to select them.
                                              </div>
                                            ) : (
                                              <div className="flex flex-wrap gap-2 pt-1 max-h-[120px] overflow-y-auto">
                                                {lineItems.slice(0, idx).map((preced, pIdx) => {
                                                  const isSelected = (item.selectedLineIndices || []).includes(pIdx);
                                                  return (
                                                    <label 
                                                      key={pIdx} 
                                                      className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                                                        isSelected 
                                                          ? 'bg-indigo-100 border-indigo-200 text-indigo-800 font-semibold' 
                                                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-750'
                                                      }`}
                                                    >
                                                      <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => togglePrecedingLineSelection(idx, pIdx)}
                                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3 h-3 cursor-pointer"
                                                      />
                                                      <span className="truncate max-w-[150px]">
                                                        #{pIdx + 1}: {preced.description || '(Empty description)'}
                                                      </span>
                                                      <span className="font-mono text-[10px] opacity-75">
                                                        ({(preced.amount || 0).toLocaleString()})
                                                      </span>
                                                    </label>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    )}

                                    {/* Reimbursement Direct Labor Cost Sub-row Editor */}
                                    {item.isReimbursementLabor && (
                                      <tr className="bg-emerald-50/5">
                                        <td colSpan={8} className="p-3 border-b border-emerald-100">
                                          <div className="bg-white border border-emerald-150 rounded-xl p-4 space-y-4 shadow-xs">
                                            <div className="flex items-center justify-between">
                                              <div>
                                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                                  <Clock className="w-4 h-4 text-emerald-500" />
                                                  Direct Labor Details - Resource Breakdown Table
                                                </h4>
                                                <p className="text-[10px] text-slate-500 mt-0.5">
                                                  Select Designation to populate hourly rate card. Change values to recalculate total price.
                                                </p>
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const updated = [...lineItems];
                                                  const currentLabor = updated[idx].laborItems || [];
                                                  const newLaborItem = {
                                                    id: `labor-item-${Date.now()}-${currentLabor.length}`,
                                                    department: 'Planning Department',
                                                    designation: '',
                                                    ftePercentage: '10%',
                                                    hourlyRate: 0,
                                                    hours: 0,
                                                    amount: 0
                                                  };
                                                  updated[idx] = {
                                                    ...updated[idx],
                                                    laborItems: [...currentLabor, newLaborItem]
                                                  };
                                                  setLineItems(recalculateLineItems(updated));
                                                }}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                                              >
                                                <Plus className="w-3.5 h-3.5" />
                                                Add Designation Line
                                              </button>
                                            </div>

                                            <div className="overflow-x-auto border border-slate-100 rounded-lg">
                                              <table className="w-full text-left text-xs border-collapse">
                                                <thead>
                                                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                                                    <th className="p-2 w-10 text-center">SL#</th>
                                                    <th className="p-2 w-1/4">Department</th>
                                                    <th className="p-2 w-1/4">Direct Labor Details (Designation)</th>
                                                    <th className="p-2 w-24 text-center">FTE Required</th>
                                                    <th className="p-2 w-32 text-right">Time Cost/Hour ({company.currency || 'BDT'})</th>
                                                    <th className="p-2 w-24 text-center">Hours</th>
                                                    <th className="p-2 w-32 text-right">Total price ({company.currency || 'BDT'})</th>
                                                    <th className="p-2 w-10 text-center"></th>
                                                  </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 font-medium">
                                                  {(item.laborItems || []).map((labor, lIdx) => (
                                                    <tr key={labor.id || lIdx} className="hover:bg-slate-50/40">
                                                      {/* SL# */}
                                                      <td className="p-2 text-center text-slate-400 font-mono text-[10px]">
                                                        {lIdx + 1}
                                                      </td>

                                                      {/* Department */}
                                                      <td className="p-2">
                                                        <input
                                                          type="text"
                                                          placeholder="e.g. Account Management"
                                                          value={labor.department}
                                                          onChange={(e) => {
                                                            const updated = [...lineItems];
                                                            const currentLabor = [...(updated[idx].laborItems || [])];
                                                            currentLabor[lIdx] = {
                                                              ...currentLabor[lIdx],
                                                              department: e.target.value
                                                            };
                                                            updated[idx] = { ...updated[idx], laborItems: currentLabor };
                                                            setLineItems(recalculateLineItems(updated));
                                                          }}
                                                          className="w-full p-1 border border-slate-200 rounded text-xs text-slate-800 bg-slate-50 focus:bg-white"
                                                        />
                                                      </td>

                                                      {/* Designation Select / Input */}
                                                      <td className="p-2">
                                                        <select
                                                          value={labor.designation}
                                                          onChange={(e) => {
                                                            const selectedDesig = e.target.value;
                                                            const matchedRate = laborRates.find(r => r.designation === selectedDesig);
                                                            
                                                            const updated = [...lineItems];
                                                            const currentLabor = [...(updated[idx].laborItems || [])];
                                                            
                                                            currentLabor[lIdx] = {
                                                              ...currentLabor[lIdx],
                                                              designation: selectedDesig,
                                                              department: matchedRate ? matchedRate.department : currentLabor[lIdx].department,
                                                              hourlyRate: matchedRate ? matchedRate.hourlyRate : currentLabor[lIdx].hourlyRate,
                                                              amount: (matchedRate ? matchedRate.hourlyRate : currentLabor[lIdx].hourlyRate) * currentLabor[lIdx].hours
                                                            };
                                                            updated[idx] = { ...updated[idx], laborItems: currentLabor };
                                                            setLineItems(recalculateLineItems(updated));
                                                          }}
                                                          className="w-full p-1 border border-slate-200 rounded text-xs text-slate-850 font-semibold bg-white"
                                                        >
                                                          <option value="">-- Select Designation --</option>
                                                          {laborRates.map((r, ri) => (
                                                            <option key={ri} value={r.designation}>
                                                              {r.designation} ({company.currency || 'BDT'} {r.hourlyRate}/hr)
                                                            </option>
                                                          ))}
                                                        </select>
                                                      </td>

                                                      {/* FTE Percentage */}
                                                      <td className="p-2">
                                                        <input
                                                          type="text"
                                                          placeholder="e.g. 50%"
                                                          value={labor.ftePercentage || ''}
                                                          onChange={(e) => {
                                                            const updated = [...lineItems];
                                                            const currentLabor = [...(updated[idx].laborItems || [])];
                                                            currentLabor[lIdx] = {
                                                              ...currentLabor[lIdx],
                                                              ftePercentage: e.target.value
                                                            };
                                                            updated[idx] = { ...updated[idx], laborItems: currentLabor };
                                                            setLineItems(recalculateLineItems(updated));
                                                          }}
                                                          className="w-full p-1 border border-slate-200 rounded text-xs text-center"
                                                        />
                                                      </td>

                                                      {/* Hourly Rate */}
                                                      <td className="p-2">
                                                        <input
                                                          type="number"
                                                          min={0}
                                                          value={labor.hourlyRate}
                                                          onChange={(e) => {
                                                            const rateVal = Number(e.target.value);
                                                            const updated = [...lineItems];
                                                            const currentLabor = [...(updated[idx].laborItems || [])];
                                                            currentLabor[lIdx] = {
                                                              ...currentLabor[lIdx],
                                                              hourlyRate: rateVal,
                                                              amount: rateVal * currentLabor[lIdx].hours
                                                            };
                                                            updated[idx] = { ...updated[idx], laborItems: currentLabor };
                                                            setLineItems(recalculateLineItems(updated));
                                                          }}
                                                          className="w-full p-1 border border-slate-200 rounded text-xs text-right font-mono font-bold text-slate-800 focus:bg-white"
                                                        />
                                                      </td>

                                                      {/* Hours */}
                                                      <td className="p-2">
                                                        <input
                                                          type="number"
                                                          min={0}
                                                          disabled
                                                          value={labor.hours}
                                                          className="w-full p-1 border border-slate-200 rounded text-xs text-center font-bold text-slate-500 bg-slate-50 cursor-not-allowed"
                                                          title="Calculated automatically using standard formula =ROUNDUP(20.417*8*<FTE %>)"
                                                        />
                                                      </td>

                                                      {/* Total Price (BDT) */}
                                                      <td className="p-2 text-right font-bold text-slate-900 font-mono">
                                                        {Number(labor.amount).toLocaleString()}
                                                      </td>

                                                      {/* Action - Delete row */}
                                                      <td className="p-2 text-center">
                                                        <button
                                                          type="button"
                                                          onClick={() => {
                                                            const updated = [...lineItems];
                                                            const currentLabor = (updated[idx].laborItems || []).filter((_, li) => li !== lIdx);
                                                            updated[idx] = { ...updated[idx], laborItems: currentLabor };
                                                            setLineItems(recalculateLineItems(updated));
                                                          }}
                                                          className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-all cursor-pointer"
                                                        >
                                                          ✕
                                                        </button>
                                                      </td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                                <tfoot>
                                                  <tr className="bg-slate-50/50 font-bold border-t border-slate-200">
                                                    <td colSpan={6} className="p-2.5 text-right text-slate-600 text-xs">Total Direct Labor Subtotal Cost:</td>
                                                    <td className="p-2.5 text-right text-slate-900 font-mono text-xs">
                                                      {company.currency || 'BDT'} {(item.laborItems || []).reduce((acc: number, cur: any) => acc + (cur.amount || 0), 0).toLocaleString()}
                                                    </td>
                                                    <td></td>
                                                  </tr>
                                                  <tr className="bg-slate-50/30 border-t border-slate-100 font-semibold text-slate-600">
                                                    <td colSpan={6} className="p-2 text-right text-xs">
                                                      <div className="inline-flex items-center gap-2 justify-end w-full">
                                                        {item.discountInputMode === 'amount' ? (
                                                          <span className="inline-flex items-center gap-1.5">
                                                            Discount Amount:
                                                            <span className="text-slate-400 font-mono text-[11px]">{company.currency || 'BDT'}</span>
                                                            <input
                                                              type="number"
                                                              min={0}
                                                              step="any"
                                                              placeholder="0.00"
                                                              value={item.discountAmount !== undefined && item.discountAmount !== 0 ? item.discountAmount : ''}
                                                              onChange={(e) => {
                                                                const val = e.target.value === '' ? 0 : Number(e.target.value);
                                                                const updated = [...lineItems];
                                                                updated[idx] = { 
                                                                  ...updated[idx], 
                                                                  discountAmount: val,
                                                                  discountInputMode: 'amount'
                                                                };
                                                                setLineItems(recalculateLineItems(updated));
                                                              }}
                                                              className="w-24 p-1 border border-slate-200 bg-white rounded text-xs text-right text-slate-800 font-bold focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-mono"
                                                            />
                                                          </span>
                                                        ) : (
                                                          <span className="inline-flex items-center gap-1.5">
                                                            Discount Percentage:
                                                            <input
                                                              type="number"
                                                              min={0}
                                                              max={100}
                                                              step="any"
                                                              placeholder="0"
                                                              value={item.discountPercentage !== undefined && item.discountPercentage !== 0 ? item.discountPercentage : ''}
                                                              onChange={(e) => {
                                                                const val = e.target.value === '' ? 0 : Number(e.target.value);
                                                                const updated = [...lineItems];
                                                                updated[idx] = { 
                                                                  ...updated[idx], 
                                                                  discountPercentage: val,
                                                                  discountInputMode: 'percentage'
                                                                };
                                                                setLineItems(recalculateLineItems(updated));
                                                              }}
                                                              className="w-16 p-1 border border-slate-200 bg-white rounded text-xs text-center text-slate-800 font-bold focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                                                            />
                                                            %
                                                          </span>
                                                        )}
                                                        
                                                        <button
                                                          type="button"
                                                          onClick={() => {
                                                            const updated = [...lineItems];
                                                            const newMode = item.discountInputMode === 'amount' ? 'percentage' : 'amount';
                                                            updated[idx] = {
                                                              ...updated[idx],
                                                              discountInputMode: newMode
                                                            };
                                                            setLineItems(recalculateLineItems(updated));
                                                          }}
                                                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-[10px] font-bold tracking-wider uppercase transition-all border border-indigo-200 cursor-pointer"
                                                          title="Switch discount input mode (Percentage vs Fixed Amount)"
                                                        >
                                                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                          </svg>
                                                          {item.discountInputMode === 'amount' ? '% Rate' : 'Fixed'}
                                                        </button>
                                                      </div>
                                                    </td>
                                                    <td className="p-2 text-right font-mono text-xs text-rose-600">
                                                      {item.discountInputMode === 'amount' ? (
                                                        <span className="text-[10px] text-slate-400 font-semibold mr-2">
                                                          ({(item.discountPercentage || 0).toFixed(2)}%)
                                                        </span>
                                                      ) : null}
                                                      - {company.currency || 'BDT'} {(item.discountAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                                    </td>
                                                    <td></td>
                                                  </tr>
                                                  <tr className="bg-emerald-50/20 font-bold border-t border-emerald-100 text-emerald-800">
                                                    <td colSpan={6} className="p-2.5 text-right text-xs">Net Direct Labor Cost (Applied to Line Item):</td>
                                                    <td className="p-2.5 text-right text-emerald-600 font-mono text-xs">
                                                      {company.currency || 'BDT'} {(item.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                                    </td>
                                                    <td></td>
                                                  </tr>
                                                </tfoot>
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

                      {/* Add Scope Line Button Below Line Items */}
                      <button
                        type="button"
                        onClick={handleAddLine}
                        className="w-full py-2.5 border border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/50 text-xs font-semibold text-slate-500 hover:text-indigo-600 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-3"
                      >
                        <Plus className="w-4 h-4" /> Add Scope Line
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Controls of Left Column */}
                <div className="p-5 border-t border-slate-200 bg-slate-50 flex flex-col gap-2 shrink-0">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Net Subtotal:</span>
                    <span className="text-slate-800 font-bold">{company.currency || 'BDT'} {calculateSubtotal().toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Total VAT Amt:</span>
                    <span className="text-slate-800 font-bold">{company.currency || 'BDT'} {calculateTotalVat().toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-2 mt-1">
                    <span className="font-semibold text-slate-700">Grand Total Sum:</span>
                    <span className="text-xl font-black text-indigo-600">{company.currency || 'BDT'} {calculateGrandTotal().toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
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
                      className="flex-1 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
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
                <div className="flex-1 bg-slate-100 p-6 flex flex-col overflow-hidden animate-fade-in">
                  <div className="flex justify-between items-center mb-3 shrink-0">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" /> Real-time Client Proposal Preview
                    </span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 font-bold uppercase">
                      Interactive View
                    </span>
                  </div>
                  
                  {/* Live rendered content */}
                  <div className="flex-1 overflow-y-auto p-4 bg-slate-200 border border-slate-300/60 rounded-xl flex items-start justify-center">
                    <div className="bg-white text-slate-950 rounded-lg w-full max-w-2xl shadow-xl overflow-hidden my-auto p-1 text-left border border-slate-300">
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
