import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const PORT = 3000;

// Simple in-memory TTL cache
interface CacheEntry<T> {
  data: T;
  expiry: number;
}
const cache = new Map<string, CacheEntry<any>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache<T>(key: string, data: T, ttlMs: number = 3 * 60 * 1000) {
  cache.set(key, {
    data,
    expiry: Date.now() + ttlMs,
  });
}

// Lazy Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// WMO weather code descriptions
const WMO_CONDITIONS: Record<number, string> = {
  0: 'Clear Sky',
  1: 'Mainly Clear',
  2: 'Partly Cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing Rime Fog',
  51: 'Light Drizzle',
  53: 'Moderate Drizzle',
  55: 'Dense Drizzle',
  56: 'Light Freezing Drizzle',
  57: 'Dense Freezing Drizzle',
  61: 'Slight Rain',
  62: 'Moderate Rain',
  63: 'Moderate Rain',
  65: 'Heavy Rain',
  66: 'Light Freezing Rain',
  67: 'Heavy Freezing Rain',
  71: 'Slight Snow Fall',
  73: 'Moderate Snow Fall',
  75: 'Heavy Snow Fall',
  77: 'Snow Grains',
  80: 'Slight Rain Showers',
  81: 'Moderate Rain Showers',
  82: 'Violent Rain Showers',
  85: 'Slight Snow Showers',
  86: 'Heavy Snow Showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with Hail',
  99: 'Severe Thunderstorm',
};

