/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Company, User, Project, Estimate, Invoice, Vendor, WorkOrder, VendorBill, AdvanceRequest, Payment, UserRole } from '../types';

export const INITIAL_COMPANIES: Company[] = [
  {
    id: 'comp-acme',
    name: 'X Solutions Limited',
    logoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    currency: 'BDT',
    bankDetails: {
      bankName: 'City Bank Bangladesh',
      accountNo: 'CB-9902-8812-BDT',
      routingNo: '021000021',
      swiftCode: 'CHASUS33XXX'
    },
    templates: {
      estimateTemplate: `<!-- Custom Estimate Print Layout -->
<div class="p-8 font-sans border-2 border-zinc-200 rounded-lg">
  <div class="flex justify-between border-b pb-6">
    <div>
      <h1 class="text-3xl font-extrabold text-indigo-600 tracking-tight">{{companyName}}</h1>
      <p class="text-xs text-zinc-500 mt-1">SaaS ERP Commercial Division</p>
    </div>
    <div class="text-right">
      <h2 class="text-xl font-bold text-zinc-800">ESTIMATE PROPOSAL</h2>
      <p class="text-xs text-zinc-500">Ref: {{estimateId}}</p>
    </div>
  </div>
  <div class="my-6 grid grid-cols-2 gap-4 text-xs">
    <div>
      <p class="font-semibold text-zinc-700">PREPARED FOR:</p>
      <p class="text-zinc-600 mt-1 font-bold">{{clientName}}</p>
      <p class="text-zinc-500 mt-0.5 italic text-[11px]">{{clientAddress}}</p>
      <p class="text-zinc-600 mt-1">Project: {{projectName}}</p>
    </div>
    <div class="text-right">
      <p class="font-semibold text-zinc-700">DATE CREATED:</p>
      <p class="text-zinc-600 mt-1">{{dateCreated}}</p>
      <p class="text-zinc-600 mt-1">QBO Link Status: <span class="text-emerald-600">Connected</span></p>
    </div>
  </div>
  <table class="w-full text-[11px] text-left border-collapse mt-8">
    <thead>
      <tr class="bg-zinc-100 text-zinc-800 uppercase font-semibold">
        <th class="p-2 border-b">Description</th>
        <th class="p-2 border-b text-center">Qty</th>
        <th class="p-2 border-b text-right">Unit Rate</th>
        <th class="p-2 border-b text-right">Net Amt</th>
        <th class="p-2 border-b text-right">VAT %</th>
        <th class="p-2 border-b text-right">VAT Amt</th>
        <th class="p-2 border-b text-right">Grand Total</th>
      </tr>
    </thead>
    <tbody>
      {{lineItemsHTML}}
    </tbody>
  </table>
  <div class="mt-8 border-t pt-4 text-right">
    <p class="text-xs text-zinc-500">Proposed Budget Total (including VAT):</p>
    <p class="text-2xl font-bold text-zinc-900 mt-1">{{totalAmount}}</p>
  </div>
 </div>`,
       invoiceTemplate: `<!-- Standard Commercial Invoice Layout -->
 <div class="p-8 font-sans border-2 border-zinc-200 rounded-lg">
   <div class="flex justify-between border-b pb-6">
     <div>
       <h1 class="text-3xl font-extrabold text-emerald-600 tracking-tight">{{companyName}}</h1>
       <p class="text-xs text-zinc-500 mt-1">Multi-Tenant Financial Node</p>
     </div>
     <div class="text-right">
       <h2 class="text-xl font-bold text-zinc-800">TAX INVOICE</h2>
       <p class="text-xs text-zinc-500">Invoice: {{invoiceId}}</p>
     </div>
   </div>
   <div class="my-6 grid grid-cols-2 gap-4 text-xs">
     <div>
       <p class="font-semibold text-zinc-700">CLIENT COMPLIANCE BILLING:</p>
       <p class="text-zinc-600 mt-1">{{clientName}}</p>
     </div>
     <div class="text-right">
       <p class="font-semibold text-zinc-700">ACCOUNT REMITTANCE:</p>
       <p class="text-zinc-600 mt-1">Bank: {{bankName}}</p>
       <p class="text-zinc-600">A/C: {{accountNo}}</p>
     </div>
   </div>
   <table class="w-full text-xs text-left border-collapse mt-8">
     <thead>
       <tr class="bg-zinc-100 text-zinc-800 uppercase font-semibold">
         <th class="p-2 border-b">Scope Item</th>
         <th class="p-2 border-b text-center">Qty</th>
         <th class="p-2 border-b text-right">Rate</th>
         <th class="p-2 border-b text-right">Gross</th>
       </tr>
     </thead>
     <tbody>
       {{lineItemsHTML}}
     </tbody>
   </table>
   <div class="mt-8 border-t pt-4 text-right text-xs space-y-1.5">
     <p class="text-zinc-500">Subtotal: <span class="text-zinc-900 font-semibold">{{subTotal}}</span></p>
     <p class="text-zinc-500">VAT Adjustment ({{vatRate}}%): <span class="text-zinc-900 font-semibold">{{vatAmount}}</span></p>
     <div class="text-lg font-bold text-zinc-900 border-t pt-2 mt-2">
       Grand Remittance Due: <span>{{totalAmount}}</span>
     </div>
   </div>
 </div>`,
      workOrderTemplate: `<!-- Work Order Details Layout -->
<div class="p-8 font-sans border-2 border-zinc-200 rounded-lg">
  <div class="flex justify-between border-b pb-6">
    <div>
      <h1 class="text-3xl font-extrabold text-zinc-800 tracking-tight">{{companyName}}</h1>
      <p class="text-xs text-zinc-500 mt-1">Vendor Procurement Operations</p>
    </div>
    <div class="text-right">
      <h2 class="text-xl font-bold text-indigo-600">WORK ORDER</h2>
      <p class="text-xs text-zinc-500">WO-ID: {{workOrderId}}</p>
    </div>
  </div>
  <div class="my-6 grid grid-cols-2 gap-4 text-xs">
    <div>
      <p class="font-semibold text-zinc-700">ENLISTED VENDOR:</p>
      <p class="text-zinc-600 mt-1">{{vendorName}}</p>
      <p class="text-zinc-600">Contact: {{vendorEmail}}</p>
    </div>
    <div class="text-right">
      <p class="font-semibold text-zinc-700">ALLOCATED PROJECT:</p>
      <p class="text-zinc-600 mt-1">{{projectName}}</p>
      <p class="text-zinc-600 mt-1">Created: {{dateCreated}}</p>
    </div>
  </div>
  <div class="bg-zinc-50 p-4 rounded border text-xs leading-relaxed mt-6">
    <p class="font-semibold text-zinc-700 mb-1">PROJECT WORK SCOPE BREAKDOWN:</p>
    <p class="text-zinc-600 whitespace-pre-wrap">{{projectBreakdown}}</p>
  </div>
  <div class="mt-8 border-t pt-4 text-right">
    <p class="text-xs text-zinc-500">Total WO Budget Cap:</p>
    <p class="text-xl font-bold text-indigo-600 mt-1">{{totalBudget}}</p>
  </div>
</div>`
    }
  },
  {
    id: 'comp-lexington',
    name: 'Lexington Heavy Industries Ltd',
    logoUrl: 'https://images.unsplash.com/photo-1516216628859-9bccecad13ca?w=100&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    bankDetails: {
      bankName: 'HSBC Corporate Hong Kong',
      accountNo: 'HSBC-8892-1011-04',
      routingNo: '023849100',
      swiftCode: 'HSBCHKHHXXX'
    },
    templates: {
      estimateTemplate: '<div>Lexington Heavy Proposal Template</div>',
      invoiceTemplate: '<div>Lexington Commercial Invoice Template</div>',
      workOrderTemplate: '<div>Lexington Industrial Work Order Template</div>'
    }
  }
];

