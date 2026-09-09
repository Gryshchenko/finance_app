# Changesets

Every change that a user could notice gets a changeset: a small markdown file naming the
packages it touches, the size of the bump, and one line describing it. `changeset version`
later turns the accumulated files into version bumps and CHANGELOG entries.

```bash
pnpm changeset          # describe the change you just made
pnpm changeset:version  # apply every pending changeset, write the changelogs
pnpm changeset:status    # what is still unreleased
```

Nothing here is published to npm - `access` is `restricted` and all three packages are
private. The bumps exist for two other reasons:

- `@tenpercent/app` - its `version` is what the App Store and Play show as the release
  number. `app.config.ts` reads it out of `packages/app/package.json`, so bumping the
  package is what bumps the store version. The build number underneath it is separate:
  EAS keeps it remotely and increments it per build (`appVersionSource: "remote"`).
- `@tenpercent/server` / `@tenpercent/shared` - the CHANGELOG is the record of what went
  into a deployed image.

A changeset that only touches internals ("moved a helper") is noise; skip it. Read
<https://github.com/changesets/changesets> for the file format.
