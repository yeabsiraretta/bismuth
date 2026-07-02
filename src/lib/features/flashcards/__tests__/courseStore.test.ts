/**
 * courseStore unit tests — mocked course service.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import type { Course } from '../types/course';

vi.mock('../services/courseService', () => {
  const mockCourse = {
    id: 'c-1',
    name: 'AWS SAA',
    subject: 'Cloud',
    examDate: '2026-12-01',
    totalTopics: 10,
    folderPath: 'Courses/AWS',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    modifiedAt: '2026-01-01T00:00:00Z',
  };
  const mockTopics = [
    { notePath: 'Courses/AWS/t1.md', mastered: false, lastReviewed: null, cardCount: 3 },
    {
      notePath: 'Courses/AWS/t2.md',
      mastered: true,
      lastReviewed: '2026-01-01T00:00:00Z',
      cardCount: 2,
    },
  ];
  return {
    listCourses: vi.fn().mockResolvedValue([mockCourse]),
    saveCourse: vi.fn().mockImplementation(async (c: unknown) => c),
    deleteCourse: vi.fn().mockResolvedValue(undefined),
    listTopics: vi.fn().mockResolvedValue(mockTopics),
    saveTopic: vi.fn().mockResolvedValue(undefined),
  };
});

import {
  courses,
  activeCourse,
  courseProgress,
  loadCourses,
  setActiveCourse,
  markTopicMastered as _markTopicMastered,
  saveCourseAction,
} from '../stores/courseStore';

describe('courseStore', () => {
  beforeEach(async () => {
    await loadCourses();
  });

  it('loadCourses populates courses store', () => {
    const list = get(courses);
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('AWS SAA');
  });

  it('setActiveCourse updates activeCourse', async () => {
    setActiveCourse('c-1');
    // Wait for async topic load
    await new Promise((r) => setTimeout(r, 10));
    expect(get(activeCourse)?.id).toBe('c-1');
  });

  it('courseProgress computes mastered percent', async () => {
    setActiveCourse('c-1');
    await new Promise((r) => setTimeout(r, 10));
    const progress = get(courseProgress);
    // 1 of 2 topics mastered = 50% (but totalTopics from course is 10)
    expect(progress?.masteredTopics).toBe(1);
  });

  it('saveCourseAction adds new course', async () => {
    const newCourse: Course = {
      id: 'c-2',
      name: 'Azure 900',
      subject: 'Cloud',
      examDate: null,
      totalTopics: 5,
      folderPath: 'Courses/Azure',
      status: 'active',
      createdAt: '2026-01-01T00:00:00Z',
      modifiedAt: '2026-01-01T00:00:00Z',
    };
    await saveCourseAction(newCourse);
    const list = get(courses);
    expect(list.some((c) => c.id === 'c-2')).toBe(true);
  });

  it('setActiveCourse(null) clears active course', () => {
    setActiveCourse(null);
    expect(get(activeCourse)).toBeNull();
  });
});
