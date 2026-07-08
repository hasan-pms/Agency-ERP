/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
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
  Client,
  StoredFile,
  LaborRate
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
import DocumentStorageModule from './components/DocumentStorageModule';
import LaborRateCardModule from './components/LaborRateCardModule';
import { MasterAdminPanel, UserManagementPanel } from './components/AdminPanels';

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
  ExternalLink,
  UploadCloud,
  Users
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

  const [files, setFiles] = useState<StoredFile[]>(() => {
    const saved = localStorage.getItem('erp_files');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'file-101',
        name: 'Skyline_Site_Plan_Approved.pdf',
        size: 2450000,
        type: 'application/pdf',
        uploadedBy: 'user-cs-u', // Sarah CS Representative
        uploadedByName: 'Sarah CS Representative',
        uploadedAt: '2026-06-15T09:30:00Z',
        companyId: 'comp-acme',
        description: 'Detailed site plans for the Skyline office complex including approved fire access layouts.',
        projectId: 'proj-skyline',
        tags: ['Blueprint', 'Approval', 'Site Plan']
      },
      {
        id: 'file-102',
        name: 'Automation_Core_SLA_V2.docx',
        size: 850000,
        type: 'application/msword',
        uploadedBy: 'user-cs-u', // Sarah CS Representative
        uploadedByName: 'Sarah CS Representative',
        uploadedAt: '2026-06-18T14:15:00Z',
        companyId: 'comp-acme',
        description: 'Service Level Agreement draft with Enterprise Cloud Technologies.',
        projectId: 'proj-pipeline',
        tags: ['Agreement', 'Contract', 'SLA']
      },
      {
        id: 'file-103',
        name: 'Acme_Q1_Financials_Internal.xlsx',
        size: 154000,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        uploadedBy: 'user-cs-m', // Robert CS Manager
        uploadedByName: 'Robert CS Manager',
        uploadedAt: '2026-06-20T11:00:00Z',
        companyId: 'comp-acme',
        description: 'Internal project costing margins, revenue projections, and QBO reconciliation reports.',
        projectId: 'proj-marina',
        tags: ['Financials', 'Spreadsheet', 'QBO'],
        isConfidential: true
      }
    ];
  });
  
  const INITIAL_LABOR_RATES: LaborRate[] = [
    { id: 'rate-1', department: 'Planning Department', designation: 'Planning Executive', hourlyRate: 546 },
    { id: 'rate-2', department: 'Account Management', designation: 'Account Manager', hourlyRate: 1241 },
    { id: 'rate-3', department: 'Account Management', designation: 'Account Executive', hourlyRate: 546 },
    { id: 'rate-4', department: 'Content Development (Art Department)', designation: 'Animator 01', hourlyRate: 745 },
    { id: 'rate-5', department: 'Content Development (Art Department)', designation: 'Visualizer 01', hourlyRate: 546 },
    { id: 'rate-6', department: 'Content Development (Copy Department)', designation: 'Copy Supervisor', hourlyRate: 1489 },
    { id: 'rate-7', department: 'Content Development (Copy Department)', designation: 'Copywriter', hourlyRate: 546 }
  ];

  const [laborRates, setLaborRates] = useState<LaborRate[]>(() => {
    const saved = localStorage.getItem('erp_labor_rates');
    return saved ? JSON.parse(saved) : INITIAL_LABOR_RATES;
  });

  // Current simulation state
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const saved = localStorage.getItem('erp_logged_in');
    return saved ? JSON.parse(saved) : true;
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const matchedUser = users.find(u => u.email.toLowerCase() === loginEmail.trim().toLowerCase());
    if (!matchedUser) {
      setLoginError('Unauthorized: No user account matches this email address.');
      return;
    }
    const userPassword = matchedUser.password || 'password123';
    if (loginPassword !== userPassword) {
      setLoginError('Access Denied: Incorrect credentials entered.');
      return;
    }
    // Login successful
    setActiveUserId(matchedUser.id);
    setActiveCompanyId(matchedUser.companyId);
    setIsLoggedIn(true);
    setLoginEmail('');
    setLoginPassword('');
  };

  const [activeCompanyId, setActiveCompanyId] = useState('comp-acme');
  const [activeUserId, setActiveUserId] = useState('user-admin');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'estimates' | 'invoices' | 'projects' | 'workorders' | 'payments' | 'vat-dept' | 'vendor-portal' | 'architecture' | 'settings' | 'master-admin-panel' | 'user-mgmt' | 'document-hub' | 'labor-rates'>('dashboard');
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [invoicePreselectedEstimateId, setInvoicePreselectedEstimateId] = useState<string | null>(null);

  const [archSubTab, setArchSubTab] = useState<'prisma' | 'folders' | 'middleware'>('prisma');

  // Trigger state persistence
  useEffect(() => {
    localStorage.setItem('erp_logged_in', JSON.stringify(isLoggedIn));
  }, [isLoggedIn]);
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

  useEffect(() => {
    localStorage.setItem('erp_files', JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem('erp_labor_rates', JSON.stringify(laborRates));
  }, [laborRates]);

  // Derived state values
  const currentUser = users.find(u => u.id === activeUserId) || users[0];

  // Security lock: Non-Master Admins and normal staff are strictly bound to their companyId
  useEffect(() => {
    if (isLoggedIn && currentUser && currentUser.role !== UserRole.MASTER_ADMIN) {
      if (activeCompanyId !== currentUser.companyId) {
        setActiveCompanyId(currentUser.companyId);
      }
    }
  }, [isLoggedIn, currentUser, activeCompanyId]);

  const currentCompany = companies.find(c => c.id === activeCompanyId) || companies[0];

  // Access constraints helper based on the user's selected role
  const isAllowedTab = (tabName: string) => {
    const role = currentUser.role;
    if (tabName === 'master-admin-panel') {
      return role === UserRole.MASTER_ADMIN;
    }
    if (tabName === 'user-mgmt') {
      return role === UserRole.ADMIN || role === UserRole.MASTER_ADMIN;
    }
    if (role === UserRole.MASTER_ADMIN || role === UserRole.ADMIN) return true;

    switch (tabName) {
      case 'dashboard':
      case 'projects':
      case 'architecture':
      case 'document-hub':
        return true;
      case 'estimates':
        return [UserRole.CS_USER, UserRole.CS_MANAGER, UserRole.FINANCE_USER, UserRole.FINANCE_MANAGER].includes(role);
      case 'labor-rates':
        return ![UserRole.VENDOR, UserRole.VAT_DEPT_USER].includes(role);
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
          csManagerApproved: false,
          financeApproved: false,
          clientStatus: 'DRAFT' as const,
          ...updatedData
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

  // ----------------- MULTI-TENANT FILTERED COLLECTIONS -----------------
  // Filter all data based on the active multi-tenant company (activeCompanyId)
  const filteredProjects = projects.filter(p => p.companyId === activeCompanyId);
  
  // Get CS subordinates for supervisor/hierarchy visibility
  const mySubordinates = users.filter(u => u.managerId === currentUser.id && u.role === UserRole.CS_USER);
  const mySubordinateIds = mySubordinates.map(sub => sub.id);

  // Estimates filtered by role rules
  const filteredEstimates = estimates.filter(e => {
    if (e.companyId !== activeCompanyId) return false;
    
    // Admins and financial auditors have full tenant visibility
    if (currentUser.role === UserRole.MASTER_ADMIN || 
        currentUser.role === UserRole.ADMIN || 
        [UserRole.FINANCE_USER, UserRole.FINANCE_MANAGER].includes(currentUser.role)) {
      return true;
    }
    
    // CS Managers see their own and subordinate files
    if (currentUser.role === UserRole.CS_MANAGER) {
      return e.csUserId === currentUser.id || mySubordinateIds.includes(e.csUserId);
    }
    
    // CS Users see only self-authored estimates
    if (currentUser.role === UserRole.CS_USER) {
      return e.csUserId === currentUser.id;
    }
    
    return true; // default fallback
  });

  // Invoices filtered by role rules
  const filteredInvoices = invoices.filter(i => {
    if (i.companyId !== activeCompanyId) return false;
    
    if (currentUser.role === UserRole.MASTER_ADMIN || 
        currentUser.role === UserRole.ADMIN || 
        [UserRole.FINANCE_USER, UserRole.FINANCE_MANAGER].includes(currentUser.role)) {
      return true;
    }
    
    if (currentUser.role === UserRole.CS_MANAGER) {
      return i.csUserId === currentUser.id || mySubordinateIds.includes(i.csUserId);
    }
    
    if (currentUser.role === UserRole.CS_USER) {
      return i.csUserId === currentUser.id;
    }
    
    return true;
  });

  const filteredVendors = vendors.filter(v => v.companyId === activeCompanyId);
  const filteredWorkOrders = workOrders.filter(w => w.companyId === activeCompanyId);
  
  // Bills and Advance requests belong to WorkOrders of this company
  const filteredWorkOrderIds = filteredWorkOrders.map(w => w.id);
  const filteredBills = bills.filter(b => filteredWorkOrderIds.includes(b.workOrderId));
  const filteredAdvanceRequests = advanceRequests.filter(a => filteredWorkOrderIds.includes(a.workOrderId));
  
  const filteredPayments = payments.filter(p => p.companyId === activeCompanyId);
  const filteredClients = clients.filter(c => c.companyId === activeCompanyId);
  const filteredUsers = users.filter(u => u.companyId === activeCompanyId);

  // KPI calculations
  const totalRevenue = filteredProjects.reduce((acc, proj) => {
    const assignedItems = filteredEstimates.flatMap(e => e.lineItems || []).filter(item => item.projectId === proj.id);
    const assignedItemIds = assignedItems.map(item => item.id);

    let salesReceive = 0;
    filteredInvoices.forEach(inv => {
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
          const est = filteredEstimates.find(e => e.id === estId);
          return est && est.projectId === proj.id;
        });
        if (hasAnyEstimateWithProj) {
          salesReceive += inv.totalAmount;
        }
      }
    });
    return acc + (salesReceive || proj.revenueRecognized || 0);
  }, 0);

  const totalCost = filteredProjects.reduce((acc, proj) => {
    const projectWorkOrders = filteredWorkOrders.filter(wo => wo.projectId === proj.id);
    const projectBills = filteredBills.filter(b => projectWorkOrders.some(wo => wo.id === b.workOrderId));
    const calculatedCost = projectBills.reduce((sum, b) => sum + b.amount, 0);
    return acc + (calculatedCost || proj.costIncurred || 0);
  }, 0);

  const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;

  const totalEstimatesCount = filteredEstimates.length;
  const activeEstimatesValue = filteredEstimates
    .filter(e => e.clientStatus === 'APPROVED' || e.clientStatus === 'SENT')
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

  const pendingPaymentsCount = filteredPayments.filter(p => p.status === 'PENDING_APPROVAL').length;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center p-6 font-sans antialiased selection:bg-purple-500/30">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl space-y-6 relative overflow-hidden">
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl -ml-16 -mb-16"></div>

          <div className="text-center relative z-10 space-y-1">
            <div className="inline-flex p-3 bg-zinc-800 border border-zinc-700 text-purple-400 rounded-2xl mb-2">
              <Building className="w-6 h-6 animate-pulse" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-purple-400 via-indigo-400 to-sky-400 bg-clip-text text-transparent">
              METASAAS ERP GATEWAY
            </h1>
            <p className="text-xs text-zinc-400">Enter credentials to unlock multi-tenant sessions</p>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-950/40 border border-rose-900 text-rose-200 rounded-xl text-xs font-semibold leading-relaxed">
              ⚠️ {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4 relative z-10">
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-1.5">User ID / Email Address</label>
              <input
                type="email"
                required
                placeholder="master@saaserp.com or admin@company.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-zinc-600"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-1.5">Console Password</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-zinc-600"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs py-3 rounded-xl shadow-lg transition-all cursor-pointer transform active:scale-98"
            >
              Sign In & Authenticate Session
            </button>
          </form>

          {/* Quick-fill section */}
          <div className="border-t border-zinc-800/80 pt-4 space-y-2 relative z-10">
            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 block text-center">Simulation Demo Accounts</span>
            <div className="grid grid-cols-2 gap-2 text-[10px] max-h-48 overflow-y-auto pr-1">
              {users.map(u => (
                <button
                  key={u.id}
                  onClick={() => {
                    setLoginEmail(u.email);
                    setLoginPassword(u.password || 'password123');
                    setLoginError('');
                  }}
                  className="bg-zinc-950/60 hover:bg-zinc-850 border border-zinc-800/80 hover:border-zinc-700 p-2 rounded-lg text-left transition-all cursor-pointer flex flex-col justify-between"
                >
                  <span className="font-bold text-zinc-200 block truncate">{u.name}</span>
                  <span className="text-zinc-500 text-[9px] truncate">{u.role}</span>
                  <span className="text-purple-400 font-mono text-[8px] mt-0.5 truncate">PW: {u.password || 'password123'}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="text-[10px] text-zinc-600 mt-6 font-mono">MetaSaaS Enterprise Accounting Sandbox Node</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col text-zinc-800 antialiased font-sans">
      
      {/* 1. Simulation Top Header Block */}
      <div className="bg-zinc-900 text-white border-b border-zinc-800 px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4 z-40">
        <div className="flex items-center gap-4">
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

          {/* Sidebar Hide/Show Toggle */}
          <button
            id="global-sidebar-toggle"
            onClick={() => setIsSidebarHidden(!isSidebarHidden)}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 text-xs font-semibold cursor-pointer transition-all"
            title="Toggle Sidebar Navigation visibility"
          >
            {isSidebarHidden ? (
              <>
                <ChevronDown className="w-3 h-3 rotate-90" />
                <span>Show Sidebar</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3 -rotate-90" />
                <span>Hide Sidebar</span>
              </>
            )}
          </button>
        </div>

        {/* Dynamic switcher */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          {currentUser.role === UserRole.MASTER_ADMIN ? (
            <>
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
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-300 bg-indigo-950/60 border border-indigo-900/50 px-3 py-1.5 rounded-lg">
                <Building className="w-4 h-4 text-indigo-400" />
                Tenant: {currentCompany.name}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-900/50 px-3 py-1.5 rounded-lg">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                Staff: {currentUser.name} ({currentUser.role})
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* 2. Left Sidebar Navigation */}
        <aside className={`${isSidebarHidden ? 'hidden' : 'w-full md:w-64'} bg-zinc-900 text-zinc-300 border-r border-zinc-800 flex flex-col justify-between p-4 space-y-6 transition-all duration-300`}>
          <div className="space-y-6">
            
            {/* Active profile badge */}
            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono text-indigo-400 block tracking-wider uppercase font-bold">Logged Staff</span>
                  <p className="text-sm font-semibold text-white mt-0.5">{currentUser.name}</p>
                </div>
                <button
                  onClick={() => setIsLoggedIn(false)}
                  className="text-[10px] text-zinc-500 hover:text-rose-400 font-semibold underline cursor-pointer"
                  title="Sign out and Lock console"
                >
                  Lock
                </button>
              </div>
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

              {isAllowedTab('labor-rates') && (
                <button
                  onClick={() => setActiveTab('labor-rates')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'labor-rates' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white border border-transparent'
                  }`}
                >
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Labor Rate Card</span>
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

              {isAllowedTab('document-hub') && (
                <button
                  onClick={() => setActiveTab('document-hub')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'document-hub' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white border border-transparent'
                  }`}
                >
                  <UploadCloud className="w-4 h-4 text-indigo-400 animate-pulse" />
                  <span>Secure Document Hub</span>
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

              {/* Administrative Controls */}
              {(currentUser.role === UserRole.MASTER_ADMIN || currentUser.role === UserRole.ADMIN) && (
                <>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-2.5 pt-4 mb-2">Administrative Tools</p>
                  
                  {currentUser.role === UserRole.MASTER_ADMIN && (
                    <button
                      onClick={() => setActiveTab('master-admin-panel')}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        activeTab === 'master-admin-panel' ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white border border-transparent'
                      }`}
                    >
                      <Building className="w-4 h-4 text-purple-400" />
                      <span>Master Admin Panel</span>
                    </button>
                  )}

                  <button
                    onClick={() => setActiveTab('user-mgmt')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === 'user-mgmt' ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white border border-transparent'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>User Management</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === 'settings' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white border border-transparent'
                    }`}
                  >
                    <Settings className="w-4 h-4 text-indigo-400" />
                    <span>Company Settings & Templates</span>
                  </button>
                </>
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
                        {filteredEstimates.filter(e => e.qboId).length} / {filteredEstimates.length}
                      </span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-zinc-50 border">
                      <span className="text-zinc-600 font-medium">Invoices Reconciled</span>
                      <span className="font-bold text-zinc-800">
                        {filteredInvoices.filter(i => i.qboId).length} / {filteredInvoices.length}
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
                        {filteredInvoices.length} Files
                      </span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-zinc-50 border">
                      <span className="text-zinc-600 font-medium">Supplier Hardcopy Bills verified</span>
                      <span className="font-bold text-zinc-800">
                        {filteredBills.filter(b => b.hardcopyReceivedConfirmation).length} Bills (GRN OK)
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
              projects={filteredProjects}
              estimates={filteredEstimates}
              invoices={filteredInvoices}
              workOrders={filteredWorkOrders}
              bills={filteredBills}
              payments={filteredPayments}
              onCreateProject={handleCreateProject}
              canCreate={['ADMIN', 'FINANCE_USER', 'FINANCE_MANAGER'].includes(currentUser.role)}
              company={currentCompany}
            />
          )}

          {activeTab === 'estimates' && (
            <EstimatesModule
              estimates={filteredEstimates}
              projects={filteredProjects}
              currentUser={currentUser}
              company={currentCompany}
              clients={filteredClients}
              isSidebarHidden={isSidebarHidden}
              onToggleSidebar={() => setIsSidebarHidden(!isSidebarHidden)}
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
              laborRates={laborRates}
            />
          )}

          {activeTab === 'labor-rates' && (
            <LaborRateCardModule
              laborRates={laborRates}
              onUpdateLaborRates={setLaborRates}
              currency={currentCompany.currency || 'BDT'}
            />
          )}

          {activeTab === 'invoices' && (
            <InvoicesModule
              invoices={filteredInvoices}
              estimates={filteredEstimates}
              projects={filteredProjects}
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
              payments={filteredPayments}
              bills={filteredBills}
              vendors={filteredVendors}
              currentUser={currentUser}
              company={currentCompany}
              onCreatePayment={handleCreatePayment}
              onApprovePayment={handleApprovePayment}
              onRejectPayment={handleRejectPayment}
              onSyncQBO={handleSyncPaymentQBO}
            />
          )}

          {activeTab === 'document-hub' && (
            <DocumentStorageModule
              files={files}
              users={users}
              projects={filteredProjects}
              estimates={filteredEstimates}
              currentUser={currentUser}
              companyCurrency={currentCompany.currency}
              onUploadFile={(newFile) => setFiles([newFile, ...files])}
              onDeleteFile={(fileId) => setFiles(files.filter(f => f.id !== fileId))}
              onUpdateFileMetadata={(fileId, updatedFields) => 
                setFiles(files.map(f => f.id === fileId ? { ...f, ...updatedFields } : f))
              }
            />
          )}

          {activeTab === 'vat-dept' && (
            <VatAuditModule
              bills={filteredBills}
              workOrders={filteredWorkOrders}
              vendors={filteredVendors}
              company={currentCompany}
              onVerifyVatDocs={handleVerifyVatDocs}
            />
          )}

          {activeTab === 'vendor-portal' && (
            <VendorModule
              vendors={filteredVendors}
              workOrders={filteredWorkOrders}
              bills={filteredBills}
              advances={filteredAdvanceRequests}
              projects={filteredProjects}
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

          {activeTab === 'master-admin-panel' && (
            <MasterAdminPanel
              companies={companies}
              users={users}
              onAddCompany={(newComp) => setCompanies([...companies, newComp])}
              onAddUser={(newUser) => setUsers([...users, newUser])}
            />
          )}

          {activeTab === 'user-mgmt' && (
            <UserManagementPanel
              users={users}
              activeCompanyId={activeCompanyId}
              onAddUser={(newUser) => setUsers([...users, newUser])}
              companies={companies}
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
