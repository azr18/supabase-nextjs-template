'use client';

import React from 'react';
import { Search, Target, FlaskConical, Code, Settings } from 'lucide-react';
import { useTranslations } from '@/i18n';

const Process = () => {
  const { t, isLoading } = useTranslations();

  const processSteps = [
    {
      step: 1,
      titleKey: "process.steps.discovery.title",
      descriptionKey: "process.steps.discovery.description",
      icon: Search, // Discovery - magnifying glass makes sense
      phaseKey: "process.steps.discovery.phase"
    },
    {
      step: 2,
      titleKey: "process.steps.scoping.title",
      descriptionKey: "process.steps.scoping.description",
      icon: Target, // Strategy/Scoping - target for goal setting
      phaseKey: "process.steps.scoping.phase"
    },
    {
      step: 3,
      titleKey: "process.steps.poc.title",
      descriptionKey: "process.steps.poc.description",
      icon: FlaskConical, // Proof of Concept - lab flask for testing
      phaseKey: "process.steps.poc.phase"
    },
    {
      step: 4,
      titleKey: "process.steps.mvp.title",
      descriptionKey: "process.steps.mvp.description",
      icon: Code, // MVP Development - code icon for building
      phaseKey: "process.steps.mvp.phase"
    },
    {
      step: 5,
      titleKey: "process.steps.maintenance.title",
      descriptionKey: "process.steps.maintenance.description",
      icon: Settings, // Ongoing Maintenance - settings gear
      phaseKey: "process.steps.maintenance.phase"
    }
  ];

  const getPhaseColor = (phaseKey: string) => {
    const phase = t(phaseKey);
    switch (phase) {
      case "VALIDATE":
        return "from-blue-600 via-blue-500 to-violet-500";
      case "AUTOMATE":
        return "from-blue-500 via-violet-500 to-violet-600";
      case "OPTIMISE":
        return "from-violet-500 via-violet-600 to-purple-600";
      default:
        return "from-gray-800 via-blue-500 to-blue-600";
    }
  };

  if (isLoading) {
    return (
      <section id="process" className="py-12 sm:py-16 md:py-20 lg:py-24 xl:py-28 bg-gradient-to-b from-background via-secondary/20 to-background">
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
    <section id="process" className="py-12 sm:py-16 md:py-20 lg:py-24 xl:py-28 bg-gradient-to-b from-background via-secondary/20 to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Section Header */}
        <div className="text-center mb-16 sm:mb-20 md:mb-24 lg:mb-28">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-4 sm:mb-5 md:mb-6 leading-tight">
            {t('process.title')}{' '}
            <span className="bg-gradient-to-r from-primary via-blue-600 to-violet-600 bg-clip-text text-transparent">
              {t('process.titleHighlight')}
            </span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl sm:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto leading-relaxed">
            {t('process.subtitle')}
          </p>
        </div>

        {/* Process Steps */}
        <div className="relative mb-16 sm:mb-20 md:mb-24 lg:mb-28">
          {/* Mobile and Tablet Layout (Vertical) */}
          <div className="block lg:hidden space-y-8 sm:space-y-12 md:space-y-16">
            {processSteps.map((step, index) => (
              <div key={index} className="relative">
                <div className="flex items-start space-x-6 sm:space-x-8">
                  {/* Left Side - Step Number and Phase */}
                  <div className="flex-shrink-0 text-center">
                    {/* Phase Badge */}
                    <div className="mb-4">
                      <span className={`inline-block px-3 py-1 text-xs font-semibold tracking-wider uppercase rounded-full bg-gradient-to-r ${getPhaseColor(step.phaseKey)} text-white shadow-lg`}>
                        {t(step.phaseKey)}
                      </span>
                    </div>
                    
                    {/* Step Number Box - Inspired by brainpool.ai */}
                    <div className="relative">
                      <div className={`inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${getPhaseColor(step.phaseKey)} text-white shadow-xl border-4 border-white transform transition-all duration-300 hover:scale-110 hover:rotate-3`}>
                        <span className="text-2xl sm:text-3xl font-bold">{step.step}</span>
                      </div>
                      {/* Decorative glow */}
                      <div className={`absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${getPhaseColor(step.phaseKey)} opacity-20 blur-xl`}></div>
                    </div>
                    
                    {/* Vertical Connector */}
                    {index < processSteps.length - 1 && (
                      <div className="w-1 h-20 sm:h-24 bg-gradient-to-b from-primary/30 via-violet-500/30 to-transparent mx-auto mt-6 rounded-full"></div>
                    )}
                  </div>
                  
                  {/* Right Side - Content */}
                  <div className="flex-1 pt-4">
                    {/* Icon and Title */}
                    <div className="flex items-center mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${getPhaseColor(step.phaseKey)} text-white shadow-lg mr-4`}>
                        <step.icon className="h-6 w-6 sm:h-7 sm:w-7" />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">{t(step.titleKey)}</h3>
                    </div>
                    
                    {/* Description */}
                    <p className="text-base sm:text-lg text-muted-foreground leading-relaxed pl-1">
                      {t(step.descriptionKey)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Layout (Horizontal) - Inspired by brainpool.ai */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Background flow line */}
              <div className="absolute top-20 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-violet-200 to-purple-200 rounded-full opacity-30"></div>
              
              <div className="grid lg:grid-cols-5 gap-8 xl:gap-12">
                {processSteps.map((step, index) => (
                  <div key={index} className="relative group">
                    {/* Phase Badge */}
                    <div className="text-center mb-6">
                      <span className={`inline-block px-4 py-2 text-sm font-semibold tracking-wider uppercase rounded-full bg-gradient-to-r ${getPhaseColor(step.phaseKey)} text-white shadow-lg`}>
                        {t(step.phaseKey)}
                      </span>
                    </div>
                    
                    {/* Step Number Box - Modern brainpool.ai inspired design */}
                    <div className="flex justify-center mb-6">
                      <div className="relative">
                        <div className={`inline-flex items-center justify-center w-20 h-20 xl:w-24 xl:h-24 rounded-2xl bg-gradient-to-br ${getPhaseColor(step.phaseKey)} text-white shadow-2xl border-4 border-white transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-3xl`}>
                          <span className="text-2xl xl:text-3xl font-bold">{step.step}</span>
                        </div>
                        {/* Enhanced glow effect */}
                        <div className={`absolute inset-0 w-20 h-20 xl:w-24 xl:h-24 rounded-2xl bg-gradient-to-br ${getPhaseColor(step.phaseKey)} opacity-20 blur-2xl group-hover:opacity-40 transition-opacity duration-500`}></div>
                      </div>
                    </div>
                    
                    {/* Icon in styled container */}
                    <div className="flex justify-center mb-6">
                      <div className={`p-4 rounded-xl bg-gradient-to-br ${getPhaseColor(step.phaseKey)} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <step.icon className="h-8 w-8 xl:h-10 xl:w-10" />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="text-center">
                      <h3 className="text-xl xl:text-2xl font-bold text-foreground mb-4 leading-tight group-hover:text-primary transition-colors duration-300">
                        {t(step.titleKey)}
                      </h3>
                      <p className="text-sm xl:text-base text-muted-foreground leading-relaxed">
                        {t(step.descriptionKey)}
                      </p>
                    </div>
                    
                    {/* Enhanced Connector Arrow */}
                    {index < processSteps.length - 1 && (
                      <div className="absolute top-20 -right-4 xl:-right-6 transform translate-x-1/2 -translate-y-1/2">
                        <div className="flex items-center">
                          <div className="w-8 xl:w-12 h-1 bg-gradient-to-r from-primary/50 to-violet-500/50 rounded-full"></div>
                          <div className="w-0 h-0 border-l-4 border-l-violet-400 border-t-2 border-b-2 border-t-transparent border-b-transparent ml-1"></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Implementation Timeline Section - Enhanced Design */}
        <div className="relative">
          <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-violet-900 rounded-3xl p-8 sm:p-12 md:p-16 lg:p-20 text-center shadow-2xl border border-white/10 backdrop-blur-sm">
            {/* Decorative background elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-violet-600/10 to-purple-600/10 rounded-3xl"></div>
            <div className="absolute top-0 left-0 w-full h-full opacity-40" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%239C92AC\" fill-opacity=\"0.05\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"1\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"}}></div>
            
            <div className="relative max-w-4xl mx-auto">
              {/* Timeline Heading */}
              <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight">
                {t('process.timeline.title')}
              </h3>
              
              {/* Timeline Description */}
              <p className="text-blue-100 text-lg sm:text-xl md:text-2xl mb-8 sm:mb-12 leading-relaxed max-w-3xl mx-auto">
                {t('process.timeline.description')}
              </p>
              
              {/* Timeline Phases - Enhanced Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl group">
                  <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 group-hover:text-blue-200 transition-colors duration-300">
                    {t('process.timeline.phases.week1.title')}
                  </div>
                  <div className="text-blue-100 text-base sm:text-lg leading-relaxed">
                    {t('process.timeline.phases.week1.description')}
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl group">
                  <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 group-hover:text-violet-200 transition-colors duration-300">
                    {t('process.timeline.phases.weeks24.title')}
                  </div>
                  <div className="text-blue-100 text-base sm:text-lg leading-relaxed">
                    {t('process.timeline.phases.weeks24.description')}
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl group sm:col-span-2 lg:col-span-1">
                  <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 group-hover:text-purple-200 transition-colors duration-300">
                    {t('process.timeline.phases.ongoing.title')}
                  </div>
                  <div className="text-blue-100 text-base sm:text-lg leading-relaxed">
                    {t('process.timeline.phases.ongoing.description')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Process; 