export const INITIAL_USERS: User[] = [
  { id: 'user-m-admin', name: 'Master Overlord', email: 'master@saaserp.com', role: UserRole.MASTER_ADMIN, status: 'ACTIVE', companyId: 'comp-acme', password: 'masterpassword' },
  { id: 'user-admin', name: 'Hasan Developer (Admin)', email: 'hasan24h@gmail.com', role: UserRole.ADMIN, status: 'ACTIVE', companyId: 'comp-acme', password: 'adminpassword' },
  { id: 'user-cs-u', name: 'Sarah CS Representative', email: 'sarah.cs@acme.com', role: UserRole.CS_USER, status: 'ACTIVE', companyId: 'comp-acme', password: 'password123', managerId: 'user-cs-m' },
  { id: 'user-cs-m', name: 'Robert CS Manager', email: 'robert.mgr@acme.com', role: UserRole.CS_MANAGER, status: 'ACTIVE', companyId: 'comp-acme', password: 'password123' },
  { id: 'user-fin-u', name: 'Emily Accounts Controller', email: 'emily.finance@acme.com', role: UserRole.FINANCE_USER, status: 'ACTIVE', companyId: 'comp-acme', password: 'password123' },
  { id: 'user-fin-m', name: 'Jonathan Finance Director', email: 'jonathan.dir@acme.com', role: UserRole.FINANCE_MANAGER, status: 'ACTIVE', companyId: 'comp-acme', password: 'password123' },
  { id: 'user-vat', name: 'Inspector Somchai (VAT Dept)', email: 'somchai.vat@revenue.go', role: UserRole.VAT_DEPT_USER, status: 'ACTIVE', companyId: 'comp-acme', password: 'password123' },
  { id: 'user-vend-port', name: 'En enlisted Global Builder Inc', email: 'vendor@globalbuilders.com', role: UserRole.VENDOR, status: 'ACTIVE', companyId: 'comp-acme', password: 'password123' }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-skyline',
    companyId: 'comp-acme',
    name: 'Skyline Premium Office Complex',
    clientName: 'Skyline Assets Group Inc',
    budget: 850000,
    startDate: '2026-04-01',
    endDate: '2026-12-15',
    costIncurred: 320000,
    revenueRecognized: 450000
  },
  {
    id: 'proj-pipeline',
    companyId: 'comp-acme',
    name: 'SaaS Cloud Automation Core v4',
    clientName: 'Enterprise Cloud Technologies',
    budget: 350000,
    startDate: '2026-06-01',
    endDate: '2026-10-30',
    costIncurred: 95000,
    revenueRecognized: 180000
  },
  {
    id: 'proj-marina',
    companyId: 'comp-acme',
    name: 'Marina Waterfront Club Refurbishment',
    clientName: 'Waterfront Developers Ltd',
    budget: 1200000,
    startDate: '2026-01-10',
    endDate: '2026-11-20',
    costIncurred: 780000,
    revenueRecognized: 900000
  }
];

