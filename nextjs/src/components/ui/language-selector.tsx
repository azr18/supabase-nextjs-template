'use client';

import React, { useState } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { useTranslations, type Locale } from '@/i18n';

const languages: Record<Locale, { name: string; flag: string }> = {
  en: { name: 'English', flag: '🇺🇸' },
  he: { name: 'עברית', flag: '🇮🇱' },
  es: { name: 'Español', flag: '🇪🇸' },
  fr: { name: 'Français', flag: '🇫🇷' }
};

export default function LanguageSelector() {
  const { locale, changeLocale, isLoading } = useTranslations();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = async (newLocale: Locale) => {
    console.log('LanguageSelector: Changing language to:', newLocale); // Debug log
    setIsOpen(false);
    if (newLocale !== locale) {
      try {
        await changeLocale(newLocale);
        console.log('LanguageSelector: Language changed successfully to:', newLocale); // Debug log
      } catch (error) {
        console.error('LanguageSelector: Failed to change language:', error);
      }
    }
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('LanguageSelector: Toggle dropdown clicked, current state:', isOpen); // Debug log
    setIsOpen(!isOpen);
  };

  const currentLanguage = languages[locale as Locale];

  return (
    <div className="relative">
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[60]" 
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Language Selector Button */}
      <button
        onClick={toggleDropdown}
        disabled={isLoading}
        className="relative z-[70] flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-200 rounded-md hover:border-gray-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Globe className="h-4 w-4" />
        <span className="flex items-center gap-2">
          <span>{currentLanguage.flag}</span>
          <span className="hidden sm:inline">{currentLanguage.name}</span>
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-[70] w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1">
          {(Object.entries(languages) as [Locale, { name: string; flag: string }][]).map(([lang, { name, flag }]) => (
            <button
              key={lang}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleLanguageChange(lang);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors duration-150 ${
                locale === lang ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
            >
              <span className="text-lg">{flag}</span>
              <span>{name}</span>
              {locale === lang && (
                <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full" />
              )}
            </button>
          ))}
        </div>
      )}
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-md z-[80]">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
} 