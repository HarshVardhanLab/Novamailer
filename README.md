# 📧 NovaMailer - Email Marketing Platform

A complete email marketing platform with OTP verification, template management, and bulk email sending capabilities.

---

## ✨ Features

### Core Features
- 🔐 **User Authentication** - JWT-based authentication with OTP verification
- 📧 **Email Templates** - Create and manage reusable email templates
- 📊 **Campaign Management** - Create and track email campaigns
- 📤 **Bulk Email Sending** - Send emails to multiple recipients
- 📁 **CSV Upload** - Import recipients from CSV files
- 📎 **File Attachments** - Attach files to your emails
- 📈 **Statistics** - Track email campaign performance

### Security Features
- ✅ **Email Verification** - OTP-based email verification for new users
- ✅ **Two-Factor Authentication** - Optional 2FA for enhanced security
- ✅ **Password Reset** - Secure password reset with OTP
- ✅ **JWT Tokens** - Secure session management
- ✅ **Password Hashing** - Bcrypt password encryption

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd novamailer
   ```

2. **Start Backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python main.py
   ```

3. **Start Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000

---

## ☁️ Cloud Deployment

### Deploy to Azure (Recommended)

**Quick Deployment:**
```bash
# Install Azure CLI
brew install azure-cli  # macOS
# or download from: https://aka.ms/installazurecliwindows

# Login
az login

# Deploy
chmod +x deploy-azure.sh
./deploy-azure.sh
```

**Documentation:**
- `AZURE_QUICK_START.md` - Quick start guide
- `AZURE_DEPLOYMENT_GUIDE.md` - Comprehensive deployment guide

**Estimated Time:** 15-20 minutes
**Cost:** Free tier available, ~$0-10/month typical usage

---

## 📚 Documentation

### User Guides
- **`USER_GUIDE.md`** - Complete application user guide
- **`CAMPAIGNS_VS_TEMPLATES_EXPLAINED.md`** - Understanding campaigns and templates
- **`SUBJECT_VARIABLES_FIXED.md`** - Using variables in email subjects

### Technical Documentation
- **`OTP_FINAL_SUMMARY.md`** - OTP verification system details
- **`RUN_PROJECT.md`** - Local development setup
- **`PROJECT_STATUS.md`** - Project status and features

### Deployment Guides
- **`AZURE_QUICK_START.md`** - Quick Azure deployment
- **`AZURE_DEPLOYMENT_GUIDE.md`** - Detailed Azure deployment

---

## 🏗️ Architecture

### Backend (FastAPI)
- **Framework:** FastAPI
- **Database:** SQLite (dev) / PostgreSQL (prod)
- **Authentication:** JWT + OTP
- **Email:** SMTP integration

### Frontend (Next.js)
- **Framework:** Next.js 14
- **UI:** Tailwind CSS + shadcn/ui
- **State:** React Hooks
- **API:** Axios

---

## 🔧 Configuration

### Backend Environment Variables
```env
DATABASE_URL=sqlite:///./novamailer.db
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=http://localhost:3000
```

### Frontend Environment Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 📊 Tech Stack

### Backend
- FastAPI
- SQLAlchemy (ORM)
- Pydantic (validation)
- Python-JOSE (JWT)
- Passlib (password hashing)
- Uvicorn (ASGI server)

### Frontend
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui components
- React Hook Form
- Zod (validation)

### Database
- SQLite (development)
- PostgreSQL (production)

---

## 🔐 Security

- JWT-based authentication
- OTP verification for email
- Optional 2FA
- Password hashing with bcrypt
- CORS protection
- SQL injection protection
- XSS protection

---

## 💰 Cost Estimate (Azure)

### Free Tier
- 180,000 vCPU-seconds/month
- 360,000 GiB-seconds/month

### Typical Usage
- **Small** (< 10k emails/month): $0-10/month
- **Medium** (100k emails/month): $20-40/month
- **Large** (1M emails/month): $100-200/month

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📝 License

This project is licensed under the MIT License.

---

## 🆘 Support

For issues and questions:
- Check the documentation in the `docs` folder
- Review `USER_GUIDE.md` for application usage
- See `AZURE_DEPLOYMENT_GUIDE.md` for deployment help

---

## 🎯 Roadmap

- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] A/B testing
- [ ] Email scheduling
- [ ] Webhook integrations
- [ ] API documentation

---

**Built with ❤️ for email marketing**
