import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Send, TrendingUp, AlertCircle } from "lucide-react";

const Dashboard = () => {
  const stats = [
    {
      title: "Total Campaigns",
      value: "24",
      change: "+12%",
      icon: Mail,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      title: "Emails Sent",
      value: "15,847",
      change: "+23%",
      icon: Send,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "Success Rate",
      value: "98.5%",
      change: "+2.1%",
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Failed Emails",
      value: "238",
      change: "-15%",
      icon: AlertCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ];

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your email marketing overview.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card 
            key={stat.title} 
            className="shadow-soft hover:shadow-medium transition-all duration-300 border-border/50 hover:border-accent/30"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <p className={`text-sm mt-1 ${stat.change.startsWith('+') ? 'text-success' : 'text-destructive'}`}>
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-soft border-border/50">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { campaign: "Spring Sale 2024", status: "Completed", emails: "5,432", time: "2 hours ago" },
                { campaign: "Newsletter #45", status: "In Progress", emails: "3,241", time: "5 hours ago" },
                { campaign: "Product Launch", status: "Scheduled", emails: "8,150", time: "Tomorrow" },
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium text-foreground">{activity.campaign}</p>
                    <p className="text-sm text-muted-foreground">{activity.emails} emails · {activity.time}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    activity.status === "Completed" ? "bg-success/20 text-success" :
                    activity.status === "In Progress" ? "bg-accent/20 text-accent" :
                    "bg-warning/20 text-warning"
                  }`}>
                    {activity.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/50">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <button className="p-4 text-left rounded-lg bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity">
                <h3 className="font-semibold mb-1">Create New Campaign</h3>
                <p className="text-sm opacity-90">Start a new email marketing campaign</p>
              </button>
              <button className="p-4 text-left rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors">
                <h3 className="font-semibold text-foreground mb-1">Upload CSV</h3>
                <p className="text-sm text-muted-foreground">Import contacts from CSV file</p>
              </button>
              <button className="p-4 text-left rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                <h3 className="font-semibold text-foreground mb-1">Configure SMTP</h3>
                <p className="text-sm text-muted-foreground">Set up your email server settings</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
