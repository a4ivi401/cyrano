export function supportsSystemAudioLoopback(platform: NodeJS.Platform): boolean {
  return platform === 'darwin' || platform === 'win32';
}

export function supportsNativeSystemAudio(
  platform: NodeJS.Platform,
  systemVersion: string
): boolean {
  if (platform !== 'darwin') return false;
  const [major = 0, minor = 0] = systemVersion.split('.').map(Number);
  return major > 14 || (major === 14 && minor >= 2);
}
