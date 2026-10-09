'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  Save,
  Sparkles,
  Layers,
  DollarSign,
  Info,
  CheckCircle2,
  RefreshCw,
  UploadCloud,
  FileSpreadsheet,
  Loader2,
  FileCode,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  getLocalQuoteReferenceData,
  saveLocalQuoteReferenceData,
  deleteLocalQuoteReferenceData,
  getLocalProfile,
  getLocalQuoteDocuments,
  saveLocalQuoteDocument,
  deleteLocalQuoteDocument,
  DEFAULT_SERVICE_CATALOG,
} from '@/lib/store';
import { extractCatalogFromDocumentWithGemini } from '@/lib/gemini';
import { QuoteReferenceData, MaterialCostItem, Profile, UploadedQuoteDoc } from '@/types';

export default function QuoteDataPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [catalogItems, setCatalogItems] = useState<QuoteReferenceData[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedQuoteDoc[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [serviceName, setServiceName] = useState('');
  const [baseLaborRate, setBaseLaborRate] = useState<number>(500);
  const [notesForAi, setNotesForAi] = useState('');
  const [materials, setMaterials] = useState<MaterialCostItem[]>([]);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [extractingId, setExtractingId] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  // Material input state
  const [matName, setMatName] = useState('');
  const [matCost, setMatCost] = useState<number>(250);
  const [matUnit, setMatUnit] = useState('item');

  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadCatalog = () => {
    const prof = getLocalProfile();
    setProfile(prof);
    const data = getLocalQuoteReferenceData();
    setCatalogItems(data);
    const docs = getLocalQuoteDocuments();
    setUploadedDocs(docs);
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'file';
    const isExcel = ['xlsx', 'xls', 'csv'].includes(fileExt);

    const reader = new FileReader();

    reader.onload = async (evt) => {
      let contentText = '';
      try {
        if (isExcel) {
          const buffer = evt.target?.result as ArrayBuffer;
          const workbook = XLSX.read(buffer, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          if (firstSheetName) {
            const worksheet = workbook.Sheets[firstSheetName];
            contentText = XLSX.utils.sheet_to_csv(worksheet);
          }
        } else {
          contentText = String(evt.target?.result || '');
        }
      } catch (err) {
        console.error('Failed to parse Excel file:', err);
      }

      let fileTypeLabel = 'txt';
      if (fileExt === 'pdf') fileTypeLabel = 'pdf';
      else if (isExcel) fileTypeLabel = 'excel';

      const newDoc: UploadedQuoteDoc = {
        id: `doc-${Date.now()}`,
        file_name: file.name,
        file_type: fileTypeLabel,
        content_text: contentText || `Rate sheet document: ${file.name}`,
        uploaded_at: new Date().toISOString(),
      };

      saveLocalQuoteDocument(newDoc);
      loadCatalog();
      setUploading(false);
      setUploadMessage(`Uploaded rate card document: ${file.name}`);
      setTimeout(() => setUploadMessage(null), 4000);
    };

    reader.onerror = () => {
      setUploading(false);
      alert('Failed to read uploaded file.');
    };

    if (isExcel) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleAiExtractDocument = async (doc: UploadedQuoteDoc) => {
    // Check if document contains binary zip noise from an older upload
    if (doc.content_text.startsWith('PK\x03\x04') || doc.content_text.includes('PK\x03\x04') || doc.content_text.startsWith('PK')) {
      alert(`"${doc.file_name}" was uploaded in raw binary format previously. Please delete this document card and re-upload it so Gemini AI can extract the structured rates!`);
      return;
    }

    setExtractingId(doc.id);
    const extractedItems = await extractCatalogFromDocumentWithGemini(
      doc.content_text,
      profile?.trade_type || 'Plumbing'
    );

    if (extractedItems.length > 0) {
      extractedItems.forEach((item) => saveLocalQuoteReferenceData(item));
      loadCatalog();
      setUploadMessage(`✨ Gemini AI extracted ${extractedItems.length} service rates from "${doc.file_name}" into your catalog!`);
    } else {
      alert('Gemini AI could not find structured rate items in this document.');
    }
    setExtractingId(null);
  };

  const handleDeleteDoc = (id: string) => {
    if (confirm('Delete this uploaded rate card document?')) {
      deleteLocalQuoteDocument(id);
      loadCatalog();
    }
  };

  const handleAddMaterial = () => {
    if (!matName) return;
    const newItem: MaterialCostItem = {
      id: `mat-${Date.now()}`,
      name: matName,
      unit_cost: Number(matCost) || 0,
      unit: matUnit || 'unit',
    };
    setMaterials([...materials, newItem]);
    setMatName('');
    setMatCost(25);
    setMatUnit('item');
  };

  const handleRemoveMaterial = (id: string) => {
    setMaterials(materials.filter((m) => m.id !== id));
  };

  const handleEditClick = (item: QuoteReferenceData) => {
    setEditingId(item.id);
    setServiceName(item.service_name);
    setBaseLaborRate(item.base_labor_rate);
    setNotesForAi(item.notes_for_ai);
    setMaterials(item.material_costs || []);
  };

  const handleResetForm = () => {
    setEditingId(null);
    setServiceName('');
    setBaseLaborRate(500);
    setNotesForAi('');
    setMaterials([]);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName) return;

    const profileId = profile?.id || 'usr-default-01';
    const itemToSave: QuoteReferenceData = {
      id: editingId || `ref-${Date.now()}`,
      profile_id: profileId,
      service_name: serviceName,
      base_labor_rate: Number(baseLaborRate),
      material_costs: materials,
      notes_for_ai: notesForAi,
    };

    saveLocalQuoteReferenceData(itemToSave);
    loadCatalog();
    handleResetForm();

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleDeleteService = (id: string) => {
    if (confirm('Are you sure you want to delete this quote reference item?')) {
      deleteLocalQuoteReferenceData(id);
      loadCatalog();
    }
  };

  const handleResetToDefaults = () => {
    if (!profile) return;
    const defaults = DEFAULT_SERVICE_CATALOG[profile.trade_type] || DEFAULT_SERVICE_CATALOG.Plumbing;
    localStorage.setItem('tradeflow_quote_data', JSON.stringify(defaults));
    loadCatalog();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Quote Data & AI Pricing Knowledge Base
            </h1>
            <span className="apple-pill bg-blue-50 text-blue-700 border border-blue-200">
              <Sparkles className="w-3 h-3 text-blue-500" />
              {profile?.trade_type}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Configure labor rates, material costs, and service rules used by Gemini AI to build instant quotes
          </p>
        </div>

        <button
          onClick={handleResetToDefaults}
          className="apple-btn-secondary text-xs px-3.5 py-2"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          Load Trade Default Templates
        </button>
      </div>

      {savedSuccess && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3 text-emerald-800 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Quote reference data successfully saved! Gemini AI will immediately use these updated rates for future estimates.</span>
        </div>
      )}

      {/* Upload Rate Card / PDF / Excel Section */}
      <div className="apple-card p-6 bg-gradient-to-r from-blue-50/60 via-slate-50 to-white border-blue-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-blue-600" />
              Upload Pricing Document / Rate Card (PDF or Excel)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload price lists, labor rate cards, or contractor estimate sheets (.pdf, .xlsx, .csv). Gemini AI reads these documents directly alongside your catalog!
            </p>
          </div>

          <label className="apple-btn-primary cursor-pointer text-xs px-4 py-2 shrink-0 flex items-center gap-1.5 shadow-sm">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            {uploading ? 'Reading File...' : 'Upload PDF / Excel Rate Card'}
            <input
              type="file"
              accept=".pdf,.xlsx,.xls,.csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {uploadMessage && (
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{uploadMessage}</span>
          </div>
        )}

        {/* Uploaded Documents List */}
        {uploadedDocs.length > 0 && (
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Uploaded Rate Card Knowledge Base ({uploadedDocs.length})
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {uploadedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between shadow-2xs hover:border-blue-300 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                      {doc.file_type === 'excel' ? (
                        <FileSpreadsheet className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate" title={doc.file_name}>
                        {doc.file_name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {doc.file_type.toUpperCase()} • Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={extractingId === doc.id}
                      onClick={() => handleAiExtractDocument(doc)}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-xl transition-all cursor-pointer"
                      title="Extract structured items into catalog via Gemini AI"
                    >
                      {extractingId === doc.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3 text-purple-600" />
                      )}
                      AI Extract Rates
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                      title="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input / Editor Form */}
        <div className="lg:col-span-6 apple-card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              {editingId ? 'Edit Service Rates & Pricing' : 'Add New Service Rate Template'}
            </h2>
            {editingId && (
              <button
                onClick={handleResetForm}
                className="text-xs text-slate-400 hover:text-slate-600 underline font-medium"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSaveService} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Service / Task Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Copper Pipe Leak Repair & Joint Solder"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Base Hourly Labor Rate (₹/hr) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  required
                  min={0}
                  step={50}
                  value={baseLaborRate}
                  onChange={(e) => setBaseLaborRate(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Material Costs List Builder */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Standard Material Costs</label>
              <div className="space-y-2 mb-3">
                {materials.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 text-xs"
                  >
                    <span className="font-medium text-slate-800">{m.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900">
                        ₹{m.unit_cost.toLocaleString('en-IN')} / {m.unit}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMaterial(m.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Material Row */}
              <div className="grid grid-cols-12 gap-2 bg-slate-100/70 p-2.5 rounded-2xl border border-slate-200/60">
                <input
                  type="text"
                  placeholder="Material name (e.g. Copper Fitting)"
                  value={matName}
                  onChange={(e) => setMatName(e.target.value)}
                  className="col-span-6 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Cost ₹"
                  value={matCost}
                  onChange={(e) => setMatCost(Number(e.target.value))}
                  className="col-span-3 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddMaterial}
                  className="col-span-3 bg-blue-600 text-white rounded-xl py-1.5 text-xs font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            </div>

            {/* Notes for AI */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-500" />
                Notes & Custom Estimation Guidelines for Gemini AI
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Always include 1.5 hours standard labor + pressure test fee for emergency after-hour calls."
                value={notesForAi}
                onChange={(e) => setNotesForAi(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <button type="submit" className="w-full apple-btn-primary py-3 text-xs rounded-2xl">
              <Save className="w-4 h-4" />
              {editingId ? 'Update Service Rate' : 'Save Service to AI Knowledge Base'}
            </button>
          </form>
        </div>

        {/* Right Column: Existing Quote Knowledge Base List */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Saved Service Pricing Catalog ({catalogItems.length})
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Used by Gemini for Quote Gen</span>
          </div>

          {catalogItems.length === 0 ? (
            <div className="apple-card p-8 text-center text-slate-400 space-y-3">
              <Info className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No Service Catalog Configured</p>
              <p className="text-xs text-slate-500">
                Click &quot;Load Trade Default Templates&quot; above to populate default rates for {profile?.trade_type}.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {catalogItems.map((item) => (
                <div
                  key={item.id}
                  className="apple-card p-5 space-y-3 hover:border-blue-300 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {item.service_name}
                      </h4>
                      <p className="text-xs font-semibold text-blue-700 mt-0.5">
                        Base Labor: ₹{item.base_labor_rate.toLocaleString('en-IN')} / hr
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditClick(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit Service"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteService(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete Service"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {item.notes_for_ai && (
                    <div className="bg-slate-50 p-2.5 rounded-xl text-[11px] text-slate-600 flex items-start gap-1.5 border border-slate-100">
                      <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                      <span>{item.notes_for_ai}</span>
                    </div>
                  )}

                  {item.material_costs && item.material_costs.length > 0 && (
                    <div className="pt-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Materials:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {item.material_costs.map((m) => (
                          <span
                            key={m.id}
                            className="bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded-full"
                          >
                            {m.name} (₹{m.unit_cost}/{m.unit})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
