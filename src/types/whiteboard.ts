export interface Point {
    x: number;
    y: number;
}

export interface TextElement {
    id: string;
    type: "text";
    position: Point;
    content: string;
    fontSize: number;
    fontFamily: string;
    color: string;
    width?: number;
    height?: number;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
}

export interface LineElement {
    id: string;
    type: "line";
    start: Point;
    end: Point;
    strokeWidth: number;
    color: string;
}

export interface ArrowElement {
    id: string;
    type: "arrow";
    start: Point;
    end: Point;
    strokeWidth: number;
    color: string;
}

export type WhiteboardElement = TextElement | LineElement | ArrowElement;

export interface WhiteboardState {
    elements: WhiteboardElement[];
    viewBox: {
        x: number;
        y: number;
        zoom: number;
    };
}

export type Tool = "text" | "arrow" | "line" | "select";

export interface ToolbarState {
    activeTool: Tool;
    fontSize: number;
    fontFamily: string;
    color: string;
    strokeWidth: number;
}
