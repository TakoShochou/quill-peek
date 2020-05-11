import { Blot, Parent, Leaf } from './blot';
import LinkedList from '../../collection/linked-list';
import ShadowBlot from './shadow';
import * as Registry from '../../registry';

class ContainerBlot extends ShadowBlot implements Parent {
  static defaultChild: string;
  static allowedChildren: any[];

  children!: LinkedList<Blot>;
  domNode!: HTMLElement;

  constructor(domNode: Node) {
    super(domNode);
    this.debug('#constructor', domNode)
    this.build();
  }

  appendChild(other: Blot): void {
    this.debug('#appendChild', other)
    this.insertBefore(other);
  }

  attach(): void {
    this.debug('#attach')
    super.attach();
    this.children.forEach(child => {
      child.attach();
    });
  }

  build(): void {
    this.debug('#build')
    this.children = new LinkedList<Blot>();
    // Need to be reversed for if DOM nodes already in order
    [].slice
      .call(this.domNode.childNodes)
      .reverse()
      .forEach((node: Node) => {
        try {
          let child = makeBlot(node);
          this.insertBefore(child, this.children.head || undefined);
        } catch (err) {
          if (err instanceof Registry.ParchmentError) return;
          else throw err;
        }
      });
  }

  deleteAt(index: number, length: number): void {
    this.debug('#deleteAt', index, length)
    if (index === 0 && length === this.length()) {
      return this.remove();
    }
    this.children.forEachAt(index, length, function(child, offset, length) {
      child.deleteAt(offset, length);
    });
  }

  descendant(criteria: { new (): Blot }, index: number): [Blot | null, number];
  descendant(criteria: (blot: Blot) => boolean, index: number): [Blot | null, number];
  descendant(criteria: any, index: number): [Blot | null, number] {
    this.debug('#descendant', arguments)
    let [child, offset] = this.children.find(index);
    if (
      (criteria.blotName == null && criteria(child)) ||
      (criteria.blotName != null && child instanceof criteria)
    ) {
      return [<any>child, offset];
    } else if (child instanceof ContainerBlot) {
      return child.descendant(criteria, offset);
    } else {
      return [null, -1];
    }
  }

  descendants(criteria: { new (): Blot }, index: number, length: number): Blot[];
  descendants(criteria: (blot: Blot) => boolean, index: number, length: number): Blot[];
  descendants(criteria: any, index: number = 0, length: number = Number.MAX_VALUE): Blot[] {
    this.debug('#descendants', arguments)
    let descendants: Blot[] = [];
    let lengthLeft = length;
    this.children.forEachAt(index, length, function(child: Blot, index: number, length: number) {
      if (
        (criteria.blotName == null && criteria(child)) ||
        (criteria.blotName != null && child instanceof criteria)
      ) {
        descendants.push(child);
      }
      if (child instanceof ContainerBlot) {
        descendants = descendants.concat(child.descendants(criteria, index, lengthLeft));
      }
      lengthLeft -= length;
    });
    return descendants;
  }

  detach(): void {
    this.debug('#detach')
    this.children.forEach(function(child) {
      child.detach();
    });
    super.detach();
  }

  formatAt(index: number, length: number, name: string, value: any): void {
    this.debug('#formatAt', index, length, name, value)
    this.children.forEachAt(index, length, function(child, offset, length) {
      child.formatAt(offset, length, name, value);
    });
  }

  insertAt(index: number, value: string, def?: any): void {
    this.debug('#insertAt', index, value, def)
    let [child, offset] = this.children.find(index);
    if (child) {
      child.insertAt(offset, value, def);
    } else {
      let blot = def == null ? Registry.create('text', value) : Registry.create(value, def);
      this.appendChild(blot);
    }
  }

  insertBefore(childBlot: Blot, refBlot?: Blot): void {
    this.debug('#insertBefore', childBlot, refBlot)
    if (
      this.statics.allowedChildren != null &&
      !this.statics.allowedChildren.some(function(child: Registry.BlotConstructor) {
        return childBlot instanceof child;
      })
    ) {
      throw new Registry.ParchmentError(
        `Cannot insert ${(<ShadowBlot>childBlot).statics.blotName} into ${this.statics.blotName}`,
      );
    }
    childBlot.insertInto(this, refBlot);
  }

  length(): number {
    this.debug('#length')
    return this.children.reduce(function(memo, child) {
      return memo + child.length();
    }, 0);
  }

  moveChildren(targetParent: Parent, refNode?: Blot): void {
    this.debug('#moveChildren', targetParent, refNode)
    this.children.forEach(function(child) {
      targetParent.insertBefore(child, refNode);
    });
  }

