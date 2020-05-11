import { Formattable, Leaf } from './blot';
import ShadowBlot from './shadow';
import * as Registry from '../../registry';

class LeafBlot extends ShadowBlot implements Leaf {
  static scope = Registry.Scope.INLINE_BLOT;

  static value(domNode: Node): any {
    this.debug('.value()', domNode)
    return true;
  }

  index(node: Node, offset: number): number {
    this.debug('#index()', node, offset)
    if (
      this.domNode === node ||
      this.domNode.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_CONTAINED_BY
    ) {
      return Math.min(offset, 1);
    }
    return -1;
  }

  position(index: number, inclusive?: boolean): [Node, number] {
    this.debug('#position()', index, inclusive)
    let offset = [].indexOf.call(this.parent.domNode.childNodes, this.domNode);
    if (index > 0) offset += 1;
    return [this.parent.domNode, offset];
  }

  value(): any {
    this.debug('#value()')
    return { [this.statics.blotName]: this.statics.value(this.domNode) || true };
  }

  static debug (label: String, ...values: any[]) {
    // console.log(`%c[${this.blotName}(LeafBlot) ${label}]`, 'color:pink', ...values)
  }

  debug (label: String, ...values: any[]) {
    this.statics.debug(label, ...values)
  }
}

export default LeafBlot;
