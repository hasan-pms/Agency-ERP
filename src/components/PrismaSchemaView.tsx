/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Clipboard, Check } from 'lucide-react';

export default function PrismaSchemaView() {
  const [copied, setCopied] = useState(false);

  const schemaContent = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ----------------------------------------------------
// 1. Multi-Tenant Boundary
// ----------------------------------------------------
model Company {
  id           String     @id @default(uuid())
  name         String
  logoUrl      String?
  bankName     String?
  accountNo    String?
  routingNo    String?
  swiftCode    String?
  
  // Custom print templates
  estimateTemplate   String? @db.Text
  invoiceTemplate    String? @db.Text
  workOrderTemplate  String? @db.Text

  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  users        User[]
  projects     Project[]
  estimates    Estimate[]
  invoices     Invoice[]
  vendors      Vendor[]
  payments     Payment[]
  workOrders   WorkOrder[]
}

// ----------------------------------------------------
// 2. User & RBAC Setup
// ----------------------------------------------------
enum UserRole {
  MASTER_ADMIN
  ADMIN
  CS_USER
  CS_MANAGER
  FINANCE_USER
  FINANCE_MANAGER
  VAT_DEPT_USER
  VENDOR
}

enum UserStatus {
  ACTIVE
  INACTIVE
}

model User {
  id            String     @id @default(uuid())
  email         String     @unique
  name          String?
  passwordHash  String
  role          UserRole   @default(CS_USER)
  status        UserStatus @default(ACTIVE)
  
  companyId     String
  company       Company    @relation(fields: [companyId], references: [id], onDelete: Cascade)

  // Audit Relations
  createdEstimates    Estimate[] @relation("CSUserEstimates")
  approvedEstimates   Estimate[] @relation("CSManagerApprovedEstimates")
  createdInvoices     Invoice[]  @relation("CSUserInvoices")
  createdPayments     Payment[]  @relation("FinanceUserPayments")
  approvedPayments    Payment[]  @relation("FinanceManagerPayments")

  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  @@index([companyId])
}

// ----------------------------------------------------
// 3. Project Tracking
// ----------------------------------------------------
model Project {
  id                String     @id @default(uuid())
  name              String
  clientName        String
  budget            Float
  startDate         DateTime
  endDate           DateTime
  costIncurred      Float      @default(0.0)
  revenueRecognized Float      @default(0.0)

  companyId         String
  company           Company    @relation(fields: [companyId], references: [id], onDelete: Cascade)

  estimates         Estimate[]
  workOrders        WorkOrder[]
  lineItems         EstimateLineItem[]

  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt

  @@index([companyId])
}

// ----------------------------------------------------
// 4. Estimate Management
// ----------------------------------------------------
enum EstimateStatus {
  DRAFT
  SENT
  APPROVED
  REJECTED
}

model Estimate {
  id                 String             @id @default(uuid())
  clientStatus       EstimateStatus     @default(DRAFT)
  rejectionNotes     String?            @db.Text
  csManagerApproved  Boolean            @default(false)
  qboId              String?            // QuickBooks Online Sync Reference
  totalAmount        Float              @default(0.0)

  companyId          String
  company            Company            @relation(fields: [companyId], references: [id], onDelete: Cascade)

  projectId          String
  project            Project            @relation(fields: [projectId], references: [id], onDelete: Cascade)

  csUserId           String
  csUser             User               @relation("CSUserEstimates", fields: [csUserId], references: [id])

  csManagerApproverId String?
  csManagerApprover   User?              @relation("CSManagerApprovedEstimates", fields: [csManagerApproverId], references: [id])

  lineItems          EstimateLineItem[]
  invoices           InvoicesOnEstimates[]

  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt

  @@index([companyId])
  @@index([projectId])
}

model EstimateLineItem {
  id          String   @id @default(uuid())
  description String
  qty         Float
  rate        Float
  amount      Float

  estimateId  String
  estimate    Estimate @relation(fields: [estimateId], references: [id], onDelete: Cascade)

  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])

  invoiceLines InvoiceLineItem[]

  @@index([estimateId])
  @@index([projectId])
}

// ----------------------------------------------------
// 5. Invoice Management
// ----------------------------------------------------
enum InvoiceStatus {
  DRAFT
  SENT
  PARTIALLY_PAID
  PAID
  CANCELLED
}

model Invoice {
  id                    String             @id @default(uuid())
  financeReceiptCopyUrl String?            // Scan copies
  receiptDate           DateTime?
  taxRate               Float              @default(0.0) // Payment adjustments percentage
  vatRate               Float              @default(0.0)
  otherCharges          Float              @default(0.0)
  subTotal              Float              @default(0.0)
  taxAmount             Float              @default(0.0)
  vatAmount             Float              @default(0.0)
  totalAmount           Float              @default(0.0)
  qboId                 String?            // QuickBooks Online Sync Reference
  status                InvoiceStatus      @default(DRAFT)

  companyId             String
  company               Company            @relation(fields: [companyId], references: [id], onDelete: Cascade)

  csUserId              String
  csUser                User               @relation("CSUserInvoices", fields: [csUserId], references: [id])

  estimates             InvoicesOnEstimates[]
  lineItems             InvoiceLineItem[]
  payments              Payment[]

  createdAt             DateTime           @default(now())
  updatedAt             DateTime           @updatedAt

  @@index([companyId])
}

