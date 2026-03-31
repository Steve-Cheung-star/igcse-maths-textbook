import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function MathPlot({ 
  data, 
  xDomain = [0, 360], 
  yDomain = [-1.5, 1.5], // Defaulting to a tighter range for trig
  width = 800, 
  height = 400,
  mode = 'trig',
  tickStep = 90 
}) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const margin = { top: 30, right: 30, bottom: 50, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // 1. SCALES
    const x = d3.scaleLinear().domain(xDomain).range([0, innerWidth]);
    const y = d3.scaleLinear().domain(yDomain).range([innerHeight, 0]);

    // 2. X-TICK GENERATION
    let xTickValues;
    if (mode === 'trig') {
      const start = Math.ceil(xDomain[0] / tickStep) * tickStep;
      xTickValues = d3.range(start, xDomain[1] + 1, tickStep);
    } else {
      xTickValues = x.ticks(10);
    }

    // 3. GRID & AXES
    // Draw Y-axis grid lines (Horizontal lines)
    const yTickValues = y.ticks(5);
    g.append("g")
      .selectAll("line")
      .data(yTickValues).enter().append("line")
      .attr("x1", 0).attr("x2", innerWidth)
      .attr("y1", d => y(d)).attr("y2", d => y(d))
      .attr("stroke", "#f1f5f9");

    // Draw X-axis grid lines (Vertical lines)
    g.append("g")
      .selectAll("line")
      .data(xTickValues).enter().append("line")
      .attr("x1", d => x(d)).attr("x2", d => x(d))
      .attr("y1", 0).attr("y2", innerHeight)
      .attr("stroke", "#f1f5f9");

    const xAxis = d3.axisBottom(x)
      .tickValues(xTickValues)
      .tickFormat(d => mode === 'trig' ? d + "°" : d);

    const yZeroPos = (yDomain[0] <= 0 && yDomain[1] >= 0) ? y(0) : innerHeight;

    g.append("g")
      .attr("transform", `translate(0,${yZeroPos})`)
      .call(xAxis)
      .attr("color", "#64748b");

    g.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .attr("color", "#64748b");

    // 4. PLOTTING
    data.forEach((entry) => {
      const step = (xDomain[1] - xDomain[0]) / 400;
      const points = d3.range(xDomain[0], xDomain[1] + step, step).map(val => {
        try {
          const fnStr = entry.fn
            .replace(/PI/g, 'Math.PI')
            .replace(/sin/g, 'Math.sin')
            .replace(/cos/g, 'Math.cos')
            .replace(/tan/g, 'Math.tan');
          
          const res = new Function('x', `return ${fnStr}`)(val);
          return { x: val, y: res };
        } catch (e) { return { x: val, y: null }; }
      });

      const lineGen = d3.line()
        .defined(d => d.y !== null && !isNaN(d.y) && Math.abs(d.y) < 50)
        .x(d => x(d.x))
        .y(d => y(d.y))
        .curve(d3.curveMonotoneX);

      g.append("path")
        .datum(points)
        .attr("fill", "none")
        .attr("stroke", entry.color || "#3b82f6")
        .attr("stroke-width", 3)
        .attr("stroke-dasharray", entry.lineDash ? entry.lineDash.join(',') : "0")
        .attr("d", lineGen);
    });

  }, [data, xDomain, yDomain, width, height, mode, tickStep]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0' }}>
      <svg ref={svgRef} width={width} height={height} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
    </div>
  );
}