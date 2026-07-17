import { CREATIVE_IDEAS_KEY } from '@/constants/storage-keys';

export interface CreativeIdea {
  id: string;
  text: string;
  tags: string;
  ts: number;
}

let ideas = $state<CreativeIdea[]>([]);
let hydrated = false;

function loadIdeas(): CreativeIdea[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CREATIVE_IDEAS_KEY);
    return raw ? (JSON.parse(raw) as CreativeIdea[]) : [];
  } catch {
    return [];
  }
}

function persistIdeas(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(CREATIVE_IDEAS_KEY, JSON.stringify(ideas));
}

function ensureHydrated(): void {
  if (hydrated) return;
  ideas = loadIdeas();
  hydrated = true;
}

export function getCreativeIdeas(): CreativeIdea[] {
  ensureHydrated();
  return ideas;
}

export function addCreativeIdea(text: string, tags = ''): void {
  ensureHydrated();
  const trimmed = text.trim();
  if (!trimmed) return;
  ideas = [{ id: crypto.randomUUID(), text: trimmed, tags: tags.trim(), ts: Date.now() }, ...ideas];
  persistIdeas();
}

export function removeCreativeIdea(id: string): void {
  ensureHydrated();
  ideas = ideas.filter((idea) => idea.id !== id);
  persistIdeas();
}
