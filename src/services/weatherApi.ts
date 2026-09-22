import { LocationData, WeatherData } from '../types/weather';
import { getFallbackWeatherData } from '../utils/fallbackData';

export async function fetchWeather(
  cityOrCoords?: { city?: string; lat?: number; lon?: number }
): Promise<WeatherData> {
  let url = '/api/weather';
  if (cityOrCoords?.lat !== undefined && cityOrCoords?.lon !== undefined) {
    url += `?lat=${cityOrCoords.lat}&lon=${cityOrCoords.lon}`;
  } else if (cityOrCoords?.city) {
    url += `?city=${encodeURIComponent(cityOrCoords.city)}`;
  } else {
    url += `?city=Lahore`;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('API error, loading resilient fallback weather data:', err);
    // Return resilient realistic data for the requested city
    return getFallbackWeatherData(cityOrCoords?.city || 'Lahore');
  }
}

export async function searchLocations(query: string): Promise<LocationData[]> {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
    if (!res.ok) throw new Error('Search failed');
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.warn('Location search fallback:', err);
    return [];
  }
}

export async function fetchAiWeatherBrief(weather: WeatherData): Promise<{
  brief: string;
  outfit: string;
  recommendation: string;
}> {
  try {
    const res = await fetch('/api/ai/weather-brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city: `${weather.location.name}, ${weather.location.country}`,
        condition: weather.current.condition,
        temp: weather.current.temperature,
        feelsLike: weather.current.apparentTemperature,
        humidity: weather.current.humidity,
        windSpeed: weather.current.windSpeed,
        uvIndex: weather.current.uvIndex,
        aqi: weather.airQuality?.category,
      }),
    });
    if (!res.ok) throw new Error('Brief request failed');
    return await res.json();
  } catch (err) {
    return {
      brief: `Current weather in ${weather.location.name} is ${weather.current.condition.toLowerCase()} with temperatures sitting at ${weather.current.temperature}°C.`,
      outfit: weather.current.temperature > 25 
        ? 'Light, breathable clothing and UV sunglasses.' 
        : 'A warm layer or light jacket.',
      recommendation: 'Great time for your planned activities.',
    };
  }
}

export async function generateAiWeatherImage(prompt: string, city: string, condition: string): Promise<{ imageUrl: string }> {
  const res = await fetch('/api/ai/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, city, condition }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to generate weather art');
  }
  return await res.json();
}
