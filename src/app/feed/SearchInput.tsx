"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

export default function SearchInput({ sort }: { sort: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [value, setValue] = useState(searchParams.get("q") ?? "");
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const q = e.target.value;
        setValue(q);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            const p = new URLSearchParams();
            p.set("sort", sort);
            if (q.trim()) p.set("q", q.trim());
            router.push(`/feed?${p.toString()}`);
        }, 300);
    }

    return (
        <input
            type="search"
            className="search-input"
            placeholder="Search people, tags…"
            value={value}
            onChange={handleChange}
        />
    );
}
