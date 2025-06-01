"use client";

import React, { useEffect, useState } from "react";
import { getUserInvoicesByAirline, formatFileSize } from "@/lib/supabase/queries/invoices";
import type { UserInvoicesByAirlineResult } from "@/lib/supabase/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, FileText, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InvoiceManagerProps {
  selectedAirline: string | null;
  selectedInvoiceId: string | null;
  onInvoiceSelect: (invoiceId: string) => void;
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function InvoiceManager({ selectedAirline, selectedInvoiceId, onInvoiceSelect }: InvoiceManagerProps) {
  const [invoices, setInvoices] = useState<UserInvoicesByAirlineResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedAirline) {
      setInvoices([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    getUserInvoicesByAirline(selectedAirline)
      .then((data: UserInvoicesByAirlineResult[]) => {
        setInvoices(data);
        setLoading(false);
      })
      .catch((err: { message?: string }) => {
        setError(err?.message || "Failed to load invoices.");
        setLoading(false);
      });
  }, [selectedAirline]);

  const handleDeleteInvoice = async (invoiceId: string, invoiceName: string) => {
    if (window.confirm(`Are you sure you want to delete invoice "${invoiceName}"? This action cannot be undone.`)) {
      setDeletingInvoiceId(invoiceId);
      setError(null); // Clear previous errors
      try {
        const response = await fetch(`/api/invoices?invoiceId=${invoiceId}`, {
          method: 'DELETE',
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || 'Failed to delete invoice.');
        }
        setInvoices(prevInvoices => prevInvoices.filter(inv => inv.id !== invoiceId));
        if (selectedInvoiceId === invoiceId) {
          onInvoiceSelect(""); // Clear selection if deleted invoice was selected
        }
        // Optionally, show a success toast/notification here
      } catch (err: any) {
        console.error("Error deleting invoice:", err);
        setError(err.message || "An unexpected error occurred while deleting the invoice.");
        // Optionally, show an error toast/notification here
      } finally {
        setDeletingInvoiceId(null);
      }
    }
  };

  if (!selectedAirline) {
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-4" data-testid="invoice-manager-loading">
        <Skeleton className="h-6 w-40" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <AlertCircle className="h-5 w-5 text-red-500" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 via-blue-100 to-violet-50 border-blue-200 shadow-md">
      <CardHeader>
        <CardTitle className="text-blue-800 text-lg font-semibold">Saved Invoices</CardTitle>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="text-blue-500 text-sm">No saved invoices for this airline.</div>
        ) : (
          <ul className="divide-y divide-blue-100">
            {invoices.map((invoice) => {
              const isSelected = invoice.id === selectedInvoiceId;
              return (
                <li
                  key={invoice.id}
                  className={`flex items-center gap-4 py-3 cursor-pointer rounded-md transition-colors ${
                    isSelected ? "bg-blue-100 border border-blue-400 shadow-sm" : "hover:bg-blue-50"
                  }`}
                  data-testid={`invoice-row-${invoice.id}`}
                  aria-selected={isSelected}
                  tabIndex={0}
                  onClick={() => onInvoiceSelect(invoice.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      onInvoiceSelect(invoice.id);
                    }
                  }}
                  role="radio"
                  aria-checked={isSelected}
                >
                  <input
                    type="radio"
                    name="invoice-select"
                    checked={isSelected}
                    onChange={() => onInvoiceSelect(invoice.id)}
                    className="accent-blue-600 h-4 w-4"
                    aria-label={`Select invoice ${invoice.original_filename}`}
                    tabIndex={-1}
                  />
                  <FileText className="h-5 w-5 text-blue-400 flex-shrink-0" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-medium text-gray-900 truncate"
                      aria-label={`Filename: ${invoice.original_filename}`}
                    >
                      {invoice.original_filename}
                    </div>
                    <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-blue-600 mt-1">
                      <span aria-label={`Upload date: ${formatDate(invoice.upload_date)}`}>{formatDate(invoice.upload_date)}</span>
                      <span aria-label={`File size: ${formatFileSize(invoice.file_size)}`}>• {formatFileSize(invoice.file_size)}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700 hover:bg-red-100 p-1 h-auto w-auto ml-2 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteInvoice(invoice.id, invoice.original_filename || 'this invoice');
                    }}
                    disabled={deletingInvoiceId === invoice.id}
                    aria-label={`Delete invoice ${invoice.original_filename}`}
                  >
                    {deletingInvoiceId === invoice.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
} 