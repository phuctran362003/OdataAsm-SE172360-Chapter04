import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import type { CountryData } from '../types/covid';
import { worldMapFallback } from '../utils/worldMapFallback';
import './WorldMap.css';

interface WorldMapProps {
  data: CountryData[];
  type: string;
}

export const WorldMap: React.FC<WorldMapProps> = ({ data, type }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Use parent container width or fallback to 800
    const container = d3.select('.world-map-container').node() as HTMLElement;
    const width = container ? container.getBoundingClientRect().width - 40 : 800; // subtract padding
    const height = Math.min(500, width * 0.6); // responsive height based on width
    const margin = { top: 0, right: 0, bottom: 0, left: 0 };

    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create color scale
    const maxValue = d3.max(data, d => d.count) || 1;
    const colorScale = d3
      .scaleSequential(d3.interpolateBlues)
      .domain([0, maxValue]);

    // Create data map for quick lookup
    const dataMap = new Map(data.map(d => [d.country.toLowerCase(), d.count]));

    // Process the map data (either from CDN or fallback)
    const processMapData = (world: any) => {
      if (!world || !world.objects || !world.objects.countries) {
        console.error("Invalid world data format");
        return;
      }
      
      try {
        const countries = feature(world, world.objects.countries) as any;
      
        // Create projection
        const projection = d3
          .geoNaturalEarth1()
          .scale(width / 6.5)  // Dynamic scale based on width
          .translate([width / 2, height / 2]);

        const path = d3.geoPath().projection(projection);

        // Draw countries
        g.selectAll(".country")
          .data(countries.features)
          .enter()
          .append("path")
          .attr("class", "country")
          .attr("d", (d: any) => path(d))
          .attr("fill", (d: any) => {
            const countryName = d.properties.NAME?.toLowerCase();
            const value = dataMap.get(countryName) || 0;
            return value > 0 ? colorScale(value) : "#f0f0f0";
          })
          .attr("stroke", "#333")
          .attr("stroke-width", 0.5)
          .on("mouseover", function(event: any, d: any) {
            const countryName = d.properties.NAME;
            const value = dataMap.get(countryName?.toLowerCase()) || 0;
            
            // Show tooltip
            const tooltip = d3.select("body")
              .append("div")
              .attr("class", "tooltip")
              .style("opacity", 0);

            tooltip.transition()
              .duration(200)
              .style("opacity", .9);
            
            tooltip.html(`<strong>${countryName}</strong><br/>${type}: ${value.toLocaleString()}`)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 28) + "px");

            d3.select(this).attr("stroke-width", 2);
          })
          .on("mouseout", function() {
            d3.selectAll(".tooltip").remove();
            d3.select(this).attr("stroke-width", 0.5);
          });
      } catch (error) {
        console.error("Error processing map data:", error);
      }
    };

    // First try to load from local file
    d3.json("/countries-110m.json")
      .then(world => {
        if (world) {
          console.log("Using local map data file");
          processMapData(world);
        }
      })
      .catch(error => {
        console.error("Failed to load local map data:", error);
        
        // Try embedded data as first fallback
        try {
          console.log("Using embedded fallback data");
          processMapData(worldMapFallback);
        } catch (err) {
          console.error("Error using embedded fallback data:", err);
          
          // Try CDN as last resort
          d3.json("https://unpkg.com/world-atlas@2/countries-110m.json")
            .then(world => {
              if (world) {
                console.log("Using CDN map data");
                processMapData(world);
              }
            })
            .catch(cdnError => {
              console.error("Failed to load world map data from CDN:", cdnError);
            });
        }
      });

  }, [data, type]);

  return (
    <div className="world-map-container">
      <svg ref={svgRef} className="world-map"></svg>
    </div>
  );
};