  optimize(context: { [key: string]: any }) {
    this.debug('#optimize', context)
    super.optimize(context);
    if (this.children.length === 0) {
      if (this.statics.defaultChild != null) {
        let child = Registry.create(this.statics.defaultChild);
        this.appendChild(child);
        child.optimize(context);
      } else {
        this.remove();
      }
    }
  }

  path(index: number, inclusive: boolean = false): [Blot, number][] {
    this.debug('#path-----------------------------------------------------------------', index, inclusive, this)
    let [child, offset] = this.children.find(index, inclusive);
    let position: [Blot, number][] = [[this, index]];
    if (child instanceof ContainerBlot) {
      const result = position.concat(child.path(offset, inclusive))
      this.debug('#path if 1 concat result', result)
      return result
    } else if (child != null) {
      this.debug('#path if 2 push')
      position.push([child, offset]);
    }
    this.debug('#path result', position)
    return position;
  }

  removeChild(child: Blot): void {
    this.debug('#removeChild', child)
    this.children.remove(child);
  }

  replace(target: Blot): void {
    this.debug('#replace', target)
    if (target instanceof ContainerBlot) {
      target.moveChildren(this);
    }
    super.replace(target);
  }

  split(index: number, force: boolean = false): Blot {
    this.debug('#split', index, force, this)
    if (!force) {
      if (index === 0) {
        this.debug('#split if 1', this)
        return this;
      }
      if (index === this.length()) {
        this.debug('#split if 2', this)
        return this.next;
      }
    }
    let after = <ContainerBlot>this.clone(); // この時点ですでに分割されている？
    this.debug('#split after clone', this, after)
    this.parent.insertBefore(after, this.next);
    this.debug('#split after parent.insertBefore', this, after)
    const that = this
    this.children.forEachAt(index, this.length(), function(child, offset, length) {
      that.debug('#split forEactAt', child, offset, length)
      child = child.split(offset, force);
      after.appendChild(child);
    });
    this.debug('#split result', this, after)
    return after;
  }

  unwrap(): void {
    this.debug('#unwrap')
    this.moveChildren(this.parent, this.next);
    this.remove();
  }

  update(mutations: MutationRecord[], context: { [key: string]: any }): void {
    this.debug('#update', mutations, context)
    let addedNodes: Node[] = [];
    let removedNodes: Node[] = [];
    mutations.forEach(mutation => {
      if (mutation.target === this.domNode && mutation.type === 'childList') {
        addedNodes.push.apply(addedNodes, mutation.addedNodes);
        removedNodes.push.apply(removedNodes, mutation.removedNodes);
      }
    });
    removedNodes.forEach((node: Node) => {
      // Check node has actually been removed
      // One exception is Chrome does not immediately remove IFRAMEs
      // from DOM but MutationRecord is correct in its reported removal
      if (
        node.parentNode != null &&
        // @ts-ignore
        node.tagName !== 'IFRAME' &&
        document.body.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_CONTAINED_BY
      ) {
        return;
      }
      let blot = Registry.find(node);
      if (blot == null) return;
      if (blot.domNode.parentNode == null || blot.domNode.parentNode === this.domNode) {
        blot.detach();
      }
    });
    addedNodes
      .filter(node => {
        return node.parentNode == this.domNode;
      })
      .sort(function(a, b) {
        if (a === b) return 0;
        if (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) {
          return 1;
        }
        return -1;
      })
      .forEach(node => {
        let refBlot: Blot | null = null;
        if (node.nextSibling != null) {
          refBlot = Registry.find(node.nextSibling);
        }
        let blot = makeBlot(node);
        if (blot.next != refBlot || blot.next == null) {
          if (blot.parent != null) {
            blot.parent.removeChild(this);
          }
          this.insertBefore(blot, refBlot || undefined);
        }
      });
  }

  static debug (label: String, ...values: any[]) {
    console.trace(`%c[${this.blotName}(ContainerBlot) ${label}]`, 'color:dodgerblue', ...values)
  }

  debug (label: String, ...values: any[]) {
    this.statics.debug(label, ...values)
  }
}

function makeBlot(node: Node): Blot {
  let blot = Registry.find(node);
  if (blot == null) {
    try {
      blot = Registry.create(node);
    } catch (e) {
      blot = Registry.create(Registry.Scope.INLINE);
      [].slice.call(node.childNodes).forEach(function(child: Node) {
        // @ts-ignore
        blot.domNode.appendChild(child);
      });
      if (node.parentNode) {
        node.parentNode.replaceChild(blot.domNode, node);
      }
      blot.attach();
    }
  }
  return blot;
}

export default ContainerBlot;
