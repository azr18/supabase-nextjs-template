import React from 'react';
import { Search, Target, Lightbulb, Rocket, Settings } from 'lucide-react';

const Process = () => {
  const processSteps = [
    {
      step: 1,
      title: "AI Discovery Session",
      description: "Identify opportunities to transform your business with AI, calculate ROI, prioritise use cases.",
      icon: Search,
      phase: "VALIDATE"
    },
    {
      step: 2,
      title: "AI Scoping Programme",
      description: "Build a robust AI strategy, predict and mitigate all possible risk factors, build a detailed roadmap.",
      icon: Target,
      phase: "VALIDATE"
    },
    {
      step: 3,
      title: "Proof of Concept (PoC)",
      description: "Validate that a solution will work by building the simplest possible version of your product.",
      icon: Lightbulb,
      phase: "AUTOMATE"
    },
    {
      step: 4,
      title: "Minimum Viable Product (MVP)",
      description: "Turn the PoC into the simplest version of a usable product that can be beta tested by external users.",
      icon: Rocket,
      phase: "AUTOMATE"
    },
    {
      step: 5,
      title: "Ongoing Maintenance",
      description: "Fully customised managed services agreement to maintain and enhance your product and help you keep up with the latest technology trends.",
      icon: Settings,
      phase: "OPTIMISE"
    }
  ];

  const getPhaseColor = (phase: string) => {
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

  return (
    <section id="process" className="py-12 sm:py-16 md:py-20 lg:py-24 xl:py-28 bg-gradient-to-b from-background via-secondary/20 to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-14 md:mb-16 lg:mb-20">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-4 sm:mb-5 md:mb-6 leading-tight">
            From Zero to{' '}
            <span className="bg-gradient-to-r from-primary via-blue-600 to-violet-600 bg-clip-text text-transparent">
              Hero
            </span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl sm:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto leading-relaxed">
            Our team of experts will guide you from AI opportunities to implementation.
          </p>
        </div>

        {/* Process Steps */}
        <div className="relative">
          {/* Mobile and Tablet Layout (Vertical) */}
          <div className="block lg:hidden space-y-8 sm:space-y-10 md:space-y-12">
            {processSteps.map((step, index) => (
              <div key={index} className="relative">
                {/* Mobile Layout */}
                <div className="flex items-start space-x-4 sm:space-x-6 md:space-x-8">
                  {/* Left Side - Step Circle and Phase */}
                  <div className="flex-shrink-0 text-center">
                    {/* Phase Label */}
                    <div className="mb-2 sm:mb-3">
                      <span className="text-xs sm:text-sm font-semibold text-muted-foreground tracking-wider uppercase">
                        {step.phase}
                      </span>
                    </div>
                    
                    {/* Step Circle */}
                    <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-r ${getPhaseColor(step.phase)} text-white shadow-lg`}>
                      <span className="text-lg sm:text-xl md:text-2xl font-bold">{step.step}</span>
                    </div>
                    
                    {/* Vertical Connector Line */}
                    {index < processSteps.length - 1 && (
                      <div className="w-0.5 h-16 sm:h-20 md:h-24 bg-gradient-to-b from-primary/50 to-violet-500/50 mx-auto mt-4 sm:mt-6"></div>
                    )}
                  </div>
                  
                  {/* Right Side - Content */}
                  <div className="flex-1 pt-2 sm:pt-3 md:pt-4">
                    {/* Icon */}
                    <div className="flex items-center mb-3 sm:mb-4">
                      <step.icon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary mr-3" />
                      <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground">{step.title}</h3>
                    </div>
                    
                    {/* Description */}
                    <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Layout (Horizontal) */}
          <div className="hidden lg:block">
            <div className="grid lg:grid-cols-5 gap-6 xl:gap-8">
              {processSteps.map((step, index) => (
                <div key={index} className="relative text-center group">
                  {/* Phase Label */}
                  <div className="mb-4 xl:mb-6">
                    <span className="text-xs xl:text-sm font-semibold text-muted-foreground tracking-wider uppercase">
                      {step.phase}
                    </span>
                  </div>
                  
                  {/* Step Circle */}
                  <div className={`inline-flex items-center justify-center w-16 h-16 xl:w-20 xl:h-20 rounded-full bg-gradient-to-r ${getPhaseColor(step.phase)} text-white mb-4 xl:mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-xl xl:text-2xl font-bold">{step.step}</span>
                  </div>
                  
                  {/* Icon */}
                  <div className="flex justify-center mb-4 xl:mb-6">
                    <step.icon className="h-8 w-8 xl:h-10 xl:w-10 text-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-lg xl:text-xl font-semibold text-foreground mb-3 xl:mb-4 leading-tight">{step.title}</h3>
                  <p className="text-sm xl:text-base text-muted-foreground leading-relaxed">{step.description}</p>
                  
                  {/* Horizontal Connector Line */}
                  {index < processSteps.length - 1 && (
                    <div className="absolute top-1/2 -right-3 xl:-right-4 transform translate-x-1/2 -translate-y-1/2 w-6 xl:w-8 h-0.5 bg-gradient-to-r from-primary/50 to-violet-500/50"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Implementation Timeline Section */}
        <div className="mt-16 sm:mt-20 md:mt-24 lg:mt-28 xl:mt-32">
          <div className="bg-gradient-to-r from-gray-800 via-blue-500 to-blue-600 rounded-xl sm:rounded-2xl lg:rounded-3xl p-6 sm:p-8 md:p-10 lg:p-12 xl:p-16 text-center shadow-xl">
            <div className="max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl mx-auto">
              {/* Timeline Heading */}
              <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-3 sm:mb-4 md:mb-5 lg:mb-6 leading-tight">
                Your AI Journey Timeline
              </h3>
              
              {/* Timeline Description */}
              <p className="text-blue-100 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl mb-6 sm:mb-8 md:mb-10 lg:mb-12 leading-relaxed">
                From initial consultation to full deployment, most AI solutions are delivered within 2-6 weeks.
              </p>
              
              {/* Timeline Phases */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                  <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-1 sm:mb-2 md:mb-3">Week 1</div>
                  <div className="text-blue-100 text-xs sm:text-sm md:text-base lg:text-lg">
                    Discovery & Planning Phase
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                  <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-1 sm:mb-2 md:mb-3">2-4 Weeks</div>
                  <div className="text-blue-100 text-xs sm:text-sm md:text-base lg:text-lg">
                    Development & Testing
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 sm:col-span-2 lg:col-span-1">
                  <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-1 sm:mb-2 md:mb-3">Ongoing</div>
                  <div className="text-blue-100 text-xs sm:text-sm md:text-base lg:text-lg">
                    Support & Enhancement
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