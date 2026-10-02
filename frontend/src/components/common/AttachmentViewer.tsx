import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Paperclip, Download, Loader2, AlertCircle } from 'lucide-react';
import { API_BASE } from '../../services/api';

interface AttachmentViewerProps {
  attachment: any;
  onClose: () => void;
}

export const AttachmentViewer: React.FC<AttachmentViewerProps> = ({ attachment, onClose }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    let currentBlobUrl: string | null = null;
    let isMounted = true;

    const fetchAttachment = async () => {
      if (!attachment) return;
      setLoading(true);
      setError('');
      try {
        const token = sessionStorage.getItem('cb_token');
        const res = await fetch(`${API_BASE}/complaints/attachments/${attachment.id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!res.ok) {
          throw new Error(`Failed to load attachment (${res.status})`);
        }
        const blob = await res.blob();
        if (isMounted) {
          currentBlobUrl = URL.createObjectURL(blob);
          setBlobUrl(currentBlobUrl);
        }
      } catch (e: any) {
        if (isMounted) setError(e.message || 'Unknown error occurred.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAttachment();

    return () => {
      isMounted = false;
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [attachment]);

  if (!attachment) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-4xl w-full flex flex-col shadow-2xl overflow-hidden h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Paperclip className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h3 className="text-sm font-bold text-slate-900 truncate" title={attachment.original_filename}>
                {attachment.original_filename}
              </h3>
              <p className="text-xs text-slate-500">
                {(attachment.file_size / 1024).toFixed(1)} KB • {attachment.mime_type}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {blobUrl && (
              <a
                href={blobUrl}
                download={attachment.original_filename}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-4 h-4" /> Save File
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-xl transition"
              title="Close (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 bg-slate-50/50 flex flex-col min-h-0 relative">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-600">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="text-sm font-bold">Loading attachment...</p>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 gap-3">
              <AlertCircle className="w-12 h-12 text-red-200" />
              <p className="text-base font-bold">Unable to preview attachment</p>
              <p className="text-sm font-medium">{error}</p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => { setLoading(true); setError(''); setBlobUrl(null); }} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-sm font-bold">Retry</button>
                <button onClick={onClose} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold">Close</button>
              </div>
            </div>
          ) : blobUrl ? (
            <div className="w-full h-full rounded-xl overflow-hidden border border-slate-200 bg-white shadow-inner flex items-center justify-center">
              {attachment.mime_type?.startsWith('image/') ? (
                <img 
                  src={blobUrl} 
                  alt={attachment.original_filename} 
                  className="max-w-full max-h-full object-contain"
                />
              ) : attachment.mime_type === 'application/pdf' ? (
                <object 
                  data={blobUrl} 
                  type="application/pdf" 
                  className="w-full h-full"
                >
                  <div className="flex flex-col items-center gap-3 p-8 text-slate-500 text-center">
                    <p className="text-sm font-bold">Your browser does not support embedded PDFs.</p>
                    <a href={blobUrl} download={attachment.original_filename} className="text-blue-600 hover:underline">Download instead</a>
                  </div>
                </object>
              ) : attachment.mime_type?.startsWith('video/') ? (
                <video controls src={blobUrl} className="max-w-full max-h-full" />
              ) : attachment.mime_type?.startsWith('text/') ? (
                <iframe src={blobUrl} className="w-full h-full bg-white" />
              ) : (
                <div className="flex flex-col items-center gap-4 text-slate-400 p-8 text-center max-w-sm">
                  <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center">
                    <Paperclip className="w-8 h-8 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-700">Preview Unavailable</p>
                    <p className="text-sm mt-1">This file format ({attachment.mime_type || 'unknown'}) cannot be previewed securely in the browser.</p>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
};
