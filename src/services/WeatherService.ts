import fetch from 'node-fetch';

export interface WeatherSolarData {
  cloud: number;
  sunrise: number; // unix
  sunset: number;  // unix
}

interface OpenWeatherResponse {
  clouds?: { all?: number };
  sys?: { sunrise?: number; sunset?: number };
}

export class WeatherService {
  constructor(private readonly apiKey?: string) {}

  async getSolarData(lat: number, lon: number): Promise<WeatherSolarData | null> {
  if (!this.apiKey) return null;

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Weather API error: ${res.status}`);
  }

  const data = (await res.json()) as {
    clouds?: { all?: number };
    sys?: { sunrise?: number; sunset?: number };
  };

  return {
    cloud: data.clouds?.all ?? 0,
    sunrise: data.sys?.sunrise ?? 0,
    sunset: data.sys?.sunset ?? 0,
  };
}

}
