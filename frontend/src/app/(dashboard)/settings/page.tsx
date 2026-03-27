"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import {
    CheckCircle, XCircle, Loader2, Wifi, Inbox, Send, RefreshCw,
    Mail, ChevronDown, ChevronUp, Reply
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

const formSchema = z.object({
    host: z.string().min(1, "Host is required"),
    port: z.coerce.number().min(1, "Port is required"),
    username: z.string().min(1, "Username is required"),
    password: z.string().optional(),
    from_email: z.string().email("Invalid email"),
})

// Common SMTP presets
const SMTP_PRESETS = [
    { label: "Gmail", host: "smtp.gmail.com", port: 587 },
    { label: "Outlook / Hotmail", host: "smtp-mail.outlook.com", port: 587 },
    { label: "Yahoo", host: "smtp.mail.yahoo.com", port: 587 },
    { label: "SendGrid", host: "smtp.sendgrid.net", port: 587 },
    { label: "Mailgun", host: "smtp.mailgun.org", port: 587 },
    { label: "Amazon SES", host: "email-smtp.us-east-1.amazonaws.com", port: 587 },
]

// Common IMAP presets
const IMAP_PRESETS: Record<string, { host: string; port: number }> = {
    "smtp.gmail.com": { host: "imap.gmail.com", port: 993 },
    "smtp-mail.outlook.com": { host: "outlook.office365.com", port: 993 },
    "smtp.mail.yahoo.com": { host: "imap.mail.yahoo.com", port: 993 },
}

