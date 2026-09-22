export type UnitSystem = 'metric' | 'imperial';
export type ThemeMode = 'dark' | 'light';

export type WeatherTheme = 
  | 'sunny' 
  | 'cloudy' 
  | 'rain' 
  | 'storm' 
  | 'snow' 
  | 'night' 
  | 'default';

export interface LocationData {
  id: string | number;
  name: string;
  region?: string;
  country: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface CurrentWeather {
  temperature: number; // always stored in Celsius from raw API
  apparentTemperature: number;
  weatherCode: number;
  condition: string;
  isDay: boolean;
  humidity: number; // %
  windSpeed: number; // km/h
  windDirection: number; // degrees
  windGusts?: number;
  pressure: number; // hPa
  visibility: number; // km
  uvIndex: number; // 0-12
  cloudCover: number; // %
  precipitation: number; // mm
  localTime: string;
  dateFormatted: string;
  sunrise: string;
  sunset: string;
}

export interface HourlyPoint {
  time: string;
  isoTime: string;
  hourLabel: string;
  temperature: number;
  apparentTemperature: number;
  weatherCode: number;
  condition: string;
  precipitationProbability: number;
  precipitation: number;
  windSpeed: number;
  uvIndex: number;
  isDay: boolean;
  isCurrentHour?: boolean;
}

export interface DailyPoint {
  date: string;
  dayName: string;
  shortDate: string;
  weatherCode: number;
  condition: string;
  tempMax: number;
  tempMin: number;
  precipitationProbability: number;
  precipitationSum: number;
  uvIndexMax: number;
  windSpeedMax: number;
  sunrise: string;
  sunset: string;
}

export interface AirQualityData {
  aqi: number;
  category: 'Good' | 'Moderate' | 'Unhealthy for Sensitive' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
  categoryColor: string;
  pm2_5: number;
  pm10: number;
  co: number;
  no2: number;
  o3: number;
  so2: number;
  summary: string;
}

export interface WeatherData {
  location: LocationData;
  current: CurrentWeather;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
  airQuality?: AirQualityData;
  theme: WeatherTheme;
  lastUpdated: string;
}

export interface FavoriteLocation {
  id: string;
  name: string;
  region?: string;
  country: string;
  latitude: number;
  longitude: number;
  tempCelsius?: number;
  weatherCode?: number;
  condition?: string;
  addedAt: number;
}

export interface RecentSearch {
  id: string;
  name: string;
  region?: string;
  country: string;
  latitude: number;
  longitude: number;
  timestamp: number;
}
