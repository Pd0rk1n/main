;(function () {
  function loadCredentialLib() {
    const script = document.createElement('script')
    const api = typeof chrome !== 'undefined' ? chrome : browser
    script.src = api.runtime.getURL('credentials-library.js')
    script.defer = true //Ensure execution after HTML parsing

    script.onload = function () {
      script.remove()
    }

    document.head.appendChild(script)
  }
  window.addEventListener('load', loadCredentialLib)
})()
