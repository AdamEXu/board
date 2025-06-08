/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
    },
  },
  plugins: [],
  // Configure CSS processing to avoid oklch issues
  corePlugins: {
    // Disable features that might use oklch
    gradientColorStops: true,
  },
  // Ensure compatibility with older color formats
  future: {
    hoverOnlyWhenSupported: true,
  },
}
