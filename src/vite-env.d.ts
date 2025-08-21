/// <reference types="vite/client" />
/// <reference types="@testing-library/jest-dom" />

interface ImportMetaEnv {
  // Google AI
  readonly VITE_GOOGLE_API_KEY: string;
  readonly VITE_MODEL_ID: string;
  
  // API Configuration
  readonly VITE_API_URL: string;
  
  // Supabase
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  
  // App Configuration
  readonly VITE_APP_ENV: 'development' | 'production' | 'test';
  
  // Analytics
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_GA_TRACKING_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Fix for @testing-library/jest-dom type extensions
declare namespace jest {
  interface Matchers<R> {
    toBeInTheDocument(): R;
    toBeVisible(): R;
    toHaveClass(...classNames: string[]): R;
    toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace?: boolean }): R;
  }
}

declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.jpeg' {
  const value: string;
  export default value;
}

declare module '*.gif' {
  const value: string;
  export default value;
}

declare module '*.webp' {
  const value: string;
  export default value;
}

declare module '*.css' {
  const classes: { [key: string]: string };
  export default classes;
}
