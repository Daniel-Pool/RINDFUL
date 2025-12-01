// universal color system
// import this file wherever you need consistent colors

export const colors = {
  // primary brand colors
  primary: {
    main: '#f59e0b',        // amber-500 - main brand color
    light: '#fbbf24',       // amber-400
    dark: '#d97706',        // amber-600
    bg: '#fffbeb',          // amber-50 - light background
    100: '#fef3c7',         // amber-100
    200: '#fde68a',         // amber-200
    300: '#fcd34d',         // amber-300
  },

  // secondary accent colors
  secondary: {
    main: '#10b981',        // emerald-500 - navigation/accent
    light: '#34d399',       // emerald-400
    dark: '#059669',        // emerald-600
    bg: '#d1fae5',          // emerald-100
  },

  // tertiary/Calendar colors
  tertiary: {
    main: '#fb923c',        // orange-400 - calendar header
    light: '#fdba74',       // orange-300
    dark: '#f97316',        // orange-500
  },

  // mood scale colors
  mood: {
    veryLow: '#808080',     // gray (⚫)
    low: '#ef4444',         // red (🔴)
    neutral: '#f97316',     // orange (🟠)
    good: '#eab308',        // yellow (🟡)
    great: '#22c55e',       // green (🟢)
  },

  // UI element colors
  ui: {
    white: '#ffffff',
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    blue: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
    },
    indigo: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
    },
    green: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
    },
    red: {
      50: '#fef2f2',
      200: '#fecaca',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
    },
    yellow: {
      50: '#fefce8',
      200: '#fef08a',
      600: '#ca8a04',
      700: '#a16207',
    },
    purple: {
      50: '#faf5ff',
      500: '#a855f7',
      600: '#9333ea',
    },
  },

  // status colors
  status: {
    success: '#22c55e',     // green-500
    warning: '#f59e0b',     // amber-500
    error: '#ef4444',       // red-500
    info: '#3b82f6',        // blue-500
  },

  // background colors
  background: {
    main: '#fffbeb',        // amber-50 - main app background
    calendar: '#fb923c',    // orange-400 - calendar section
    card: '#ffffff',        // white cards
    hover: '#f3f4f6',       // gray-100
  },

  // text colors
  text: {
    primary: '#1f2937',     // gray-800
    secondary: '#6b7280',   // gray-500
    light: '#9ca3af',       // gray-400
    white: '#ffffff',
  },

  // border colors
  border: {
    light: '#e5e7eb',       // gray-200
    medium: '#d1d5db',      // gray-300
    dark: '#9ca3af',        // gray-400
  },

  // shadow colors (for tailwind)
  shadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    default: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  }
};

// tailwind class helper functions
export const tw = {
  // background utilities

  bg: {
    main: 'bg-amber-50',
    mainHeavier: 'bg-amber-100',
    mainLight: 'bg-amber-300/10',
    calendar: 'bg-orange-300',
    card: 'bg-white',
    washedCard: 'hover:bg-gray-200',
    primary: 'bg-amber-500',
    secondary: 'bg-emerald-400',
    main2: 'bg-emerald-100',
    main3: 'bg-orange-100',
    hover: 'hover:bg-gray-100',
    secondaryTransparent: 'bg-emerald-500/20',
    primaryTransparent: 'bg-amber-500/20',
  },

  // text utilities
  text: {
    primary: 'text-gray-800',
    secondary: 'text-gray-600',
    quaternary: 'text-gray-700',
    tertiary: 'text-gray-500',
    light: 'text-gray-400',
    superLight: 'text-gray-100',
    white: 'text-white',
    brand: 'text-amber-500',
    orange: 'text-orange-400',
    emerald: 'text-emerald-800',
    green: 'text-green-600',
    brandGreen: 'text-emerald-400',
  },

  // border utilities
  border: {
    light: 'border-gray-200',
    medium: 'border-gray-300',
    primary: 'border-amber-500 hover:border-amber-500',
    secondary: 'border-emerald-400 border-t-emerald-600',
  },

  // button styles
  button: {
    primary: 'bg-amber-500 text-white hover:bg-amber-600 transition-colors rounded-lg px-4 py-2 font-medium',
    light: 'bg-amber-100 text-white hover:bg-amber-100 transition-colors rounded-lg px-4 py-2 font-medium',
    secondary: 'bg-emerald-400 text-white hover:bg-emerald-500 transition-colors rounded-lg px-4 py-2 font-medium',
    secondaryDark: 'bg-green-500 text-white hover:bg-green-600 transition-colors rounded-lg px-4 py-2 font-medium',
    tertiary: 'bg-orange-500 text-white hover:bg-orange-600 transition-colors rounded-lg px-4 py-2 font-medium',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors rounded-lg px-4 py-2 font-medium',
    lightOddball: 'px-4 py-0 bg-white text-gray-800 hover:bg-gray-100 rounded-lg font-bold transition-colors shadow-sm',
    ghost: 'text-gray-700 hover:bg-gray-100 transition-colors rounded-lg px-4 py-2 font-medium',
  },

  // card styles
  card: {
    default: 'bg-white rounded-xl shadow p-6',
    hover: 'bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow',
  },

  // ring styles
  ring: {
        green: 'focus:ring-emerald-800',
  }
};

// CSS variable format (for use in globals.css or tailwind.config.js)
export const cssVariables = `
:root {
  /* Primary colors */
  --color-primary: 245 158 11;         /* amber-500 */
  --color-primary-light: 251 191 36;   /* amber-400 */
  --color-primary-dark: 217 119 6;     /* amber-600 */
  
  /* Secondary colors */
  --color-secondary: 16 185 129;       /* emerald-500 */
  --color-secondary-light: 52 211 153; /* emerald-400 */
  
  /* Tertiary colors */
  --color-tertiary: 251 146 60;        /* orange-400 */
  
  /* Background colors */
  --color-bg-main: 255 251 235;        /* amber-50 */
  --color-bg-calendar: 251 146 60;     /* orange-400 */
  --color-bg-card: 255 255 255;        /* white */
  
  /* Text colors */
  --color-text-primary: 31 41 55;      /* gray-800 */
  --color-text-secondary: 107 114 128; /* gray-500 */
  
  /* Status colors */
  --color-success: 34 197 94;          /* green-500 */
  --color-warning: 245 158 11;         /* amber-500 */
  --color-error: 239 68 68;            /* red-500 */
  --color-info: 59 130 246;            /* blue-500 */
}
`;

// export default for easy import
export default colors;