// Many-to-Many join table supporting Invoice linked to multiple Estimates
model InvoicesOnEstimates {
  invoiceId  String
  invoice    Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  estimateId String
  estimate   Estimate @relation(fields: [estimateId], references: [id], onDelete: Cascade)

  @@id([invoiceId, estimateId])
}

model InvoiceLineItem {
  id          String   @id @default(uuid())
  description String
  qty         Float
  rate        Float
  amount      Float

  invoiceId   String
  invoice     Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  sourceLineItemId String?
  sourceLineItem   EstimateLineItem? @relation(fields: [sourceLineItemId], references: [id], onDelete: SetNull)

  @@index([invoiceId])
}

// ----------------------------------------------------
// 6. Vendor Management & Portal
// ----------------------------------------------------
enum VendorStatus {
  ACTIVE
  INACTIVE
}

model Vendor {
  id            String       @id @default(uuid())
  businessName  String
  contactName   String
  email         String       @unique
  passwordHash  String       // Vendor portal credentials
  activeStatus  VendorStatus @default(ACTIVE)

  bankName      String?
  accountNo     String?
  routingNo     String?

  companyId     String
  company       Company      @relation(fields: [companyId], references: [id], onDelete: Cascade)

  workOrders    WorkOrder[]

  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  @@index([companyId])
}

// ----------------------------------------------------
// 7. Work Orders, Bills, & Advances
// ----------------------------------------------------
enum WorkOrderStatus {
  DRAFT
  ISSUED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model WorkOrder {
  id               String          @id @default(uuid())
  totalBudget      Float
  projectBreakdown String?         @db.Text
  status           WorkOrderStatus @default(DRAFT)

  companyId        String
  company          Company         @relation(fields: [companyId], references: [id], onDelete: Cascade)

  vendorId         String
  vendor           Vendor          @relation(fields: [vendorId], references: [id], onDelete: Cascade)

  projectId        String
  project          Project         @relation(fields: [projectId], references: [id], onDelete: Cascade)

  bills            VendorBill[]
  advanceRequests  AdvanceRequest[]

  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt

  @@index([companyId])
  @@index([vendorId])
  @@index([projectId])
}

enum BillStatus {
  DRAFT
  SUBMITTED
  VAT_VERIFIED
  APPROVED
  PAID
}

model VendorBill {
  id                           String     @id @default(uuid())
  amount                       Float
  invoiceScanUrl               String?
  supportingDocsUrl            String?
  advanceDeductions            Float      @default(0.0)
  grnGenerated                 Boolean    @default(false)
  hardcopyReceivedConfirmation Boolean    @default(false) // Mushok / GRN verification by VAT Dept
  qboId                        String?
  status                       BillStatus @default(DRAFT)

  workOrderId                  String
  workOrder                    WorkOrder  @relation(fields: [workOrderId], references: [id], onDelete: Cascade)

  payments                     Payment[]

  createdAt                    DateTime   @default(now())
  updatedAt                    DateTime   @updatedAt

  @@index([workOrderId])
}

enum AdvanceStatus {
  PENDING
  APPROVED
  PAID
  REJECTED
}

model AdvanceRequest {
  id          String        @id @default(uuid())
  amount      Float
  status      AdvanceStatus @default(PENDING)

  workOrderId String
  workOrder   WorkOrder     @relation(fields: [workOrderId], references: [id], onDelete: Cascade)

  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([workOrderId])
}

// ----------------------------------------------------
// 8. Payments System
// ----------------------------------------------------
enum PaymentMethod {
  CHECK
  WIRE
  ACH
  CASH
}

enum PaymentStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  PAID
  REJECTED
}

model Payment {
  id                   String        @id @default(uuid())
  amount               Float
  paymentMethod        PaymentMethod @default(CHECK)
  checkWireDetails     String?       @db.Text
  attachmentUrl        String?
  qboId                String?       // QuickBooks Payment Reference
  status               PaymentStatus @default(DRAFT)

  companyId            String
  company              Company       @relation(fields: [companyId], references: [id], onDelete: Cascade)

  financeCreatorId     String
  financeCreator       User          @relation("FinanceUserPayments", fields: [financeCreatorId], references: [id])

  financeManagerApproverId String?
  financeManagerApprover   User?         @relation("FinanceManagerPayments", fields: [financeManagerApproverId], references: [id])

  // Can link to either VendorBill or Customer Invoice
  vendorBillId         String?
  vendorBill           VendorBill?   @relation(fields: [vendorBillId], references: [id], onDelete: SetNull)

  invoiceId            String?
  invoice              Invoice?      @relation(fields: [invoiceId], references: [id], onDelete: SetNull)

  createdAt            DateTime      @default(now())
  updatedAt            DateTime      @updatedAt

  @@index([companyId])
  @@index([vendorBillId])
  @@index([invoiceId])
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(schemaContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="prisma-schema-view" className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col h-full shadow-lg">
      <div className="flex justify-between items-center px-4 py-3 bg-zinc-950 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          <span className="text-zinc-300 font-mono text-xs">schema.prisma</span>
        </div>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium text-xs border border-zinc-800 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400 animate-scale-in" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Clipboard className="w-3.5 h-3.5" />
              <span>Copy Schema</span>
            </>
          )}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] sm:text-xs leading-relaxed text-zinc-300 whitespace-pre">
        {schemaContent}
      </div>
    </div>
  );
}
