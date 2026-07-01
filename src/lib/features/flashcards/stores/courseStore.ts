/**
 * Course store — reactive state for Study Vault course management.
 * All IPC calls delegated to services/courseService.ts.
 */

import { writable, derived, get } from 'svelte/store';
import type { Course, TopicMastery, CourseProgress } from '../types/course';
import {
  listCourses,
  saveCourse,
  deleteCourse,
  listTopics,
  saveTopic,
} from '../services/courseService';
import { log } from '@/utils/logger';

interface CourseStoreState {
  courses: Course[];
  activeCourseId: string | null;
  topicsByPath: Record<string, TopicMastery[]>;
  loading: boolean;
  error: string | null;
}

const _store = writable<CourseStoreState>({
  courses: [],
  activeCourseId: null,
  topicsByPath: {},
  loading: false,
  error: null,
});

export const courses = derived(_store, (s) => s.courses);
export const activeCourseId = derived(_store, (s) => s.activeCourseId);
export const isCourseLoading = derived(_store, (s) => s.loading);
export const courseError = derived(_store, (s) => s.error);

export const activeCourse = derived(
  _store,
  (s) => s.courses.find((c) => c.id === s.activeCourseId) ?? null
);

export const courseTopics = derived(_store, (s) => {
  const id = s.activeCourseId;
  if (!id) return [];
  const course = s.courses.find((c) => c.id === id);
  if (!course) return [];
  return s.topicsByPath[course.folderPath] ?? [];
});

export const courseProgress = derived(_store, (s): CourseProgress | null => {
  const id = s.activeCourseId;
  if (!id) return null;
  const course = s.courses.find((c) => c.id === id);
  if (!course) return null;
  const topics = s.topicsByPath[course.folderPath] ?? [];
  const mastered = topics.filter((t) => t.mastered).length;
  const total = Math.max(course.totalTopics, topics.length);
  let daysUntilExam: number | null = null;
  if (course.examDate) {
    const diff = new Date(course.examDate).getTime() - Date.now();
    daysUntilExam = Math.max(0, Math.ceil(diff / 86400000));
  }
  return {
    courseId: id,
    totalTopics: total,
    masteredTopics: mastered,
    masteredPercent: total > 0 ? Math.round((mastered / total) * 100) : 0,
    daysUntilExam,
    cardsDue: 0,
    totalCards: topics.reduce((sum, t) => sum + t.cardCount, 0),
  };
});

export async function loadCourses(): Promise<void> {
  _store.update((s) => ({ ...s, loading: true, error: null }));
  try {
    const list = await listCourses();
    _store.update((s) => ({ ...s, courses: list, loading: false }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    _store.update((s) => ({ ...s, loading: false, error: msg }));
    log.error('courseStore: loadCourses failed', err as Error);
  }
}

export async function saveCourseAction(course: Course): Promise<void> {
  const saved = await saveCourse(course);
  _store.update((s) => {
    const idx = s.courses.findIndex((c) => c.id === saved.id);
    const courses =
      idx >= 0 ? s.courses.map((c, i) => (i === idx ? saved : c)) : [...s.courses, saved];
    return { ...s, courses };
  });
}

export async function deleteCourseAction(id: string): Promise<void> {
  await deleteCourse(id);
  _store.update((s) => ({
    ...s,
    courses: s.courses.filter((c) => c.id !== id),
    activeCourseId: s.activeCourseId === id ? null : s.activeCourseId,
  }));
}

export function setActiveCourse(id: string | null): void {
  _store.update((s) => ({ ...s, activeCourseId: id }));
  if (id) {
    const course = get(_store).courses.find((c) => c.id === id);
    if (course) loadTopics(course.folderPath, id);
  }
}

export async function loadTopics(folderPath: string, courseId: string): Promise<void> {
  const topics = await listTopics(folderPath, courseId);
  _store.update((s) => ({
    ...s,
    topicsByPath: { ...s.topicsByPath, [folderPath]: topics },
  }));
}

export async function markTopicMastered(
  courseId: string,
  notePath: string,
  mastered: boolean
): Promise<void> {
  const state = get(_store);
  const course = state.courses.find((c) => c.id === courseId);
  if (!course) return;
  const topics = state.topicsByPath[course.folderPath] ?? [];
  const topic = topics.find((t) => t.notePath === notePath) ?? {
    notePath,
    mastered: false,
    lastReviewed: null,
    cardCount: 0,
  };
  const updated = { ...topic, mastered, lastReviewed: new Date().toISOString() };
  await saveTopic(courseId, updated);
  _store.update((s) => ({
    ...s,
    topicsByPath: {
      ...s.topicsByPath,
      [course.folderPath]: topics.map((t) => (t.notePath === notePath ? updated : t)),
    },
  }));
}
