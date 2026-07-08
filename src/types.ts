/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  MASTER_ADMIN = 'MASTER_ADMIN',
  ADMIN = 'ADMIN',
  CS_USER = 'CS_USER',
  CS_MANAGER = 'CS_MANAGER',
  FINANCE_USER = 'FINANCE_USER',
  FINANCE_MANAGER = 'FINANCE_MANAGER',
  VAT_DEPT_USER = 'VAT_DEPT_USER',
  VENDOR = 'VENDOR'
}

export interface Company {
  id: string;
  name: string;
  logoUrl: string;
  currency?: string;
  bankDetails: {
    bankName: string;
    accountNo: string;
    routingNo: string;
    swiftCode: string;
  };
  templates: {
    estimateTemplate: string; // HTML/CSS template
    invoiceTemplate: string;
    workOrderTemplate: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
  companyId: string;
  password?: string;
  managerId?: string; // ID of the CS Manager (Supervisor)
}

export interface Project {
  id: string;
  companyId: string;
  name: string;
  clientName: string;
  budget: number;
  startDate: string;
  endDate: string;
  costIncurred: number;
  revenueRecognized: number;
}

export interface LaborRate {
  id: string;
  designation: string;
  department: string;
  hourlyRate: number;
}

export interface LaborBreakdownItem {
  id: string;
  department: string;
  designation: string;
  ftePercentage: string; // e.g. "6%"
  hourlyRate: number;
  hours: number;
  amount: number;
}

export interface EstimateLineItem {
  id: string;
  description: string;
  qty: number;
  rate: number;
  amount: number;
  projectId?: string;
  vatRate?: number; // percentage, e.g. 15 for 15%
  vatAmount?: number;
  grandTotal?: number;
  isAgencyFee?: boolean;
  agencyFeeRate?: number;
  isReimbursementLabor?: boolean;
  laborItems?: LaborBreakdownItem[];
  selectedLineIndices?: number[];
  discountPercentage?: number;
  discountAmount?: number;
  discountInputMode?: 'percentage' | 'amount';
}

export interface Estimate {
  id: string;
  companyId: string;
  projectId?: string;
  clientName?: string;
  csUserId: string;
  csManagerApproved: boolean;
  csManagerApproverId?: string;
  financeApproved?: boolean;
  financeApproverId?: string;
  clientStatus: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED';
  rejectionNotes?: string;
  qboId?: string;
  lineItems: EstimateLineItem[];
  createdAt: string;
  totalAmount: number;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  qty: number;
  rate: number;
  amount: number;
  sourceLineItemId?: string; // Reference to source estimate line item
}

export interface Invoice {
  id: string;
  companyId: string;
  estimateIds: string[]; // Reference to Estimate(s)
  csUserId: string;
  financeReceiptCopyUrl?: string;
  receiptDate?: string;
  paymentAdjustments: {
    taxRate: number; // percentage
    vatRate: number; // percentage
    otherCharges: number; // absolute amount
  };
  qboId?: string;
  status: 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
  lineItems: InvoiceLineItem[];
  subTotal: number;
  taxAmount: number;
  vatAmount: number;
  totalAmount: number;
  createdAt: string;
}

export interface Vendor {
  id: string;
  companyId: string;
  businessName: string;
  contactName: string;
  email: string;
  activeStatus: 'ACTIVE' | 'INACTIVE';
  bankDetails: {
    bankName: string;
    accountNo: string;
    routingNo: string;
  };
}

export interface WorkOrder {
  id: string;
  companyId: string;
  vendorId: string;
  projectId: string;
  totalBudget: number;
  projectBreakdown: string; // Describes breakdown of tasks
  status: 'DRAFT' | 'ISSUED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface VendorBill {
  id: string;
  workOrderId: string;
  invoiceScanUrl?: string;
  supportingDocsUrl?: string;
  advanceDeductions: number;
  grnGenerated: boolean; // Goods Receipt Note
  hardcopyReceivedConfirmation: boolean; // GRN & Mushok verification status
  qboId?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'VAT_VERIFIED' | 'APPROVED' | 'PAID';
  amount: number;
  createdAt: string;
}

export interface AdvanceRequest {
  id: string;
  workOrderId: string;
  amountRequested: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
  createdAt: string;
}

export interface Payment {
  id: string;
  companyId: string;
  financeCreatorId: string;
  financeManagerApproverId?: string;
  paymentMethod: 'CHECK' | 'WIRE' | 'ACH' | 'CASH';
  checkWireDetails: string;
  attachmentUrl?: string;
  qboId?: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PAID' | 'REJECTED';
  amount: number;
  vendorBillId?: string; // If paying a bill
  invoiceId?: string; // If customer payment
  createdAt: string;
}

export interface Client {
  id: string;
  companyId: string;
  name: string;
  address: string;
  isApproved: boolean;
  createdBy?: string;
  approvedBy?: string;
}

export interface StoredFile {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string; // base64 string for preview/simulation
  uploadedBy: string; // user id of the uploader
  uploadedByName: string; // friendly uploader name
  uploadedAt: string;
  companyId: string;
  description?: string;
  projectId?: string; // linked project ID
  estimateId?: string; // linked estimate ID
  tags?: string[];
  isConfidential?: boolean;
}


