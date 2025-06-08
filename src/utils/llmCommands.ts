import {
    WhiteboardElement,
    TextElement,
    LineElement,
    ArrowElement,
} from "@/types/whiteboard";

// Command interfaces
export interface GotoCommand {
    type: "goto";
    x: number;
    y: number;
    scale: number;
}

export interface GotoUuidCommand {
    type: "gotouuid";
    uuid: string;
    scale: number;
}

export interface CreateCommand {
    type: "create";
    element: WhiteboardElement;
}

export interface DeleteCommand {
    type: "delete";
    uuid: string;
}

export type LLMCommand =
    | GotoCommand
    | GotoUuidCommand
    | CreateCommand
    | DeleteCommand;

// Command parsing regex patterns
const COMMAND_PATTERNS = {
    goto: /\[\[goto:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(\d+(?:\.\d+)?)\]\]/g,
    gotouuid: /\[\[gotouuid:([a-f0-9-]{36}),(\d+(?:\.\d+)?)\]\]/g,
    create: /\[\[create:(\{[\s\S]*?\})\]\]/g, // Updated to handle nested JSON objects
    delete: /\[\[delete:([a-f0-9-]{36})\]\]/g,
};

/**
 * Parses LLM commands from text content
 */
export function parseLLMCommands(content: string): {
    commands: LLMCommand[];
    cleanContent: string;
} {
    const commands: LLMCommand[] = [];
    let cleanContent = content;

    // Parse goto commands
    const gotoMatches = Array.from(content.matchAll(COMMAND_PATTERNS.goto));
    for (const match of gotoMatches) {
        const [fullMatch, x, y, scale] = match;
        commands.push({
            type: "goto",
            x: parseFloat(x),
            y: parseFloat(y),
            scale: parseFloat(scale),
        });
        cleanContent = cleanContent.replace(fullMatch, "");
    }

    // Parse gotouuid commands
    const gotoUuidMatches = Array.from(
        content.matchAll(COMMAND_PATTERNS.gotouuid)
    );
    for (const match of gotoUuidMatches) {
        const [fullMatch, uuid, scale] = match;
        commands.push({
            type: "gotouuid",
            uuid,
            scale: parseFloat(scale),
        });
        cleanContent = cleanContent.replace(fullMatch, "");
    }

    // Parse create commands
    const createMatches = Array.from(content.matchAll(COMMAND_PATTERNS.create));
    for (const match of createMatches) {
        const [fullMatch, jsonStr] = match;
        try {
            const elementData = JSON.parse(jsonStr);

            // Validate and create proper element
            const element = validateAndCreateElement(elementData);
            if (element) {
                commands.push({
                    type: "create",
                    element,
                });
            }
        } catch (error) {
            console.warn("Failed to parse create command JSON:", error);
        }
        cleanContent = cleanContent.replace(fullMatch, "");
    }

    // Parse delete commands
    const deleteMatches = Array.from(content.matchAll(COMMAND_PATTERNS.delete));
    for (const match of deleteMatches) {
        const [fullMatch, uuid] = match;
        commands.push({
            type: "delete",
            uuid,
        });
        cleanContent = cleanContent.replace(fullMatch, "");
    }

    // Clean up extra whitespace
    cleanContent = cleanContent.replace(/\s+/g, " ").trim();

    return { commands, cleanContent };
}

/**
 * Validates and creates a proper WhiteboardElement from JSON data
 */
function validateAndCreateElement(data: unknown): WhiteboardElement | null {
    if (!data || typeof data !== "object") return null;

    const elementData = data as Record<string, unknown>;

    // Generate UUID if not provided
    if (!elementData.id) {
        elementData.id = generateUUID();
    }

    switch (elementData.type) {
        case "text":
            return validateTextElement(elementData);
        case "line":
            return validateLineElement(elementData);
        case "arrow":
            return validateArrowElement(elementData);
        default:
            return null;
    }
}

