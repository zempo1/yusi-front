import { api } from './api'

/**
 * POI 搜索结果
 */
export interface POIResult {
    id: string
    name: string
    address: string
    latitude: number
    longitude: number
    district?: string
    type?: string
}

/**
 * 逆地理编码结果
 */
export interface ReverseGeocodeResult {
    address: string
    district: string
    city: string
}

/**
 * POI 搜索 (通过后端代理)
 */
export const searchPOI = async (keyword: string, city?: string): Promise<POIResult[]> => {
    if (!keyword || keyword.length < 2) {
        return []
    }

    try {
        const response = await api.get<{ data: POIResult[] }>('/geo/search', {
            params: { keyword, city: city || '' }
        })
        return response.data.data || []
    } catch (e) {
        console.error('POI search failed:', e)
        return []
    }
}

/**
 * 逆地理编码 (通过后端代理)
 */
export const reverseGeocode = async (lat: number, lng: number): Promise<ReverseGeocodeResult | null> => {
    try {
        const response = await api.get<{ data: ReverseGeocodeResult }>('/geo/reverse', {
            params: { lat, lng }
        })
        return response.data.data || null
    } catch (e) {
        console.error('Reverse geocode failed:', e)
        return null
    }
}
