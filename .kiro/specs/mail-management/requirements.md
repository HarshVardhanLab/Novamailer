# Requirements Document

## Introduction

The Mail Management feature adds a full email client experience to NovaMailer — a full-stack email campaign manager built with FastAPI + Next.js 15. Users will be able to connect their personal or business email account via IMAP (credentials stored in-session only, never persisted to the database) and interact with it like a native mail client: browsing folders, reading emails, composing, replying, forwarding, flagging, moving, searching, and managing read/unread state. Outbound sending reuses the existing per-user SMTP configuration already stored in the database. The feature is accessible from a dedicated "Mail" section in the app sidebar.

---

## Glossary

- **Mail_Client**: The full-stack mail management UI and its supporting backend API routes.
- **IMAP_Session**: An in-memory, per-browser-session object holding the user's IMAP credentials (host, port, username, password). These credentials are NEVER written to the database.
- **IMAP_Service**: The backend service layer that opens and manages IMAP connections using Python's `imaplib` / `aioimaplib`.
- **Folder**: An IMAP mailbox (e.g. INBOX, Sent, Drafts, Junk, Trash, Archive) or a user-created custom mailbox returned by the IMAP LIST command.
- **Email**: A single RFC 822 message identified by its IMAP UID within a Folder.
- **Email_List**: The paginated list of Email summaries (UID, sender, subject, date, read-state, flag-state, preview snippet) for a given Folder.
- **Email_Detail**: The full content of a single Email including rendered HTML body, plain-text fallback, headers, and attachments metadata.
- **Compose_Window**: The UI panel used to draft and send a new email, reply, reply-all, or forward.
- **SMTP_Config**: The per-user outbound mail configuration already stored in the database (`SMTPConfig` model).
- **Search_Query**: A user-supplied string used to filter emails by sender, subject, or body via IMAP SEARCH.
- **Unread_Count**: The number of messages in a Folder that do not carry the `\Seen` IMAP flag.
- **Flag**: The IMAP `\Flagged` flag, surfaced in the UI as a star or flag icon.

---

## Requirements

### Requirement 1: IMAP Session Initialisation

**User Story:** As a user, I want to enter my IMAP credentials once per browser session so that I can access my email without re-entering them on every page visit.

#### Acceptance Criteria

1. WHEN the user navigates to the Mail section for the first time in a session, THE Mail_Client SHALL display a credential entry form requesting IMAP host, port, username, and password.
2. WHEN the user submits valid IMAP credentials, THE Mail_Client SHALL store the credentials in browser `sessionStorage` and NOT transmit them to any persistence layer.
3. WHEN the user submits IMAP credentials, THE Mail_Client SHALL attempt a test connection and display a success or failure message within 10 seconds.
4. IF the IMAP connection test fails, THEN THE Mail_Client SHALL display the server error message and allow the user to correct the credentials.
5. WHILE a valid IMAP_Session exists in `sessionStorage`, THE Mail_Client SHALL skip the credential form and proceed directly to the Folder sidebar.
6. WHEN the browser session ends (tab or window closed), THE Mail_Client SHALL discard all IMAP credentials from `sessionStorage`.
7. THE Mail_Client SHALL pre-populate the IMAP host and port fields using the same provider-preset mapping already used in the Settings page (e.g. `smtp.gmail.com` → `imap.gmail.com:993`).

---

### Requirement 2: Folder Sidebar

**User Story:** As a user, I want to see all my mailbox folders in a sidebar so that I can navigate between Inbox, Sent, Drafts, Flagged, Junk, Trash, Archive, and custom folders.

#### Acceptance Criteria

1. WHEN the IMAP_Session is established, THE Mail_Client SHALL fetch the full folder list from the IMAP server using the LIST command and display it in the sidebar.
2. THE Mail_Client SHALL display the following system folders at the top of the sidebar in this order: Inbox, Sent, Drafts, Flagged (virtual), Junk, Trash, Archive.
3. THE Mail_Client SHALL display any additional server-returned folders (custom folders) below the system folders, sorted alphabetically.
4. THE Mail_Client SHALL display the Unread_Count badge next to each folder that contains unread messages.
5. WHEN the user selects a folder, THE Mail_Client SHALL load the Email_List for that folder and highlight the selected folder in the sidebar.
6. IF a folder fetch fails, THEN THE Mail_Client SHALL display an inline error in the sidebar and provide a retry button.
7. THE Mail_Client SHALL refresh Unread_Count values for all folders without a full page reload when the user manually triggers a refresh.

