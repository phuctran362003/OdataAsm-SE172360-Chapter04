import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import type { CountryData } from '../types/covid';

interface WorldMapProps {
  data: CountryData[];
  type: string;
}

export const WorldMapSimple: React.FC<WorldMapProps> = ({ data, type }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mapData, setMapData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load map data
  useEffect(() => {
    const loadMapData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Try local file first
        let worldData;
        try {
          console.log("Loading local map data...");
          const response = await fetch('/countries-110m.json');
          if (!response.ok) throw new Error('Local file not found');
          worldData = await response.json();
          console.log("Local map data loaded successfully");
        } catch (localError) {
          console.log("Local map data failed, trying CDN...");
          const response = await fetch('https://unpkg.com/world-atlas@2/countries-110m.json');
          if (!response.ok) throw new Error('CDN also failed');
          worldData = await response.json();
          console.log("CDN map data loaded successfully");
        }

        setMapData(worldData);
      } catch (err) {
        console.error('Failed to load map data:', err);
        setError('Failed to load world map data');
      } finally {
        setIsLoading(false);
      }
    };

    loadMapData();
  }, []);

  // Render map
  useEffect(() => {
    if (!mapData || !data.length) return;

    console.log("Rendering map with data:", data.length, "countries");

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
      const countries = feature(mapData, mapData.objects.countries) as any;
      
      // Create data map for quick lookup
      const dataMap = new Map();
      data.forEach(d => {
        const key = d.country.toLowerCase().trim();
        dataMap.set(key, d.count);
      });

      console.log("Data map created with", dataMap.size, "entries");

      // Create color scale
      const maxValue = d3.max(data, d => d.count) || 1;
      const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, maxValue]);

      // Create projection
      const projection = d3
        .geoNaturalEarth1()
        .scale(150)
        .translate([width / 2, height / 2]);

      const path = d3.geoPath().projection(projection);

      // Draw countries
      svg.selectAll(".country")
        .data(countries.features)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", path as any)
        .attr("fill", (d: any) => {
          const countryName = d.properties.NAME?.toLowerCase().trim();
          const value = dataMap.get(countryName) || 0;
          return value > 0 ? colorScale(value) : "#f0f0f0";
        })
        .attr("stroke", "#333")
        .attr("stroke-width", 0.5)
        .style("cursor", "pointer")
        .on("mouseover", function(event: any, d: any) {
          const countryName = d.properties.NAME;
          const value = dataMap.get(countryName?.toLowerCase().trim()) || 0;
          
          // Simple tooltip
          d3.select("body")
            .append("div")
            .attr("class", "map-tooltip")
            .style("position", "absolute")
            .style("background", "rgba(0,0,0,0.8)")
            .style("color", "white")
            .style("padding", "8px")
            .style("border-radius", "4px")
            .style("pointer-events", "none")
            .style("font-size", "12px")
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px")
            .html(`<strong>${countryName}</strong><br/>${type}: ${value.toLocaleString()}`);

          d3.select(this).attr("stroke-width", 2);
        })
        .on("mouseout", function() {
          d3.selectAll(".map-tooltip").remove();
          d3.select(this).attr("stroke-width", 0.5);
        });

      console.log("Map rendered successfully with", countries.features.length, "countries");
      
    } catch (err) {
      console.error("Error rendering map:", err);
      setError('Error rendering map');
    }
  }, [mapData, data, type]);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        backgroundColor: '#f8f9fa'
      }}>
        <div>Loading world map...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        backgroundColor: '#f8f9fa',
        color: '#dc3545'
      }}>
        <div>Error: {error}</div>
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
      <svg ref={svgRef} style={{ display: 'block', margin: '0 auto' }}></svg>
    </div>
  );
};