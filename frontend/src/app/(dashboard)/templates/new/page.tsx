"use client"

import { useState } from "react"
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
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
    content: z.string().min(1, "Content is required"),
})

export default function NewTemplatePage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isAiLoading, setIsAiLoading] = useState(false)
    const [aiPrompt, setAiPrompt] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            content: "",
        },
    })

    const handleGenerateAI = async () => {
        if (!aiPrompt) return;
        setIsAiLoading(true);
        try {
            const res = await api.post("/templates/generate", { prompt: aiPrompt });
            if (res.data && res.data.html_content) {
                form.setValue("content", res.data.html_content);
                toast.success("Template generated successfully!");
                setIsDialogOpen(false);
                setAiPrompt("");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to generate AI template");
        } finally {
            setIsAiLoading(false);
        }
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        try {
            await api.post("/templates", values)
            toast.success("Template created")
            router.push("/templates")
        } catch (error: any) {
            toast.error("Failed to create template")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight">New Template</h2>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Template Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Newsletter Template" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex items-center justify-between">
                                    <FormLabel>HTML Content</FormLabel>
                                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button type="button" variant="outline" size="sm" className="h-8 gap-1 border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800">
                                                <Sparkles className="h-3.5 w-3.5" />
                                                Generate with AI
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px]">
                                            <DialogHeader>
                                                <DialogTitle>Generate Template with AI</DialogTitle>
                                                <DialogDescription>
                                                    Describe the email template you want to create and our AI will generate the HTML for you.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <Textarea
                                                    placeholder="E.g., A modern welcome email for a tech startup..."
                                                    value={aiPrompt}
                                                    onChange={(e) => setAiPrompt(e.target.value)}
                                                    className="h-24"
                                                />
                                            </div>
                                            <DialogFooter>
                                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                                <Button type="button" onClick={handleGenerateAI} disabled={isAiLoading || !aiPrompt.trim()}>
                                                    {isAiLoading ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Generating...
                                                        </>
                                                    ) : (
                                                        "Generate"
                                                    )}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                                <FormControl>
                                    <Textarea placeholder="<html>...</html>" className="min-h-[300px]" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Creating..." : "Create Template"}
                    </Button>
                </form>
            </Form>
        </div>
    )
}
