import React from 'react';
import { Brain, TrendingUp, Users, MessageSquare, FileText, DollarSign, UserCheck, Zap } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: Brain,
      title: 'Intelligent Operations',
      description: 'Transform your company knowledge into an AI-powered brain that provides instant answers and insights.',
      gradient: 'from-gray-800 via-blue-500 to-blue-600'
    },
    {
      icon: TrendingUp,
      title: 'Predictive Analytics',
      description: 'Leverage AI forecasting to optimize inventory, sales, and staffing with data-driven predictions.',
      gradient: 'from-blue-600 via-blue-500 to-violet-500'
    },
    {
      icon: Users,
      title: 'Lead Generation & Research',
      description: 'Automatically discover, research, and qualify prospects with comprehensive intelligence reports.',
      gradient: 'from-blue-500 via-violet-500 to-violet-600'
    },
    {
      icon: MessageSquare,
      title: 'Automated Communication',
      description: 'Scale personalized outreach, manage customer support, and maintain consistent brand messaging.',
      gradient: 'from-violet-500 via-violet-600 to-purple-600'
    },
    {
      icon: FileText,
      title: 'Document Automation',
      description: 'Generate contracts, invoices, and reports automatically while maintaining accuracy and compliance.',
      gradient: 'from-violet-600 via-purple-500 to-purple-600'
    },
    {
      icon: DollarSign,
      title: 'Financial Intelligence',
      description: 'Automate financial forecasting, reconciliation, and reporting for better business decisions.',
      gradient: 'from-purple-500 via-purple-600 to-violet-700'
    },
    {
      icon: UserCheck,
      title: 'Sales Optimization',
      description: 'Enhance sales performance with AI-powered training insights and prospect research.',
      gradient: 'from-blue-600 via-violet-500 to-violet-600'
    },
    {
      icon: Zap,
      title: 'Content Creation',
      description: 'Streamline marketing content production with AI-assisted research, writing, and scheduling.',
      gradient: 'from-gray-800 via-blue-500 to-violet-600'
    }
  ];

  return (
    <section id="features" className="py-12 sm:py-16 md:py-20 lg:py-24 xl:py-28 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-14 md:mb-16 lg:mb-20">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight">
            Increase your operational efficiency with an{' '}
            <span className="bg-gradient-to-r from-primary via-blue-600 to-violet-600 bg-clip-text text-transparent">
              AI-powered toolkit
            </span>
          </h2>
          <p className="mt-4 sm:mt-5 md:mt-6 text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 max-w-2xl sm:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto leading-relaxed">
            Transform your business operations across marketing, sales, and finance with custom AI automation solutions designed specifically for your unique processes and requirements.
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
              <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3 leading-tight">{feature.title}</h3>
              <p className="text-gray-600 text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Call-to-Action Section */}
        <div className="bg-gradient-to-r from-gray-800 via-blue-500 to-blue-600 rounded-xl sm:rounded-2xl lg:rounded-3xl p-6 sm:p-8 md:p-10 lg:p-12 xl:p-16 text-center shadow-xl">
          <div className="max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto">
            {/* Main CTA Heading */}
            <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-3 sm:mb-4 md:mb-5 lg:mb-6 leading-tight">
              Built for Your Business, Not One-Size-Fits-All
            </h3>
            
            {/* CTA Description */}
            <p className="text-blue-100 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl mb-6 sm:mb-8 md:mb-10 lg:mb-12 leading-relaxed max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto">
              Every automation solution is custom-built to match your specific business processes, industry requirements, and operational goals. No generic templates – just powerful AI tools designed around your unique workflow.
            </p>
            
            {/* Value Proposition Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-1 sm:mb-2 md:mb-3">Custom Built</div>
                <div className="text-blue-100 text-xs sm:text-sm md:text-base lg:text-lg">
                  Tailored to your specific business processes and requirements
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-1 sm:mb-2 md:mb-3">AI-Powered</div>
                <div className="text-blue-100 text-xs sm:text-sm md:text-base lg:text-lg">
                  Advanced AI and machine learning for intelligent automation
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 sm:col-span-2 lg:col-span-1">
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-1 sm:mb-2 md:mb-3">Scalable</div>
                <div className="text-blue-100 text-xs sm:text-sm md:text-base lg:text-lg">
                  Grows with your business from startup to enterprise
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