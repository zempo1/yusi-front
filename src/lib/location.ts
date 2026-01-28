import { api } from './api'

/**
 * 地理位置信息
 */
export interface GeoLocation {
    latitude: number
    longitude: number
    address?: string
    placeName?: string
    placeId?: string
}

/**
 * 用户保存的地点
 */
export interface UserLocation {
    locationId: string
    userId: string
    name: string
    latitude: number
    longitude: number
    address?: string
    placeId?: string
    locationType: 'FREQUENT' | 'IMPORTANT'
    icon: string
    createTime: string
    updateTime: string
}

export interface AddLocationRequest {
    userId: string
    name: string
    latitude: number
    longitude: number
    address?: string
    placeId?: string
    locationType?: 'FREQUENT' | 'IMPORTANT'
    icon?: string
}

export interface UpdateLocationRequest {
    userId: string
    locationId: string
    name?: string
    latitude?: number
    longitude?: number
    address?: string
    placeId?: string
    locationType?: 'FREQUENT' | 'IMPORTANT'
    icon?: string
}

/**
 * 获取用户保存的地点列表
 */
export const getUserLocations = async (userId: string, locationType?: string): Promise<UserLocation[]> => {
    const { data } = await api.get('/location/list', {
        params: { userId, locationType }
    })
    return data.data || []
}

/**
 * 添加新地点
 */
export const addUserLocation = async (request: AddLocationRequest): Promise<UserLocation> => {
    const { data } = await api.post('/location', request)
    return data.data
}

/**
 * 更新地点
 */
export const updateUserLocation = async (request: UpdateLocationRequest): Promise<UserLocation> => {
    const { data } = await api.put('/location', request)
    return data.data
}

/**
 * 删除地点
 */
export const deleteUserLocation = async (userId: string, locationId: string): Promise<void> => {
    await api.delete(`/location/${locationId}`, {
        params: { userId }
    })
}

/**
 * 获取当前位置（使用浏览器 Geolocation API）
 */
export const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('浏览器不支持地理定位'))
            return
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        })
    })
}

/**
 * 逆地理编码：经纬度转地址
 * 注意：需要配合高德地图 API 使用
 */
export const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
    // TODO: 集成高德地图逆地理编码 API
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
}
