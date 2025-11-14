
import React from 'react';
import type { FormState } from '../types.ts';
import { GenerateIcon } from './icons.tsx';

interface InputFormProps {
  formState: FormState;
  setFormState: React.Dispatch<React.SetStateAction<FormState>>;
  onSubmit: () => void;
  isGenerating: boolean;
  showExportButton?: boolean;
  onExport?: () => void;
  isExporting?: boolean;
}

export function InputForm({ formState, setFormState, onSubmit, isGenerating, showExportButton, onExport, isExporting }: InputFormProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-10 gap-x-6 gap-y-4 items-start">
      <div className="lg:col-span-2">
        <label htmlFor="title" className="block text-sm font-medium text-base-300 mb-2">
          Title / Theme
        </label>
        <textarea
          id="title"
          name="title"
          value={formState.title}
          onChange={handleChange}
          rows={2}
          placeholder="e.g., Autumn/Winter 2025"
          className="w-full bg-base-800 border border-base-700 rounded-md shadow-sm px-4 py-2 text-white focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition"
          required
        />
      </div>
      <div className="lg:col-span-3">
        <label htmlFor="keywords" className="block text-sm font-medium text-base-300 mb-2">
          Keywords / Vibes
        </label>
        <textarea
          id="keywords"
          name="keywords"
          value={formState.keywords}
          onChange={handleChange}
          rows={2}
          placeholder="e.g., structured tailoring, dark academia, wool"
          className="w-full bg-base-800 border border-base-700 rounded-md shadow-sm px-4 py-2 text-white focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition"
          required
        />
      </div>
      <div className="lg:col-span-3">
        <label htmlFor="audience" className="block text-sm font-medium text-base-300 mb-2">
          Target Audience
        </label>
        <textarea
          id="audience"
          name="audience"
          value={formState.audience}
          onChange={handleChange}
          rows={2}
          placeholder="e.g., High-fashion consumers, stylists"
          className="w-full bg-base-800 border border-base-700 rounded-md shadow-sm px-4 py-2 text-white focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition"
        />
      </div>
      <div className="lg:col-span-2 self-end flex flex-col gap-2">
        {showExportButton && onExport && (
          <button
            type="button"
            onClick={onExport}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white bg-green-600 rounded-md shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-900 focus:ring-green-700 transition-all duration-200 ease-in-out disabled:bg-base-700 disabled:cursor-not-allowed"
            aria-label="Export moodboard as PNG"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Exporting...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Export PNG
              </>
            )}
          </button>
        )}
        <button
          type="submit"
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold text-white bg-brand-primary rounded-md shadow-lg hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-900 focus:ring-brand-secondary transition-all duration-200 ease-in-out disabled:bg-base-700 disabled:cursor-not-allowed"
          aria-label="Generate moodboard"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Generating...
            </>
          ) : (
            <>
              <GenerateIcon />
              Generate
            </>
          )}
        </button>
      </div>
    </form>
  );
}
