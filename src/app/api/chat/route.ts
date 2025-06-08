import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { readFile } from 'fs/promises';
import { join } from 'path';

// OpenAI client will be initialized in the request handler

async function getSystemPrompt(): Promise<string> {
  try {
    const promptPath = join(process.cwd(), 'src/prompts/whiteboard-assistant.txt');
    const prompt = await readFile(promptPath, 'utf-8');
    return prompt;
  } catch (error) {
    console.error('Error reading system prompt:', error);
    return 'You are a helpful AI assistant for a digital whiteboard application. Use markdown formatting in your responses for better readability.';
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const body = await request.json();
    const { message, whiteboardData, imageBase64 } = body;

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const systemPrompt = await getSystemPrompt();

    // Prepare the messages array
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages: any[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ];

    // Add whiteboard context if provided
    if (whiteboardData) {
      messages.push({
        role: 'system',
        content: `Current whiteboard data (JSON): ${JSON.stringify(whiteboardData, null, 2)}`,
      });
    }

    // Prepare user message content
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userContent: any[] = [
      {
        type: 'text',
        text: message,
      },
    ];

    // Add image if provided
    if (imageBase64) {
      userContent.push({
        type: 'image_url',
        image_url: {
          url: `data:image/png;base64,${imageBase64}`,
          detail: 'high',
        },
      });
    }

    messages.push({
      role: 'user',
      content: userContent,
    });

    // Create streaming completion using the proper OpenAI streaming pattern
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 1500,
      temperature: 0.7,
      stream: true,
    });

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              const data = JSON.stringify({ content });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          // Send end signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
