export default function Badge({ text }: { text: string }) {
    return (
        <div className="w-auto backdrop-blur-lg bg-slate-100 border border-black/10 rounded-3xl px-3 py-2 shadow-2xl flex items-center gap-2">
            <p className="text-sm font-bold text-black">{text}</p>
        </div>
    );
}

export function BadgeWithIndicator({ text, indicatorColor }: { text: string, indicatorColor: string }) {
    return (
        <div className="w-auto backdrop-blur-lg bg-slate-100 border border-black/10 rounded-3xl px-3 py-2 shadow-2xl flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: indicatorColor }}></div>
            <p className="text-sm font-bold text-black">{text}</p>
        </div>
    );
}
