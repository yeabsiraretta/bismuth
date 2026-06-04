/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				// Map to Obsidian-style variables from tokens.css
				'bg-primary': 'var(--background-primary)',
				'bg-primary-alt': 'var(--background-primary-alt)',
				'bg-secondary': 'var(--background-secondary)',
				'bg-secondary-alt': 'var(--background-secondary-alt)',
				'text-normal': 'var(--text-normal)',
				'text-muted': 'var(--text-muted)',
				'text-faint': 'var(--text-faint)',
				'text-error': 'var(--text-error)',
				'text-accent': 'var(--text-accent)',
				'accent': 'var(--interactive-accent)',
				'accent-hover': 'var(--interactive-accent-hover)',
				'border': 'var(--background-modifier-border)',
				'hover': 'var(--background-modifier-hover)',
				'error': 'var(--background-modifier-error)',
				'success': 'var(--background-modifier-success)',
			},
			spacing: {
				'xs': 'var(--spacing-xs)',
				's': 'var(--spacing-s)',
				'm': 'var(--spacing-m)',
				'l': 'var(--spacing-l)',
				'xl': 'var(--spacing-xl)',
				'xxl': 'var(--spacing-xxl)',
			},
			borderRadius: {
				'xs': 'var(--radius-xs)',
				's': 'var(--radius-s)',
				'm': 'var(--radius-m)',
				'l': 'var(--radius-l)',
				'xl': 'var(--radius-xl)',
			},
			fontFamily: {
				'text': 'var(--font-text)',
				'mono': 'var(--font-monospace)',
				'interface': 'var(--font-interface)',
			},
			fontSize: {
				'smallest': 'var(--font-smallest)',
				'smaller': 'var(--font-smaller)',
				'small': 'var(--font-small)',
				'ui-small': 'var(--font-ui-small)',
				'ui-medium': 'var(--font-ui-medium)',
				'ui-large': 'var(--font-ui-large)',
				'text': 'var(--font-text-size)',
			},
			boxShadow: {
				's': 'var(--shadow-s)',
				'm': 'var(--shadow-m)',
				'l': 'var(--shadow-l)',
				'xl': 'var(--shadow-xl)',
			},
			animation: {
				'spin-slow': 'spin 3s linear infinite',
				'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
			}
		}
	},
	plugins: [],
	darkMode: 'class'
};
