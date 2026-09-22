import { WeatherData } from '../types/weather';
import { evaluateAirQuality } from './weatherUtils';

export function getFallbackWeatherData(city: string = 'Lahore', country: string = 'Pakistan'): WeatherData {
  const now = new Date();
  const currentHour = now.getHours();
  
  // Format current date e.g. "Sunday, 20 September 2026"
  const dateFormatted = now.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const localTime = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const sunriseDate = new Date();
  sunriseDate.setHours(5, 42, 0, 0);
  const sunsetDate = new Date();
  sunsetDate.setHours(18, 48, 0, 0);

  const hourly = Array.from({ length: 24 }).map((_, i) => {
    const d = new Date();
    d.setHours(i, 0, 0, 0);
    const hour = d.getHours();
    const isDay = hour >= 6 && hour < 19;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hourLabel = `${hour % 12 || 12} ${ampm}`;
    
    // diurnal temp curve peaking at 34C around 14:00
    const tempCurve = 26 + 8 * Math.sin(((hour - 7) / 24) * 2 * Math.PI);
    const temp = Math.round(tempCurve);
    
    return {
      time: d.toISOString(),
      isoTime: d.toISOString(),
      hourLabel,
      temperature: temp,
      apparentTemperature: temp + 3,
      weatherCode: (hour >= 11 && hour <= 16) ? 2 : 1, // partly cloudy or clear
      condition: (hour >= 11 && hour <= 16) ? 'Partly Cloudy' : 'Mainly Clear',
      precipitationProbability: hour === 15 ? 15 : 5,
      precipitation: 0,
      windSpeed: 10 + Math.round(Math.sin(i) * 5),
      uvIndex: isDay ? Math.max(0, Math.round(7 * Math.sin(((hour - 6) / 13) * Math.PI))) : 0,
      isDay,
      isCurrentHour: hour === currentHour,
    };
  });

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fullDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const conditions = [
    { code: 2, condition: 'Partly Cloudy', max: 34, min: 26, rain: 10 },
    { code: 0, condition: 'Sunny', max: 35, min: 27, rain: 5 },
    { code: 2, condition: 'Partly Cloudy', max: 34, min: 26, rain: 15 },
    { code: 61, condition: 'Rain', max: 30, min: 25, rain: 65 },
    { code: 3, condition: 'Overcast', max: 31, min: 24, rain: 30 },
    { code: 1, condition: 'Mainly Clear', max: 33, min: 25, rain: 10 },
    { code: 0, condition: 'Sunny', max: 36, min: 27, rain: 0 },
  ];

  const daily = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(now.getDate() + i);
    const dayOfWeek = d.getDay();
    const cond = conditions[i % conditions.length];
    
    return {
      date: d.toISOString().split('T')[0],
      dayName: i === 0 ? 'Today' : fullDays[dayOfWeek].slice(0, 3).toUpperCase(),
      shortDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weatherCode: cond.code,
      condition: cond.condition,
      tempMax: cond.max,
      tempMin: cond.min,
      precipitationProbability: cond.rain,
      precipitationSum: cond.rain > 50 ? 8.4 : 0.2,
      uvIndexMax: 7,
      windSpeedMax: 16,
      sunrise: sunriseDate.toISOString(),
      sunset: sunsetDate.toISOString(),
    };
  });

  return {
    location: {
      id: 'lahore-default',
      name: city,
      region: 'Punjab',
      country: country,
      latitude: 31.5497,
      longitude: 74.3436,
      timezone: 'Asia/Karachi',
    },
    current: {
      temperature: 31,
      apparentTemperature: 34,
      weatherCode: 2,
      condition: 'Partly Cloudy',
      isDay: currentHour >= 6 && currentHour < 19,
      humidity: 72,
      windSpeed: 14,
      windDirection: 135,
      windGusts: 22,
      pressure: 1012,
      visibility: 8,
      uvIndex: 6,
      cloudCover: 35,
      precipitation: 0,
      localTime,
      dateFormatted,
      sunrise: sunriseDate.toISOString(),
      sunset: sunsetDate.toISOString(),
    },
    hourly,
    daily,
    airQuality: evaluateAirQuality(92), // Moderate AQI
    theme: 'cloudy',
    lastUpdated: now.toISOString(),
  };
}
