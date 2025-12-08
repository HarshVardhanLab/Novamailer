import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Code, Eye, Save } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

const Templates = () => {
  const [templateName, setTemplateName] = useState("New Template");
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState(`<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1e3a8a, #2563eb); color: white; padding: 30px; text-align: center; }
    .content { background: white; padding: 30px; }
    .button { background: #0ea5e9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Hello {{name}}!</h1>
    </div>
    <div class="content">
      <p>Thank you for being part of our community.</p>
      <p>Your email: {{email}}</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="#" class="button">Click Here</a>
      </p>
    </div>
  </div>
</body>
</html>`);

  const handleSave = () => {
    toast({
      title: "Template saved",
      description: "Your email template has been saved successfully.",
    });
  };

  const savedTemplates = [
    { id: 1, name: "Welcome Email", variables: ["name", "email"] },
    { id: 2, name: "Newsletter", variables: ["name", "topic"] },
    { id: 3, name: "Promotional", variables: ["name", "discount_code"] },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Email Templates</h1>
          <p className="text-muted-foreground">Create and manage HTML email templates with dynamic variables</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Template Editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Template Editor</CardTitle>
                <Button onClick={handleSave} className="bg-gradient-primary">
                  <Save className="mr-2 h-4 w-4" />
                  Save Template
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter template name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject (use {{variables}})"
                />
              </div>

              <Tabs defaultValue="code" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="code">
                    <Code className="mr-2 h-4 w-4" />
                    HTML Code
                  </TabsTrigger>
                  <TabsTrigger value="preview">
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="code" className="mt-4">
                  <Textarea
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    className="font-mono text-sm min-h-[400px]"
                    placeholder="Enter your HTML template here..."
                  />
                </TabsContent>
                
                <TabsContent value="preview" className="mt-4">
                  <div className="border border-border rounded-lg p-4 bg-muted/30 min-h-[400px] overflow-auto">
                    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2 text-foreground">Available Variables:</h4>
                <div className="flex flex-wrap gap-2">
                  {["{{name}}", "{{email}}", "{{company}}", "{{team_id}}"].map((variable) => (
                    <code key={variable} className="px-2 py-1 bg-accent/20 rounded text-sm text-accent-foreground">
                      {variable}
                    </code>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  These variables will be replaced with actual values from your CSV data
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Saved Templates */}
        <div className="space-y-4">
          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Saved Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {savedTemplates.map((template) => (
                <button
                  key={template.id}
                  className="w-full p-4 text-left rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/50"
                >
                  <h3 className="font-semibold text-foreground mb-2">{template.name}</h3>
                  <div className="flex flex-wrap gap-1">
                    {template.variables.map((variable) => (
                      <span key={variable} className="text-xs px-2 py-0.5 bg-accent/20 text-accent rounded">
                        {`{{${variable}}}`}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
              
              <Button variant="outline" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Create New
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-soft border-border/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• Use <code className="text-accent">{'{{variable}}'}</code> syntax for dynamic content</p>
              <p>• Keep templates under 600px wide for best compatibility</p>
              <p>• Test your templates across different email clients</p>
              <p>• Use inline CSS for better rendering</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Templates;
