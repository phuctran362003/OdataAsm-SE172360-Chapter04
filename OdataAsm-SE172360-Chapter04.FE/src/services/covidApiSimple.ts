import axios from 'axios';
import type { CovidRecord, CountryData } from '../types/covid';

// API base URL
const API_BASE_URL = 'http://localhost:9090/odata';

// Simple helper to build OData URLs
function buildUrl(endpoint: string, params: Record<string, string>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.set(`$${key}`, value);
  });
  
  return `${API_BASE_URL}/${endpoint}?${searchParams.toString()}`;
}

export const covidApiSimple = {
  async getLatestDataByCountry(type: 'confirmed' | 'deaths' | 'recovered'): Promise<CountryData[]> {
    try {
      console.log(`Fetching ${type} data from API...`);
      
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

      // Get just the data we need - country and count
      const url = buildUrl(endpoint, {
        'select': 'Country,Count',
        'top': '10000'  // Get more records to ensure we have good coverage
      });

      console.log('API URL:', url);
      const response = await axios.get(url);
      console.log('API Response received, records:', response.data.value?.length || 0);

      if (!response.data.value) {
        console.error('No data in API response');
        return [];
      }

      const data = response.data.value as Array<{Country: string, Count: number}>;
      
      // Group by country and sum counts
      const countryMap = new Map<string, number>();
      data.forEach(record => {
        if (record.Country && typeof record.Count === 'number') {
          const key = record.Country.trim();
          const currentCount = countryMap.get(key) || 0;
          countryMap.set(key, currentCount + record.Count);
        }
      });

      const result = Array.from(countryMap.entries()).map(([country, count]) => ({
        country,
        count
      }));

      console.log(`Processed ${result.length} countries for ${type} data`);
      console.log('Sample data:', result.slice(0, 5));

      return result;

    } catch (error) {
      console.error(`Error fetching ${type} data:`, error);
      
      // Return sample data for demonstration if API fails
      return [
        { country: 'United States of America', count: 1000000 },
        { country: 'Brazil', count: 500000 },
        { country: 'India', count: 800000 },
        { country: 'Russia', count: 300000 },
        { country: 'United Kingdom', count: 200000 },
        { country: 'France', count: 150000 },
        { country: 'Germany', count: 120000 },
        { country: 'Iran', count: 100000 },
        { country: 'Turkey', count: 80000 },
        { country: 'Italy', count: 70000 }
      ];
    }
  },

  async getTopRecords(type: 'confirmed' | 'deaths' | 'recovered', top = 50): Promise<CovidRecord[]> {
    try {
      const endpoint = type === 'confirmed' ? 'CovidConfirmed' : type === 'deaths' ? 'CovidDeaths' : 'CovidRecovered';
      const url = buildUrl(endpoint, {
        'select': 'Country,Province,Date,Value,Count',
        'orderby': 'Count desc',
        'top': top.toString()
      });
      
      const response = await axios.get(url);
      return response.data.value as CovidRecord[];
    } catch (error) {
      console.error(`Error fetching top ${type} records:`, error);
      return [];
    }
  }
};