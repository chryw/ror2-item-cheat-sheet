// Import definitions directly; Lucide's DOM helpers require syntax unsupported by webpack 4.
/* eslint-disable import/extensions */
import Search from 'lucide/dist/esm/icons/search.mjs';
import Menu from 'lucide/dist/esm/icons/menu.mjs';
import ChevronDown from 'lucide/dist/esm/icons/chevron-down.mjs';
import X from 'lucide/dist/esm/icons/x.mjs';
import ExternalLink from 'lucide/dist/esm/icons/external-link.mjs';
import RotateCcw from 'lucide/dist/esm/icons/rotate-ccw.mjs';
import Plus from 'lucide/dist/esm/icons/plus.mjs';
/* eslint-enable import/extensions */

const icons = {
  search: Search,
  menu: Menu,
  'chevron-down': ChevronDown,
  close: X,
  'external-link': ExternalLink,
  reset: RotateCcw,
  plus: Plus,
};

export default {
  name: 'AppIcon',
  functional: true,
  props: {
    name: { type: String, required: true },
  },
  render(h, { props, data }) {
    const nodes = icons[props.name];
    if (!nodes) throw new Error(`Unknown UI icon: ${props.name}`);
    return h('svg', {
      ...data,
      class: [data.class, 'app-icon'],
      attrs: {
        ...data.attrs,
        xmlns: 'http://www.w3.org/2000/svg',
        width: 24,
        height: 24,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': 1.75,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'aria-hidden': 'true',
        focusable: 'false',
      },
    }, nodes.map(([tag, attrs]) => h(tag, { attrs })));
  },
};
