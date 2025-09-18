export interface CovidRecord {
  id: string;
  country: string;
  province: string;
  date: string;
  value: 'Confirmed' | 'Deaths' | 'Recovered';
  count: number;
}

export interface CountryData {
  country: string;
  count: number;
}

export type CovidDataType = 'Confirmed' | 'Active' | 'Recovered' | 'Deaths' | 'Daily Increase';