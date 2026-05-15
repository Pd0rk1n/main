



















var iputil = {
  localExtras: null,

  isLocalURI: function(uri, all = false, neverResolve = false) {
    var host;
    try {
      host = new URL(uri).hostname;
    } catch(e) {
      return false;
    }
    return iputil.isLocalHost(host, all, neverResolve);
  },

  _localDomainRx: /\.local$/i,
  isLocalHost: function (host, all = false, neverResolve = false) {
    if (!host) {
      return false;
    }
    if (host === "localhost" || iputil._localDomainRx.test(host)) return true;
    if (iputil.isIP(host)) {
      return iputil.isLocalIP(host);
    }

    if (!DNS.supported || all && DNS.cache.isExt(host) || neverResolve) return false;

    return DNS.resolve(host).then(res => {
      if (res.addresses) {
        let ret = res.addresses[all ? 'every' : 'some'](iputil.isLocalIP);
        if (!ret) DNS.cache.setExt(host, true);
        return ret;
      }
      else {


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
    delete iputil._localIPMatcher;
    return iputil._localIPMatcher = new AddressMatcherWithDNS('0. 127. 10. 169.254.0.0/16 172.16.0.0/12 192.168.0.0/16 255.255.255.255');
  },
  isLocalIP: function(addr) {





    return iputil._localIP6Rx.test(addr) ||
      iputil._localIPMatcher.testIP(addr = iputil.ip6to4(addr)) ||
      iputil.localExtras?.testIP(addr) ||
      typeof WAN === "object" && 
      WAN.ipMatcher?.testIP(addr);
  },
  _ip6to4Rx: /^2002:([A-F0-9]{2})([A-F0-9]{2}):([A-F0-9]{2})([A-F0-9]{2})|:(?:\d+\.){3}\d+$/i,
  ip6to4: function(addr) {
    let m = addr.match(iputil._ip6to4Rx);
    return m ? (m[1]
          ? m.slice(1).map((h) => parseInt(h, 16)).join(".")
          : m[0].substring(1)
       )
      : addr;
  },
  _ipRx: /^(?:0\.|[1-9]\d{0,2}\.){3}(?:0|[1-9]\d{0,2})$|:.*:/i, 
  _ipRx_permissive: /^(?:(?:\d+|0x[a-f0-9]+)\.){0,3}(?:\d+|0x[a-f0-9]+)$|:.*:/i,
  isIP: function(host) { return iputil._ipRx.test(host); },
};
