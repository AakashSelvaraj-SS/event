# Event Planning Studio - Frontend UI

This repository currently contains the frontend/UI/UX implementation with mock data and mock service layers.

## Project Purpose
To provide a complete, high-quality, professional frontend UI/UX for a commercial Event Planning and Visualization application. It includes interfaces for 2D design, 3D design, AI chat integration, and an asset library.

## UI/UX Scope
The UI demonstrates the intended interactions, including 3D visualizations, object property panels, and mock AI generation. There is no real backend, AI, or database running here.

## Technology Stack
- **React** with **TypeScript**
- **Vite** (Build Tool)
- **Tailwind CSS v4** (Styling)
- **React Three Fiber / Three.js** (3D Rendering Mockups)
- **React Router** (Routing)
- **Lucide React** (Icons)

## Folder Structure
- `src/components`: Reusable UI components (buttons, panels, chat, layout)
- `src/screens`: Main page views (Start, Category, Editor, Assets, Client View)
- `src/api`: Mock API service abstractions (ready for real backend integration)
- `src/mock`: Mock data (JSON-like structures for halls, houses, products)
- `src/hooks`: Custom React hooks for state management

## Installation
```bash
npm install
```

## Running Locally
```bash
npm run dev
```

## Available Pages
- **Home / Start**: `/`
- **Category Selection**: `/category`
- **Editor**: `/editor/:mode/:category`
- **Asset Library**: `/assets`
- **Client View**: `/client-view/:id`

## Integration Guide for Backend Team

### Mock API Explanation
The `src/api/` folder contains service files like `aiService.ts`, `projectService.ts`, etc. These files currently return Mock promises simulating network delay.

### How to connect the Backend
Replace the mock function implementations in `src/api/` with actual `fetch` or `axios` calls to your server endpoints. The UI components are built to consume these services, meaning you do not need to modify the UI components directly when swapping out the backend.

### How to connect AI
In `src/api/aiService.ts`, replace the `sendAICommand` mock implementation with an API call to the actual LLM API or backend agent service.

### How to connect Database
In `src/api/projectService.ts`, replace the `getProjects` and `saveProject` mock implementations to point to your real database CRUD endpoints.

### How to connect Real 3D Processing
In `src/api/assetService.ts`, replace the `generate3DFromImage` mock method with your real Image-to-3D API workflow. Update the component that handles polling to match your job queue structure.
