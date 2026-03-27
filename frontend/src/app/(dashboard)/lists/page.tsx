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
import { Plus, Trash2, Users, Upload, Eye } from "lucide-react"

export default function RecipientListsPage() {
    const [lists, setLists] = useState<any[]>([])
    const [open, setOpen] = useState(false)
    const [viewList, setViewList] = useState<any>(null)
    const [contacts, setContacts] = useState<any[]>([])
    const [form, setForm] = useState({ name: "", description: "" })
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState<number | null>(null)

    const fetchLists = async () => {
        try {
            const res = await api.get("/lists")
            setLists(res.data)
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => { fetchLists() }, [])

    const handleCreate = async () => {
        if (!form.name) { toast.error("Name is required"); return }
        setSaving(true)
        try {
            await api.post("/lists", form)
            toast.success("List created")
            setOpen(false)
            setForm({ name: "", description: "" })
            fetchLists()
        } catch (e: any) {
            toast.error(e.response?.data?.detail || "Failed to create list")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this list and all its contacts?")) return
        try {
            await api.delete(`/lists/${id}`)
            toast.success("List deleted")
            fetchLists()
        } catch {
            toast.error("Failed to delete list")
        }
    }

    const handleUploadCSV = async (listId: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(listId)
        try {
            const formData = new FormData()
            formData.append("file", file)
            const res = await api.post(`/lists/${listId}/upload-csv`, formData, { headers: { "Content-Type": "multipart/form-data" } })
            toast.success(res.data.message)
            fetchLists()
        } catch (e: any) {
            toast.error(e.response?.data?.detail || "Upload failed")
        } finally {
            setUploading(null)
            e.target.value = ""
        }
    }

    const handleViewContacts = async (lst: any) => {
        try {
            const res = await api.get(`/lists/${lst.id}/contacts`)
            setContacts(res.data)
            setViewList(lst)
        } catch {
            toast.error("Failed to load contacts")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Users className="h-7 w-7 text-muted-foreground" />
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Recipient Lists</h2>
                        <p className="text-muted-foreground">Save and reuse contact lists across campaigns</p>
                    </div>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> New List</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Create Recipient List</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input placeholder="Newsletter subscribers" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Description (optional)</Label>
                                <Input placeholder="Monthly newsletter list" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreate} disabled={saving}>{saving ? "Creating..." : "Create"}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {lists.length === 0 ? (
                    <Card className="col-span-full">
                        <CardContent className="text-center py-12 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
                            <p>No lists yet. Create one to get started.</p>
                        </CardContent>
                    </Card>
                ) : lists.map((lst: any) => (
                    <Card key={lst.id}>
                        <CardHeader>
                            <CardTitle className="text-lg">{lst.name}</CardTitle>
                            {lst.description && <CardDescription>{lst.description}</CardDescription>}
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-2xl font-bold">{lst.contact_count} <span className="text-sm font-normal text-muted-foreground">contacts</span></p>
                            <p className="text-xs text-muted-foreground">Created {new Date(lst.created_at).toLocaleDateString()}</p>
                            <div className="flex gap-2 flex-wrap">
                                <Button variant="outline" size="sm" onClick={() => handleViewContacts(lst)}>
                                    <Eye className="mr-1 h-3 w-3" /> View
                                </Button>
                                <Label htmlFor={`csv-${lst.id}`} className="cursor-pointer">
                                    <Button variant="outline" size="sm" asChild disabled={uploading === lst.id}>
                                        <span>
                                            <Upload className="mr-1 h-3 w-3" />
                                            {uploading === lst.id ? "Uploading..." : "Import CSV"}
                                        </span>
                                    </Button>
                                </Label>
                                <Input id={`csv-${lst.id}`} type="file" accept=".csv" className="hidden" onChange={(e) => handleUploadCSV(lst.id, e)} />
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(lst.id)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Contacts viewer dialog */}
            <Dialog open={!!viewList} onOpenChange={() => setViewList(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{viewList?.name} — Contacts ({contacts.length})</DialogTitle>
                    </DialogHeader>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Data</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {contacts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center text-muted-foreground py-6">No contacts yet</TableCell>
                                    </TableRow>
                                ) : contacts.map((c: any) => (
                                    <TableRow key={c.id}>
                                        <TableCell>{c.email}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {c.data ? JSON.stringify(c.data).substring(0, 60) + "..." : "—"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
