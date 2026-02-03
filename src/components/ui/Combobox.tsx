import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, Loader2 } from 'lucide-react';

interface Option {
    label: string;
    value: string;
    emoji?: string;
}

interface ComboboxProps {
    options: Option[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    isLoading?: boolean;
    disabled?: boolean;
    className?: string;
}

export function Combobox({
    options = [],
    value,
    onChange,
    placeholder = 'Select...',
    searchPlaceholder = 'Search...',
    isLoading = false,
    disabled = false,
    className = ''
}: ComboboxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    w-full flex items-center justify-between px-3 py-2 text-sm border rounded-lg bg-white
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:border-gray-400'}
                    ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-300'}
                `}
            >
                <div className="flex items-center gap-2 truncate">
                    {selectedOption ? (
                        <>
                            {selectedOption.emoji && <span>{selectedOption.emoji}</span>}
                            <span className="text-gray-900">{selectedOption.label}</span>
                        </>
                    ) : (
                        <span className="text-gray-400">{placeholder}</span>
                    )}
                </div>
                {isLoading ? (
                    <Loader2 size={16} className="text-gray-400 animate-spin" />
                ) : (
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-gray-100 relative">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="w-full pl-8 pr-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
                            autoFocus
                        />
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <div
                                    key={opt.value}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                    className={`
                                        flex items-center justify-between px-3 py-2 text-sm cursor-pointer
                                        ${opt.value === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}
                                    `}
                                >
                                    <div className="flex items-center gap-2">
                                        {opt.emoji && <span>{opt.emoji}</span>}
                                        <span>{opt.label}</span>
                                    </div>
                                    {opt.value === value && <Check size={14} className="text-blue-600" />}
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-center text-xs text-gray-400">
                                No results found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
