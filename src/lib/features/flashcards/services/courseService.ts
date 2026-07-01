/**
 * Course service — IPC wrappers for study vault course and topic management.
 * All Tauri invoke() calls isolated here; components never call invoke() directly.
 */

import { invoke } from '@tauri-apps/api/core';
import { log } from '@/utils/logger';
import type { Course, TopicMastery } from '../types/course';

/** Load all courses from `.bismuth/study/courses.json`. */
export async function listCourses(): Promise<Course[]> {
  try {
    return await invoke<Course[]>('list_courses');
  } catch (err) {
    log.warn('courseService: listCourses failed', { err });
    return [];
  }
}

/** Save or update a course record. */
export async function saveCourse(course: Course): Promise<Course> {
  return invoke<Course>('save_course', { course });
}

/** Delete a course by ID (does not delete topic notes). */
export async function deleteCourse(id: string): Promise<void> {
  await invoke('delete_course', { id });
}

/** List all topic notes in a course folder with mastery state. */
export async function listTopics(folderPath: string, courseId: string): Promise<TopicMastery[]> {
  try {
    return await invoke<TopicMastery[]>('list_study_topics', { folderPath, courseId });
  } catch (err) {
    log.warn('courseService: listTopics failed', { folderPath, err });
    return [];
  }
}

/** Persist mastery state for a topic note. */
export async function saveTopic(courseId: string, topic: TopicMastery): Promise<void> {
  await invoke('save_study_topic', { courseId, topic });
}
