import { WhiteboardState } from '@/types/whiteboard';

export interface WhiteboardContext {
  whiteboardData: WhiteboardState;
  imageBase64?: string;
}

/**
 * Generates a base64 encoded PNG image of the current whiteboard state
 */
export const generateWhiteboardImage = async (
  svgElement: SVGSVGElement,
  whiteboardState: WhiteboardState
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a canvas to render the SVG
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Set canvas size - use a reasonable resolution
      const scale = 2; // Higher resolution for better quality
      canvas.width = 1200 * scale;
      canvas.height = 800 * scale;
      
      // Fill with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Calculate bounds of all elements
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      whiteboardState.elements.forEach(element => {
        if (element.type === 'text') {
          const textEl = element;
          minX = Math.min(minX, textEl.position.x);
          minY = Math.min(minY, textEl.position.y - textEl.fontSize);
          maxX = Math.max(maxX, textEl.position.x + (textEl.width || 100));
          maxY = Math.max(maxY, textEl.position.y + (textEl.height || textEl.fontSize));
        } else if (element.type === 'line' || element.type === 'arrow') {
          const lineEl = element;
          minX = Math.min(minX, lineEl.start.x, lineEl.end.x);
          minY = Math.min(minY, lineEl.start.y, lineEl.end.y);
          maxX = Math.max(maxX, lineEl.start.x, lineEl.end.x);
          maxY = Math.max(maxY, lineEl.start.y, lineEl.end.y);
        }
      });
      
      // Add padding
      const padding = 50;
      minX -= padding;
      minY -= padding;
      maxX += padding;
      maxY += padding;
      
      // Calculate scale to fit content
      const contentWidth = maxX - minX;
      const contentHeight = maxY - minY;
      const scaleX = (canvas.width / scale) / contentWidth;
      const scaleY = (canvas.height / scale) / contentHeight;
      const renderScale = Math.min(scaleX, scaleY, 1); // Don't scale up
      
      // Center the content
      const offsetX = ((canvas.width / scale) - contentWidth * renderScale) / 2 - minX * renderScale;
      const offsetY = ((canvas.height / scale) - contentHeight * renderScale) / 2 - minY * renderScale;
      
      // Apply scaling
      ctx.scale(scale, scale);
      ctx.translate(offsetX, offsetY);
      ctx.scale(renderScale, renderScale);
      
      // Render elements
      whiteboardState.elements.forEach(element => {
        ctx.save();
        
        if (element.type === 'text') {
          const textEl = element;
          ctx.font = `${textEl.bold ? 'bold ' : ''}${textEl.italic ? 'italic ' : ''}${textEl.fontSize}px ${textEl.fontFamily}`;
          ctx.fillStyle = textEl.color;
          ctx.textBaseline = 'top';
          
          const lines = textEl.content.split('\n');
          lines.forEach((line, index) => {
            ctx.fillText(
              line,
              textEl.position.x,
              textEl.position.y - textEl.fontSize + index * textEl.fontSize * 1.2
            );
          });
        } else if (element.type === 'line') {
          const lineEl = element;
          ctx.strokeStyle = lineEl.color;
          ctx.lineWidth = lineEl.strokeWidth;
          ctx.beginPath();
          ctx.moveTo(lineEl.start.x, lineEl.start.y);
          ctx.lineTo(lineEl.end.x, lineEl.end.y);
          ctx.stroke();
        } else if (element.type === 'arrow') {
          const arrowEl = element;
          ctx.strokeStyle = arrowEl.color;
          ctx.fillStyle = arrowEl.color;
          ctx.lineWidth = arrowEl.strokeWidth;
          
          // Draw line
          const angle = Math.atan2(arrowEl.end.y - arrowEl.start.y, arrowEl.end.x - arrowEl.start.x);
          const arrowLength = 10;
          const lineEndX = arrowEl.end.x - arrowLength * 0.8 * Math.cos(angle);
          const lineEndY = arrowEl.end.y - arrowLength * 0.8 * Math.sin(angle);
          
          ctx.beginPath();
          ctx.moveTo(arrowEl.start.x, arrowEl.start.y);
          ctx.lineTo(lineEndX, lineEndY);
          ctx.stroke();
          
          // Draw arrow head
          const arrowAngle = Math.PI / 6;
          const arrowHead1X = arrowEl.end.x - arrowLength * Math.cos(angle - arrowAngle);
          const arrowHead1Y = arrowEl.end.y - arrowLength * Math.sin(angle - arrowAngle);
          const arrowHead2X = arrowEl.end.x - arrowLength * Math.cos(angle + arrowAngle);
          const arrowHead2Y = arrowEl.end.y - arrowLength * Math.sin(angle + arrowAngle);
          
          ctx.beginPath();
          ctx.moveTo(arrowEl.end.x, arrowEl.end.y);
          ctx.lineTo(arrowHead1X, arrowHead1Y);
          ctx.lineTo(arrowHead2X, arrowHead2Y);
          ctx.closePath();
          ctx.fill();
        }
        
        ctx.restore();
      });
      
      // Convert to base64
      const base64 = canvas.toDataURL('image/png').split(',')[1];
      resolve(base64);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Prepares whiteboard context for AI analysis
 */
export const prepareWhiteboardContext = async (
  whiteboardState: WhiteboardState,
  svgElement?: SVGSVGElement
): Promise<WhiteboardContext> => {
  const context: WhiteboardContext = {
    whiteboardData: whiteboardState,
  };
  
  // Generate image if SVG element is provided
  if (svgElement) {
    try {
      context.imageBase64 = await generateWhiteboardImage(svgElement, whiteboardState);
    } catch (error) {
      console.warn('Failed to generate whiteboard image:', error);
      // Continue without image
    }
  }
  
  return context;
};
