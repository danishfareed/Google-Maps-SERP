'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin,
    Search,
    Grid,
    MoveHorizontal,
    Calendar,
    ArrowRight,
    ArrowLeft,
    Loader2,
    Check,
    Target,
    Clock,
    Navigation,
    Store,
    Maximize2,
    Plus,
    Info
} from 'lucide-react';
import { Card, Button, Input, Select, Badge } from '@/components/ui';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/Dialog';
import { Combobox } from '@/components/ui/Combobox';
import PointInitializer from '@/components/PointInitializer';

// Dynamically import Map to avoid SSR issues
const LeafletMap = dynamic(() => import('@/components/ui/Map'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center">Loading Map...</div>
});

const steps = [
    { id: 1, title: 'Keywords', icon: Search },
    { id: 2, title: 'Configuration', icon: Grid },
    { id: 3, title: 'Schedule', icon: Calendar },
];

export default function NewScanPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [geocoding, setGeocoding] = useState(false);
    const [scanMode, setScanMode] = useState<'QUICK' | 'BUSINESS'>('QUICK');
    const [formData, setFormData] = useState({
        keyword: '',
        businessName: '',
        address: '',
        radius: 5,
        gridSize: 3,
        frequency: 'ONCE',
        centerLat: 40.7128, // Default NYC
        centerLng: -74.0060,
        shape: 'SQUARE' as 'SQUARE' | 'CIRCLE' | 'ZIP' | 'SMART',
    });
    const [customPoints, setCustomPoints] = useState<any[] | null>(null);
    const [lookupResults, setLookupResults] = useState<any[]>([]);
    const [lookingUp, setLookingUp] = useState(false);
    const [lookupUrl, setLookupUrl] = useState('');
    const [isUrlImport, setIsUrlImport] = useState(false);
    const [isManualValue, setIsManualValue] = useState(false);

    const [gridStrategy, setGridStrategy] = useState<'GEOMETRIC' | 'CITY'>('GEOMETRIC');
    const [cityConfig, setCityConfig] = useState({ type: 'zip' as 'zip' | 'neighborhood' });
    const [fetchingCity, setFetchingCity] = useState(false);

    // Location Data State
    const [countries, setCountries] = useState<any[]>([]);
    const [states, setStates] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [selectedCountry, setSelectedCountry] = useState('US');
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');

    // Load Countries on Mount
    useEffect(() => {
        fetch('/api/locations/autocomplete?type=country')
            .then(res => res.json())
            .then(data => setCountries(data))
            .catch(console.error);
    }, []);

    // Load States when Country changes
    useEffect(() => {
        if (!selectedCountry) {
            setStates([]);
            return;
        }
        fetch(`/api/locations/autocomplete?type=state&countryCode=${selectedCountry}`)
            .then(res => res.json())
            .then(data => {
                setStates(data);
                setSelectedState(''); // Reset state
                setCities([]);        // Reset cities
            })
            .catch(console.error);
    }, [selectedCountry]);

    // Load Cities when State changes
    useEffect(() => {
        if (!selectedCountry || !selectedState) {
            setCities([]);
            return;
        }
        fetch(`/api/locations/autocomplete?type=city&countryCode=${selectedCountry}&stateCode=${selectedState}`)
            .then(res => res.json())
            .then(data => {
                setCities(data);
                setSelectedCity(''); // Reset city
            })
            .catch(console.error);
    }, [selectedCountry, selectedState]);

    // Debounced search for business names
    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.businessName && formData.businessName.length > 3 && !isUrlImport && isManualValue) {
                handleLookup(formData.businessName);
            }
        }, 800);
        return () => clearTimeout(timer);
    }, [formData.businessName, isUrlImport, isManualValue]);

    const handleLookup = async (q: string) => {
        if (q.length < 3) return;
        setLookingUp(true);
        try {
            const res = await fetch('/api/scans/lookup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: q })
            });
            const data = await res.json();
            setLookupResults(data.results || []);
        } catch (err) {
            console.error('Lookup failed:', err);
        } finally {
            setLookingUp(false);
        }
    };

    const handleUrlImport = async (urlOverride?: string) => {
        const targetUrl = urlOverride || lookupUrl;
        if (!targetUrl) return;
        setLookingUp(true);
        try {
            const res = await fetch('/api/scans/lookup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: targetUrl })
            });
            const data = await res.json();
            if (data.business) {
                setFormData(prev => ({
                    ...prev,
                    businessName: data.business.name,
                    address: data.business.address || prev.address,
                    centerLat: data.business.lat || prev.centerLat,
                    centerLng: data.business.lng || prev.centerLng
                }));
                if (!urlOverride) setLookupUrl('');
                setIsUrlImport(false);
                setLookupResults([]); // Clear any previous search results
                setIsManualValue(false); // Mark as NOT manual so lookup doesn't trigger
            }
        } catch (err) {
            console.error('URL import failed:', err);
            alert('Failed to import business from URL');
        } finally {
            setLookingUp(false);
        }
    };

    const selectBusiness = (biz: any) => {
        setFormData(prev => ({
            ...prev,
            businessName: biz.name,
            address: biz.address || prev.address
        }));
        setIsManualValue(false);
        setLookupResults([]);

        // If the result has a URL, we can do a deep lookup to get coordinates and full address
        if (biz.url) {
            handleUrlImport(biz.url);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/scans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    customPoints,
                    lat: formData.centerLat,
                    lng: formData.centerLng,
                }),
            });

            if (res.ok) {
                const scan = await res.json();
                router.push(`/scans/${scan.id}`);
            } else {
                const errData = await res.json();
                throw new Error(errData.details || errData.error || 'Failed to create scan');
            }
        } catch (error) {
            console.error('Failed to create scan:', error);
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handlePointMove = (id: string, lat: number, lng: number) => {
        // If we haven't initialized customPoints yet, do it now
        import('@/lib/grid').then(({ generateGrid }) => {
            const initialPoints = customPoints || generateGrid(formData.centerLat, formData.centerLng, formData.radius, formData.gridSize, formData.shape);
            const nextPoints = initialPoints.map(p => p.id === id ? { ...p, lat, lng } : p);
            setCustomPoints(nextPoints);
        });
    };

    // Reset custom points when geometric parameters change
    useEffect(() => {
        setCustomPoints(null);
    }, [formData.radius, formData.gridSize, formData.shape, formData.centerLat, formData.centerLng]);

    const handleGeocode = async () => {
        if (!formData.address) return;
        setGeocoding(true);
        try {
            const res = await fetch(`/api/geocode?address=${encodeURIComponent(formData.address)}`);
            const data = await res.json();
            if (data.lat && data.lng) {
                setFormData(prev => ({ ...prev, centerLat: data.lat, centerLng: data.lng }));
            }
        } catch (err) {
            console.error('Geocoding failed:', err);
        } finally {
            setGeocoding(false);
        }
    };

    const handleCityFetch = async () => {
        if (!selectedCity) return;
        setFetchingCity(true);
        try {
            // Get full names for the API
            const countryName = countries.find(c => c.value === selectedCountry)?.label;
            const stateName = states.find(s => s.value === selectedState)?.label;

            const res = await fetch(`/api/geocode/city?city=${encodeURIComponent(selectedCity)}&state=${encodeURIComponent(stateName || '')}&country=${encodeURIComponent(countryName || '')}&type=${cityConfig.type}`);
            const data = await res.json();

            if (data.points && data.points.length > 0) {
                setCustomPoints(data.points);
                // Center on the city metadata returned by Nominatim if available, else average
                const centerLat = data.cityMeta?.lat || (data.points.reduce((sum: number, p: any) => sum + p.lat, 0) / data.points.length);
                const centerLng = data.cityMeta?.lng || (data.points.reduce((sum: number, p: any) => sum + p.lng, 0) / data.points.length);

                setFormData(prev => ({
                    ...prev,
                    centerLat: centerLat,
                    centerLng: centerLng,
                    shape: 'SMART', // Mark as smart grid
                    radius: 10 // approximate
                }));
            } else {
                alert('No points found for this city. Try selecting a different area.');
            }
        } catch (err) {
            console.error('City fetch failed:', err);
            alert('Failed to fetch city data');
        } finally {
            setFetchingCity(false);
        }
    };

    const nextStep = () => setCurrentStep(s => Math.min(s + 1, 3));
    const prevStep = () => setCurrentStep(s => Math.max(s - 1, 1));

    const canProceed = () => {
        if (currentStep === 1) {
            if (scanMode === 'BUSINESS' && !formData.businessName) return false;
            return formData.keyword && formData.address;
        }
        if (currentStep === 2) return formData.radius > 0 && formData.gridSize >= 3;
        return true;
    };

    return (
        <div className="max-w-6xl mx-auto py-10">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <Plus size={20} />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">New Ranking Report</h1>
                    </div>
                    <p className="text-xs text-gray-500 font-bold ml-1 uppercase tracking-widest opacity-70">Initialize Spatial Intelligence Grid</p>
                </div>
            </header>

            {/* Stepper */}
            <div className="mb-12">
                <div className="flex items-center justify-between max-w-xl mx-auto relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-200 -z-10" />

                    {steps.map((step) => (
                        <div key={step.id} className="flex flex-col items-center bg-gray-50 pt-2 px-2">
                            <div
                                className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors
                  ${currentStep >= step.id
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-400'
                                    }
                `}
                            >
                                {currentStep > step.id ? <Check size={18} /> : <step.icon size={18} />}
                            </div>
                            <span className={`mt-2 text-xs font-bold uppercase tracking-wide ${currentStep >= step.id ? 'text-blue-700' : 'text-gray-500'}`}>
                                {step.title}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Form Area */}
                <div className="lg:col-span-8">
                    <Card className="min-h-[500px] flex flex-col justify-between">
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 mb-1">Search Parameters</h2>
                                        <p className="text-gray-500 text-sm">Enter the business term and location center.</p>
                                    </div>
                                    <div className="flex bg-gray-100 p-1 rounded-lg">
                                        <button
                                            onClick={() => setScanMode('QUICK')}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${scanMode === 'QUICK' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                                        >
                                            Quick Scan
                                        </button>
                                        <button
                                            onClick={() => setScanMode('BUSINESS')}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${scanMode === 'BUSINESS' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                                        >
                                            My Business
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        {scanMode === 'BUSINESS' && (
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-end">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">My Business Name</label>
                                                    <button
                                                        onClick={() => setIsUrlImport(!isUrlImport)}
                                                        className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                                                    >
                                                        {isUrlImport ? 'Search by Name' : 'Import from URL'}
                                                    </button>
                                                </div>

                                                {isUrlImport ? (
                                                    <div className="space-y-4">
                                                        <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-start gap-3">
                                                            <Info size={16} className="text-blue-600 mt-0.5 shrink-0" />
                                                            <div className="text-[10px] text-blue-800 leading-relaxed font-medium">
                                                                <p className="font-black uppercase tracking-wider mb-1">How to get the URL:</p>
                                                                <ol className="list-decimal ml-4 space-y-1">
                                                                    <li>Search for your business on <a href="https://maps.google.com" target="_blank" className="underline font-black hover:text-blue-600">Google Maps</a></li>
                                                                    <li>Click <strong>Share</strong> → <strong>Copy Link</strong></li>
                                                                    <li>Or simply copy the <strong>Browser Address Bar</strong> URL</li>
                                                                    <li>Short links (goo.gl/maps/...) are fully supported!</li>
                                                                </ol>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Input
                                                                placeholder="Paste Google Maps URL..."
                                                                icon={<Navigation size={16} />}
                                                                value={lookupUrl}
                                                                onChange={(e) => setLookupUrl(e.target.value)}
                                                                className="flex-1"
                                                            />
                                                            <Button onClick={() => handleUrlImport()} isLoading={lookingUp} variant="secondary">
                                                                Import
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                                                        <Input
                                                            placeholder="e.g. Starbucks"
                                                            icon={<Store size={16} />}
                                                            value={formData.businessName}
                                                            onChange={(e) => {
                                                                setIsManualValue(true);
                                                                setFormData({ ...formData, businessName: e.target.value });
                                                            }}
                                                        />
                                                        {lookingUp && (
                                                            <div className="absolute right-3 top-2.5">
                                                                <Loader2 size={16} className="animate-spin text-blue-500" />
                                                            </div>
                                                        )}

                                                        {lookupResults.length > 0 && (
                                                            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                                                                {lookupResults.map((biz, i) => (
                                                                    <div
                                                                        key={i}
                                                                        className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0"
                                                                        onClick={() => selectBusiness(biz)}
                                                                    >
                                                                        <p className="text-xs font-bold text-gray-900">{biz.name}</p>
                                                                        <p className="text-[10px] text-gray-500 truncate">{biz.address}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                <p className="text-[10px] text-gray-400 mt-1">
                                                    {isUrlImport ? 'Exact match via Google Maps link.' : 'We will track where this specific business ranks in the grid.'}
                                                </p>
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Search Term</label>
                                            <Input
                                                placeholder="e.g. Divorce Lawyer"
                                                icon={<Search size={16} />}
                                                value={formData.keyword}
                                                onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Location Address</label>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="e.g. Times Square, NY"
                                                    icon={<MapPin size={16} />}
                                                    value={formData.address}
                                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                    className="flex-1"
                                                />
                                                <Button
                                                    variant="secondary"
                                                    onClick={handleGeocode}
                                                    isLoading={geocoding}
                                                    className="px-3"
                                                    title="Find on map"
                                                >
                                                    <Navigation size={16} />
                                                </Button>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1">Hint: Type address and click arrow to sync map.</p>
                                        </div>
                                    </div>

                                    {/* Map Preview */}
                                    <div className="h-[240px] rounded-lg overflow-hidden border border-gray-200 relative group">
                                        <LeafletMap
                                            center={[formData.centerLat, formData.centerLng]}
                                            zoom={13}
                                            selectionMode={true}
                                            onCenterChange={(lat, lng) => setFormData(prev => ({ ...prev, centerLat: lat, centerLng: lng }))}
                                            onGridMove={(lat, lng) => setFormData(prev => ({ ...prev, centerLat: lat, centerLng: lng }))}
                                            radius={formData.radius}
                                        />
                                        <div className="absolute top-2 right-2 z-[1000] opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="secondary" size="sm" className="bg-white/90 backdrop-blur shadow-sm border-gray-200">
                                                        <Maximize2 size={14} className="mr-1" /> Maximize
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-[90vw] w-[1200px] h-[80vh] p-0 overflow-hidden border-none shadow-2xl">
                                                    <div className="flex flex-col h-full">
                                                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
                                                            <div>
                                                                <DialogTitle className="font-bold text-gray-900">Precision Location Editor</DialogTitle>
                                                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Set Grid Center Point</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 bg-gray-50">
                                                            <LeafletMap
                                                                center={[formData.centerLat, formData.centerLng]}
                                                                zoom={15}
                                                                selectionMode={true}
                                                                onCenterChange={(lat, lng) => setFormData(prev => ({ ...prev, centerLat: lat, centerLng: lng }))}
                                                                onGridMove={(lat, lng) => setFormData(prev => ({ ...prev, centerLat: lat, centerLng: lng }))}
                                                                radius={formData.radius}
                                                            />
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {currentStep === 2 && (
                            <div className="space-y-6" >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 mb-1">Grid Configuration</h2>
                                        <p className="text-gray-500 text-sm">Define the area size and density of points.</p>
                                    </div>
                                    <div className="flex bg-gray-100 p-1 rounded-lg">
                                        <button
                                            onClick={() => setGridStrategy('GEOMETRIC')}
                                            className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${gridStrategy === 'GEOMETRIC' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                                        >
                                            Geometric Grid
                                        </button>
                                        <button
                                            onClick={() => setGridStrategy('CITY')}
                                            className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${gridStrategy === 'CITY' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                                        >
                                            Smart City Grid
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-6">
                                        {gridStrategy === 'GEOMETRIC' ? (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Shape</label>
                                                    <div className="flex gap-2">
                                                        {(['SQUARE', 'CIRCLE'] as const).map(shape => (
                                                            <button
                                                                key={shape}
                                                                onClick={() => setFormData({ ...formData, shape })}
                                                                className={`px-3 py-1.5 text-[10px] font-black tracking-widest uppercase rounded-md border ${formData.shape === shape ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'}`}
                                                            >
                                                                {shape}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Scan Radius (km): <span className="text-blue-600 font-bold">{formData.radius}km</span></label>
                                                    <input
                                                        type="range"
                                                        min="1" max="50" step="1"
                                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                        value={formData.radius}
                                                        onChange={(e) => setFormData({ ...formData, radius: parseInt(e.target.value) })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Grid Density</label>
                                                    <Select
                                                        value={formData.gridSize}
                                                        onChange={(e) => setFormData({ ...formData, gridSize: parseInt(e.target.value) })}
                                                        icon={<Grid size={16} />}
                                                    >
                                                        <option value={3}>3x3 (9 points)</option>
                                                        <option value={5}>5x5 (25 points)</option>
                                                        <option value={7}>7x7 (49 points)</option>
                                                        <option value={9}>9x9 (81 points)</option>
                                                        <option value={13}>13x13 (169 points)</option>
                                                    </Select>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="block text-xs font-bold text-blue-900 uppercase mb-1">Country</label>
                                                        <Combobox
                                                            options={countries}
                                                            value={selectedCountry}
                                                            onChange={setSelectedCountry}
                                                            placeholder="Select Country"
                                                            searchPlaceholder="Search country..."
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-blue-900 uppercase mb-1">State / Province</label>
                                                        <Combobox
                                                            options={states}
                                                            value={selectedState}
                                                            onChange={setSelectedState}
                                                            placeholder="Select State"
                                                            searchPlaceholder="Search state..."
                                                            disabled={!selectedCountry}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-blue-900 uppercase mb-1">City</label>
                                                        <Combobox
                                                            options={cities}
                                                            value={selectedCity}
                                                            onChange={setSelectedCity}
                                                            placeholder="Select City"
                                                            searchPlaceholder="Search city..."
                                                            disabled={!selectedState}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="pt-2">
                                                    <label className="block text-xs font-bold text-blue-900 uppercase mb-2">Grid Strategy</label>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setCityConfig({ ...cityConfig, type: 'zip' })}
                                                            className={`flex-1 py-2 text-xs font-bold rounded border ${cityConfig.type === 'zip' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}
                                                        >
                                                            Zip Codes
                                                        </button>
                                                        <button
                                                            onClick={() => setCityConfig({ ...cityConfig, type: 'neighborhood' })}
                                                            className={`flex-1 py-2 text-xs font-bold rounded border ${cityConfig.type === 'neighborhood' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}
                                                        >
                                                            Neighborhoods
                                                        </button>
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={handleCityFetch}
                                                    isLoading={fetchingCity}
                                                    disabled={!selectedCity || fetchingCity}
                                                    className="w-full"
                                                >
                                                    {fetchingCity ? 'Analyzing City Map...' : 'Generate Smart Grid'}
                                                </Button>
                                                {customPoints && customPoints.length > 0 && gridStrategy === 'CITY' && (
                                                    <p className="text-center text-xs text-green-600 font-bold">
                                                        Successfully generated {customPoints.length} points!
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-200 mt-4">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Editor Mode</p>
                                            <p className="text-xs text-gray-500">You can manually drag any blue pin on the map to refine the scan geometry.</p>
                                        </div>
                                    </div>

                                    <div className="h-[300px] rounded-lg overflow-hidden border border-gray-200 relative group">
                                        <LeafletMap
                                            center={[formData.centerLat, formData.centerLng]}
                                            zoom={12}
                                            selectionMode={false}
                                            radius={formData.radius}
                                            gridSize={formData.gridSize}
                                            points={(customPoints || []).map(p => ({ ...p, rank: null, hasData: true, draggable: true }))}
                                            onPointMove={handlePointMove}
                                            onGridMove={(lat, lng) => setFormData(prev => ({ ...prev, centerLat: lat, centerLng: lng }))}
                                        />
                                        <div className="absolute top-2 right-2 z-[1000] opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="secondary" size="sm" className="bg-white/90 backdrop-blur shadow-sm border-gray-200">
                                                        <Maximize2 size={14} className="mr-1" /> Edit Grid
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-[90vw] w-[1200px] h-[80vh] p-0 overflow-hidden border-none shadow-2xl">
                                                    <div className="flex flex-col h-full">
                                                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
                                                            <div>
                                                                <DialogTitle className="font-bold text-gray-900">Spatial Geometry Editor</DialogTitle>
                                                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Adjust Individual Pins or Move Whole Grid</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 bg-gray-50">
                                                            <LeafletMap
                                                                center={[formData.centerLat, formData.centerLng]}
                                                                zoom={14}
                                                                selectionMode={false}
                                                                radius={formData.radius}
                                                                gridSize={formData.gridSize}
                                                                points={(customPoints || []).map(p => ({ ...p, rank: null, hasData: true, draggable: true }))}
                                                                onPointMove={handlePointMove}
                                                                onGridMove={(lat, lng) => setFormData(prev => ({ ...prev, centerLat: lat, centerLng: lng }))}
                                                            />
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                        {/* We need an effect to sync initial points if customPoints is empty */}
                                        <PointInitializer formData={formData} onPointsGenerated={setCustomPoints} customPoints={customPoints} />
                                    </div>
                                </div>
                            </div>
                        )}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-1">Schedule Settings</h2>
                                    <p className="text-gray-500 text-sm">How often should this report run?</p>
                                </div>
                                <div className="space-y-3 max-w-md mx-auto">
                                    {['ONCE', 'DAILY', 'WEEKLY'].map((freq) => (
                                        <div
                                            key={freq}
                                            onClick={() => setFormData({ ...formData, frequency: freq })}
                                            className={`
                                    flex items-center p-4 rounded-lg border cursor-pointer transition-all
                                    ${formData.frequency === freq
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }
                                `}
                                        >
                                            <div className={`
                                    w-5 h-5 rounded-full border flex items-center justify-center mr-3
                                    ${formData.frequency === freq ? 'border-blue-600' : 'border-gray-400'}
                                `}>
                                                {formData.frequency === freq && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 capitalize">{freq.toLowerCase()}</p>
                                                <p className="text-xs text-gray-500">
                                                    {freq === 'ONCE' ? 'Run immediately one time' :
                                                        freq === 'DAILY' ? 'Runs every 24 hours' : 'Runs every 7 days'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                            {currentStep > 1 ? (
                                <Button variant="outline" onClick={prevStep}>Back</Button>
                            ) : (
                                <div />
                            )}

                            {currentStep < 3 ? (
                                <Button onClick={nextStep} disabled={!canProceed()}>
                                    Continue <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            ) : (
                                <Button onClick={handleSubmit} disabled={loading} size="lg">
                                    {loading ? <Loader2 className="animate-spin mr-2" /> : <Target className="mr-2" />}
                                    Run Scan
                                </Button>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Summary Sidebar */}
                <div className="lg:col-span-4">
                    <div className="sticky top-6 space-y-6">
                        <Card className="bg-gray-50 border-dashed">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">
                                Scan Summary
                            </h3>
                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Mode</span>
                                    <Badge variant={scanMode === 'QUICK' ? 'blue' : 'default'}>{scanMode === 'QUICK' ? 'Quick Scan' : 'Tracker'}</Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Geometry</span>
                                    <Badge variant="outline" className="font-bold">{formData.shape}</Badge>
                                </div>
                                {scanMode === 'BUSINESS' && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Business</span>
                                        <span className="font-bold text-gray-900 text-right flex-1 ml-4 leading-tight">{formData.businessName || '-'}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Keyword</span>
                                    <span className="font-bold text-gray-900">{formData.keyword || '-'}</span>
                                </div>
                                <div className="flex justify-between items-start">
                                    <span className="text-gray-500">Center</span>
                                    <span className="font-mono text-[10px] text-right text-gray-900">
                                        {formData.centerLat.toFixed(4)},<br />{formData.centerLng.toFixed(4)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Points</span>
                                    <span className="font-medium text-gray-900">{customPoints?.length || (formData.gridSize * formData.gridSize)} Total</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Radius</span>
                                    <span className="font-medium text-gray-900">{formData.radius} km</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Schedule</span>
                                    <Badge variant="blue">{formData.frequency}</Badge>
                                </div>
                            </div>
                        </Card>

                        <div className="flex items-start gap-3 p-4 bg-blue-50 text-blue-800 rounded-lg text-xs leading-relaxed border border-blue-100">
                            <Clock className="min-w-4 w-4 mt-0.5" />
                            <p>
                                This scan will launch <strong>{customPoints?.length || (formData.gridSize * formData.gridSize)}</strong> headless browser instances.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
