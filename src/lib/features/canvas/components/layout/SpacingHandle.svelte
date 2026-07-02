<script lang="ts">
  export let value: number = 0;
  export let direction: 'horizontal' | 'vertical' = 'horizontal';
  export let position: { x: number; y: number } = { x: 0, y: 0 };
  export let onChange: ((value: number) => void) | undefined = undefined;
  let dragging = false;
  let startPos = 0;
  let startValue = 0;

  function handleMouseDown(e: MouseEvent) {
    dragging = true;
    startPos = direction === 'horizontal' ? e.clientX : e.clientY;
    startValue = value;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  function handleMouseMove(e: MouseEvent) {
    if (!dragging) return;
    const current = direction === 'horizontal' ? e.clientX : e.clientY;
    const delta = current - startPos;
    const newValue = Math.max(0, startValue + delta);
    onChange?.(newValue);
  }

  function handleMouseUp() {
    dragging = false;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }
</script>

<div
  class="spacing-handle {direction}"
  class:dragging
  style="left: {position.x}px; top: {position.y}px"
  on:mousedown={handleMouseDown}
  role="slider"
  aria-valuenow={value}
  tabindex="0"
>
  <span class="value-label">{value}</span>
</div>

<style>
  .spacing-handle {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: col-resize;
    z-index: 10;
  }
  .spacing-handle.horizontal {
    width: 16px;
    height: 100%;
    cursor: col-resize;
  }
  .spacing-handle.vertical {
    width: 100%;
    height: 16px;
    cursor: row-resize;
  }
  .spacing-handle:hover,
  .spacing-handle.dragging {
    background: rgba(var(--accent-rgb, 74, 144, 226), 0.15);
  }
  .value-label {
    font-size: 10px;
    color: var(--accent);
    background: var(--bg-primary);
    padding: 0 2px;
    border-radius: 2px;
    pointer-events: none;
  }
</style>
