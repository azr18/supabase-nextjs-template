'use client';

import React from 'react';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  FileText, 
  DollarSign, 
  UserCheck, 
  Zap 
} from 'lucide-react';
import { useTranslations } from '@/i18n';

const Features = () => {
  const { t, isLoading } = useTranslations();

  const features = [
    {
      icon: Brain,
      titleKey: 'features.items.intelligentOps.title',
      descriptionKey: 'features.items.intelligentOps.description',
      gradient: 'from-gray-800 via-blue-500 to-blue-600'
    },
    {
      icon: TrendingUp,
      titleKey: 'features.items.predictiveAnalytics.title',
      descriptionKey: 'features.items.predictiveAnalytics.description',
      gradient: 'from-blue-600 via-blue-500 to-violet-500'
    },
    {
      icon: Users,
      titleKey: 'features.items.leadGeneration.title',
      descriptionKey: 'features.items.leadGeneration.description',
      gradient: 'from-blue-500 via-violet-500 to-violet-600'
    },
    {
      icon: MessageSquare,
      titleKey: 'features.items.automatedComm.title',
      descriptionKey: 'features.items.automatedComm.description',
      gradient: 'from-violet-500 via-violet-600 to-purple-600'
    },
    {
      icon: FileText,
      titleKey: 'features.items.documentAuto.title',
      descriptionKey: 'features.items.documentAuto.description',
      gradient: 'from-violet-600 via-purple-500 to-purple-600'
    },
    {
      icon: DollarSign,
      titleKey: 'features.items.financialIntel.title',
      descriptionKey: 'features.items.financialIntel.description',
      gradient: 'from-purple-500 via-purple-600 to-violet-700'
    },
    {
      icon: UserCheck,
      titleKey: 'features.items.salesOptimization.title',
      descriptionKey: 'features.items.salesOptimization.description',
      gradient: 'from-blue-600 via-violet-500 to-violet-600'
    },
    {
      icon: Zap,
      titleKey: 'features.items.contentCreation.title',
      descriptionKey: 'features.items.contentCreation.description',
      gradient: 'from-gray-800 via-blue-500 to-violet-600'
    }
  ];

  if (isLoading) {
    return (
      <section id="features" className="py-12 sm:py-16 md:py-20 lg:py-24 xl:py-28 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center mb-12 sm:mb-14 md:mb-16 lg:mb-20">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4 sm:h-12 md:h-16"></div>
              <div className="h-6 bg-gray-200 rounded mb-4 sm:h-8"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="features" className="py-12 sm:py-16 md:py-20 lg:py-24 xl:py-28 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-14 md:mb-16 lg:mb-20">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight">
            {t('features.title')}{' '}
            <span className="bg-gradient-to-r from-primary via-blue-600 to-violet-600 bg-clip-text text-transparent">
              {t('features.titleHighlight')}
            </span>
          </h2>
          <p className="mt-4 sm:mt-5 md:mt-6 text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 max-w-2xl sm:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto leading-relaxed">
            {t('features.subtitle')}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mb-12 sm:mb-14 md:mb-16 lg:mb-20">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-white p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-200 hover:scale-105"
            >
              {/* Icon Container */}
              <div className={`inline-flex p-2 sm:p-2.5 md:p-3 lg:p-3.5 xl:p-4 rounded-lg bg-gradient-to-br ${feature.gradient} mb-3 sm:mb-4 md:mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                <feature.icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 text-white" />
              </div>
              
              {/* Content */}
              <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3 leading-tight">{t(feature.titleKey)}</h3>
              <p className="text-gray-600 text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed">{t(feature.descriptionKey)}</p>
            </div>
          ))}
        </div>

        {/* Call-to-Action Section */}
        <div className="bg-gradient-to-r from-gray-800 via-blue-500 to-blue-600 rounded-xl sm:rounded-2xl lg:rounded-3xl p-6 sm:p-8 md:p-10 lg:p-12 xl:p-16 text-center shadow-xl">
          <div className="max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto">
            {/* Main CTA Heading */}
            <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-3 sm:mb-4 md:mb-5 lg:mb-6 leading-tight">
              {t('features.cta.title')}
            </h3>
            
            {/* CTA Description */}
            <p className="text-blue-100 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl mb-6 sm:mb-8 md:mb-10 lg:mb-12 leading-relaxed max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto">
              {t('features.cta.description')}
            </p>
            
            {/* Value Proposition Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-1 sm:mb-2 md:mb-3">{t('features.cta.valueProps.customBuilt.title')}</div>
                <div className="text-blue-100 text-xs sm:text-sm md:text-base lg:text-lg">
                  {t('features.cta.valueProps.customBuilt.description')}
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-1 sm:mb-2 md:mb-3">{t('features.cta.valueProps.aiPowered.title')}</div>
                <div className="text-blue-100 text-xs sm:text-sm md:text-base lg:text-lg">
                  {t('features.cta.valueProps.aiPowered.description')}
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 sm:col-span-2 lg:col-span-1">
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-1 sm:mb-2 md:mb-3">{t('features.cta.valueProps.scalable.title')}</div>
                <div className="text-blue-100 text-xs sm:text-sm md:text-base lg:text-lg">
                  {t('features.cta.valueProps.scalable.description')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features; 