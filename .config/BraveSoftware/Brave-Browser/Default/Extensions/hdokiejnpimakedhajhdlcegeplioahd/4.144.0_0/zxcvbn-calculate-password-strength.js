runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (
    message.target !== 'offscreen-zxcvbn-doc' ||
    message.type !== 'calculate-password-strength'
  ) {
    return
  }

  const score = challengegetstrength(
    message.data.username,
    message.data.password,
    message.data.passwordStrengthHardeningEnabled
  )

  sendResponse(score)
})
