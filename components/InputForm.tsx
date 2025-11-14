
import React from 'react';
import type { FormState } from '../types.ts';
import { GenerateIcon } from './icons.tsx';

interface InputFormProps {
  formState: FormState;
  setFormState: React.Dispatch<React.SetStateAction<FormState>>;
  onSubmit: () => void;
  isGenerating: boolean;
}

export function InputForm({ formState, setFormState, onSubmit, isGenerating }: InputFormProps) {
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
      <div className="lg:col-span-2 self-end">
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
