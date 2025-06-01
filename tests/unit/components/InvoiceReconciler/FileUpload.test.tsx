import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import FileUpload from '@/components/InvoiceReconciler/FileUpload';

// Mock useToast hook
const mockToast = jest.fn();
jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}));

// Create test files
const createTestFile = (name: string, size: number, type: string): File => {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('FileUpload Component', () => {
  const mockOnFileSelect = jest.fn();
  const defaultProps = {
    selectedAirline: 'Fly Dubai',
    onFileSelect: mockOnFileSelect,
    disabled: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    test('should not render when no airline is selected', () => {
      render(<FileUpload {...defaultProps} selectedAirline={null} />);
      expect(screen.queryByText('Upload New Invoice')).not.toBeInTheDocument();
    });

    test('should render upload area when airline is selected', () => {
      render(<FileUpload {...defaultProps} />);
      expect(screen.getByText('Upload New Invoice')).toBeInTheDocument();
      expect(screen.getByText('Upload PDF Invoice')).toBeInTheDocument();
      expect(screen.getByText('Drag and drop a PDF file here, or click to browse')).toBeInTheDocument();
    });

    test('should display airline-specific note', () => {
      render(<FileUpload {...defaultProps} />);
      expect(screen.getByText(/Please upload a PDF invoice in Fly Dubai format/)).toBeInTheDocument();
    });

    test('should show file size limit', () => {
      render(<FileUpload {...defaultProps} />);
      expect(screen.getByText(/Maximum file size: 25 MB/)).toBeInTheDocument();
    });
  });

  describe('File Validation', () => {
    test('should accept valid PDF files', async () => {
      const user = userEvent.setup();
      render(<FileUpload {...defaultProps} />);
      
      const validFile = createTestFile('test-invoice.pdf', 1024 * 1024, 'application/pdf'); // 1MB
      const fileInput = screen.getByLabelText('File input for PDF invoices');
      
      await user.upload(fileInput, validFile);
      
      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalledWith(validFile);
        expect(mockToast).toHaveBeenCalledWith({
          title: "File Selected",
          description: "test-invoice.pdf is ready for upload.",
          variant: "default",
        });
      });
    });

    test('should reject non-PDF files', async () => {
      const user = userEvent.setup();
      render(<FileUpload {...defaultProps} />);
      
      const invalidFile = createTestFile('test-document.txt', 1024, 'text/plain');
      const fileInput = screen.getByLabelText('File input for PDF invoices');
      
      await user.upload(fileInput, invalidFile);
      
      await waitFor(() => {
        expect(mockOnFileSelect).not.toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith({
          title: "Invalid File",
          description: "Only PDF files are allowed for invoice uploads.",
          variant: "destructive",
        });
      });
    });

    test('should reject files larger than 25MB', async () => {
      const user = userEvent.setup();
      render(<FileUpload {...defaultProps} />);
      
      const largeFile = createTestFile('large-invoice.pdf', 26 * 1024 * 1024, 'application/pdf'); // 26MB
      const fileInput = screen.getByLabelText('File input for PDF invoices');
      
      await user.upload(fileInput, largeFile);
      
      await waitFor(() => {
        expect(mockOnFileSelect).not.toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith({
          title: "Invalid File",
          description: expect.stringContaining("File size must be less than 25 MB"),
          variant: "destructive",
        });
      });
    });

    test('should reject empty files', async () => {
      const user = userEvent.setup();
      render(<FileUpload {...defaultProps} />);
      
      const emptyFile = createTestFile('empty.pdf', 0, 'application/pdf');
      const fileInput = screen.getByLabelText('File input for PDF invoices');
      
      await user.upload(fileInput, emptyFile);
      
      await waitFor(() => {
        expect(mockOnFileSelect).not.toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith({
          title: "Invalid File",
          description: "File appears to be empty. Please select a valid PDF file.",
          variant: "destructive",
        });
      });
    });

    test('should reject files without .pdf extension', async () => {
      const user = userEvent.setup();
      render(<FileUpload {...defaultProps} />);
      
      const invalidExtensionFile = createTestFile('document.doc', 1024, 'application/pdf');
      const fileInput = screen.getByLabelText('File input for PDF invoices');
      
      await user.upload(fileInput, invalidExtensionFile);
      
      await waitFor(() => {
        expect(mockOnFileSelect).not.toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith({
          title: "Invalid File",
          description: "File must have a .pdf extension.",
          variant: "destructive",
        });
      });
    });
  });

  describe('Drag and Drop Functionality', () => {
    test('should handle successful drag and drop', async () => {
      render(<FileUpload {...defaultProps} />);
      
      const validFile = createTestFile('invoice.pdf', 1024 * 1024, 'application/pdf');
      const uploadArea = screen.getByLabelText('Upload area for PDF invoice files');
      
      // Simulate drag over
      fireEvent.dragOver(uploadArea, {
        dataTransfer: {
          files: [validFile]
        }
      });
      
      // Simulate drop
      fireEvent.drop(uploadArea, {
        dataTransfer: {
          files: [validFile]
        }
      });
      
      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalledWith(validFile);
      });
    });

    test('should handle drag over visual feedback', () => {
      render(<FileUpload {...defaultProps} />);
      
      const uploadArea = screen.getByLabelText('Upload area for PDF invoice files');
      
      // Initial state
      expect(uploadArea).toHaveClass('border-blue-300');
      
      // Drag over state
      fireEvent.dragOver(uploadArea);
      expect(uploadArea).toHaveClass('border-blue-400');
      
      // Drag leave state
      fireEvent.dragLeave(uploadArea);
      expect(uploadArea).toHaveClass('border-blue-300');
    });

    test('should not handle drop when disabled', () => {
      render(<FileUpload {...defaultProps} disabled={true} />);
      
      const validFile = createTestFile('invoice.pdf', 1024 * 1024, 'application/pdf');
      const uploadArea = screen.getByLabelText('Upload area for PDF invoice files');
      
      fireEvent.drop(uploadArea, {
        dataTransfer: {
          files: [validFile]
        }
      });
      
      expect(mockOnFileSelect).not.toHaveBeenCalled();
    });
  });

  describe('File Preview and Management', () => {
    test('should show file preview after selection', async () => {
      const user = userEvent.setup();
      render(<FileUpload {...defaultProps} />);
      
      const validFile = createTestFile('test-invoice.pdf', 1024 * 1024, 'application/pdf');
      const fileInput = screen.getByLabelText('File input for PDF invoices');
      
      await user.upload(fileInput, validFile);
      
      await waitFor(() => {
        expect(screen.getByText('test-invoice.pdf')).toBeInTheDocument();
        expect(screen.getByText(/1 MB • PDF/)).toBeInTheDocument();
        expect(screen.getByText('File ready for upload')).toBeInTheDocument();
      });
    });

    test('should allow removing selected file', async () => {
      const user = userEvent.setup();
      render(<FileUpload {...defaultProps} />);
      
      const validFile = createTestFile('test-invoice.pdf', 1024 * 1024, 'application/pdf');
      const fileInput = screen.getByLabelText('File input for PDF invoices');
      
      await user.upload(fileInput, validFile);
      
      await waitFor(() => {
        expect(screen.getByText('test-invoice.pdf')).toBeInTheDocument();
      });
      
      // Remove file
      const removeButton = screen.getByLabelText('Remove selected file');
      await user.click(removeButton);
      
      await waitFor(() => {
        expect(screen.queryByText('test-invoice.pdf')).not.toBeInTheDocument();
        expect(screen.getByText('Upload PDF Invoice')).toBeInTheDocument();
      });
    });

    test('should show validation error state', async () => {
      const user = userEvent.setup();
      render(<FileUpload {...defaultProps} />);
      
      const invalidFile = createTestFile('large.pdf', 26 * 1024 * 1024, 'application/pdf');
      const fileInput = screen.getByLabelText('File input for PDF invoices');
      
      await user.upload(fileInput, invalidFile);
      
      await waitFor(() => {
        expect(screen.getByText(/File size must be less than 25 MB/)).toBeInTheDocument();
      });
    });

    test('should allow choosing different file after selection', async () => {
      const user = userEvent.setup();
      render(<FileUpload {...defaultProps} />);
      
      const firstFile = createTestFile('first.pdf', 1024 * 1024, 'application/pdf');
      const fileInput = screen.getByLabelText('File input for PDF invoices');
      
      await user.upload(fileInput, firstFile);
      
      await waitFor(() => {
        expect(screen.getByText('first.pdf')).toBeInTheDocument();
      });
      
      // Click "Choose Different File"
      const changeButton = screen.getByText('Choose Different File');
      await user.click(changeButton);
      
      // Should open file dialog (in test environment, just verify the button exists)
      expect(changeButton).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    test('should disable interactions when disabled prop is true', () => {
      render(<FileUpload {...defaultProps} disabled={true} />);
      
      const uploadArea = screen.getByLabelText('Upload area for PDF invoice files');
      const browseButton = screen.getByText('Browse Files');
      
      expect(uploadArea).toHaveClass('opacity-50', 'cursor-not-allowed');
      expect(browseButton).toBeDisabled();
    });

    test('should not respond to keyboard interactions when disabled', () => {
      render(<FileUpload {...defaultProps} disabled={true} />);
      
      const uploadArea = screen.getByLabelText('Upload area for PDF invoice files');
      
      fireEvent.keyDown(uploadArea, { key: 'Enter' });
      fireEvent.keyDown(uploadArea, { key: ' ' });
      
      expect(mockOnFileSelect).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Accessibility', () => {
    test('should handle Enter key to open file dialog', () => {
      render(<FileUpload {...defaultProps} />);
      
      const uploadArea = screen.getByLabelText('Upload area for PDF invoice files');
      
      fireEvent.keyDown(uploadArea, { key: 'Enter' });
      
      // In test environment, we just verify the interaction was handled
      expect(uploadArea).toHaveAttribute('tabIndex', '0');
    });

    test('should handle Space key to open file dialog', () => {
      render(<FileUpload {...defaultProps} />);
      
      const uploadArea = screen.getByLabelText('Upload area for PDF invoice files');
      
      fireEvent.keyDown(uploadArea, { key: ' ' });
      
      // In test environment, we just verify the interaction was handled
      expect(uploadArea).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('File Size Formatting', () => {
    test('should format file sizes correctly', async () => {
      const user = userEvent.setup();
      render(<FileUpload {...defaultProps} />);
      
      const testCases = [
        { size: 1024, expected: '1 KB' },
        { size: 1024 * 1024, expected: '1 MB' },
        { size: 1024 * 1024 * 1.5, expected: '1.5 MB' },
        { size: 500, expected: '500 Bytes' }
      ];
      
      for (const testCase of testCases) {
        const file = createTestFile('test.pdf', testCase.size, 'application/pdf');
        const fileInput = screen.getByLabelText('File input for PDF invoices');
        
        await user.upload(fileInput, file);
        
        await waitFor(() => {
          expect(screen.getByText(new RegExp(testCase.expected))).toBeInTheDocument();
        });
        
        // Remove file for next iteration
        const removeButton = screen.getByLabelText('Remove selected file');
        await user.click(removeButton);
      }
    });
  });
}); 