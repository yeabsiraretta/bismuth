import { invoke } from '@tauri-apps/api/core';
import type { PublishableNote, PublishConfig, PublishResult } from '../types';

/** Scans the vault for notes marked with dg-publish: true. */
export async function scanPublishableNotes(): Promise<PublishableNote[]> {
  return invoke<PublishableNote[]>('scan_publishable_notes');
}

/** Publishes the digital garden to the configured target. */
export async function publishSite(config: PublishConfig): Promise<PublishResult> {
  return invoke<PublishResult>('publish_site', { config });
}

/** Gets the current publish configuration. */
export async function getPublishConfig(): Promise<PublishConfig | null> {
  return invoke<PublishConfig | null>('get_publish_config');
}

/** Saves publish configuration. */
export async function savePublishConfig(config: PublishConfig): Promise<void> {
  return invoke('save_publish_config', { config });
}

/** Toggle publish flag on a note's frontmatter. */
export async function togglePublishFlag(path: string): Promise<boolean> {
  return invoke<boolean>('toggle_publish_flag', { path });
}
