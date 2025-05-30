'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { defaultLocale, type Locale } from './config';
import { getMessages } from './messages';

interface Messages {
  [key: string]: any;
}

interface TranslationContextType {
  t: (key: string, fallback?: string) => string;
  locale: Locale;
  changeLocale: (newLocale: Locale) => Promise<void>;
  isLoading: boolean;
  messages: Messages;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

interface TranslationProviderProps {
  children: ReactNode;
}

export function TranslationProvider({ children }: TranslationProviderProps) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [messages, setMessages] = useState<Messages>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadInitialMessages = async () => {
      console.log('TranslationProvider: Loading initial messages'); // Debug log
      setIsLoading(true);
      try {
        // Only detect browser language on first load, don't override user selection
        const savedLocale = localStorage.getItem('selected-locale') as Locale;
        let initialLocale = defaultLocale;
        
        if (savedLocale && ['en', 'he', 'es', 'fr'].includes(savedLocale)) {
          initialLocale = savedLocale;
          console.log('TranslationProvider: Using saved locale:', savedLocale); // Debug log
        } else {
          // Detect browser language only if no saved preference
          const browserLang = navigator.language.split('-')[0] as Locale;
          const supportedLocales: Locale[] = ['en', 'he', 'es', 'fr'];
          initialLocale = supportedLocales.includes(browserLang) ? browserLang : defaultLocale;
          console.log('TranslationProvider: Browser language detected:', browserLang, 'Using locale:', initialLocale); // Debug log
        }
        
        setLocale(initialLocale);
        
        // Load messages for the initial locale
        const loadedMessages = await getMessages(initialLocale);
        console.log('TranslationProvider: Loaded messages for', initialLocale, ':', loadedMessages); // Debug log
        setMessages(loadedMessages);
      } catch (error) {
        console.error('TranslationProvider: Failed to load initial translations:', error);
        // Fallback to default locale
        try {
          const fallbackMessages = await getMessages(defaultLocale);
          console.log('TranslationProvider: Loaded fallback messages:', fallbackMessages); // Debug log
          setMessages(fallbackMessages);
        } catch (fallbackError) {
          console.error('TranslationProvider: Failed to load fallback translations:', fallbackError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialMessages();
  }, []);

  const t = (key: string, fallback?: string): string => {
    const keys = key.split('.');
    let value = messages;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.log(`TranslationProvider: Translation key "${key}" not found, using fallback:`, fallback || key); // Debug log
        return fallback || key;
      }
    }
    
    const result = typeof value === 'string' ? value : fallback || key;
    return result;
  };

  const changeLocale = async (newLocale: Locale) => {
    console.log('TranslationProvider: Starting locale change from', locale, 'to', newLocale); // Debug log
    setIsLoading(true);
    try {
      const newMessages = await getMessages(newLocale);
      console.log('TranslationProvider: Loaded new messages for', newLocale, ':', newMessages); // Debug log
      setMessages(newMessages);
      setLocale(newLocale);
      
      // Save the user's language preference
      localStorage.setItem('selected-locale', newLocale);
      console.log('TranslationProvider: Locale change completed. New locale:', newLocale); // Debug log
    } catch (error) {
      console.error('TranslationProvider: Failed to change locale:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: TranslationContextType = {
    t,
    locale,
    changeLocale,
    isLoading,
    messages
  };

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslations(): TranslationContextType {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslations must be used within a TranslationProvider');
  }
  return context;
} 