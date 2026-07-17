export function shouldApplyOnlineRevision(
  currentRevision: number,
  incomingRevision: number,
  recoveryRequired: boolean,
): boolean {
  if (incomingRevision > currentRevision) return true;
  return recoveryRequired && incomingRevision === currentRevision;
}
