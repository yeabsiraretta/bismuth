let saving = $state(false);

export function getSaving(): boolean {
  return saving;
}

export function setSaving(v: boolean): void {
  saving = v;
}
