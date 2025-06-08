# 🎨 Digital Whiteboard with AI Assistant

A modern, interactive whiteboard application built with Next.js, featuring real-time AI assistance powered by OpenAI GPT-4o.

## ✨ Features

- **🎨 Interactive Whiteboard**: Create text, lines, and arrows with intuitive tools
- **🤖 AI Assistant**: Chat with GPT-4o about your whiteboard content
- **👁️ Vision Analysis**: AI can see and analyze your whiteboard screenshots
- **📝 Markdown Support**: AI responses with beautiful formatting
- **🔄 Real-time Streaming**: Live AI responses as they're generated
- **💾 Auto-save**: Your work is automatically saved to localStorage
- **⌨️ Keyboard Shortcuts**: Efficient workflow with hotkeys
- **📱 Responsive Design**: Works on desktop and mobile devices

## 🚀 Getting Started

### Prerequisites

1. **Node.js** (v18 or higher)
2. **OpenAI API Key** (for AI features)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up your OpenAI API key:

```bash
cp .env.example .env.local
# Edit .env.local and add your OpenAI API key
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🤖 AI Assistant Setup

To use the AI features, you need an OpenAI API key:

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Copy `.env.example` to `.env.local`
3. Add your API key: `OPENAI_API_KEY=your_key_here`

### AI Capabilities

The AI assistant can:
- **Analyze your whiteboard** content and layout
- **Provide suggestions** for organization and improvement
- **Answer questions** about specific elements
- **Summarize notes** and ideas
- **Help with content structuring**
- **Give design feedback**

### Example Prompts

- "What's on my whiteboard?"
- "How can I improve this layout?"
- "Summarize my notes"
- "What's missing from this diagram?"
- "Help me organize these ideas"

## ⌨️ Keyboard Shortcuts

- `V` - Select tool
- `T` - Text tool
- `R` - Line tool
- `F` - Arrow tool
- `Cmd/Ctrl + Z` - Undo
- `Cmd/Ctrl + Y` - Redo
- `Cmd/Ctrl + 0` - Reset zoom
- `Cmd/Ctrl + +/-` - Zoom in/out
- `Delete/Backspace` - Delete selected element

## 🛠️ Technology Stack

- **Framework**: Next.js 15 with App Router
- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **AI**: OpenAI GPT-4o with vision
- **Graphics**: SVG for scalable elements
- **State**: Custom hooks with localStorage

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
