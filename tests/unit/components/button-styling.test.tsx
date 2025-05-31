import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from '../../../nextjs/src/components/ui/button';

describe('Button Component Styling Consistency', () => {
  it('should apply primary gradient styling to default variant', () => {
    render(<Button>Primary Button</Button>);
    const button = screen.getByRole('button', { name: 'Primary Button' });
    
    // Check for primary gradient classes
    expect(button).toHaveClass('bg-gradient-to-r');
    expect(button).toHaveClass('from-gray-800');
    expect(button).toHaveClass('via-blue-500');
    expect(button).toHaveClass('to-blue-600');
    
    // Check for hover gradient classes
    expect(button).toHaveClass('hover:from-gray-700');
    expect(button).toHaveClass('hover:via-blue-600');
    expect(button).toHaveClass('hover:to-violet-600');
    
    // Check for additional styling
    expect(button).toHaveClass('text-white');
    expect(button).toHaveClass('shadow-lg');
    expect(button).toHaveClass('hover:shadow-xl');
    expect(button).toHaveClass('hover:scale-105');
    expect(button).toHaveClass('font-semibold');
  });

  it('should apply secondary gradient styling to secondary variant', () => {
    render(<Button variant="secondary">Secondary Button</Button>);
    const button = screen.getByRole('button', { name: 'Secondary Button' });
    
    // Check for secondary gradient classes
    expect(button).toHaveClass('bg-gradient-to-r');
    expect(button).toHaveClass('from-blue-600');
    expect(button).toHaveClass('via-violet-500');
    expect(button).toHaveClass('to-violet-700');
    
    // Check for hover gradient classes
    expect(button).toHaveClass('hover:from-blue-700');
    expect(button).toHaveClass('hover:via-violet-600');
    expect(button).toHaveClass('hover:to-violet-800');
    
    // Check for additional styling
    expect(button).toHaveClass('text-white');
    expect(button).toHaveClass('shadow-lg');
    expect(button).toHaveClass('hover:shadow-xl');
    expect(button).toHaveClass('hover:scale-105');
    expect(button).toHaveClass('font-semibold');
  });

  it('should apply outline styling with blue theme to outline variant', () => {
    render(<Button variant="outline">Outline Button</Button>);
    const button = screen.getByRole('button', { name: 'Outline Button' });
    
    // Check for outline styling
    expect(button).toHaveClass('border-2');
    expect(button).toHaveClass('border-blue-200');
    expect(button).toHaveClass('text-blue-700');
    
    // Check for hover effects
    expect(button).toHaveClass('hover:bg-gradient-to-r');
    expect(button).toHaveClass('hover:from-blue-50');
    expect(button).toHaveClass('hover:to-violet-50');
    expect(button).toHaveClass('hover:border-blue-300');
    expect(button).toHaveClass('hover:scale-105');
    expect(button).toHaveClass('hover:shadow-lg');
  });

  it('should apply ghost styling with blue theme to ghost variant', () => {
    render(<Button variant="ghost">Ghost Button</Button>);
    const button = screen.getByRole('button', { name: 'Ghost Button' });
    
    // Check for ghost hover effects
    expect(button).toHaveClass('hover:bg-gradient-to-r');
    expect(button).toHaveClass('hover:from-blue-50');
    expect(button).toHaveClass('hover:to-violet-50');
    expect(button).toHaveClass('hover:text-blue-700');
    expect(button).toHaveClass('hover:scale-105');
  });

  it('should apply link styling with blue theme to link variant', () => {
    render(<Button variant="link">Link Button</Button>);
    const button = screen.getByRole('button', { name: 'Link Button' });
    
    // Check for link styling
    expect(button).toHaveClass('text-blue-600');
    expect(button).toHaveClass('underline-offset-4');
    expect(button).toHaveClass('hover:underline');
    expect(button).toHaveClass('hover:text-violet-600');
  });

  it('should maintain consistent transition duration across all variants', () => {
    const variants = ['default', 'secondary', 'outline', 'ghost', 'link'] as const;
    
    variants.forEach((variant) => {
      const { unmount } = render(<Button variant={variant}>{variant} Button</Button>);
      const button = screen.getByRole('button', { name: `${variant} Button` });
      
      // All variants should have transition-all duration-300
      expect(button).toHaveClass('transition-all');
      expect(button).toHaveClass('duration-300');
      
      unmount();
    });
  });

  it('should apply size variants correctly while maintaining styling', () => {
    const { rerender } = render(<Button size="sm">Small Button</Button>);
    let button = screen.getByRole('button', { name: 'Small Button' });
    
    // Check small size
    expect(button).toHaveClass('h-9');
    expect(button).toHaveClass('px-3');
    
    // Should still have gradient styling
    expect(button).toHaveClass('bg-gradient-to-r');
    expect(button).toHaveClass('from-gray-800');
    
    rerender(<Button size="lg">Large Button</Button>);
    button = screen.getByRole('button', { name: 'Large Button' });
    
    // Check large size
    expect(button).toHaveClass('h-11');
    expect(button).toHaveClass('px-8');
    
    // Should still have gradient styling
    expect(button).toHaveClass('bg-gradient-to-r');
    expect(button).toHaveClass('from-gray-800');
  });

  it('should handle disabled state correctly', () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByRole('button', { name: 'Disabled Button' });
    
    // Should have disabled classes
    expect(button).toHaveClass('disabled:pointer-events-none');
    expect(button).toHaveClass('disabled:opacity-50');
    expect(button).toBeDisabled();
    
    // Should still have gradient styling
    expect(button).toHaveClass('bg-gradient-to-r');
    expect(button).toHaveClass('from-gray-800');
  });

  it('should support custom className while preserving core styling', () => {
    render(<Button className="custom-class">Custom Button</Button>);
    const button = screen.getByRole('button', { name: 'Custom Button' });
    
    // Should have custom class
    expect(button).toHaveClass('custom-class');
    
    // Should still have core gradient styling
    expect(button).toHaveClass('bg-gradient-to-r');
    expect(button).toHaveClass('from-gray-800');
    expect(button).toHaveClass('via-blue-500');
    expect(button).toHaveClass('to-blue-600');
  });
}); 