/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Clipboard, Check } from 'lucide-react';

export default function AuthMiddlewareView() {
  const [copied, setCopied] = useState(false);

  const codeContent = `import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";
import { UserRole } from "@prisma/client";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const role = token.role as UserRole;
    const status = token.status as string;

    // Reject inactive profiles from executing any workflows
    if (status !== "ACTIVE") {
      return NextResponse.redirect(new URL("/blocked", req.url));
    }

    // Ensure multi-tenant headers correspond to token company context
    const response = NextResponse.next();
    response.headers.set("x-tenant-id", token.companyId as string);

    // ----------------------------------------------------
    // Role-Based Router Authorization Guards
    // ----------------------------------------------------

    // 1. Staff Internal Portal Restriction
    if (path.startsWith("/dashboard")) {
      if (role === UserRole.VENDOR) {
        return NextResponse.redirect(new URL("/portal/vendor", req.url));
      }
    }

    // 2. Admin Operations Protection
    if (path.startsWith("/dashboard/settings") || path.startsWith("/dashboard/users")) {
      if (role !== UserRole.ADMIN && role !== UserRole.MASTER_ADMIN) {
        return NextResponse.rewrite(new URL("/dashboard/unauthorized", req.url));
      }
    }

    // 3. Customer Service (CS) Workflow Rules
    if (path.startsWith("/dashboard/estimates/create") || path.startsWith("/dashboard/estimates/edit")) {
      const allowedRoles = [UserRole.CS_USER, UserRole.CS_MANAGER, UserRole.ADMIN];
      if (!allowedRoles.includes(role)) {
        return NextResponse.rewrite(new URL("/dashboard/unauthorized", req.url));
      }
    }

    // 4. CS Manager Approvals (Status Changes)
    if (path.startsWith("/dashboard/estimates/approve")) {
      if (role !== UserRole.CS_MANAGER && role !== UserRole.ADMIN) {
        return NextResponse.rewrite(new URL("/dashboard/unauthorized", req.url));
      }
    }

    // 5. Financial Transaction Rights
    if (path.startsWith("/dashboard/payments") || path.startsWith("/dashboard/invoices/send")) {
      const allowedFinance = [UserRole.FINANCE_USER, UserRole.FINANCE_MANAGER, UserRole.ADMIN];
      if (!allowedFinance.includes(role)) {
        return NextResponse.rewrite(new URL("/dashboard/unauthorized", req.url));
      }
    }

    // 6. Finance Manager Payment Approvals
    if (path.startsWith("/dashboard/payments/approve")) {
      if (role !== UserRole.FINANCE_MANAGER && role !== UserRole.ADMIN) {
        return NextResponse.rewrite(new URL("/dashboard/unauthorized", req.url));
      }
    }

    // 7. VAT Department Hardcopy Verification (GRN / Mushok verification)
    if (path.startsWith("/dashboard/vat-dept")) {
      if (role !== UserRole.VAT_DEPT_USER && role !== UserRole.ADMIN) {
        return NextResponse.rewrite(new URL("/dashboard/unauthorized", req.url));
      }
    }

    // 8. External Vendor Portal Guard
    if (path.startsWith("/portal/vendor")) {
      if (role !== UserRole.VENDOR && role !== UserRole.ADMIN) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return response;
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Define route matching scope
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/portal/vendor/:path*",
  ],
};`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="auth-middleware-view" className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col h-full shadow-lg">
      <div className="flex justify-between items-center px-4 py-3 bg-zinc-950 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
          <span className="text-zinc-300 font-mono text-xs">middleware.ts</span>
        </div>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium text-xs border border-zinc-800 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Clipboard className="w-3.5 h-3.5" />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] sm:text-xs leading-relaxed text-zinc-300 whitespace-pre">
        {codeContent}
      </div>
    </div>
  );
}
