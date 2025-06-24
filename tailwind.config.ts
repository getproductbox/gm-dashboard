
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'sans': ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
				'primary': ['Plus Jakarta Sans', 'sans-serif'],
				'mono': ['JetBrains Mono', 'Consolas', 'Courier New', 'monospace'],
			},
			colors: {
				// GM Platform Primary Palette
				'gm-primary': {
					50: '#fff7ed',
					100: '#ffedd5',
					200: '#fed7aa',
					300: '#fdba74',
					400: '#fb923c',
					500: '#f97316',
					600: '#ea580c',
					700: '#c2410c',
					800: '#9a3412',
					900: '#7c2d12',
				},
				// GM Platform Neutral Palette
				'gm-neutral': {
					0: '#ffffff',
					50: '#fafaf9',
					100: '#f5f5f4',
					200: '#e7e5e4',
					300: '#d6d3d1',
					400: '#a8a29e',
					500: '#78716c',
					600: '#57534e',
					700: '#44403c',
					800: '#292524',
					900: '#1c1917',
				},
				// GM Platform Semantic Colors
				'gm-success': {
					50: '#f0fdf4',
					500: '#22c55e',
					700: '#15803d',
				},
				'gm-warning': {
					50: '#fffbeb',
					500: '#f59e0b',
					700: '#b45309',
				},
				'gm-error': {
					50: '#fef2f2',
					500: '#ef4444',
					700: '#b91c1c',
				},
				'gm-info': {
					50: '#eff6ff',
					500: '#3b82f6',
					700: '#1d4ed8',
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			spacing: {
				'gm-1': '0.25rem',    // 4px
				'gm-2': '0.5rem',     // 8px
				'gm-3': '0.75rem',    // 12px
				'gm-4': '1rem',       // 16px - Base unit
				'gm-5': '1.25rem',    // 20px
				'gm-6': '1.5rem',     // 24px
				'gm-8': '2rem',       // 32px
				'gm-10': '2.5rem',    // 40px
				'gm-12': '3rem',      // 48px
				'gm-16': '4rem',      // 64px
				'gm-20': '5rem',      // 80px
				'gm-24': '6rem',      // 96px
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				'gm-sm': '0.25rem',   // 4px
				'gm-base': '0.5rem',  // 8px
				'gm-md': '0.75rem',   // 12px
				'gm-lg': '1rem',      // 16px
				'gm-xl': '1.5rem',    // 24px
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
