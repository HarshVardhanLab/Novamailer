"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Plus, Trash2, ShieldOff } from "lucide-react"

export default function UnsubscribesPage() {
    const [list, setList] = useState<any[]>([])
    const [email, setEmail] = useState("")
    const [adding, setAdding] = useState(false)

    const fetchList = async () => {
        try {
            const res = await api.get("/unsubscribe/list")
            setList(res.data)
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => { fetchList() }, [])

    const handleAdd = async () => {
        if (!email) return
        setAdding(true)
        try {
            await api.post("/unsubscribe/add", { email })
            toast.success(`${email} added to suppression list`)
            setEmail("")
            fetchList()
        } catch (e: any) {
            toast.error(e.response?.data?.detail || "Failed to add email")
        } finally {
            setAdding(false)
        }
    }

    const handleRemove = async (emailAddr: string) => {
        if (!confirm(`Remove ${emailAddr} from suppression list?`)) return
        try {
            await api.delete(`/unsubscribe/remove/${encodeURIComponent(emailAddr)}`)
            toast.success("Removed from suppression list")
            fetchList()
        } catch (e: any) {
            toast.error(e.response?.data?.detail || "Failed to remove")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <ShieldOff className="h-7 w-7 text-muted-foreground" />
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Suppression List</h2>
                    <p className="text-muted-foreground">Emails here are automatically skipped when sending campaigns</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Add Email</CardTitle>
                    <CardDescription>Manually add an email to the suppression list</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3">
                        <Input
                            type="email"
                            placeholder="user@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                            className="max-w-sm"
                        />
                        <Button onClick={handleAdd} disabled={adding || !email}>
                            <Plus className="mr-2 h-4 w-4" />
                            {adding ? "Adding..." : "Add"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Suppressed Emails ({list.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Unsubscribed At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {list.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                            No suppressed emails yet
                                        </TableCell>
                                    </TableRow>
                                ) : list.map((item: any) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.email}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {new Date(item.unsubscribed_at).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => handleRemove(item.email)}>
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
