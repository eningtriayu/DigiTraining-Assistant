/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BookOpenCheck,
  FileText,
  Copy,
  Check,
  Calendar,
  Layers,
  CheckSquare,
  UploadCloud,
} from 'lucide-react';
import { STANDARD_TEMPLATES } from '../data/mockTemplates';
import { copyToClipboard } from '../utils/exportUtils';
import { ReferenceTemplate } from '../types';

export const TemplatesView: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<ReferenceTemplate>(STANDARD_TEMPLATES[0]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (tpl: ReferenceTemplate) => {
    const ok = await copyToClipboard(tpl.sampleContent);
    if (ok) {
      setCopiedId(tpl.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h2 className="text-xl font-bold text-[#202533]">Referensi & Format Template</h2>
        <p className="text-xs text-[#7B8190]">
          Format baku kurikulum, struktur rundown, dan instrumen asesmen resmi BLSDM Komdigi Surabaya.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Template Cards */}
        <div className="space-y-3 lg:col-span-1">
          {STANDARD_TEMPLATES.map((tpl) => {
            const isSelected = selectedTemplate.id === tpl.id;
            return (
              <div
                key={tpl.id}
                onClick={() => setSelectedTemplate(tpl)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white border-[#6C5CE7] shadow-sm ring-2 ring-[#6C5CE7]/15'
                    : 'bg-white border-[#E7E9F0] hover:border-[#6C5CE7]/40 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#F5F6FA] text-[#7B8190]">
                    {tpl.category}
                  </span>
                  <span className="text-[10px] text-[#7B8190]">{tpl.updatedAt}</span>
                </div>
                <h3 className="text-sm font-bold text-[#202533] mb-1.5 leading-snug">
                  {tpl.title}
                </h3>
                <p className="text-xs text-[#7B8190] line-clamp-2 leading-relaxed">
                  {tpl.description}
                </p>
              </div>
            );
          })}

          {/* Upload Custom Template Box */}
          <div className="p-5 rounded-2xl border-2 border-dashed border-[#E7E9F0] bg-[#F5F6FA]/50 text-center space-y-2">
            <UploadCloud className="w-8 h-8 text-[#7B8190] mx-auto" />
            <div className="text-xs font-bold text-[#202533]">Tambah Template Sendiri</div>
            <p className="text-[11px] text-[#7B8190]">
              Unggah format khusus (.txt atau .docx) untuk dijadikan acuan prompt
            </p>
            <label className="inline-block mt-1 px-3 py-1.5 bg-white border border-[#E7E9F0] rounded-lg text-xs font-semibold text-[#6C5CE7] hover:bg-slate-50 cursor-pointer">
              <span>Pilih File</span>
              <input type="file" className="hidden" accept=".txt,.docx,.pdf" />
            </label>
          </div>
        </div>

        {/* Right: Template Details & Preview */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E7E9F0] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E7E9F0] pb-4 mb-4">
              <div>
                <span className="text-[10px] font-bold text-[#6C5CE7] uppercase tracking-wider">
                  Kategori: {selectedTemplate.category}
                </span>
                <h3 className="text-base font-bold text-[#202533] mt-0.5">
                  {selectedTemplate.title}
                </h3>
                <p className="text-xs text-[#7B8190] mt-0.5">
                  Sumber Acuan: {selectedTemplate.source}
                </p>
              </div>

              <button
                onClick={() => handleCopy(selectedTemplate)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-[#6C5CE7] hover:bg-purple-100 text-xs font-semibold rounded-lg border border-[#6C5CE7]/30 transition-colors cursor-pointer"
              >
                {copiedId === selectedTemplate.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#35A875]" />
                    <span className="text-[#35A875]">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Struktur</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-[#202533] uppercase tracking-wider mb-1.5">
                  Deskripsi Template:
                </h4>
                <p className="text-xs text-[#4A5568] leading-relaxed">
                  {selectedTemplate.description}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[#202533] uppercase tracking-wider mb-2">
                  Struktur & Cuplikan Format Standar:
                </h4>
                <div className="p-4 bg-[#F5F6FA] rounded-xl border border-[#E7E9F0] font-mono text-xs text-[#202533] whitespace-pre-wrap leading-relaxed max-h-[460px] overflow-y-auto">
                  {selectedTemplate.sampleContent}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
