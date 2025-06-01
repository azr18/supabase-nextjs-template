"use client";

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Plane } from 'lucide-react';

// Airline configuration type
export interface AirlineOption {
  id: string;
  name: string;
  code: string;
  description: string;
  status: 'active' | 'coming-soon';
}

// Supported airlines as defined in PRD
const AIRLINES: AirlineOption[] = [
  {
    id: 'fly_dubai',
    name: 'Fly Dubai',
    code: 'FZ',
    description: 'Dubai-based low-cost carrier',
    status: 'active'
  },
  {
    id: 'tap',
    name: 'TAP Air Portugal',
    code: 'TP',
    description: 'Portugal national airline',
    status: 'active'
  },
  {
    id: 'philippines_airlines',
    name: 'Philippines Airlines',
    code: 'PR',
    description: 'Flag carrier of the Philippines',
    status: 'active'
  },
  {
    id: 'air_india',
    name: 'Air India',
    code: 'AI',
    description: 'National carrier of India',
    status: 'active'
  },
  {
    id: 'el_al',
    name: 'El Al',
    code: 'LY',
    description: 'Flag carrier of Israel',
    status: 'active'
  }
];

interface AirlineSelectorProps {
  selectedAirline: string | null;
  onAirlineChange: (airlineId: string | null) => void;
  disabled?: boolean;
  className?: string;
  isLoading?: boolean;
  isProcessing?: boolean;
  loadingLabel?: string;
}

export default function AirlineSelector({ 
  selectedAirline, 
  onAirlineChange, 
  disabled = false,
  className = "",
  isLoading = false,
  isProcessing = false,
  loadingLabel = "Loading airlines..."
}: AirlineSelectorProps) {
  
  const selectedAirlineData = selectedAirline 
    ? AIRLINES.find(airline => airline.id === selectedAirline)
    : null;

  // Show loading skeleton during initial loading
  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`} data-testid="airline-selector-loading">
        <div className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <div className="relative">
            <Skeleton className="w-full h-14 rounded-md" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-2 text-blue-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">{loadingLabel}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`} data-testid="airline-selector">
      {/* Airline Dropdown */}
      <div className="space-y-3">
        <label htmlFor="airline-select" className="text-base font-semibold text-gray-800">
          Select Airline
          {isProcessing && (
            <span className="ml-2 inline-flex items-center gap-1 text-blue-600">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-xs font-normal">Processing...</span>
            </span>
          )}
        </label>
        <Select 
          value={selectedAirline || ""} 
          onValueChange={(value: string) => onAirlineChange(value || null)}
          disabled={disabled || isProcessing}
        >
          <SelectTrigger 
            id="airline-select"
            className={`w-full h-14 border-blue-200 focus:border-blue-400 focus:ring-blue-400 hover:border-blue-300 transition-colors text-base ${
              isProcessing ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            data-testid="airline-select-trigger"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing selection...</span>
              </div>
            ) : (
              <SelectValue placeholder="Choose the airline type for your invoice reconciliation" />
            )}
          </SelectTrigger>
          <SelectContent className="bg-white border-blue-200 shadow-xl">
            {AIRLINES.map((airline) => (
              <SelectItem 
                key={airline.id} 
                value={airline.id}
                className="cursor-pointer hover:bg-blue-50 focus:bg-blue-50 py-3"
                disabled={isProcessing}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant="outline" 
                      className="bg-gradient-to-r from-blue-500 to-violet-500 text-white border-none text-xs font-bold px-3 py-1"
                    >
                      {airline.code}
                    </Badge>
                    <span className="font-semibold text-base">{airline.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {airline.status === 'active' && (
                      <Badge 
                        className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs"
                      >
                        Active
                      </Badge>
                    )}
                    {isProcessing && selectedAirline === airline.id && (
                      <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                    )}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Processing feedback */}
      {isProcessing && selectedAirlineData && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="p-2 bg-blue-100 rounded-full">
            <Plane className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800">
              Processing {selectedAirlineData.name} selection...
            </p>
            <p className="text-xs text-blue-600">
              Validating access and preparing reconciliation interface
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Export airlines data for use in other components
export { AIRLINES }; 