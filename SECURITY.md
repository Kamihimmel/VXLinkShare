# Security Policy

## Supported project

Security reports for VX Link Helper and its landing site are welcome.

## Reporting a vulnerability

Please report security issues privately to the maintainers instead of opening a public issue first. If you do not already have a private contact path, open a GitHub security advisory for the repository when available.

Include:

- affected browser or page,
- reproduction steps,
- expected and actual behavior,
- whether clipboard, permissions, injected DOM, or link rewriting is involved.

## Security and privacy boundaries

VX Link Helper is designed to run locally in the browser. Security-sensitive changes should preserve these boundaries:

- no telemetry or behavioral analytics in the extension,
- no backend link processing,
- no remote code loading or `eval`,
- no broad host permissions such as `<all_urls>` unless maintainers explicitly approve a major scope change,
- no collection of clipboard contents, browsing history, or cleaned links.

Store-provided aggregate dashboards may show installation or usage statistics, but the extension should not actively transmit user activity.
