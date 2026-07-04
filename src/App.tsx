/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  UserRole,
  Company,
  User,
  Project,
  Estimate,
  Invoice,
  Vendor,
  WorkOrder,
  VendorBill,
  AdvanceRequest,
  Payment,
  Client
} from './types';

import {
  INITIAL_COMPANIES,
  INITIAL_USERS,
  INITIAL_PROJECTS,
  INITIAL_ESTIMATES,
  INITIAL_INVOICES,
  INITIAL_VENDORS,
  INITIAL_WORK_ORDERS,
  INITIAL_VENDOR_BILLS,
  INITIAL_ADVANCE_REQUESTS,
  INITIAL_PAYMENTS
} from './components/MockDataEngine';

import PrismaSchemaView from './components/PrismaSchemaView';
import FolderStructureView from './components/FolderStructureView';
import AuthMiddlewareView from './components/AuthMiddlewareView';
import ProjectTracker from './components/ProjectTracker';
import EstimatesModule from './components/EstimatesModule';
import InvoicesModule from './components/InvoicesModule';
import VendorModule from './components/VendorModule';
import PaymentsModule from './components/PaymentsModule';
import VatAuditModule from './components/VatAuditModule';
import CompanySettings from './components/CompanySettings';

import {
  ShieldAlert,
  Building,
  UserCheck,
  ChevronDown,
  LayoutDashboard,
  FileSpreadsheet,
  Receipt,
  Briefcase,
  Layers,
  DollarSign,
  ClipboardCheck,
  Globe,
  Settings,
  BookOpen,
  Calendar,
  Sparkles,
  Search,
  ExternalLink
} from 'lucide-react';

