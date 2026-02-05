import { useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface CSVImportExportProps {
  type: "leads" | "contacts";
}

export default function CSVImportExport({ type }: CSVImportExportProps) {
  const [importing, setImporting] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const { data: leads } = trpc.leads.list.useQuery({}, { enabled: type === "leads" });
  const { data: contacts } = trpc.contacts.list.useQuery(undefined, { enabled: type === "contacts" });
  
  const createLead = trpc.leads.create.useMutation();
  const createContact = trpc.contacts.create.useMutation();

  const handleExport = () => {
    let data: any[] = [];
    let filename = "";

    if (type === "leads" && leads) {
      data = leads.map((lead: any) => ({
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone || "",
        company: lead.company,
        title: lead.title || "",
        leadSource: lead.leadSource,
        status: lead.status,
        segment: lead.segment,
        score: lead.score || 0,
        notes: lead.notes || "",
      }));
      filename = `leads_export_${new Date().toISOString().split("T")[0]}.csv`;
    } else if (type === "contacts" && contacts) {
      data = contacts.map((contact: any) => ({
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone || "",
        title: contact.title || "",
        accountId: contact.accountId,
      }));
      filename = `contacts_export_${new Date().toISOString().split("T")[0]}.csv`;
    }

    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${data.length} ${type}`);
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setImporting(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          let successCount = 0;
          let errorCount = 0;

          for (const row of results.data as any[]) {
            try {
              if (type === "leads") {
                // Validate required fields
                if (!row.firstName || !row.lastName || !row.email || !row.company) {
                  console.error("Skipping row with missing required fields:", row);
                  errorCount++;
                  continue;
                }
                
                // Validate email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(row.email)) {
                  console.error("Skipping row with invalid email:", row.email);
                  errorCount++;
                  continue;
                }
                
                await createLead.mutateAsync({
                  firstName: row.firstName.trim(),
                  lastName: row.lastName.trim(),
                  email: row.email.trim().toLowerCase(),
                  phone: row.phone?.trim() || undefined,
                  company: row.company.trim(),
                  title: row.title?.trim() || undefined,
                  leadSource: row.leadSource || "Website",
                  status: row.status || "New",
                  segment: row.segment || undefined,
                  score: parseInt(row.score) || 0,
                  notes: row.notes?.trim() || undefined,
                });
              } else if (type === "contacts") {
                // Validate required fields
                if (!row.firstName || !row.lastName || !row.email || !row.accountId) {
                  console.error("Skipping row with missing required fields:", row);
                  errorCount++;
                  continue;
                }
                
                // Validate email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(row.email)) {
                  console.error("Skipping row with invalid email:", row.email);
                  errorCount++;
                  continue;
                }
                
                await createContact.mutateAsync({
                  firstName: row.firstName.trim(),
                  lastName: row.lastName.trim(),
                  email: row.email.trim().toLowerCase(),
                  phone: row.phone?.trim() || undefined,
                  title: row.title?.trim() || undefined,
                  accountId: parseInt(row.accountId),
                });
              }
              successCount++;
            } catch (error) {
              console.error("Error importing row:", error);
              errorCount++;
            }
          }

          setImporting(false);
          setFile(null);

          if (successCount > 0) {
            toast.success(`Imported ${successCount} ${type} successfully`);
          }
          if (errorCount > 0) {
            toast.error(`Failed to import ${errorCount} ${type}`);
          }

          // Refresh the page to show new data
          window.location.reload();
        } catch (error) {
          setImporting(false);
          toast.error(`Import failed: ${error}`);
        }
      },
      error: (error) => {
        setImporting(false);
        toast.error(`Failed to parse CSV: ${error.message}`);
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>CSV Import/Export</CardTitle>
        <CardDescription>
          Bulk import or export {type} data using CSV files
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export to CSV
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="csv-file">Import from CSV</Label>
          <div className="flex gap-2">
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={importing}
            />
            <Button onClick={handleImport} disabled={!file || importing}>
              <Upload className="mr-2 h-4 w-4" />
              {importing ? "Importing..." : "Import"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            CSV file should include headers: {type === "leads" 
              ? "firstName, lastName, email, phone, company, title, leadSource, status, segment, score, notes"
              : "firstName, lastName, email, phone, title, accountId"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
