"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import Link from "next/link"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { OTPInput } from "@/components/otp-input"
import { toast } from "sonner"
import { Mail, ArrowLeft, Key } from "lucide-react"

const emailSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
})

const resetSchema = z.object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

export default function ForgotPasswordPage() {
    const router = useRouter()
    const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email')
    const [isLoading, setIsLoading] = useState(false)
    const [userId, setUserId] = useState<number | null>(null)
    const [email, setEmail] = useState('')
    const [otpCode, setOtpCode] = useState('')
    const [isOtpComplete, setIsOtpComplete] = useState(false)

    const emailForm = useForm<z.infer<typeof emailSchema>>({
        resolver: zodResolver(emailSchema),
        defaultValues: { email: "" },
    })

    const resetForm = useForm<z.infer<typeof resetSchema>>({
        resolver: zodResolver(resetSchema),
        defaultValues: { password: "", confirmPassword: "" },
    })

    const handleEmailSubmit = async (values: z.infer<typeof emailSchema>) => {
        setIsLoading(true)
        try {
            const response = await api.post("/auth/forgot-password", values)
            setEmail(values.email)
            setUserId(response.data.user_id)
            setStep('otp')
            toast.success("Reset code sent to your email")
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to send reset code")
        } finally {
            setIsLoading(false)
        }
    }

    const handleOtpChange = (code: string, isComplete: boolean) => {
        setOtpCode(code)
        setIsOtpComplete(isComplete)
    }

    const handleOTPVerify = async (code?: string) => {
        const codeToVerify = code || otpCode
        if (!codeToVerify || codeToVerify.length !== 6) {
            toast.error("Please enter a valid 6-digit code")
            return
        }
        setOtpCode(codeToVerify)
        setStep('reset')
    }

    const handlePasswordReset = async (values: z.infer<typeof resetSchema>) => {
        if (!userId || !otpCode) return
        
        setIsLoading(true)
        try {
            await api.post("/auth/reset-password", {
                user_id: userId,
                code: otpCode,
                new_password: values.password
            })
            toast.success("Password reset successfully! You can now login.")
            router.push("/login")
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to reset password")
            // Go back to OTP step if code is invalid
            if (error.response?.data?.detail?.includes("Invalid or expired")) {
                setStep('otp')
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleBackToEmail = () => {
        setStep('email')
        setUserId(null)
        setEmail('')
    }

    const handleBackToOTP = () => {
        setStep('otp')
        setOtpCode('')
    }

    if (step === 'otp') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                            <Mail className="h-6 w-6 text-blue-600" />
                        </div>
                        <CardTitle className="mt-4">Enter Reset Code</CardTitle>
                        <CardDescription>
                            We sent a 6-digit code to
                            <br />
                            <strong>{email}</strong>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <OTPInput 
                                onComplete={handleOTPVerify}
                                onChange={handleOtpChange}
                                autoSubmit={false}
                            />
                            
                            <Button
                                onClick={() => handleOTPVerify()}
                                disabled={!isOtpComplete}
                                className="w-full"
                            >
                                Continue
                            </Button>
                        </div>
                        
                        <div className="text-center">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleBackToEmail}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Email
                            </Button>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-xs text-blue-800">
                                <strong>Note:</strong>
                                <br />• Code expires in 10 minutes
                                <br />• Check your spam folder
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (step === 'reset') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                            <Key className="h-6 w-6 text-green-600" />
                        </div>
                        <CardTitle className="mt-4">Reset Password</CardTitle>
                        <CardDescription>
                            Enter your new password
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...resetForm}>
                            <form onSubmit={resetForm.handleSubmit(handlePasswordReset)} className="space-y-4">
                                <FormField
                                    control={resetForm.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>New Password</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    placeholder="Enter new password"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={resetForm.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirm Password</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    placeholder="Confirm new password"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? "Resetting..." : "Reset Password"}
                                </Button>
                            </form>
                        </Form>
                        
                        <div className="mt-4 text-center">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleBackToOTP}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Code
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Forgot Password</CardTitle>
                    <CardDescription>
                        Enter your email address and we'll send you a reset code
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...emailForm}>
                        <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
                            <FormField
                                control={emailForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="Enter your email"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Sending..." : "Send Reset Code"}
                            </Button>
                        </form>
                    </Form>
                    <div className="mt-4 text-center text-sm">
                        Remember your password?{" "}
                        <Link href="/login" className="text-blue-500 hover:underline">
                            Sign in
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
