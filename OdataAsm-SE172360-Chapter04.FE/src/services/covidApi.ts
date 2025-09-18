import axios from 'axios';
import type { CovidRecord, CountryData } from '../types/covid';

// Prefer env-configured base URL, fallback to localhost:9090
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9090/odata';

// Encode date for OData query - must be in format: datetime'2022-01-01T00:00:00Z' 
function formatDateForOData(dateStr: string): string {
  const date = new Date(dateStr);
  return `datetime'${date.toISOString()}'`;
}

// Helper to safely build OData URLs
function buildODataUrl(endpoint: string, params: Record<string, string>): string {
  let url = `${API_BASE_URL}/${endpoint}?`;
  
  // Add parameters with $ prefix
  const queryParts = Object.entries(params).map(([key, value]) => {
    return `$${key}=${value}`;
  });
  
  return url + queryParts.join('&');
}

export const covidApi = {
  async getConfirmedData(): Promise<CovidRecord[]> {
    const url = buildODataUrl('CovidConfirmed', {
      'select': 'Country,Province,Date,Value,Count',
      'top': '100000'
    });
    const response = await axios.get(url);
    return response.data.value;
  },

  async getTopRecords(type: 'confirmed' | 'deaths' | 'recovered', top = 50): Promise<CovidRecord[]> {
    const endpoint = type === 'confirmed' ? 'CovidConfirmed' : type === 'deaths' ? 'CovidDeaths' : 'CovidRecovered';
    const url = buildODataUrl(endpoint, {
      'select': 'Country,Province,Date,Value,Count',
      'orderby': 'Date desc',
      'top': top.toString()
    });
    const response = await axios.get(url);
    return response.data.value as CovidRecord[];
  },

  async getDeathsData(): Promise<CovidRecord[]> {
    const url = buildODataUrl('CovidDeaths', {
      'select': 'Country,Province,Date,Value,Count',
      'top': '100000'
    });
    const response = await axios.get(url);
    return response.data.value;
  },

  async getRecoveredData(): Promise<CovidRecord[]> {
    const url = buildODataUrl('CovidRecovered', {
      'select': 'Country,Province,Date,Value,Count',
      'top': '100000'
    });
    const response = await axios.get(url);
    return response.data.value;
  },

  async getLatestDataByCountry(type: 'confirmed' | 'deaths' | 'recovered'): Promise<CountryData[]> {
    let endpoint = '';
    switch (type) {
      case 'confirmed':
        endpoint = 'CovidConfirmed';
        break;
      case 'deaths':
        endpoint = 'CovidDeaths';
        break;
      case 'recovered':
        endpoint = 'CovidRecovered';
        break;
    }

    // First, get the latest available date only (cheap query)
    const latestUrl = buildODataUrl(endpoint, {
      'select': 'Date',
      'orderby': 'Date desc',
      'top': '1'
    });
    const latestResp = await axios.get(latestUrl);
    const latestDate: string | undefined = latestResp.data?.value?.[0]?.Date;

    if (!latestDate) return [];

    // Fetch only records for that date and minimal fields
    // Use formatted date for OData query - proper ISO format for datetime
    const formattedDate = formatDateForOData(latestDate);
    
    const dataUrl = buildODataUrl(endpoint, {
      'filter': `Date eq ${formattedDate}`,
      'select': 'Country,Count',
      'top': '100000'
    });
    
    const response = await axios.get(dataUrl);
    const data: Array<{Country: string, Count: number}>  = response.data.value;

    // Group by country and sum counts for the latest date
    const countryMap = new Map<string, number>();
    data.forEach(record => {
      const key = record.Country?.trim() ?? 'Unknown';
      const currentCount = countryMap.get(key) || 0;
      countryMap.set(key, currentCount + (record.Count || 0));
    });

    return Array.from(countryMap.entries()).map(([country, count]) => ({
      country,
      count
    }));
  }
};