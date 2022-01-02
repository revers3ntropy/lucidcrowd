// TS
import './types.d.ts';

// LESS
import './main.less';

// ALPINE
// alpine types. Alpine object is already a property of window
import Alpine from 'alpinejs';
import 'alpinejs';

Alpine.store('theme', {
    init: function () {
        localStorage.theme ??= 'dark';
    },
    value: localStorage.theme,
    toggle: function () {
        localStorage.theme = this.value === 'dark' ? 'light' : 'dark';
        this.value = localStorage.theme;
    }
});

Alpine.start();