"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"

interface OTPInputProps {
    length?: number
    onComplete: (code: string) => void
    onChange?: (code: string, isComplete: boolean) => void
    disabled?: boolean
    autoSubmit?: boolean
}

export function OTPInput({ 
    length = 6, 
    onComplete, 
    onChange,
    disabled = false, 
    autoSubmit = true 
}: OTPInputProps) {
    const [otp, setOtp] = useState<string[]>(Array(length).fill(""))
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    useEffect(() => {
        // Focus first input on mount
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus()
        }
    }, [])

    const handleChange = (index: number, value: string) => {
        if (disabled) return
        if (!/^\d*$/.test(value)) return // Only digits

        const newOtp = [...otp]
        newOtp[index] = value.slice(-1) // Only last digit
        setOtp(newOtp)

        const otpValue = newOtp.join("")
        const isComplete = newOtp.every(digit => digit !== "")

        // Call onChange callback if provided
        if (onChange) {
            onChange(otpValue, isComplete)
        }

        // Auto-focus next input
        if (value && index < length - 1) {
            inputRefs.current[index + 1]?.focus()
        }

        // Auto-submit if enabled and complete
        if (autoSubmit && isComplete) {
            onComplete(otpValue)
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (disabled) return
        
        if (e.key === "Backspace") {
            if (!otp[index] && index > 0) {
                // Move to previous input if current is empty
                inputRefs.current[index - 1]?.focus()
            } else {
                // Clear current input
                const newOtp = [...otp]
                newOtp[index] = ""
                setOtp(newOtp)
            }
        }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        if (disabled) return
        
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text')
        const digits = pastedData.replace(/\D/g, '').slice(0, length)
        
        if (digits.length > 0) {
            const newOtp = Array(length).fill("")
            for (let i = 0; i < digits.length && i < length; i++) {
                newOtp[i] = digits[i]
            }
            setOtp(newOtp)
            
            const otpValue = newOtp.join("")
            const isComplete = digits.length === length

            // Call onChange callback if provided
            if (onChange) {
                onChange(otpValue, isComplete)
            }
            
            // Focus next empty input or last input
            const nextIndex = Math.min(digits.length, length - 1)
            inputRefs.current[nextIndex]?.focus()
            
            // Auto-submit if enabled and complete
            if (autoSubmit && isComplete) {
                onComplete(digits)
            }
        }
    }

    return (
        <div className="flex gap-2 justify-center">
            {otp.map((digit, index) => (
                <Input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={disabled}
                    className="w-12 h-12 text-center text-xl font-mono"
                />
            ))}
        </div>
    )
}
