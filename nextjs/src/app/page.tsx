"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown } from 'lucide-react';
import AuthAwareButtons from '@/components/AuthAwareButtons';
import Hero from '@/components/LandingPage/Hero';
import Features from '@/components/LandingPage/Features';
import Process from '@/components/LandingPage/Process';
import CallToAction from '@/components/LandingPage/CallToAction';
import LanguageSelector from '@/components/ui/language-selector';
import { TranslationProvider, useTranslations } from '@/i18n';

function HomeContent() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t, isLoading } = useTranslations();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md z-50 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo/Brand */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center">
                <span className="text-2xl font-bold bg-gradient-to-r from-gray-800 via-blue-500 to-blue-600 bg-clip-text text-transparent hover:from-blue-600 hover:via-violet-500 hover:to-violet-700 transition-all duration-300">
                  My Agent
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              <Link 
                href="#features" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 relative group"
              >
                {t('navigation.features')}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-violet-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link 
                href="#process" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 relative group"
              >
                {t('navigation.process')}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-violet-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link 
                href="#contact" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 relative group"
              >
                {t('navigation.contact')}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-violet-500 group-hover:w-full transition-all duration-300"></span>
              </Link>

              <div className="flex items-center space-x-4 ml-6 pl-6 border-l border-gray-200">
                <LanguageSelector />
                <AuthAwareButtons variant="nav" />
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden flex items-center space-x-4">
              <LanguageSelector />
              <button
                onClick={toggleMobileMenu}
                className="text-gray-700 hover:text-blue-600 transition-colors duration-200 p-2"
                aria-expanded="false"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden">
            <div className="px-4 pt-4 pb-6 space-y-4 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-lg">
              <Link 
                href="#features" 
                className="block text-gray-700 hover:text-blue-600 font-medium py-2 transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('navigation.features')}
              </Link>
              <Link 
                href="#process" 
                className="block text-gray-700 hover:text-blue-600 font-medium py-2 transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('navigation.process')}
              </Link>
              <Link 
                href="#contact" 
                className="block text-gray-700 hover:text-blue-600 font-medium py-2 transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('navigation.contact')}
              </Link>
              
              <div className="pt-4 border-t border-gray-200">
                <AuthAwareButtons variant="nav" />
              </div>
            </div>
          </div>
        )}
      </nav>

      <Hero />

      <Features />

      <Process />

      <CallToAction />

      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">{t('footer.sections.product')}</h4>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="#features" className="text-gray-600 hover:text-gray-900">
                    {t('footer.links.features')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">{t('footer.sections.resources')}</h4>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/legal/privacy" className="text-gray-600 hover:text-gray-900">
                    {t('footer.links.privacy')}
                  </Link>
                </li>
                <li>
                  <Link href="/legal/terms" className="text-gray-600 hover:text-gray-900">
                    {t('footer.links.terms')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">{t('footer.sections.legal')}</h4>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/legal/privacy" className="text-gray-600 hover:text-gray-900">
                    {t('footer.links.privacy')}
                  </Link>
                </li>
                <li>
                  <Link href="/legal/terms" className="text-gray-600 hover:text-gray-900">
                    {t('footer.links.terms')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-600">
                © {new Date().getFullYear()} My Agent. {t('footer.copyright')}
              </p>
              <div className="mt-4 md:mt-0">
                <span className="text-lg font-bold bg-gradient-to-r from-gray-800 via-blue-500 to-blue-600 bg-clip-text text-transparent">
                  My Agent
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <TranslationProvider>
      <HomeContent />
    </TranslationProvider>
  );
}