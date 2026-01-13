/**
 * CSV Export Utilities
 * Provides functions to convert CRM data to CSV format
 */

export interface CSVColumn {
  header: string;
  key: string;
  formatter?: (value: any) => string;
}

/**
 * Convert array of objects to CSV string
 */
export function arrayToCSV<T extends Record<string, any>>(
  data: T[],
  columns: CSVColumn[]
): string {
  if (data.length === 0) {
    return columns.map(col => escapeCSVValue(col.header)).join(',');
  }

  // Header row
  const headers = columns.map(col => escapeCSVValue(col.header)).join(',');

  // Data rows
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col.key];
      const formatted = col.formatter ? col.formatter(value) : value;
      return escapeCSVValue(formatted);
    }).join(',');
  });

  return [headers, ...rows].join('\n');
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
 * Format date for CSV export
 */
export function formatDateForCSV(date: Date | null | undefined): string {
  if (!date) return '';
  if (!(date instanceof Date)) return String(date);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

/**
 * Format datetime for CSV export
 */
export function formatDateTimeForCSV(date: Date | null | undefined): string {
  if (!date) return '';
  if (!(date instanceof Date)) return String(date);
  return date.toISOString().replace('T', ' ').split('.')[0]; // YYYY-MM-DD HH:mm:ss format
}

/**
 * Format currency for CSV export
 */
export function formatCurrencyForCSV(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '';
  return amount.toFixed(2);
}

/**
 * Format enum value for CSV export (capitalize first letter)
 */
export function formatEnumForCSV(value: string | null | undefined): string {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Account CSV columns definition
 */
export const accountCSVColumns: CSVColumn[] = [
  { header: 'ID', key: 'id' },
  { header: 'Account Name', key: 'accountName' },
  { header: 'Industry', key: 'industry' },
  { header: 'Size (Employees)', key: 'size' },
  { header: 'Region', key: 'region' },
  { header: 'Vertical', key: 'vertical' },
  { header: 'Security Posture', key: 'securityPosture' },
  { header: 'Website', key: 'website' },
  { header: 'Phone', key: 'phone' },
  { header: 'Description', key: 'description' },
  { header: 'Owner ID', key: 'ownerId' },
  { header: 'Created At', key: 'createdAt', formatter: formatDateTimeForCSV },
  { header: 'Updated At', key: 'updatedAt', formatter: formatDateTimeForCSV },
];

/**
 * Contact CSV columns definition
 */
export const contactCSVColumns: CSVColumn[] = [
  { header: 'ID', key: 'id' },
  { header: 'First Name', key: 'firstName' },
  { header: 'Last Name', key: 'lastName' },
  { header: 'Email', key: 'email' },
  { header: 'Phone', key: 'phone' },
  { header: 'Role', key: 'role' },
  { header: 'Title', key: 'title' },
  { header: 'Account ID', key: 'accountId' },
  { header: 'Account Name', key: 'accountName' }, // from join
  { header: 'Is Primary', key: 'isPrimary', formatter: (v) => v ? 'Yes' : 'No' },
  { header: 'Created At', key: 'createdAt', formatter: formatDateTimeForCSV },
  { header: 'Updated At', key: 'updatedAt', formatter: formatDateTimeForCSV },
];

/**
 * Opportunity CSV columns definition
 */
export const opportunityCSVColumns: CSVColumn[] = [
  { header: 'ID', key: 'id' },
  { header: 'Opportunity Name', key: 'opportunityName' },
  { header: 'Account ID', key: 'accountId' },
  { header: 'Account Name', key: 'accountName' }, // from join
  { header: 'Stage', key: 'stage' },
  { header: 'Amount', key: 'amount', formatter: formatCurrencyForCSV },
  { header: 'Probability', key: 'probability' },
  { header: 'Type', key: 'type' },
  { header: 'Close Date', key: 'closeDate', formatter: formatDateForCSV },
  { header: 'Next Steps', key: 'nextSteps' },
  { header: 'Metrics', key: 'metrics' },
  { header: 'Economic Buyer ID', key: 'economicBuyerId' },
  { header: 'Decision Criteria', key: 'decisionCriteria' },
  { header: 'Decision Process', key: 'decisionProcess' },
  { header: 'Identified Pain', key: 'identifiedPain' },
  { header: 'Champion ID', key: 'championId' },
  { header: 'Owner ID', key: 'ownerId' },
  { header: 'Created At', key: 'createdAt', formatter: formatDateTimeForCSV },
  { header: 'Updated At', key: 'updatedAt', formatter: formatDateTimeForCSV },
];

/**
 * Project CSV columns definition
 */
export const projectCSVColumns: CSVColumn[] = [
  { header: 'ID', key: 'id' },
  { header: 'Project Name', key: 'projectName' },
  { header: 'Account ID', key: 'accountId' },
  { header: 'Account Name', key: 'accountName' }, // from join
  { header: 'Status', key: 'status' },
  { header: 'Health Status', key: 'healthStatus' },
  { header: 'Adoption Level', key: 'adoptionLevel' },
  { header: 'Active Users', key: 'activeUsers' },
  { header: 'Customer Sentiment', key: 'customerSentiment' },
  { header: 'Go Live Date', key: 'goLiveDate', formatter: formatDateForCSV },
  { header: 'Actual Go Live Date', key: 'actualGoLiveDate', formatter: formatDateForCSV },
  { header: 'Notes', key: 'notes' },
  { header: 'Owner ID', key: 'ownerId' },
  { header: 'Created At', key: 'createdAt', formatter: formatDateTimeForCSV },
  { header: 'Updated At', key: 'updatedAt', formatter: formatDateTimeForCSV },
];

/**
 * Case CSV columns definition
 */
export const caseCSVColumns: CSVColumn[] = [
  { header: 'ID', key: 'id' },
  { header: 'Case Number', key: 'caseNumber' },
  { header: 'Account ID', key: 'accountId' },
  { header: 'Account Name', key: 'accountName' }, // from join
  { header: 'Subject', key: 'subject' },
  { header: 'Priority', key: 'priority' },
  { header: 'Type', key: 'type' },
  { header: 'Status', key: 'status' },
  { header: 'Description', key: 'description' },
  { header: 'Resolution', key: 'resolution' },
  { header: 'Resolved At', key: 'resolvedAt', formatter: formatDateTimeForCSV },
  { header: 'Owner ID', key: 'ownerId' },
  { header: 'Created At', key: 'createdAt', formatter: formatDateTimeForCSV },
  { header: 'Updated At', key: 'updatedAt', formatter: formatDateTimeForCSV },
];

/**
 * Lead CSV columns definition
 */
export const leadCSVColumns: CSVColumn[] = [
  { header: 'ID', key: 'id' },
  { header: 'First Name', key: 'firstName' },
  { header: 'Last Name', key: 'lastName' },
  { header: 'Email', key: 'email' },
  { header: 'Phone', key: 'phone' },
  { header: 'Company', key: 'company' },
  { header: 'Title', key: 'title' },
  { header: 'Lead Source', key: 'leadSource' },
  { header: 'Status', key: 'status' },
  { header: 'Score', key: 'score' },
  { header: 'Segment', key: 'segment' },
  { header: 'Industry', key: 'industry' },
  { header: 'Region', key: 'region' },
  { header: 'Estimated Budget', key: 'estimatedBudget', formatter: formatCurrencyForCSV },
  { header: 'Timeline', key: 'timeline' },
  { header: 'Pain Points', key: 'painPoints' },
  { header: 'Notes', key: 'notes' },
  { header: 'Assigned To', key: 'assignedTo' },
  { header: 'Created At', key: 'createdAt', formatter: formatDateTimeForCSV },
  { header: 'Updated At', key: 'updatedAt', formatter: formatDateTimeForCSV },
];
