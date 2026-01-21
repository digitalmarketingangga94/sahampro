# AI Rules & Tech Stack Guidelines for Adimology

This document outlines the core technologies used in the Adimology application and provides clear guidelines for library usage to maintain consistency and best practices.

## 🚀 Tech Stack Overview

Adimology is built with a modern, full-stack JavaScript ecosystem, leveraging the following key technologies:

*   **Frontend Framework:** Next.js 15 (App Router) with React 19 for building user interfaces.
*   **Language:** TypeScript for type safety and improved code quality across the entire codebase.
*   **Styling:** Tailwind CSS 4 for utility-first CSS styling, ensuring responsive and consistent designs.
*   **UI Components:** Shadcn/ui for pre-built, accessible, and customizable UI components.
*   **Backend/Database:** Supabase (PostgreSQL) for database management, authentication, and real-time capabilities.
*   **Deployment:** Netlify, utilizing Netlify Functions for serverless API endpoints and Scheduled Functions for automated background tasks.
*   **AI Engine:** Google Gemini Pro, integrated via the `@google/genai` package, for advanced AI story analysis.
*   **Data Visualization:** Recharts for creating interactive and responsive charts.
*   **PDF Generation:** `jspdf` and `html2canvas` for client-side PDF export functionality.
*   **Icons:** Lucide React for a comprehensive set of customizable SVG icons.
*   **External APIs:** Integration with Stockbit (via custom `lib/stockbit.ts`) and Tradersaham.com (for broker flow data).

## 📚 Library Usage Rules

To ensure maintainability, consistency, and optimal performance, please adhere to the following library usage rules:

*   **UI & Styling:**
    *   **Tailwind CSS:** Always use Tailwind CSS classes for all styling. Avoid inline styles or custom CSS files unless absolutely necessary for global overrides.
    *   **Shadcn/ui:** Prioritize using components from shadcn/ui for common UI elements (e.g., buttons, inputs, cards, dialogs). If a specific component is not available or requires significant deviation from its design, create a new custom component using Tailwind CSS.
*   **Data Management & Persistence:**
    *   **Supabase:** All interactions with the PostgreSQL database should be handled through the `lib/supabase.ts` module. This includes fetching, inserting, updating, and deleting data.
    *   **Stockbit API:** Direct calls to the Stockbit API are abstracted within `lib/stockbit.ts`. Use the functions provided in this module for all Stockbit data retrieval.
    *   **Tradersaham API:** Broker flow data is fetched via the `app/api/broker-flow/route.ts` endpoint, which in turn calls the Tradersaham API.
*   **AI Features:**
    *   **Google Gemini Pro:** For any AI-driven analysis or content generation, use the `@google/genai` package as demonstrated in `netlify/functions/analyze-story-background.ts`.
*   **PDF Export:**
    *   **jspdf & html2canvas:** Use these libraries exclusively for generating and exporting PDF documents, as seen in `lib/pdfExport.ts`.
*   **Icons:**
    *   **Lucide React:** All icons used throughout the application should come from the `lucide-react` library.
*   **Charting:**
    *   **Recharts:** For any new data visualization requirements, leverage the `recharts` library.
*   **Routing:**
    *   **Next.js App Router:** All application routes and navigation should be managed using the Next.js App Router system.