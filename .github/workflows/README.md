# Bismuth CI/CD Workflows

## Channels

| Workflow    | Channel          | Trigger         | Artifact Prefix |
| ----------- | ---------------- | --------------- | --------------- |
| alpha.yml   | Alpha (unstable) | Push to main    | alpha-          |
| beta.yml    | Beta (RC)        | Tag v*-rc.*     | beta-           |
| release.yml | Release (stable) | Manual dispatch | release-        |

## Key Rotation Runbook: TAURI_SIGNING_PRIVATE_KEY

1. Generate a new Ed25519 keypair: `openssl genpkey -algorithm ed25519 -out private.key`
2. Extract the public key: `openssl pkey -in private.key -pubout -out public.key`
3. Update GitHub Actions secret: Settings -> Secrets -> TAURI_SIGNING_PRIVATE_KEY -> paste contents of private.key
4. Update TAURI_SIGNING_PRIVATE_KEY_PASSWORD secret if passphrase was changed
5. Update the Tauri updater pubkey in all tauri.conf.*.json files with the new public key
6. Delete private.key from local disk after rotation
7. Test all three channel builds to confirm signing works

## Security Notes

- TAURI_SIGNING_PRIVATE_KEY is a repository-level encrypted secret, never visible in logs
- Never commit private keys to the repository
- Rotate keys annually or immediately upon any suspected compromise
