# Animation Timeline Architecture

**Status**: Architecture Stub | **Spec**: 009-deferred-features

## Overview

Defines the animation model for Bismuth component variants, enabling state-to-state transitions with keyframe interpolation. Integrates with the existing `canvasComponentVariants.ts` system.

## Keyframe Model

Each animation is defined as a sequence of keyframes between two component states:

```
State A ──[keyframe 0]──[keyframe 1]──...──[keyframe N]── State B
         t=0            t=T1                t=duration
```

### Properties

Animatable properties include:

- Position: `x`, `y`
- Size: `width`, `height`
- Visual: `opacity`, `rotation`, `scale`
- Style: `fill`, `stroke`, `borderRadius`

Non-animatable properties (discrete): `text`, `visibility`, `element_type`

## Easing Functions

| Name | Description |
| ---- | ----------- |
| `linear` | Constant velocity |
| `ease-in` | Accelerating from zero |
| `ease-out` | Decelerating to zero |
| `ease-in-out` | Accelerate then decelerate |
| `spring` | Physics-based spring simulation |
| `cubic-bezier` | Custom curve via 4 control points |

## State-to-State Mapping

Components declare named variant states (e.g., "default", "hover", "active"). Transitions are defined between any two states:

```typescript
// Example: A button component with hover transition
const timeline: Timeline = {
  componentId: 'btn-primary-001',
  states: ['default', 'hover', 'pressed'],
  transitions: [
    { id: 't1', from: 'default', to: 'hover', duration: 200, keyframes: [...] },
    { id: 't2', from: 'hover', to: 'pressed', duration: 100, keyframes: [...] },
  ]
};
```

## Integration with Component Variants

The animation system connects to `canvasComponentVariants.ts`:

1. Variant definitions declare the property values for each state
2. Timelines declare how to interpolate between those states
3. The runtime animation engine reads the timeline and produces intermediate frames
4. Preview mode renders animations in real-time at the canvas viewport framerate

## Runtime Considerations

- Animations run at display refresh rate (requestAnimationFrame)
- Inactive/off-screen animations are paused
- Timeline scrubbing allows designer preview at any point in time
- Export produces CSS keyframe equivalents for web publishing

## Type Contracts

All types are defined in `src/lib/types/animation.ts` with the `@architecture-stub` JSDoc tag.
