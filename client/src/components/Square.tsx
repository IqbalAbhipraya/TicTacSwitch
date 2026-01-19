import type { Player } from '../types';

interface SquareProps {
    value: Player | null;
    onClick: () => void;
    isOldest: boolean;
    disabled: boolean;
}

export default function Square({ value, onClick, isOldest, disabled }: SquareProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                aspect-square w-full
                flex items-center justify-center
                text-6xl font-bold
                border-4 rounded-lg
                transition-all duration-300
                ${value === 'X' ? 'text-blue-600' : ''}
                ${value === 'O' ? 'text-red-600' : ''}
                ${isOldest 
                    ? 'bg-red-100 border-red-500 animate-pulse' 
                    : 'bg-white border-gray-800'
                }
                ${!disabled && !value 
                    ? 'hover:bg-gray-100 hover:border-blue-500 cursor-pointer' 
                    : ''
                }
                ${disabled ? 'cursor-not-allowed opacity-60' : ''}
            `}
        >
            {value}
        </button>
    );
}