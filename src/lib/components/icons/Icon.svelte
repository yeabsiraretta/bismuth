<script lang="ts">
	import { iconPaths, type IconName } from '@/assets/icons';
	import { log } from '@/utils/logger';

	export let name: IconName;
	export let size: number = 20;
	export let color: string = 'currentColor';
	export let strokeWidth: number = 2;
	export let ariaLabel: string | undefined = undefined;

	$: path = iconPaths[name] || '';
	$: if (!path && name) {
		log.warn(`[Icon] Missing icon path for "${name}". Add it to src/lib/assets/icons.ts`);
	}
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke={color}
	stroke-width={strokeWidth}
	stroke-linecap="round"
	stroke-linejoin="round"
	class="icon"
	role="img"
	aria-label={ariaLabel || name}
>
	<path d={path} />
</svg>

<style>
	.icon {
		display: inline-block;
		vertical-align: middle;
		flex-shrink: 0;
	}
</style>
