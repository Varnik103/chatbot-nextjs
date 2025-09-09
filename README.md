# Chatbot-NextJS

A Next.js-based AI chat application—built with modern tools and best practices. Bootstrapped with `create-next-app`.

---

## Table of Contents
- [Features](#features)  
- [Tech Stack](#tech-stack)  
- [Getting Started](#getting-started)  
  - [Prerequisites](#prerequisites)  
  - [Installation](#installation)  
  - [Running Locally](#running-locally)  
- [Environment Variables](#environment-variables)  
- [Project Structure](#project-structure)  
- [Deployment](#deployment)  

---

## Features
- Interactive AI-powered chatbot interface  
- Component-based UI for messages and inputs  
- Streaming responses from AI backend  
- File attachments with inline preview and modal view  
- Editable and copyable messages  
- Mobile-responsive design with handling for long code blocks

---

## Tech Stack
- **Framework**: Next.js (App Router)  
- **Styling**: Tailwind CSS  
- **Syntax Highlighting**: React Syntax Highlighter (via Prism)  
- **Clipboard UI**: Clipboard API + `sonner` for toasts  
- **Editor UI**: `react-textarea-autosize` for editable messages  
- **Icons**: Icons via `lucide-react`

---

## Getting Started

### Prerequisites
- Next.js
- Package manager: `npm` (or `yarn` / `pnpm`)  
- AI backend/API key (if applicable)

### Installation

- git clone
- cd chatbot-nextjs
- npm install

## Environment Variables
- XAI_API_KEY
- MONGODB_URI
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- CLERK_SECRET_KEY
- UPLOADCARE_SECRET_KEY
- MEM0_API_KEY
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY
- NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
- NEXT_PUBLIC_GROK_MODEL
- NEXT_PUBLIC_APP_URL=http://localhost:3000


## Project Structure
- /app           — Next.js App Router pages and API routes
- /components    — UI components (e.g., ChatMessage, ChatInput)
- /lib           — Helper functions
- /public        — Static assets
- README.md      — Project documentation


## Deployment
- Vercel
