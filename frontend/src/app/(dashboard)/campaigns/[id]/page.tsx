"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
    ArrowLeft, Send, Eye, Mail, CheckCircle, XCircle, Clock, Loader2,
    Paperclip, Upload, FileUp, Users, MousePointerClick, BarChart2,
    Smartphone, Monitor, Download, Copy
} from "lucide-react"
import Link from "next/link"

export default function CampaignDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [campaign, setCampaign] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [testEmail, setTestEmail] = useState("")
    const [sendingTest, setSendingTest] = useState(false)
    const [previewOpen, setPreviewOpen] = useState(false)
    const [preview, setPreview] = useState<any>(null)
    const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop")
    const [attachments, setAttachments] = useState<any[]>([])
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        if (!params.id) return
        fetchCampaignDetails()
        fetchAttachments()
    }, [params.id])

    useEffect(() => {
        if (!campaign || campaign.status !== "sending") return
        const interval = setInterval(fetchCampaignDetails, 3000)
        return () => clearInterval(interval)
    }, [campaign?.status])

    const fetchCampaignDetails = async () => {
        try {
            const res = await api.get(`/campaigns/${params.id}/details`)
            setCampaign(res.data)
        } catch (e: any) {
            toast.error(e.response?.data?.detail || "Failed to load campaign")
        } finally {
            setLoading(false)
        }
    }

    const fetchAttachments = async () => {
        if (!params.id) return
        try {
            const res = await api.get(`/campaigns/${params.id}/attachments`)
            setAttachments(res.data)
        } catch (e) {
            console.error(e)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return
        setUploading(true)
        try {
            for (const file of Array.from(files)) {
                if (file.size > 25 * 1024 * 1024) { toast.error(`${file.name} too large`); continue }
                const formData = new FormData()
                formData.append("file", file)
                await api.post(`/campaigns/${params.id}/attachments`, formData, { headers: { "Content-Type": "multipart/form-data" } })
                toast.success(`${file.name} uploaded`)
            }
            fetchAttachments()
        } catch (e: any) {
            toast.error(e.response?.data?.detail || "Upload failed")
        } finally {
            setUploading(false)
            e.target.value = ""
        }
    }

    const handleDeleteAttachment = async (id: number, name: string) => {
        if (!confirm(`Delete ${name}?`)) return
        try {
            await api.delete(`/campaigns/${params.id}/attachments/${id}`)
            toast.success("Attachment deleted")
            fetchAttachments()
        } catch (e: any) {
            toast.error(e.response?.data?.detail || "Failed to delete")
        }
    }

    const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.name.endsWith(".csv")) { toast.error("Please upload a CSV file"); return }
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append("file", file)
            const res = await api.post(`/campaigns/${params.id}/upload-csv`, formData, { headers: { "Content-Type": "multipart/form-data" } })
            toast.success(res.data.message || "Recipients uploaded")
            fetchCampaignDetails()
        } catch (e: any) {
            toast.error(e.response?.data?.detail || "Failed to upload CSV")
        } finally {
            setUploading(false)
            e.target.value = ""
        }
    }

    const handlePreview = async () => {
        try {
            const res = await api.post(`/campaigns/${params.id}/preview`)
            setPreview(res.data)
            setPreviewOpen(true)
        } catch (e: any) {
            toast.error(e.response?.data?.detail || "Failed to generate preview")
        }
    }

    const handleTestSend = async () => {
        if (!testEmail) { toast.error("Enter a test email address"); return }
        setSendingTest(true)
        try {
            await api.post(`/campaigns/${params.id}/test-send?test_email=${testEmail}`)
            toast.success(`Test email sent to ${testEmail}`)
            setTestEmail("")
        } catch (e: any) {
            toast.error(e.response?.data?.detail || "Failed to send test email")
        } finally {
            setSendingTest(false)
        }
    }

    const handleSendCampaign = async () => {
        if (!confirm(`Send to ${campaign.stats.pending} recipients?`)) return
        setSending(true)
        try {
            const res = await api.post(`/campaigns/${params.id}/send`)
            toast.success(res.data.message)
            fetchCampaignDetails()
        } catch (e: any) {
            toast.error(e.response?.data?.detail || "Failed to send campaign")
        } finally {
            setSending(false)
        }
    }

    const handleDuplicate = async () => {
        try {
            const res = await api.post(`/campaigns/${params.id}/duplicate`)
            toast.success(`Duplicated as "${res.data.name}"`)
            router.push(`/campaigns/${res.data.id}`)
        } catch (e: any) {
            toast.error("Failed to duplicate")
        }
    }

    const handleExport = async () => {
        try {
            const res = await api.get(`/campaigns/${params.id}/export`, { responseType: "blob" })
            const url = window.URL.createObjectURL(new Blob([res.data]))
            const a = document.createElement("a")
            a.href = url
            a.download = `campaign_${params.id}_report.csv`
            a.click()
            window.URL.revokeObjectURL(url)
        } catch {
            toast.error("Failed to export report")
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )

    if (!campaign) return (
        <div className="text-center py-12">
            <p className="text-muted-foreground">Campaign not found</p>
            <Button onClick={() => router.push("/campaigns")} className="mt-4">Back to Campaigns</Button>
        </div>
    )

    const stats = campaign.stats

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/campaigns">
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{campaign.name}</h2>
                        <p className="text-muted-foreground">{campaign.subject}</p>
                    </div>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                    <Button variant="outline" onClick={handlePreview}>
                        <Eye className="mr-2 h-4 w-4" /> Preview
                    </Button>
                    <Button variant="outline" onClick={handleDuplicate}>
                        <Copy className="mr-2 h-4 w-4" /> Duplicate
                    </Button>
                    {campaign.status === "completed" && (
                        <Button variant="outline" onClick={handleExport}>
                            <Download className="mr-2 h-4 w-4" /> Export
                        </Button>
                    )}
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Mail className="mr-2 h-4 w-4" /> Test Send
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Send Test Email</DialogTitle>
                                <DialogDescription>Verify your campaign before sending to all recipients</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="test-email">Test Email Address</Label>
                                    <Input id="test-email" type="email" placeholder="your@email.com" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleTestSend} disabled={sendingTest}>
                                    {sendingTest ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : <><Send className="mr-2 h-4 w-4" />Send Test</>}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    {stats.pending > 0 && campaign.status !== "sending" && (
                        <Button onClick={handleSendCampaign} disabled={sending}>
                            {sending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : <><Send className="mr-2 h-4 w-4" />Send Campaign</>}
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total</CardTitle>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{stats.total_recipients}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sent</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold text-green-600">{stats.sent}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold text-yellow-600">{stats.pending}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Failed</CardTitle>
                        <XCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold text-red-600">{stats.failed}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                        <BarChart2 className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold text-blue-600">{stats.open_rate}%</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                        <MousePointerClick className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold text-purple-600">{stats.click_rate}%</div></CardContent>
                </Card>
            </div>

            {/* Campaign Info */}
            <Card>
                <CardHeader><CardTitle>Campaign Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Status</p>
                            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${
                                campaign.status === "completed" ? "bg-green-100 text-green-800" :
                                campaign.status === "sending" ? "bg-blue-100 text-blue-800" :
                                campaign.status === "scheduled" ? "bg-purple-100 text-purple-800" :
                                campaign.status === "failed" ? "bg-red-100 text-red-800" :
                                "bg-gray-100 text-gray-800"
                            }`}>{campaign.status}</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Created</p>
                            <p className="mt-1">{new Date(campaign.created_at).toLocaleString()}</p>
                        </div>
                        {campaign.scheduled_at && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Scheduled For</p>
                                <p className="mt-1 text-purple-700 font-medium">{new Date(campaign.scheduled_at).toLocaleString()}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Attachments */}
            <Card>
                <CardHeader>
                    <CardTitle>Attachments</CardTitle>
                    <CardDescription>Upload files to send with this campaign</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Label htmlFor="file-upload" className="cursor-pointer">
                        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                            {uploading ? (
                                <div className="flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /><span>Uploading...</span></div>
                            ) : (
                                <>
                                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                    <p className="text-sm font-medium">Click to upload files</p>
                                    <p className="text-xs text-muted-foreground mt-1">Max 25MB per file</p>
                                </>
                            )}
                        </div>
                    </Label>
                    <Input id="file-upload" type="file" multiple className="hidden" onChange={handleFileUpload} disabled={uploading} />
                    {attachments.length > 0 && (
                        <div className="border rounded-lg divide-y">
                            {attachments.map((a: any) => (
                                <div key={a.id} className="flex items-center justify-between p-3">
                                    <div className="flex items-center gap-3">
                                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">{a.filename}</p>
                                            <p className="text-xs text-muted-foreground">{(a.file_size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteAttachment(a.id, a.filename)}>
                                        <XCircle className="h-4 w-4 text-red-600" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* CSV Upload */}
            <Card>
                <CardHeader>
                    <CardTitle>Upload Recipients</CardTitle>
                    <CardDescription>Upload a CSV file with recipient email addresses</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Label htmlFor="csv-upload" className="cursor-pointer">
                        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                            {uploading ? (
                                <div className="flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /><span>Uploading CSV...</span></div>
                            ) : (
                                <>
                                    <FileUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                    <p className="text-sm font-medium">Click to upload CSV file</p>
                                    <p className="text-xs text-muted-foreground mt-1">CSV must have an "email" column. Unsubscribed emails are skipped automatically.</p>
                                </>
                            )}
                        </div>
                    </Label>
                    <Input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} disabled={uploading} />
                    <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm font-medium mb-2">CSV Format Example:</p>
                        <pre className="text-xs bg-background p-2 rounded border overflow-x-auto">{`email,name,company\njohn@example.com,John Doe,Acme Corp`}</pre>
                    </div>
                </CardContent>
            </Card>

            {/* Recipients Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Recipients</CardTitle>
                            <CardDescription>Email recipients for this campaign</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{stats.total_recipients} total</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Data</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {campaign.recipients.length > 0 ? campaign.recipients.map((r: any) => (
                                    <TableRow key={r.id}>
                                        <TableCell className="font-medium">{r.email}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                                r.status === "sent" ? "bg-green-100 text-green-800" :
                                                r.status === "failed" ? "bg-red-100 text-red-800" :
                                                "bg-yellow-100 text-yellow-800"
                                            }`}>
                                                {r.status === "sent" && <CheckCircle className="h-3 w-3" />}
                                                {r.status === "failed" && <XCircle className="h-3 w-3" />}
                                                {r.status === "pending" && <Clock className="h-3 w-3" />}
                                                {r.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {r.data ? JSON.stringify(r.data).substring(0, 50) + "..." : "—"}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                                            No recipients yet. Upload a CSV file to add recipients.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Preview Dialog with device toggle */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Email Preview</DialogTitle>
                        <DialogDescription>Preview how your email looks to recipients</DialogDescription>
                    </DialogHeader>
                    {preview && (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Subject</p>
                                <p className="mt-1 font-medium">{preview.subject}</p>
                            </div>
                            {/* Device toggle */}
                            <div className="flex items-center gap-2">
                                <Button
                                    variant={previewDevice === "desktop" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setPreviewDevice("desktop")}
                                >
                                    <Monitor className="mr-2 h-4 w-4" /> Desktop
                                </Button>
                                <Button
                                    variant={previewDevice === "mobile" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setPreviewDevice("mobile")}
                                >
                                    <Smartphone className="mr-2 h-4 w-4" /> Mobile
                                </Button>
                            </div>
                            <div className={`mx-auto border rounded-lg bg-white overflow-hidden transition-all ${previewDevice === "mobile" ? "max-w-[375px]" : "w-full"}`}>
                                <div
                                    className="p-4"
                                    dangerouslySetInnerHTML={{ __html: preview.body }}
                                />
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
