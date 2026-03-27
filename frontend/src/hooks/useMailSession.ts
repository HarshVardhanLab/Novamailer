"use client"
import { useState, useEffect } from "react"

export interface IMAPCreds {
    host: string
    port: number
    username: string
    password: string
}

const SESSION_KEY = "novamailer_imap_creds"

export function useMailSession() {
    const [creds, setCreds] = useState<IMAPCreds | null>(null)
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(SESSION_KEY)
            if (raw) setCreds(JSON.parse(raw))
        } catch {}
        setLoaded(true)
    }, [])

    const saveCreds = (c: IMAPCreds) => {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(c))
        setCreds(c)
    }

    const clearCreds = () => {
        sessionStorage.removeItem(SESSION_KEY)
        setCreds(null)
    }

    return { creds, saveCreds, clearCreds, loaded }
}
