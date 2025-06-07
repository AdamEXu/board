'use client';

import { Tool } from '@/types/whiteboard';

interface ToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onClearCanvas: () => void;
  zoom: number;
}

export const Toolbar = ({
  activeTool,
  onToolChange,
  onZoomIn,
  onZoomOut,
  onResetView,
  onClearCanvas,
  zoom,
}: ToolbarProps) => {
  const handleClearCanvas = () => {
    if (window.confirm('Are you sure you want to clear the entire canvas? This action cannot be undone.')) {
      onClearCanvas();
    }
  };

  const tools = [
    { id: 'select' as Tool, icon: '↖️', label: 'Select' },
    { id: 'text' as Tool, icon: 'T', label: 'Text' },
    { id: 'arrow' as Tool, icon: '→', label: 'Arrow' },
    { id: 'line' as Tool, icon: '—', label: 'Line' },
  ];

  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-6 py-3 shadow-lg">
        <div className="flex items-center gap-4">
          {/* Tools Section */}
          <div className="flex items-center gap-2">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => onToolChange(tool.id)}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  transition-all duration-200 hover:bg-white/20
                  ${activeTool === tool.id 
                    ? 'bg-white/30 text-gray-900 shadow-sm' 
                    : 'text-gray-700 hover:text-gray-900'
                  }
                `}
                title={tool.label}
              >
                {tool.icon}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-white/30" />

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={onZoomOut}
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                       text-gray-700 hover:text-gray-900 hover:bg-white/20 transition-all duration-200"
              title="Zoom Out"
            >
              −
            </button>
            <span className="text-sm text-gray-700 min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={onZoomIn}
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                       text-gray-700 hover:text-gray-900 hover:bg-white/20 transition-all duration-200"
              title="Zoom In"
            >
              +
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-white/30" />

          {/* View Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={onResetView}
              className="px-3 py-2 rounded-full text-sm font-medium
                       text-gray-700 hover:text-gray-900 hover:bg-white/20 transition-all duration-200"
              title="Reset View"
            >
              Reset
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-white/30" />

          {/* Canvas Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearCanvas}
              className="px-3 py-2 rounded-full text-sm font-medium
                       text-red-600 hover:text-red-700 hover:bg-red-50/50 transition-all duration-200"
              title="Clear Canvas"
            >
              Clear
            </button>
          </div>

          {/* Future Features Placeholder */}
          <div className="w-px h-8 bg-white/30" />
          <div className="flex items-center gap-2 opacity-50">
            <div className="w-8 h-8 rounded bg-white/10" title="Font Size (Coming Soon)" />
            <div className="w-8 h-8 rounded bg-white/10" title="Font Family (Coming Soon)" />
            <div className="w-8 h-8 rounded bg-white/10" title="Color (Coming Soon)" />
            <div className="w-8 h-8 rounded bg-white/10" title="Stroke Width (Coming Soon)" />
          </div>
        </div>
      </div>
    </div>
  );
};
