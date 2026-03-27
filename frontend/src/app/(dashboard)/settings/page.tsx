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
import { toast } from "sonner"
import {
    CheckCircle, XCircle, Loader2, Wifi, Inbox,
} from "lucide-react"
import { Label } from "@/components/ui/label"

const formSchema = z.object({
    host: z.string().min(1, "Host is required").max(255),
    port: z.number().min(1, "Port must be positive").max(65535, "Invalid port number"),
    username: z.string().min(1, "Username is required").max(255),
    password: z.string().optional(),
    from_email: z.string().email("Invalid email").max(255),
})

type FormValues = z.infer<typeof formSchema>

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

    // OAuth state
    const [oauthConfig, setOauthConfig] = useState<any>(null)
    const [oauthLoading, setOauthLoading] = useState(false)
    const [isOAuthConnected, setIsOAuthConnected] = useState(false)
    const [oauthProvider, setOauthProvider] = useState<string | null>(null)

    // IMAP config (saved to DB)
    const [imapHost, setImapHost] = useState("")
    const [imapPort, setImapPort] = useState(993)
    const [imapUser, setImapUser] = useState("")
    const [imapPass, setImapPass] = useState("")
    const [imapHasExisting, setImapHasExisting] = useState(false)
    const [savingImap, setSavingImap] = useState(false)
    const [testingImap, setTestingImap] = useState(false)
    const [imapTestResult, setImapTestResult] = useState<{ ok: boolean; msg: string } | null>(null)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { host: "", port: 587, username: "", password: "", from_email: "" },
    })

    useEffect(() => {
        const fetchSettings = async () => {
            // Load OAuth config
            try {
                const oauthRes = await api.get("/oauth/config")
                setOauthConfig(oauthRes.data)
            } catch (e) {
                console.error("Failed to load OAuth config:", e)
            }

            // Load SMTP config
            try {
                const res = await api.get("/smtp")
                setHasExistingConfig(true)
                form.reset({ ...res.data, password: "" })
                
                // Check if using OAuth
                if (res.data.auth_type === "oauth") {
                    setIsOAuthConnected(true)
                    setOauthProvider(res.data.oauth_provider)
                }
                
                // Auto-fill IMAP host from SMTP preset
                const preset = IMAP_PRESETS[res.data.host]
                if (preset && !imapHost) { setImapHost(preset.host); setImapPort(preset.port) }
                if (!imapUser) setImapUser(res.data.username)
            } catch {
                setHasExistingConfig(false)
            }
            // Load saved IMAP config
            try {
                const res = await api.get("/smtp/imap")
                setImapHost(res.data.host)
                setImapPort(res.data.port)
                setImapUser(res.data.username)
                setImapHasExisting(true)
            } catch {
                setImapHasExisting(false)
            }
        }
        fetchSettings()
        
        // Check for OAuth callback
        const params = new URLSearchParams(window.location.search)
        if (params.get("oauth_success") === "true") {
            const provider = params.get("provider")
            toast.success(`Successfully connected with ${provider === "google" ? "Google" : "Microsoft"}!`)
            window.history.replaceState({}, "", "/settings")
            // Reload settings
            setTimeout(() => fetchSettings(), 500)
        } else if (params.get("oauth_error")) {
            toast.error(`OAuth error: ${params.get("oauth_error")}`)
            window.history.replaceState({}, "", "/settings")
        }
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

    const handleSaveImap = async () => {
        if (!imapHost || !imapUser) { toast.error("IMAP host and username are required"); return }
        if (!imapHasExisting && !imapPass) { toast.error("Password is required"); return }
        setSavingImap(true)
        try {
            await api.post("/smtp/imap", { host: imapHost, port: imapPort, username: imapUser, password: imapPass })
            toast.success("IMAP settings saved! Mail will auto-connect next time.")
            setImapHasExisting(true)
            setImapPass("")
            // Clear sessionStorage so it reloads from DB
            sessionStorage.removeItem("novamailer_imap_creds")
        } catch (e: any) {
            toast.error(e.response?.data?.detail || "Failed to save IMAP settings")
        } finally {
            setSavingImap(false)
        }
    }

    const handleTestImap = async () => {
        setTestingImap(true)
        setImapTestResult(null)
        try {
            const res = await api.post("/smtp/imap/test")
            setImapTestResult({ ok: true, msg: res.data.message })
            toast.success(res.data.message)
        } catch (e: any) {
            const msg = e.response?.data?.detail || "IMAP connection failed"
            setImapTestResult({ ok: false, msg })
            toast.error(msg)
        } finally {
            setTestingImap(false)
        }
    }

    const handleOAuthConnect = async (provider: "google" | "microsoft") => {
        setOauthLoading(true)
        try {
            const res = await api.post("/oauth/init", { provider })
            // Open OAuth in system browser (for desktop app)
            const width = 600
            const height = 700
            const left = window.screen.width / 2 - width / 2
            const top = window.screen.height / 2 - height / 2
            
            const popup = window.open(
                res.data.auth_url,
                "OAuth",
                `width=${width},height=${height},left=${left},top=${top}`
            )
            
            // Listen for OAuth callback message
            const handleMessage = (event: MessageEvent) => {
                if (event.data.type === "oauth_success") {
                    toast.success(`Successfully connected with ${event.data.provider === "google" ? "Google" : "Microsoft"}!`)
                    window.removeEventListener("message", handleMessage)
                    if (popup) popup.close()
                    // Reload settings
                    setTimeout(() => window.location.reload(), 500)
                } else if (event.data.type === "oauth_error") {
                    toast.error(`OAuth error: ${event.data.error}`)
                    window.removeEventListener("message", handleMessage)
                    if (popup) popup.close()
                }
            }
            
            window.addEventListener("message", handleMessage)
            
            // Fallback: Check if popup was closed manually
            const checkClosed = setInterval(() => {
                if (popup && popup.closed) {
                    clearInterval(checkClosed)
                    window.removeEventListener("message", handleMessage)
                    setOauthLoading(false)
                }
            }, 500)
            
        } catch (e: any) {
            toast.error(e.response?.data?.detail || "Failed to initiate OAuth")
        } finally {
            setOauthLoading(false)
        }
    }

    const handleOAuthDisconnect = async () => {
        try {
            await api.post("/oauth/disconnect")
            setIsOAuthConnected(false)
            setOauthProvider(null)
            toast.success("OAuth disconnected. You can now use password authentication.")
            // Reload settings
            window.location.reload()
        } catch (e: any) {
            toast.error(e.response?.data?.detail || "Failed to disconnect OAuth")
        }
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight">Settings</h2>

            {/* OAuth One-Click Setup */}
            {oauthConfig && (oauthConfig.google?.enabled || oauthConfig.microsoft?.enabled) && (
                <Card className="border-2 border-blue-200 bg-blue-50/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wifi className="h-5 w-5 text-blue-600" />
                            One-Click Email Setup (OAuth)
                        </CardTitle>
                        <CardDescription>
                            {isOAuthConnected ? (
                                <span className="text-green-600 font-medium">
                                    ✓ Connected with {oauthProvider === "google" ? "Google" : "Microsoft"}
                                </span>
                            ) : (
                                "Automatically configure both SMTP and IMAP with a single click. More secure than app passwords!"
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isOAuthConnected ? (
                            <div className="space-y-3">
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm text-green-800">
                                        Your email is connected via OAuth. Both SMTP and IMAP are configured automatically.
                                    </p>
                                </div>
                                <Button variant="outline" onClick={handleOAuthDisconnect} className="text-red-600">
                                    Disconnect OAuth
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    Choose your email provider to connect securely:
                                </p>
                                <div className="flex gap-3">
                                    {oauthConfig.google?.enabled && (
                                        <Button
                                            onClick={() => handleOAuthConnect("google")}
                                            disabled={oauthLoading}
                                            className="flex-1"
                                        >
                                            {oauthLoading ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                                </svg>
                                            )}
                                            Connect with Google
                                        </Button>
                                    )}
                                    {oauthConfig.microsoft?.enabled && (
                                        <Button
                                            onClick={() => handleOAuthConnect("microsoft")}
                                            disabled={oauthLoading}
                                            className="flex-1"
                                            variant="outline"
                                        >
                                            {oauthLoading ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                                    <path fill="#f25022" d="M1 1h10v10H1z"/>
                                                    <path fill="#00a4ef" d="M13 1h10v10H13z"/>
                                                    <path fill="#7fba00" d="M1 13h10v10H1z"/>
                                                    <path fill="#ffb900" d="M13 13h10v10H13z"/>
                                                </svg>
                                            )}
                                            Connect with Microsoft
                                        </Button>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    OAuth is more secure and doesn't require app passwords. Your credentials are never stored.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Manual Setup Divider */}
            {!isOAuthConnected && oauthConfig && (oauthConfig.google?.enabled || oauthConfig.microsoft?.enabled) && (
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or configure manually</span>
                    </div>
                </div>
            )}

            {/* Quick presets */}
            {!isOAuthConnected && (
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
            )}

            {/* SMTP config */}
            {!isOAuthConnected && (
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
            )}

            {/* IMAP Configuration */}
            {!isOAuthConnected && (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Inbox className="h-5 w-5" /> IMAP Configuration
                    </CardTitle>
                    <CardDescription>
                        Save your incoming mail settings once — the Mail section will auto-connect every time.
                        {imapHasExisting && <span className="ml-2 text-green-600 font-medium">✓ Saved</span>}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2 space-y-1">
                            <Label>IMAP Host</Label>
                            <Input placeholder="imap.gmail.com" value={imapHost} onChange={e => setImapHost(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label>Port</Label>
                            <Input type="number" value={imapPort} onChange={e => setImapPort(parseInt(e.target.value) || 993)} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label>Username / Email</Label>
                        <Input placeholder="you@gmail.com" value={imapUser} onChange={e => setImapUser(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <Label>Password / App Password</Label>
                        <Input
                            type="password"
                            placeholder={imapHasExisting ? "Leave blank to keep current password" : "••••••••"}
                            value={imapPass}
                            onChange={e => setImapPass(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3 items-center">
                        <Button onClick={handleSaveImap} disabled={savingImap}>
                            {savingImap ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save IMAP Settings"}
                        </Button>
                        {imapHasExisting && (
                            <Button variant="outline" onClick={handleTestImap} disabled={testingImap}>
                                {testingImap
                                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Testing...</>
                                    : <><Wifi className="mr-2 h-4 w-4" />Test IMAP</>}
                            </Button>
                        )}
                    </div>
                    {imapTestResult && (
                        <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${imapTestResult.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                            {imapTestResult.ok ? <CheckCircle className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
                            {imapTestResult.msg}
                        </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                        For Gmail, generate an App Password at myaccount.google.com/apppasswords
                    </p>
                </CardContent>
            </Card>
            )}
        </div>
    )
}
