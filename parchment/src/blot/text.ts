import { Blot, Leaf } from './abstract/blot';
import LeafBlot from './abstract/leaf';
import * as Registry from '../registry';

class TextBlot extends LeafBlot implements Leaf {
  static blotName = 'text';
  static scope = Registry.Scope.INLINE_BLOT;

  public domNode!: Text;
  protected text: string;

  static create(value: string): Text {
    //console.trace('%cTextBlot.create() ***************************************', 'color:red', value)
    return document.createTextNode(value);
  }

  static value(domNode: Text): string {
    let text = domNode.data;
    // @ts-ignore
    if (text['normalize']) text = text['normalize']();
    //console.trace('%cTextBlot.value() ***************************************', 'color:red', text)
    return text;
  }

  constructor(node: Node) {
    //console.trace('%cTextBlot() ***************************************', 'color:red')
    super(node);
    this.text = this.statics.value(this.domNode);
  }

  deleteAt(index: number, length: number): void {
    //console.trace('%cTextBlot#deleteAt() ***************************************', 'color:red', index, length)
    this.domNode.data = this.text = this.text.slice(0, index) + this.text.slice(index + length);
  }

  index(node: Node, offset: number): number {
    //console.trace('%cTextBlot#index() ***************************************', 'color:red', node, offset)
    if (this.domNode === node) {
      return offset;
    }
    return -1;
  }

  insertAt(index: number, value: string, def?: any): void {
    //console.trace('%cTextBlot#insertAt() ***************************************', 'color:red', index, value, def)
    if (def == null) {
      this.text = this.text.slice(0, index) + value + this.text.slice(index);
      this.domNode.data = this.text;
    } else {
      super.insertAt(index, value, def);
    }
  }

  length(): number {
    //console.trace('%cTextBlot#length() ***************************************', 'color:red', this.text.length)
    return this.text.length;
  }

  optimize(context: { [key: string]: any }): void {
    //console.trace('%cTextBlot#optimize() ***************************************', 'color:red')
    super.optimize(context);
    this.text = this.statics.value(this.domNode);
    if (this.text.length === 0) {
      this.remove();
    } else if (this.next instanceof TextBlot && this.next.prev === this) {
      this.insertAt(this.length(), (<TextBlot>this.next).value());
      this.next.remove();
    }
  }

  position(index: number, inclusive: boolean = false): [Node, number] {
    //console.trace('%cTextBlot#position() ***************************************', 'color:red', index, inclusive)
    return [this.domNode, index];
  }

  split(index: number, force: boolean = false): Blot {
    //console.trace('%cTextBlot#split() ***************************************', 'color:red', index, force)
    if (!force) {
      if (index === 0) return this;
      if (index === this.length()) return this.next;
    }
    let after = Registry.create(this.domNode.splitText(index));
    this.parent.insertBefore(after, this.next);
    this.text = this.statics.value(this.domNode);
    return after;
  }

  update(mutations: MutationRecord[], context: { [key: string]: any }): void {
    //console.trace('%cTextBlot#update() ***************************************', 'color:red', mutations, context)
    if (
      mutations.some(mutation => {
        return mutation.type === 'characterData' && mutation.target === this.domNode;
      })
    ) {
      this.text = this.statics.value(this.domNode);
    }
  }

  value(): string {
    //console.trace('%cTextBlot#value() ***************************************', 'color:red', this.text)
    return this.text;
  }
}

export default TextBlot;
