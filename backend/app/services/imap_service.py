"""
IMAP service — all blocking imaplib calls run in a thread executor.
Each public function opens a fresh connection, performs the operation, and closes it.
"""
import asyncio
import email as email_lib
import imaplib
import re
import ssl
import logging
from email.header import decode_header as _decode_header
from email.utils import parseaddr, getaddresses
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


# ── helpers ───────────────────────────────────────────────────────────────────

def _decode(value: Any, fallback_enc: str = "utf-8") -> str:
    if value is None:
        return ""
    parts = _decode_header(str(value))
    result = []
    for raw, enc in parts:
        if isinstance(raw, bytes):
            result.append(raw.decode(enc or fallback_enc, errors="replace"))
        else:
            result.append(str(raw))
    return "".join(result)


def _connect(host: str, port: int, username: str, password: str, timeout: int = 30, max_retries: int = 3) -> imaplib.IMAP4:
    """Connect to IMAP server with password authentication."""
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    last_error = None
    
    for attempt in range(max_retries):
        try:
            logger.info(f"Connecting to IMAP server {host}:{port} (attempt {attempt + 1}/{max_retries})")
            
            try:
                mail = imaplib.IMAP4_SSL(host, port, ssl_context=ctx, timeout=timeout)
                logger.info(f"SSL connection established to {host}:{port}")
            except Exception as e:
                logger.warning(f"SSL connection failed, trying STARTTLS: {e}")
                mail = imaplib.IMAP4(host, port)
                mail.starttls(ssl_context=ctx)
                logger.info(f"STARTTLS connection established to {host}:{port}")
            
            try:
                clean_password = password.replace(" ", "")
                mail.login(username, clean_password)
                logger.info(f"Successfully authenticated as {username}")
                return mail
            except Exception as e:
                logger.error(f"Authentication failed for {username}: {e}")
                raise
                
        except Exception as e:
            last_error = e
            if attempt < max_retries - 1:
                import time
                wait_time = 2 ** attempt  # Exponential backoff: 1s, 2s, 4s
                logger.warning(f"Connection attempt {attempt + 1} failed, retrying in {wait_time}s...")
                time.sleep(wait_time)
            else:
                logger.error(f"All {max_retries} connection attempts failed")
    
    raise last_error or Exception("Connection failed")


def _get_body_and_attachments(msg) -> Tuple[str, str, List[Dict]]:
    """Return (html_body, plain_body, attachments)."""
    html_body = ""
    plain_body = ""
    attachments = []

    if msg.is_multipart():
        for part in msg.walk():
            ct = part.get_content_type()
            cd = str(part.get("Content-Disposition") or "")
            filename = part.get_filename()

            if filename or "attachment" in cd:
                attachments.append({
                    "filename": _decode(filename) or "attachment",
                    "content_type": ct,
                    "size": len(part.get_payload(decode=True) or b""),
                    "part_id": part.get("Content-ID") or filename or ct,
                })
                continue

            if ct == "text/html" and not html_body:
                payload = part.get_payload(decode=True)
                if payload:
                    html_body = payload.decode(part.get_content_charset() or "utf-8", errors="replace")
            elif ct == "text/plain" and not plain_body:
                payload = part.get_payload(decode=True)
                if payload:
                    plain_body = payload.decode(part.get_content_charset() or "utf-8", errors="replace")
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            ct = msg.get_content_type()
            text = payload.decode(msg.get_content_charset() or "utf-8", errors="replace")
            if ct == "text/html":
                html_body = text
            else:
                plain_body = text

    return html_body, plain_body, attachments


def _parse_summary(uid: bytes, raw_headers: bytes) -> Dict:
    msg = email_lib.message_from_bytes(raw_headers)
    flags_str = ""  # populated separately
    subject = _decode(msg.get("Subject", "(no subject)"))
    from_addr = _decode(msg.get("From", ""))
    date = msg.get("Date", "")
    # plain-text preview from snippet
    _, plain, _ = _get_body_and_attachments(msg)
    preview = re.sub(r"\s+", " ", plain).strip()[:120]
    return {
        "uid": uid.decode(),
        "subject": subject,
        "from": from_addr,
        "date": date,
        "preview": preview,
        "is_read": False,
        "is_flagged": False,
        "message_id": msg.get("Message-ID", ""),
    }


# ── public API ────────────────────────────────────────────────────────────────

async def run(fn, *args, **kwargs):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, lambda: fn(*args, **kwargs))


def _list_folders(host, port, username, password) -> List[Dict]:
    mail = _connect(host, port, username, password)
    try:
        _, data = mail.list()
        folders = []
        for item in data:
            if not item:
                continue
            decoded = item.decode() if isinstance(item, bytes) else item
            # Parse: (\HasNoChildren) "/" "INBOX"
            m = re.match(r'\(([^)]*)\)\s+"([^"]+)"\s+"?([^"]+)"?', decoded)
            if not m:
                m = re.match(r'\(([^)]*)\)\s+\S+\s+"?([^"\s]+)"?', decoded)
                if m:
                    name = m.group(2)
                else:
                    continue
            else:
                name = m.group(3).strip()

            # Get unread count
            try:
                _, cnt = mail.select(f'"{name}"', readonly=True)
                _, unseen_data = mail.search(None, "UNSEEN")
                unread = len(unseen_data[0].split()) if unseen_data[0] else 0
            except Exception:
                unread = 0

            folders.append({"name": name, "unread": unread})
        return folders
    finally:
        try:
            mail.logout()
        except Exception:
            pass


