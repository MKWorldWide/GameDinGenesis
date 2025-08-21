<div align="center">
<img width="1200" height="475" alt="GDGem Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# GDDGem - AI-Powered Web Application

A modern web application with Gemini AI integration, built with React, TypeScript, and Vite.

## Features

- 🚀 Fast development with Vite
- ⚛️ React 19 with TypeScript
- 🤖 Gemini AI integration
- 🔒 Secure API key handling
- 📱 Responsive design

## Prerequisites

- Node.js 18+
- npm or yarn
- Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd GDDGem
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy `.env.example` to `.env.local` and add your Gemini API key:
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` and replace `your_gemini_api_key_here` with your actual Gemini API key.

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

## Project Structure

- `/src` - Source code
  - `/components` - Reusable React components
  - `/pages` - Page components
  - `/lib` - Utility functions and services
- `/api` - Serverless API routes
- `/public` - Static assets

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run test` - Run tests

## Environment Variables

Create a `.env.local` file in the root directory and add the following:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

## Deployment

### Vercel (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Set environment variables in Vercel dashboard:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Gemini API](https://ai.google.dev/)
- [Vite](https://vitejs.dev/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
