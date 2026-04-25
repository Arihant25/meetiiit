"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

type Message = {
    id: string;
    senderId: string;
    body: string;
    createdAt: string;
};

export default function ChatRoom({
    roomId,
    currentUserId,
    otherUsername,
    initialMessages,
}: {
    roomId: string;
    currentUserId: string;
    otherUsername: string;
    initialMessages: Message[];
}) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const lastCreatedAt = useRef<string | null>(
        initialMessages.length > 0 ? initialMessages[initialMessages.length - 1].createdAt : null
    );

    const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
        bottomRef.current?.scrollIntoView({ behavior });
    }, []);

    useEffect(() => {
        scrollToBottom("instant");
    }, [scrollToBottom]);

    useEffect(() => {
        scrollToBottom();
    }, [messages.length, scrollToBottom]);

    useEffect(() => {
        fetch(`/api/chat/${roomId}/read`, { method: "POST" });
    }, [roomId]);

    const resetPollInterval = useRef<(() => void) | null>(null);

    useEffect(() => {
        // Backoff steps (ms): 3s → 5s → 15s → 60s, stays at 60s
        const STEPS = [3000, 5000, 15000, 60000];
        let stepIndex = 0;
        let timeoutId: ReturnType<typeof setTimeout>;
        let cancelled = false;

        const schedule = () => {
            timeoutId = setTimeout(poll, STEPS[stepIndex]);
        };

        const poll = async () => {
            if (cancelled) return;
            const since = lastCreatedAt.current;
            const url = `/api/chat/${roomId}${since ? `?since=${encodeURIComponent(since)}` : ""}`;
            try {
                const res = await fetch(url);
                if (!res.ok) { schedule(); return; }
                const newMsgs: Message[] = await res.json();
                if (newMsgs.length > 0) {
                    setMessages((prev) => {
                        const seen = new Set(prev.map((m) => m.id));
                        const fresh = newMsgs.filter((m) => !seen.has(m.id));
                        return fresh.length > 0 ? [...prev, ...fresh] : prev;
                    });
                    lastCreatedAt.current = newMsgs[newMsgs.length - 1].createdAt;
                    stepIndex = 0; // reset backoff on activity
                } else {
                    stepIndex = Math.min(stepIndex + 1, STEPS.length - 1);
                }
            } catch {
                // network hiccup — keep current interval
            }
            schedule();
        };

        resetPollInterval.current = () => { stepIndex = 0; };

        schedule();
        return () => { cancelled = true; clearTimeout(timeoutId); };
    }, [roomId]);

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        const text = input.trim();
        if (!text || sending) return;

        resetPollInterval.current?.();
        setSending(true);
        const optimisticId = `opt-${Date.now()}`;
        const optimistic: Message = {
            id: optimisticId,
            senderId: currentUserId,
            body: text,
            createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimistic]);
        setInput("");

        try {
            const res = await fetch(`/api/chat/${roomId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ body: text }),
            });
            if (res.ok) {
                const saved: Message = await res.json();
                setMessages((prev) => prev.map((m) => (m.id === optimisticId ? saved : m)));
                lastCreatedAt.current = saved.createdAt;
            }
        } finally {
            setSending(false);
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend(e as unknown as React.FormEvent);
        }
    }

    return (
        <div className="chat-shell">
            <div className="chat-header">
                <Link href="/chat" className="button-secondary chat-back-btn">
                    ← Back
                </Link>
                <span className="chat-header-name">@{otherUsername}</span>
                <div className="chat-header-spacer" />
            </div>

            <div className="chat-messages">
                {messages.length === 0 ? (
                    <div className="chat-empty">No messages yet. Say something.</div>
                ) : (
                    messages.map((m) => {
                        const mine = m.senderId === currentUserId;
                        return (
                            <div key={m.id} className={mine ? "bubble mine" : "bubble"}>
                                <p style={{ margin: 0 }}>{m.body}</p>
                                <span>
                                    {new Date(m.createdAt).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </span>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} className="chat-input-row">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    maxLength={1200}
                    placeholder="Type a message…"
                    autoComplete="off"
                    disabled={sending}
                />
                <button
                    type="submit"
                    className="button-primary"
                    disabled={sending || !input.trim()}
                >
                    Send
                </button>
            </form>
        </div>
    );
}
