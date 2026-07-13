import type { SettingsTab } from '@/hubs/core/types/settings-tabs';
import { pushState, replaceState } from '$app/navigation';
import { page } from '$app/state';

let activeTab = $state<SettingsTab>('general');

export function isSettingsOpen(): boolean {
  return !!page.state?.showSettings;
}

export function getSettingsTab(): SettingsTab {
  return (page.state?.settingsTab as SettingsTab) ?? activeTab;
}

export function openSettings(tab?: SettingsTab): void {
  if (isSettingsOpen()) return;
  if (tab) activeTab = tab;
  const state = { showSettings: true, settingsTab: tab ?? activeTab };
  // Close palette if open to prevent stacking modals
  if (page.state?.showPalette) {
    history.back();
    setTimeout(() => pushState('', state), 0);
    return;
  }
  pushState('', state);
}

export function closeSettings(): void {
  if (page.state?.showSettings) {
    history.back();
  }
}

function toggleSettings(): void {
  if (isSettingsOpen()) closeSettings();
  else openSettings();
}

export function setSettingsTab(tab: SettingsTab): void {
  activeTab = tab;
  if (page.state?.showSettings) {
    replaceState('', { ...page.state, settingsTab: tab });
  }
}
