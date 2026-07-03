



















"use strict";

class CSP {
  static isMediaBlocker(csp) {
    return /(?:^|[\s;])media-src (?:'none'|http:(?: file:)?)(?:;|$)/.test(csp);
  }
  static normalize(csp) {
    return csp.replace(/\s*;\s*/g, ';').replace(/\b(script-src\s+'none'.*?;)(?:script-src-\w+\s+'none';)+/, '$1');
  }

  build(...directives) {
    return directives.join(';');
  }

  buildBlocker(...types) {
    return this.build(...(types.map(t => `${t.name || `${t.type || t}-src`} ${t.value || "'none'"}`)));
  }

  static blocks(header, type) {
    return `;${header};`.includes(`;${type}-src 'none';`)
  }

  asHeader(value) {
    return {name: CSP.headerName, value};
  }
}

CSP.isEmbedType = type => /\b(?:application|video|audio|image\/svg)\b/.test(type) && !/^application\/(?:(?:xhtml\+)?xml|javascript)$/.test(type);
CSP.headerName = "content-security-policy";
CSP.patchDataURI = (uri, blocker) => {
  let parts = /^data:(?:[^,;]*ml|unknown-content-type)(;[^,]*)?,/i.exec(uri);
  if (!(blocker && parts)) {

    return uri;
  }
  if (parts[1]) {

    return "data:";
  }

  let patch = parts[0] + encodeURIComponent(
    `<meta http-equiv="${CSP.headerName}" content="${blocker}"/>`);
  return uri.startsWith(patch) ? uri : patch + uri.substring(parts[0].length);
}