export default function App() {
  // Load simulated DB from localstorage or use defaults
  const [companies, setCompanies] = useState<Company[]>(() => {
    const saved = localStorage.getItem('erp_companies');
    let parsed = saved ? JSON.parse(saved) : INITIAL_COMPANIES;
    if (Array.isArray(parsed)) {
      parsed = parsed.map(c => {
        if (c.id === 'comp-acme' && (c.name === 'Acme Enterprise Solutions' || !c.currency)) {
          return {
            ...c,
            name: 'X Solutions Limited',
            currency: 'BDT',
            bankDetails: {
              ...c.bankDetails,
              bankName: 'City Bank Bangladesh',
              accountNo: 'CB-9902-8812-BDT'
            }
          };
        }
        return c;
      });
    }
    return parsed;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('erp_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('erp_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  const [estimates, setEstimates] = useState<Estimate[]>(() => {
    const saved = localStorage.getItem('erp_estimates');
    return saved ? JSON.parse(saved) : INITIAL_ESTIMATES;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('erp_invoices');
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    const saved = localStorage.getItem('erp_vendors');
    return saved ? JSON.parse(saved) : INITIAL_VENDORS;
  });

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => {
    const saved = localStorage.getItem('erp_workorders');
    return saved ? JSON.parse(saved) : INITIAL_WORK_ORDERS;
  });

  const [bills, setBills] = useState<VendorBill[]>(() => {
    const saved = localStorage.getItem('erp_bills');
    return saved ? JSON.parse(saved) : INITIAL_VENDOR_BILLS;
  });

  const [advanceRequests, setAdvanceRequests] = useState<AdvanceRequest[]>(() => {
    const saved = localStorage.getItem('erp_advances');
    return saved ? JSON.parse(saved) : INITIAL_ADVANCE_REQUESTS;
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem('erp_payments');
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('erp_clients');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'cli-skyline', companyId: 'comp-acme', name: 'Skyline Assets Group Inc', address: '452 Skyline Parkway, Suite 100, New York, NY 10001', isApproved: true },
      { id: 'cli-pipeline', companyId: 'comp-acme', name: 'Enterprise Cloud Technologies', address: '1024 Automation Way, Silicon Valley, CA 94025', isApproved: true },
      { id: 'cli-marina', companyId: 'comp-acme', name: 'Waterfront Developers Ltd', address: '88 Marina Blvd, San Francisco, CA 94109', isApproved: true },
      { id: 'cli-globbuilders', companyId: 'comp-acme', name: 'Global Builders Inc', address: '789 Construction Ave, Chicago, IL 60611', isApproved: true }
    ];
  });

  // Current simulation state
  const [activeCompanyId, setActiveCompanyId] = useState('comp-acme');
  const [activeUserId, setActiveUserId] = useState('user-admin');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'estimates' | 'invoices' | 'projects' | 'workorders' | 'payments' | 'vat-dept' | 'vendor-portal' | 'architecture' | 'settings'>('dashboard');
  const [invoicePreselectedEstimateId, setInvoicePreselectedEstimateId] = useState<string | null>(null);

  const [archSubTab, setArchSubTab] = useState<'prisma' | 'folders' | 'middleware'>('prisma');

  // Trigger state persistence
  useEffect(() => {
    localStorage.setItem('erp_companies', JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem('erp_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('erp_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('erp_estimates', JSON.stringify(estimates));
  }, [estimates]);

  useEffect(() => {
    localStorage.setItem('erp_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('erp_vendors', JSON.stringify(vendors));
  }, [vendors]);

  useEffect(() => {
    localStorage.setItem('erp_workorders', JSON.stringify(workOrders));
  }, [workOrders]);

  useEffect(() => {
    localStorage.setItem('erp_bills', JSON.stringify(bills));
  }, [bills]);

  useEffect(() => {
    localStorage.setItem('erp_advances', JSON.stringify(advanceRequests));
  }, [advanceRequests]);

  useEffect(() => {
    localStorage.setItem('erp_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('erp_clients', JSON.stringify(clients));
  }, [clients]);

  // Derived state values
  const currentCompany = companies.find(c => c.id === activeCompanyId) || companies[0];
  const currentUser = users.find(u => u.id === activeUserId) || users[0];

  // Access constraints helper based on the user's selected role
  const isAllowedTab = (tabName: string) => {
    const role = currentUser.role;
    if (role === UserRole.MASTER_ADMIN || role === UserRole.ADMIN) return true;

    switch (tabName) {
      case 'dashboard':
      case 'projects':
      case 'architecture':
        return true;
      case 'estimates':
        return [UserRole.CS_USER, UserRole.CS_MANAGER, UserRole.FINANCE_USER, UserRole.FINANCE_MANAGER].includes(role);
      case 'invoices':
        return [UserRole.FINANCE_USER, UserRole.FINANCE_MANAGER, UserRole.CS_USER].includes(role);
      case 'workorders':
        return [UserRole.CS_USER, UserRole.CS_MANAGER, UserRole.FINANCE_USER].includes(role);
      case 'payments':
        return [UserRole.FINANCE_USER, UserRole.FINANCE_MANAGER].includes(role);
      case 'vat-dept':
        return role === UserRole.VAT_DEPT_USER;
      case 'vendor-portal':
        return role === UserRole.VENDOR;
      case 'settings':
        return false;
      default:
        return false;
    }
  };

  // Ensure redirect if active user's permissions block active tab
  useEffect(() => {
    if (!isAllowedTab(activeTab)) {
      if (currentUser.role === UserRole.VENDOR) {
        setActiveTab('vendor-portal');
      } else if (currentUser.role === UserRole.VAT_DEPT_USER) {
        setActiveTab('vat-dept');
      } else {
        setActiveTab('dashboard');
      }
    }
  }, [activeUserId]);

  // Handler helpers
  const handleCreateProject = (projData: Omit<Project, 'companyId' | 'costIncurred' | 'revenueRecognized'> & { id?: string }) => {
    const newProj: Project = {
      ...projData,
      id: projData.id || `proj-gen-${Date.now()}`,
      companyId: activeCompanyId,
      costIncurred: 0,
      revenueRecognized: 0
    };
    setProjects([newProj, ...projects]);
  };

  const handleLinkProjectToEstimate = (estimateId: string, projectId: string, selectedLineItemIds: string[]) => {
    setEstimates(estimates.map(est => {
      if (est.id === estimateId) {
        const updatedLineItems = (est.lineItems || []).map(item => {
          if (selectedLineItemIds.includes(item.id)) {
            return { ...item, projectId };
          }
          return item;
        });
        return {
          ...est,
          projectId,
          lineItems: updatedLineItems
        };
      }
      return est;
    }));
  };

  const handleCreateEstimate = (estData: Omit<Estimate, 'id' | 'companyId' | 'createdAt'>) => {
    const newEst: Estimate = {
      ...estData,
      id: `est-gen-${Math.floor(Math.random() * 899) + 100}`,
      companyId: activeCompanyId,
      createdAt: new Date().toISOString(),
      financeApproved: false
    };
    setEstimates([newEst, ...estimates]);
  };

  const handleApproveEstimate = (estId: string, approverId: string) => {
    setEstimates(estimates.map(est => {
      if (est.id === estId) {
        const nextCsApproved = true;
        const nextFinApproved = est.financeApproved || false;
        const nextStatus = (nextCsApproved && nextFinApproved) ? 'APPROVED' : est.clientStatus;
        return { 
          ...est, 
          csManagerApproved: nextCsApproved, 
          csManagerApproverId: approverId, 
          clientStatus: nextStatus as any 
        };
      }
      return est;
    }));
  };

  const handleApproveFinanceEstimate = (estId: string, approverId: string) => {
    setEstimates(estimates.map(est => {
      if (est.id === estId) {
        const nextCsApproved = est.csManagerApproved || false;
        const nextFinApproved = true;
        const nextStatus = (nextCsApproved && nextFinApproved) ? 'APPROVED' : est.clientStatus;
        return { 
          ...est, 
          financeApproved: nextFinApproved, 
          financeApproverId: approverId, 
          clientStatus: nextStatus as any 
        };
      }
      return est;
    }));
  };

  const handleRejectEstimate = (estId: string, notes: string) => {
    setEstimates(estimates.map(est => {
      if (est.id === estId) {
        return { 
          ...est, 
          csManagerApproved: false, 
          financeApproved: false, 
          clientStatus: 'REJECTED', 
          rejectionNotes: notes 
        };
      }
      return est;
    }));
  };

  const handleEditEstimate = (estId: string, updatedData: Partial<Estimate>) => {
    setEstimates(estimates.map(est => {
      if (est.id === estId) {
        return {
          ...est,
          ...updatedData,
          csManagerApproved: false,
          financeApproved: false,
          clientStatus: 'DRAFT' as const
        };
      }
      return est;
    }));
  };

  const handleSyncQBOEstimate = (estId: string, qboId: string) => {
    setEstimates(estimates.map(est => {
      if (est.id === estId) return { ...est, qboId };
      return est;
    }));
  };

  const handleCreateInvoice = (invData: Omit<Invoice, 'id' | 'companyId' | 'createdAt'>) => {
    const newInv: Invoice = {
      ...invData,
      id: `inv-gen-${Math.floor(Math.random() * 899) + 100}`,
      companyId: activeCompanyId,
      createdAt: new Date().toISOString()
    };

    setInvoices([newInv, ...invoices]);
    setInvoicePreselectedEstimateId(null);

    // Update Project Cost/Revenue tracking metrics
    const relatedEst = estimates.find(e => invData.estimateIds.includes(e.id));
    if (relatedEst) {
      setProjects(projects.map(p => {
        if (p.id === relatedEst.projectId) {
          return {
            ...p,
            revenueRecognized: p.revenueRecognized + invData.totalAmount
          };
        }
        return p;
      }));
    }
  };

  const handleUpdateInvoice = (invoiceId: string, updatedData: Partial<Invoice>) => {
    setInvoices(invoices.map(inv => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          ...updatedData
        };
      }
      return inv;
    }));
  };

  const handleSyncInvoiceQBO = (invId: string, qboId: string) => {
    setInvoices(invoices.map(inv => {
      if (inv.id === invId) return { ...inv, qboId };
      return inv;
    }));
  };

  const handleUpdateVendorBank = (vendorId: string, bankName: string, accountNo: string, routingNo: string) => {
    setVendors(vendors.map(v => {
      if (v.id === vendorId) {
        return {
          ...v,
          bankDetails: { bankName, accountNo, routingNo }
        };
      }
      return v;
    }));
  };

  const handleSubmitBill = (billData: Omit<VendorBill, 'id' | 'createdAt'>) => {
    const newBill: VendorBill = {
      ...billData,
      id: `bill-gen-${Math.floor(Math.random() * 899) + 100}`,
      createdAt: new Date().toISOString()
    };
    setBills([newBill, ...bills]);
  };

  const handleSubmitAdvance = (advData: Omit<AdvanceRequest, 'id' | 'createdAt'>) => {
    const newAdv: AdvanceRequest = {
      ...advData,
      id: `adv-gen-${Math.floor(Math.random() * 899) + 100}`,
      createdAt: new Date().toISOString()
    };
    setAdvanceRequests([newAdv, ...advanceRequests]);
  };

  const handleCreatePayment = (payData: Omit<Payment, 'id' | 'companyId' | 'createdAt'>) => {
    const newPay: Payment = {
      ...payData,
      id: `pay-gen-${Math.floor(Math.random() * 899) + 100}`,
      companyId: activeCompanyId,
      createdAt: new Date().toISOString()
    };
    setPayments([newPay, ...payments]);
  };

  const handleApprovePayment = (payId: string, approverId: string) => {
    const pay = payments.find(p => p.id === payId);
    if (!pay) return;

    setPayments(payments.map(p => {
      if (p.id === payId) return { ...p, status: 'PAID', financeManagerApproverId: approverId };
      return p;
    }));

    // Mark linked Vendor Bill as PAID and trigger cost incurred on Project
    if (pay.vendorBillId) {
      setBills(bills.map(b => {
        if (b.id === pay.vendorBillId) return { ...b, status: 'PAID' };
        return b;
      }));

      const bill = bills.find(b => b.id === pay.vendorBillId);
      const wo = workOrders.find(w => w.id === bill?.workOrderId);
      if (wo) {
        setProjects(projects.map(p => {
          if (p.id === wo.projectId) {
            return {
              ...p,
              costIncurred: p.costIncurred + pay.amount
            };
          }
          return p;
        }));
      }
    }
  };

  const handleRejectPayment = (payId: string) => {
    setPayments(payments.map(p => {
      if (p.id === payId) return { ...p, status: 'REJECTED' };
      return p;
    }));
  };

  const handleSyncPaymentQBO = (payId: string, qboId: string) => {
    setPayments(payments.map(p => {
      if (p.id === payId) return { ...p, qboId };
      return p;
    }));
  };

  const handleVerifyVatDocs = (billId: string) => {
    setBills(bills.map(b => {
      if (b.id === billId) {
        return {
          ...b,
          grnGenerated: true,
          hardcopyReceivedConfirmation: true,
          status: 'VAT_VERIFIED'
        };
      }
      return b;
    }));
  };

  const handleCreateClient = (clientData: Omit<Client, 'id' | 'companyId' | 'isApproved' | 'createdBy'>) => {
    const newClient: Client = {
      ...clientData,
      id: `cli-${Date.now()}`,
      companyId: activeCompanyId,
      isApproved: false, // Pending initially for CS User
      createdBy: currentUser.name
    };
    setClients(prev => [...prev, newClient]);
  };

  const handleApproveClient = (clientId: string) => {
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          isApproved: true,
          approvedBy: currentUser.name
        };
      }
      return c;
    }));
  };

  const handleUpdateCompany = (companyData: Partial<Company>) => {
    setCompanies(companies.map(c => {
      if (c.id === activeCompanyId) {
        return {
          ...c,
          ...companyData,
          bankDetails: companyData.bankDetails ? { ...c.bankDetails, ...companyData.bankDetails } : c.bankDetails,
          templates: companyData.templates ? { ...c.templates, ...companyData.templates } : c.templates
        };
      }
      return c;
    }));
  };

  // KPI calculations
  const totalRevenue = projects.reduce((acc, proj) => {
    const assignedItems = estimates.flatMap(e => e.lineItems || []).filter(item => item.projectId === proj.id);
    const assignedItemIds = assignedItems.map(item => item.id);

    let salesReceive = 0;
    invoices.forEach(inv => {
      let projectLineItemsSubtotal = 0;
      const hasLineItemReferences = inv.lineItems?.some(li => li.sourceLineItemId && assignedItemIds.includes(li.sourceLineItemId));
      
      if (hasLineItemReferences) {
        inv.lineItems.forEach(li => {
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
        const hasAnyEstimateWithProj = inv.estimateIds?.some(estId => {
          const est = estimates.find(e => e.id === estId);
          return est && est.projectId === proj.id;
        });
        if (hasAnyEstimateWithProj) {
          salesReceive += inv.totalAmount;
        }
      }
    });
    return acc + (salesReceive || proj.revenueRecognized || 0);
  }, 0);

  const totalCost = projects.reduce((acc, proj) => {
    const projectWorkOrders = workOrders.filter(wo => wo.projectId === proj.id);
    const projectBills = bills.filter(b => projectWorkOrders.some(wo => wo.id === b.workOrderId));
    const calculatedCost = projectBills.reduce((sum, b) => sum + b.amount, 0);
    return acc + (calculatedCost || proj.costIncurred || 0);
  }, 0);

  const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;

  const totalEstimatesCount = estimates.length;
  const activeEstimatesValue = estimates
    .filter(e => e.clientStatus === 'APPROVED' || e.clientStatus === 'SENT')
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

  const pendingPaymentsCount = payments.filter(p => p.status === 'PENDING_APPROVAL').length;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col text-zinc-800 antialiased font-sans">
      
      {/* 1. Simulation Top Header Block */}
      <div className="bg-zinc-900 text-white border-b border-zinc-800 px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4 z-40">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <Building className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent">
              METASAAS ERP ENGINE
            </span>
            <p className="text-[10px] text-zinc-400 font-medium">SaaS Multi-Tenant Role & Database Simulator</p>
          </div>
        </div>

        {/* Dynamic switcher */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          {/* Tenant Switcher */}
          <div className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700/60 px-2.5 py-1.5 rounded-lg">
            <span className="text-[10px] text-zinc-400 uppercase font-mono">Tenant:</span>
            <select
              value={activeCompanyId}
              onChange={(e) => setActiveCompanyId(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-hidden cursor-pointer"
            >
              {companies.map(c => (
                <option key={c.id} value={c.id} className="bg-zinc-900 text-white">{c.name}</option>
              ))}
            </select>
          </div>

          {/* User Switcher */}
          <div className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700/60 px-2.5 py-1.5 rounded-lg">
            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] text-zinc-400 uppercase font-mono">Role:</span>
            <select
              value={activeUserId}
              onChange={(e) => setActiveUserId(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-hidden cursor-pointer"
            >
              {users.map(u => (
                <option key={u.id} value={u.id} className="bg-zinc-900 text-white">
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* 2. Left Sidebar Navigation */}
        <aside className="w-full md:w-64 bg-zinc-900 text-zinc-300 border-r border-zinc-800 flex flex-col justify-between p-4 space-y-6">
          <div className="space-y-6">
            
            {/* Active profile badge */}
            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80">
              <span className="text-[10px] font-mono text-indigo-400 block tracking-wider uppercase font-bold">Logged Staff</span>
              <p className="text-sm font-semibold text-white mt-0.5">{currentUser.name}</p>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700 px-2 py-0.5 rounded-full mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                {currentUser.role}
              </div>
            </div>

            <nav className="space-y-1">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-2.5 mb-2">Internal Staff Tools</p>
              
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'dashboard' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white border border-transparent'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Executive Dashboard</span>
              </button>

              <button
                onClick={() => setActiveTab('projects')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'projects' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white border border-transparent'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Project Costings</span>
              </button>

              {isAllowedTab('estimates') && (
                <button
                  onClick={() => setActiveTab('estimates')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'estimates' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white border border-transparent'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Estimates (CS)</span>
                </button>
              )}

              {isAllowedTab('invoices') && (
                <button
                  onClick={() => setActiveTab('invoices')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'invoices' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white border border-transparent'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  <span>Commercial Invoices</span>
                </button>
              )}

              {isAllowedTab('payments') && (
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'payments' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white border border-transparent'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Payments & AP</span>
                </button>
              )}

              {/* VAT Audit portal tab */}
              {isAllowedTab('vat-dept') && (
                <button
                  onClick={() => setActiveTab('vat-dept')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'vat-dept' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white border border-transparent'
                  }`}
                >
                  <ClipboardCheck className="w-4 h-4 text-amber-500" />
                  <span>VAT Audit desk</span>
                </button>
              )}

              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-2.5 pt-4 mb-2">Partner Portals</p>
              
              {/* Vendor portal tab */}
              {isAllowedTab('vendor-portal') && (
                <button
                  onClick={() => setActiveTab('vendor-portal')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'vendor-portal' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white border border-transparent'
                  }`}
                >
                  <Globe className="w-4 h-4 text-sky-400" />
                  <span>Supplier Vendor Hub</span>
                </button>
              )}

              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-2.5 pt-4 mb-2">Architect Spec Hub</p>

              <button
                onClick={() => setActiveTab('architecture')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'architecture' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white border border-transparent'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Prisma Schema & Code</span>
              </button>

              {currentUser.role === UserRole.ADMIN && (
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'settings' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white border border-transparent'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Tenant templates</span>
                </button>
              )}
            </nav>
          </div>

          <div className="text-[10px] text-zinc-500 text-center border-t border-zinc-800 pt-3">
            Acme Tenant Cluster Node v1.4
          </div>
        </aside>

        {/* 3. Main Dashboard Window */}
        <main className="flex-1 p-6 overflow-y-auto space-y-6 max-h-[calc(100vh-60px)]">
          
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              {/* Header metrics card */}
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-[10px] text-zinc-300 font-mono uppercase font-semibold">Active Enterprise Accountancy</span>
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight mt-1">{currentCompany.name}</h1>
                  <p className="text-xs text-zinc-300/80 mt-1">Multi-tenant isolation active. Client portal accounts synchronized with QBO ledger nodes.</p>
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-xl text-right shrink-0">
                  <span className="text-[10px] text-zinc-300 block">Settlement Transit Code</span>
                  <span className="text-xs font-mono font-bold">{currentCompany.bankDetails.routingNo}</span>
                </div>
              </div>

              {/* KPI metrics row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white border border-zinc-200 p-4 rounded-xl flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-xs font-semibold text-zinc-400 block uppercase">Total Revenue</span>
                    <span className="text-lg font-bold text-zinc-900 mt-1">{currentCompany.currency || 'BDT'} {totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-lg border border-emerald-100">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white border border-zinc-200 p-4 rounded-xl flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-xs font-semibold text-zinc-400 block uppercase">Procurement Costs</span>
                    <span className="text-lg font-bold text-zinc-900 mt-1">{currentCompany.currency || 'BDT'} {totalCost.toLocaleString()}</span>
                  </div>
                  <div className="bg-zinc-50 text-zinc-600 p-2.5 rounded-lg border border-zinc-100">
                    <Layers className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white border border-zinc-200 p-4 rounded-xl flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-xs font-semibold text-zinc-400 block uppercase">Commercial Margin</span>
                    <span className="text-lg font-bold text-indigo-600 mt-1">{profitMargin.toFixed(1)}%</span>
                  </div>
                  <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-lg border border-indigo-100">
                    <LayoutDashboard className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white border border-zinc-200 p-4 rounded-xl flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-xs font-semibold text-zinc-400 block uppercase">AP Audit Queue</span>
                    <span className="text-lg font-bold text-zinc-900 mt-1">{pendingPaymentsCount} Payouts</span>
                  </div>
                  <div className="bg-amber-50 text-amber-700 p-2.5 rounded-lg border border-amber-100">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Live Status and Quick Access */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Simulated QuickBooks Ledger Status */}
                <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-4">
                  <div className="flex justify-between items-center border-b pb-3">
                    <h3 className="font-bold text-zinc-900 tracking-tight text-sm uppercase">QuickBooks Online Sync Dashboard</h3>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      ✓ CONNECTED
                    </span>
                  </div>
                  
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between p-2 rounded-lg bg-zinc-50 border">
                      <span className="text-zinc-600 font-medium">Auto-Sync Sync Webhooks</span>
                      <span className="font-bold text-emerald-600">Active (Websockets enabled)</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-zinc-50 border">
                      <span className="text-zinc-600 font-medium">Customer Estimates Synced</span>
                      <span className="font-bold text-zinc-800">
                        {estimates.filter(e => e.qboId).length} / {estimates.length}
                      </span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-zinc-50 border">
                      <span className="text-zinc-600 font-medium">Invoices Reconciled</span>
                      <span className="font-bold text-zinc-800">
                        {invoices.filter(i => i.qboId).length} / {invoices.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Simulated File Storage Node (Firebase Node) */}
                <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-4">
                  <div className="flex justify-between items-center border-b pb-3">
                    <h3 className="font-bold text-zinc-900 tracking-tight text-sm uppercase">Digital Documents (Storage Nodes)</h3>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                      ✓ ONLINE
                    </span>
                  </div>
                  
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between p-2 rounded-lg bg-zinc-50 border">
                      <span className="text-zinc-600 font-medium">Client Invoice PDFs Generated</span>
                      <span className="font-bold text-zinc-800">
                        {invoices.length} Files
                      </span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-zinc-50 border">
                      <span className="text-zinc-600 font-medium">Supplier Hardcopy Bills verified</span>
                      <span className="font-bold text-zinc-800">
                        {bills.filter(b => b.hardcopyReceivedConfirmation).length} Bills (GRN OK)
                      </span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-zinc-50 border">
                      <span className="text-zinc-600 font-medium">Digital Scan Uploader Status</span>
                      <span className="font-semibold text-sky-600">Secure Direct Upload Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <ProjectTracker
              projects={projects}
              estimates={estimates}
              invoices={invoices}
              workOrders={workOrders}
              bills={bills}
              payments={payments}
              onCreateProject={handleCreateProject}
              canCreate={['ADMIN', 'FINANCE_USER', 'FINANCE_MANAGER'].includes(currentUser.role)}
              company={currentCompany}
            />
          )}

          {activeTab === 'estimates' && (
            <EstimatesModule
              estimates={estimates}
              projects={projects}
              currentUser={currentUser}
              company={currentCompany}
              clients={clients}
              onCreateClient={handleCreateClient}
              onApproveClient={handleApproveClient}
              onCreateEstimate={handleCreateEstimate}
              onApproveEstimate={handleApproveEstimate}
              onApproveFinanceEstimate={handleApproveFinanceEstimate}
              onRejectEstimate={handleRejectEstimate}
              onEditEstimate={handleEditEstimate}
              onSyncQBO={handleSyncQBOEstimate}
              onCreateProject={handleCreateProject}
              onLinkProjectToEstimate={handleLinkProjectToEstimate}
              onConvertToInvoice={(estId) => {
                setInvoicePreselectedEstimateId(estId);
                setActiveTab('invoices');
              }}
            />
          )}

          {activeTab === 'invoices' && (
            <InvoicesModule
              invoices={invoices}
              estimates={estimates}
              projects={projects}
              currentUser={currentUser}
              company={currentCompany}
              onCreateInvoice={handleCreateInvoice}
              onUpdateInvoice={handleUpdateInvoice}
              onSyncQBO={handleSyncInvoiceQBO}
              preselectedEstimateId={invoicePreselectedEstimateId}
              onClearPreselectedEstimateId={() => setInvoicePreselectedEstimateId(null)}
            />
          )}

          {activeTab === 'payments' && (
            <PaymentsModule
              payments={payments}
              bills={bills}
              vendors={vendors}
              currentUser={currentUser}
              company={currentCompany}
              onCreatePayment={handleCreatePayment}
              onApprovePayment={handleApprovePayment}
              onRejectPayment={handleRejectPayment}
              onSyncQBO={handleSyncPaymentQBO}
            />
          )}

          {activeTab === 'vat-dept' && (
            <VatAuditModule
              bills={bills}
              workOrders={workOrders}
              vendors={vendors}
              company={currentCompany}
              onVerifyVatDocs={handleVerifyVatDocs}
            />
          )}

          {activeTab === 'vendor-portal' && (
            <VendorModule
              vendors={vendors}
              workOrders={workOrders}
              bills={bills}
              advances={advanceRequests}
              projects={projects}
              currentUser={currentUser}
              company={currentCompany}
              onUpdateVendorBank={handleUpdateVendorBank}
              onSubmitBill={handleSubmitBill}
              onSubmitAdvance={handleSubmitAdvance}
            />
          )}

          {activeTab === 'settings' && (
            <CompanySettings
              company={currentCompany}
              onUpdateCompany={handleUpdateCompany}
            />
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-zinc-900 tracking-tight">System Architecture & Schema Specs</h2>
                <p className="text-sm text-zinc-500 mt-1">Review core database models, route middleware layout, and file arrangements</p>
              </div>

              {/* Sub-tabs for architecture details */}
              <div className="flex border-b border-zinc-200">
                <button
                  onClick={() => setArchSubTab('prisma')}
                  className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                    archSubTab === 'prisma' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Prisma schema.prisma
                </button>
                <button
                  onClick={() => setArchSubTab('folders')}
                  className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                    archSubTab === 'folders' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Next.js Folder Map
                </button>
                <button
                  onClick={() => setArchSubTab('middleware')}
                  className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                    archSubTab === 'middleware' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  middleware.ts Access Controls
                </button>
              </div>

              <div className="h-[520px]">
                {archSubTab === 'prisma' && <PrismaSchemaView />}
                {archSubTab === 'folders' && <FolderStructureView />}
                {archSubTab === 'middleware' && <AuthMiddlewareView />}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
