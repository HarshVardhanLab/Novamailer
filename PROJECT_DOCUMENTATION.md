# 📧 NovaMailer - Complete Project Documentation

---

## Table of Contents

1. [Project Synopsis](#project-synopsis)
2. [Core Features](#core-features)
3. [Technical Implementation](#technical-implementation)
4. [UI/UX Highlights](#uiux-highlights)
5. [Technical Stack](#technical-stack)
6. [Frontend Technologies](#frontend-technologies)
7. [Project Conclusion](#project-conclusion)

---

## Project Synopsis

### Overview

NovaMailer is a comprehensive, production-ready email marketing platform designed to empower businesses, marketers, and developers to create, manage, and execute professional email campaigns at scale. Built with modern web technologies, the platform combines enterprise-grade security with an intuitive user interface, making sophisticated email marketing accessible to users of all technical levels.

### Problem Statement

Email marketing remains one of the most effective digital marketing channels, yet many existing solutions suffer from:

- **Complexity**: Enterprise tools are often overwhelming for small to medium businesses
- **Security Concerns**: Many platforms lack robust authentication and data protection
- **Cost**: Premium features are often locked behind expensive subscription tiers
- **Flexibility**: Limited customization options for email templates and campaigns
- **Integration Challenges**: Difficulty in deploying to various cloud environments

### Solution

NovaMailer addresses these challenges by providing:

1. **Simplified Workflow**: A streamlined three-step process (Settings → Templates → Campaigns) that guides users from configuration to campaign execution
2. **Multi-Layer Security**: JWT authentication combined with OTP verification ensures account security without compromising user experience
3. **Open Architecture**: Self-hosted solution with support for multiple cloud platforms (Azure, GCP, Vercel, Railway)
4. **Template Flexibility**: Jinja2-powered template engine supporting dynamic variable substitution for personalized mass emails
5. **Real-Time Tracking**: Live campaign progress monitoring with detailed recipient-level status tracking

### Target Users

- **Small Business Owners**: Managing customer communications and promotional campaigns
- **Marketing Teams**: Executing targeted email campaigns with personalization
- **Developers**: Integrating email capabilities into existing applications
- **Startups**: Cost-effective email marketing without enterprise pricing
| File Attachments | Attach files to campaign emails |

### ⚙️ SMTP Configuration
| Feature | Description |
|---------|-------------|
| Multi-Provider Support | Gmail, Outlook, SendGrid, Mailgun, and more |
| Secure Credentials | Encrypted storage of SMTP credentials |
| Per-User Settings | Each user manages their own SMTP configuration |

---

## Technical Implementation

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Next.js 16 Frontend (React 19)              │   │
│  │    ┌──────────┐  ┌──────────┐  ┌──────────────────┐     │   │
│  │    │   Auth   │  │ Dashboard│  │ Campaign Manager │     │   │
│  │    │  Pages   │  │  Views   │  │    & Templates   │     │   │
│  │    └──────────┘  └──────────┘  └──────────────────┘     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ REST API (Axios)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 FastAPI Backend (Python)                 │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │                    ROUTERS                          │ │   │
│  │  │  /auth  │  /campaigns  │  /templates  │  /smtp     │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │                   SERVICES                          │ │   │
│  │  │  OTP  │  Email  │  CSV Parser  │  Template Engine  │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ SQLAlchemy ORM
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                               │
│  ┌──────────────────┐  ┌──────────────────────────────────┐    │
│  │  SQLite (Dev)    │  │  PostgreSQL (Production)         │    │
│  │  novamailer.db   │  │  Azure SQL / Railway Postgres    │    │
│  └──────────────────┘  └──────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Backend Structure

```
backend/
├── app/
│   ├── core/
│   │   ├── config.py      # Environment configuration
│   │   ├── database.py    # Database connection & session
│   │   └── security.py    # JWT & password utilities
│   ├── models/
│   │   ├── user.py        # User model with auth fields
│   │   ├── campaign.py    # Campaign entity
│   │   ├── template.py    # Email template model
│   │   ├── recipient.py   # Campaign recipients
│   │   ├── smtp.py        # SMTP configuration
│   │   ├── otp.py         # OTP tokens
│   │   └── attachment.py  # File attachments
│   ├── routers/
│   │   ├── auth.py        # Authentication endpoints
│   │   ├── campaigns.py   # Campaign CRUD & sending
│   │   ├── templates.py   # Template management
│   │   ├── smtp.py        # SMTP configuration
│   │   ├── stats.py       # Analytics endpoints
│   │   └── uploads.py     # File upload handling
│   ├── schemas/           # Pydantic validation schemas
│   └── services/
│       ├── email.py       # SMTP email sending
│       ├── otp_service.py # OTP generation & verification
│       ├── csv_service.py # CSV parsing
│       └── template_service.py  # Variable substitution
├── main.py                # FastAPI application entry
└── requirements.txt       # Python dependencies
```

### Frontend Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/         # Login with OTP support
│   │   │   ├── register/      # Registration flow
│   │   │   ├── verify-email/  # Email verification
│   │   │   └── forgot-password/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/     # Analytics overview
│   │   │   ├── campaigns/     # Campaign management
│   │   │   ├── templates/     # Template editor
│   │   │   └── settings/      # SMTP configuration
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── sidebar.tsx        # Navigation sidebar
│   │   └── otp-input.tsx      # OTP input component
│   └── lib/
│       ├── api.ts             # Axios instance
│       └── utils.ts           # Utility functions
└── package.json
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | User registration |
| POST | `/auth/login` | User login (returns JWT or OTP) |
| POST | `/auth/verify-login` | Verify OTP for 2FA login |
| POST | `/auth/verify-email` | Verify email with OTP |
| POST | `/auth/forgot-password` | Initiate password reset |
| GET | `/campaigns` | List user campaigns |
| POST | `/campaigns` | Create new campaign |
| GET | `/campaigns/{id}` | Get campaign details |
| POST | `/campaigns/{id}/send` | Send campaign emails |
| POST | `/campaigns/{id}/recipients` | Upload CSV recipients |
| GET | `/templates` | List user templates |
| POST | `/templates` | Create template |
| GET | `/smtp` | Get SMTP configuration |
| POST | `/smtp` | Save SMTP settings |
| GET | `/stats` | Get dashboard statistics |

### Database Schema

```sql
-- Core Tables
Users (id, email, password_hash, is_verified, two_factor_enabled)
OTP (id, user_id, code, type, expires_at, is_used)
SMTP (id, user_id, host, port, username, password, from_email)
Templates (id, user_id, name, content, created_at)
Campaigns (id, user_id, name, subject, body, status, created_at)
Recipients (id, campaign_id, email, data, status)
Attachments (id, campaign_id, filename, filepath)
```

---

## UI/UX Highlights

### Design System

The application uses a modern, clean design system built on:

- **Color Palette**: Professional blue/indigo primary with neutral grays
- **Typography**: System font stack for optimal readability
- **Spacing**: Consistent 4px/8px grid system
- **Components**: shadcn/ui component library for consistency

### Key UI Components

| Component | Purpose |
|-----------|---------|
| Card | Content containers for forms and data display |
| Button | Primary, secondary, ghost, and destructive variants |
| Form | React Hook Form with Zod validation |
| Table | Data display for campaigns and recipients |
| Dialog | Modal interactions for confirmations |
| Toast (Sonner) | Non-intrusive notifications |
| OTP Input | Custom 6-digit code input with auto-focus |

### User Flows

**Registration Flow:**
```
Register Form → Email OTP Sent → Verify OTP → Account Created → Login
```

**Login Flow (with 2FA):**
```
Login Form → Credentials Valid → OTP Sent → Verify OTP → Dashboard
```

**Campaign Flow:**
```
Create Campaign → Add Content → Upload CSV → Preview → Test Send → Send All
```

### Responsive Design

- **Desktop**: Full sidebar navigation with expanded views
- **Tablet**: Collapsible sidebar with touch-friendly targets
- **Mobile**: Hidden sidebar with hamburger menu (planned)

### Accessibility Features

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus management in modals
- Color contrast compliance

---

## Technical Stack

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.11+ | Runtime environment |
| **FastAPI** | Latest | Web framework with async support |
| **SQLAlchemy** | Latest | ORM for database operations |
| **Pydantic** | v2 | Data validation and serialization |
| **Uvicorn** | Latest | ASGI server |
| **Gunicorn** | Latest | Production WSGI server |
| **python-jose** | Latest | JWT token handling |
| **bcrypt** | Latest | Password hashing |
| **aiosmtplib** | Latest | Async SMTP client |
| **Jinja2** | Latest | Template rendering |
| **Pandas** | Latest | CSV processing |

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.0.5 | React framework with App Router |
| **React** | 19.2.0 | UI library |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Tailwind CSS** | 4.x | Utility-first CSS framework |
| **shadcn/ui** | Latest | Component library |
| **React Hook Form** | 7.x | Form state management |
| **Zod** | 4.x | Schema validation |
| **Axios** | 1.x | HTTP client |
| **Recharts** | 2.x | Data visualization |
| **Lucide React** | Latest | Icon library |
| **Sonner** | 2.x | Toast notifications |

### Infrastructure & DevOps

| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Multi-container orchestration |
| **PostgreSQL** | Production database |
| **SQLite** | Development database |
| **Azure App Service** | Cloud hosting (recommended) |
| **Google Cloud Run** | Alternative cloud hosting |
| **Vercel** | Frontend hosting option |
| **Railway** | Backend hosting option |

---

## Project Conclusion

### Summary

NovaMailer successfully delivers a production-ready email marketing platform that balances powerful features with user-friendly design. The application demonstrates modern full-stack development practices including:

- **Clean Architecture**: Separation of concerns with distinct layers for routing, services, and data access
- **Type Safety**: End-to-end TypeScript on frontend, Pydantic schemas on backend
- **Security Best Practices**: JWT authentication, OTP verification, password hashing, CORS protection
- **Scalable Design**: Async operations, efficient database queries, containerized deployment

### Key Achievements

✅ Complete authentication system with email verification and 2FA  
✅ Full campaign lifecycle management (create, preview, test, send, track)  
✅ Flexible template system with variable substitution  
✅ CSV-based bulk recipient management  
✅ Multi-cloud deployment support (Azure, GCP, Vercel, Railway)  
✅ Modern, responsive UI with accessibility considerations  
✅ Comprehensive documentation for users and developers  

### Future Roadmap

| Feature | Priority | Status |
|---------|----------|--------|
| Multi-language support | Medium | Planned |
| Advanced analytics & reporting | High | Planned |
| A/B testing for campaigns | Medium | Planned |
| Email scheduling | High | Planned |
| Webhook integrations | Low | Planned |
| API documentation (OpenAPI) | Medium | Planned |
| Mobile-responsive sidebar | Medium | Planned |

### Technical Debt & Improvements

- Add comprehensive test coverage (unit, integration, e2e)
- Implement rate limiting for API endpoints
- Add email bounce handling and list hygiene
- Implement email queue for large campaigns
- Add SPF/DKIM configuration guidance

---

**NovaMailer** - Built for modern email marketing needs 📧✨


---

## Core Features

### 1. Authentication & Security System

NovaMailer implements a comprehensive, multi-layered authentication system designed to protect user accounts while maintaining a smooth user experience.

#### 1.1 User Registration Flow

The registration process follows a secure, verified approach:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Registration   │────▶│   OTP Email     │────▶│  Email Verify   │────▶│  Account Ready  │
│     Form        │     │     Sent        │     │    (6-digit)    │     │    to Login     │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Registration Form Fields:**
- Full Name (minimum 2 characters)
- Email Address (validated format)
- Password (minimum 6 characters)
- Confirm Password (must match)

**Backend Process:**
1. Validates email uniqueness in database
2. Hashes password using bcrypt with salt
3. Creates user record with `email_verified=False`
4. Generates 6-digit OTP with 10-minute expiry
5. Sends verification email via configured SMTP
6. Returns user_id for verification step

#### 1.2 Email Verification (OTP System)

The OTP (One-Time Password) system provides secure email verification:

**OTP Generation (`otp_service.py`):**
```python
def generate_otp(db, user_id, purpose):
    code = ''.join(random.choices(string.digits, k=6))  # 6 random digits
    expires_at = datetime.now() + timedelta(minutes=10)  # 10-minute expiry
    
    # Invalidate previous OTPs for same purpose
    # Store new OTP in database
    return code
```

**OTP Purposes:**
- `registration`: Email verification for new accounts
- `login`: Two-factor authentication during login
- `password_reset`: Secure password recovery

**OTP Email Template:**
- Professional HTML design with branded header
- Large, readable 6-digit code display
- Clear expiration notice (10 minutes)
- Security disclaimer

#### 1.3 Login System

NovaMailer supports both standard login and two-factor authentication:

**Standard Login (2FA Disabled):**
```
Email + Password → Validate → Generate JWT → Dashboard Access
```

**Two-Factor Login (2FA Enabled):**
```
Email + Password → Validate → Send OTP → Verify OTP → Generate JWT → Dashboard Access
```

**JWT Token Structure:**
```python
{
    "email": "user@example.com",
    "exp": <expiration_timestamp>
}
```

**Token Configuration:**
- Algorithm: HS256
- Default Expiry: 30 minutes (configurable)
- Storage: Browser localStorage

#### 1.4 Password Security

**Hashing Implementation (`security.py`):**
```python
def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )
```

**Password Reset Flow:**
1. User requests reset via email
2. System generates OTP (doesn't reveal if email exists)
3. User enters OTP and new password
4. Password updated with new bcrypt hash

#### 1.5 Two-Factor Authentication (2FA)

Users can enable 2FA for enhanced security:
- Toggle in user settings
- When enabled, login requires OTP verification
- OTP sent to registered email
- 10-minute validity window
- Previous OTPs automatically invalidated

---

### 2. Campaign Management System

The campaign system is the core of NovaMailer, enabling users to create, manage, and execute email campaigns.

#### 2.1 Campaign Data Model

```python
class Campaign(Base):
    __tablename__ = "campaigns"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255))           # Internal campaign name
    subject = Column(String(500))        # Email subject line (supports variables)
    body = Column(Text)                  # HTML email content
    status = Column(String(50))          # draft, sending, completed, failed
    created_at = Column(DateTime)        # Creation timestamp
    user_id = Column(Integer, ForeignKey("users.id"))
```

**Campaign Statuses:**
| Status | Description |
|--------|-------------|
| `draft` | Campaign created but not sent |
| `sending` | Campaign currently being processed |
| `completed` | All emails processed |
| `failed` | Campaign encountered critical error |

#### 2.2 Campaign Creation

**Required Fields:**
- **Campaign Name**: Internal identifier (not visible to recipients)
- **Email Subject**: Subject line with optional variable placeholders
- **Email Body**: Full HTML content with variable support

**API Endpoint:**
```
POST /campaigns/
Authorization: Bearer <token>
Content-Type: application/json

{
    "name": "Black Friday Sale 2024",
    "subject": "🎉 {{name}}, Your Exclusive 50% Discount!",
    "body": "<html>...</html>"
}
```

#### 2.3 Recipient Management

Recipients are imported via CSV files and stored with their personalization data.

**Recipient Data Model:**
```python
class Recipient(Base):
    __tablename__ = "recipients"
    
    id = Column(Integer, primary_key=True)
    email = Column(String(255))          # Recipient email address
    data = Column(JSON)                  # All CSV columns as JSON
    status = Column(String(50))          # pending, sent, failed
    campaign_id = Column(Integer, ForeignKey("campaigns.id"))
```

**CSV Upload Process (`csv_service.py`):**
```python
async def parse_csv(file: UploadFile):
    # 1. Validate file extension (.csv)
    # 2. Parse with pandas
    # 3. Find 'email' column (case-insensitive)
    # 4. Convert to list of dictionaries
    # 5. Return for recipient creation
```

**CSV Requirements:**
- Must have `email` column (case-insensitive)
- Additional columns become template variables
- UTF-8 encoding recommended

**Example CSV:**
```csv
email,name,company,discount_code
john@example.com,John Doe,Acme Corp,SAVE50JOHN
jane@example.com,Jane Smith,Tech Inc,SAVE50JANE
```

#### 2.4 Campaign Preview

Preview allows users to see rendered emails before sending:

**API Endpoint:**
```
POST /campaigns/{id}/preview
{
    "sample_data": {
        "name": "John Doe",
        "email": "john@example.com",
        "company": "Acme Corp"
    }
}
```

**Response:**
```json
{
    "subject": "🎉 John Doe, Your Exclusive 50% Discount!",
    "body": "<html>...rendered content...</html>",
    "sample_data": {...}
}
```

#### 2.5 Test Send

Before full campaign execution, users can send test emails:

**Features:**
- Send to any email address
- Uses sample data for variable substitution
- Subject prefixed with "[TEST]"
- Validates SMTP configuration
- Includes attachments if configured

**API Endpoint:**
```
POST /campaigns/{id}/test-send?test_email=user@example.com
```

#### 2.6 Campaign Execution

The send process handles bulk email delivery with status tracking:

**Execution Flow:**
```python
async def send_campaign(campaign_id, db, current_user):
    # 1. Verify campaign ownership
    # 2. Load SMTP configuration
    # 3. Get pending recipients
    # 4. Load attachments
    # 5. Update status to "sending"
    
    for recipient in recipients:
        try:
            # Render subject and body with recipient data
            subject = render_template(campaign.subject, recipient.data)
            body = render_template(campaign.body, recipient.data)
            
            # Send email
            await send_email(smtp_config, recipient.email, subject, body, attachments)
            recipient.status = "sent"
            sent_count += 1
        except Exception:
            recipient.status = "failed"
            failed_count += 1
    
    # 6. Update status to "completed"
    # 7. Return summary
```

**Response:**
```json
{
    "message": "Campaign completed",
    "sent": 95,
    "failed": 5,
    "total": 100,
    "attachments": 2
}
```

#### 2.7 Campaign Statistics

Detailed statistics are available for each campaign:

**Stats Query:**
```python
stats = select(
    func.count(Recipient.id).label('total'),
    func.sum(case((Recipient.status == 'sent', 1), else_=0)).label('sent'),
    func.sum(case((Recipient.status == 'pending', 1), else_=0)).label('pending'),
    func.sum(case((Recipient.status == 'failed', 1), else_=0)).label('failed')
).filter(Recipient.campaign_id == campaign_id)
```

**Dashboard Metrics:**
- Total campaigns
- Emails sent (success)
- Emails failed
- Success rate percentage
- Campaigns by status (chart)
- Email status distribution (pie chart)


---

### 3. Template System

The template system enables reusable email designs with dynamic personalization.

#### 3.1 Template Data Model

```python
class Template(Base):
    __tablename__ = "templates"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255))           # Template name
    content = Column(Text)               # HTML template content
    user_id = Column(Integer, ForeignKey("users.id"))
```

#### 3.2 Variable Substitution Engine

NovaMailer uses Jinja2 for powerful template rendering:

**Template Service (`template_service.py`):**
```python
from jinja2 import Template

def render_template(content: str, context: dict) -> str:
    template = Template(content)
    return template.render(context)
```

**Variable Syntax:**
```html
<!-- Basic variable -->
Hello {{name}},

<!-- With default value -->
Hello {{name|default('Customer')}},

<!-- Conditional content -->
{% if vip %}
    <p>VIP Discount: 30% OFF</p>
{% else %}
    <p>Standard Discount: 20% OFF</p>
{% endif %}

<!-- Loops -->
{% for item in items %}
    <li>{{item.name}}: ${{item.price}}</li>
{% endfor %}
```

#### 3.3 Template Examples

**Welcome Email Template:**
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9fafb; }
        .button { 
            background: #4F46E5; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px;
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Welcome to NovaMailer!</h1>
    </div>
    <div class="content">
        <p>Hi {{name}},</p>
        <p>Thank you for joining us! Your account has been created successfully.</p>
        <p>Email: {{email}}</p>
        <p>Company: {{company}}</p>
        <p style="text-align: center; margin-top: 30px;">
            <a href="https://example.com/dashboard" class="button">Get Started</a>
        </p>
    </div>
</body>
</html>
```

**Promotional Email Template:**
```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial; text-align: center; padding: 20px;">
    <h1 style="color: #e74c3c;">🎉 Special Offer for {{name}}!</h1>
    <p style="font-size: 24px;">Get <strong>{{discount}}% OFF</strong></p>
    <p>Use code: <strong style="font-size: 20px; color: #4F46E5;">{{promo_code}}</strong></p>
    <a href="{{shop_url}}" style="background: #e74c3c; color: white; padding: 15px 30px; text-decoration: none; display: inline-block; margin: 20px; border-radius: 5px;">
        Shop Now
    </a>
    <p style="color: #666; font-size: 12px;">Offer expires: {{expiry_date}}</p>
</body>
</html>
```

---

### 4. SMTP Configuration

The SMTP system allows users to configure their own email sending credentials.

#### 4.1 SMTP Data Model

```python
class SMTPConfig(Base):
    __tablename__ = "smtp_configs"
    
    id = Column(Integer, primary_key=True)
    host = Column(String(255))           # SMTP server hostname
    port = Column(Integer)               # SMTP port (typically 587)
    username = Column(String(255))       # SMTP username
    password = Column(String(255))       # SMTP password (app password)
    from_email = Column(String(255))     # Sender email address
    user_id = Column(Integer, ForeignKey("users.id"))
```

#### 4.2 Supported Email Providers

| Provider | Host | Port | Notes |
|----------|------|------|-------|
| Gmail | smtp.gmail.com | 587 | Requires App Password |
| Outlook | smtp-mail.outlook.com | 587 | Standard password |
| Yahoo | smtp.mail.yahoo.com | 587 | Requires App Password |
| SendGrid | smtp.sendgrid.net | 587 | API key as password |
| Mailgun | smtp.mailgun.org | 587 | SMTP credentials |
| Amazon SES | email-smtp.region.amazonaws.com | 587 | IAM credentials |

#### 4.3 Email Sending Implementation

**Email Service (`email.py`):**
```python
async def send_email(smtp_config, to_email, subject, body, attachments=None):
    # Create message (MIME multipart if attachments)
    if attachments:
        message = MIMEMultipart()
        message.attach(MIMEText(body, "html"))
        for attachment in attachments:
            part = MIMEBase("application", "octet-stream")
            part.set_payload(attachment["data"])
            encoders.encode_base64(part)
            part.add_header("Content-Disposition", f"attachment; filename={attachment['filename']}")
            message.attach(part)
    else:
        message = EmailMessage()
        message.set_content(body, subtype="html")
    
    message["From"] = smtp_config.from_email
    message["To"] = to_email
    message["Subject"] = subject
    
    # Send via aiosmtplib (async)
    await aiosmtplib.send(
        message,
        hostname=smtp_config.host,
        port=smtp_config.port,
        username=smtp_config.username,
        password=smtp_config.password.replace(" ", ""),  # Handle Gmail app password spaces
        start_tls=True
    )
```

#### 4.4 File Attachments

**Attachment Data Model:**
```python
class Attachment(Base):
    __tablename__ = "attachments"
    
    id = Column(Integer, primary_key=True)
    filename = Column(String(255))       # Original filename
    content_type = Column(String(100))   # MIME type
    file_data = Column(LargeBinary)      # Binary file content
    file_size = Column(Integer)          # Size in bytes
    campaign_id = Column(Integer, ForeignKey("campaigns.id"))
```

**Attachment Limits:**
- Maximum file size: 25MB (Gmail limit)
- Multiple attachments supported per campaign
- Common types: PDF, images, documents

---

### 5. Dashboard & Analytics

The dashboard provides a comprehensive overview of email marketing performance.

#### 5.1 Dashboard Metrics

**Statistics Endpoint Response:**
```json
{
    "total_campaigns": 15,
    "sent_emails": 1250,
    "failed_emails": 23,
    "pending_emails": 0,
    "success_rate": 98.2,
    "total_emails": 1273,
    "campaigns_by_status": {
        "draft": 3,
        "completed": 10,
        "sending": 1,
        "failed": 1
    },
    "recent_campaigns": [
        {
            "id": 15,
            "name": "November Newsletter",
            "status": "completed",
            "created_at": "2024-11-15T10:30:00Z"
        }
    ]
}
```

#### 5.2 Visual Analytics

**Email Status Distribution (Pie Chart):**
- Sent (Green): Successfully delivered emails
- Failed (Red): Delivery failures
- Pending (Yellow): Awaiting processing

**Campaigns by Status (Bar Chart):**
- Visual breakdown of campaign statuses
- Quick identification of active/completed campaigns

#### 5.3 Recent Campaigns List

- Quick access to latest campaigns
- Status badges with color coding
- Click-through to campaign details
- Creation date display


---

## Technical Implementation

### 1. System Architecture

NovaMailer follows a modern three-tier architecture with clear separation of concerns:

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                              PRESENTATION LAYER                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                     Next.js 16 Frontend Application                       │  │
│  │                                                                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │  │
│  │  │    Auth     │  │  Dashboard  │  │  Campaigns  │  │  Templates  │     │  │
│  │  │   Module    │  │   Module    │  │   Module    │  │   Module    │     │  │
│  │  │             │  │             │  │             │  │             │     │  │
│  │  │ • Login     │  │ • Stats     │  │ • List      │  │ • List      │     │  │
│  │  │ • Register  │  │ • Charts    │  │ • Create    │  │ • Create    │     │  │
│  │  │ • Verify    │  │ • Recent    │  │ • Details   │  │ • Edit      │     │  │
│  │  │ • Reset     │  │   Activity  │  │ • Send      │  │ • Preview   │     │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │  │
│  │                                                                           │  │
│  │  ┌─────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                    Shared Components (shadcn/ui)                     │ │  │
│  │  │  Button | Card | Form | Input | Table | Dialog | Toast | OTP Input  │ │  │
│  │  └─────────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ REST API (Axios HTTP Client)
                                        │ JWT Bearer Token Authentication
                                        ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                              APPLICATION LAYER                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                      FastAPI Backend Application                          │  │
│  │                                                                           │  │
│  │  ┌─────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                         API ROUTERS                                  │ │  │
│  │  │  /auth      │  /campaigns  │  /templates  │  /smtp  │  /stats       │ │  │
│  │  │  • login    │  • CRUD      │  • CRUD      │  • get  │  • dashboard  │ │  │
│  │  │  • register │  • upload    │              │  • save │               │ │  │
│  │  │  • verify   │  • preview   │              │         │               │ │  │
│  │  │  • reset    │  • send      │              │         │               │ │  │
│  │  └─────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                           │  │
│  │  ┌─────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                       BUSINESS SERVICES                              │ │  │
│  │  │  OTP Service    │  Email Service  │  CSV Service  │  Template Svc   │ │  │
│  │  │  • generate     │  • send_email   │  • parse_csv  │  • render       │ │  │
│  │  │  • verify       │  • attachments  │  • validate   │  • variables    │ │  │
│  │  │  • send_email   │  • SMTP config  │               │                 │ │  │
│  │  └─────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                           │  │
│  │  ┌─────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                         CORE MODULES                                 │ │  │
│  │  │  Security       │  Database       │  Config                         │ │  │
│  │  │  • JWT tokens   │  • SQLAlchemy   │  • Environment                  │ │  │
│  │  │  • Password     │  • Async        │  • Settings                     │ │  │
│  │  │    hashing      │    sessions     │                                 │ │  │
│  │  └─────────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ SQLAlchemy ORM (Async)
                                        ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                                DATA LAYER                                       │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                         Database Schema                                   │  │
│  │                                                                           │  │
│  │  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐              │  │
│  │  │  Users  │───▶│   OTP   │    │  SMTP   │◀───│  Users  │              │  │
│  │  └─────────┘    └─────────┘    │ Config  │    └─────────┘              │  │
│  │       │                        └─────────┘                              │  │
│  │       │                                                                  │  │
│  │       ▼                                                                  │  │
│  │  ┌─────────┐    ┌─────────┐    ┌─────────┐                             │  │
│  │  │Campaign │───▶│Recipient│    │Attachment│◀───┐                        │  │
│  │  └─────────┘    └─────────┘    └─────────┘    │                        │  │
│  │       │                                        │                        │  │
│  │       └────────────────────────────────────────┘                        │  │
│  │                                                                           │  │
│  │  ┌─────────┐                                                             │  │
│  │  │Template │                                                             │  │
│  │  └─────────┘                                                             │  │
│  │                                                                           │  │
│  │  Development: SQLite (novamailer.db)                                     │  │
│  │  Production:  PostgreSQL / Azure SQL / MySQL                             │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────┘
```

### 2. Backend Architecture

#### 2.1 Directory Structure

```
backend/
├── app/
│   ├── __init__.py              # Package initialization
│   ├── deps.py                  # Dependency injection (get_current_user)
│   │
│   ├── core/                    # Core application modules
│   │   ├── __init__.py
│   │   ├── config.py            # Pydantic settings management
│   │   │   └── Settings class with:
│   │   │       - SECRET_KEY
│   │   │       - ALGORITHM (HS256)
│   │   │       - ACCESS_TOKEN_EXPIRE_MINUTES
│   │   │       - DATABASE_URL
│   │   │       - CORS_ORIGINS
│   │   │
│   │   ├── database.py          # Database connection setup
│   │   │   └── AsyncSession configuration
│   │   │   └── Base declarative model
│   │   │   └── get_db() dependency
│   │   │
│   │   └── security.py          # Security utilities
│   │       └── verify_password()
│   │       └── get_password_hash()
│   │       └── create_access_token()
│   │
│   ├── models/                  # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── user.py              # User model
│   │   ├── otp.py               # OTP tokens model
│   │   ├── campaign.py          # Campaign model
│   │   ├── recipient.py         # Recipient model
│   │   ├── template.py          # Template model
│   │   ├── smtp.py              # SMTP configuration model
│   │   └── attachment.py        # File attachment model
│   │
│   ├── schemas/                 # Pydantic validation schemas
│   │   ├── __init__.py
│   │   ├── user.py              # User request/response schemas
│   │   ├── campaign.py          # Campaign schemas
│   │   ├── recipient.py         # Recipient schemas
│   │   ├── template.py          # Template schemas
│   │   ├── smtp.py              # SMTP schemas
│   │   └── attachment.py        # Attachment schemas
│   │
│   ├── routers/                 # API route handlers
│   │   ├── __init__.py
│   │   ├── auth.py              # Authentication endpoints
│   │   │   └── POST /login
│   │   │   └── POST /register
│   │   │   └── POST /verify-email
│   │   │   └── POST /verify-login
│   │   │   └── POST /forgot-password
│   │   │   └── POST /reset-password
│   │   │   └── GET /me
│   │   │
│   │   ├── campaigns.py         # Campaign management
│   │   │   └── GET /campaigns
│   │   │   └── POST /campaigns
│   │   │   └── GET /campaigns/{id}
│   │   │   └── GET /campaigns/{id}/details
│   │   │   └── POST /campaigns/{id}/upload-csv
│   │   │   └── POST /campaigns/{id}/preview
│   │   │   └── POST /campaigns/{id}/test-send
│   │   │   └── POST /campaigns/{id}/send
│   │   │   └── POST /campaigns/{id}/attachments
│   │   │   └── GET /campaigns/{id}/attachments
│   │   │   └── DELETE /campaigns/{id}/attachments/{aid}
│   │   │
│   │   ├── templates.py         # Template management
│   │   │   └── GET /templates
│   │   │   └── POST /templates
│   │   │
│   │   ├── smtp.py              # SMTP configuration
│   │   │   └── GET /smtp
│   │   │   └── POST /smtp
│   │   │
│   │   ├── stats.py             # Dashboard statistics
│   │   │   └── GET /stats/dashboard
│   │   │
│   │   └── uploads.py           # File upload handling
│   │
│   └── services/                # Business logic services
│       ├── __init__.py
│       ├── otp_service.py       # OTP generation and verification
│       ├── email.py             # SMTP email sending
│       ├── csv_service.py       # CSV parsing with pandas
│       └── template_service.py  # Jinja2 template rendering
│
├── main.py                      # FastAPI application entry point
├── requirements.txt             # Python dependencies
├── Dockerfile                   # Container configuration
├── Dockerfile.prod              # Production container
├── app.yaml                     # Google Cloud App Engine config
├── railway.json                 # Railway deployment config
└── Procfile                     # Heroku/Railway process file
```

#### 2.2 API Endpoints Reference

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Create new user account | No |
| POST | `/auth/login` | Authenticate user | No |
| POST | `/auth/verify-email` | Verify email with OTP | No |
| POST | `/auth/verify-login` | Complete 2FA login | No |
| POST | `/auth/forgot-password` | Request password reset | No |
| POST | `/auth/reset-password` | Reset password with OTP | No |
| GET | `/auth/me` | Get current user info | Yes |
| GET | `/campaigns` | List user's campaigns | Yes |
| POST | `/campaigns` | Create new campaign | Yes |
| GET | `/campaigns/{id}` | Get campaign by ID | Yes |
| GET | `/campaigns/{id}/details` | Get campaign with stats | Yes |
| POST | `/campaigns/{id}/upload-csv` | Upload recipients CSV | Yes |
| POST | `/campaigns/{id}/preview` | Preview rendered email | Yes |
| POST | `/campaigns/{id}/test-send` | Send test email | Yes |
| POST | `/campaigns/{id}/send` | Execute campaign | Yes |
| POST | `/campaigns/{id}/attachments` | Upload attachment | Yes |
| GET | `/campaigns/{id}/attachments` | List attachments | Yes |
| DELETE | `/campaigns/{id}/attachments/{aid}` | Delete attachment | Yes |
| GET | `/templates` | List user's templates | Yes |
| POST | `/templates` | Create new template | Yes |
| GET | `/smtp` | Get SMTP configuration | Yes |
| POST | `/smtp` | Save SMTP configuration | Yes |
| GET | `/stats/dashboard` | Get dashboard statistics | Yes |


### 3. Frontend Architecture

#### 3.1 Directory Structure

```
frontend/
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── (auth)/                    # Authentication route group
│   │   │   ├── login/
│   │   │   │   └── page.tsx           # Login page with OTP support
│   │   │   │       Features:
│   │   │   │       - Email/password form
│   │   │   │       - 2FA OTP verification
│   │   │   │       - Forgot password link
│   │   │   │       - Register redirect
│   │   │   │
│   │   │   ├── register/
│   │   │   │   └── page.tsx           # Registration page
│   │   │   │       Features:
│   │   │   │       - Full name, email, password
│   │   │   │       - Password confirmation
│   │   │   │       - Zod validation
│   │   │   │       - Auto-redirect to verify
│   │   │   │
│   │   │   ├── verify-email/
│   │   │   │   └── page.tsx           # Email verification page
│   │   │   │       Features:
│   │   │   │       - 6-digit OTP input
│   │   │   │       - Resend code option
│   │   │   │       - Auto-focus navigation
│   │   │   │       - Paste support
│   │   │   │
│   │   │   └── forgot-password/
│   │   │       └── page.tsx           # Password reset flow
│   │   │
│   │   ├── (dashboard)/               # Dashboard route group
│   │   │   ├── layout.tsx             # Dashboard layout with sidebar
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx           # Main dashboard
│   │   │   │       Features:
│   │   │   │       - Stats cards (campaigns, sent, failed, rate)
│   │   │   │       - Pie chart (email status)
│   │   │   │       - Bar chart (campaigns by status)
│   │   │   │       - Recent campaigns list
│   │   │   │
│   │   │   ├── campaigns/
│   │   │   │   ├── page.tsx           # Campaigns list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx       # Create campaign
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx       # Campaign details
│   │   │   │           Features:
│   │   │   │           - Campaign info display
│   │   │   │           - CSV upload
│   │   │   │           - Recipients table
│   │   │   │           - Preview modal
│   │   │   │           - Test send
│   │   │   │           - Send campaign
│   │   │   │           - Attachment management
│   │   │   │
│   │   │   ├── templates/
│   │   │   │   ├── page.tsx           # Templates list
│   │   │   │   └── new/
│   │   │   │       └── page.tsx       # Create template
│   │   │   │
│   │   │   └── settings/
│   │   │       └── page.tsx           # SMTP configuration
│   │   │           Features:
│   │   │           - Host/port configuration
│   │   │           - Username/password
│   │   │           - From email
│   │   │           - Update existing config
│   │   │
│   │   ├── layout.tsx                 # Root layout
│   │   ├── page.tsx                   # Landing page (redirects)
│   │   ├── globals.css                # Global styles (Tailwind)
│   │   └── favicon.ico
│   │
│   ├── components/
│   │   ├── ui/                        # shadcn/ui components
│   │   │   ├── avatar.tsx
│   │   │   ├── button.tsx             # Button variants
│   │   │   ├── card.tsx               # Card container
│   │   │   ├── dialog.tsx             # Modal dialogs
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx               # React Hook Form integration
│   │   │   ├── input.tsx              # Text inputs
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx             # Dropdown select
│   │   │   ├── separator.tsx
│   │   │   ├── sonner.tsx             # Toast notifications
│   │   │   ├── table.tsx              # Data tables
│   │   │   └── textarea.tsx           # Multi-line input
│   │   │
│   │   ├── sidebar.tsx                # Navigation sidebar
│   │   │   Features:
│   │   │   - NovaMailer branding
│   │   │   - Dashboard link
│   │   │   - Campaigns link
│   │   │   - Templates link
│   │   │   - Settings link
│   │   │   - Logout button
│   │   │   - Active state highlighting
│   │   │
│   │   └── otp-input.tsx              # Custom OTP input component
│   │       Features:
│   │       - 6 individual digit inputs
│   │       - Auto-focus on next input
│   │       - Backspace navigation
│   │       - Paste support (full code)
│   │       - Auto-submit option
│   │       - Disabled state
│   │
│   └── lib/
│       ├── api.ts                     # Axios instance configuration
│       │   Features:
│       │   - Base URL configuration
│       │   - JWT token interceptor
│       │   - Error handling
│       │   - 401 redirect to login
│       │
│       └── utils.ts                   # Utility functions
│           - cn() for className merging
│
├── public/                            # Static assets
├── package.json                       # Dependencies
├── tsconfig.json                      # TypeScript configuration
├── tailwind.config.ts                 # Tailwind CSS configuration
├── next.config.ts                     # Next.js configuration
├── Dockerfile                         # Container configuration
├── Dockerfile.prod                    # Production container
└── vercel.json                        # Vercel deployment config
```

#### 3.2 Component Details

**OTP Input Component (`otp-input.tsx`):**

This custom component provides a professional OTP entry experience:

```typescript
interface OTPInputProps {
    length?: number           // Number of digits (default: 6)
    onComplete: (code: string) => void  // Called when all digits entered
    onChange?: (code: string, isComplete: boolean) => void
    disabled?: boolean        // Disable input during verification
    autoSubmit?: boolean      // Auto-submit when complete
}
```

**Key Features:**
- Individual input boxes for each digit
- Automatic focus advancement on digit entry
- Backspace moves to previous input
- Full code paste support (clipboard)
- Visual feedback during verification
- Keyboard-only navigation support

**Sidebar Component (`sidebar.tsx`):**

```typescript
const sidebarItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Campaigns", href: "/campaigns", icon: Mail },
    { name: "Templates", href: "/templates", icon: FileText },
    { name: "Settings", href: "/settings", icon: Settings },
]
```

**Features:**
- Fixed width (256px) on desktop
- Hidden on mobile (responsive)
- Active route highlighting
- Logout with token clearing
- Lucide React icons

#### 3.3 State Management

NovaMailer uses React's built-in state management:

**Local State (useState):**
- Form inputs
- Loading states
- Modal visibility
- API response data

**Form State (React Hook Form):**
- Form validation
- Error messages
- Submit handling
- Field registration

**Authentication State:**
- JWT token in localStorage
- Axios interceptor for headers
- Redirect on 401 responses

#### 3.4 API Integration

**Axios Configuration (`api.ts`):**
```typescript
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
})

// Request interceptor - add JWT token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Response interceptor - handle 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)
```

### 4. Database Schema

#### 4.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE SCHEMA                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐         ┌─────────────────┐                           │
│  │      USERS      │         │       OTP       │                           │
│  ├─────────────────┤         ├─────────────────┤                           │
│  │ id (PK)         │────────▶│ id (PK)         │                           │
│  │ email (UNIQUE)  │         │ user_id (FK)    │                           │
│  │ hashed_password │         │ code            │                           │
│  │ full_name       │         │ purpose         │                           │
│  │ is_active       │         │ expires_at      │                           │
│  │ email_verified  │         │ used            │                           │
│  │ two_factor_enabled       │ created_at      │                           │
│  └─────────────────┘         └─────────────────┘                           │
│           │                                                                  │
│           │                                                                  │
│           ▼                                                                  │
│  ┌─────────────────┐         ┌─────────────────┐                           │
│  │   SMTP_CONFIGS  │         │    TEMPLATES    │                           │
│  ├─────────────────┤         ├─────────────────┤                           │
│  │ id (PK)         │         │ id (PK)         │                           │
│  │ user_id (FK)    │         │ user_id (FK)    │                           │
│  │ host            │         │ name            │                           │
│  │ port            │         │ content         │                           │
│  │ username        │         └─────────────────┘                           │
│  │ password        │                                                        │
│  │ from_email      │                                                        │
│  └─────────────────┘                                                        │
│           │                                                                  │
│           │                                                                  │
│           ▼                                                                  │
│  ┌─────────────────┐         ┌─────────────────┐         ┌───────────────┐ │
│  │    CAMPAIGNS    │         │   RECIPIENTS    │         │  ATTACHMENTS  │ │
│  ├─────────────────┤         ├─────────────────┤         ├───────────────┤ │
│  │ id (PK)         │────────▶│ id (PK)         │         │ id (PK)       │ │
│  │ user_id (FK)    │         │ campaign_id (FK)│         │ campaign_id   │ │
│  │ name            │         │ email           │         │ filename      │ │
│  │ subject         │         │ data (JSON)     │         │ content_type  │ │
│  │ body            │         │ status          │         │ file_data     │ │
│  │ status          │         └─────────────────┘         │ file_size     │ │
│  │ created_at      │◀────────────────────────────────────┤               │ │
│  └─────────────────┘                                     └───────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 4.2 Table Definitions

**Users Table:**
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE
);
CREATE INDEX ix_users_email ON users(email);
```

**OTP Table:**
```sql
CREATE TABLE otp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    code VARCHAR(6) NOT NULL,
    purpose VARCHAR(50) NOT NULL,  -- registration, login, password_reset
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Campaigns Table:**
```sql
CREATE TABLE campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',  -- draft, sending, completed, failed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Recipients Table:**
```sql
CREATE TABLE recipients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) NOT NULL,
    data JSON,  -- Stores all CSV columns
    status VARCHAR(50) DEFAULT 'pending',  -- pending, sent, failed
    campaign_id INTEGER NOT NULL,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);
```

**Templates Table:**
```sql
CREATE TABLE templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**SMTP Configs Table:**
```sql
CREATE TABLE smtp_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    host VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    from_email VARCHAR(255) NOT NULL,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Attachments Table:**
```sql
CREATE TABLE attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100),
    file_data BLOB NOT NULL,
    file_size INTEGER NOT NULL,
    campaign_id INTEGER NOT NULL,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);
```


### 5. Deployment Architecture

NovaMailer supports multiple deployment options:

#### 5.1 Docker Deployment

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/novamailer
    depends_on:
      - db

  frontend:
    build: ./frontend
    command: npm run dev
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - backend

  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=novamailer
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

#### 5.2 Cloud Deployment Options

| Platform | Frontend | Backend | Database | Estimated Cost |
|----------|----------|---------|----------|----------------|
| Azure | App Service | App Service | Azure SQL | $0-50/month |
| GCP | Cloud Run | Cloud Run | Cloud SQL | $0-40/month |
| Vercel + Railway | Vercel | Railway | Railway Postgres | $0-20/month |
| Self-hosted | Docker | Docker | PostgreSQL | Server cost only |

---

## UI/UX Highlights

### 1. Design System

#### 1.1 Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Blue | #4F46E5 | Buttons, links, accents |
| Success Green | #10B981 | Success states, sent status |
| Error Red | #EF4444 | Error states, failed status |
| Warning Yellow | #F59E0B | Pending states, warnings |
| Neutral Gray | #6B7280 | Text, borders, backgrounds |
| Background Light | #F9FAFB | Page backgrounds |
| Background Dark | #111827 | Dark mode backgrounds |

#### 1.2 Typography

```css
/* Font Stack */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
             'Helvetica Neue', Arial, sans-serif;

/* Heading Sizes */
h1: 2.25rem (36px) - Page titles
h2: 1.875rem (30px) - Section headers
h3: 1.5rem (24px) - Card titles
h4: 1.25rem (20px) - Subsections

/* Body Text */
Base: 1rem (16px)
Small: 0.875rem (14px)
Extra Small: 0.75rem (12px)
```

#### 1.3 Spacing System

```css
/* Tailwind Spacing Scale */
space-1: 0.25rem (4px)
space-2: 0.5rem (8px)
space-3: 0.75rem (12px)
space-4: 1rem (16px)
space-6: 1.5rem (24px)
space-8: 2rem (32px)
```

### 2. Component Library (shadcn/ui)

NovaMailer uses shadcn/ui, a collection of reusable components built with Radix UI and Tailwind CSS.

#### 2.1 Button Component

```typescript
// Variants
<Button variant="default">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="ghost">Subtle Action</Button>
<Button variant="destructive">Danger Action</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>

// States
<Button disabled>Disabled</Button>
<Button disabled>{isLoading ? "Loading..." : "Submit"}</Button>
```

#### 2.2 Card Component

```typescript
<Card>
    <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description text</CardDescription>
    </CardHeader>
    <CardContent>
        {/* Main content */}
    </CardContent>
    <CardFooter>
        {/* Actions */}
    </CardFooter>
</Card>
```

#### 2.3 Form Component

```typescript
<Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                        <Input placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />  {/* Validation errors */}
                </FormItem>
            )}
        />
        <Button type="submit">Submit</Button>
    </form>
</Form>
```

#### 2.4 Table Component

```typescript
<Table>
    <TableHeader>
        <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
        </TableRow>
    </TableHeader>
    <TableBody>
        {items.map((item) => (
            <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>
                    <Badge variant={item.status}>{item.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                    <Button variant="ghost" size="sm">View</Button>
                </TableCell>
            </TableRow>
        ))}
    </TableBody>
</Table>
```

### 3. User Flows

#### 3.1 Registration Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REGISTRATION FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   Landing   │    │  Register   │    │   Verify    │    │   Login     │  │
│  │    Page     │───▶│    Form     │───▶│   Email     │───▶│    Page     │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
│                            │                  │                             │
│                            ▼                  ▼                             │
│                     ┌─────────────┐    ┌─────────────┐                     │
│                     │  Validation │    │  OTP Input  │                     │
│                     │   Errors    │    │  (6 digits) │                     │
│                     └─────────────┘    └─────────────┘                     │
│                                               │                             │
│                                               ▼                             │
│                                        ┌─────────────┐                     │
│                                        │   Resend    │                     │
│                                        │    Code     │                     │
│                                        └─────────────┘                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 3.2 Campaign Creation Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CAMPAIGN CREATION FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │  Campaigns  │    │   Create    │    │   Upload    │    │   Preview   │  │
│  │    List     │───▶│  Campaign   │───▶│    CSV      │───▶│   Email     │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
│                            │                  │                  │          │
│                            ▼                  ▼                  ▼          │
│                     ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│                     │ Name/Subject│    │  Recipients │    │  Rendered   │  │
│                     │    Body     │    │   Added     │    │   Content   │  │
│                     └─────────────┘    └─────────────┘    └─────────────┘  │
│                                                                  │          │
│                                                                  ▼          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │  Campaign   │    │   Monitor   │    │    Send     │    │    Test     │  │
│  │  Complete   │◀───│  Progress   │◀───│  Campaign   │◀───│    Send     │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4. Responsive Design

#### 4.1 Breakpoints

```css
/* Tailwind CSS Breakpoints */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices (tablets) */
lg: 1024px  /* Large devices (desktops) */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X large devices */
```

#### 4.2 Layout Adaptations

**Desktop (≥768px):**
- Fixed 256px sidebar
- Full content area
- Multi-column forms
- Expanded tables

**Mobile (<768px):**
- Hidden sidebar (hamburger menu planned)
- Full-width content
- Single-column forms
- Scrollable tables

### 5. Accessibility Features

- **Semantic HTML**: Proper heading hierarchy, landmarks
- **ARIA Labels**: Screen reader support for interactive elements
- **Keyboard Navigation**: Tab order, focus management
- **Color Contrast**: WCAG 2.1 AA compliant
- **Focus Indicators**: Visible focus states
- **Error Messages**: Associated with form fields
- **Loading States**: Announced to screen readers

### 6. Toast Notifications (Sonner)

```typescript
// Success notification
toast.success("Campaign sent successfully!")

// Error notification
toast.error("Failed to send email")

// Info notification
toast.info("OTP sent to your email")

// Loading notification
toast.loading("Sending emails...")
```

**Features:**
- Non-intrusive positioning (bottom-right)
- Auto-dismiss after 4 seconds
- Stacking for multiple notifications
- Swipe to dismiss on mobile


---

## Technical Stack

### 1. Backend Technologies

| Technology | Version | Purpose | Key Features |
|------------|---------|---------|--------------|
| **Python** | 3.11+ | Runtime | Type hints, async/await, modern syntax |
| **FastAPI** | Latest | Web Framework | Async support, automatic OpenAPI docs, dependency injection, Pydantic integration |
| **SQLAlchemy** | 2.x | ORM | Async support, relationship mapping, query builder |
| **Pydantic** | 2.x | Validation | Data validation, serialization, settings management |
| **Uvicorn** | Latest | ASGI Server | High-performance async server, hot reload |
| **Gunicorn** | Latest | Process Manager | Production deployment, worker management |
| **python-jose** | Latest | JWT | Token creation, verification, claims handling |
| **bcrypt** | Latest | Password Hashing | Secure password storage, salt generation |
| **aiosmtplib** | Latest | Email Client | Async SMTP, TLS support, attachments |
| **Pandas** | Latest | Data Processing | CSV parsing, data manipulation |
| **Jinja2** | Latest | Templating | Variable substitution, conditionals, loops |
| **email-validator** | Latest | Validation | Email format validation |

#### 1.1 FastAPI Features Used

```python
# Dependency Injection
@router.get("/campaigns")
async def get_campaigns(
    db: AsyncSession = Depends(get_db),           # Database session
    current_user: User = Depends(get_current_user) # Auth check
):
    pass

# Request Validation (Pydantic)
class CampaignCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    subject: str = Field(..., min_length=1, max_length=500)
    body: str

# Response Models
@router.get("/campaigns", response_model=List[CampaignSchema])

# File Uploads
@router.post("/upload-csv")
async def upload(file: UploadFile = File(...)):
    pass

# Query Parameters
@router.post("/test-send")
async def test_send(
    test_email: str = Query(..., description="Email to send test to")
):
    pass

# Path Parameters
@router.get("/campaigns/{campaign_id}")
async def get_campaign(campaign_id: int):
    pass
```

#### 1.2 SQLAlchemy Async Usage

```python
# Async Session
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

engine = create_async_engine(DATABASE_URL, echo=True)
async_session = sessionmaker(engine, class_=AsyncSession)

# Async Queries
async def get_campaigns(db: AsyncSession, user_id: int):
    result = await db.execute(
        select(Campaign)
        .filter(Campaign.user_id == user_id)
        .order_by(Campaign.created_at.desc())
    )
    return result.scalars().all()

# Async Aggregations
stats = await db.execute(
    select(
        func.count(Recipient.id).label('total'),
        func.sum(case((Recipient.status == 'sent', 1), else_=0)).label('sent')
    ).filter(Recipient.campaign_id == campaign_id)
)
```

### 2. Frontend Technologies

| Technology | Version | Purpose | Key Features |
|------------|---------|---------|--------------|
| **Next.js** | 16.0.5 | Framework | App Router, Server Components, API Routes |
| **React** | 19.2.0 | UI Library | Hooks, Concurrent Features, Suspense |
| **TypeScript** | 5.x | Language | Type safety, IntelliSense, refactoring |
| **Tailwind CSS** | 4.x | Styling | Utility-first, responsive, dark mode |
| **shadcn/ui** | Latest | Components | Radix UI primitives, customizable |
| **React Hook Form** | 7.x | Forms | Performance, validation, field arrays |
| **Zod** | 4.x | Validation | Schema validation, TypeScript inference |
| **Axios** | 1.x | HTTP Client | Interceptors, request/response handling |
| **Recharts** | 2.x | Charts | Responsive charts, customizable |
| **Lucide React** | Latest | Icons | Tree-shakeable, consistent design |
| **Sonner** | 2.x | Toasts | Accessible, customizable notifications |
| **next-themes** | Latest | Theming | Dark mode, system preference |

---

## Frontend Technologies

### 1. Next.js 16 App Router

NovaMailer leverages the latest Next.js App Router architecture:

#### 1.1 Route Groups

```
app/
├── (auth)/           # Authentication routes (no layout)
│   ├── login/
│   ├── register/
│   └── verify-email/
│
└── (dashboard)/      # Dashboard routes (with sidebar layout)
    ├── layout.tsx    # Shared sidebar layout
    ├── dashboard/
    ├── campaigns/
    ├── templates/
    └── settings/
```

**Benefits:**
- Logical route organization
- Shared layouts per group
- Clean URL structure

#### 1.2 Client Components

```typescript
"use client"  // Required for client-side interactivity

import { useState, useEffect } from "react"

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState([])
    
    useEffect(() => {
        // Client-side data fetching
        fetchCampaigns()
    }, [])
    
    return <div>{/* Interactive UI */}</div>
}
```

#### 1.3 Layout System

```typescript
// app/(dashboard)/layout.tsx
export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen overflow-hidden">
            <div className="w-64 hidden md:block">
                <Sidebar />
            </div>
            <div className="flex-1 overflow-y-auto p-8">
                {children}
            </div>
        </div>
    )
}
```

### 2. React 19 Features

#### 2.1 Hooks Usage

```typescript
// State Management
const [isLoading, setIsLoading] = useState(false)
const [campaigns, setCampaigns] = useState<Campaign[]>([])

