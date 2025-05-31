'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, Mail, Headphones, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslations } from '@/i18n';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  company: string;
  industry: string;
  message: string;
}

interface FormState {
  isSubmitting: boolean;
  success: boolean;
  error: string | null;
}

export default function CallToAction() {
  const { t, isLoading } = useTranslations();

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    company: '',
    industry: '',
    message: ''
  });

  const [formState, setFormState] = useState<FormState>({
    isSubmitting: false,
    success: false,
    error: null
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    setFormState({ isSubmitting: true, success: false, error: null });

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setFormState({ isSubmitting: false, success: true, error: null });
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phoneNumber: '',
          company: '',
          industry: '',
          message: ''
        });
      } else {
        setFormState({ isSubmitting: false, success: false, error: result.error || 'Failed to submit form' });
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setFormState({ isSubmitting: false, success: false, error: 'Network error. Please try again.' });
    }
  };

  if (isLoading) {
    return (
      <section id="contact" className="py-20 bg-gradient-to-b from-background via-background to-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
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
    <section id="contact" className="py-20 bg-gradient-to-b from-background via-background to-secondary/20">
      <div className="container mx-auto px-4">
        {/* Main CTA Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {t('cta.title')}{' '}
            <span className="bg-gradient-to-r from-primary via-blue-600 to-violet-600 bg-clip-text text-transparent">{t('cta.titleHighlight')}</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            {t('cta.subtitle')}
          </p>
          
          {/* Primary CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-gray-800 via-blue-500 to-blue-600 hover:from-gray-700 hover:via-blue-600 hover:to-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-lg transition-all hover:scale-105 shadow-lg hover:shadow-xl border-0"
              asChild
            >
              <a href="/auth/register" className="flex items-center gap-2">
                {t('cta.buttons.getStarted')}
                <ArrowRight className="h-5 w-5" />
              </a>
            </Button>
            
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 via-violet-500 to-violet-700 hover:from-blue-700 hover:via-violet-600 hover:to-violet-800 text-white px-8 py-3 text-lg font-semibold rounded-lg transition-all hover:scale-105 shadow-lg hover:shadow-xl border-0"
              asChild
            >
              <a href="https://calendly.com/ariel-r08/free-online-ai-consultation" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                {t('cta.buttons.bookConsultation')}
              </a>
            </Button>
          </div>
        </div>

        {/* Value Proposition Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-card rounded-lg p-6 shadow-sm border">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-800 via-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 shadow-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">{t('cta.valueProps.discovery.title')}</h3>
            <p className="text-muted-foreground">
              {t('cta.valueProps.discovery.description')}
            </p>
          </div>
          
          <div className="bg-card rounded-lg p-6 shadow-sm border">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-violet-500 to-violet-600 rounded-lg flex items-center justify-center mb-4 shadow-lg">
              <ArrowRight className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">{t('cta.valueProps.strategy.title')}</h3>
            <p className="text-muted-foreground">
              {t('cta.valueProps.strategy.description')}
            </p>
          </div>
          
          <div className="bg-card rounded-lg p-6 shadow-sm border">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-600 via-violet-700 to-purple-600 rounded-lg flex items-center justify-center mb-4 shadow-lg">
              <Headphones className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">{t('cta.valueProps.support.title')}</h3>
            <p className="text-muted-foreground">
              {t('cta.valueProps.support.description')}
            </p>
          </div>
        </div>

        {/* Consultation Booking Section */}
        <div id="consultation" className="bg-card rounded-2xl p-8 md:p-12 shadow-lg border">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-6 text-foreground">
                {t('cta.consultation.title')}
              </h3>
              <p className="text-lg text-muted-foreground mb-6">
                {t('cta.consultation.description')}
              </p>
              <ul className="space-y-3 text-muted-foreground mb-8">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-gradient-to-r from-primary via-blue-600 to-violet-600 rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>{t('cta.consultation.benefits.opportunities')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-gradient-to-r from-primary via-blue-600 to-violet-600 rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>{t('cta.consultation.benefits.roi')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-gradient-to-r from-primary via-blue-600 to-violet-600 rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>{t('cta.consultation.benefits.roadmap')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-gradient-to-r from-primary via-blue-600 to-violet-600 rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>{t('cta.consultation.benefits.customTools')}</span>
                </li>
              </ul>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-gray-800 via-blue-500 to-blue-600 hover:from-gray-700 hover:via-blue-600 hover:to-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-lg transition-all hover:scale-105 shadow-lg hover:shadow-xl border-0"
                  asChild
                >
                  <a href="/auth/register">
                    {t('cta.consultation.buttons.getStarted')}
                  </a>
                </Button>
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 via-violet-500 to-violet-700 hover:from-blue-700 hover:via-violet-600 hover:to-violet-800 text-white px-8 py-3 text-lg font-semibold rounded-lg transition-all hover:scale-105 shadow-lg hover:shadow-xl border-0"
                  asChild
                >
                  <a href="https://calendly.com/ariel-r08/free-online-ai-consultation" target="_blank" rel="noopener noreferrer">
                    <Calendar className="h-5 w-5 mr-2" />
                    {t('cta.consultation.buttons.bookConsultation')}
                  </a>
                </Button>
              </div>
            </div>
            
            {/* Contact Form */}
            <div className="bg-background rounded-xl p-6 border">
              <h4 className="text-xl font-semibold mb-4 text-foreground">{t('cta.form.title')}</h4>
              
              {/* Success Message */}
              {formState.success && (
                <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 via-blue-100 to-violet-50 border border-blue-200 rounded-lg flex items-center gap-3 shadow-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <h5 className="font-semibold text-blue-800">{t('cta.form.success.title')}</h5>
                    <p className="text-sm text-blue-700">{t('cta.form.success.message')}</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {formState.error && (
                <div className="bg-gradient-to-br from-red-50 via-red-100 to-pink-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3 shadow-lg">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <div>
                    <h5 className="text-red-800 font-medium">{t('cta.form.error.title')}</h5>
                    <p className="text-red-600 text-sm">{formState.error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('cta.form.fields.firstName')} {t('common.required')}
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                      disabled={formState.isSubmitting}
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('cta.form.fields.lastName')} {t('common.required')}
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                      disabled={formState.isSubmitting}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1">
                    {t('cta.form.fields.email')} {t('common.required')}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                    disabled={formState.isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-muted-foreground mb-1">
                    {t('cta.form.fields.phoneNumber')} {t('common.required')}
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                    disabled={formState.isSubmitting}
                  />
                </div>
                
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-muted-foreground mb-1">
                    {t('cta.form.fields.company')}
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    disabled={formState.isSubmitting}
                  />
                </div>
                
                <div>
                  <label htmlFor="industry" className="block text-sm font-medium text-muted-foreground mb-1">
                    {t('cta.form.fields.industry')}
                  </label>
                  <select
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    disabled={formState.isSubmitting}
                  >
                    <option value="">{t('cta.form.industryOptions.select')}</option>
                    <option value="finance">{t('cta.form.industryOptions.finance')}</option>
                    <option value="marketing">{t('cta.form.industryOptions.marketing')}</option>
                    <option value="operations">{t('cta.form.industryOptions.operations')}</option>
                    <option value="hr">{t('cta.form.industryOptions.hr')}</option>
                    <option value="technology">{t('cta.form.industryOptions.technology')}</option>
                    <option value="healthcare">{t('cta.form.industryOptions.healthcare')}</option>
                    <option value="retail">{t('cta.form.industryOptions.retail')}</option>
                    <option value="manufacturing">{t('cta.form.industryOptions.manufacturing')}</option>
                    <option value="other">{t('cta.form.industryOptions.other')}</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-muted-foreground mb-1">
                    {t('cta.form.fields.message')} {t('common.required')}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    placeholder={t('cta.form.fields.messagePlaceholder')}
                    required
                    disabled={formState.isSubmitting}
                  ></textarea>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-gray-800 via-blue-500 to-blue-600 hover:from-gray-700 hover:via-blue-600 hover:to-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-lg transition-all hover:scale-105 shadow-lg hover:shadow-xl border-0"
                  disabled={formState.isSubmitting}
                >
                  {formState.isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t('cta.form.submitting')}
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      {t('cta.form.submitButton')}
                    </>
                  )}
                </Button>
              </form>
              
              <p className="text-xs text-muted-foreground mt-4 text-center">
                {t('cta.form.privacy')}
              </p>
            </div>
          </div>
        </div>

        {/* Final Encouragement Section */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-gray-800 via-blue-500 to-blue-600 rounded-2xl p-8 md:p-12 text-white">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Your AI Transformation Starts Here
            </h3>
            <p className="text-blue-100 text-lg mb-6 max-w-2xl mx-auto">
              Every successful AI implementation begins with understanding your unique business challenges and opportunities. 
              Our expert team specializes in creating custom automation solutions that transform operations across marketing, sales, and finance.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-violet-500 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <h4 className="text-lg font-semibold mb-2">Free Discovery</h4>
                <p className="text-blue-100 text-sm">
                  No commitment consultation to explore your automation opportunities
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <ArrowRight className="h-6 w-6 text-white" />
                </div>
                <h4 className="text-lg font-semibold mb-2">Custom Strategy</h4>
                <p className="text-blue-100 text-sm">
                  Tailored roadmap designed specifically for your business processes
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Headphones className="h-6 w-6 text-white" />
                </div>
                <h4 className="text-lg font-semibold mb-2">Expert Guidance</h4>
                <p className="text-blue-100 text-sm">
                  Ongoing support from implementation through optimization
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-blue-100 mb-6">
                Ready to discover how AI can transform your business operations?
              </p>
              <Button 
                size="lg" 
                className="bg-white text-gray-800 hover:bg-gray-100 px-8 py-3 text-lg font-semibold rounded-lg transition-all hover:scale-105 shadow-lg hover:shadow-xl"
                asChild
              >
                <a href="https://calendly.com/ariel-r08/free-online-ai-consultation" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  Schedule Your Free Consultation
                  <ArrowRight className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 