export default function SettingsPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [testing, setTesting] = useState(false)
    const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)
    const [hasExistingConfig, setHasExistingConfig] = useState(false)

    // Inbox state
    const [inboxOpen, setInboxOpen] = useState(false)
    const [imapHost, setImapHost] = useState("")
    const [imapPort, setImapPort] = useState(993)
    const [imapUser, setImapUser] = useState("")
    const [imapPass, setImapPass] = useState("")
    const [fetchingInbox, setFetchingInbox] = useState(false)
    const [messages, setMessages] = useState<any[]>([])
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [replyTo, setReplyTo] = useState<any>(null)
    const [replyBody, setReplyBody] = useState("")
    const [sendingReply, setSendingReply] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { host: "", port: 587, username: "", password: "", from_email: "" },
    })

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get("/smtp")
                setHasExistingConfig(true)
                form.reset({ ...res.data, password: "" })
                // Auto-fill IMAP from SMTP host
                const smtpHost = res.data.host
                const preset = IMAP_PRESETS[smtpHost]
                if (preset) { setImapHost(preset.host); setImapPort(preset.port) }
                setImapUser(res.data.username)
            } catch {
                setHasExistingConfig(false)
            }
        }
        fetchSettings()
    }, [form])

    const applyPreset = (preset: typeof SMTP_PRESETS[0]) => {
        form.setValue("host", preset.host)
        form.setValue("port", preset.port)
        const imap = IMAP_PRESETS[preset.host]
        if (imap) { setImapHost(imap.host); setImapPort(imap.port) }
        toast.success(`${preset.label} settings applied`)
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        setTestResult(null)
        try {
            const payload: any = { ...values }
            if (hasExistingConfig && !values.password) delete payload.password
            await api.post("/smtp", payload)
            toast.success("Settings saved!")
            setHasExistingConfig(true)
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to save settings")
        } finally {
            setIsLoading(false)
        }
    }

    const handleTestConnection = async () => {
        setTesting(true)
        setTestResult(null)
        try {
            const res = await api.post("/smtp/test")
            setTestResult({ ok: true, msg: res.data.message })
            toast.success(res.data.message)
        } catch (e: any) {
            const msg = e.response?.data?.detail || "Connection failed"
            setTestResult({ ok: false, msg })
            toast.error(msg)
        } finally {
            setTesting(false)
        }
    }

    const handleFetchInbox = async () => {
        if (!imapHost || !imapUser || !imapPass) {
            toast.error("Fill in IMAP host, username, and password")
            return
        }
        setFetchingInbox(true)
        try {
            const res = await api.post("/smtp/inbox", {
                host: imapHost,
                port: imapPort,
                username: imapUser,
                password: imapPass,
            })
            setMessages(res.data.messages)
            toast.success(`Loaded ${res.data.total} messages`)
        } catch (e: any) {
            toast.error(e.response?.data?.detail || "Failed to fetch inbox")
        } finally {
            setFetchingInbox(false)
        }
    }

    const handleSendReply = async () => {
        if (!replyBody.trim()) { toast.error("Reply body is empty"); return }
        setSendingReply(true)
        try {
            await api.post("/smtp/inbox/send-reply", {
                to: replyTo.from,
                subject: `Re: ${replyTo.subject}`,
                body: `<p>${replyBody.replace(/\n/g, "<br/>")}</p>`,
            })
            toast.success("Reply sent!")
            setReplyTo(null)
            setReplyBody("")
        } catch (e: any) {
            toast.error(e.response?.data?.detail || "Failed to send reply")
        } finally {
            setSendingReply(false)
        }
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight">Settings</h2>

            {/* Quick presets */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Setup</CardTitle>
                    <CardDescription>One-click fill for common email providers</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {SMTP_PRESETS.map((p) => (
                            <Button key={p.label} variant="outline" size="sm" onClick={() => applyPreset(p)}>
                                {p.label}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* SMTP config */}
            <Card>
                <CardHeader>
                    <CardTitle>SMTP Configuration</CardTitle>
                    <CardDescription>Outgoing email server settings</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="host" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>SMTP Host</FormLabel>
                                        <FormControl><Input placeholder="smtp.gmail.com" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="port" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Port</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="587" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 587)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                            <FormField control={form.control} name="username" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Username</FormLabel>
                                    <FormControl><Input placeholder="user@example.com" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="password" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password / App Password</FormLabel>
                                    <FormControl><Input type="password" placeholder={hasExistingConfig ? "Leave blank to keep current" : "••••••••"} {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="from_email" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>From Email</FormLabel>
                                    <FormControl><Input placeholder="no-reply@example.com" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <div className="flex gap-3 items-center pt-1">
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Settings"}
                                </Button>
                                {hasExistingConfig && (
                                    <Button type="button" variant="outline" onClick={handleTestConnection} disabled={testing}>
                                        {testing
                                            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Testing...</>
                                            : <><Wifi className="mr-2 h-4 w-4" />Test Connection</>}
                                    </Button>
                                )}
                            </div>

                            {/* Test result badge */}
                            {testResult && (
                                <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${testResult.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                                    {testResult.ok
                                        ? <CheckCircle className="h-4 w-4 shrink-0" />
                                        : <XCircle className="h-4 w-4 shrink-0" />}
                                    {testResult.msg}
                                </div>
                            )}
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {/* Inbox manager */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Inbox className="h-5 w-5" /> Inbox Manager
                    </CardTitle>
                    <CardDescription>Read and reply to emails via IMAP</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label>IMAP Host</Label>
                            <Input placeholder="imap.gmail.com" value={imapHost} onChange={e => setImapHost(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label>Port</Label>
                            <Input type="number" value={imapPort} onChange={e => setImapPort(parseInt(e.target.value) || 993)} />
                        </div>
                        <div className="space-y-1">
                            <Label>Username</Label>
                            <Input placeholder="user@example.com" value={imapUser} onChange={e => setImapUser(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label>Password / App Password</Label>
                            <Input type="password" placeholder="••••••••" value={imapPass} onChange={e => setImapPass(e.target.value)} />
                        </div>
                    </div>
                    <Button onClick={handleFetchInbox} disabled={fetchingInbox} variant="outline">
                        {fetchingInbox
                            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading inbox...</>
                            : <><RefreshCw className="mr-2 h-4 w-4" />Load Inbox</>}
                    </Button>

                    {/* Messages list */}
                    {messages.length > 0 && (
                        <div className="border rounded-lg divide-y max-h-[500px] overflow-y-auto">
                            {messages.map((msg: any) => (
                                <div key={msg.id} className="p-3 hover:bg-accent/50">
                                    <button
                                        className="w-full text-left"
                                        onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{msg.subject}</p>
                                                <p className="text-xs text-muted-foreground truncate">{msg.from}</p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-xs text-muted-foreground">{new Date(msg.date).toLocaleDateString()}</span>
                                                {expandedId === msg.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </div>
                                        </div>
                                    </button>

                                    {expandedId === msg.id && (
                                        <div className="mt-3 space-y-3">
                                            <div
                                                className="text-sm bg-white border rounded p-3 max-h-64 overflow-y-auto"
                                                dangerouslySetInnerHTML={{ __html: msg.body }}
                                            />
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => { setReplyTo(msg); setReplyBody("") }}
                                            >
                                                <Reply className="mr-2 h-3 w-3" /> Reply
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {messages.length === 0 && !fetchingInbox && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Enter your IMAP credentials and click "Load Inbox" to view emails
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Reply dialog */}
            <Dialog open={!!replyTo} onOpenChange={() => setReplyTo(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Reply to {replyTo?.from}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="text-sm text-muted-foreground">
                            Re: {replyTo?.subject}
                        </div>
                        <Textarea
                            placeholder="Write your reply..."
                            className="min-h-[150px]"
                            value={replyBody}
                            onChange={e => setReplyBody(e.target.value)}
                        />
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setReplyTo(null)}>Cancel</Button>
                            <Button onClick={handleSendReply} disabled={sendingReply}>
                                {sendingReply
                                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
                                    : <><Send className="mr-2 h-4 w-4" />Send Reply</>}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