function validateTextElement(
    data: Record<string, unknown>
): TextElement | null {
    const position = data.position as Record<string, unknown>;
    if (
        !position ||
        typeof position.x !== "number" ||
        typeof position.y !== "number"
    ) {
        return null;
    }

    return {
        id: data.id as string,
        type: "text",
        position: { x: position.x, y: position.y },
        content: (data.content as string) || "New Text",
        fontSize: (data.fontSize as number) || 16,
        fontFamily: (data.fontFamily as string) || "Arial",
        color: (data.color as string) || "#000000",
        width: data.width as number | undefined,
        height: data.height as number | undefined,
        bold: (data.bold as boolean) || false,
        italic: (data.italic as boolean) || false,
        underline: (data.underline as boolean) || false,
    };
}

function validateLineElement(
    data: Record<string, unknown>
): LineElement | null {
    const start = data.start as Record<string, unknown>;
    const end = data.end as Record<string, unknown>;
    if (
        !start ||
        !end ||
        typeof start.x !== "number" ||
        typeof start.y !== "number" ||
        typeof end.x !== "number" ||
        typeof end.y !== "number"
    ) {
        return null;
    }

    return {
        id: data.id as string,
        type: "line",
        start: { x: start.x, y: start.y },
        end: { x: end.x, y: end.y },
        strokeWidth: (data.strokeWidth as number) || 2,
        color: (data.color as string) || "#000000",
    };
}

function validateArrowElement(
    data: Record<string, unknown>
): ArrowElement | null {
    const start = data.start as Record<string, unknown>;
    const end = data.end as Record<string, unknown>;
    if (
        !start ||
        !end ||
        typeof start.x !== "number" ||
        typeof start.y !== "number" ||
        typeof end.x !== "number" ||
        typeof end.y !== "number"
    ) {
        return null;
    }

    return {
        id: data.id as string,
        type: "arrow",
        start: { x: start.x, y: start.y },
        end: { x: end.x, y: end.y },
        strokeWidth: (data.strokeWidth as number) || 2,
        color: (data.color as string) || "#000000",
    };
}

/**
 * Generates a UUID v4
 */
function generateUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c == "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        }
    );
}

/**
 * Processes streaming content and hides command syntax during streaming
 */
export function processStreamingContent(content: string): {
    displayContent: string;
    commands: LLMCommand[];
    hasCommands: boolean;
} {
    // Hide everything between [[ and ]] during streaming
    let displayContent = content;

    // Find all [[ ]] pairs and remove them completely
    displayContent = displayContent.replace(/\[\[[\s\S]*?\]\]/g, "");

    // Also handle incomplete commands (streaming in progress) - hide from [[ to end if no closing ]]
    const openBracketIndex = displayContent.lastIndexOf("[[");
    if (openBracketIndex !== -1) {
        // Check if there's a closing ]] after the last [[
        const afterOpen = displayContent.substring(openBracketIndex);
        if (!afterOpen.includes("]]")) {
            // Incomplete command, hide everything from [[ onwards
            displayContent = displayContent.substring(0, openBracketIndex);
        }
    }

    // Clean up extra whitespace
    displayContent = displayContent.replace(/\s+/g, " ").trim();

    // Parse completed commands from the original content
    const { commands } = parseLLMCommands(content);

    // All commands are executed immediately now
    return {
        displayContent,
        commands, // Return all commands for immediate execution
        hasCommands: commands.length > 0,
    };
}

/**
 * Calculates element bounds for focusing
 */
export function getElementBounds(element: WhiteboardElement): {
    x: number;
    y: number;
    width: number;
    height: number;
} {
    switch (element.type) {
        case "text":
            return {
                x: element.position.x,
                y: element.position.y - element.fontSize,
                width: element.width || 100,
                height: element.height || element.fontSize,
            };
        case "line":
        case "arrow":
            const minX = Math.min(element.start.x, element.end.x);
            const minY = Math.min(element.start.y, element.end.y);
            const maxX = Math.max(element.start.x, element.end.x);
            const maxY = Math.max(element.start.y, element.end.y);
            return {
                x: minX,
                y: minY,
                width: maxX - minX || 10,
                height: maxY - minY || 10,
            };
        default:
            return { x: 0, y: 0, width: 100, height: 100 };
    }
}
