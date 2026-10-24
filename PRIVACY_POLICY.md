# Privacy Policy

**Project:** Instagram Account Cleaner  
**Effective date:** October 24, 2026

This Privacy Policy explains how the Instagram Account Cleaner browser extension handles information when you install and use it.

## 1. Summary

The extension is designed to process information locally in your browser. It does not include a developer-operated backend, analytics service, advertising SDK, or feature intended to upload your target username list to the developer or another external server.

The extension interacts with Instagram pages only to support the features you choose to use. Instagram is a third-party service and is not operated by the project maintainer.

## 2. Information the extension processes

Depending on how you use it, the extension may process:

- Usernames you import from a local TXT file.
- Follower and following usernames extracted from Instagram HTML files that you select in the dashboard.
- Account names and visible interface text on Instagram pages needed to match selected usernames and operate the chosen workflow.
- Local workflow state, selected accounts, and progress information needed to operate the extension.

Do not import information you do not have permission to use. The extension does not need your Instagram password, and you should never provide your password to this project.

## 3. Where information is stored

The extension uses the browser's `chrome.storage.local` facility to store target usernames and workflow state on your device. Files you select in the dashboard are read by the browser for local processing. The project does not intentionally transmit this information to a developer-controlled server.

If you sync, back up, inspect, or otherwise expose your browser profile using other software or services, those services may handle browser data under their own terms. Removing the extension or clearing its stored data may remove locally stored extension information, but should not be treated as a secure deletion guarantee for every browser backup or system copy.

## 4. Network requests and third parties

The extension requires access to `https://www.instagram.com/*` to run its content script on Instagram and uses the browser tabs permission to open or focus Instagram tabs. It does not include a project server endpoint for collecting usernames.

When you use Instagram, your browser communicates with Instagram according to Instagram's own implementation and policies. This policy does not cover information Instagram collects, or the behavior of other extensions installed in your browser.

## 5. Sharing and sale

The project maintainer does not sell personal information and the extension is not designed to share imported lists or workflow data with the maintainer or data brokers. The project may be distributed publicly through GitHub, but user-specific target lists should remain in local files and must not be committed to a public repository.

## 6. Security

No browser extension can guarantee absolute security. Keep your browser updated, install the extension only from a source you trust, review code changes before loading unpacked builds, and do not include account credentials, cookies, session tokens, or private username lists in bug reports or public issues.

## 7. Children's privacy

This project is not designed specifically for children and does not knowingly collect children's personal information through a developer-operated service.

## 8. Changes to this policy

This policy may be updated when the extension's functionality or data handling changes. The effective date at the top will be revised when material changes are made. Review this file before installing a new version.

## 9. Contact

For project-related questions or privacy concerns, open an issue in the [Afgadev GitHub repository](https://github.com/afrzxd) without posting passwords, cookies, session tokens, or private account lists. This GitHub link is a project contact route, not a promise of a particular response time.
