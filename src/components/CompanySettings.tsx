/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Company } from '../types';
import { Settings, Save, CheckCircle2, Sliders, Palette, Shield } from 'lucide-react';

interface CompanySettingsProps {
  company: Company;
  onUpdateCompany: (companyData: Partial<Company>) => void;
}

export default function CompanySettings({ company, onUpdateCompany }: CompanySettingsProps) {
  // Config parameters
  const [name, setName] = useState(company.name);
  const [logoUrl, setLogoUrl] = useState(company.logoUrl);
  const [currency, setCurrency] = useState(company.currency || 'BDT');
  const [bankName, setBankName] = useState(company.bankDetails.bankName);
  const [accountNo, setAccountNo] = useState(company.bankDetails.accountNo);
  const [routingNo, setRoutingNo] = useState(company.bankDetails.routingNo);
  const [swiftCode, setSwiftCode] = useState(company.bankDetails.swiftCode);

  // Template editor
  const [activeTemplateTab, setActiveTemplateTab] = useState<'estimate' | 'invoice' | 'workorder'>('estimate');
  const [estimateTemplate, setEstimateTemplate] = useState(company.templates.estimateTemplate);
  const [invoiceTemplate, setInvoiceTemplate] = useState(company.templates.invoiceTemplate);
  const [workOrderTemplate, setWorkOrderTemplate] = useState(company.templates.workOrderTemplate);

  const [notif, setNotif] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCompany({
      name,
      logoUrl,
      currency,
      bankDetails: {
        bankName,
        accountNo,
        routingNo,
        swiftCode
      },
      templates: {
        estimateTemplate,
        invoiceTemplate,
        workOrderTemplate
      }
    });

    setNotif(true);
    setTimeout(() => setNotif(false), 2500);
  };

  return (
    <div id="company-settings-module" className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 tracking-tight">Enterprise Company Settings</h2>
          <p className="text-sm text-zinc-500 mt-1">Configure multi-tenant boundaries, banking accounts, and HTML/CSS print templates</p>
        </div>
        {notif && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-semibold animate-scale-in">
            <CheckCircle2 className="w-4 h-4" /> Changes saved successfully!
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Business Profile & Bank Details */}
        <div className="space-y-6 lg:col-span-1">
          {/* Business details */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-2.5">
              <Sliders className="w-4.5 h-4.5 text-indigo-600" />
              SaaS Business Entity
            </h3>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Company Registered Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-medium focus:outline-hidden text-zinc-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Corporate Logo URL Address</label>
              <input
                type="url"
                required
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full p-2 border border-zinc-300 rounded-lg text-xs text-zinc-600 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Default System Currency Code</label>
              <input
                type="text"
                required
                placeholder="BDT, USD, etc."
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-800 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Banking setup */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-2.5">
              <Shield className="w-4.5 h-4.5 text-indigo-600" />
              Remittance Settlement
            </h3>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Settlement Bank Name</label>
              <input
                type="text"
                required
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full p-2 border border-zinc-300 rounded-lg text-xs text-zinc-800 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Account Transit/Number</label>
              <input
                type="text"
                required
                value={accountNo}
                onChange={(e) => setAccountNo(e.target.value)}
                className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-mono font-bold text-zinc-800 bg-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Routing Number</label>
                <input
                  type="text"
                  required
                  value={routingNo}
                  onChange={(e) => setRoutingNo(e.target.value)}
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-mono bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">SWIFT Code</label>
                <input
                  type="text"
                  required
                  value={swiftCode}
                  onChange={(e) => setSwiftCode(e.target.value)}
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-mono bg-white"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
          >
            <Save className="w-4 h-4" /> Save Configuration
          </button>
        </div>

        {/* Right Column: HTML Templates Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 bg-zinc-50 border-b border-zinc-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
                <Palette className="w-4.5 h-4.5 text-indigo-600" />
                Custom Print Document Layouts (HTML/CSS)
              </h3>
            </div>

            {/* Sub Tabs */}
            <div className="flex border-b border-zinc-100 bg-zinc-50/50">
              <button
                type="button"
                onClick={() => setActiveTemplateTab('estimate')}
                className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                  activeTemplateTab === 'estimate' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Estimate Template
              </button>
              <button
                type="button"
                onClick={() => setActiveTemplateTab('invoice')}
                className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                  activeTemplateTab === 'invoice' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Invoice Template
              </button>
              <button
                type="button"
                onClick={() => setActiveTemplateTab('workorder')}
                className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                  activeTemplateTab === 'workorder' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Work Order Template
              </button>
            </div>

            <div className="p-5">
              <p className="text-xs text-zinc-500 mb-3">
                Modify raw templates using standard HTML elements. Feel free to use Tailwind CDN utility classes (eg. <code className="bg-zinc-100 px-1 rounded font-mono text-[10px]">text-indigo-600</code>). Use parameters like
                <code className="bg-zinc-100 px-1 rounded font-mono text-[10px] mx-1">{"{{companyName}}"}</code> and
                <code className="bg-zinc-100 px-1 rounded font-mono text-[10px] mx-1">{"{{lineItemsHTML}}"}</code>.
              </p>

              {activeTemplateTab === 'estimate' && (
                <textarea
                  rows={14}
                  value={estimateTemplate}
                  onChange={(e) => setEstimateTemplate(e.target.value)}
                  className="w-full font-mono text-xs p-3 border border-zinc-300 rounded-lg bg-zinc-900 text-zinc-300 focus:outline-hidden"
                />
              )}
              {activeTemplateTab === 'invoice' && (
                <textarea
                  rows={14}
                  value={invoiceTemplate}
                  onChange={(e) => setInvoiceTemplate(e.target.value)}
                  className="w-full font-mono text-xs p-3 border border-zinc-300 rounded-lg bg-zinc-900 text-zinc-300 focus:outline-hidden"
                />
              )}
              {activeTemplateTab === 'workorder' && (
                <textarea
                  rows={14}
                  value={workOrderTemplate}
                  onChange={(e) => setWorkOrderTemplate(e.target.value)}
                  className="w-full font-mono text-xs p-3 border border-zinc-300 rounded-lg bg-zinc-900 text-zinc-300 focus:outline-hidden"
                />
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
