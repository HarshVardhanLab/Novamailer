"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Plus, Trash2, Webhook, CheckSquare, Square } from "lucide-react"

export default function WebhooksPage() {
    const [webhooks, setWebhooks] = useState<any[]>([])
    const [events, setEvents] = useState<string[]>([])
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({ name: "", url: "", secret: "", events: [] as string[] })

    const fetchWebhooks = async () => {
        try {
            const [whRes, evRes] = await Promise.all([
                api.get("/webhooks"),
                api.get("/webhooks/events"),
            ])
            setWebhooks(whRes.data)
            setEvents(evRes.data.events)
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => { fetchWebhooks() }, [])

    const toggleEvent = (ev: string) => {
        setForm(f => ({
            ...f,
            events: f.events.includes(ev) ? f.events.filter(e => e !== ev) : [...f.events, ev],
        }))
    }

    const handleSave = async () => {
        if (!form.name || !form.url || form.events.length === 0) {
            toast.error("Name, URL, and at least one event are required")
            return
        }
        setSaving(true)
        try {
            await api.post("/webhooks", form)
            toast.success("Webhook created")
            setOpen(false)
            setForm({ name: "", url: "", secret: "", events: [] })
            fetchWebhooks()
        } catch (e: any) {
            toast.error(e.response?.data?.detail || "Failed to create webhook")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this webhook?")) return
        try {
            await api.delete(`/webhooks/${id}`)
            toast.success("Webhook deleted")
            fetchWebhooks()
        } catch (e: any) {
            toast.error("Failed to delete webhook")
        }
    }

    const toggleActive = async (wh: any) => {
        try {
            await api.put(`/webhooks/${wh.id}`, { ...wh, active: !wh.active })
            fetchWebhooks()
        } catch {
            toast.error("Failed to update webhook")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Webhook className="h-7 w-7 text-muted-foreground" />
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Webhooks</h2>
                        <p className="text-muted-foreground">Get notified when campaign events happen</p>
                    </div>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Add Webhook</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>New Webhook</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input placeholder="My Webhook" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label>URL</Label>
                                <Input placeholder="https://example.com/webhook" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Secret (optional)</Label>
                                <Input placeholder="Used for HMAC signature" value={form.secret} onChange={e => setForm(f => ({ ...f, secret: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Events</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {events.map(ev => (
                                        <button
                                            key={ev}
                                            type="button"
                                            onClick={() => toggleEvent(ev)}
                                            className={`flex items-center gap-2 text-sm px-3 py-2 rounded border transition-colors ${form.events.includes(ev) ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}
                                        >
                                            {form.events.includes(ev) ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                                            {ev}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Create Webhook"}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Active Webhooks ({webhooks.length})</CardTitle>
                    <CardDescription>NovaMailer sends a POST request to your URL when events occur</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>URL</TableHead>
                                    <TableHead>Events</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {webhooks.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                            No webhooks yet
                                        </TableCell>
                                    </TableRow>
                                ) : webhooks.map((wh: any) => (
                                    <TableRow key={wh.id}>
                                        <TableCell className="font-medium">{wh.name}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{wh.url}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {wh.events.map((ev: string) => (
                                                    <span key={ev} className="text-xs bg-muted px-2 py-0.5 rounded">{ev}</span>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <button onClick={() => toggleActive(wh)} className={`text-xs px-2 py-1 rounded-full font-medium ${wh.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                                                {wh.active ? "Active" : "Inactive"}
                                            </button>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(wh.id)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
