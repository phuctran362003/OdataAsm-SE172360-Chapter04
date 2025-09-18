import React, { useState, useEffect } from 'react';
import { TabNavigation } from '../components/TabNavigation';
import { WorldMapSimple } from '../components/WorldMapSimple';
import { CovidTreemap } from '../components/CovidTreemap';
import { DataPreview } from '../components/DataPreview';
import type { CovidDataType, CountryData, CovidRecord } from '../types/covid';
import { covidApi } from '../services/covidApi';
import axios from 'axios';
import './Dashboard.css';

// Simple API function
const getCovidData = async (type: 'confirmed' | 'deaths' | 'recovered'): Promise<CountryData[]> => {
  try {
    const endpoint = type === 'confirmed' ? 'CovidConfirmed' : type === 'deaths' ? 'CovidDeaths' : 'CovidRecovered';
    const url = `http://localhost:9090/odata/${endpoint}?$select=Country,Count&$top=10000`;
    
    console.log(`Fetching ${type} data from:`, url);
    const response = await axios.get(url);
    
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

    return Array.from(countryMap.entries()).map(([country, count]) => ({
      country,
      count
    }));
  } catch (error) {
    console.error(`Error fetching ${type} data:`, error);
    // Return sample data for demonstration
    return [
      { country: 'United States of America', count: 1000000 },
      { country: 'Brazil', count: 500000 },
      { country: 'India', count: 800000 },
      { country: 'Russia', count: 300000 },
      { country: 'United Kingdom', count: 200000 }
    ];
  }
};

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CovidDataType>('Confirmed');
  const [mapData, setMapData] = useState<CountryData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [countrySpecificData, setCountrySpecificData] = useState<CovidRecord[]>([]);

  const fetchData = async (tab: CovidDataType) => {
    setLoading(true);
    setError(null);
    
    try {
      let data: CountryData[] = [];
      
      switch (tab) {
        case 'Confirmed':
          data = await getCovidData('confirmed');
          break;
        case 'Deaths':
          data = await getCovidData('deaths');
          break;
        case 'Recovered':
          data = await getCovidData('recovered');
          break;
        case 'Active':
          // Active = Confirmed - Deaths - Recovered
          const [confirmed, deaths, recovered] = await Promise.all([
            getCovidData('confirmed'),
            getCovidData('deaths'),
            getCovidData('recovered')
          ]);
          
          const confirmedMap = new Map<string, number>(confirmed.map((d: CountryData) => [d.country, d.count]));
          const deathsMap = new Map<string, number>(deaths.map((d: CountryData) => [d.country, d.count]));
          const recoveredMap = new Map<string, number>(recovered.map((d: CountryData) => [d.country, d.count]));
          
          data = Array.from(confirmedMap.keys()).map((country: string): CountryData => ({
            country,
            count: Math.max(0, (confirmedMap.get(country) || 0) - (deathsMap.get(country) || 0) - (recoveredMap.get(country) || 0))
          }));
          break;
        case 'Daily Increase':
          // For now, show confirmed data (would need date-based calculation for real daily increase)
          data = await getCovidData('confirmed');
          break;
      }
      
      setMapData(data);
    } catch (err: any) {
      // Enhanced error handling with details
      let errorMessage = 'Failed to fetch data. Make sure the backend server is running.';
      
      if (err?.response) {
        // Server responded with error
        const status = err.response.status;
        if (status === 400) {
          errorMessage = 'Invalid query parameters. The OData format might be incorrect.';
        } else if (status === 404) {
          errorMessage = 'API endpoint not found. Check your API URL.';
        } else if (status >= 500) {
          errorMessage = `Server error (${status}). The backend might be experiencing issues.`;
        }
      } else if (err?.request) {
        // Request made but no response
        errorMessage = 'No response from server. Check if backend is running on port 9090.';
      } else if (err?.message) {
        errorMessage = `Error: ${err.message}`;
      }
      
      setError(errorMessage);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewTop50 = async () => {
    try {
      setError(null);
      // Simple preview function - just show some data
      setPreviewRows(mapData.slice(0, 50));
    } catch (err: any) {
      let errorMessage = 'Failed to preview data.';
      
      if (err?.response?.status) {
        errorMessage += ` Server returned ${err.response.status}.`;
      } else if (err?.message) {
        errorMessage += ` ${err.message}`;
      }
      
      setError(errorMessage);
      console.error('Error previewing data:', err);
    }
  };

  const handleCountryClick = async (countryName: string) => {
    // Validate country name
    if (!countryName || typeof countryName !== 'string') {
      console.error('Invalid country name provided:', countryName);
      setError('Invalid country selected. Please try clicking on a different country.');
      return;
    }

    console.log(`Fetching ${activeTab} data for ${countryName}...`);
    setSelectedCountry(countryName);
    setError(null);
    
    try {
      // Convert activeTab to the proper type for API call
      let dataType: 'confirmed' | 'deaths' | 'recovered' = 'confirmed';
      if (activeTab === 'Deaths') {
        dataType = 'deaths';
      } else if (activeTab === 'Recovered') {
        dataType = 'recovered';
      }
      
      const data = await covidApi.getCountrySpecificData(countryName, dataType);
      setCountrySpecificData(data);
      
      // Also update preview rows to show country-specific data
      setPreviewRows(data.slice(0, 50));
      
      console.log(`Found ${data.length} records for ${countryName}`);
    } catch (err: any) {
      let errorMessage = `Failed to fetch data for ${countryName}`;
      
      if (err?.response?.status) {
        errorMessage += ` Server returned ${err.response.status}.`;
      } else if (err?.message) {
        errorMessage += `. ${err.message}`;
      }
      
      setError(errorMessage);
      console.error('Error fetching country data:', err);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
    // Clear country selection when changing tabs
    setSelectedCountry(null);
    setCountrySpecificData([]);
  }, [activeTab]);

  const handleTabChange = (tab: CovidDataType) => {
    setActiveTab(tab);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1># of Cases World wide</h1>
      </header>
      
      <div className="dashboard-content">
        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="loading-message">
            Loading {activeTab} data...
          </div>
        ) : (
          <>
            <WorldMapSimple 
              data={mapData} 
              type={activeTab} 
              onCountryClick={handleCountryClick}
            />
            <CovidTreemap 
              data={mapData} 
              type={activeTab}
              onCountryClick={handleCountryClick}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              {selectedCountry && (
                <div style={{ fontWeight: 'bold', color: '#007bff' }}>
                  Showing data for: {selectedCountry}
                  <button 
                    onClick={() => {
                      setSelectedCountry(null);
                      setCountrySpecificData([]);
                      setPreviewRows(mapData.slice(0, 50));
                    }}
                    style={{ marginLeft: 10, padding: '4px 8px', fontSize: '12px' }}
                  >
                    Clear
                  </button>
                </div>
              )}
              <button onClick={handlePreviewTop50} className="tab-button">Preview top 50</button>
            </div>
            <DataPreview rows={previewRows as any} />
          </>
        )}
      </div>
    </div>
  );
};