export const INITIAL_ESTIMATES: Estimate[] = [
  {
    id: 'est-001',
    companyId: 'comp-acme',
    projectId: 'proj-skyline',
    csUserId: 'user-cs-u',
    csManagerApproved: true,
    csManagerApproverId: 'user-cs-m',
    financeApproved: true,
    clientStatus: 'APPROVED',
    qboId: 'QBO-EST-9901-A',
    totalAmount: 180000,
    createdAt: '2026-05-01T10:00:00Z',
    lineItems: [
      { id: 'item-101', description: 'Foundation concrete pouring and framing reinforcement', qty: 1, rate: 120000, amount: 120000, projectId: 'proj-skyline' },
      { id: 'item-102', description: 'Structural steel girders assembly (Grade A)', qty: 3, rate: 20000, amount: 60000, projectId: 'proj-skyline' }
    ]
  },
  {
    id: 'est-002',
    companyId: 'comp-acme',
    projectId: 'proj-pipeline',
    csUserId: 'user-cs-u',
    csManagerApproved: false,
    financeApproved: false,
    clientStatus: 'DRAFT',
    totalAmount: 45000,
    createdAt: '2026-06-20T14:30:00Z',
    lineItems: [
      { id: 'item-201', description: 'Back-end container architecture orchestration set up', qty: 1, rate: 30000, amount: 30000, projectId: 'proj-pipeline' },
      { id: 'item-202', description: 'Interactive React components layout framework', qty: 15, rate: 1000, amount: 15000, projectId: 'proj-pipeline' }
    ]
  },
  {
    id: 'est-003',
    companyId: 'comp-acme',
    projectId: 'proj-marina',
    csUserId: 'user-cs-u',
    csManagerApproved: true,
    csManagerApproverId: 'user-cs-m',
    financeApproved: true,
    clientStatus: 'SENT',
    qboId: 'QBO-EST-1200-S',
    totalAmount: 250000,
    createdAt: '2026-06-25T09:15:00Z',
    lineItems: [
      { id: 'item-301', description: 'Waterfront deck structural wooden pile replacements', qty: 50, rate: 3000, amount: 150000, projectId: 'proj-marina' },
      { id: 'item-302', description: 'Premium anti-salt protective sealant coat application', qty: 1, rate: 100000, amount: 100000, projectId: 'proj-marina' }
    ]
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-001',
    companyId: 'comp-acme',
    estimateIds: ['est-001'],
    csUserId: 'user-cs-u',
    financeReceiptCopyUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    receiptDate: '2026-05-15',
    paymentAdjustments: {
      taxRate: 0,
      vatRate: 7,
      otherCharges: 0
    },
    qboId: 'QBO-INV-110022',
    status: 'PAID',
    subTotal: 180000,
    taxAmount: 0,
    vatAmount: 12600,
    totalAmount: 192600,
    createdAt: '2026-05-10T11:00:00Z',
    lineItems: [
      { id: 'i-item-101', description: 'Foundation concrete pouring and framing reinforcement', qty: 1, rate: 120000, amount: 120000, sourceLineItemId: 'item-101' },
      { id: 'i-item-102', description: 'Structural steel girders assembly (Grade A)', qty: 3, rate: 20000, amount: 60000, sourceLineItemId: 'item-102' }
    ]
  },
  {
    id: 'inv-002',
    companyId: 'comp-acme',
    estimateIds: ['est-003'],
    csUserId: 'user-cs-u',
    paymentAdjustments: {
      taxRate: 0,
      vatRate: 7,
      otherCharges: 0
    },
    status: 'SENT',
    subTotal: 250000,
    taxAmount: 0,
    vatAmount: 17500,
    totalAmount: 267500,
    createdAt: '2026-06-28T16:45:00Z',
    lineItems: [
      { id: 'i-item-301', description: 'Waterfront deck structural wooden pile replacements', qty: 50, rate: 3000, amount: 150000, sourceLineItemId: 'item-301' },
      { id: 'i-item-302', description: 'Premium anti-salt protective sealant coat application', qty: 1, rate: 100000, amount: 100000, sourceLineItemId: 'item-302' }
    ]
  }
];