---

### Requirement 3: Email List

**User Story:** As a user, I want to see a paginated list of emails in the selected folder so that I can quickly scan sender, subject, preview, and date.

#### Acceptance Criteria

1. WHEN a folder is selected, THE Mail_Client SHALL fetch and display the Email_List sorted by date descending, showing 25 emails per page.
2. THE Mail_Client SHALL display for each email: sender name and address, subject line, a plain-text preview of up to 120 characters, date/time, unread indicator, and flag indicator.
3. THE Mail_Client SHALL visually distinguish unread emails (e.g. bold subject) from read emails.
4. THE Mail_Client SHALL display a "Load More" control that fetches the next 25 emails when activated.
5. WHEN the Email_List is loading, THE Mail_Client SHALL display a skeleton loading state in place of the email rows.
6. IF the folder contains zero emails, THEN THE Mail_Client SHALL display an empty-state message appropriate to the folder (e.g. "Your inbox is empty").
7. WHEN the user selects an email from the list, THE Mail_Client SHALL mark it as read in the IMAP_Service and update the unread indicator without a full list reload.

---

### Requirement 4: Email Detail View

**User Story:** As a user, I want to read the full content of an email so that I can view the HTML body, headers, and any attachment information.

#### Acceptance Criteria

1. WHEN the user selects an email, THE Mail_Client SHALL fetch and display the Email_Detail including From, To, CC, Date, Subject, and the full message body.
2. THE Mail_Client SHALL render HTML email bodies inside a sandboxed `<iframe>` or equivalent isolation mechanism to prevent script execution and CSS bleed.
3. WHERE the email contains no HTML part, THE Mail_Client SHALL render the plain-text body with whitespace preserved.
4. THE Mail_Client SHALL list attachment filenames and sizes for any MIME attachments present in the email.
5. WHEN the user clicks an attachment, THE Mail_Client SHALL request the attachment content from the backend and trigger a browser download.
6. THE Mail_Client SHALL display action buttons in the detail view: Reply, Reply All, Forward, Flag/Unflag, Move To, Mark as Unread, and Delete.
7. WHEN the user navigates between emails using keyboard arrow keys while the detail view is open, THE Mail_Client SHALL load the adjacent email without closing the detail panel.

---

### Requirement 5: Compose New Email

**User Story:** As a user, I want to compose and send a new email so that I can communicate directly from the mail client.

#### Acceptance Criteria

1. WHEN the user activates the "Compose" button, THE Mail_Client SHALL open the Compose_Window with empty To, CC, BCC, Subject, and body fields.
2. THE Mail_Client SHALL send the composed email via the existing SMTP_Config stored in the database when the user submits the Compose_Window.
3. THE Mail_Client SHALL validate that the To field contains at least one valid RFC 5322 email address before submission.
4. IF the To field contains an invalid email address, THEN THE Mail_Client SHALL display a validation error and prevent submission.
5. WHEN the email is sent successfully, THE Mail_Client SHALL close the Compose_Window and display a success notification.
6. IF sending fails, THEN THE Mail_Client SHALL display the error message and keep the Compose_Window open with the draft content intact.
7. THE Mail_Client SHALL support multiple recipients in the To, CC, and BCC fields, entered as comma-separated addresses or via a tag-input component.
8. WHEN the user closes the Compose_Window with unsaved content, THE Mail_Client SHALL prompt for confirmation before discarding the draft.

---

### Requirement 6: Reply, Reply All, and Forward

**User Story:** As a user, I want to reply to, reply-all, or forward an email so that I can continue email conversations.

#### Acceptance Criteria

