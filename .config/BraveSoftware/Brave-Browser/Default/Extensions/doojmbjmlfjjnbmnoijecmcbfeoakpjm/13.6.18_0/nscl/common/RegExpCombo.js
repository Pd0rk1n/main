



















"use strict";





RegExp.combo = (...regExps) => {
  const flags = new Set();
  const parts = [];
  for (let rx of regExps) {
    if (rx instanceof RegExp) {
      parts.push(rx.source);
      flags.add(rx.flags);
    } else {
      parts.push(rx);
    }
  }
  return new RegExp(parts.join(''), [...flags].join(''));
}