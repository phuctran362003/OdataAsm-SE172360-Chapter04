import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { CountryData } from '../types/covid';

interface TreemapData extends CountryData {
  percentage: number;
}

interface CovidTreemapProps {
  data: CountryData[];
  type: string;
  onCountryClick?: (country: string) => void;
}

export const CovidTreemap: React.FC<CovidTreemapProps> = ({ data, type, onCountryClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 1200;
    const height = 600;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("width", "100%")
      .style("height", "auto");

    // Calculate total and percentages
    const total = data.reduce((sum, d) => sum + d.count, 0);
    const treemapData: TreemapData[] = data
      .filter(d => d.count > 0)
      .map(d => ({
        ...d,
        percentage: (d.count / total) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50); // Show top 50 countries

    // Create hierarchy for treemap
    const root = d3.hierarchy<any>({ children: treemapData })
      .sum((d: any) => d.count || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    // Create treemap layout
    const treemap = d3.treemap<any>()
      .size([innerWidth, innerHeight])
      .padding(2)
      .round(true);

    treemap(root);

    // Color scale based on data type
    let colorScale: d3.ScaleOrdinal<string, string>;
    if (type === 'Confirmed') {
      colorScale = d3.scaleOrdinal(d3.schemeBlues[9]);
    } else if (type === 'Deaths') {
      colorScale = d3.scaleOrdinal(d3.schemeReds[9]);
    } else if (type === 'Recovered') {
      colorScale = d3.scaleOrdinal(d3.schemeGreens[9]);
    } else {
      colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    }

    const container = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create rectangles for each country
    const leaf = container.selectAll("g")
      .data(root.leaves())
      .enter().append("g")
      .attr("transform", (d: any) => `translate(${d.x0},${d.y0})`);

    // Add rectangles
    leaf.append("rect")
      .attr("width", (d: any) => d.x1 - d.x0)
      .attr("height", (d: any) => d.y1 - d.y0)
      .attr("fill", (_d: any, i: number) => colorScale(i.toString()))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .on("mouseover", function(event: any, d: any) {
        const data = d.data as TreemapData;
        
        // Create tooltip
        d3.select("body")
          .append("div")
          .attr("class", "treemap-tooltip")
          .style("position", "absolute")
          .style("background", "rgba(0,0,0,0.8)")
          .style("color", "white")
          .style("padding", "10px")
          .style("border-radius", "5px")
          .style("pointer-events", "none")
          .style("font-size", "12px")
          .style("z-index", "1000")
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px")
          .html(`
            <strong>${data.country}</strong><br/>
            ${type}: ${data.count.toLocaleString()}<br/>
            Percentage: ${data.percentage.toFixed(2)}%
          `);

        d3.select(this).attr("stroke-width", 3);
      })
      .on("mouseout", function() {
        d3.selectAll(".treemap-tooltip").remove();
        d3.select(this).attr("stroke-width", 1);
      })
      .on("click", function(_event: any, d: any) {
        if (onCountryClick) {
          const data = d.data as TreemapData;
          console.log("Treemap country clicked:", data.country);
          onCountryClick(data.country);
        }
      });

    // Add country labels
    leaf.append("text")
      .selectAll("tspan")
      .data((d: any) => {
        const data = d.data as TreemapData;
        const width = d.x1 - d.x0;
        const height = d.y1 - d.y0;
        
        // Only show text if rectangle is large enough
        if (width < 50 || height < 30) return [];
        
        return [
          data.country,
          `${data.count.toLocaleString()}`,
          `${data.percentage.toFixed(1)}%`
        ];
      })
      .enter().append("tspan")
      .attr("x", 3)
      .attr("y", (_d: any, i: number) => 13 + i * 12)
      .style("font-size", (_d: any, i: number, nodes: any) => {
        const rect = d3.select(nodes[i].parentNode.parentNode).datum() as any;
        const width = rect.x1 - rect.x0;
        const height = rect.y1 - rect.y0;
        
        if (width < 100 || height < 50) return "9px";
        if (width < 150 || height < 70) return "10px";
        return "11px";
      })
      .style("font-weight", (_d: any, i: number) => i === 0 ? "bold" : "normal")
      .style("fill", "white")
      .style("text-shadow", "1px 1px 1px rgba(0,0,0,0.7)")
      .style("pointer-events", "none")
      .text((d: any) => d);

    console.log(`Treemap rendered with ${treemapData.length} countries`);

  }, [data, type, onCountryClick]);

  if (!data.length) {
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
        <div>No data available</div>
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
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '15px',
        fontSize: '18px',
        fontWeight: 'bold'
      }}>
        Treemap of Countries
      </div>
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '10px',
        fontSize: '14px',
        color: '#666'
      }}>
        The Treemap shows the number of Cases in Different countries and their percent of total cases worldwide
      </div>
      <svg ref={svgRef} style={{ display: 'block', margin: '0 auto' }}></svg>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginTop: '15px',
        flexWrap: 'wrap',
        gap: '15px',
        fontSize: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '15px', height: '15px', backgroundColor: '#2166ac', borderRadius: '2px' }}></div>
          <span>Confirmed</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '15px', height: '15px', backgroundColor: '#762a83', borderRadius: '2px' }}></div>
          <span>Active</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '15px', height: '15px', backgroundColor: '#1b7837', borderRadius: '2px' }}></div>
          <span>Recovered</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '15px', height: '15px', backgroundColor: '#d73027', borderRadius: '2px' }}></div>
          <span>Deaths</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '15px', height: '15px', backgroundColor: '#f46d43', borderRadius: '2px' }}></div>
          <span>Daily Increase</span>
        </div>
      </div>
    </div>
  );
};