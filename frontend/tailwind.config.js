/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                midnight: {
                    950: '#020617', // Main background
                    900: '#0f172a', // Secondary background
                    800: '#1e293b', // Card background
                },
                primary: {
                    400: '#38bdf8', // Sky blue
                    500: '#0ea5e9',
                    600: '#0284c7',
                },
                accent: {
                    purple: '#8b5cf6',
                    cyan: '#06b6d4',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 6s ease-in-out infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                }
            }
        },
    },
    plugins: [],
}