def _get_messages(host, port, username, password, folder, page, per_page, search) -> Dict:
    mail = _connect(host, port, username, password)
    try:
        mail.select(f'"{folder}"', readonly=True)

        if search:
            criteria = f'(OR OR FROM "{search}" SUBJECT "{search}" TEXT "{search}")'
            _, data = mail.search(None, criteria)
        else:
            _, data = mail.search(None, "ALL")

        all_uids = data[0].split() if data[0] else []
        total = len(all_uids)
        # Newest first
        all_uids = list(reversed(all_uids))
        start = (page - 1) * per_page
        page_uids = all_uids[start: start + per_page]

        messages = []
        for uid in page_uids:
            try:
                _, msg_data = mail.fetch(uid, "(RFC822.HEADER FLAGS)")
                raw_headers = msg_data[0][1]
                flags_raw = msg_data[0][0].decode() if isinstance(msg_data[0][0], bytes) else str(msg_data[0][0])
                summary = _parse_summary(uid, raw_headers)
                summary["is_read"] = "\\Seen" in flags_raw
                summary["is_flagged"] = "\\Flagged" in flags_raw
                messages.append(summary)
            except Exception:
                continue

        return {"messages": messages, "total": total, "page": page, "per_page": per_page}
    finally:
        try:
            mail.logout()
        except Exception:
            pass


def _get_message_detail(host, port, username, password, folder, uid) -> Dict:
    mail = _connect(host, port, username, password)
    try:
        mail.select(f'"{folder}"')
        _, msg_data = mail.fetch(uid.encode(), "(RFC822 FLAGS)")
        raw = msg_data[0][1]
        flags_raw = msg_data[0][0].decode() if isinstance(msg_data[0][0], bytes) else str(msg_data[0][0])
        msg = email_lib.message_from_bytes(raw)

        html_body, plain_body, attachments = _get_body_and_attachments(msg)

        # Mark as read
        mail.store(uid.encode(), "+FLAGS", "\\Seen")

        return {
            "uid": uid,
            "subject": _decode(msg.get("Subject", "(no subject)")),
            "from": _decode(msg.get("From", "")),
            "to": _decode(msg.get("To", "")),
            "cc": _decode(msg.get("Cc", "")),
            "date": msg.get("Date", ""),
            "message_id": msg.get("Message-ID", ""),
            "html_body": html_body,
            "plain_body": plain_body,
            "attachments": attachments,
            "is_read": "\\Seen" in flags_raw,
            "is_flagged": "\\Flagged" in flags_raw,
        }
    finally:
        try:
            mail.logout()
        except Exception:
            pass


def _set_flags(host, port, username, password, folder, uid, add_flags, remove_flags) -> bool:
    mail = _connect(host, port, username, password)
    try:
        mail.select(f'"{folder}"')
        if add_flags:
            mail.store(uid.encode(), "+FLAGS", " ".join(add_flags))
        if remove_flags:
            mail.store(uid.encode(), "-FLAGS", " ".join(remove_flags))
        return True
    finally:
        try:
            mail.logout()
        except Exception:
            pass


def _move_message(host, port, username, password, folder, uid, destination) -> bool:
    mail = _connect(host, port, username, password)
    try:
        mail.select(f'"{folder}"')
        mail.copy(uid.encode(), f'"{destination}"')
        mail.store(uid.encode(), "+FLAGS", "\\Deleted")
        mail.expunge()
        return True
    finally:
        try:
            mail.logout()
        except Exception:
            pass


def _delete_message(host, port, username, password, folder, uid, trash_folder="Trash") -> bool:
    mail = _connect(host, port, username, password)
    try:
        mail.select(f'"{folder}"')
        # If already in trash, permanently delete; otherwise move to trash
        if folder.lower() in ("trash", "[gmail]/trash", "bin", "deleted items"):
            mail.store(uid.encode(), "+FLAGS", "\\Deleted")
            mail.expunge()
        else:
            mail.copy(uid.encode(), f'"{trash_folder}"')
            mail.store(uid.encode(), "+FLAGS", "\\Deleted")
            mail.expunge()
        return True
    finally:
        try:
            mail.logout()
        except Exception:
            pass


def _get_attachment(host, port, username, password, folder, uid, part_id) -> Optional[Tuple[bytes, str, str]]:
    """Returns (data, content_type, filename)."""
    mail = _connect(host, port, username, password)
    try:
        mail.select(f'"{folder}"')
        _, msg_data = mail.fetch(uid.encode(), "(RFC822)")
        raw = msg_data[0][1]
        msg = email_lib.message_from_bytes(raw)

        for part in msg.walk():
            filename = _decode(part.get_filename() or "")
            cid = part.get("Content-ID") or ""
            ct = part.get_content_type()
            if filename == part_id or cid == part_id or ct == part_id:
                data = part.get_payload(decode=True)
                return data, ct, filename or "attachment"
        return None
    finally:
        try:
            mail.logout()
        except Exception:
            pass


# ── async wrappers ────────────────────────────────────────────────────────────

async def list_folders(host, port, username, password):
    return await run(_list_folders, host, port, username, password)

async def get_messages(host, port, username, password, folder, page=1, per_page=25, search=""):
    return await run(_get_messages, host, port, username, password, folder, page, per_page, search)

async def get_message_detail(host, port, username, password, folder, uid):
    return await run(_get_message_detail, host, port, username, password, folder, uid)

async def set_flags(host, port, username, password, folder, uid, add_flags=None, remove_flags=None):
    return await run(_set_flags, host, port, username, password, folder, uid, add_flags or [], remove_flags or [])

async def move_message(host, port, username, password, folder, uid, destination):
    return await run(_move_message, host, port, username, password, folder, uid, destination)

async def delete_message(host, port, username, password, folder, uid, trash_folder="Trash"):
    return await run(_delete_message, host, port, username, password, folder, uid, trash_folder)

async def get_attachment(host, port, username, password, folder, uid, part_id):
    return await run(_get_attachment, host, port, username, password, folder, uid, part_id)
