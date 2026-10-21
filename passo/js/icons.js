/* Passo a Passo — line icons (24×24, stroke = currentColor). */
(function (root) {
  'use strict';
  const P = {
    play: '<path d="M7 4.5v15l13-7.5z" fill="currentColor" stroke="none"/>',
    pause: '<rect x="6" y="4.5" width="4" height="15" rx="1.2" fill="currentColor" stroke="none"/><rect x="14" y="4.5" width="4" height="15" rx="1.2" fill="currentColor" stroke="none"/>',
    next: '<path d="M5 5l9 7-9 7z" fill="currentColor" stroke="none"/><path d="M18 5v14"/>',
    prev: '<path d="M19 5l-9 7 9 7z" fill="currentColor" stroke="none"/><path d="M6 5v14"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.4M12 18.8v2.4M4.2 7.5l2.1 1.2M17.7 15.3l2.1 1.2M4.2 16.5l2.1-1.2M17.7 8.7l2.1-1.2"/><circle cx="12" cy="12" r="7"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21M8.5 21h7"/>',
    speak: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11"/>',
    bolt: '<path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 01-8 0z"/><path d="M8 6H5a3 3 0 003 4M16 6h3a3 3 0 01-3 4M12 13v4M8.5 20.5h7M9.5 17h5"/>',
    flame: '<path d="M12 21.5c-3.9 0-6.5-2.6-6.5-6.2 0-3.4 2.7-5.3 3.6-8.8 2.2 1.4 3 3.3 3 5 1-.6 1.8-1.8 2-3.2 2 1.7 4.4 4.1 4.4 7.1 0 3.5-2.6 6.1-6.5 6.1z"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5z"/><path d="M4 20.5A2.5 2.5 0 016.5 23H20M8 7.5h8"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/>',
    brain: '<path d="M9 4a3 3 0 00-3 3 3 3 0 00-2 5.2A3 3 0 006 18a3 3 0 006 .5V5.5A2 2 0 009 4zM15 4a3 3 0 013 3 3 3 0 012 5.2A3 3 0 0118 18a3 3 0 01-6 .5"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z"/>',
    timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 2M9.5 2.5h5M19 6l1.5-1.5"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    radar: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12l6-6"/>',
    plane: '<path d="M21 4L3 11l7 2.5L12.5 21z"/><path d="M10 13.5L21 4"/>',
    heart: '<path d="M12 20.5S3.5 15.5 3.5 9.4A4.4 4.4 0 0112 7a4.4 4.4 0 018.5 2.4c0 6.1-8.5 11.1-8.5 11.1z" fill="currentColor" stroke="none"/>',
    sos: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="M5.6 5.6l3.9 3.9M14.5 14.5l3.9 3.9M18.4 5.6l-3.9 3.9M9.5 14.5l-3.9 3.9"/>',
    gauge: '<path d="M4 17a8.5 8.5 0 1116 0"/><path d="M12 14l4-5"/><circle cx="12" cy="14.5" r="1.4" fill="currentColor"/>',
    check: '<path d="M4.5 12.5l5 5 10-11"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.8-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.8z" fill="currentColor" stroke="none"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    replay: '<path d="M4 12a8 8 0 108-8H8"/><path d="M10.5 1.5L7.5 4l3 2.5"/>',
  };
  function icon(name, cls) {
    return `<svg class="ico ${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;
  }
  root.PassoIcon = icon;
})(typeof self !== 'undefined' ? self : this);
