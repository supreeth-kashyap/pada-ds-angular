import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  contentChild,
  Directive,
  inject,
  input,
  TemplateRef,
} from '@angular/core';
import {
  DsTree,
  DsTreeGroup,
  DsTreeItem,
  DsTreeItemIndicator,
  DsTreeItemLabel,
  DsTreeItemRow,
} from 'pada-ds-angular/headless';
import { IconComponent } from '../icon/icon';

/** One item of a tree. */
export interface TreeItemData {
  /** Unique within the tree; identifies the item in `expanded` and `value`. */
  value: string;
  label: string;
  /** Built-in icon name shown before the label. */
  icon?: string;
  /** Child items. An item with children can expand. */
  children?: TreeItemData[];
  disabled?: boolean;
}

/** What `ds-tree` renders: the top-level items, nested through `children`. */
export interface TreeData {
  items: TreeItemData[];
}

/**
 * Custom content for each item's label. The context is the item's `TreeItemData`.
 *
 * ```html
 * <ds-tree aria-label="Files" [data]="files">
 *   <ng-template dsTreeItemContent let-item>{{ item.label }} <small>{{ sizes[item.value] }}</small></ng-template>
 * </ds-tree>
 * ```
 */
@Directive({ selector: 'ng-template[dsTreeItemContent]' })
export class TreeItemContentDirective {
  readonly template = inject<TemplateRef<{ $implicit: TreeItemData }>>(TemplateRef);
  static ngTemplateContextGuard(
    _directive: TreeItemContentDirective,
    _context: unknown,
  ): _context is { $implicit: TreeItemData } {
    return true;
  }
}

/** One rendered item and, while it is expanded, its children. Used by `ds-tree`. */
@Component({
  selector: '[dsTreeNode]',
  imports: [
    DsTreeItemRow,
    DsTreeItemIndicator,
    DsTreeItemLabel,
    DsTreeGroup,
    IconComponent,
    NgTemplateOutlet,
  ],
  templateUrl: './tree-node.html',
  styleUrl: './tree-node.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: DsTreeItem, inputs: ['value', 'expandable', 'disabled'] }],
  host: { class: 'tree-item' },
})
export class TreeNodeComponent {
  protected readonly item = inject(DsTreeItem);
  /** The item to render. */
  readonly node = input.required<TreeItemData>({ alias: 'dsTreeNode' });
  /** Custom label content, passed down from `ds-tree`. */
  readonly content = input<TreeItemContentDirective | undefined>(undefined);
}

/**
 * A tree of items for file browsers, navigation and nested settings (WAI-ARIA APG Tree View).
 * Up/Down move, Right expands or enters, Left collapses or goes up, Home/End jump, `*` expands
 * the siblings, typing jumps to an item. Selection is `single`, `multiple` or `none`. Name it
 * with `aria-label` or `aria-labelledby`.
 *
 * ```html
 * <ds-tree aria-label="Project" [data]="files" [(expanded)]="open" [(value)]="selected" />
 * <ds-tree aria-label="Settings" [data]="toTreeData(api.sections)" selectionMode="none" />
 * ```
 *
 * Inputs (from the headless `DsTree`): `expanded` and `value` (two-way, item values),
 * `selectionMode`. Customise labels with an `ng-template dsTreeItemContent`; for fully custom
 * markup, use the headless `dsTree` parts.
 *
 * Differences from React: items come in one `data` input (`{ items }`, React's `items` prop),
 * typed `TreeItemData` (React's `TreeNode`), with `toTreeData` to map an API shape; labels are
 * text, customised through the template instead of React nodes; the styled `Tree.Root/Item…`
 * parts are the headless directives plus the template.
 */
@Component({
  selector: 'ds-tree',
  imports: [TreeNodeComponent],
  template: `
    @for (node of data().items; track node.value) {
      <div
        [dsTreeNode]="node"
        [content]="content()"
        [value]="node.value"
        [expandable]="!!node.children?.length"
        [disabled]="!!node.disabled"
      ></div>
    }
  `,
  styleUrl: './tree.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: DsTree,
      inputs: ['expanded', 'selectionMode', 'value'],
      outputs: ['expandedChange', 'valueChange'],
    },
  ],
})
export class TreeComponent {
  /** The items to render. */
  readonly data = input.required<TreeData>();
  protected readonly content = contentChild(TreeItemContentDirective);
}

/** The tree and its label template, for `imports: [...TreeParts]`. */
export const TreeParts = [TreeComponent, TreeItemContentDirective] as const;
