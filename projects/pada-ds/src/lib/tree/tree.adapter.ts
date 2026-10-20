import type { TreeData, TreeItemData } from './tree';

/** A nested node as APIs commonly return it (file listings, category trees, org charts). */
export interface TreeApiNode {
  id: string | number;
  name?: string | null;
  icon?: string | null;
  children?: TreeApiNode[] | null;
  disabled?: boolean | null;
}

const toItem = (node: TreeApiNode): TreeItemData => {
  const value = String(node.id);
  const children = node.children?.map(toItem);
  return {
    value,
    label: node.name?.trim() || value,
    ...(node.icon ? { icon: node.icon } : {}),
    ...(children?.length ? { children } : {}),
    ...(node.disabled ? { disabled: true } : {}),
  };
};

/** Maps API nodes to `ds-tree` data: string values, a label (the id when unnamed), no empty children. */
export function toTreeData(nodes: readonly TreeApiNode[] | null | undefined): TreeData {
  return { items: (nodes ?? []).map(toItem) };
}
