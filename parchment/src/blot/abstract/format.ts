import Attributor from '../../attributor/attributor';
import AttributorStore from '../../attributor/store';
import { Blot, Parent, Formattable } from './blot';
import ContainerBlot from './container';
import ShadowBlot from './shadow';
import * as Registry from '../../registry';

class FormatBlot extends ContainerBlot implements Formattable {
  protected attributes: AttributorStore;

  static formats(domNode: HTMLElement): any {
    let result
    if (typeof this.tagName === 'string') {
      result = true;
    } else if (Array.isArray(this.tagName)) {
      result = domNode.tagName.toLowerCase();
    }
    result = undefined;
    this.debug('.formats', domNode, result)
    return result
  }

  constructor(domNode: Node) {
    super(domNode);
    this.debug('#constructor', domNode)
    this.attributes = new AttributorStore(this.domNode);
  }

  format(name: string, value: any): void {
    this.debug('#format', name, value)
    let format = Registry.query(name);
    if (format instanceof Attributor) {
      this.attributes.attribute(format, value);
    } else if (value) {
      if (format != null && (name !== this.statics.blotName || this.formats()[name] !== value)) {
        this.replaceWith(name, value);
      }
    }
  }

  formats(): { [index: string]: any } {
    let formats = this.attributes.values();
    let format = this.statics.formats(this.domNode);
    if (format != null) {
      formats[this.statics.blotName] = format;
    }
    this.debug('#formats', formats)
    return formats;
  }

  replaceWith(name: string | Blot, value?: any): Blot {
    this.debug('#replaceWith', name, value)
    let replacement = <FormatBlot>super.replaceWith(name, value);
    this.attributes.copy(replacement);
    return replacement;
  }

  update(mutations: MutationRecord[], context: { [key: string]: any }): void {
    this.debug('#update', mutations, context)
    super.update(mutations, context);
    if (
      mutations.some(mutation => {
        return mutation.target === this.domNode && mutation.type === 'attributes';
      })
    ) {
      this.attributes.build();
    }
  }

  wrap(name: string | Parent, value?: any): Parent {
    this.debug('#wrap', name, value)
    let wrapper = super.wrap(name, value);
    if (wrapper instanceof FormatBlot && wrapper.statics.scope === this.statics.scope) {
      this.attributes.move(wrapper);
    }
    return wrapper;
  }

  //static debug (label: String, ...values: any[]) {
  //  console.trace(`%c[${this.blotName}(FormatBlot) ${label}]`, 'color:teal', ...values)
  //}

  //debug (label: String, ...values: any[]) {
  //  this.statics.debug(label, ...values)
  //}
}

export default FormatBlot;
