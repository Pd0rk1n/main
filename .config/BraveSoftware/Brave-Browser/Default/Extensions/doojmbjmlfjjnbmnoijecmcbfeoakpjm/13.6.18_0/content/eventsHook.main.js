



















'use strict';

if (location.protocol == "file:") {
  const {exportFunction, patchWindow} = Worlds.main;

  function modifyWindow(scope, {port, xray}) {
    const { window } = xray;
    const { Proxy, document, Node } = window;

    const { Reflect } = globalThis;

    const { addEventListener } = window.EventTarget.prototype;
    const nodeProps = {};
    for (const prop of ["ownerDocument", "parentNode", "nextSibling"]) {
      nodeProps[prop] = xray.getSafeDescriptor(Node.prototype, prop, "get").get;
    }
    for (const method of ["insertBefore", "removeChild"]) {
      nodeProps[method] = Node.prototype[method];
    }
    const adoptNode = document.adoptNode;
    const getDocumentElement = xray.getSafeDescriptor(Document.prototype, "documentElement", "get").get;

    const watchList = new WeakSet();

    const NO_ARGS = [];
    const call = (func, obj, ...args) => Reflect.apply(func, obj, args || NO_ARGS);

    const watch = watching => {
      if (watching instanceof Node && !watchList.has(watching)) {
        const ownerDocument =  call(nodeProps.ownerDocument, watching);
        const crossDoc = ownerDocument != document;
        const parentNode = call(nodeProps.parentNode, watching);

        if (!crossDoc && parentNode) {

          return;
        }

        if (xray.enabled) {
          port.postMessage({watching});
          watchList.add(watching);
          return;
        }




        const nextSibling = call(nodeProps.nextSibling, watching);
        if (crossDoc) {
          call(adoptNode, document, watching);
        }
        const documentElement = call(getDocumentElement, document);
        call(nodeProps.insertBefore, documentElement, watching, null);
        call(nodeProps.removeChild, documentElement, watching);
        if (crossDoc) {

          call(adoptNode, ownerDocument, watching);
          if (parentNode) {
            call(nodeProps.insertBefore, ownerDocument,  watching, nextSibling);
          }
        }
      }
    }

    exportFunction(function(...args) {
      watch(this);
      return addEventListener.call(this, ...args);
    }, EventTarget.prototype, {defineAs: "addEventListener"});


    const nodeCreators = {
      "Document":  ["createElement", "createElementNS", "createDocumentFragment"],
      "Node": ["cloneNode"],
    }
    for (const clazz in nodeCreators) {
      const proto = window[clazz].prototype;
      for (const m of nodeCreators[clazz]) {
        const method = proto[m];
        exportFunction(function (...args) {
          const node = method.call(this, ...args);
          watch(node);
          return node;
        }, proto, { defineAs: m });
      }
    }



    const construct = Reflect.construct.bind(Reflect);
    const constructorHandler = {
      construct(target, args) {
        const i = construct(target, args);
        watch(i);
        return i;
      }
    };
    xray.proxify("Image", constructorHandler);
    xray.proxify("Audio", constructorHandler);
  }

  Worlds.connect("eventsHook.main", {
    onConnect: port => {
      patchWindow(modifyWindow, {port});
    },
    onMessage: m => {
    },
  });
}
