import { getCollection } from 'astro:content';

export interface Project {
  name: string;
  slug: string;
  status: string;
  started: string;
  summary: string;
  tech?: string[];
  links?: { github?: string };
  posts?: string[];
}

/**
 * 读取 src/content/projects.yaml（顶层数组，单条目承载）
 */
export async function getProjects(): Promise<Project[]> {
  const entries = await getCollection('projects');
  if (entries.length === 0) return [];
  const data = entries[0].data as unknown;
  if (Array.isArray(data)) return data as Project[];
  return data ? [data as Project] : [];
}
