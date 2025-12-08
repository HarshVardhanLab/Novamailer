import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Mail, Calendar, Users, TrendingUp } from "lucide-react";

const Campaigns = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const campaigns = [
    {
      id: 1,
      name: "Spring Sale 2024",
      status: "completed",
      sent: 5432,
      opens: 3241,
      clicks: 876,
      date: "2024-03-15",
    },
    {
      id: 2,
      name: "Newsletter #45",
      status: "in-progress",
      sent: 3241,
      opens: 1523,
      clicks: 432,
      date: "2024-03-18",
    },
    {
      id: 3,
      name: "Product Launch",
      status: "scheduled",
      sent: 0,
      opens: 0,
      clicks: 0,
      date: "2024-03-25",
    },
    {
      id: 4,
      name: "Customer Feedback",
      status: "completed",
      sent: 2150,
      opens: 1876,
      clicks: 654,
      date: "2024-03-10",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success/20 text-success hover:bg-success/30";
      case "in-progress": return "bg-accent/20 text-accent hover:bg-accent/30";
      case "scheduled": return "bg-warning/20 text-warning hover:bg-warning/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Campaigns</h1>
          <p className="text-muted-foreground">Manage and track your email campaigns</p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90 transition-opacity">
          <Plus className="mr-2 h-4 w-4" />
          New Campaign
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search campaigns..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="shadow-soft hover:shadow-medium transition-all duration-300 border-border/50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{campaign.name}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(campaign.date).toLocaleDateString()}
                  </div>
                </div>
                <Badge className={getStatusColor(campaign.status)}>
                  {campaign.status.replace("-", " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    Sent
                  </div>
                  <p className="text-2xl font-bold text-foreground">{campaign.sent.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Opens
                  </div>
                  <p className="text-2xl font-bold text-foreground">{campaign.opens.toLocaleString()}</p>
                  {campaign.sent > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {((campaign.opens / campaign.sent) * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    Clicks
                  </div>
                  <p className="text-2xl font-bold text-foreground">{campaign.clicks.toLocaleString()}</p>
                  {campaign.sent > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {((campaign.clicks / campaign.sent) * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
                <div className="flex items-end">
                  <Button variant="outline" className="w-full">View Details</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Campaigns;
