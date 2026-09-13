import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Download } from 'lucide-react';
import { api } from '../../services/api';

export const AdminImportPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{created: number, updated: number} | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.importStudents(file);
      setResult({ created: res.created, updated: res.updated });
    } catch (e: any) {
      setError(e.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csv = 'email,full_name,roll_number\njohn@example.com,John Doe,CS101\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'student_import_template.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Bulk Import</h1>
        <p className="text-sm text-slate-500">Import student records via CSV.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-900">Upload CSV</h2>
          <button onClick={handleDownloadTemplate} className="flex items-center gap-2 text-indigo-600 font-bold text-xs hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition">
            <Download className="w-4 h-4" /> Download Template
          </button>
        </div>

        <div className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:bg-slate-50 transition cursor-pointer relative">
          <input type="file" accept=".csv" onChange={handleFile} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-700 font-bold mb-1">
            {file ? file.name : "Click or drag CSV file here"}
          </p>
          <p className="text-xs text-slate-500">
            CSV must contain email, full_name, and roll_number columns.
          </p>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-700">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              <p className="text-sm font-bold">Import Successful</p>
              <p className="text-xs">Created {result.created} new students. Updated {result.updated} existing students.</p>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleUpload} 
            disabled={!file || loading}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-md hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-2"
          >
            {loading ? <Upload className="w-4 h-4 animate-bounce" /> : <Upload className="w-4 h-4" />}
            {loading ? 'Importing...' : 'Start Import'}
          </button>
        </div>
      </div>
    </div>
  );
};
