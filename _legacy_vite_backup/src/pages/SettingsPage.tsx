import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Server, Mail, Lock, Save, Eye, EyeOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SettingsPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [smtpConfig, setSmtpConfig] = useState({
    host: "",
    port: "587",
    email: "",
    password: "",
  });

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your SMTP configuration has been saved successfully.",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Configure your SMTP and account settings</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* SMTP Configuration */}
        <Card className="shadow-soft border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              SMTP Configuration
            </CardTitle>
            <CardDescription>
              Configure your email server settings for sending campaigns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="smtp-host">SMTP Host</Label>
              <Input
                id="smtp-host"
                placeholder="smtp.gmail.com"
                value={smtpConfig.host}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp-port">SMTP Port</Label>
              <Input
                id="smtp-port"
                type="number"
                placeholder="587"
                value={smtpConfig.port}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, port: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp-email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="smtp-email"
                  type="email"
                  placeholder="your@email.com"
                  className="pl-10"
                  value={smtpConfig.email}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp-password">App Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="smtp-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••••••"
                  className="pl-10 pr-10"
                  value={smtpConfig.password}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2 text-foreground">Security Notice</h4>
              <p className="text-xs text-muted-foreground">
                For Gmail users, you need to generate an App Password instead of using your regular password. 
                Visit your Google Account settings to create one.
              </p>
            </div>

            <Button onClick={handleSave} className="w-full bg-gradient-primary hover:opacity-90">
              <Save className="mr-2 h-4 w-4" />
              Save SMTP Settings
            </Button>
          </CardContent>
        </Card>

        {/* Additional Settings */}
        <div className="space-y-6">
          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <CardTitle>Email Sending Limits</CardTitle>
              <CardDescription>Configure rate limiting for bulk sending</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="batch-size">Batch Size</Label>
                <Input
                  id="batch-size"
                  type="number"
                  placeholder="100"
                  defaultValue="100"
                />
                <p className="text-xs text-muted-foreground">
                  Number of emails to send per batch
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delay">Delay Between Batches (seconds)</Label>
                <Input
                  id="delay"
                  type="number"
                  placeholder="5"
                  defaultValue="5"
                />
                <p className="text-xs text-muted-foreground">
                  Wait time between sending batches to avoid rate limits
                </p>
              </div>

              <Button variant="outline" className="w-full">
                Update Limits
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-soft border-border/50 bg-accent/5">
            <CardHeader>
              <CardTitle>Connection Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <span className="text-sm font-medium">SMTP Server</span>
                  <span className="text-sm text-muted-foreground">Not configured</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <span className="text-sm font-medium">Last Test</span>
                  <span className="text-sm text-muted-foreground">Never</span>
                </div>
                <Button variant="outline" className="w-full">
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
