import './main.less';

import './types.d.ts';
// alpine types. Alpine object is already a property of window
import Alpine from 'alpinejs';
window.Alpine = Alpine;

Alpine.start();

Alpine.store('theme', 'dark');