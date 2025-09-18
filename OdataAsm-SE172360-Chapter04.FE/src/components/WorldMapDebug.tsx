import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import type { CountryData } from '../types/covid';

interface WorldMapProps {
  data: CountryData[];
  type: string;
}

export const WorldMapDebug: React.FC<WorldMapProps> = ({ data, type }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mapData, setMapData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load map data
  useEffect(() => {
    console.log("=== WorldMapDebug: Loading started ===");
    const loadMapData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Try local file first
        let worldData;
        try {
          console.log("WorldMapDebug: Trying to load local map data from /countries-110m.json");
          const response = await fetch('/countries-110m.json');
          console.log("WorldMapDebug: Local fetch response status:", response.status);
          if (!response.ok) throw new Error(`Local file HTTP ${response.status}`);
          worldData = await response.json();
          console.log("WorldMapDebug: Local map data loaded successfully", worldData?.type);
        } catch (localError) {
          console.log("WorldMapDebug: Local map failed:", localError);
          console.log("WorldMapDebug: Trying CDN fallback...");
          const response = await fetch('https://unpkg.com/world-atlas@2/countries-110m.json');
          if (!response.ok) throw new Error(`CDN HTTP ${response.status}`);
          worldData = await response.json();
          console.log("WorldMapDebug: CDN map data loaded successfully", worldData?.type);
        }

        console.log("WorldMapDebug: Setting map data");
        setMapData(worldData);
      } catch (err) {
        console.error('WorldMapDebug: Failed to load map data:', err);
        setError(`Failed to load world map data: ${err}`);
      } finally {
        setIsLoading(false);
        console.log("WorldMapDebug: Loading finished");
      }
    };

    loadMapData();
  }, []);

  // Render map
  useEffect(() => {
    console.log("=== WorldMapDebug: Render effect triggered ===");
    console.log("WorldMapDebug: mapData exists?", !!mapData);
    console.log("WorldMapDebug: data length:", data?.length || 0);
    
    if (!mapData || !data.length) {
      console.log("WorldMapDebug: Not ready to render yet");
      return;
    }

    console.log("WorldMapDebug: Starting to render map with", data.length, "data points");

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 900;
    const height = 500;

    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("width", "100%")
      .style("height", "auto");

    try {
      console.log("WorldMapDebug: Processing topology data");
      const countries = feature(mapData, mapData.objects.countries) as any;
      console.log("WorldMapDebug: Countries features count:", countries.features.length);
      
      // Create data map for quick lookup
      const dataMap = new Map();
      data.forEach(d => {
        const key = d.country.toLowerCase().trim();
        dataMap.set(key, d.count);
      });

      console.log("WorldMapDebug: Data map created with", dataMap.size, "entries");
      console.log("WorldMapDebug: Sample data entries:", Array.from(dataMap.entries()).slice(0, 3));

      // Create color scale
      const maxValue = d3.max(data, d => d.count) || 1;
      const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, maxValue]);
      console.log("WorldMapDebug: Color scale max value:", maxValue);

      // Create projection
      const projection = d3
        .geoNaturalEarth1()
        .scale(150)
        .translate([width / 2, height / 2]);

      const path = d3.geoPath().projection(projection);

      // Draw countries
      const countryPaths = svg.selectAll(".country")
        .data(countries.features)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", path as any)
        .attr("fill", (d: any) => {
          const countryName = d.properties.NAME?.toLowerCase().trim();
          const value = dataMap.get(countryName) || 0;
          const color = value > 0 ? colorScale(value) : "#f0f0f0";
          return color;
        })
        .attr("stroke", "#333")
        .attr("stroke-width", 0.5)
        .style("cursor", "pointer");

      console.log("WorldMapDebug: Map rendered successfully with", countryPaths.size(), "country paths");
      
    } catch (err) {
      console.error("WorldMapDebug: Error rendering map:", err);
      setError(`Error rendering map: ${err}`);
    }
  }, [mapData, data, type]);

  console.log("WorldMapDebug: Component render - isLoading:", isLoading, "error:", error, "dataLength:", data?.length);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        backgroundColor: '#f8f9fa'
      }}>
        <div>Loading world map...</div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
          Debug: Data points available: {data?.length || 0}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        backgroundColor: '#f8f9fa',
        color: '#dc3545',
        padding: '20px'
      }}>
        <div>Error: {error}</div>
        <div style={{ fontSize: '12px', marginTop: '8px' }}>
          Check browser console for detailed logs
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      border: '1px solid #ddd',
      borderRadius: '4px',
      backgroundColor: '#f8f9fa',
      padding: '20px',
      marginTop: '20px'
    }}>
      <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
        Debug: Showing {type} data for {data?.length || 0} countries
      </div>
      <svg ref={svgRef} style={{ display: 'block', margin: '0 auto', border: '1px solid #ccc' }}></svg>
    </div>
  );
};