function getWeatherTheme(code: number, isDay: boolean): string {
  if (!isDay && (code === 0 || code === 1)) return 'night';
  if (code === 0 || code === 1) return 'sunny';
  if (code === 2 || code === 3 || code === 45 || code === 48) return 'cloudy';
  if (code >= 51 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain';
  if (code >= 85 && code <= 86) return 'snow';
  if (code >= 95) return 'storm';
  return isDay ? 'sunny' : 'night';
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Autocomplete location search
  app.get('/api/search', async (req, res) => {
    try {
      const q = String(req.query.q || '').trim();
      if (!q || q.length < 2) {
        return res.json({ results: [] });
      }

      const cacheKey = `search:${q.toLowerCase()}`;
      const cached = getCached<any[]>(cacheKey);
      if (cached) {
        return res.json({ results: cached });
      }

      const apiUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=7&language=en&format=json`;
      const response = await fetch(apiUrl, { headers: { 'User-Agent': 'SkyCast/1.0' } });
      
      if (!response.ok) {
        return res.json({ results: [] });
      }

      const data = await response.json();
      const results = (data.results || []).map((item: any) => ({
        id: `${item.id || item.name}-${item.latitude}`,
        name: item.name,
        region: item.admin1 || item.admin2 || '',
        country: item.country || '',
        countryCode: item.country_code || '',
        latitude: item.latitude,
        longitude: item.longitude,
        timezone: item.timezone || 'UTC',
      }));

      setCache(cacheKey, results, 10 * 60 * 1000); // 10 min cache
      res.json({ results });
    } catch (error) {
      console.error('Search error:', error);
      res.json({ results: [] });
    }
  });

  // Weather & Forecast combined endpoint
  app.get('/api/weather', async (req, res) => {
    try {
      let lat = req.query.lat ? parseFloat(String(req.query.lat)) : null;
      let lon = req.query.lon ? parseFloat(String(req.query.lon)) : null;
      const cityParam = String(req.query.city || '').trim();

      let locationInfo: any = {
        name: cityParam || 'Lahore',
        region: '',
        country: 'Pakistan',
        latitude: 31.5497,
        longitude: 74.3436,
        timezone: 'Asia/Karachi',
      };

      // If city provided without coordinates, resolve via Geocoding
      if ((lat === null || lon === null || isNaN(lat) || isNaN(lon)) && cityParam) {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityParam)}&count=1&language=en&format=json`;
        try {
          const geoRes = await fetch(geoUrl, { headers: { 'User-Agent': 'SkyCast/1.0' } });
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData.results && geoData.results.length > 0) {
              const best = geoData.results[0];
              lat = best.latitude;
              lon = best.longitude;
              locationInfo = {
                name: best.name,
                region: best.admin1 || '',
                country: best.country || '',
                countryCode: best.country_code || '',
                latitude: best.latitude,
                longitude: best.longitude,
                timezone: best.timezone || 'auto',
              };
            }
          }
        } catch (e) {
          console.warn('Geocoding lookup fallback:', e);
        }
      }

      // Default fallback coordinates if still undefined: Lahore
      if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) {
        lat = 31.5497;
        lon = 74.3436;
      }

      const cacheKey = `weather:${lat.toFixed(3)},${lon.toFixed(3)}`;
      const cached = getCached<any>(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      // Fetch from Open-Meteo Forecast
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m,uv_index,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;
      
      // Fetch from Open-Meteo Air Quality
      const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone,sulphur_dioxide&timezone=auto`;

      const [weatherRes, aqiRes] = await Promise.allSettled([
        fetch(weatherUrl, { headers: { 'User-Agent': 'SkyCast/1.0' } }),
        fetch(aqiUrl, { headers: { 'User-Agent': 'SkyCast/1.0' } }),
      ]);

      if (weatherRes.status !== 'fulfilled' || !weatherRes.value.ok) {
        throw new Error('Weather upstream unavailable');
      }

      const wData = await weatherRes.value.json();
      let aqiData: any = null;
      if (aqiRes.status === 'fulfilled' && aqiRes.value.ok) {
        aqiData = await aqiRes.value.json();
      }

      const currentRaw = wData.current || {};
      const hourlyRaw = wData.hourly || {};
      const dailyRaw = wData.daily || {};

      const now = new Date();
      const currentIsoHour = now.toISOString().slice(0, 13); // "2026-09-20T21"

      // Format current time and date
      const localTime = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      const dateFormatted = now.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      const isDay = currentRaw.is_day === 1;
      const weatherCode = currentRaw.weather_code ?? 0;
      const condition = WMO_CONDITIONS[weatherCode] || 'Partly Cloudy';
      const theme = getWeatherTheme(weatherCode, isDay);

      // Hourly items (next 24 hours)
      const hourlyTimes: string[] = hourlyRaw.time || [];
      const currentHourIndex = Math.max(
        0,
        hourlyTimes.findIndex((t: string) => t.startsWith(currentIsoHour))
      );

      const next24 = hourlyTimes.slice(currentHourIndex, currentHourIndex + 24);
      const hourlyList = next24.map((t: string, idx: number) => {
        const rawIdx = currentHourIndex + idx;
        const d = new Date(t);
        const hour = d.getHours();
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hourLabel = `${hour % 12 || 12} ${ampm}`;
        const code = hourlyRaw.weather_code?.[rawIdx] ?? 0;
        const isDayH = hourlyRaw.is_day?.[rawIdx] === 1;

        return {
          time: t,
          isoTime: t,
          hourLabel: idx === 0 ? 'Now' : hourLabel,
          temperature: Math.round(hourlyRaw.temperature_2m?.[rawIdx] ?? 20),
          apparentTemperature: Math.round(hourlyRaw.apparent_temperature?.[rawIdx] ?? 20),
          weatherCode: code,
          condition: WMO_CONDITIONS[code] || 'Clear',
          precipitationProbability: hourlyRaw.precipitation_probability?.[rawIdx] ?? 0,
          precipitation: hourlyRaw.precipitation?.[rawIdx] ?? 0,
          windSpeed: Math.round(hourlyRaw.wind_speed_10m?.[rawIdx] ?? 10),
          uvIndex: Math.round(hourlyRaw.uv_index?.[rawIdx] ?? 0),
          isDay: isDayH,
          isCurrentHour: idx === 0,
        };
      });

      // Daily items (7 days)
      const dailyTimes: string[] = dailyRaw.time || [];
      const dailyList = dailyTimes.slice(0, 7).map((dStr: string, idx: number) => {
        const d = new Date(dStr);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const fullDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayOfWeek = d.getDay();
        const code = dailyRaw.weather_code?.[idx] ?? 0;

        return {
          date: dStr,
          dayName: idx === 0 ? 'Today' : fullDays[dayOfWeek].slice(0, 3).toUpperCase(),
          shortDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          weatherCode: code,
          condition: WMO_CONDITIONS[code] || 'Partly Cloudy',
          tempMax: Math.round(dailyRaw.temperature_2m_max?.[idx] ?? 30),
          tempMin: Math.round(dailyRaw.temperature_2m_min?.[idx] ?? 20),
          precipitationProbability: dailyRaw.precipitation_probability_max?.[idx] ?? 0,
          precipitationSum: dailyRaw.precipitation_sum?.[idx] ?? 0,
          uvIndexMax: Math.round(dailyRaw.uv_index_max?.[idx] ?? 5),
          windSpeedMax: Math.round(dailyRaw.wind_speed_10m_max?.[idx] ?? 12),
          sunrise: dailyRaw.sunrise?.[idx] || '',
          sunset: dailyRaw.sunset?.[idx] || '',
        };
      });

      // Air Quality
      let airQualityResult: any = undefined;
      if (aqiData?.current) {
        const cAqi = aqiData.current;
        const usAqi = cAqi.us_aqi ?? 50;
        let category = 'Good';
        let categoryColor = 'text-emerald-400';
        let summary = 'Air quality is considered satisfactory, and air pollution poses little or no risk.';

        if (usAqi <= 50) {
          category = 'Good';
          categoryColor = 'text-emerald-400';
          summary = 'Air quality is ideal for outdoor recreation.';
        } else if (usAqi <= 100) {
          category = 'Moderate';
          categoryColor = 'text-amber-400';
          summary = 'Air quality is acceptable; unusually sensitive individuals should take precautions.';
        } else if (usAqi <= 150) {
          category = 'Unhealthy for Sensitive';
          categoryColor = 'text-orange-400';
          summary = 'Sensitive groups may experience minor health impacts.';
        } else if (usAqi <= 200) {
          category = 'Unhealthy';
          categoryColor = 'text-rose-400';
          summary = 'Everyone may experience minor irritation.';
        } else {
          category = 'Very Unhealthy';
          categoryColor = 'text-purple-400';
          summary = 'Health warnings in effect. Avoid prolonged exposure.';
        }

        airQualityResult = {
          aqi: Math.round(usAqi),
          category,
          categoryColor,
          pm2_5: Math.round(cAqi.pm2_5 ?? 15),
          pm10: Math.round(cAqi.pm10 ?? 25),
          co: +(cAqi.carbon_monoxide ? (cAqi.carbon_monoxide / 1000).toFixed(1) : 0.4),
          no2: Math.round(cAqi.nitrogen_dioxide ?? 12),
          o3: Math.round(cAqi.ozone ?? 30),
          so2: Math.round(cAqi.sulphur_dioxide ?? 5),
          summary,
        };
      }

      const weatherPayload = {
        location: locationInfo,
        current: {
          temperature: Math.round(currentRaw.temperature_2m ?? 25),
          apparentTemperature: Math.round(currentRaw.apparent_temperature ?? 27),
          weatherCode,
          condition,
          isDay,
          humidity: Math.round(currentRaw.relative_humidity_2m ?? 60),
          windSpeed: Math.round(currentRaw.wind_speed_10m ?? 12),
          windDirection: Math.round(currentRaw.wind_direction_10m ?? 180),
          windGusts: Math.round(currentRaw.wind_gusts_10m ?? 18),
          pressure: Math.round(currentRaw.pressure_msl ?? currentRaw.surface_pressure ?? 1013),
          visibility: 10,
          uvIndex: Math.round(hourlyRaw.uv_index?.[currentHourIndex] ?? 5),
          cloudCover: Math.round(currentRaw.cloud_cover ?? 30),
          precipitation: currentRaw.precipitation ?? 0,
          localTime,
          dateFormatted,
          sunrise: dailyRaw.sunrise?.[0] || '',
          sunset: dailyRaw.sunset?.[0] || '',
        },
        hourly: hourlyList,
        daily: dailyList,
        airQuality: airQualityResult,
        theme,
        lastUpdated: new Date().toISOString(),
      };

      setCache(cacheKey, weatherPayload, 3 * 60 * 1000);
      res.json(weatherPayload);
    } catch (error: any) {
      console.error('Weather error:', error);
      res.status(503).json({
        error: 'Unable to fetch weather data at this time.',
        details: error.message,
      });
    }
  });

  // Dedicated forecast endpoint (alias/filtered)
  app.get('/api/forecast', async (req, res) => {
    try {
      const city = req.query.city;
      const lat = req.query.lat;
      const lon = req.query.lon;
      
      const queryStr = lat && lon ? `lat=${lat}&lon=${lon}` : `city=${encodeURIComponent(String(city || 'Lahore'))}`;
      const internalRes = await fetch(`http://localhost:${PORT}/api/weather?${queryStr}`);
      if (!internalRes.ok) throw new Error('Forecast fetch failed');
      const data = await internalRes.json();
      res.json({
        location: data.location,
        hourly: data.hourly,
        daily: data.daily,
      });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to retrieve forecast' });
    }
  });

  // AI Weather Meteorologist Brief (Powered by Gemini)
  app.post('/api/ai/weather-brief', async (req, res) => {
    try {
      const { city, condition, temp, feelsLike, humidity, windSpeed, uvIndex, aqi } = req.body;
      const ai = getGemini();

      if (!ai) {
        return res.json({
          brief: `Today in ${city || 'your area'}, expect ${condition || 'pleasant weather'} around ${temp || '28'}°C (feels like ${feelsLike || temp}°C). Winds are blowing at ${windSpeed || '12'} km/h with ${humidity || '60'}% humidity.`,
          outfit: 'Comfortable seasonal layers, breathable fabric, and sunscreen if heading outdoors.',
          recommendation: 'A wonderful day for productivity and evening outdoor walks.',
        });
      }

      const prompt = `You are an expert, friendly broadcast meteorologist for the weather app SkyCast.
Generate a concise, engaging, professional weather summary and outfit recommendation for:
Location: ${city}
Current Condition: ${condition}
Temperature: ${temp}°C (Feels like: ${feelsLike}°C)
Humidity: ${humidity}%
Wind Speed: ${windSpeed} km/h
UV Index: ${uvIndex}
Air Quality: ${aqi || 'Moderate'}

Respond ONLY with a valid JSON object matching this structure:
{
  "brief": "A 2-3 sentence lively meteorological analysis of the conditions today.",
  "outfit": "A quick 1-2 sentence recommendation on what to wear and take (jacket, sunglasses, umbrella, etc.).",
  "recommendation": "1 sentence outdoor activity advice."
}`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = aiResponse.text || '{}';
      const parsed = JSON.parse(text);
      res.json(parsed);
    } catch (error: any) {
      console.warn('AI weather brief fallback:', error);
      res.json({
        brief: `Current atmospheric conditions show steady ${req.body.condition || 'weather'} across ${req.body.city || 'the region'} with temperatures around ${req.body.temp || '28'}°C.`,
        outfit: 'Light comfortable wear with UV sunglasses recommended.',
        recommendation: 'Ideal conditions for normal daily activities.',
      });
    }
  });

  // AI Weather Scene Art Generator
  app.post('/api/ai/image', async (req, res) => {
    try {
      const { prompt: userPrompt, city, condition } = req.body;
      const ai = getGemini();
      if (!ai) {
        return res.status(503).json({ error: 'Gemini AI service unavailable or key unconfigured.' });
      }

      const prompt = userPrompt || `A breathtaking, high-aesthetic atmospheric landscape postcard of ${city || 'Lahore'} during ${condition || 'clear skies'}, modern minimalist architectural photography, cinematic lighting, ultra-clean composition.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: prompt }],
        },
      });

      let imageUrl: string | null = null;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (!imageUrl) {
        return res.status(500).json({ error: 'No image generated.' });
      }

      res.json({ imageUrl, prompt });
    } catch (error: any) {
      console.error('Image generation error:', error);
      res.status(500).json({ error: error.message || 'Failed to generate weather art.' });
    }
  });

  // Vite Middleware Integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SkyCast Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
