"use client"
import { useState } from "react"
import { IMAPCreds } from "@/hooks/useMailSession"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Mail } from "lucide-react"
import { toast } from "sonner"

const PRESETS: Record<string, { imapHost: string; imapPort: number }> = {
    "smtp.gmail.com": { imapHost: "imap.gmail.com", imapPort: 993 },
    "smtp-mail.outlook.com": { imapHost: "outlook.office365.com", imapPort: 993 },
    "smtp.mail.yahoo.com": { imapHost: "imap.mail.yahoo.com", imapPort: 993 },
}

const QUICK = [
    { label: "Gmail", imapHost: "imap.gmail.com", imapPort: 993 },
    { label: "Outlook", imapHost: "outlook.office365.com", imapPort: 993 },
    { label: "Yahoo", imapHost: "imap.mail.yahoo.com", imapPort: 993 },
]

interface Props { onConnect: (creds: IMAPCreds) => void }

export function MailConnect({ onConnect }: Props) {
    const [host, setHost] = useState("")
    const [port, setPort] = useState(993)
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)

    const handleConnect = async () => {
        if (!host || !username || !password) { toast.error("Fill in all fields"); return }
        setLoading(true)
        try {
            await api.post("/mail/connect", { host, port, username, password })
            onConnect({ host, port, username, password })
            toast.success("Connected to mailbox!")
        } catch (e: any) {
            toast.error(e.response?.data?.detail || "Connection failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Connect Your Mailbox</CardTitle>
                    <CardDescription>Enter your IMAP credentials to access your email. Credentials are stored in your browser session only.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2 flex-wrap">
                        {QUICK.map(q => (
                            <Button key={q.label} variant="outline" size="sm" onClick={() => { setHost(q.imapHost); setPort(q.imapPort) }}>
                                {q.label}
                            </Button>
                        ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2 space-y-1">
                            <Label>IMAP Host</Label>
                            <Input placeholder="imap.gmail.com" value={host} onChange={e => setHost(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label>Port</Label>
                            <Input type="number" value={port} onChange={e => setPort(parseInt(e.target.value) || 993)} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label>Email / Username</Label>
                        <Input placeholder="you@gmail.com" value={username} onChange={e => setUsername(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <Label>Password / App Password</Label>
                        <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleConnect()} />
                    </div>
                    <Button className="w-full" onClick={handleConnect} disabled={loading}>
                        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connecting...</> : "Connect Mailbox"}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                        For Gmail, use an App Password from your Google Account security settings.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
