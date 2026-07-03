



















'use strict';

XSS.Exceptions = (() => {

  var Exceptions = {

    async shouldIgnore(xssReq) {
      function logEx(...args) {
        debug("[XSS preprocessing] Ignoring %o", xssReq, ...args);
      }

      let {
        isCrossSite,
        srcObj,
        destObj,
        srcUrl,
        destUrl,
        srcOrigin,
        destOrigin,
        unescapedDest,
        isGet,
        isPost
      } = xssReq;


      if (!isCrossSite ||
          /^https:/.test(srcOrigin) && xssReq.srcDomain === xssReq.destDomain) {
        return true;
      }


      if (/^https:/.test(srcOrigin) && xssReq.srcDomain === xssReq.destDomain) {
        return true;
      }

      if (/^(?:chrome|resource|moz-extension|about):/.test(srcOrigin)) {

      }

      if (!srcOrigin && isGet) {
        if (/^https?:\/\/msdn\.microsoft\.com\/query\/[^<]+$/.test(unescapedDest)) {
          return true; 
        }
      }

      if (srcOrigin) { 

        if (/^about:(?!blank)/.test(srcOrigin))
          return true; 

        if (srcOrigin === "https://www.youtube.com" &&
          /^https:\/\/(?:plus\.googleapis|apis\.google)\.com\/[\w/]+\/widget\/render\/comments\?/.test(destUrl)) {
          logEx("YouTube comments exception");
          return true;
        }


        if (srcOrigin.startsWith("https://")) {

          if (destUrl.startsWith("https://app.uptain.de/static/index.html")) {
            return true;
          }
        }

        if (isPost) {

          if (/^https:\/\/(?:twitter|x).com$/.test(srcOrigin) &&
              /^https:\/\/.*\.(?:twitter|x)\.com$/.test(destOrigin)) {
            return true;
          }

          {
            let rx = /^https:\/\/(?:[a-z]+\.)?unionbank\.com$/;
            if (rx.test(srcOrigin) && rx.test(destOrigin)) {
              return true;
            }
          }

          if (/^https?:\/\/csr\.ebay\.(?:\w{2,3}|co\.uk)\/cse\/start\.jsf$/.test(srcUrl) &&
            /^https?:\/\/msa-lfn\.ebay\.(?:\w{2,3}|co\.uk)\/ws\/eBayISAPI\.dll\?[^<'"%]*$/.test(unescapedDest) &&
            destObj.protocol === srcObj.protocol) {
            logEx("Ebay exception");
            return true;
          }

          if (/^https:\/\/(?:cap\.securecode\.com|www\.securesuite\.net|(?:.*?\.)?firstdata\.com)$/.test(srcUrl)) {
            logEx("Verified by Visa exception");
            return true;
          }

          if (/^https?:\/\/mail\.lycos\.com\/lycos\/mail\/MailCompose\.lycos$/.test(srcUrl) &&
            /\.lycosmail\.lycos\.com$/.test(destOrigin)) {
            logEx("Lycos Mail exception");
            return true;
          }

          if (/^https:.*\.livejournal\.com$/.test(srcOrigin) &&
            /^https:\/\/www\.livejournal\.com\/talkpost_do\.bml$/.test(destUrl)) {
            logEx("Livejournal comments exception");
            return true;
          }

          if (/^https:\/\/(?:draft|www)\.blogger\.com\/template-editor\.g\?/.test(srcUrl) &&
            /^https:\/\/[\w\-]+\.blogspot\.com\/b\/preview\?/.test(destUrl)
          ) {
            logEx("blogspot.com template preview exception");
            return true;
          }
        }
      }
    },

    isBadException(host) {

      let m = host.match(/\bgoogle\.((?:[a-z]{1,3}\.)?[a-z]+)$/i);
      return m && tld.getPublicSuffix(host) != m[1];
    },

    partial(xssReq) {
      let {
        srcObj,
        destObj,
        srcUrl,
        destUrl,
        srcOrigin,
        destOrigin,
      } = xssReq;

      let skipParams, skipRx;
      if (/^https:\/\/www\.paypal\.com\/(?:[\w\-]+\/)?cgi-bin\/webscr\b/.test(destUrl)) {

        skipParams = ['encrypted'];
      } else if (/\.adnxs\.com$/.test(srcOrigin) && /\.adnxs\.com$/.test(destOrigin)) {
        skipParams = ['udj'];
      } else if (/^https?:\/\/www\.mendeley\.com\/import\/bookmarklet\/$/.test(destUrl)) {
        skipParams = ['html'];
      } else if (destObj.hash && /^https:/.test(srcOrigin) &&
        (/^https?:\/\/api\.facebook\.com\//.test(srcUrl) ||
          /^https:\/\/tbpl\.mozilla\.org\//.test(srcUrl) || 
          /^https:\/\/[^\/]+\.googleusercontent\.com\/gadgets\/ifr\?/.test(destUrl) 
        )) {
        skipRx = /#[^#]+$/; 
      } else if (/^https?:\/\/apps\.facebook\.com\//.test(srcUrl)) {
        skipRx = /&invite_url=javascript[^&]+/; 
      } else if (/^https?:\/\/l\.yimg\.com\/j\/static\/frame\?e=/.test(destUrl) &&
        /\.yahoo\.com$/.test(srcOrigin)) {
        skipParams = ['e'];
      } else if (/^https?:\/\/wpcomwidgets\.com\/\?/.test(destUrl)) {
        skipParams = ["_data"];
      } else if (/^https:\/\/docs\.google\.com\/picker\?/.test(destUrl)) {
        skipParams = ["nav", "pp"];
      } else if (/^https:\/\/.*[\?&]scope=/.test(destUrl)) {
        skipRx = /[\?&]scope=[+\w]+(?=&|$)/;
      }
      if (skipParams) {
        skipRx = new RegExp("(?:^|[&?])(?:" + skipParams.join('|') + ")=[^&]+", "g");
      }
      return {
        skipParams,
        skipRx
      };
    }

  };
  return Exceptions;
})();
