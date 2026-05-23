# Security Policy

## Supported Versions

The latest released minor version receives security fixes. See [CHANGELOG.md](./CHANGELOG.md) for releases.

| Version | Supported |
|---------|-----------|
| 2026.05.x | Yes |
| < 2026.05 | No  |

## Reporting a Vulnerability

Please report security issues privately to **office@krletron.xyz**.

Do **not** open a public GitHub issue for suspected vulnerabilities.

Include:

- Component affected and version
- Steps to reproduce, or proof-of-concept
- Impact assessment (XSS, CSRF, data exposure, etc.)
- Suggested remediation if you have one

## Disclosure Timeline

- **48 hours** — acknowledgement of report
- **7 days** — initial assessment and severity classification
- **30 days** — fix released or mitigation provided for critical/high severity
- **90 days** — public disclosure after fix is available

We will credit you in the release notes unless you prefer to remain anonymous.

## Scope

In scope:

- forge-frontend (this repository) — React UI, build artifacts
- Cross-site scripting, injection through user-controlled data rendered in the UI
- Client-side authentication and session handling

Out of scope:

- Issues in third-party npm dependencies (please report upstream)
- Self-inflicted misconfiguration of the served bundle
