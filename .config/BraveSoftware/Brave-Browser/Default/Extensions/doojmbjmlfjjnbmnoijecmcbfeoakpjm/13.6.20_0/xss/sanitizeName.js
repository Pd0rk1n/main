



















ns.on("capabilities", event => {
  if (ns.allows("script")) {
    let dangerousRx = /[<"'\`(=:]/g;
    if (/[<"'\`(=:]/.test(window.name)) {
      console.log(`NoScript XSS filter sanitizing suspicious window.name "%s" on %s`, window.name, document.URL);
      window.name = window.name.replace(dangerousRx, '');
    }
  }
});
