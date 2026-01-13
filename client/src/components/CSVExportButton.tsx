import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CSVExportButtonProps {
  data: any[];
  filename: string;
  label?: string;
  disabled?: boolean;
}

/**
 * Reusable CSV Export Button Component
 * Converts data to CSV and triggers download
 */
export function CSVExportButton({ 
  data, 
  filename, 
  label = "Export CSV",
  disabled = false 
}: CSVExportButtonProps) {
  
  const handleExport = () => {
    if (!data || data.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      // Convert data to CSV string
      const csvContent = convertToCSV(data);
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Exported ${data.length} records to CSV`);
    } catch (error) {
      console.error('CSV export error:', error);
      toast.error("Failed to export CSV");
    }
  };

  return (
    <Button 
      onClick={handleExport} 
      variant="outline" 
      size="sm"
      disabled={disabled || !data || data.length === 0}
    >
      <Download className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );
}

/**
 * Convert array of objects to CSV string
 */
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create header row
  const headerRow = headers.map(escapeCSVValue).join(',');
  
  // Create data rows
  const dataRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      return escapeCSVValue(formatValue(value));
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Escape CSV value to handle commas, quotes, and newlines
 */
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);
  
  // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Format value for CSV export
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  // Handle dates
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }

  // Handle objects/arrays (convert to JSON)
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}
