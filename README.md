# AURA LOOP (Yang Ge Shi Tou)

## Project Description
A custom bead bracelet design platform built with Next.js, Pixi.js, and Zustand. Users can customize bracelets by adding beads from a library, visualising them on a 2D stage with physics-like animations, and managing their design.

## Features
- **Visual Stage**: Interactive canvas using Pixi.js. Beads animate into place.
- **Auto-Adjustment**: Bracelet circumference calculates automatically.
- **Bead Library**: Filter by category, search, and add beads.
- **Drag & Drop**: Remove beads by dragging them away.
- **Responsive**: Mobile-adaptive layout.
- **Admin**: Simple `/admin` route to import custom bead JSON.

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Graphics**: Pixi.js (@pixi/react)
- **Animation**: Framer Motion (UI), Pixi Ticker (Canvas)

## Getting Started

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Run the development server:
    ```bash
    npm run dev
    ```

3.  Open [http://localhost:3000](http://localhost:3000)

## Admin
Visit `/admin` to import custom bead data.
