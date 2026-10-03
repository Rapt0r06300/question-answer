function calculateAge(dobValue, nowValue) {
  const dob = new Date(dobValue);
  const now = new Date(nowValue ?? Date.now());
  if (Number.isNaN(dob.getTime()) || Number.isNaN(now.getTime())) return null;
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - dob.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < dob.getUTCDate())) age -= 1;
  return age;
}

export function checkConsistency(profile, candidate = {}) {
  if (candidate.kind === 'screenout') return { ok: true, reasons: [] };
  const reasons = [];
  const current = profile?.fields?.[candidate.key];
  if (current?.locked && candidate.value !== undefined && !Object.is(current.value, candidate.value)) reasons.push(`locked fact ${candidate.key} cannot be changed`);
  const dobEntry = profile?.fields?.['demographics.dob'];
  const ageEntry = profile?.fields?.['demographics.age'];
  const now = candidate.now ?? Date.now();
  const effectiveDob = candidate.key === 'demographics.dob' ? candidate.value : dobEntry?.value;
  const effectiveAge = candidate.key === 'demographics.age' ? candidate.value : ageEntry?.value;
  if (effectiveDob != null && effectiveAge != null) {
    const calculated = calculateAge(effectiveDob, now);
    if (calculated != null && Number(effectiveAge) !== calculated) reasons.push('age does not match date of birth');
  }
  return { ok: reasons.length === 0, reasons };
}
