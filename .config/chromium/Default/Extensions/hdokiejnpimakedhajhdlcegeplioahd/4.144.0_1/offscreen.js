// Copyright 2023 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Once the message has been posted from the service worker, checks are made to
// confirm the message type and target before proceeding. This is so that the
// module can easily be adapted into existing workflows where secondary uses for
// the document (or alternate offscreen documents) might be implemented.

// Registering this listener when the script is first executed ensures that the
// offscreen document will be able to receive messages when the promise returned
// by `offscreen.createDocument()` resolves.

const runtime =
  typeof browser !== 'undefined' ? browser.runtime : chrome.runtime

runtime.onMessage.addListener(handleMessages)

// This function performs basic filtering and error checking on messages before
// dispatching the
// message to a more specific message handler.
async function handleMessages(message, sender, sendResponse) {
  // Return early if this message isn't meant for the offscreen document.
  if (message.target !== 'offscreen-doc') {
    return
  }

  // Dispatch the message to an appropriate handler.
  switch (message.type) {
    case 'copy-data-to-clipboard': {
      handleClipboardWrite(message.data)
      break
    }
    case 'set-localstorage-items': {
      setLocalStorageItems(message.data)
      break
    }
    case 'get-localstorage-items': {
      sendResponse(getLocalStorageItems(message.data))
      break
    }
    case 'download-offscreen-csv': {
      downloadForegroundCsv(message.data)
      break
    }
    default:
      console.warn(`Unexpected message type received: '${message.type}'.`)
  }
}

// We use a <textarea> element for two main reasons:
//  1. preserve the formatting of multiline text,
//  2. select the node's content using this element's `.select()` method.
const textEl = document.querySelector('#text')

// Use the offscreen document's `document` interface to write a new value to the
// system clipboard.
//
// At the time this demo was created (Jan 2023) the `navigator.clipboard` API
// requires that the window is focused, but offscreen documents cannot be
// focused. As such, we have to fall back to `document.execCommand()`.
async function handleClipboardWrite(data) {
  // Error if we received the wrong kind of data.
  if (typeof data !== 'string') {
    throw new TypeError(
      `Value provided must be a 'string', got '${typeof data}'.`
    )
  }

  // `document.execCommand('copy')` works against the user's selection in a web
  // page. As such, we must insert the string we want to copy to the web page
  // and to select that content in the page before calling `execCommand()`.
  textEl.value = data
  textEl.select()
  document.execCommand('copy')
}

function setLocalStorageItems(data) {
  for (const key in data) {
    localStorage.setItem(key, data[key])
  }
}

function getLocalStorageItems(keys) {
  const items = {}
  for (const key of keys) {
    items[key] = localStorage.getItem(key)
  }
  return items
}

function downloadForegroundCsv({ data, name }) {
  try {
    const blob = new Blob([data])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = name
    link.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error(e)
  }
}
