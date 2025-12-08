import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Mail, TrendingUp, Shield, Zap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="flex items-center justify-center gap-3 mb-8 animate-in fade-in duration-1000">
            <div className="p-4 bg-gradient-accent rounded-2xl shadow-strong">
              <Sparkles className="h-12 w-12 text-accent-foreground" />
            </div>
            <h1 className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              NovaMailer
            </h1>
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold text-foreground leading-tight animate-in fade-in duration-1000" style={{ animationDelay: "200ms" }}>
            Professional Email Marketing
            <br />
            <span className="bg-gradient-accent bg-clip-text text-transparent">Made Simple</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-in fade-in duration-1000" style={{ animationDelay: "400ms" }}>
            Send bulk emails with confidence. Configure SMTP, create dynamic HTML templates, 
            import contacts from CSV, and track campaign performance—all in one powerful platform.
          </p>

          <div className="flex gap-4 justify-center animate-in fade-in duration-1000" style={{ animationDelay: "600ms" }}>
            <Button 
              size="lg" 
              className="bg-gradient-primary hover:opacity-90 transition-all duration-300 text-lg px-8 py-6 shadow-medium hover:shadow-strong"
              onClick={() => navigate("/auth")}
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6"
              onClick={() => navigate("/auth")}
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-24 max-w-6xl mx-auto">
          {[
            {
              icon: Mail,
              title: "SMTP Integration",
              description: "Configure your email server with secure SMTP credentials",
              color: "text-chart-1",
              bgColor: "bg-chart-1/10",
            },
            {
              icon: TrendingUp,
              title: "Campaign Analytics",
              description: "Track opens, clicks, and delivery rates in real-time",
              color: "text-chart-2",
              bgColor: "bg-chart-2/10",
            },
            {
              icon: Shield,
              title: "Secure & Encrypted",
              description: "Your SMTP credentials are encrypted and stored securely",
              color: "text-success",
              bgColor: "bg-success/10",
            },
            {
              icon: Zap,
              title: "Bulk Sending",
              description: "Send thousands of personalized emails with CSV import",
              color: "text-warning",
              bgColor: "bg-warning/10",
            },
          ].map((feature, index) => (
            <div
              key={feature.title}
              className="p-6 rounded-2xl bg-card border border-border/50 shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1 animate-in fade-in duration-1000"
              style={{ animationDelay: `${800 + index * 100}ms` }}
            >
              <div className={`p-3 rounded-xl ${feature.bgColor} w-fit mb-4`}>
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-4xl mx-auto">
          {[
            { label: "Delivery Rate", value: "99.9%" },
            { label: "Emails Sent", value: "10M+" },
            { label: "Active Users", value: "50K+" },
          ].map((stat, index) => (
            <div 
              key={stat.label}
              className="text-center p-8 rounded-2xl bg-card border border-border/50 shadow-soft animate-in fade-in duration-1000"
              style={{ animationDelay: `${1200 + index * 100}ms` }}
            >
              <div className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
