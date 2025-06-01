"use client";

import React, { useState, useRef, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { generateFileHash, checkForDuplicate } from "@/lib/fileUtils/duplicateDetection";
import { uploadInvoiceToSupabaseStorage } from "@/lib/fileUtils/storageManager";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type { SavedInvoice } from "@/lib/supabase/types";

interface FileUploadProps {
  supabase: SupabaseClient<Database>;
  userId: string | undefined;
  selectedAirline: string | null;
  selectedAirlineId: string | null;
  onFileUploadComplete: (invoice: SavedInvoice) => void;
  onFileSelected?: (file: File | null) => void;
  disabled?: boolean;
  className?: string;
}

export default function FileUpload({
  supabase,
  userId,
  selectedAirline,
  selectedAirlineId,
  onFileUploadComplete,
  onFileSelected,
  disabled = false,
  className = ""
}: FileUploadProps) {
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<{ name: string; size: string; type: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
  const ALLOWED_TYPES = ['application/pdf'];
  const ALLOWED_EXTENSIONS = ['.pdf'];

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const resetState = useCallback(() => {
    setPendingFile(null);
    setFilePreview(null);
    setIsProcessing(false);
    setStatusMessage(null);
    setProcessingError(null);
    setUploadSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Only PDF files are allowed for invoice uploads.';
    }
    const extension = file.name.toLowerCase().split('.').pop();
    if (!extension || !ALLOWED_EXTENSIONS.includes(`.${extension}`)) {
      return 'File must have a .pdf extension.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${formatFileSize(MAX_FILE_SIZE)}. Current: ${formatFileSize(file.size)}.`;
    }
    if (file.size === 0) {
      return 'File appears to be empty. Please select a valid PDF file.';
    }
    return null;
  };

  const processPendingFile = useCallback(async () => {
    if (!pendingFile) {
      setProcessingError("No file selected to process.");
      toast({ title: "Error", description: "No file selected.", variant: "destructive" });
      return;
    }
    if (!userId || !selectedAirlineId) {
      setProcessingError("User or airline information is missing. Cannot proceed.");
      toast({ title: "Error", description: "User or airline information is missing.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    setProcessingError(null);
    setStatusMessage("Validating file...");
    setUploadSuccess(false);

    try {
      setStatusMessage("Checking storage capacity...");
      const usageResponse = await fetch('/api/storage-usage');
      if (!usageResponse.ok) {
        const errorData = await usageResponse.json();
        throw new Error(errorData.message || 'Failed to check storage usage.');
      }
      const usageData = await usageResponse.json();
      const availableSpace = usageData.quotaBytes - usageData.totalUsageBytes;
      
      if (pendingFile.size > availableSpace) {
        const errorMessage = `Cannot upload file. It would exceed your ${formatFileSize(usageData.quotaBytes)} storage quota. ` +
                             `You currently have ${formatFileSize(availableSpace < 0 ? 0 : availableSpace)} available. ` +
                             `File size: ${formatFileSize(pendingFile.size)}.`;
        setProcessingError(errorMessage);
        toast({ title: "Storage Quota Exceeded", description: errorMessage, variant: "destructive", duration: 7000 });
        setIsProcessing(false);
        setStatusMessage(null);
        return;
      }
    } catch (quotaError: any) {
      console.error("Error checking storage quota:", quotaError);
      setProcessingError("Could not verify storage capacity. Please try again.");
      toast({ title: "Storage Check Failed", description: quotaError.message || "Could not verify storage capacity.", variant: "destructive" });
      setIsProcessing(false);
      setStatusMessage(null);
      return;
    }
    
    const validationResult = validateFile(pendingFile);
    if (validationResult) {
      setProcessingError(validationResult);
      toast({ title: "Invalid File", description: validationResult, variant: "destructive" });
      setIsProcessing(false);
      return;
    }

    let newInvoice: SavedInvoice | null = null;

    try {
      setStatusMessage("Generating file hash...");
      const fileHash = await generateFileHash(pendingFile);

      setStatusMessage("Checking for duplicates...");
      const { isDuplicate, existingInvoice } = await checkForDuplicate({
        supabase,
        userId,
        airlineId: selectedAirlineId,
        fileHash,
        fileName: pendingFile.name,
        fileSize: pendingFile.size,
      });

      if (isDuplicate && existingInvoice) {
        setStatusMessage(null);
        setProcessingError(`This file appears to be a duplicate of "${existingInvoice.original_filename}". Please select it from the list or upload a different file.`);
        toast({
          title: "Duplicate Detected",
          description: `This file matches an existing invoice: ${existingInvoice.original_filename}. You can select it from your saved invoices.`,
          variant: "warning",
          duration: 7000,
        });
        setIsProcessing(false);
        return;
      }

      setStatusMessage("Uploading to secure storage...");
      const uploadResult = await uploadInvoiceToSupabaseStorage({
        supabase,
        userId,
        airlineId: selectedAirlineId,
        file: pendingFile,
      });

      if (!uploadResult.success || !uploadResult.filePath) {
        throw new Error(uploadResult.error?.message || "Failed to upload file to storage.");
      }

      setStatusMessage("Saving invoice details...");
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          airlineId: selectedAirlineId,
          originalFilename: pendingFile.name,
          fileSize: pendingFile.size,
          fileHash,
          filePath: uploadResult.filePath,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save invoice metadata.");
      }

      newInvoice = await response.json() as SavedInvoice;

      setStatusMessage("Upload complete!");
      setUploadSuccess(true);
      if (newInvoice) {
        onFileUploadComplete(newInvoice);
      }

    } catch (error: any) {
      console.error("Error during file processing or upload:", error);
      setProcessingError(error.message || "An unexpected error occurred.");
      toast({
        title: "Upload Failed",
        description: error.message || "An unexpected error occurred during the upload process.",
        variant: "destructive",
      });
      setStatusMessage(null);
      setIsProcessing(false);
    }
  }, [pendingFile, supabase, userId, selectedAirlineId, toast, onFileUploadComplete, validateFile]);

  const handleFileSelectedForPreview = useCallback((file: File) => {
    const validationResult = validateFile(file);
    if (validationResult) {
      setProcessingError(validationResult);
      toast({ title: "Invalid File", description: validationResult, variant: "destructive" });
      setPendingFile(null);
      setFilePreview(null);
      if (onFileSelected) onFileSelected(null);
      return;
    }

    setPendingFile(file);
    setFilePreview({ name: file.name, size: formatFileSize(file.size), type: file.type });
    setProcessingError(null);
    setStatusMessage(null);
    setUploadSuccess(false);
    if (onFileSelected) onFileSelected(file);
  }, [toast, validateFile, onFileSelected]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    if (disabled || isProcessing) return;

    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      const file = droppedFiles[0];
      handleFileSelectedForPreview(file);
    } else {
      toast({ title: "No File Dropped", description: "Please ensure you drop a single PDF file.", variant: "warning" });
    }
  }, [disabled, isProcessing, handleFileSelectedForPreview, toast]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !isProcessing) {
      setIsDragOver(true);
    }
  }, [disabled, isProcessing]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleActualFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelectedForPreview(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [handleFileSelectedForPreview]);

  const handleBrowseClick = () => {
    if (uploadSuccess || processingError) {
      resetState(); 
    }
    if (fileInputRef.current && !disabled && !isProcessing) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveFile = () => {
    resetState();
    if (onFileSelected) onFileSelected(null);
  };

  const handleConfirmUpload = () => {
    if (pendingFile && !isProcessing) {
      processPendingFile();
    }
  };

  if (!selectedAirlineId) {
    return null; 
  }

  let cardContent;

  if (uploadSuccess) {
    cardContent = (
      <div className="flex flex-col items-center justify-center p-6 space-y-3">
        <CheckCircle className="h-12 w-12 text-green-500" />
        <p className="text-green-700 font-semibold">{statusMessage || "Upload Successful!"}</p>
        {filePreview && <p className="text-sm text-gray-600">{filePreview.name} processed.</p>}
        <Button onClick={resetState} variant="outline" className="mt-4">Upload Another File</Button>
      </div>
    );
  } else if (isProcessing) {
    const currentFilePreview = filePreview;
    cardContent = (
      <div className="space-y-3 p-4">
        {currentFilePreview && (
          <div className="p-3 border border-blue-200 rounded-md bg-white shadow-sm">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-800 truncate max-w-xs">{currentFilePreview.name}</p>
                <p className="text-xs text-gray-500">{currentFilePreview.size} - {currentFilePreview.type}</p>
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 text-blue-600 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>{statusMessage || 'Processing, please wait...'}</span>
        </div>
      </div>
    );
  } else if (processingError) {
    const currentFilePreview = filePreview;
    cardContent = (
      <div className="space-y-3 p-4">
        {currentFilePreview && (
          <div className="p-3 border border-red-200 rounded-md bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-red-400" />
                <div>
                  <p className="text-sm font-medium text-gray-800 truncate max-w-xs">{currentFilePreview.name}</p>
                  <p className="text-xs text-gray-500">{currentFilePreview.size} - {currentFilePreview.type}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span>{processingError}</span>
        </div>
        <Button onClick={handleBrowseClick} className="w-full mt-2 bg-gradient-to-r from-gray-800 via-blue-500 to-blue-600 hover:from-gray-700 hover:via-blue-600 hover:to-blue-700 text-white">
          Change File / Try Again
        </Button>
      </div>
    );
  } else if (pendingFile && filePreview) {
    const currentFilePreview = filePreview;
    cardContent = (
      <div className="mt-0 p-4 space-y-3">
        <div className="p-3 border border-gray-200 rounded-md bg-white shadow-sm">
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-500" />
                <div>
                <p className="font-semibold text-gray-700 truncate max-w-xs sm:max-w-sm md:max-w-md" title={currentFilePreview.name}>
                    {currentFilePreview.name}
                </p>
                <p className="text-xs text-gray-500">
                    {currentFilePreview.size} - {currentFilePreview.type}
                </p>
                </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleRemoveFile} className="text-gray-500 hover:text-red-600">
                <X className="h-5 w-5" />
            </Button>
            </div>
        </div>
        <Button 
            onClick={handleConfirmUpload} 
            disabled={!pendingFile || isProcessing}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 text-base"
        >
            <Upload className="mr-2 h-5 w-5" />
            Confirm and Upload
        </Button>
        <Button 
            variant="outline" 
            onClick={handleBrowseClick} 
            className="w-full border-blue-500 text-blue-500 hover:bg-blue-50 py-3 text-base"
        >
            Change File
        </Button>
      </div>
    );
  } else {
    cardContent = (
        <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${(isDragOver && !disabled && !isProcessing) ? 'border-blue-400 bg-blue-100' : 'border-blue-300 bg-blue-50'} ${(disabled || isProcessing) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400 hover:bg-blue-100'}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={!isProcessing ? handleBrowseClick : undefined}
            role="button"
            tabIndex={(disabled || isProcessing) ? -1 : 0}
            aria-label="Upload area for PDF invoice files"
            onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled && !isProcessing) {
                e.preventDefault();
                handleBrowseClick();
            }
            }}
        >
            <input
            type="file"
            ref={fileInputRef}
            onChange={handleActualFileInputChange}
            accept={ALLOWED_EXTENSIONS.join(',')}
            className="hidden"
            disabled={disabled || isProcessing}
            />
            <div className="flex flex-col items-center gap-4 text-blue-600">
            <Upload className="h-12 w-12" />
            <p className="font-semibold">Drag & drop your PDF invoice here</p>
            <p className="text-sm text-blue-500">or</p>
            <Button 
                variant="outline" 
                onClick={(e) => { e.stopPropagation(); if (!isProcessing) handleBrowseClick(); }}
                disabled={disabled || isProcessing}
                className="bg-white border-blue-300 hover:bg-blue-50 text-blue-700"
            >
                Browse Files
            </Button>
            <p className="text-xs text-blue-400 mt-2">Max file size: {formatFileSize(MAX_FILE_SIZE)}. PDF only.</p>
            </div>
        </div>
    );
  }

  return (
    <Card className={`shadow-lg border-blue-100 ${className} ${isProcessing ? 'opacity-80 pointer-events-none' : ''}`}>
      <CardHeader className="bg-gradient-to-r from-blue-50 via-blue-100 to-violet-50 p-4 rounded-t-lg">
        <CardTitle className="text-blue-800 text-lg font-semibold">
          {uploadSuccess ? "Upload Successful!" : 
           isProcessing ? statusMessage || 'Processing File...' : 
           processingError ? 'Upload Issue' : 
           pendingFile ? 'Selected Invoice' : 
           'Upload New Invoice PDF'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {cardContent}
      </CardContent>
    </Card>
  );
}

// Helper type (should ideally be in a more central types file if used elsewhere)
// Or ensure Database['public']['Tables']['saved_invoices']['Row'] is used directly
// For now, defining a simplified version here, but ensure it matches your actual table structure
// export interface SavedInvoice {
//   id: string;
//   user_id: string;
//   airline_id: string;
//   original_filename: string;
//   file_size: number;
//   file_hash: string;
//   file_path: string;
//   upload_date: string; // Assuming this will be set by the server (e.g., created_at)
//   // ... any other relevant fields
// } 