



















globalThis.iputil = {
  localExtras: null,

  isLocalURI(uri, all = false, neverResolve = false) {
    var host;
    try {
      host = new URL(uri).hostname;
    } catch(e) {
      return false;
    }
    return this.isLocalHost(host, all, neverResolve);
  },

  _localDomainRx: /\.local$/i,
  isLocalHost(host, all = false, neverResolve = false) {
    if (!host) {
      return false;
    }
    if (host === "localhost" || this._localDomainRx.test(host)) return true;
    if (this.isIP(host)) {
      return this.isLocalIP(host);
    }

    if (!DNS.supported || all && DNS.cache.isExt(host) || neverResolve) return false;

    return DNS.resolve(host).then(res => {
      if (res.addresses) {
        let ret = false;
        for (let addr of res.addresses) {
          ret = this.isLocalIP(addr);
          if (all) {
            if (ret) {
              continue;
            }
            break;
          } else if (ret) {
            break;
          }
        }
        if (!ret) DNS.cache.setExt(host, true);
        return ret;
      } else {


        console.log(`No DNS addresses for '${host}' ?`, res);
        return false;
      }
    }, e => {
      if (e.message !== "NS_ERROR_UNKNOWN_PROXY_HOST") {
        console.error(e, host);
      }
      return false;
    });
  },

  _localIP6Rx: /^(?:::1?$|f(?:[cd]|e[c-f])[0-9a-f]*:)/i,
  get _localIPMatcher() {
    delete this._localIPMatcher;
    return this._localIPMatcher = new AddressMatcherWithDNS('0. 127. 10. 169.254.0.0/16 172.16.0.0/12 192.168.0.0/16 255.255.255.255');
  },
  isLocalIP(addr) {






    if (addr.startsWith("[") && addr.endsWith("]")) {
      addr = addr.slice(1, -1);
    }
    return this._localIP6Rx.test(addr) ||
      this._localIPMatcher.testIP(addr = this.ip6to4(addr)) ||
      this.localExtras?.testIP(addr) ||
      typeof WAN === "object" && 
      WAN.ipMatcher?.testIP(addr);
  },
  _ip6to4Rx: /^2002:([A-F0-9]{2})([A-F0-9]{2}):([A-F0-9]{2})([A-F0-9]{2})|:(?:\d+\.){3}\d+|^::ffff:([A-F0-9]+):([A-F0-9]+)$/i,
  ip6to4(addr) {
    const m = addr.match(this._ip6to4Rx);
    return m ?
      m[5] ?


        (dec32 => [
            (dec32 >>> 24) & 0xff,
            (dec32 >>> 16) & 0xff,
            (dec32 >>> 8) & 0xff,
            dec32 & 0xff
          ].join(".")
        )(parseInt(m[5], 16) << 16 | parseInt(m[6], 16))
      : (
        m[1]
        ? m.slice(1).map((h) => parseInt(h, 16)).join(".")
        : m[0].substring(1)
        )
      : addr;
  },
  _ipRx: /^(?:0\.|[1-9]\d{0,2}\.){3}(?:0|[1-9]\d{0,2})$|:.*:/i, 
  _ipRx_permissive: /^(?:(?:\d+|0x[a-f0-9]+)\.){0,3}(?:\d+|0x[a-f0-9]+)$|:.*:/i,
  isIP(host) { return this._ipRx.test(host); },
};
