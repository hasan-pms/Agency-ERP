/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, MouseEvent } from 'react';
import { Folder, File, ChevronDown, ChevronRight, Info } from 'lucide-react';

interface FileTreeNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
  description?: string;
}

const structureData: FileTreeNode = {
  name: "saas-erp-root",
  type: "folder",
  children: [
    {
      name: "prisma",
      type: "folder",
      description: "Database configurations & migrations",
      children: [
        { name: "schema.prisma", type: "file", description: "SaaS Multi-tenant database relations" },
        { name: "seed.ts", type: "file", description: "Pre-populates system roles and tenant companies" }
      ]
    },
    {
      name: "src",
      type: "folder",
      children: [
        {
          name: "app",
          type: "folder",
          description: "Next.js App Router paths with custom layout structures",
          children: [
            { name: "layout.tsx", type: "file", description: "Global provider container (NextAuth, Toast)" },
            { name: "page.tsx", type: "file", description: "Landing page and portal router redirect" },
            {
              name: "api",
              type: "folder",
              description: "Serverless backend endpoint handlers",
              children: [
                {
                  name: "auth",
                  type: "folder",
                  children: [
                    { name: "[...nextauth]", type: "folder", children: [{ name: "route.ts", type: "file", description: "Session state and adapter hooks" }] }
                  ]
                },
                {
                  name: "qbo",
                  type: "folder",
                  description: "QuickBooks Online Sync Webhooks & Auth",
                  children: [
                    { name: "oauth", type: "folder", children: [{ name: "route.ts", type: "file" }] },
                    { name: "sync", type: "folder", children: [{ name: "route.ts", type: "file", description: "Pushes/pulls estimates, invoices & bills" }] }
                  ]
                }
              ]
            },
            {
              name: "(dashboard)",
              type: "folder",
              description: "Route group for internal tenant staff portal",
              children: [
                { name: "layout.tsx", type: "file", description: "Multi-tenant navigation sidebar & top header" },
                { name: "page.tsx", type: "file", description: "Staff role-based home metrics" },
                { name: "estimates", type: "folder", children: [{ name: "page.tsx", type: "file" }, { name: "[id]", type: "folder", children: [{ name: "page.tsx", type: "file" }] }] },
                { name: "invoices", type: "folder", children: [{ name: "page.tsx", type: "file" }] },
                { name: "projects", type: "folder", children: [{ name: "page.tsx", type: "file" }] },
                { name: "payments", type: "folder", children: [{ name: "page.tsx", type: "file" }] },
                { name: "vat-dept", type: "folder", children: [{ name: "page.tsx", type: "file", description: "Mushok/GRN Verification portal" }] }
              ]
            },
            {
              name: "portal",
              type: "folder",
              description: "External client and supplier hub",
              children: [
                { name: "layout.tsx", type: "file" },
                { name: "login", type: "folder", children: [{ name: "page.tsx", type: "file" }] },
                { name: "vendor", type: "folder", children: [{ name: "page.tsx", type: "file", description: "Supplier interface for Work Orders, Bills, Advance Requests" }] }
              ]
            }
          ]
        },
        {
          name: "components",
          type: "folder",
          description: "Re-usable design components",
          children: [
            { name: "ui", type: "folder", children: [{ name: "button.tsx", type: "file" }, { name: "dialog.tsx", type: "file" }] },
            { name: "print-templates", type: "folder", description: "Modular document structures for PDF and HTML rendering" }
          ]
        },
        {
          name: "lib",
          type: "folder",
          description: "Utility tools & third party SDKs",
          children: [
            { name: "prisma.ts", type: "file", description: "Singleton database client pool connection" },
            { name: "qbo-client.ts", type: "file", description: "Intuit OAuth credentials and endpoint mapping" },
            { name: "firebase.ts", type: "file", description: "File attachment and scan uploader" }
          ]
        },
        {
          name: "middleware.ts",
          type: "file",
          description: "Role-based page guard router mapping roles to specific subpaths"
        }
      ]
    },
    { name: "package.json", type: "file" },
    { name: "tsconfig.json", type: "file" },
    { name: "tailwind.config.js", type: "file" }
  ]
};

interface TreeNodeProps {
  key?: any;
  node: FileTreeNode;
  depth: number;
  onSelect: (description: string) => void;
}

const TreeNode = ({ node, depth = 0, onSelect }: TreeNodeProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const handleSelect = (e: MouseEvent) => {
    e.stopPropagation();
    if (node.description) {
      onSelect(node.description);
    } else {
      onSelect(`Folder: ${node.name}`);
    }
    if (hasChildren) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="select-none font-mono text-xs text-zinc-300">
      <div
        onClick={handleSelect}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        className="flex items-center gap-1.5 py-1.5 rounded-lg hover:bg-zinc-800/60 cursor-pointer transition-colors"
      >
        {hasChildren ? (
          isOpen ? <ChevronDown className="w-3.5 h-3.5 text-zinc-500" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
        ) : (
          <span className="w-3.5 h-3.5"></span>
        )}

        {node.type === 'folder' ? (
          <Folder className="w-4 h-4 text-sky-400 fill-sky-400/10 shrink-0" />
        ) : (
          <File className="w-4 h-4 text-zinc-400 shrink-0" />
        )}

        <span className={node.type === 'folder' ? "font-medium text-zinc-100" : "text-zinc-300"}>
          {node.name}
        </span>
      </div>

      {hasChildren && isOpen && (
        <div className="mt-0.5">
          {node.children!.map((child, idx) => (
            <TreeNode key={idx} node={child} depth={depth + 1} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function FolderStructureView() {
  const [selectedDescription, setSelectedDescription] = useState<string | null>(
    "Explore the production structure. Click directories to expand."
  );

  return (
    <div id="folder-structure-view" className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col h-full shadow-lg">
      <div className="px-4 py-3 bg-zinc-950 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-sky-500"></span>
          <span className="text-zinc-300 font-mono text-xs">Next.js Project Directory</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 max-h-[460px]">
        <TreeNode node={structureData} depth={0} onSelect={setSelectedDescription} />
      </div>
      <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-start gap-2">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
          <strong className="text-zinc-300 font-medium">Selected Path Focus:</strong> <br />
          {selectedDescription}
        </p>
      </div>
    </div>
  );
}
