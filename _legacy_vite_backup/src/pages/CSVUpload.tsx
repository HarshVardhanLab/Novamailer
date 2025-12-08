import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const CSVUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Simulate CSV parsing
      const mockData = [
        { name: "John Doe", email: "john@example.com", company: "Acme Inc" },
        { name: "Jane Smith", email: "jane@example.com", company: "Tech Corp" },
        { name: "Bob Johnson", email: "bob@example.com", company: "Startup XYZ" },
      ];
      setCsvData(mockData);
      setColumns(Object.keys(mockData[0]));
      toast({
        title: "CSV file loaded",
        description: `Successfully loaded ${mockData.length} records`,
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">CSV Upload</h1>
        <p className="text-muted-foreground">Upload and map CSV data for bulk email campaigns</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload Section */}
        <Card className="shadow-soft border-border/50">
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-accent/50 transition-colors">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <Label htmlFor="csv-upload" className="cursor-pointer">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    CSV files only (max 10MB)
                  </p>
                </div>
                <Input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </Label>
            </div>

            {file && (
              <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/30 rounded-lg">
                <FileText className="h-5 w-5 text-success" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
            )}

            <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                CSV Format Requirements
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                <li>First row must contain column headers</li>
                <li>Include at least an email column</li>
                <li>UTF-8 encoding recommended</li>
                <li>Max 100,000 rows per file</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Column Mapping */}
        <Card className="shadow-soft border-border/50">
          <CardHeader>
            <CardTitle>Column Mapping</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {columns.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Map your CSV columns to template variables
                </p>
                <div className="space-y-3">
                  {columns.map((column) => (
                    <div key={column} className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label className="text-sm text-muted-foreground">CSV Column</Label>
                        <div className="mt-1 px-3 py-2 bg-muted/50 rounded-md">
                          <code className="text-sm font-medium text-foreground">{column}</code>
                        </div>
                      </div>
                      <div className="text-muted-foreground">→</div>
                      <div className="flex-1">
                        <Label className="text-sm text-muted-foreground">Template Variable</Label>
                        <div className="mt-1 px-3 py-2 bg-accent/10 border border-accent/30 rounded-md">
                          <code className="text-sm font-medium text-accent">{`{{${column}}}`}</code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="w-full bg-gradient-primary hover:opacity-90 transition-opacity mt-6">
                  Process {csvData.length} Records
                </Button>
              </>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground">
                  Upload a CSV file to see column mapping
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Data */}
      {csvData.length > 0 && (
        <Card className="shadow-soft border-border/50">
          <CardHeader>
            <CardTitle>Data Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-semibold text-muted-foreground">#</th>
                    {columns.map((column) => (
                      <th key={column} className="text-left p-3 font-semibold text-muted-foreground">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvData.map((row, index) => (
                    <tr key={index} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-muted-foreground">{index + 1}</td>
                      {columns.map((column) => (
                        <td key={column} className="p-3 text-foreground">
                          {row[column]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CSVUpload;
