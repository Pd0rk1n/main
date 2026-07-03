



















'use strict';
{
  const _impl = "randomUUID" in crypto
    ? () => crypto.randomUUID()
    : () =>
      ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,
          c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4)
          .toString(16))
    ;


  const _fallback =  () =>
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });

  globalThis.uuid = () => {
    try {
      return _impl();
    } catch (e) {
      return _fallback();
    }
  }
}
