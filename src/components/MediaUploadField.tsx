'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  Camera,
  Download,
  Sparkles
} from 'lucide-react';

interface MediaUploadFieldProps {
  label: string;
  sublabel?: string;
  accept?: string;
  multiple?: boolean;
  values: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  samplePresets?: { name: string; url: string }[];
}

export const MediaUploadField: React.FC<MediaUploadFieldProps> = ({
  label,
  sublabel,
  accept = 'image/*',
  multiple = false,
  values = [],
  onChange,
  maxFiles = 5,
  samplePresets = [],
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);

    const newUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        if (!multiple && i > 0) break;
        if (values.length + newUrls.length >= maxFiles) break;

        const file = files[i];

        // 10MB limit
        if (file.size > 10 * 1024 * 1024) {
          setError(`File ${file.name} is larger than 10MB.`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (data.success && data.url) {
          newUrls.push(data.url);
        } else {
          throw new Error(data.error || 'Upload failed');
        }
      }

      if (newUrls.length > 0) {
        if (multiple) {
          onChange([...values, ...newUrls]);
        } else {
          onChange(newUrls);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while uploading.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (index: number) => {
    const updated = [...values];
    updated.splice(index, 1);
    onChange(updated);
  };

  const handleAddPreset = (url: string) => {
    if (multiple) {
      if (!values.includes(url)) {
        onChange([...values, url]);
      }
    } else {
      onChange([url]);
    }
  };

  return (
    <div className="space-y-2.5 text-xs">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {label}
          </label>
          {sublabel && <p className="text-[11px] text-slate-500 mt-0.5">{sublabel}</p>}
        </div>

        {samplePresets.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400">Presets:</span>
            {samplePresets.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleAddPreset(preset.url)}
                className="px-2 py-0.5 rounded-md bg-[#fbf5ef] hover:bg-[#faece2] text-[#c28551] text-[10px] font-semibold border border-[#ead7c7] transition cursor-pointer"
              >
                + {preset.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Dropzone Card */}
      {(!multiple && values.length > 0) ? null : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          className={`p-4 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition cursor-pointer ${
            uploading
              ? 'border-[#c28551] bg-[#fbf5ef]/70 animate-pulse'
              : 'border-[#ead7c7] bg-[#fdfbf9] hover:bg-[#fbf5ef] hover:border-[#c28551]'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-white border border-[#ead7c7] shadow-xs flex items-center justify-center text-[#c28551] mb-2">
            {uploading ? (
              <div className="w-4 h-4 border-2 border-[#c28551] border-t-transparent rounded-full animate-spin" />
            ) : accept.includes('pdf') ? (
              <FileText className="w-5 h-5" />
            ) : (
              <UploadCloud className="w-5 h-5" />
            )}
          </div>

          <div className="font-semibold text-slate-800 text-xs">
            {uploading ? 'Uploading media to server...' : 'Click or drag files here to upload'}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Supports PNG, JPG, WEBP, HEIC{accept.includes('pdf') ? ', and PDF documents' : ''} (up to 10MB)
          </p>
        </div>
      )}

      {/* Uploaded Thumbnails / Attachments List */}
      {values.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
          {values.map((url, idx) => {
            const isPdf = url.toLowerCase().endsWith('.pdf');

            return (
              <div
                key={url + idx}
                className="relative group rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs p-1.5 flex flex-col items-center justify-between"
              >
                {/* Media Preview Box */}
                <div className="w-full h-24 rounded-lg bg-slate-50 overflow-hidden flex items-center justify-center relative">
                  {isPdf ? (
                    <div className="flex flex-col items-center text-slate-600 gap-1">
                      <FileText className="w-8 h-8 text-rose-500" />
                      <span className="text-[10px] font-mono font-bold uppercase">PDF Document</span>
                    </div>
                  ) : (
                    <img
                      src={url}
                      alt={`Upload ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                    />
                  )}

                  {/* Open in new tab overlay */}
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 text-white transition backdrop-blur-2xs"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-[10px] font-bold">View Full</span>
                  </a>
                </div>

                {/* Footer bar with Remove button */}
                <div className="w-full pt-1.5 flex items-center justify-between px-1 text-[10px]">
                  <span className="text-slate-500 font-mono truncate max-w-[90px]">
                    {url.split('/').pop()}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(idx);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="Remove file"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
