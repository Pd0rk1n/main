/**
 * Dumb global function defined to avoid importing modules from zxcvbn-worker.js
 * as they are already included in offscreen-zxcvbn.html
 */
function importScripts() {
  // no op
}

const runtime =
  typeof browser !== 'undefined' ? browser.runtime : chrome.runtime

let listenerCallback = null

runtime.onMessage.addListener((message, sender, sendResponse) => {
  listenerCallback = sendResponse
  if (message.target !== 'offscreen-zxcvbn-doc') {
    return
  }

  switch (message.type) {
    case 'calculate-security-score': {
      listenerCallback = sendResponse
      onMessage({ ...message, data: JSON.parse(message.data) })
      return true
    }
    default:
      console.warn(`Unexpected message type received: '${message.type}'.`)
  }
})

function onMessage(e) {
  if (e.data.cmd === 'challengecomputescore_async') {
    handleSecurityScoreCalculation(e)
  }
}

function postMessage(data) {
  runtime.sendMessage({
    type: 'calculate-security-score-result',
    ...data,
  })

  if (listenerCallback) {
    listenerCallback(data)
    listenerCallback = null
  }
}
