



















'use strict';
class DocumentCSP {
  constructor(document) {
    this.document = document;
    this.builder = new CapsCSP();
  }

  apply(capabilities, embedding = CSP.isEmbedType(this.document.contentType)) {
    const { document } = this;
    const csp = this.builder;
    const blocker = csp.buildFromCapabilities(capabilities, embedding);
    if (!blocker) return null;

    const createHTMLElement =
      tagName => document.createElementNS("http://www.w3.org/1999/xhtml", tagName);

    const header = csp.asHeader(blocker);

    const meta = createHTMLElement("meta");
    meta.setAttribute("http-equiv", header.name);
    meta.setAttribute("content", header.value);

    let root = document.documentElement;
    try {
      if (!(document instanceof HTMLDocument)) {
        if (!(document instanceof XMLDocument)) {
          return null; 
        }




        let htmlDoc = document.implementation.createHTMLDocument();
        let htmlRoot = document.importNode(htmlDoc.documentElement, true);
        document.replaceChild(htmlRoot, root);
      }

      const { head } = document;
      const parent = head ||
        document.documentElement.insertBefore(createHTMLElement("head"),
                            document.documentElement.firstElementChild);


      parent.insertBefore(meta, parent.firstElementChild);

      meta.remove();
      if (!head) parent.remove();
      if (document.documentElement !== root)
      {
        document.replaceChild(root, document.documentElement);
      }
    } catch (e) {
      error(e, "Error inserting CSP %s in %s", document.URL, header?.value);
      return null;
    }
    return CSP.normalize(header.value);
  }
}
