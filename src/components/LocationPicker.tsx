import { useState, useEffect, useCallback, useRef } from 'react'
import { Button, Input, Card } from './ui'
import { MapPin, Navigation, X, Star, Home, Briefcase, Heart, ChevronDown, ChevronUp, Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import {
    type GeoLocation,
    type UserLocation,
    getUserLocations,
    getCurrentPosition
} from '../lib/location'
import { searchPOI, reverseGeocode, type POIResult } from '../lib/amap'
import { useAuthStore } from '../store/authStore'

interface LocationPickerProps {
    value?: GeoLocation | null
    onChange: (location: GeoLocation | null) => void
    className?: string
}

const LOCATION_ICONS: Record<string, React.ElementType> = {
    home: Home,
    work: Briefcase,
    heart: Heart,
    star: Star,
    location: MapPin
}

export const LocationPicker = ({ value, onChange, className = '' }: LocationPickerProps) => {
    const { user } = useAuthStore()
    const [isExpanded, setIsExpanded] = useState(false)
    const [isLocating, setIsLocating] = useState(false)
    const [savedLocations, setSavedLocations] = useState<UserLocation[]>([])
    const [loadingSaved, setLoadingSaved] = useState(false)

    // Search state
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<POIResult[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Load saved locations
    const loadSavedLocations = useCallback(async () => {
        if (!user?.userId) return
        setLoadingSaved(true)
        try {
            const locations = await getUserLocations(user.userId)
            setSavedLocations(locations)
        } catch (e) {
            console.error('Failed to load saved locations', e)
        } finally {
            setLoadingSaved(false)
        }
    }, [user?.userId])

    useEffect(() => {
        if (isExpanded && savedLocations.length === 0) {
            loadSavedLocations()
        }
    }, [isExpanded, savedLocations.length, loadSavedLocations])

    // Debounced POI search
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }

        if (!searchQuery.trim() || searchQuery.length < 2) {
            setSearchResults([])
            return
        }

        searchTimeoutRef.current = setTimeout(async () => {
            setIsSearching(true)
            try {
                const results = await searchPOI(searchQuery)
                setSearchResults(results)
            } catch (e) {
                console.error('POI search failed:', e)
                setSearchResults([])
            } finally {
                setIsSearching(false)
            }
        }, 300)

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current)
            }
        }
    }, [searchQuery])

    // Get current location using browser API + Amap reverse geocode
    const handleAutoLocate = async () => {
        setIsLocating(true)
        try {
            const position = await getCurrentPosition()
            const { latitude, longitude } = position.coords

            // Use backend proxy for reverse geocoding
            try {
                const geocodeResult = await reverseGeocode(latitude, longitude)
                if (geocodeResult) {
                    onChange({
                        latitude,
                        longitude,
                        address: geocodeResult.address,
                        placeName: geocodeResult.district || '当前位置'
                    })
                    toast.success('定位成功')
                } else {
                    // Fallback if reverse geocoding fails
                    onChange({
                        latitude,
                        longitude,
                        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                        placeName: '当前位置'
                    })
                    toast.success('定位成功（地址解析失败）')
                }
            } catch {
                // Fallback if reverse geocoding fails
                onChange({
                    latitude,
                    longitude,
                    address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                    placeName: '当前位置'
                })
                toast.success('定位成功（地址解析失败）')
            }
            setIsExpanded(false)
        } catch (err) {
            console.error('Geolocation error:', err)
            if (err instanceof GeolocationPositionError) {
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        toast.error('请允许浏览器获取您的位置')
                        break
                    case err.POSITION_UNAVAILABLE:
                        toast.error('无法获取位置信息')
                        break
                    case err.TIMEOUT:
                        toast.error('定位超时，请重试')
                        break
                }
            } else {
                toast.error('定位失败，请手动搜索')
            }
        } finally {
            setIsLocating(false)
        }
    }

    // Select a POI from search results
    const handleSelectPOI = (poi: POIResult) => {
        onChange({
            latitude: poi.latitude,
            longitude: poi.longitude,
            address: poi.address,
            placeName: poi.name,
            placeId: poi.id
        })
        setSearchQuery('')
        setSearchResults([])
        setIsExpanded(false)
    }

    // Select a saved location
    const handleSelectSaved = (location: UserLocation) => {
        onChange({
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address,
            placeName: location.name,
            placeId: location.placeId
        })
        setIsExpanded(false)
    }

    // Clear location
    const handleClear = () => {
        onChange(null)
    }

    const getIconComponent = (iconName: string) => {
        return LOCATION_ICONS[iconName] || MapPin
    }

    return (
        <div className={`relative ${className}`}>
            {/* Current Selection Display */}
            {value ? (
                <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                            {value.placeName || value.address || '已选择位置'}
                        </div>
                        {value.address && value.placeName !== value.address && (
                            <div className="text-xs text-muted-foreground truncate">
                                {value.address}
                            </div>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={handleClear}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            ) : (
                <Button
                    variant="outline"
                    className="w-full justify-start text-muted-foreground"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <MapPin className="w-4 h-4 mr-2" />
                    添加位置
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4 ml-auto" />
                    ) : (
                        <ChevronDown className="w-4 h-4 ml-auto" />
                    )}
                </Button>
            )}

            {/* Expanded Panel */}
            {isExpanded && !value && (
                <Card className="absolute z-[9999] top-full mt-2 left-0 right-0 p-4 shadow-xl border bg-background max-h-[400px] overflow-hidden flex flex-col">
                    <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="搜索地点..."
                                className="pl-9 pr-4"
                                autoFocus
                            />
                            {isSearching && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                            )}
                        </div>

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <div className="flex-1 overflow-y-auto space-y-1 border-t pt-2 max-h-[150px]">
                                {searchResults.map(poi => (
                                    <button
                                        key={poi.id}
                                        className="flex items-start gap-2 p-2 w-full text-left rounded-md hover:bg-muted/50 transition-colors"
                                        onClick={() => handleSelectPOI(poi)}
                                    >
                                        <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-medium truncate">{poi.name}</div>
                                            <div className="text-xs text-muted-foreground truncate">{poi.address}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Auto Location */}
                        <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={handleAutoLocate}
                            disabled={isLocating}
                        >
                            {isLocating ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Navigation className="w-4 h-4 mr-2" />
                            )}
                            获取当前位置
                        </Button>

                        {/* Saved Locations */}
                        {savedLocations.length > 0 && (
                            <div className="space-y-2">
                                <div className="text-xs font-medium text-muted-foreground">常用地点</div>
                                <div className="grid gap-1 max-h-24 overflow-y-auto">
                                    {savedLocations.map(loc => {
                                        const IconComponent = getIconComponent(loc.icon)
                                        return (
                                            <button
                                                key={loc.locationId}
                                                className="flex items-center gap-2 p-2 text-sm text-left rounded-md hover:bg-muted/50 transition-colors"
                                                onClick={() => handleSelectSaved(loc)}
                                            >
                                                <IconComponent className="w-4 h-4 text-muted-foreground" />
                                                <span className="truncate flex-1">{loc.name}</span>
                                                {loc.locationType === 'IMPORTANT' && (
                                                    <Heart className="w-3 h-3 text-red-400 flex-shrink-0 fill-red-400" />
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {loadingSaved && (
                            <div className="flex items-center justify-center py-2">
                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                            </div>
                        )}

                        {/* Close */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-muted-foreground"
                            onClick={() => setIsExpanded(false)}
                        >
                            取消
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    )
}
