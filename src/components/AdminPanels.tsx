import { useState, FormEvent } from 'react';
import { Company, User, UserRole } from '../types';
import { Building, UserPlus, ShieldAlert, Key, Globe, Plus, Trash2, CheckCircle, HelpCircle } from 'lucide-react';

interface MasterAdminPanelProps {
  companies: Company[];
  users: User[];
  onAddCompany: (newCompany: Company) => void;
  onAddUser: (newUser: User) => void;
}

export function MasterAdminPanel({ companies, users, onAddCompany, onAddUser }: MasterAdminPanelProps) {
  // Company creation state
  const [compName, setCompName] = useState('');
  const [compCurrency, setCompCurrency] = useState('BDT');
  const [bankName, setBankName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [routingNo, setRoutingNo] = useState('');
  const [swiftCode, setSwiftCode] = useState('');

  // Admin user creation state
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState(companies[0]?.id || '');

  const [companySuccess, setCompanySuccess] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');

  const handleCreateCompany = (e: FormEvent) => {
    e.preventDefault();
    if (!compName.trim()) return;

    const newCompanyId = `comp-${compName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
    const newCompany: Company = {
      id: newCompanyId,
      name: compName,
      logoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      currency: compCurrency,
      bankDetails: {
        bankName: bankName || 'Standard Chartered',
        accountNo: accountNo || 'SCB-0000-0000',
        routingNo: routingNo || '000000000',
        swiftCode: swiftCode || 'SCBBDDXXXX'
      },
      templates: {
        estimateTemplate: '<div>Estimate Proposal</div>',
        invoiceTemplate: '<div>Commercial Invoice</div>',
        workOrderTemplate: '<div>Work Order Breakdown</div>'
      }
    };

    onAddCompany(newCompany);
    setCompName('');
    setBankName('');
    setAccountNo('');
    setRoutingNo('');
    setSwiftCode('');
    
    // Auto-select this company in the admin user creator
    setSelectedCompanyId(newCompanyId);
    setCompanySuccess(`Successfully created company "${compName}"!`);
    setTimeout(() => setCompanySuccess(''), 4000);
  };

  const handleCreateAdmin = (e: FormEvent) => {
    e.preventDefault();
    if (!adminName.trim() || !adminEmail.trim() || !adminPassword.trim() || !selectedCompanyId) return;

    const newUserId = `user-admin-${Date.now().toString().slice(-4)}`;
    const newUser: User = {
      id: newUserId,
      name: adminName,
      email: adminEmail,
      role: UserRole.ADMIN,
      status: 'ACTIVE',
      companyId: selectedCompanyId,
      password: adminPassword
    };

    onAddUser(newUser);
    setAdminName('');
    setAdminEmail('');
    setAdminPassword('');
    
    setAdminSuccess(`Successfully created Tenant Admin "${adminName}"!`);
    setTimeout(() => setAdminSuccess(''), 4000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-3 border-b border-zinc-200 pb-4">
        <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Master Administrative Control Panel</h2>
          <p className="text-xs text-zinc-500">Add isolated tenant companies and define their primary company administrators.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Company Creator Card */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <Building className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-zinc-900 text-sm uppercase">1. Provision New Company (Tenant)</h3>
          </div>

          {companySuccess && (
            <div className="p-3 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg">
              {companySuccess}
            </div>
          )}

          <form onSubmit={handleCreateCompany} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Infrastructures"
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  className="w-full p-2 text-sm bg-white border border-zinc-300 rounded-lg focus:ring-1 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Primary Currency *</label>
                <select
                  value={compCurrency}
                  onChange={(e) => setCompCurrency(e.target.value)}
                  className="w-full p-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                >
                  <option value="BDT">BDT (Bangladesh Taka)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="GBP">GBP (British Pound)</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-3">
              <span className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wider">Default Remittance Bank Details</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-600 mb-0.5">Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. City Bank BD"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full p-1.5 text-xs bg-white border border-zinc-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-600 mb-0.5">Account Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 1109-8801-99"
                    value={accountNo}
                    onChange={(e) => setAccountNo(e.target.value)}
                    className="w-full p-1.5 text-xs bg-white border border-zinc-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-600 mb-0.5">Routing Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 020261101"
                    value={routingNo}
                    onChange={(e) => setRoutingNo(e.target.value)}
                    className="w-full p-1.5 text-xs bg-white border border-zinc-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-600 mb-0.5">SWIFT/BIC Code</label>
                  <input
                    type="text"
                    placeholder="e.g. CIBKBDDHXXX"
                    value={swiftCode}
                    onChange={(e) => setSwiftCode(e.target.value)}
                    className="w-full p-1.5 text-xs bg-white border border-zinc-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs transition-colors cursor-pointer flex justify-center items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create & Provision Tenant Company</span>
            </button>
          </form>
        </div>

        {/* Tenant Admin Creator Card */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <UserPlus className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-zinc-900 text-sm uppercase">2. Assign Tenant Admin Account</h3>
          </div>

          {adminSuccess && (
            <div className="p-3 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg">
              {adminSuccess}
            </div>
          )}

          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Select Tenant Company *</label>
              <select
                required
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full p-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              >
                <option value="">-- Choose Company --</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Admin Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Karim Chowdhury"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full p-2 text-sm bg-white border border-zinc-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Admin Email/Username *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. karim@company.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full p-2 text-sm bg-white border border-zinc-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Login Password *</label>
              <div className="relative">
                <Key className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Define secure password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full p-2 pl-9 text-sm bg-white border border-zinc-300 rounded-lg"
                />
              </div>
              <p className="text-[10px] text-zinc-400 mt-1">Tenant admins will log in using this email and password, enabling them to create company staff.</p>
            </div>

            <button
              type="submit"
              disabled={!selectedCompanyId}
              className="w-full bg-zinc-900 hover:bg-black disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs transition-colors cursor-pointer flex justify-center items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Tenant Admin Account</span>
            </button>
          </form>
        </div>
      </div>

      {/* Directory of Tenant Companies & Admins */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
        <h3 className="font-bold text-zinc-900 text-sm uppercase tracking-wide border-b pb-2">Active Tenants and Company Admins</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {companies.map(company => {
            const companyAdmins = users.filter(u => u.companyId === company.id && u.role === UserRole.ADMIN);
            return (
              <div key={company.id} className="p-4 rounded-xl border border-zinc-150 bg-zinc-50/50 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-zinc-900 text-sm">{company.name}</h4>
                    <span className="text-[10px] text-purple-600 font-mono font-bold uppercase tracking-wider">{company.id}</span>
                  </div>
                  <span className="inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                    Tenant Isolated
                  </span>
                </div>

                <div className="text-xs text-zinc-500 space-y-1">
                  <div><strong className="text-zinc-700">Currency:</strong> {company.currency || 'BDT'}</div>
                  <div><strong className="text-zinc-700">Bank Routing:</strong> {company.bankDetails.routingNo}</div>
                </div>

                <div className="border-t border-zinc-100 pt-2.5">
                  <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider block mb-1.5">Company Admin Users ({companyAdmins.length})</span>
                  
                  {companyAdmins.length === 0 ? (
                    <div className="text-xs text-zinc-400 italic">No admin assigned yet. Use the tool above.</div>
                  ) : (
                    <div className="space-y-1.5">
                      {companyAdmins.map(admin => (
                        <div key={admin.id} className="bg-white p-2 rounded-lg border border-zinc-200/60 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-semibold text-zinc-800">{admin.name}</p>
                            <p className="text-[10px] text-zinc-500">{admin.email}</p>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded border">
                            PW: {admin.password}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface UserManagementPanelProps {
  users: User[];
  activeCompanyId: string;
  onAddUser: (newUser: User) => void;
  companies: Company[];
}

export function UserManagementPanel({ users, activeCompanyId, onAddUser, companies }: UserManagementPanelProps) {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState<UserRole>(UserRole.CS_USER);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [userSuccess, setUserSuccess] = useState('');

  const currentCompany = companies.find(c => c.id === activeCompanyId) || companies[0];
  const csManagers = users.filter(u => u.companyId === activeCompanyId && u.role === UserRole.CS_MANAGER);

  const handleCreateUser = (e: FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim() || !userPassword.trim()) return;

    const newUserId = `user-staff-${Date.now().toString().slice(-4)}`;
    const newUser: User = {
      id: newUserId,
      name: userName,
      email: userEmail,
      role: userRole,
      status: 'ACTIVE',
      companyId: activeCompanyId,
      password: userPassword,
      managerId: userRole === UserRole.CS_USER && selectedManagerId ? selectedManagerId : undefined
    };

    onAddUser(newUser);
    setUserName('');
    setUserEmail('');
    setUserPassword('');
    setSelectedManagerId('');
    
    setUserSuccess(`Successfully created user "${userName}" as ${userRole}!`);
    setTimeout(() => setUserSuccess(''), 4000);
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.MASTER_ADMIN: return 'bg-purple-100 text-purple-800 border-purple-200';
      case UserRole.ADMIN: return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case UserRole.CS_MANAGER: return 'bg-teal-100 text-teal-800 border-teal-200';
      case UserRole.CS_USER: return 'bg-teal-50 text-teal-700 border-teal-100';
      case UserRole.FINANCE_MANAGER: return 'bg-rose-100 text-rose-800 border-rose-200';
      case UserRole.FINANCE_USER: return 'bg-rose-50 text-rose-700 border-rose-100';
      case UserRole.VAT_DEPT_USER: return 'bg-amber-100 text-amber-800 border-amber-200';
      case UserRole.VENDOR: return 'bg-sky-100 text-sky-800 border-sky-200';
      default: return 'bg-zinc-100 text-zinc-800 border-zinc-200';
    }
  };

  // Get users for only the active company/tenant
  const companyUsers = users.filter(u => u.companyId === activeCompanyId);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-3 border-b border-zinc-200 pb-4">
        <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
          <UserPlus className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Tenant User & Role Directory</h2>
          <p className="text-xs text-zinc-500">Manage login credentials and system-wide roles for staff operating under <span className="font-semibold text-zinc-800">{currentCompany?.name}</span>.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Creator Form */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-4 lg:col-span-1">
          <h3 className="font-bold text-zinc-900 text-sm uppercase tracking-wide border-b pb-2">Add Staff User</h3>
          
          {userSuccess && (
            <div className="p-3 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg">
              {userSuccess}
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Staff Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Robert Pattinson"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full p-2 text-sm bg-white border border-zinc-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Email Address (User ID) *</label>
              <input
                type="email"
                required
                placeholder="e.g. robert@company.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full p-2 text-sm bg-white border border-zinc-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Login Password *</label>
              <div className="relative">
                <Key className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Enter login password"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  className="w-full p-2 pl-9 text-sm bg-white border border-zinc-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Assigned Operational Role *</label>
              <select
                required
                value={userRole}
                onChange={(e) => {
                  setUserRole(e.target.value as UserRole);
                  setSelectedManagerId('');
                }}
                className="w-full p-2 text-sm bg-white border border-zinc-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value={UserRole.CS_USER}>CS_USER (Customer Service Specialist)</option>
                <option value={UserRole.CS_MANAGER}>CS_MANAGER (CS Project Approver)</option>
                <option value={UserRole.FINANCE_USER}>FINANCE_USER (Billing & Accounts)</option>
                <option value={UserRole.FINANCE_MANAGER}>FINANCE_MANAGER (Treasurer / Financial Controller)</option>
                <option value={UserRole.VAT_DEPT_USER}>VAT_DEPT_USER (Government Auditor desk)</option>
                <option value={UserRole.VENDOR}>VENDOR (Partner Supplier Account)</option>
              </select>
            </div>

            {userRole === UserRole.CS_USER && (
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Assign CS Manager (Supervisor) *</label>
                <select
                  required
                  value={selectedManagerId}
                  onChange={(e) => setSelectedManagerId(e.target.value)}
                  className="w-full p-2 text-sm bg-white border border-zinc-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="">-- Select Supervisor CS Manager --</option>
                  {csManagers.map(mgr => (
                    <option key={mgr.id} value={mgr.id}>
                      {mgr.name} ({mgr.email})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-zinc-400 mt-1">CS Users must operate under an active CS Supervisor / CS Manager.</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer flex justify-center items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Credentials</span>
            </button>
          </form>
        </div>

        {/* User list table */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-bold text-zinc-900 text-sm uppercase tracking-wide">Staff and Credentials Directory ({companyUsers.length})</h3>
            <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              Isolated Tenant Node
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-zinc-150 text-zinc-400 font-bold uppercase tracking-wider bg-zinc-50">
                  <th className="p-3">Staff Name / ID</th>
                  <th className="p-3">Email (Username)</th>
                  <th className="p-3">Role Code</th>
                  <th className="p-3">Password Credentials</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {companyUsers.map(user => (
                  <tr key={user.id} className="border-b border-zinc-100 hover:bg-zinc-50/50">
                    <td className="p-3">
                      <div className="font-bold text-zinc-900">{user.name}</div>
                      <div className="text-[10px] font-mono text-zinc-400">{user.id}</div>
                    </td>
                    <td className="p-3 text-zinc-600 font-medium">{user.email}</td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRoleColor(user.role)} self-start`}>
                          {user.role}
                        </span>
                        {user.role === UserRole.CS_USER && user.managerId && (
                          <span className="text-[10px] text-zinc-500 font-medium">
                            Supervisor: {users.find(u => u.id === user.managerId)?.name || user.managerId}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="font-mono text-zinc-800 bg-zinc-50 px-2 py-1 rounded border border-zinc-200">{user.password || 'password123'}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
