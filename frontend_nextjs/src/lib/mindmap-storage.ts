import type { MindMapNode } from '@/types/mindmap';

export type MindmapInsightPayload = {
  nodeId: string;
  parentNodeId: string | null;
  label: string;
  type: MindMapNode['type'];
  weaknessSummary?: string;
  actionSteps?: string[];
  color?: string;
};

export const MINDMAP_STORAGE_KEY = 'mathmentor:mindmap:dynamic-nodes';

export function loadStoredMindmapInsights(): MindmapInsightPayload[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(MINDMAP_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Không thể đọc mindmap insights từ localStorage', error);
    return [];
  }
}

export function saveMindmapInsights(nodes: MindmapInsightPayload[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(MINDMAP_STORAGE_KEY, JSON.stringify(nodes));
  } catch (error) {
    console.error('Không thể lưu mindmap insights vào localStorage', error);
  }
}

export function upsertMindmapInsights(nodes: MindmapInsightPayload[]) {
  if (!nodes.length) return;
  const existing = loadStoredMindmapInsights();
  const map = new Map<string, MindmapInsightPayload>();

  existing.forEach((node) => map.set(node.nodeId, node));
  nodes.forEach((node) => map.set(node.nodeId, node));

  const merged = Array.from(map.values());
  saveMindmapInsights(merged);
}

function cloneMindmap(node: MindMapNode): MindMapNode {
  return JSON.parse(JSON.stringify(node));
}

function insertNodeIntoTree(root: MindMapNode, targetParentId: string, nodeToInsert: MindMapNode): boolean {
  if (root.id === targetParentId) {
    const existingIndex = root.children.findIndex((child) => child.id === nodeToInsert.id);
    if (existingIndex >= 0) {
      root.children[existingIndex] = {
        ...root.children[existingIndex],
        ...nodeToInsert,
      };
    } else {
      root.children = [...root.children, nodeToInsert];
    }
    return true;
  }

  for (const child of root.children) {
    const inserted = insertNodeIntoTree(child, targetParentId, nodeToInsert);
    if (inserted) return true;
  }

  return false;
}

export function mergeMindmapWithInsights(base: MindMapNode, insights: MindmapInsightPayload[]): MindMapNode {
  if (!insights.length) return base;
  const tree = cloneMindmap(base);

  insights.forEach((insight) => {
    const parentId = insight.parentNodeId || tree.id;
    const nodeToInsert: MindMapNode = {
      id: insight.nodeId,
      label: insight.label,
      type: insight.type,
      color: insight.color || '#fcd34d',
      description: insight.weaknessSummary,
      recommendations: insight.actionSteps || [],
      children: [],
    };

    const attached = insertNodeIntoTree(tree, parentId, nodeToInsert);
    if (!attached) {
      tree.children = [...tree.children, nodeToInsert];
    }
  });

  return tree;
}
