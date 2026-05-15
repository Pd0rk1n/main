



















async function sha256(aString) {
  const bytes = new TextEncoder().encode(aString);
  const hashBytes = await crypto.subtle.digest("SHA-256", bytes);
  return new Uint8Array(hashBytes).reduce(
    (s, b) => s + b.toString(16).padStart(2, "0"), ""
  );
}