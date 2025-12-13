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

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    subject: z.string().min(1, "Subject is required"),
    body: z.string().min(1, "Body is required"),
})

export default function NewCampaignPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [templates, setTemplates] = useState<any[]>([])
    const [selectedTemplate, setSelectedTemplate] = useState<string>("")

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            subject: "",
            body: "",
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

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        try {
            const res = await api.post("/campaigns", values)
            toast.success("Campaign created! Now upload recipients.")
            // Redirect to campaign detail page to upload CSV
            router.push(`/campaigns/${res.data.id}`)
        } catch (error: any) {
            toast.error("Failed to create campaign")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight">New Campaign</h2>
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
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Creating..." : "Create Campaign"}
                    </Button>
                </form>
            </Form>
        </div>
    )
}
