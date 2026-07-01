import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  layoutStore,
  toggleLeftSidebar,
  toggleRightSidebar,
  setLeftSidebarWidth,
  setRightSidebarWidth,
  saveLayout,
  loadLayout,
  LAYOUT_CONSTANTS,
} from '../layout/layout';

describe('layout store', () => {
  beforeEach(() => {
    layoutStore.set({
      leftSidebarVisible: true,
      rightSidebarVisible: true,
      leftSidebarWidth: LAYOUT_CONSTANTS.SIDEBAR_DEFAULT_WIDTH,
      rightSidebarWidth: LAYOUT_CONSTANTS.SIDEBAR_DEFAULT_WIDTH,
      leftTabs: [],
      rightTabs: [],
      leftLowerTabs: [],
      rightLowerTabs: [],
      bottomTabs: [],
      leftActiveTab: 'files',
      rightActiveTab: 'backlinks',
    });
    localStorage.clear();
  });

  it('should have default state', () => {
    const state = get(layoutStore);
    expect(state.leftSidebarVisible).toBe(true);
    expect(state.rightSidebarVisible).toBe(true);
    expect(state.leftSidebarWidth).toBe(300);
    expect(state.rightSidebarWidth).toBe(300);
  });

  it('should toggle left sidebar', () => {
    toggleLeftSidebar();
    expect(get(layoutStore).leftSidebarVisible).toBe(false);
    toggleLeftSidebar();
    expect(get(layoutStore).leftSidebarVisible).toBe(true);
  });

  it('should toggle right sidebar', () => {
    toggleRightSidebar();
    expect(get(layoutStore).rightSidebarVisible).toBe(false);
    toggleRightSidebar();
    expect(get(layoutStore).rightSidebarVisible).toBe(true);
  });

  it('should set left sidebar width with clamping', () => {
    setLeftSidebarWidth(400);
    expect(get(layoutStore).leftSidebarWidth).toBe(400);
  });

  it('should clamp left sidebar width to min', () => {
    setLeftSidebarWidth(50);
    expect(get(layoutStore).leftSidebarWidth).toBe(LAYOUT_CONSTANTS.SIDEBAR_MIN_WIDTH);
  });

  it('should clamp left sidebar width to max', () => {
    setLeftSidebarWidth(1000);
    expect(get(layoutStore).leftSidebarWidth).toBe(LAYOUT_CONSTANTS.SIDEBAR_MAX_WIDTH);
  });

  it('should set right sidebar width with clamping', () => {
    setRightSidebarWidth(350);
    expect(get(layoutStore).rightSidebarWidth).toBe(350);
  });

  it('should clamp right sidebar width to min', () => {
    setRightSidebarWidth(100);
    expect(get(layoutStore).rightSidebarWidth).toBe(LAYOUT_CONSTANTS.SIDEBAR_MIN_WIDTH);
  });

  it('should clamp right sidebar width to max', () => {
    setRightSidebarWidth(900);
    expect(get(layoutStore).rightSidebarWidth).toBe(LAYOUT_CONSTANTS.SIDEBAR_MAX_WIDTH);
  });

  it('should save layout to localStorage', () => {
    setLeftSidebarWidth(400);
    saveLayout();
    const saved = localStorage.getItem('bismuth-layout');
    expect(saved).not.toBeNull();
    const parsed = JSON.parse(saved!);
    expect(parsed.leftSidebarWidth).toBe(400);
  });

  it('should save layout with vault name suffix', () => {
    saveLayout('my-vault');
    const saved = localStorage.getItem('bismuth-layout-my-vault');
    expect(saved).not.toBeNull();
  });

  it('should load layout from localStorage', () => {
    const savedState = {
      leftSidebarVisible: false,
      rightSidebarVisible: false,
      leftSidebarWidth: 400,
      rightSidebarWidth: 350,
    };
    localStorage.setItem('bismuth-layout', JSON.stringify(savedState));
    loadLayout();
    const state = get(layoutStore);
    expect(state.leftSidebarVisible).toBe(false);
    expect(state.rightSidebarVisible).toBe(false);
    expect(state.leftSidebarWidth).toBe(400);
    expect(state.rightSidebarWidth).toBe(350);
  });

  it('should clamp loaded width values', () => {
    const savedState = { leftSidebarWidth: 50, rightSidebarWidth: 900 };
    localStorage.setItem('bismuth-layout', JSON.stringify(savedState));
    loadLayout();
    const state = get(layoutStore);
    expect(state.leftSidebarWidth).toBe(LAYOUT_CONSTANTS.SIDEBAR_MIN_WIDTH);
    expect(state.rightSidebarWidth).toBe(LAYOUT_CONSTANTS.SIDEBAR_MAX_WIDTH);
  });

  it('should handle invalid localStorage data gracefully', () => {
    localStorage.setItem('bismuth-layout', 'invalid json');
    loadLayout();
    const state = get(layoutStore);
    expect(state.leftSidebarWidth).toBe(LAYOUT_CONSTANTS.SIDEBAR_DEFAULT_WIDTH);
  });
});
