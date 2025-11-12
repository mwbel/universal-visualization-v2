import React, { useRef, useEffect, useState } from 'react';

interface Point {
  x: number;
  y: number;
  label?: string;
}

interface Line {
  start: Point;
  end: Point;
  color?: string;
  width?: number;
  label?: string;
}

interface Circle {
  center: Point;
  radius: number;
  color?: string;
  fill?: boolean;
  label?: string;
}

interface Triangle {
  points: Point[];
  color?: string;
  fill?: boolean;
  label?: string;
}

interface GeometryCanvasProps {
  width?: number;
  height?: number;
  showGrid?: boolean;
  showAxes?: boolean;
  interactive?: boolean;
  elements?: {
    points?: Point[];
    lines?: Line[];
    circles?: Circle[];
    triangles?: Triangle[];
  };
  onPointClick?: (point: Point) => void;
  onLineClick?: (line: Line) => void;
}

const GeometryCanvas: React.FC<GeometryCanvasProps> = ({
  width = 600,
  height = 400,
  showGrid = true,
  showAxes = true,
  interactive = true,
  elements = {},
  onPointClick,
  onLineClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState<'point' | 'line' | 'circle' | 'triangle'>('point');
  const [tempPoints, setTempPoints] = useState<Point[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;

      for (let x = 0; x <= width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = 0; y <= height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    // Draw axes
    if (showAxes) {
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 2;

      // X-axis
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      // Y-axis
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, height);
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = '#374151';
      ctx.font = '12px Arial';
      ctx.fillText('x', width - 20, centerY - 10);
      ctx.fillText('y', centerX + 10, 20);
      ctx.fillText('O', centerX - 15, centerY + 15);

      // Scale marks
      for (let i = -10; i <= 10; i++) {
        if (i !== 0) {
          const x = centerX + i * 20;
          const y = centerY + i * 20;

          // X-axis marks
          ctx.beginPath();
          ctx.moveTo(x, centerY - 3);
          ctx.lineTo(x, centerY + 3);
          ctx.stroke();

          // Y-axis marks
          ctx.beginPath();
          ctx.moveTo(centerX - 3, y);
          ctx.lineTo(centerX + 3, y);
          ctx.stroke();

          // Numbers
          if (i % 2 === 0) {
            ctx.fillText(i.toString(), x - 5, centerY + 15);
            if (i !== 0) {
              ctx.fillText((-i).toString(), centerX + 10, y + 5);
            }
          }
        }
      }
    }

    // Coordinate transformation
    const toCanvasCoords = (point: Point): Point => ({
      x: centerX + point.x * 20,
      y: centerY - point.y * 20
    });

    // Draw triangles
    if (elements.triangles) {
      elements.triangles.forEach((triangle) => {
        const canvasPoints = triangle.points.map(toCanvasCoords);

        ctx.beginPath();
        ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
        canvasPoints.forEach((point) => {
          ctx.lineTo(point.x, point.y);
        });
        ctx.closePath();

        if (triangle.fill) {
          ctx.fillStyle = triangle.color ? triangle.color + '40' : '#3b82f640';
          ctx.fill();
        }

        ctx.strokeStyle = triangle.color || '#3b82f6';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        if (triangle.label) {
          const centerPoint = {
            x: canvasPoints.reduce((sum, p) => sum + p.x, 0) / canvasPoints.length,
            y: canvasPoints.reduce((sum, p) => sum + p.y, 0) / canvasPoints.length
          };
          ctx.fillStyle = '#1f2937';
          ctx.font = '14px Arial';
          ctx.fillText(triangle.label, centerPoint.x - 10, centerPoint.y);
        }
      });
    }

    // Draw circles
    if (elements.circles) {
      elements.circles.forEach((circle) => {
        const canvasCenter = toCanvasCoords(circle.center);
        const canvasRadius = circle.radius * 20;

        ctx.beginPath();
        ctx.arc(canvasCenter.x, canvasCenter.y, canvasRadius, 0, 2 * Math.PI);

        if (circle.fill) {
          ctx.fillStyle = circle.color ? circle.color + '40' : '#10b98140';
          ctx.fill();
        }

        ctx.strokeStyle = circle.color || '#10b981';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        if (circle.label) {
          ctx.fillStyle = '#1f2937';
          ctx.font = '14px Arial';
          ctx.fillText(circle.label, canvasCenter.x + canvasRadius + 5, canvasCenter.y);
        }
      });
    }

    // Draw lines
    if (elements.lines) {
      elements.lines.forEach((line) => {
        const canvasStart = toCanvasCoords(line.start);
        const canvasEnd = toCanvasCoords(line.end);

        ctx.beginPath();
        ctx.moveTo(canvasStart.x, canvasStart.y);
        ctx.lineTo(canvasEnd.x, canvasEnd.y);
        ctx.strokeStyle = line.color || '#ef4444';
        ctx.lineWidth = line.width || 2;
        ctx.stroke();

        // Label
        if (line.label) {
          const midX = (canvasStart.x + canvasEnd.x) / 2;
          const midY = (canvasStart.y + canvasEnd.y) / 2;
          ctx.fillStyle = '#1f2937';
          ctx.font = '14px Arial';
          ctx.fillText(line.label, midX + 5, midY - 5);
        }
      });
    }

    // Draw points
    if (elements.points) {
      elements.points.forEach((point) => {
        const canvasPoint = toCanvasCoords(point);

        ctx.beginPath();
        ctx.arc(canvasPoint.x, canvasPoint.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Label
        if (point.label) {
          ctx.fillStyle = '#1f2937';
          ctx.font = '14px Arial';
          ctx.fillText(point.label, canvasPoint.x + 8, canvasPoint.y - 8);
        }
      });
    }

    // Draw temporary points for interactive drawing
    tempPoints.forEach((point) => {
      const canvasPoint = toCanvasCoords(point);
      ctx.beginPath();
      ctx.arc(canvasPoint.x, canvasPoint.y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#8b5cf6';
      ctx.fill();
    });

  }, [width, height, showGrid, showAxes, elements, tempPoints]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const centerX = width / 2;
    const centerY = height / 2;

    const mathX = (x - centerX) / 20;
    const mathY = -(y - centerY) / 20;

    const clickedPoint: Point = { x: mathX, y: mathY };

    if (drawMode === 'point') {
      onPointClick?.(clickedPoint);
    } else {
      setTempPoints([...tempPoints, clickedPoint]);

      if (drawMode === 'line' && tempPoints.length === 1) {
        const newLine: Line = {
          start: tempPoints[0],
          end: clickedPoint,
          color: '#3b82f6',
          label: 'AB'
        };
        onLineClick?.(newLine);
        setTempPoints([]);
      } else if (drawMode === 'circle' && tempPoints.length === 1) {
        const radius = Math.sqrt(
          Math.pow(clickedPoint.x - tempPoints[0].x, 2) +
          Math.pow(clickedPoint.y - tempPoints[0].y, 2)
        );
        const newCircle: Circle = {
          center: tempPoints[0],
          radius: radius,
          color: '#10b981',
          label: 'C'
        };
        // Here you would typically add the circle to elements
        setTempPoints([]);
      } else if (drawMode === 'triangle' && tempPoints.length === 2) {
        const newTriangle: Triangle = {
          points: [tempPoints[0], tempPoints[1], clickedPoint],
          color: '#f59e0b',
          fill: true,
          label: '△ABC'
        };
        // Here you would typically add the triangle to elements
        setTempPoints([]);
      }
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const centerX = width / 2;
    const centerY = height / 2;

    setMousePos({
      x: (x - centerX) / 20,
      y: -(y - centerY) / 20
    });
  };

  return (
    <div className="geometry-canvas-container">
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">绘制模式:</label>
          <select
            value={drawMode}
            onChange={(e) => {
              setDrawMode(e.target.value as any);
              setTempPoints([]);
            }}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="point">点</option>
            <option value="line">线段</option>
            <option value="circle">圆形</option>
            <option value="triangle">三角形</option>
          </select>
        </div>

        <div className="text-sm text-gray-600">
          坐标: ({mousePos.x.toFixed(1)}, {mousePos.y.toFixed(1)})
        </div>

        <button
          onClick={() => setTempPoints([])}
          className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
        >
          清除临时点
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        className="border border-gray-300 rounded-lg cursor-crosshair bg-white"
      />

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
        <div>
          <h4 className="font-medium text-gray-900 mb-2">预设图形:</h4>
          <div className="flex flex-wrap gap-2">
            <button className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors">
              直角三角形
            </button>
            <button className="px-3 py-1 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors">
              等边三角形
            </button>
            <button className="px-3 py-1 bg-purple-100 text-purple-800 rounded-md hover:bg-purple-200 transition-colors">
              圆形
            </button>
            <button className="px-3 py-1 bg-orange-100 text-orange-800 rounded-md hover:bg-orange-200 transition-colors">
              坐标点
            </button>
          </div>
        </div>
        <div>
          <h4 className="font-medium text-gray-900 mb-2">操作提示:</h4>
          <ul className="space-y-1">
            <li>• 选择绘制模式后在画布上点击</li>
            <li>• 线段需要点击两个点</li>
            <li>• 三角形需要点击三个点</li>
            <li>• 鼠标移动显示当前坐标</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GeometryCanvas;