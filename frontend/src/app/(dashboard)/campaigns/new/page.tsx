"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Sparkles, Loader2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    subject: z.string().min(1, "Subject is required"),
    body: z.string().min(1, "Body is required"),
    scheduled_at: z.string().optional(),
})

export default function NewCampaignPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [templates, setTemplates] = useState<any[]>([])
    const [selectedTemplate, setSelectedTemplate] = useState<string>("")
    const [isAiLoading, setIsAiLoading] = useState(false)
    const [aiTopic, setAiTopic] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            subject: "",
            body: "",
            scheduled_at: "",
        },
    })

    useEffect(() => {
        fetchTemplates()
    }, [])

    const fetchTemplates = async () => {
        try {
            const res = await api.get("/templates")
            setTemplates(res.data)
        } catch (e) {
            console.error("Failed to load templates:", e)
        }
    }

    const handleTemplateSelect = (templateId: string) => {
        setSelectedTemplate(templateId)
        if (templateId === "none") {
            // Clear fields
            form.setValue("body", "")
            return
        }

        const template = templates.find(t => t.id.toString() === templateId)
        if (template) {
            form.setValue("body", template.content)
            toast.success(`Template "${template.name}" loaded`)
        }
    }

    const handleGenerateAI = async () => {
        if (!aiTopic) return;
        setIsAiLoading(true);
        try {
            const res = await api.post("/campaigns/suggest", { topic: aiTopic });
            if (res.data && res.data.subject && res.data.body) {
                form.setValue("subject", res.data.subject);
                form.setValue("body", res.data.body);
                toast.success("Campaign content generated successfully!");
                setIsDialogOpen(false);
                setAiTopic("");
                // Clear selected template since we are using AI content
                setSelectedTemplate("none");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to suggest campaign content");
        } finally {
            setIsAiLoading(false);
        }
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        try {
            const payload: any = { ...values }
            if (payload.scheduled_at) {
                payload.scheduled_at = new Date(payload.scheduled_at).toISOString()
            } else {
                delete payload.scheduled_at
            }
            const res = await api.post("/campaigns", payload)
            toast.success("Campaign created! Now upload recipients.")
            router.push(`/campaigns/${res.data.id}`)
        } catch (error: any) {
            toast.error("Failed to create campaign")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">New Campaign</h2>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button type="button" variant="outline" className="gap-2 border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800">
                            <Sparkles className="h-4 w-4" />
                            Auto-Suggest Content
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>AI Campaign Suggestion</DialogTitle>
                            <DialogDescription>
                                Enter a topic for your campaign and our AI will suggest a catchy subject line and draft the email body.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <Textarea
                                placeholder="E.g., Black Friday tech gadgets sale 50% off..."
                                value={aiTopic}
                                onChange={(e) => setAiTopic(e.target.value)}
                                className="h-24"
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="button" onClick={handleGenerateAI} disabled={isAiLoading || !aiTopic.trim()}>
                                {isAiLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    "Suggest Content"
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {/* Template Selection */}
                    <div className="space-y-2">
                        <FormLabel>Use Template (Optional)</FormLabel>
                        <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a template or write custom content" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No Template (Write Custom)</SelectItem>
                                {templates.map((template) => (
                                    <SelectItem key={template.id} value={template.id.toString()}>
                                        {template.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormDescription>
                            Select a template to auto-fill the email body, or write custom content below
                        </FormDescription>
                    </div>

                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Campaign Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Black Friday Sale 2024" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Subject</FormLabel>
                                <FormControl>
                                    <Input placeholder="Hello {{name}}" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="body"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email Body (HTML supported)</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="<h1>Hello {{name}}</h1>" className="min-h-[200px]" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="scheduled_at"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Schedule Send (Optional)</FormLabel>
                                <FormControl>
                                    <Input type="datetime-local" {...field} />
                                </FormControl>
                                <FormDescription>Leave blank to send manually</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Creating..." : "Create Campaign"}
                    </Button>
                </form>
            </Form>
        </div>
    )
}
