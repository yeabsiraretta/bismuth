import { CREATIVE_IDEAS_KEY } from '@/constants/storage-keys';

export interface CreativeIdea {
  id: string;
  text: string;
  tags: string;
  ts: number;
}

function loadIdeas(): CreativeIdea[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CREATIVE_IDEAS_KEY);
    return raw ? (JSON.parse(raw) as CreativeIdea[]) : [];
  } catch {
    return [];
  }
}

let ideas = $state<CreativeIdea[]>(loadIdeas());

function persistIdeas(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(CREATIVE_IDEAS_KEY, JSON.stringify(ideas));
}

export function getCreativeIdeas(): CreativeIdea[] {
  return ideas;
}

export function addCreativeIdea(text: string, tags = ''): void {
  const trimmed = text.trim();
  if (!trimmed) return;
  ideas = [{ id: crypto.randomUUID(), text: trimmed, tags: tags.trim(), ts: Date.now() }, ...ideas];
  persistIdeas();
}

export function removeCreativeIdea(id: string): void {
  ideas = ideas.filter((idea) => idea.id !== id);
  persistIdeas();
}