// Side Effects
useEffect(() => {
    const fetchData = async () => {
        const response = await api.get('/campaigns')
        setCampaigns(response.data)
    }
    fetchData()
}, [])

// Refs for DOM access
const inputRefs = useRef<(HTMLInputElement | null)[]>([])

// Router hooks
const router = useRouter()
const pathname = usePathname()
const searchParams = useSearchParams()
```

#### 2.2 Suspense for Loading States

```typescript
import { Suspense } from "react"

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    )
}
```

### 3. TypeScript Integration

#### 3.1 Type Definitions

```typescript
// API Response Types
interface Campaign {
    id: number
    name: string
    subject: string
    body: string
    status: 'draft' | 'sending' | 'completed' | 'failed'
    created_at: string
    user_id: number
}

interface Recipient {
    id: number
    email: string
    status: 'pending' | 'sent' | 'failed'
    data: Record<string, any>
}

interface DashboardStats {
    total_campaigns: number
    sent_emails: number
    failed_emails: number
    success_rate: number
    campaigns_by_status: Record<string, number>
    recent_campaigns: Campaign[]
}
```

#### 3.2 Form Validation with Zod

```typescript
import * as z from "zod"

// Registration Schema
const registerSchema = z.object({
    email: z.string().email("Invalid email address"),
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

// SMTP Configuration Schema
const smtpSchema = z.object({
    host: z.string().min(1, "Host is required"),
    port: z.number().min(1, "Port is required"),
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
    from_email: z.string().email("Invalid email"),
})

// Type inference
type RegisterFormData = z.infer<typeof registerSchema>
```

### 4. Tailwind CSS Styling

#### 4.1 Utility Classes

```typescript
// Responsive layout
<div className="flex flex-col md:flex-row gap-4">

// Conditional styling
<span className={`px-2 py-1 rounded-full text-xs font-medium ${
    status === 'completed' ? 'bg-green-100 text-green-800' :
    status === 'sending' ? 'bg-blue-100 text-blue-800' :
    status === 'failed' ? 'bg-red-100 text-red-800' :
    'bg-gray-100 text-gray-800'
}`}>

// Dark mode support
<div className="bg-gray-100 dark:bg-gray-800">

// Hover and focus states
<button className="hover:bg-blue-600 focus:ring-2 focus:ring-blue-500">
```

#### 4.2 Custom Animations

```css
/* Loading spinner */
.animate-spin {
    animation: spin 1s linear infinite;
}

/* Pulse effect for loading states */
.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### 5. React Hook Form Integration

```typescript
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        email: "",
        password: "",
    },
})

// Form submission
async function onSubmit(values: FormData) {
    setIsLoading(true)
    try {
        await api.post("/auth/login", values)
        toast.success("Login successful")
        router.push("/dashboard")
    } catch (error) {
        toast.error("Login failed")
    } finally {
        setIsLoading(false)
    }
}

// Form rendering
<Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                        <Input {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    </form>
</Form>
```

### 6. Data Visualization (Recharts)

```typescript
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'

// Pie Chart for email status
<PieChart width={400} height={300}>
    <Pie
        data={[
            { name: 'Sent', value: 95, color: '#10b981' },
            { name: 'Failed', value: 5, color: '#ef4444' },
        ]}
        cx="50%"
        cy="50%"
        outerRadius={80}
        dataKey="value"
        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
    >
        {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
        ))}
    </Pie>
    <Tooltip />
    <Legend />
</PieChart>

// Bar Chart for campaigns by status
<BarChart data={statusData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="status" />
    <YAxis />
    <Tooltip />
    <Bar dataKey="count" fill="#3b82f6" />
</BarChart>
```


---

## Project Conclusion

### 1. Project Summary

NovaMailer represents a complete, production-ready email marketing solution that successfully combines modern web technologies with practical business requirements. The platform demonstrates expertise in full-stack development, security implementation, and user experience design.

### 2. Key Achievements

#### 2.1 Technical Achievements

| Area | Achievement |
|------|-------------|
| **Architecture** | Clean separation of concerns with three-tier architecture |
| **Security** | Multi-layer authentication (JWT + OTP + 2FA) |
| **Performance** | Async operations throughout backend for scalability |
| **Type Safety** | End-to-end TypeScript (frontend) and Pydantic (backend) |
| **Code Quality** | Modular, maintainable codebase with clear patterns |
| **Deployment** | Multi-cloud support (Azure, GCP, Vercel, Railway, Docker) |

#### 2.2 Feature Achievements

| Feature | Status | Description |
|---------|--------|-------------|
| User Authentication | ✅ Complete | JWT-based with email verification |
| Two-Factor Auth | ✅ Complete | Optional OTP-based 2FA |
| Password Reset | ✅ Complete | Secure OTP-based recovery |
| Campaign Management | ✅ Complete | Full CRUD with status tracking |
| Template System | ✅ Complete | Jinja2-powered variable substitution |
| CSV Import | ✅ Complete | Pandas-based parsing with validation |
| Bulk Email Sending | ✅ Complete | Async SMTP with per-recipient tracking |
| File Attachments | ✅ Complete | Multi-file support up to 25MB |
| Dashboard Analytics | ✅ Complete | Charts and statistics |
| SMTP Configuration | ✅ Complete | Multi-provider support |
| Responsive UI | ✅ Complete | Desktop-optimized, mobile-aware |

#### 2.3 User Experience Achievements

- **Intuitive Workflow**: Settings → Templates → Campaigns flow
- **Real-time Feedback**: Toast notifications for all actions
- **Error Handling**: Clear, actionable error messages
- **Loading States**: Visual feedback during async operations
- **Preview Capability**: See emails before sending
- **Test Sending**: Verify campaigns before full execution

### 3. Technical Highlights

#### 3.1 Security Implementation

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Layer 1: Password Security                                      │
│  ├── bcrypt hashing with salt                                   │
│  ├── Minimum 6 character requirement                            │
│  └── Secure password reset flow                                 │
│                                                                  │
│  Layer 2: Email Verification                                     │
│  ├── OTP sent on registration                                   │
│  ├── 6-digit code, 10-minute expiry                            │
│  └── Account locked until verified                              │
│                                                                  │
│  Layer 3: Session Management                                     │
│  ├── JWT tokens with expiration                                 │
│  ├── HS256 algorithm                                            │
│  └── Automatic logout on token expiry                           │
│                                                                  │
│  Layer 4: Two-Factor Authentication (Optional)                   │
│  ├── OTP required on each login                                 │
│  ├── Sent to verified email                                     │
│  └── Previous OTPs invalidated                                  │
│                                                                  │
│  Layer 5: API Security                                           │
│  ├── CORS protection                                            │
│  ├── SQL injection prevention (ORM)                             │
│  └── Input validation (Pydantic/Zod)                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.2 Scalability Considerations

- **Async Backend**: Non-blocking I/O for database and email operations
- **Stateless API**: JWT tokens enable horizontal scaling
- **Database Flexibility**: SQLite for dev, PostgreSQL for production
- **Container Ready**: Docker support for consistent deployments
- **Cloud Native**: Designed for serverless and container platforms

### 4. Lessons Learned

#### 4.1 Technical Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| FastAPI over Flask | Async support, automatic docs, type hints | Excellent performance, developer experience |
| Next.js App Router | Latest React patterns, layouts, streaming | Modern architecture, good DX |
| shadcn/ui | Customizable, accessible, Tailwind-based | Consistent UI, rapid development |
| SQLAlchemy Async | Non-blocking database operations | Better scalability |
| Jinja2 Templates | Powerful, familiar syntax | Flexible email personalization |

#### 4.2 Challenges Overcome

1. **OTP Email Delivery**: Implemented fallback handling when SMTP not configured
2. **CSV Parsing**: Case-insensitive column matching for user flexibility
3. **Attachment Handling**: MIME multipart for mixed content emails
4. **Token Management**: Proper interceptor setup for seamless auth

### 5. Future Roadmap

#### 5.1 Planned Features

| Feature | Priority | Complexity | Description |
|---------|----------|------------|-------------|
| Email Scheduling | High | Medium | Schedule campaigns for future delivery |
| A/B Testing | High | High | Test subject lines and content variants |
| Advanced Analytics | High | Medium | Open rates, click tracking, heatmaps |
| Multi-language | Medium | Medium | i18n support for UI |
| Webhook Integration | Medium | Low | Notify external systems on events |
| API Documentation | Medium | Low | OpenAPI/Swagger UI |
| Mobile Sidebar | Medium | Low | Responsive hamburger menu |
| Template Library | Low | Medium | Pre-built template collection |
| Contact Lists | Low | Medium | Reusable recipient groups |
| Unsubscribe Management | Low | Medium | Compliance features |

#### 5.2 Technical Improvements

| Improvement | Priority | Description |
|-------------|----------|-------------|
| Test Coverage | High | Unit, integration, and E2E tests |
| Rate Limiting | High | API throttling for abuse prevention |
| Email Queue | High | Background job processing for large campaigns |
| Bounce Handling | Medium | Track and manage bounced emails |
| SPF/DKIM Guide | Medium | Email deliverability documentation |
| Caching Layer | Low | Redis for session and data caching |
| WebSocket Updates | Low | Real-time campaign progress |

### 6. Deployment Recommendations

#### 6.1 Production Checklist

- [ ] Set strong `SECRET_KEY` environment variable
- [ ] Configure production database (PostgreSQL recommended)
- [ ] Set up SSL/TLS certificates
- [ ] Configure CORS for production domain
- [ ] Set appropriate token expiration times
- [ ] Enable database backups
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting
- [ ] Review security headers

#### 6.2 Recommended Stack for Production

```
┌─────────────────────────────────────────────────────────────────┐
│                  RECOMMENDED PRODUCTION STACK                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Frontend:                                                       │
│  ├── Vercel (recommended) or Azure Static Web Apps              │
│  ├── CDN for static assets                                      │
│  └── Environment: NEXT_PUBLIC_API_URL                           │
│                                                                  │
│  Backend:                                                        │
│  ├── Azure App Service or Google Cloud Run                      │
│  ├── Gunicorn with Uvicorn workers                              │
│  └── Environment variables for secrets                          │
│                                                                  │
│  Database:                                                       │
│  ├── Azure SQL or Cloud SQL (PostgreSQL)                        │
│  ├── Connection pooling enabled                                 │
│  └── Automated backups                                          │
│                                                                  │
│  Email:                                                          │
│  ├── SendGrid or Amazon SES for production                      │
│  ├── Dedicated sending domain                                   │
│  └── SPF/DKIM/DMARC configured                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7. Final Notes

NovaMailer demonstrates a comprehensive approach to building a modern web application:

- **Clean Architecture**: Separation of concerns enables maintainability
- **Security First**: Multiple authentication layers protect user data
- **User-Centric Design**: Intuitive workflows reduce learning curve
- **Scalable Foundation**: Async operations and cloud-native design
- **Production Ready**: Docker, multi-cloud deployment support

The project serves as both a functional email marketing platform and a reference implementation for full-stack development best practices.

---

**NovaMailer** - Professional Email Marketing Made Simple 📧✨

*Documentation Version: 1.0*
*Last Updated: December 2024*
