'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, Mail, Headphones, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';

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

  return (
    <section id="contact" className="py-20 bg-gradient-to-b from-background via-background to-secondary/20">
      <div className="container mx-auto px-4">
        {/* Main CTA Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Business with{' '}
            <span className="bg-gradient-to-r from-primary via-blue-600 to-violet-600 bg-clip-text text-transparent">Custom AI Solutions?</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Join leading businesses that have streamlined their operations with custom-built AI automation tools. 
            Get started with a free consultation to discover how AI can revolutionize your workflow.
          </p>
          
          {/* Primary CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-gray-800 via-blue-500 to-blue-600 hover:from-gray-700 hover:via-blue-600 hover:to-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-lg transition-all hover:scale-105 shadow-lg hover:shadow-xl border-0"
              asChild
            >
              <a href="/auth/register" className="flex items-center gap-2">
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </a>
            </Button>
            
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 via-violet-500 to-violet-700 hover:from-blue-700 hover:via-violet-600 hover:to-violet-800 text-white px-8 py-3 text-lg font-semibold rounded-lg transition-all hover:scale-105 shadow-lg hover:shadow-xl border-0"
              asChild
            >
              <a href="https://calendly.com/ariel-r08/free-online-ai-consultation" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                Book a Free AI Consultation
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
            <h3 className="text-xl font-semibold mb-3 text-foreground">Free Discovery Session</h3>
            <p className="text-muted-foreground">
              30-minute consultation to identify AI opportunities in your business operations 
              and calculate potential ROI for automation solutions.
            </p>
          </div>
          
          <div className="bg-card rounded-lg p-6 shadow-sm border">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-violet-500 to-violet-600 rounded-lg flex items-center justify-center mb-4 shadow-lg">
              <ArrowRight className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">Custom AI Strategy</h3>
            <p className="text-muted-foreground">
              Tailored AI implementation roadmap designed specifically for your industry, 
              workflow requirements, and business objectives.
            </p>
          </div>
          
          <div className="bg-card rounded-lg p-6 shadow-sm border">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-600 via-violet-700 to-purple-600 rounded-lg flex items-center justify-center mb-4 shadow-lg">
              <Headphones className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">Ongoing Support</h3>
            <p className="text-muted-foreground">
              Dedicated support throughout implementation and beyond to ensure your 
              AI solutions continue delivering maximum value.
            </p>
          </div>
        </div>

        {/* Consultation Booking Section */}
        <div id="consultation" className="bg-card rounded-2xl p-8 md:p-12 shadow-lg border">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-6 text-foreground">
                Start Your AI Transformation Today
              </h3>
              <p className="text-lg text-muted-foreground mb-6">
                Book a free 30-minute consultation with our AI specialists to:
              </p>
              <ul className="space-y-3 text-muted-foreground mb-8">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-gradient-to-r from-primary via-blue-600 to-violet-600 rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Identify specific automation opportunities in your workflow</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-gradient-to-r from-primary via-blue-600 to-violet-600 rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Understand the ROI potential of custom AI solutions</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-gradient-to-r from-primary via-blue-600 to-violet-600 rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Get a preliminary roadmap for AI implementation</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-gradient-to-r from-primary via-blue-600 to-violet-600 rounded-full mt-2.5 flex-shrink-0"></div>
                  <span>Learn about custom tool development for your industry</span>
                </li>
              </ul>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-gray-800 via-blue-500 to-blue-600 hover:from-gray-700 hover:via-blue-600 hover:to-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-lg transition-all hover:scale-105 shadow-lg hover:shadow-xl border-0"
                  asChild
                >
                  <a href="/auth/register">
                    Get Started Free
                  </a>
                </Button>
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 via-violet-500 to-violet-700 hover:from-blue-700 hover:via-violet-600 hover:to-violet-800 text-white px-8 py-3 text-lg font-semibold rounded-lg transition-all hover:scale-105 shadow-lg hover:shadow-xl border-0"
                  asChild
                >
                  <a href="https://calendly.com/ariel-r08/free-online-ai-consultation" target="_blank" rel="noopener noreferrer">
                    <Calendar className="h-5 w-5 mr-2" />
                    Book a Free AI Consultation
                  </a>
                </Button>
              </div>
            </div>
            
            {/* Contact Form */}
            <div className="bg-background rounded-xl p-6 border">
              <h4 className="text-xl font-semibold mb-4 text-foreground">Request Your Free AI Strategy Session</h4>
              
              {/* Success Message */}
              {formState.success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div>
                    <h5 className="font-semibold text-green-800">Thank you for your interest!</h5>
                    <p className="text-sm text-green-700">We&apos;ll contact you within 24 hours to schedule your free AI strategy session.</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {formState.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <div>
                    <h5 className="text-red-800 font-medium">Submission Failed</h5>
                    <p className="text-red-600 text-sm">{formState.error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-muted-foreground mb-1">
                      First Name *
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
                      Last Name *
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
                    Work Email *
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
                    Phone Number *
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
                    Company
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
                    Industry
                  </label>
                  <select
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    disabled={formState.isSubmitting}
                  >
                    <option value="">Select your industry</option>
                    <option value="finance">Finance & Accounting</option>
                    <option value="marketing">Marketing & Sales</option>
                    <option value="operations">Operations & Logistics</option>
                    <option value="hr">Human Resources</option>
                    <option value="technology">Technology</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="retail">Retail</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-muted-foreground mb-1">
                    Tell us about your AI automation needs *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    placeholder="What business processes would you like to automate with AI? What challenges are you facing? What are your goals?"
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
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Request Free AI Strategy Session
                    </>
                  )}
                </Button>
              </form>
              
              <p className="text-xs text-muted-foreground mt-4 text-center">
                By submitting this form, you agree to receive communications about our AI solutions. 
                Your information is secure and will never be shared.
              </p>
            </div>
          </div>
        </div>

        {/* Final Encouragement */}
        <div className="text-center mt-16">
          <p className="text-lg text-muted-foreground mb-4">
            Join hundreds of businesses already transforming their operations with custom AI solutions.
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-primary via-blue-600 to-violet-600 rounded-full"></div>
              30+ Industries Served
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-primary via-blue-600 to-violet-600 rounded-full"></div>
              98% Customer Satisfaction
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-primary via-blue-600 to-violet-600 rounded-full"></div>
              24/7 Support Available
            </span>
          </div>
        </div>
      </div>
    </section>
  );
} 