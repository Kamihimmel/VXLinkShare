# Contributing

Thanks for helping improve VX Link Helper.

## Working principles

- Keep the extension privacy-first: no telemetry, analytics SDKs, remote code, or backend link processing.
- Keep browser permissions narrow and site-specific.
- Keep changes dependency-free unless maintainers explicitly approve otherwise.
- Update user-facing text in every supported language when copy changes.
- Prefer small pull requests with a clear summary and verification notes.

## Development workflow

1. Create a topic branch from `main`.
2. Make the smallest change that solves the issue.
3. Run the relevant checks listed in the repository documentation.
4. Open a pull request with:
   - what changed,
   - how it was verified,
   - any privacy, permission, or compatibility risk.

## Privacy and analytics

Do not add runtime analytics or telemetry to the extension. Store dashboards may provide aggregated installation or usage statistics; the extension itself should not report user activity.

## License

By contributing, you agree that your contributions are licensed under the Mozilla Public License 2.0.
