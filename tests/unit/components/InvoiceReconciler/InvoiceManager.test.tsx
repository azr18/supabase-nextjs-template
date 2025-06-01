import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import InvoiceManager from "@/components/InvoiceReconciler/InvoiceManager";
import * as invoiceQueries from "@/lib/supabase/queries/invoices";
import type { UserInvoicesByAirlineResult } from "@/lib/supabase/types";

jest.mock("@/lib/supabase/queries/invoices");

const mockInvoices: UserInvoicesByAirlineResult[] = [
  {
    id: "1",
    airline_type: "fly_dubai",
    original_filename: "invoice1.pdf",
    file_size: 1024 * 1024,
    file_size_mb: 1,
    upload_date: "2024-06-01T12:00:00Z",
    last_used_at: null,
    usage_count: 2,
    metadata: {},
  },
  {
    id: "2",
    airline_type: "fly_dubai",
    original_filename: "invoice2.pdf",
    file_size: 2048 * 1024,
    file_size_mb: 2,
    upload_date: "2024-06-02T12:00:00Z",
    last_used_at: null,
    usage_count: 1,
    metadata: {},
  },
];

describe("InvoiceManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading skeleton when loading", async () => {
    (invoiceQueries.getUserInvoicesByAirline as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(
      <InvoiceManager selectedAirline="fly_dubai" selectedInvoiceId={null} onInvoiceSelect={() => {}} />
    );
    expect(screen.getByTestId("invoice-manager-loading")).toBeInTheDocument();
  });

  it("renders error message on error", async () => {
    (invoiceQueries.getUserInvoicesByAirline as jest.Mock).mockRejectedValue(new Error("Test error"));
    render(
      <InvoiceManager selectedAirline="fly_dubai" selectedInvoiceId={null} onInvoiceSelect={() => {}} />
    );
    await waitFor(() => {
      expect(screen.getByText(/test error/i)).toBeInTheDocument();
    });
  });

  it("renders empty state when no invoices", async () => {
    (invoiceQueries.getUserInvoicesByAirline as jest.Mock).mockResolvedValue([]);
    render(
      <InvoiceManager selectedAirline="fly_dubai" selectedInvoiceId={null} onInvoiceSelect={() => {}} />
    );
    await waitFor(() => {
      expect(screen.getByText(/no saved invoices/i)).toBeInTheDocument();
    });
  });

  it("renders list of invoices with filename, formatted date, and file size", async () => {
    (invoiceQueries.getUserInvoicesByAirline as jest.Mock).mockResolvedValue(mockInvoices);
    render(
      <InvoiceManager selectedAirline="fly_dubai" selectedInvoiceId={null} onInvoiceSelect={() => {}} />
    );
    await waitFor(() => {
      expect(screen.getByLabelText("Filename: invoice1.pdf")).toBeInTheDocument();
      expect(screen.getByLabelText("Filename: invoice2.pdf")).toBeInTheDocument();
      expect(screen.getByLabelText("Upload date: June 1, 2024")).toBeInTheDocument();
      expect(screen.getByLabelText("Upload date: June 2, 2024")).toBeInTheDocument();
      expect(screen.getByLabelText("File size: 1 MB")).toBeInTheDocument();
      expect(screen.getByLabelText("File size: 2 MB")).toBeInTheDocument();
      expect(screen.getByTestId("invoice-row-1")).toBeInTheDocument();
      expect(screen.getByTestId("invoice-row-2")).toBeInTheDocument();
    });
  });

  it("allows only one invoice to be selected at a time", async () => {
    (invoiceQueries.getUserInvoicesByAirline as jest.Mock).mockResolvedValue(mockInvoices);
    render(
      <InvoiceManager selectedAirline="fly_dubai" selectedInvoiceId={"2"} onInvoiceSelect={() => {}} />
    );
    await waitFor(() => {
      const radio1 = screen.getByTestId("invoice-row-1");
      const radio2 = screen.getByTestId("invoice-row-2");
      expect(radio1).toHaveAttribute("aria-checked", "false");
      expect(radio2).toHaveAttribute("aria-checked", "true");
    });
  });

  it("calls onInvoiceSelect when a row is clicked", async () => {
    (invoiceQueries.getUserInvoicesByAirline as jest.Mock).mockResolvedValue(mockInvoices);
    const onSelect = jest.fn();
    render(
      <InvoiceManager selectedAirline="fly_dubai" selectedInvoiceId={null} onInvoiceSelect={onSelect} />
    );
    await waitFor(() => {
      const row = screen.getByTestId("invoice-row-2");
      fireEvent.click(row);
      expect(onSelect).toHaveBeenCalledWith("2");
    });
  });

  it("calls onInvoiceSelect when Enter or Space is pressed on a row", async () => {
    (invoiceQueries.getUserInvoicesByAirline as jest.Mock).mockResolvedValue(mockInvoices);
    const onSelect = jest.fn();
    render(
      <InvoiceManager selectedAirline="fly_dubai" selectedInvoiceId={null} onInvoiceSelect={onSelect} />
    );
    await waitFor(() => {
      const row = screen.getByTestId("invoice-row-1");
      row.focus();
      fireEvent.keyDown(row, { key: "Enter" });
      fireEvent.keyDown(row, { key: " " });
      expect(onSelect).toHaveBeenCalledWith("1");
    });
  });

  it("has correct accessibility roles and attributes", async () => {
    (invoiceQueries.getUserInvoicesByAirline as jest.Mock).mockResolvedValue(mockInvoices);
    render(
      <InvoiceManager selectedAirline="fly_dubai" selectedInvoiceId={"1"} onInvoiceSelect={() => {}} />
    );
    await waitFor(() => {
      const row1 = screen.getByTestId("invoice-row-1");
      const row2 = screen.getByTestId("invoice-row-2");
      expect(row1).toHaveAttribute("role", "radio");
      expect(row2).toHaveAttribute("role", "radio");
      expect(row1).toHaveAttribute("aria-checked", "true");
      expect(row2).toHaveAttribute("aria-checked", "false");
    });
  });
}); 