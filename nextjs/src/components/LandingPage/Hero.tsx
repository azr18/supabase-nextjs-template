'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { useTranslations } from '@/i18n'

export default function Hero() {
  const { t, isLoading } = useTranslations();

  if (isLoading) {
    return (
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-secondary/20">
        <div className="relative mx-auto max-w-7xl px-4 pt-8 pb-12 sm:px-6 sm:pt-12 sm:pb-16 md:pt-16 md:pb-20 lg:px-8 lg:pt-20 lg:pb-24 xl:pt-24 xl:pb-28">
          <div className="mx-auto max-w-4xl text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4 sm:h-12 md:h-16"></div>
              <div className="h-6 bg-gray-200 rounded mb-4 sm:h-8"></div>
              <div className="h-4 bg-gray-200 rounded mb-8 sm:h-6"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-secondary/20">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px] sm:bg-[size:40px_40px] lg:bg-[size:50px_50px]" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
      
      {/* Main Content */}
      <div className="relative mx-auto max-w-7xl px-4 pt-8 pb-12 sm:px-6 sm:pt-12 sm:pb-16 md:pt-16 md:pb-20 lg:px-8 lg:pt-20 lg:pb-24 xl:pt-24 xl:pb-28">
        <div className="mx-auto max-w-4xl text-center">
          {/* Main Headline */}
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-tight sm:leading-tight md:leading-tight lg:leading-tight xl:leading-tight">
            {t('hero.title')}{' '}
            <span className="bg-gradient-to-r from-primary via-blue-600 to-violet-600 bg-clip-text text-transparent">
              {t('hero.titleHighlight')}
            </span>
          </h1>

          {/* Subheadline */}
          <h2 className="mt-3 text-lg text-muted-foreground sm:mt-4 sm:text-xl md:text-xl lg:text-2xl xl:text-2xl font-medium">
            {t('hero.subtitle')}
          </h2>

          {/* Description */}
          <p className="mt-4 text-base leading-7 text-muted-foreground max-w-2xl mx-auto sm:mt-6 sm:text-lg sm:leading-8 sm:max-w-3xl md:max-w-3xl lg:max-w-3xl xl:max-w-4xl">
            {t('hero.description')}
            <span className="font-semibold text-foreground"> {t('hero.descriptionHighlight')}</span>
          </p>

          {/* Key Value Points */}
          <div className="mt-6 grid grid-cols-1 gap-6 max-w-2xl mx-auto sm:mt-8 sm:gap-8 sm:max-w-3xl md:grid-cols-3 md:gap-6 lg:gap-8 xl:gap-10">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gray-800 via-blue-500 to-blue-600 mb-3 shadow-lg sm:h-14 sm:w-14 sm:rounded-2xl sm:mb-4 lg:h-16 lg:w-16">
                <svg className="h-6 w-6 text-white sm:h-7 sm:w-7 lg:h-8 lg:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  <circle cx="12" cy="10" r="3" fill="currentColor" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-foreground sm:text-base">{t('hero.valueProps.customBuilt.title')}</h3>
              <p className="text-xs text-muted-foreground mt-1 sm:text-sm">
                {t('hero.valueProps.customBuilt.description')}
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-violet-500 to-violet-600 mb-3 shadow-lg sm:h-14 sm:w-14 sm:rounded-2xl sm:mb-4 lg:h-16 lg:w-16">
                <svg className="h-6 w-6 text-white sm:h-7 sm:w-7 lg:h-8 lg:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" fill="none" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-foreground sm:text-base">{t('hero.valueProps.dataControl.title')}</h3>
              <p className="text-xs text-muted-foreground mt-1 sm:text-sm">
                {t('hero.valueProps.dataControl.description')}
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center md:col-span-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-violet-700 to-purple-600 mb-3 shadow-lg sm:h-14 sm:w-14 sm:rounded-2xl sm:mb-4 lg:h-16 lg:w-16">
                <svg className="h-6 w-6 text-white sm:h-7 sm:w-7 lg:h-8 lg:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.3" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-foreground sm:text-base">{t('hero.valueProps.rapidImplementation.title')}</h3>
              <p className="text-xs text-muted-foreground mt-1 sm:text-sm">
                {t('hero.valueProps.rapidImplementation.description')}
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-6 flex flex-col gap-3 justify-center items-center sm:mt-8 sm:gap-4 md:flex-row lg:gap-6">
            <Link href="/auth/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full bg-gradient-to-r from-gray-800 via-blue-500 to-blue-600 hover:from-gray-700 hover:via-blue-600 hover:to-blue-700 text-white px-6 py-2.5 text-base font-semibold rounded-lg transition-all hover:scale-105 shadow-lg hover:shadow-xl border-0 sm:w-auto sm:px-8 sm:py-3 sm:text-lg lg:px-10 lg:py-3.5">
                {t('hero.cta.getStarted')}
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            
            <Link href="https://calendly.com/ariel-r08/free-online-ai-consultation" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
              <Button size="lg" className="w-full bg-gradient-to-r from-blue-600 via-violet-500 to-violet-700 hover:from-blue-700 hover:via-violet-600 hover:to-violet-800 text-white px-6 py-2.5 text-base font-semibold rounded-lg transition-all hover:scale-105 shadow-lg hover:shadow-xl border-0 sm:w-auto sm:px-8 sm:py-3 sm:text-lg lg:px-10 lg:py-3.5">
                {t('hero.cta.bookConsultation')}
              </Button>
            </Link>
          </div>

          {/* Trust Signal */}
          <div className="mt-8 sm:mt-10 lg:mt-12">
            <p className="text-xs font-medium text-muted-foreground mb-3 sm:text-sm sm:mb-4">
              {t('hero.trustSignal.text')}
            </p>
            
            {/* Business Process Areas */}
            <div className="flex flex-wrap justify-center gap-2 text-xs font-medium text-muted-foreground sm:gap-3 sm:text-xs lg:gap-4">
              <span className="bg-secondary/30 px-2 py-1 rounded-full sm:px-3">{t('hero.trustSignal.areas.marketing')}</span>
              <span className="bg-secondary/30 px-2 py-1 rounded-full sm:px-3">{t('hero.trustSignal.areas.sales')}</span>
              <span className="bg-secondary/30 px-2 py-1 rounded-full sm:px-3">{t('hero.trustSignal.areas.operations')}</span>
              <span className="bg-secondary/30 px-2 py-1 rounded-full sm:px-3">{t('hero.trustSignal.areas.financial')}</span>
              <span className="bg-secondary/30 px-2 py-1 rounded-full sm:px-3">{t('hero.trustSignal.areas.support')}</span>
              <span className="bg-secondary/30 px-2 py-1 rounded-full sm:px-3">{t('hero.trustSignal.areas.documents')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent sm:h-20 lg:h-24" />
    </section>
  )
} 