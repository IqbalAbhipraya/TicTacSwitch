import type { Player } from "../types";
import {X, Circle} from "lucide-react"

interface SquareProps {
    value: Player | null;
    onClick: () => void;
    isOldest: boolean;
    disabled: boolean;
    isWinner: boolean;
}

export default function Square({ value, onClick, isOldest, disabled, isWinner }: SquareProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                aspect-square w-full
                flex items-center justify-center
                text-7xl font-bold
                rounded-xl
                transition-all duration-300 ease-out
                backdrop-blur-sm
                ${value === 'X' ? 'text-blue-400' : ''}
                ${value === 'O' ? 'text-red-400' : ''}
                ${isOldest ? 'opacity-40 animate-[pulse_1.5s_ease-in-out_infinite]' : ''}
                ${!disabled && !value ? 
                    'hover:scale-105 hover:bg-slate-200 cursor-pointer hover:shadow-xl' : 
                    'cursor-not-allowed'
                }
                ${
                    isWinner ? 'bg-green-400/40' :
                    value ? 'bg-white/15 shadow-lg' :
                    disabled && !value ? 'bg-gray-200' : 
                    'bg-slate-200'
                }
            `}
            style={{
                border: isOldest 
                    ? '2px solid rgba(234, 179, 8, 0.6)' 
                    : '2px solid rgba(255, 255, 255, 0.1)',
                textShadow: value === 'X' 
                    ? '0 0 20px rgba(59, 130, 246, 0.8)' 
                    : value === 'O' 
                    ? '0 0 20px rgba(239, 68, 68, 0.8)' 
                    : 'none',
            }}
        >
            {value === 'X' && <span className="animate-[fadeIn_0.3s_ease-in-out]"><X size={120} strokeWidth={3} /></span>}
            {value === 'O' && <span className="animate-[fadeIn_0.3s_ease-in-out]"><Circle size={100} strokeWidth={3} /></span>}
        </button>
    );
}