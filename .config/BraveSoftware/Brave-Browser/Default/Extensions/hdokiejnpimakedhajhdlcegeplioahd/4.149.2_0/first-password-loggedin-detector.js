/**
 * Detection logic are designed based on this spike document
 * https://lastpass.atlassian.net/wiki/spaces/LP/pages/1650688066/Spike+Login+Detection+For+Top+Domains
 */
async function checkUserSession(matchingSiteDetection) {
  const isLoggedIn = await matchingSiteDetection()
  if (isLoggedIn) return true

  return new Promise((resolve) => {
    const observer = new MutationObserver(async () => {
      const isLoggedIn = await matchingSiteDetection()

      if (isLoggedIn) {
        observer.disconnect()
        resolve(true)
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })

    //timeout after 10 sec
    setTimeout(() => {
      observer.disconnect()
      resolve(false)
    }, 10_000)
  })
}

async function initDetection() {
  const currentPageOrigin = new URL(location.href).origin
  const getCookie = (name) => {
    return (
      document.cookie
        .split('; ')
        .find((row) => row.startsWith(name + '='))
        ?.split('=')[1] || null
    )
  }

  const microsoftDetection = () => {
    const userSettings = document.querySelector('[aria-label="Settings"]')
    const userAccount = document.querySelector(
      '[aria-label^="Account manager for "]'
    )

    return !!(userSettings && userAccount)
  }

  const sitesCheckers = {
    'google.com': async () => {
      const isLoggedInCookieSet = getCookie('SID')

      return !!isLoggedInCookieSet
    },
    'amazon.': async () => {
      const isLoggedInCookieSet = getCookie('x-main')
      const accountLink =
        document.querySelector('#nav-link-accountList')?.textContent || ''
      return (
        !!isLoggedInCookieSet &&
        !accountLink.toLocaleLowerCase().includes('sign in')
      )
    },
    'linkedin.com': async () => {
      try {
        const isLoggedIn = !!document.querySelector('img.global-nav__me-photo')

        if (isLoggedIn) return true

        const res = await fetch('https://www.linkedin.com/feed', {
          credentials: 'include',
        })
        const text = await res.text()
        const hasAvatar = !!document.querySelector('img.global-nav__me-photo')
        return (
          text.includes('feed-content') ||
          text.includes('Your Feed') ||
          hasAvatar
        )
      } catch {
        return false
      }
    },
    'facebook.com': async () => !!window?.require?.('DTSGInitData')?.token,
    'outlook.office.com': microsoftDetection,
    'outlook.live.com': microsoftDetection,
  }

  const matchingSiteDetection = Object.keys(sitesCheckers).find((site) =>
    currentPageOrigin.includes(site)
  )

  const isLoggedIn = await checkUserSession(
    sitesCheckers[matchingSiteDetection]
  )

  window.postMessage({
    type: 'USER_LOGGED_IN_ON_TOP_DOMAIN_DETECTION',
    isLoggedIn,
  })
}

//only allow for top level window (not iframes)
if (window.self === window.top) {
  initDetection()
}
