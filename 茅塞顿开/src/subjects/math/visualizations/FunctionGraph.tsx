import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface FunctionGraphProps {
  width?: number;
  height?: number;
  functions?: Array<{
    name: string;
    equation: (x: number) => number;
    color: string;
    visible: boolean;
  }>;
  interactive?: boolean;
  showGrid?: boolean;
  showAxes?: boolean;
  xDomain?: [number, number];
  yDomain?: [number, number];
}

const FunctionGraph: React.FC<FunctionGraphProps> = ({
  width = 600,
  height = 400,
  functions = [
    {
      name: 'y = x²',
      equation: (x: number) => x * x,
      color: '#7C3AED',
      visible: true
    },
    {
      name: 'y = 2x + 1',
      equation: (x: number) => 2 * x + 1,
      color: '#DC2626',
      visible: true
    }
  ],
  interactive = true,
  showGrid = true,
  showAxes = true,
  xDomain = [-10, 10],
  yDomain = [-10, 10]
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedFunction, setSelectedFunction] = useState<number>(0);
  const [currentExpression, setCurrentExpression] = useState('x^2');

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear().domain(xDomain).range([0, innerWidth]);
    const yScale = d3.scaleLinear().domain(yDomain).range([innerHeight, 0]);

    // Grid lines
    if (showGrid) {
      const xAxisGrid = d3.axisBottom(xScale).tickSize(-innerHeight).tickFormat(() => '');
      const yAxisGrid = d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(() => '');

      g.append('g')
        .attr('class', 'grid x-grid')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxisGrid)
        .style('stroke-dasharray', '2,2')
        .style('opacity', 0.3);

      g.append('g')
        .attr('class', 'grid y-grid')
        .call(yAxisGrid)
        .style('stroke-dasharray', '2,2')
        .style('opacity', 0.3);
    }

    // Axes
    if (showAxes) {
      const xAxis = d3.axisBottom(xScale);
      const yAxis = d3.axisLeft(yScale);

      g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis);

      g.append('g')
        .call(yAxis);

      // Axis labels
      g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - margin.left)
        .attr('x', 0 - innerHeight / 2)
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('fill', '#666')
        .text('y');

      g.append('text')
        .attr('transform', `translate(${innerWidth / 2}, ${innerHeight + margin.bottom})`)
        .style('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('fill', '#666')
        .text('x');
    }

    // Draw functions
    const line = d3.line<number>()
      .x((d, i) => xScale(xDomain[0] + (i / 100) * (xDomain[1] - xDomain[0])))
      .y(d => yScale(d))
      .curve(d3.curveCardinal);

    functions.forEach((func, index) => {
      if (!func.visible) return;

      const points = d3.range(101).map(i => {
        const x = xDomain[0] + (i / 100) * (xDomain[1] - xDomain[0]);
        return func.equation(x);
      });

      const path = g.append('path')
        .datum(points)
        .attr('fill', 'none')
        .attr('stroke', func.color)
        .attr('stroke-width', selectedFunction === index ? 3 : 2)
        .attr('d', line)
        .style('opacity', 0.8)
        .style('cursor', 'pointer')
        .on('click', () => {
          if (interactive) {
            setSelectedFunction(index);
          }
        })
        .on('mouseover', function() {
          if (interactive) {
            d3.select(this)
              .transition()
              .duration(200)
              .attr('stroke-width', 4)
              .style('opacity', 1);
          }
        })
        .on('mouseout', function() {
          if (interactive) {
            d3.select(this)
              .transition()
              .duration(200)
              .attr('stroke-width', selectedFunction === index ? 3 : 2)
              .style('opacity', 0.8);
          }
        });

      // Animation
      const totalLength = path.node()?.getTotalLength() || 0;
      path
        .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(2000)
        .ease(d3.easeLinear)
        .attr('stroke-dashoffset', 0);
    });

    // Interactive point (if enabled)
    if (interactive) {
      const tooltip = g.append('g')
        .attr('class', 'tooltip')
        .style('display', 'none');

      tooltip.append('circle')
        .attr('r', 5)
        .attr('fill', '#FF6B6B')
        .attr('stroke', 'white')
        .attr('stroke-width', 2);

      tooltip.append('rect')
        .attr('x', 10)
        .attr('y', -35)
        .attr('width', 80)
        .attr('height', 25)
        .attr('rx', 4)
        .attr('fill', 'rgba(0,0,0,0.8)');

      tooltip.append('text')
        .attr('x', 50)
        .attr('y', -18)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .style('font-size', '12px')
        .text('(0, 0)');

      const mousemove = (event: MouseEvent) => {
        const [mouseX, mouseY] = d3.pointer(event);
        const xValue = xScale.invert(mouseX);
        const yValue = yScale.invert(mouseY);

        tooltip
          .style('display', 'block')
          .attr('transform', `translate(${mouseX},${mouseY})`);

        tooltip.select('text')
          .text(`(${xValue.toFixed(1)}, ${yValue.toFixed(1)})`);
      };

      const mouseleave = () => {
        tooltip.style('display', 'none');
      };

      g.append('rect')
        .attr('width', innerWidth)
        .attr('height', innerHeight)
        .attr('fill', 'transparent')
        .style('cursor', 'crosshair')
        .on('mousemove', mousemove)
        .on('mouseleave', mouseleave);
    }

  }, [width, height, functions, interactive, showGrid, showAxes, xDomain, yDomain, selectedFunction]);

  return (
    <div className="function-graph-container">
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">函数表达式:</label>
          <input
            type="text"
            value={currentExpression}
            onChange={(e) => setCurrentExpression(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="例如: x^2, sin(x), log(x)"
          />
          <button className="px-4 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm">
            添加函数
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {functions.map((func, index) => (
          <button
            key={index}
            onClick={() => setSelectedFunction(index)}
            className={`px-3 py-1 rounded-md text-sm transition-all ${
              selectedFunction === index
                ? 'ring-2 ring-purple-500 ring-offset-2'
                : 'hover:bg-gray-100'
            }`}
            style={{
              backgroundColor: func.visible ? func.color + '20' : '#f3f4f6',
              color: func.visible ? func.color : '#6b7280',
              borderLeft: `4px solid ${func.color}`
            }}
          >
            {func.name}
          </button>
        ))}
      </div>

      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="border border-gray-200 rounded-lg bg-white"
      />

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-200 rounded"></div>
          <span>点击函数曲线选中</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-200 rounded"></div>
          <span>鼠标悬停查看坐标</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-200 rounded"></div>
          <span>支持多个函数同时显示</span>
        </div>
      </div>
    </div>
  );
};

export default FunctionGraph;