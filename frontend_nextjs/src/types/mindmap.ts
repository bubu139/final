
export interface MindMapNode {
    id: string;
    label: string; // Đổi từ content thành label
    type: 'topic' | 'subtopic' | 'concept';
    children: MindMapNode[];
    color?: string;
    description?: string;
    recommendations?: string[];
  }

  export interface MindMapNodeWithState extends MindMapNode {
    isExpanded: boolean;
    parentId: string | null;
    level: number;
  }
  export interface NodePosition {
    x: number;
    y: number;
  }
  export interface Edge {
    id: string;
    from: NodePosition;
    to: NodePosition;
  }
    