export const INITIAL_VENDORS: Vendor[] = [
  {
    id: 'vend-001',
    companyId: 'comp-acme',
    businessName: 'Apex Concrete & Steel Supplies Inc',
    contactName: 'James Henderson',
    email: 'vendor@globalbuilders.com',
    activeStatus: 'ACTIVE',
    bankDetails: {
      bankName: 'Deutsche Bank Logistics',
      accountNo: 'DEUT-1002-9912-3210',
      routingNo: '021000222'
    }
  },
  {
    id: 'vend-002',
    companyId: 'comp-acme',
    businessName: 'Eco-Friendly Wood & Composite Ltd',
    contactName: 'Maria Rodriguez',
    email: 'maria@ecocomposite.com',
    activeStatus: 'ACTIVE',
    bankDetails: {
      bankName: 'Well Fargo Commercial',
      accountNo: 'WELLS-5544-2211-098',
      routingNo: '121000248'
    }
  }
];

export const INITIAL_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'wo-001',
    companyId: 'comp-acme',
    vendorId: 'vend-001',
    projectId: 'proj-skyline',
    totalBudget: 95000,
    projectBreakdown: 'Task 1: Pre-mix high strength concrete supply (300 Tons)\nTask 2: Reinforcement steel rebar grids welding and installation\nTask 3: Post-pouring ultrasound strain verification scans',
    status: 'IN_PROGRESS',
    createdAt: '2026-05-02T08:00:00Z'
  },
  {
    id: 'wo-002',
    companyId: 'comp-acme',
    vendorId: 'vend-002',
    projectId: 'proj-marina',
    totalBudget: 140000,
    projectBreakdown: 'Task 1: Certified high-density ocean grade structural hardwood deliveries\nTask 2: Splice coupling brackets manufacturing',
    status: 'ISSUED',
    createdAt: '2026-06-26T11:30:00Z'
  }
];

export const INITIAL_VENDOR_BILLS: VendorBill[] = [
  {
    id: 'bill-001',
    workOrderId: 'wo-001',
    amount: 45000,
    invoiceScanUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    supportingDocsUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    advanceDeductions: 5000,
    grnGenerated: true,
    hardcopyReceivedConfirmation: true, // Mushok-6.3 and Goods Receipt confirmed by VAT Dept!
    qboId: 'QBO-BILL-88910-V',
    status: 'APPROVED',
    createdAt: '2026-05-20T15:00:00Z'
  },
  {
    id: 'bill-002',
    workOrderId: 'wo-002',
    amount: 60000,
    invoiceScanUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    grnGenerated: false,
    hardcopyReceivedConfirmation: false,
    advanceDeductions: 0,
    status: 'SUBMITTED',
    createdAt: '2026-06-29T10:00:00Z'
  }
];

export const INITIAL_ADVANCE_REQUESTS: AdvanceRequest[] = [
  {
    id: 'adv-001',
    workOrderId: 'wo-001',
    amountRequested: 15000,
    status: 'PAID',
    createdAt: '2026-05-04T09:00:00Z'
  },
  {
    id: 'adv-002',
    workOrderId: 'wo-002',
    amountRequested: 25000,
    status: 'PENDING',
    createdAt: '2026-06-27T14:00:00Z'
  }
];

export const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay-001',
    companyId: 'comp-acme',
    financeCreatorId: 'user-fin-u',
    financeManagerApproverId: 'user-fin-m',
    paymentMethod: 'WIRE',
    checkWireDetails: 'FedWire Ref No: #WIRE-88902-1102 - Transferred from JP Morgan Operating Acct',
    attachmentUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    qboId: 'QBO-PAY-901122',
    status: 'PAID',
    amount: 40000, // bill amount - advance
    vendorBillId: 'bill-001',
    createdAt: '2026-05-25T11:30:00Z'
  }
];
