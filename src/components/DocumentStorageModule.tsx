import React, { useState, useRef, FormEvent } from 'react';
import { User, UserRole, Project, Estimate, StoredFile } from '../types';
import { 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  Trash2, 
  Eye, 
  Download, 
  Search, 
  Users, 
  SlidersHorizontal, 
  Lock, 
  Tag, 
  Plus, 
  X,
  Info,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

interface DocumentStorageModuleProps {
  files: StoredFile[];
  users: User[];
  projects: Project[];
  estimates: Estimate[];
  currentUser: User;
  companyCurrency?: string;
  onUploadFile: (newFile: StoredFile) => void;
  onDeleteFile: (fileId: string) => void;
  onUpdateFileMetadata: (fileId: string, updatedFields: Partial<StoredFile>) => void;
}

export default function DocumentStorageModule({
  files,
  users,
  projects,
  estimates,
  currentUser,
  companyCurrency = 'BDT',
  onUploadFile,
  onDeleteFile,
  onUpdateFileMetadata
}: DocumentStorageModuleProps) {
  // Navigation and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [tagFilter, setTagFilter] = useState('ALL');
  const [subordinateFilter, setSubordinateFilter] = useState('ALL'); // For CS Managers
  const [showFilters, setShowFilters] = useState(false);

  // File Upload Form States
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [docName, setDocName] = useState('');
  const [docDescription, setDocDescription] = useState('');
  const [linkedProjectId, setLinkedProjectId] = useState('');
  const [linkedEstimateId, setLinkedEstimateId] = useState('');
  const [docTags, setDocTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isConfidential, setIsConfidential] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Active view modal
  const [previewFile, setPreviewFile] = useState<StoredFile | null>(null);
  const [editingFile, setEditingFile] = useState<StoredFile | null>(null);

  // Drag and Drop Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine hierarchy and subordinates
  const isMasterAdmin = currentUser.role === UserRole.MASTER_ADMIN;
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const isFinance = [UserRole.FINANCE_MANAGER, UserRole.FINANCE_USER].includes(currentUser.role);
  const isCsManager = currentUser.role === UserRole.CS_MANAGER;
  const isCsUser = currentUser.role === UserRole.CS_USER;

  // List of subordinate users
  const subordinates = users.filter(u => u.managerId === currentUser.id && u.role === UserRole.CS_USER);

  // Check if a user has access to view a specific document
  const canViewFile = (file: StoredFile) => {
    if (isMasterAdmin || isAdmin || isFinance) return true;
    if (file.uploadedBy === currentUser.id) return true;
    if (isCsManager) {
      // CS Manager can view documents of their subordinates
      const isSubordinate = subordinates.some(sub => sub.id === file.uploadedBy);
      return isSubordinate;
    }
    return false;
  };

  // Check if user can delete/modify a file
  const canModifyFile = (file: StoredFile) => {
    if (isMasterAdmin || isAdmin) return true;
    return file.uploadedBy === currentUser.id;
  };

  // Filtered list of files based on permissions and filters
  const visibleFiles = files.filter(canViewFile);

  const filteredFiles = visibleFiles.filter(file => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term || 
      file.name.toLowerCase().includes(term) ||
      (file.description && file.description.toLowerCase().includes(term)) ||
      file.uploadedByName.toLowerCase().includes(term) ||
      file.type.toLowerCase().includes(term);

    const matchesProject = projectFilter === 'ALL' || file.projectId === projectFilter;
    const matchesTag = tagFilter === 'ALL' || (file.tags && file.tags.includes(tagFilter));

    let matchesSubordinate = true;
    if (isCsManager && subordinateFilter !== 'ALL') {
      if (subordinateFilter === 'SELF') {
        matchesSubordinate = file.uploadedBy === currentUser.id;
      } else {
        matchesSubordinate = file.uploadedBy === subordinateFilter;
      }
    }

    return matchesSearch && matchesProject && matchesTag && matchesSubordinate;
  });

  // Collect unique tags for filter dropdown
  const allUniqueTags = Array.from(
    new Set(visibleFiles.flatMap(f => f.tags || []))
  );

  // File type helper icons & styles
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <ImageIcon className="h-6 w-6 text-indigo-500" />;
    }
    if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) {
      return <FileSpreadsheet className="h-6 w-6 text-emerald-500" />;
    }
    return <FileText className="h-6 w-6 text-amber-500" />;
  };

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      // Auto fill name if empty
      if (!docName) {
        const cleanName = file.name.replace(/\.[^/.]+$/, ""); // strip extension
        setDocName(cleanName);
      }
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setUploadFile(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      setDocName(cleanName);
    }
  };

  // Reset form
  const resetUploadForm = () => {
    setUploadFile(null);
    setDocName('');
    setDocDescription('');
    setLinkedProjectId('');
    setLinkedEstimateId('');
    setDocTags([]);
    setIsConfidential(false);
    setUploadError('');
    setIsUploading(false);
  };

  // Handle uploading and reading file to Base64
  const handleUploadSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select or drop a file to upload.');
      return;
    }
    if (!docName.trim()) {
      setUploadError('Please specify a document name.');
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const base64Data = reader.result as string;
        
        const newFile: StoredFile = {
          id: `file-${Date.now()}-${Math.floor(Math.random() * 89) + 10}`,
          name: `${docName}.${uploadFile.name.split('.').pop()}`,
          size: uploadFile.size,
          type: uploadFile.type || 'application/octet-stream',
          dataUrl: base64Data,
          uploadedBy: currentUser.id,
          uploadedByName: currentUser.name,
          uploadedAt: new Date().toISOString(),
          companyId: currentUser.companyId,
          description: docDescription.trim() || undefined,
          projectId: linkedProjectId || undefined,
          estimateId: linkedEstimateId || undefined,
          tags: docTags.length > 0 ? docTags : ['General'],
          isConfidential: isConfidential
        };

        onUploadFile(newFile);
        resetUploadForm();
      } catch (err) {
        setUploadError('Failed to parse file. Ensure it is not corrupted.');
        setIsUploading(false);
      }
    };

    reader.onerror = () => {
      setUploadError('Failed to read file contents.');
      setIsUploading(false);
    };

    // Read file as Data URL (Base64)
    reader.readAsDataURL(uploadFile);
  };

  // Quick tag management helper
  const addTag = () => {
    const tag = newTagInput.trim().toLowerCase();
    if (tag && !docTags.includes(tag)) {
      setDocTags([...docTags, tag]);
      setNewTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setDocTags(docTags.filter(t => t !== tagToRemove));
  };

  // Format bytes helper
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Edit metadata form save
  const handleSaveMetadata = (e: FormEvent) => {
    e.preventDefault();
    if (!editingFile) return;

    onUpdateFileMetadata(editingFile.id, {
      name: editingFile.name,
      description: editingFile.description,
      projectId: editingFile.projectId || undefined,
      estimateId: editingFile.estimateId || undefined,
      tags: editingFile.tags,
      isConfidential: editingFile.isConfidential
    });

    setEditingFile(null);
  };

  return (
    <div id="document-storage-module" className="space-y-6 animate-fade-in text-xs">
      
      {/* 1. Header & Quick Perms Status Banner */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <span>Secure Cloud Document Hub</span>
            <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Lock className="w-3 h-3 mr-1" />
              Role-Isolated Storage
            </span>
          </h2>
          <p className="text-zinc-500 mt-1">
            Store metadata and files securely. System enforces granular security roles so standard users can only view their own files, while managers see subordinate records.
          </p>
        </div>

        <div className="bg-zinc-50 border rounded-xl p-3 text-zinc-600 space-y-1 w-full md:w-auto md:min-w-[240px]">
          <div className="flex justify-between font-semibold text-zinc-700">
            <span>Your Active Role:</span>
            <span className="text-indigo-600 font-mono font-bold uppercase">{currentUser.role}</span>
          </div>
          <div className="text-[10px] text-zinc-400 leading-relaxed">
            {isMasterAdmin || isAdmin ? (
              <span className="text-emerald-600 font-medium">✓ Tenant Admin Session: Full access to all uploaded documents</span>
            ) : isCsManager ? (
              <span className="text-indigo-600 font-medium">🛡️ CS Manager Session: Viewing your documents and {subordinates.length} subordinate staff files</span>
            ) : (
              <span className="text-amber-600 font-medium">🔒 Staff Session: Isolated view of only your self-authored metadata & files</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. CS Manager Hierarchy Overview & Subordinate Deck */}
      {isCsManager && (
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-indigo-900">
            <Users className="w-4 h-4 text-indigo-500" />
            <h3 className="font-bold uppercase tracking-wider text-[11px]">CS Supervisor Dashboard: Subordinate Registry</h3>
          </div>
          <p className="text-zinc-500">
            You are the assigned supervisor for the following CS Users. All document uploads, estimates, and metadata created by these specialists are visible to you.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
            {subordinates.length === 0 ? (
              <div className="bg-white p-3 rounded-xl border border-zinc-200 text-zinc-400 italic col-span-full">
                No CS users are currently registered under your supervisor node. Add or link CS Users using the User Management console.
              </div>
            ) : (
              subordinates.map(sub => {
                const subFilesCount = files.filter(f => f.uploadedBy === sub.id).length;
                return (
                  <div key={sub.id} className="bg-white p-3 rounded-xl border border-zinc-200 shadow-xs flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-zinc-900">{sub.name}</h4>
                      <p className="text-[10px] text-zinc-400 font-mono">{sub.email}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 text-[10px]">
                        {subFilesCount} Files
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 3. Main Workspace: Upload Form (Left/Top) & Documents Grid (Right/Bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Upload Area */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-zinc-900 tracking-tight text-sm uppercase border-b pb-2">Upload New Document</h3>
            
            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 font-semibold rounded-xl leading-relaxed">
                ⚠️ {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              
              {/* Drag & Drop File Zone */}
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-200 hover:border-indigo-400 bg-zinc-50 hover:bg-zinc-100/50 p-6 rounded-2xl text-center cursor-pointer transition-all space-y-2"
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                <div className="inline-flex p-3 bg-white rounded-xl shadow-xs border border-zinc-150 text-zinc-400">
                  <UploadCloud className="w-5 h-5 text-indigo-500 animate-bounce" />
                </div>
                
                {uploadFile ? (
                  <div className="space-y-1">
                    <p className="font-bold text-zinc-900 break-all">{uploadFile.name}</p>
                    <p className="text-[10px] text-zinc-500">{formatBytes(uploadFile.size)}</p>
                    <span className="inline-block text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                      File Loaded
                    </span>
                  </div>
                ) : (
                  <div>
                    <p className="font-bold text-zinc-800 text-xs">Drag & Drop file here, or click to browse</p>
                    <p className="text-[10px] text-zinc-400 mt-1">Supports PDF, PNG, JPG, CSV, XLSX, DOCX up to 10MB</p>
                  </div>
                )}
              </div>

              {/* Document Name */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3 Vendor Agreement Scan"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Description / Notes</label>
                <textarea
                  placeholder="Summarize metadata, audit comments, or ledger remarks..."
                  value={docDescription}
                  onChange={(e) => setDocDescription(e.target.value)}
                  className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-1 focus:ring-indigo-500 h-16 resize-none"
                />
              </div>

              {/* Entity Links (Project & Estimate) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Link Project</label>
                  <select
                    value={linkedProjectId}
                    onChange={(e) => setLinkedProjectId(e.target.value)}
                    className="w-full p-1.5 bg-zinc-50 border border-zinc-200 rounded-lg"
                  >
                    <option value="">-- None --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Link Estimate</label>
                  <select
                    value={linkedEstimateId}
                    onChange={(e) => setLinkedEstimateId(e.target.value)}
                    className="w-full p-1.5 bg-zinc-50 border border-zinc-200 rounded-lg"
                  >
                    <option value="">-- None --</option>
                    {estimates.map(e => (
                      <option key={e.id} value={e.id}>{e.id} ({companyCurrency} {e.totalAmount})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags Section */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Document Tags</label>
                <div className="flex gap-1.5 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. vat-mushok, grn, contract"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    className="flex-1 p-1.5 bg-zinc-50 border border-zinc-200 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center justify-center cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {docTags.length === 0 ? (
                    <span className="text-[10px] text-zinc-400 italic">No custom tags added. Will be tagged "General".</span>
                  ) : (
                    docTags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5">
                        <Tag className="w-2.5 h-2.5 text-indigo-400" />
                        <span>{tag}</span>
                        <button type="button" onClick={() => removeTag(tag)} className="text-zinc-400 hover:text-rose-600 focus:outline-hidden">
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Confidential Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isConfidential"
                  checked={isConfidential}
                  onChange={(e) => setIsConfidential(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 border-zinc-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="isConfidential" className="font-bold text-zinc-700 select-none cursor-pointer">
                  Mark as Confidential (Restrict to Admin and Uploader)
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isUploading}
                className="w-full bg-zinc-900 hover:bg-black text-white font-bold py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:bg-zinc-200 disabled:text-zinc-400 cursor-pointer"
              >
                {isUploading ? (
                  <span>Digitizing metadata and files...</span>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload & Store Securely</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Search, Filters, and Documents Grid */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Filters & Search panel */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search file catalog by filename, remarks, or uploader name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-4 py-2 border rounded-lg text-xs font-semibold cursor-pointer ${
                  showFilters || projectFilter !== 'ALL' || tagFilter !== 'ALL' || subordinateFilter !== 'ALL'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                    : 'bg-white border-zinc-200 text-zinc-600'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>

            {/* Expanded Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-zinc-100">
                {/* Project links filter */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Filter by Project</label>
                  <select
                    value={projectFilter}
                    onChange={(e) => setProjectFilter(e.target.value)}
                    className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg"
                  >
                    <option value="ALL">All Projects</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Tags filter */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Filter by Tag</label>
                  <select
                    value={tagFilter}
                    onChange={(e) => setTagFilter(e.target.value)}
                    className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg"
                  >
                    <option value="ALL">All Tags</option>
                    {allUniqueTags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>

                {/* Subordinate filter (Visible to CS Manager only) */}
                {isCsManager && (
                  <div>
                    <label className="block text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Staff Subordinate</label>
                    <select
                      value={subordinateFilter}
                      onChange={(e) => setSubordinateFilter(e.target.value)}
                      className="w-full p-2 bg-indigo-50/50 border border-indigo-150 rounded-lg font-semibold text-indigo-900"
                    >
                      <option value="ALL">Entire Team Hierarchy</option>
                      <option value="SELF">Just Me (Supervisor)</option>
                      {subordinates.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name} (Subordinate)</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Catalog Listing */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-zinc-900 tracking-tight text-sm uppercase">Stored Document Registry ({filteredFiles.length})</h3>
              <span className="text-[10px] text-zinc-400 font-mono">Viewing permitted cloud nodes</span>
            </div>

            {filteredFiles.length === 0 ? (
              <div className="text-center py-16 text-zinc-400 space-y-2">
                <Info className="w-8 h-8 mx-auto text-zinc-300" />
                <p className="font-bold">No files match your filter or search criteria.</p>
                <p className="text-[10px]">Enforced role rules are active. If you are a staff user, you only see self-created metadata uploads.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFiles.map(file => {
                  const relatedProject = projects.find(p => p.id === file.projectId);
                  const isConf = file.isConfidential;
                  
                  return (
                    <div 
                      key={file.id} 
                      className={`border rounded-xl p-4 flex flex-col justify-between hover:shadow-xs transition-all space-y-3 relative overflow-hidden ${
                        isConf ? 'border-rose-200 bg-rose-50/30' : 'border-zinc-200 bg-white'
                      }`}
                    >
                      {isConf && (
                        <div className="absolute top-0 right-0 bg-rose-500 text-white font-bold text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-bl">
                          CONFIDENTIAL
                        </div>
                      )}

                      <div className="space-y-2.5">
                        {/* File Name & Icon Header */}
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-zinc-50 border rounded-xl shrink-0">
                            {getFileIcon(file.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-zinc-800 break-all leading-tight text-xs" title={file.name}>
                              {file.name}
                            </h4>
                            <p className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1">
                              <span>{formatBytes(file.size)}</span>
                              <span>•</span>
                              <span className="truncate">{file.type.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                            </p>
                          </div>
                        </div>

                        {/* File description / metadata */}
                        {file.description && (
                          <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed bg-zinc-50 p-2 rounded-lg border">
                            {file.description}
                          </p>
                        )}

                        {/* Link tags */}
                        <div className="flex flex-wrap gap-1">
                          {relatedProject && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5">
                              <Layers className="w-2.5 h-2.5 text-indigo-400" />
                              <span>Project: {relatedProject.name}</span>
                            </span>
                          )}
                          {file.estimateId && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5">
                              <span>Est: {file.estimateId}</span>
                            </span>
                          )}
                          {file.tags?.map(t => (
                            <span key={t} className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-zinc-600 bg-zinc-100 border border-zinc-200 rounded px-1.5 py-0.5">
                              <Tag className="w-2 h-2 text-zinc-400" />
                              <span>{t}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* File Footer: Uploader, Date and Actions */}
                      <div className="border-t border-zinc-100 pt-3 flex justify-between items-center text-[10px] text-zinc-500">
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-700 truncate">Uploaded by: {file.uploadedByName}</p>
                          <p className="text-[9px] text-zinc-400 mt-0.5">{new Date(file.uploadedAt).toLocaleDateString()}</p>
                        </div>

                        {/* Actions buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Viewer button */}
                          <button
                            onClick={() => setPreviewFile(file)}
                            className="p-1.5 text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 border rounded-lg cursor-pointer transition-colors"
                            title="Preview File"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          
                          {/* Download button */}
                          {file.dataUrl && (
                            <a
                              href={file.dataUrl}
                              download={file.name}
                              className="p-1.5 text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 border rounded-lg cursor-pointer transition-colors"
                              title="Download File"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* Edit button */}
                          {canModifyFile(file) && (
                            <button
                              onClick={() => setEditingFile({ ...file })}
                              className="p-1.5 text-zinc-500 hover:text-amber-600 hover:bg-amber-50 border rounded-lg cursor-pointer transition-colors"
                              title="Edit Metadata"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete button */}
                          {canModifyFile(file) && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you absolutely sure you want to permanently delete "${file.name}"?`)) {
                                  onDeleteFile(file.id);
                                }
                              }}
                              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 border rounded-lg cursor-pointer transition-colors"
                              title="Delete File"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: Digital Document Viewer / Preview */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn text-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Title bar */}
            <div className="bg-zinc-950 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm truncate">{previewFile.name}</h3>
                <p className="text-[10px] text-zinc-400">Metadata Scan Vault Node: {previewFile.id}</p>
              </div>
              <button 
                onClick={() => setPreviewFile(null)}
                className="text-zinc-400 hover:text-white p-1 hover:bg-zinc-800 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              
              {/* Actual File Render / Simulated Preview */}
              <div className="bg-zinc-50 border rounded-2xl p-4 flex justify-center items-center min-h-[220px]">
                {previewFile.type.startsWith('image/') && previewFile.dataUrl ? (
                  <img 
                    src={previewFile.dataUrl} 
                    alt={previewFile.name} 
                    className="max-h-[320px] rounded-lg shadow-sm object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-center space-y-3">
                    <div className="inline-flex p-4 bg-white rounded-2xl shadow-xs border text-indigo-600">
                      {getFileIcon(previewFile.type)}
                    </div>
                    <div>
                      <p className="font-bold text-zinc-800">{previewFile.name}</p>
                      <p className="text-[10px] text-zinc-400">File Type: {previewFile.type} ({formatBytes(previewFile.size)})</p>
                    </div>
                    <span className="inline-block text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-2.5 py-1">
                      No Inline Preview available for this type
                    </span>
                    <p className="text-[10px] text-zinc-500 max-w-md mx-auto leading-relaxed">
                      This browser Sandbox securely tracks this record metadata. Click 'Download' below to fetch the original payload.
                    </p>
                  </div>
                )}
              </div>

              {/* Metadata Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Information Card */}
                <div className="space-y-3 border rounded-xl p-4 bg-zinc-50">
                  <span className="text-[10px] font-bold uppercase text-zinc-400 block tracking-wider">Storage Node Metadata</span>
                  
                  <div className="space-y-2 text-zinc-700">
                    <div className="flex justify-between">
                      <span className="font-semibold text-zinc-500">Uploader:</span>
                      <span className="font-bold">{previewFile.uploadedByName} ({previewFile.uploadedBy === currentUser.id ? 'You' : previewFile.uploadedBy})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-zinc-500">Date:</span>
                      <span>{new Date(previewFile.uploadedAt).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-zinc-500">Confidential:</span>
                      <span className={previewFile.isConfidential ? 'text-rose-600 font-bold' : 'text-zinc-500 font-medium'}>
                        {previewFile.isConfidential ? 'Restricted Admin/Uploader' : 'Company Public'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Relational Entity Mapping Card */}
                <div className="space-y-3 border rounded-xl p-4 bg-zinc-50">
                  <span className="text-[10px] font-bold uppercase text-zinc-400 block tracking-wider">Connected ERP Entities</span>
                  
                  <div className="space-y-2 text-zinc-700">
                    <div className="flex justify-between">
                      <span className="font-semibold text-zinc-500">Project:</span>
                      <span className="font-bold truncate">
                        {projects.find(p => p.id === previewFile.projectId)?.name || 'Unmapped'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-zinc-500">Estimate ID:</span>
                      <span>{previewFile.estimateId || 'Unmapped'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-zinc-500">Tags:</span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {previewFile.tags?.map(t => (
                          <span key={t} className="bg-zinc-200 px-1.5 py-0.5 rounded text-[9px] font-semibold text-zinc-700">{t}</span>
                        )) || 'None'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Remarks/Remarks Comments */}
              {previewFile.description && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-zinc-400 block tracking-wider">Official Audit Log Remarks / Description</span>
                  <div className="bg-zinc-50 p-3 rounded-xl border text-zinc-700 leading-relaxed font-mono">
                    {previewFile.description}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="bg-zinc-50 p-4 border-t flex justify-end gap-2 shrink-0">
              {previewFile.dataUrl && (
                <a
                  href={previewFile.dataUrl}
                  download={previewFile.name}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Document</span>
                </a>
              )}
              <button
                onClick={() => setPreviewFile(null)}
                className="bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-bold px-4 py-2 rounded-xl cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Metadata Editor */}
      {editingFile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn text-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border shadow-2xl overflow-hidden">
            <div className="bg-zinc-900 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Edit Document Metadata</h3>
                <p className="text-[10px] text-zinc-400">Node ID: {editingFile.id}</p>
              </div>
              <button 
                onClick={() => setEditingFile(null)}
                className="text-zinc-400 hover:text-white p-1 hover:bg-zinc-800 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMetadata}>
              <div className="p-5 space-y-4">
                {/* Filename */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Rename File Name</label>
                  <input
                    type="text"
                    required
                    value={editingFile.name}
                    onChange={(e) => setEditingFile({ ...editingFile, name: e.target.value })}
                    className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Description / Audit Notes</label>
                  <textarea
                    value={editingFile.description || ''}
                    onChange={(e) => setEditingFile({ ...editingFile, description: e.target.value })}
                    className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg h-20 resize-none"
                  />
                </div>

                {/* Links */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Linked Project</label>
                    <select
                      value={editingFile.projectId || ''}
                      onChange={(e) => setEditingFile({ ...editingFile, projectId: e.target.value })}
                      className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg"
                    >
                      <option value="">-- None --</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Linked Estimate</label>
                    <select
                      value={editingFile.estimateId || ''}
                      onChange={(e) => setEditingFile({ ...editingFile, estimateId: e.target.value })}
                      className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg"
                    >
                      <option value="">-- None --</option>
                      {estimates.map(e => (
                        <option key={e.id} value={e.id}>{e.id}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Confidentiality toggle */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="edit_confidential"
                    checked={editingFile.isConfidential || false}
                    onChange={(e) => setEditingFile({ ...editingFile, isConfidential: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 border-zinc-300 rounded"
                  />
                  <label htmlFor="edit_confidential" className="font-bold text-zinc-700 select-none cursor-pointer">
                    Confidential (Restrict to Admin and Uploader)
                  </label>
                </div>
              </div>

              <div className="bg-zinc-50 p-4 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingFile(null)}
                  className="bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
