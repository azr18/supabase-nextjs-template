import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Testimonials from '../../nextjs/src/components/LandingPage/Testimonials';

// Mock lucide-react icons with simple functions
jest.mock('lucide-react', () => ({
  Star: () => 'star-icon',
  Quote: () => 'quote-icon', 
  Building2: () => 'building2-icon',
  TrendingUp: () => 'trendingup-icon',
  Users: () => 'users-icon',
  DollarSign: () => 'dollarsign-icon'
}));

describe('Testimonials Component', () => {
  test('renders the main heading correctly', () => {
    render(React.createElement(Testimonials));
    
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Proven Results Across Every Business Division');
  });

  test('renders all statistics', () => {
    render(React.createElement(Testimonials));
    
    // Check for key statistics
    expect(screen.getByText('150+')).toBeInTheDocument();
    expect(screen.getByText('Businesses Transformed')).toBeInTheDocument();
    expect(screen.getByText('89%')).toBeInTheDocument();
    expect(screen.getByText('Average Efficiency Gain')).toBeInTheDocument();
    expect(screen.getByText('2-6 weeks')).toBeInTheDocument();
    expect(screen.getByText('Implementation Time')).toBeInTheDocument();
    expect(screen.getByText('24/7')).toBeInTheDocument();
    expect(screen.getByText('AI Operation')).toBeInTheDocument();
  });

  test('renders all testimonials with proper structure', () => {
    render(React.createElement(Testimonials));
    
    // Check for testimonial authors
    expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    expect(screen.getByText('Marcus Rodriguez')).toBeInTheDocument();
    expect(screen.getByText('David Park')).toBeInTheDocument();
    expect(screen.getByText('Jennifer Liu')).toBeInTheDocument();
    
    // Check for company names
    expect(screen.getByText('TechFlow Solutions')).toBeInTheDocument();
    expect(screen.getByText('GrowthLab Agency')).toBeInTheDocument();
    expect(screen.getByText('MidSize Manufacturing')).toBeInTheDocument();
    expect(screen.getByText('ServicePro Corp')).toBeInTheDocument();
    
    // Check for job titles
    expect(screen.getByText('VP of Sales')).toBeInTheDocument();
    expect(screen.getByText('Marketing Director')).toBeInTheDocument();
    expect(screen.getByText('CFO')).toBeInTheDocument();
    expect(screen.getByText('Operations Manager')).toBeInTheDocument();
  });

  test('renders business division areas in bottom CTA', () => {
    render(React.createElement(Testimonials));
    
    expect(screen.getByText('Marketing AI')).toBeInTheDocument();
    expect(screen.getByText('Sales AI')).toBeInTheDocument();
    expect(screen.getByText('Finance AI')).toBeInTheDocument();
    
    // Check for descriptions
    expect(screen.getByText('Content creation, campaign automation, and lead intelligence')).toBeInTheDocument();
    expect(screen.getByText('Prospect research, outreach automation, and performance optimization')).toBeInTheDocument();
    expect(screen.getByText('Automated reconciliation, reporting, and predictive forecasting')).toBeInTheDocument();
  });

  test('includes AI solutions success stories content', () => {
    render(React.createElement(Testimonials));
    
    // Check for key success metrics mentioned in testimonials
    expect(screen.getByText(/40% increase in qualified leads/)).toBeInTheDocument();
    expect(screen.getByText(/65% and content production scaled 3x/)).toBeInTheDocument();
    expect(screen.getByText(/99.8% accuracy/)).toBeInTheDocument();
    expect(screen.getByText(/12 days to 3 days/)).toBeInTheDocument();
  });

  test('focuses on business transformation without revealing specific tools', () => {
    render(React.createElement(Testimonials));
    
    // Should mention business areas but not specific tool names
    expect(screen.getByText(/marketing, sales, and finance operations/)).toBeInTheDocument();
    expect(screen.getByText(/custom AI automation solutions/)).toBeInTheDocument();
    
    // Should NOT contain specific tool names like "invoice reconciler"
    expect(screen.queryByText(/invoice reconciler/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/specific tool/i)).not.toBeInTheDocument();
  });

  test('has proper CTA messaging for business transformation', () => {
    render(React.createElement(Testimonials));
    
    expect(screen.getByText('Ready to Transform Your Business Operations?')).toBeInTheDocument();
    expect(screen.getByText(/Join hundreds of businesses that have revolutionized/)).toBeInTheDocument();
    expect(screen.getByText(/Your transformation story starts with a single conversation/)).toBeInTheDocument();
  });

  test('renders component without errors', () => {
    // Basic smoke test
    const { container } = render(React.createElement(Testimonials));
    expect(container).toBeInTheDocument();
  });
}); 