1. WHEN the user activates "Reply", THE Mail_Client SHALL open the Compose_Window pre-populated with the original sender in the To field, "Re: {original subject}" as the subject, and the original message quoted in the body.
2. WHEN the user activates "Reply All", THE Mail_Client SHALL open the Compose_Window pre-populated with all original recipients (To and CC, excluding the user's own address) and the quoted original body.
3. WHEN the user activates "Forward", THE Mail_Client SHALL open the Compose_Window with an empty To field, "Fwd: {original subject}" as the subject, and the original message quoted in the body.
4. THE Mail_Client SHALL send replies and forwards via the existing SMTP_Config using the `In-Reply-To` and `References` headers set to the original message's `Message-ID`.
5. WHEN a reply is sent successfully, THE Mail_Client SHALL append the sent message to the IMAP Sent folder via IMAP APPEND if the server supports it.

---

### Requirement 7: Flag and Unflag Emails

**User Story:** As a user, I want to flag and unflag emails so that I can mark important messages for follow-up.

#### Acceptance Criteria

1. WHEN the user activates the flag control on an email, THE Mail_Client SHALL set the `\Flagged` IMAP flag on that email via the IMAP_Service.
2. WHEN the user activates the flag control on an already-flagged email, THE Mail_Client SHALL remove the `\Flagged` IMAP flag from that email.
3. THE Mail_Client SHALL update the flag indicator in both the Email_List and Email_Detail views immediately after the IMAP operation completes, without a full list reload.
4. THE Mail_Client SHALL display a "Flagged" virtual folder in the sidebar that shows all emails carrying the `\Flagged` flag across all folders.
5. IF the flag operation fails, THEN THE Mail_Client SHALL display an error notification and revert the flag indicator to its previous state.

---

### Requirement 8: Move to Folder

**User Story:** As a user, I want to move emails between folders so that I can organise my mailbox (archive, mark as junk, delete, or move to custom folders).

#### Acceptance Criteria

1. WHEN the user activates "Move To" on an email, THE Mail_Client SHALL display a dropdown listing all available Folders.
2. WHEN the user selects a destination folder, THE Mail_Client SHALL copy the email to the destination folder and delete it from the source folder using IMAP COPY + STORE \Deleted + EXPUNGE.
3. THE Mail_Client SHALL provide one-click shortcut actions for Archive, Junk, and Trash in the Email_Detail action bar without requiring the full Move To dropdown.
4. WHEN an email is moved, THE Mail_Client SHALL remove it from the current Email_List immediately and update the Unread_Count for both source and destination folders.
5. IF the move operation fails, THEN THE Mail_Client SHALL display an error notification and leave the email in its original folder.

---

### Requirement 9: Mark as Read / Unread

**User Story:** As a user, I want to manually mark emails as read or unread so that I can control my attention and follow-up queue.

#### Acceptance Criteria

1. WHEN the user activates "Mark as Unread" on a read email, THE Mail_Client SHALL remove the `\Seen` IMAP flag from that email.
2. WHEN the user selects an unread email from the Email_List, THE Mail_Client SHALL set the `\Seen` IMAP flag on that email automatically.
3. THE Mail_Client SHALL update the Unread_Count badge in the sidebar immediately after any read/unread state change.
4. THE Mail_Client SHALL support bulk mark-as-read and bulk mark-as-unread for multiple selected emails in the Email_List.
5. IF the read/unread operation fails, THEN THE Mail_Client SHALL display an error notification and revert the visual state.

---

### Requirement 10: Search Emails

**User Story:** As a user, I want to search emails by sender, subject, or body text so that I can quickly find specific messages.

#### Acceptance Criteria

1. WHEN the user enters a Search_Query and submits, THE Mail_Client SHALL execute an IMAP SEARCH command against the currently selected folder and display matching emails in the Email_List.
2. THE Mail_Client SHALL search across the From, Subject, and body (TEXT) fields using the IMAP SEARCH criteria.
3. THE Mail_Client SHALL display search results using the same Email_List layout with a result count shown above the list.
4. WHEN the user clears the search field, THE Mail_Client SHALL restore the full Email_List for the current folder.
5. IF the search returns zero results, THEN THE Mail_Client SHALL display a "No results found for '{query}'" message.
6. THE Mail_Client SHALL debounce search input by 400 milliseconds before issuing the IMAP SEARCH command to avoid excessive server requests.

---

### Requirement 11: Pagination and Load More

**User Story:** As a user, I want to load more emails incrementally so that the initial page load is fast even for large mailboxes.

#### Acceptance Criteria

1. THE Mail_Client SHALL fetch emails in pages of 25, ordered by UID descending (newest first).
2. WHEN the user activates "Load More", THE Mail_Client SHALL append the next page of 25 emails to the existing Email_List without replacing the current list.
3. THE Mail_Client SHALL hide the "Load More" control when all emails in the folder have been loaded.
4. THE Mail_Client SHALL display the total email count for the current folder above the Email_List.
5. WHEN a new folder is selected, THE Mail_Client SHALL reset pagination to page 1 and discard any previously loaded pages for the prior folder.

---

### Requirement 12: Backend IMAP API

**User Story:** As a developer, I want a clean set of backend API endpoints for IMAP operations so that the frontend can delegate all IMAP logic to the server.

#### Acceptance Criteria

1. THE IMAP_Service SHALL expose the following endpoints under `/api/v1/mail/`:
   - `POST /connect` — validate IMAP credentials and return folder list
   - `GET /folders` — return folder list with Unread_Count for each folder
   - `GET /folders/{folder}/messages` — return paginated Email_List (query params: `page`, `per_page`, `search`)
   - `GET /folders/{folder}/messages/{uid}` — return Email_Detail including full body and attachment metadata
   - `GET /folders/{folder}/messages/{uid}/attachments/{part}` — return raw attachment bytes
   - `POST /folders/{folder}/messages/{uid}/flags` — set or unset IMAP flags (`\Seen`, `\Flagged`)
   - `POST /folders/{folder}/messages/{uid}/move` — move email to a target folder
   - `DELETE /folders/{folder}/messages/{uid}` — move email to Trash or permanently delete if already in Trash
   - `POST /send` — send a new email or reply/forward via SMTP_Config
2. THE IMAP_Service SHALL accept IMAP credentials in the request body (not as headers) for all IMAP endpoints, since credentials are session-only and not stored server-side.
3. THE IMAP_Service SHALL open a new IMAP connection per request and close it after the operation completes, to avoid stale connection state.
4. IF an IMAP operation returns an authentication error, THEN THE IMAP_Service SHALL return HTTP 401 with a descriptive message.
5. IF an IMAP operation returns a server error, THEN THE IMAP_Service SHALL return HTTP 502 with the raw IMAP error detail.
6. THE IMAP_Service SHALL run all blocking `imaplib` calls inside `asyncio.get_event_loop().run_in_executor` to avoid blocking the FastAPI event loop.
7. THE IMAP_Service SHALL decode all IMAP header values (subject, from, to, cc) using RFC 2047 `email.header.decode_header` before returning them to the client.

---

### Requirement 13: Frontend Mail Route and Layout

**User Story:** As a user, I want the mail client to be accessible from the main sidebar so that I can switch between campaign management and my inbox seamlessly.

#### Acceptance Criteria

1. THE Mail_Client SHALL be accessible at the route `/mail` within the existing Next.js dashboard layout.
2. THE Mail_Client SHALL add a "Mail" navigation item with an inbox icon to the existing Sidebar component, positioned between "Campaigns" and "Templates".
3. THE Mail_Client SHALL use a three-panel layout: Folder sidebar (left), Email_List (centre), Email_Detail (right), consistent with the Apple Mail / Gmail layout pattern.
4. THE Mail_Client SHALL be fully responsive: on viewports narrower than 768px, THE Mail_Client SHALL collapse to a single-panel view with back-navigation between panels.
5. THE Mail_Client SHALL use existing shadcn/ui components and Tailwind CSS classes consistent with the rest of the NovaMailer UI.
6. WHEN the user navigates away from `/mail` and returns within the same session, THE Mail_Client SHALL restore the previously selected folder and scroll position.
