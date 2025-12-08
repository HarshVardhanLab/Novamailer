# NovaMailer User Guide 📧

## Complete Guide to Using Campaigns, Templates, and Settings

---

## 🎯 Overview

NovaMailer has three main sections:
1. **Settings** - Configure your email sending (SMTP)
2. **Templates** - Create reusable email templates
3. **Campaigns** - Send emails to multiple recipients

**Recommended Order:** Settings → Templates → Campaigns

---

## ⚙️ SETTINGS - Configure Email Sending

### What is Settings?
Settings is where you configure your SMTP (email server) credentials. This tells NovaMailer how to send emails on your behalf.

### Why You Need It?
Without SMTP configuration, you cannot send emails. It's like having a car without fuel.

### How to Configure Settings:

#### Step 1: Go to Settings
```
Navigate to: http://localhost:3000/settings
```

#### Step 2: Fill in SMTP Details

**For Gmail Users:**

```
SMTP Host:     smtp.gmail.com
SMTP Port:     587
Username:      your-email@gmail.com
Password:      your-app-password (NOT your regular password!)
From Email:    your-email@gmail.com
```

**Important for Gmail:**
- You MUST use an "App Password", not your regular Gmail password
- Enable 2-Factor Authentication first
- Generate App Password at: https://myaccount.google.com/apppasswords

**For Other Email Providers:**

| Provider | Host | Port |
|----------|------|------|
| Gmail | smtp.gmail.com | 587 |
| Outlook | smtp-mail.outlook.com | 587 |
| Yahoo | smtp.mail.yahoo.com | 587 |
| SendGrid | smtp.sendgrid.net | 587 |
| Mailgun | smtp.mailgun.org | 587 |

#### Step 3: Save Configuration
- Click "Save SMTP Configuration"
- You'll see a success message
- Your settings are now saved

### Testing Your SMTP:
After saving, the best way to test is:
1. Create a campaign
2. Use "Test Send" feature
3. Send to your own email
4. Check if you receive it

---

## 📝 TEMPLATES - Create Reusable Email Designs

### What are Templates?
Templates are pre-designed email layouts that you can reuse across multiple campaigns. Think of them as email blueprints.

### Why Use Templates?
- **Save Time:** Write once, use many times
- **Consistency:** Keep your brand consistent
- **Variables:** Personalize emails with recipient data
- **Efficiency:** No need to write HTML every time

### How to Create a Template:

#### Step 1: Go to Templates
```
Navigate to: http://localhost:3000/templates
```

#### Step 2: Click "New Template"

#### Step 3: Fill in Template Details

**Template Name:**
```
Example: "Welcome Email"
```

**Template Content (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; }
        .header { background: #4F46E5; color: white; padding: 20px; }
        .content { padding: 20px; }
        .button { background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Welcome to Our Service!</h1>
    </div>
    <div class="content">
        <p>Hi {{name}},</p>
        <p>Thank you for signing up! We're excited to have you.</p>
        <p>Your email: {{email}}</p>
        <p>Company: {{company}}</p>
        <p><a href="https://example.com" class="button">Get Started</a></p>
    </div>
</body>
</html>
```

#### Step 4: Save Template

### Template Variables (Personalization):

**What are Variables?**
Variables are placeholders that get replaced with actual recipient data.

**Syntax:**
```
{{variable_name}}
```

**Common Variables:**
```html
{{name}}        - Recipient's name
{{email}}       - Recipient's email
{{company}}     - Company name
{{first_name}}  - First name
{{last_name}}   - Last name
{{phone}}       - Phone number
{{custom_field}} - Any custom field from your CSV
```

**Example:**
```html
<p>Hello {{name}},</p>
<p>Your order #{{order_id}} has been shipped!</p>
<p>Tracking: {{tracking_number}}</p>
```

When sent to a recipient with data:
```json
{
  "name": "John Doe",
  "order_id": "12345",
  "tracking_number": "ABC123"
}
```

Becomes:
```html
<p>Hello John Doe,</p>
<p>Your order #12345 has been shipped!</p>
<p>Tracking: ABC123</p>
```

### Template Examples:

#### 1. Simple Text Email
```html
<p>Hi {{name}},</p>
<p>This is a simple email.</p>
<p>Thanks,<br>The Team</p>
```

#### 2. Newsletter Template
```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h1 style="color: #333;">Monthly Newsletter</h1>
    <p>Hi {{name}},</p>
    <h2>What's New This Month</h2>
    <ul>
        <li>Feature 1</li>
        <li>Feature 2</li>
        <li>Feature 3</li>
    </ul>
    <p>Best regards,<br>{{company}}</p>
</body>
</html>
```

#### 3. Promotional Email
```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial; text-align: center;">
    <h1 style="color: #e74c3c;">🎉 Special Offer for {{name}}!</h1>
    <p style="font-size: 24px;">Get {{discount}}% OFF</p>
    <p>Use code: <strong>{{promo_code}}</strong></p>
    <a href="{{shop_url}}" style="background: #e74c3c; color: white; padding: 15px 30px; text-decoration: none; display: inline-block; margin: 20px;">
        Shop Now
    </a>
    <p style="color: #666; font-size: 12px;">Offer expires: {{expiry_date}}</p>
</body>
</html>
```

---

## 📧 CAMPAIGNS - Send Emails to Multiple Recipients

### What are Campaigns?
Campaigns are email sending operations where you send an email (based on a template or custom content) to multiple recipients.

### Campaign Workflow:
```
1. Create Campaign
2. Upload Recipients (CSV)
3. Preview Email
4. Test Send
5. Send Campaign
6. Monitor Results
```

### How to Create and Send a Campaign:

#### Step 1: Create a Campaign

**Navigate to:**
```
http://localhost:3000/campaigns → Click "New Campaign"
```

**Fill in Details:**

**Campaign Name:**
```
Example: "Black Friday Sale 2024"
```
*This is for your reference only, recipients don't see it*

**Email Subject:**
```
Example: "🎉 50% OFF Everything - Black Friday Sale!"
```
*This is what recipients see in their inbox*

**Email Body:**
```html
<!DOCTYPE html>
<html>
<body>
    <h1>Hi {{name}}! 👋</h1>
    <p>We're offering an exclusive 50% discount just for you!</p>
    <p>Your personal code: <strong>{{discount_code}}</strong></p>
    <p>Shop now at: <a href="https://yourstore.com">Your Store</a></p>
    <p>This offer expires in 24 hours!</p>
</body>
</html>
```

**Click "Create Campaign"**

#### Step 2: Upload Recipients (CSV File)

**What is a CSV?**
A CSV (Comma-Separated Values) file is a spreadsheet that contains your recipient data.

**CSV Format:**
```csv
email,name,discount_code
john@example.com,John Doe,SAVE50JOHN
jane@example.com,Jane Smith,SAVE50JANE
bob@example.com,Bob Johnson,SAVE50BOB
```

**Required Column:**
- `email` - MUST be present (case-insensitive)

**Optional Columns:**
- Any other data you want to use in your template
- Column names become variable names

**Creating a CSV:**

**Option 1: Excel/Google Sheets**
1. Create a spreadsheet
2. First row = column headers (email, name, etc.)
3. Following rows = recipient data
4. Save as CSV

**Option 2: Text Editor**
```csv
email,name,company,discount
john@example.com,John Doe,Acme Corp,20%
jane@example.com,Jane Smith,Tech Inc,25%
```

**Upload CSV:**
1. Go to campaign detail page
2. Click "Upload CSV" or use the upload section
3. Select your CSV file
4. Click upload
5. See confirmation: "Successfully added X recipients"

#### Step 3: Preview Your Email

**Why Preview?**
- See how your email will look
- Check variable substitution
- Catch errors before sending

**How to Preview:**
1. Go to campaign detail page
2. Click "Preview" button
3. See rendered email with sample data
4. Verify everything looks correct

**What to Check:**
- ✅ Variables are replaced correctly
- ✅ HTML renders properly
- ✅ Links work
- ✅ Images display (if any)
- ✅ No typos

#### Step 4: Send Test Email

**Why Test Send?**
- Verify SMTP configuration works
- See email in your actual inbox
- Check spam folder placement
- Test on mobile device

**How to Test Send:**
1. Click "Test Send" button
2. Enter your email address
3. Click "Send Test"
4. Check your inbox (and spam folder)
5. Verify email looks good

**What to Check:**
- ✅ Email arrives
- ✅ Not in spam
- ✅ Renders correctly
- ✅ Links work
- ✅ Mobile-friendly

#### Step 5: Send Campaign

**Before Sending Checklist:**
- ✅ SMTP configured
- ✅ Recipients uploaded
- ✅ Email previewed
- ✅ Test email sent and verified
- ✅ Subject line checked
- ✅ No typos

**How to Send:**
1. Click "Send Campaign" button
2. Confirm the action
3. Watch real-time progress
4. Wait for completion

**What Happens:**
- Campaign status changes to "sending"
- Emails sent one by one
- Each recipient status updates (sent/failed)
- Campaign status changes to "completed"
- You see final results (sent count, failed count)

#### Step 6: Monitor Results

**View Campaign Details:**
- Total recipients
- Sent count (green)
- Pending count (yellow)
- Failed count (red)
- Individual recipient status

**Check Dashboard:**
- Overall success rate
- Total emails sent
- Campaign performance

---

## 🎯 Complete Example Workflow

### Scenario: Sending a Welcome Email to New Customers

#### 1. Configure SMTP (Settings)
```
Host: smtp.gmail.com
Port: 587
Username: yourcompany@gmail.com
Password: your-app-password
From: yourcompany@gmail.com
```

#### 2. Create Template (Optional)
```
Name: Welcome Email Template

Content:
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif;">
    <h1>Welcome {{name}}! 🎉</h1>
    <p>Thank you for joining {{company}}!</p>
    <p>Your account email: {{email}}</p>
    <p>Get started: <a href="https://yoursite.com/dashboard">Go to Dashboard</a></p>
</body>
</html>
```

#### 3. Create Campaign
```
Name: Welcome Campaign - November 2024
Subject: Welcome to Our Platform, {{name}}!
Body: [Use template or paste content]
```

#### 4. Prepare CSV
```csv
email,name,company
john@example.com,John Doe,Acme Corp
jane@example.com,Jane Smith,Tech Inc
bob@example.com,Bob Johnson,StartupXYZ
```

#### 5. Upload CSV
- Upload the file
- See: "Successfully added 3 recipients"

#### 6. Preview
- Click Preview
- Verify: "Welcome John Doe!" (sample data)
- Check all variables replaced

#### 7. Test Send
- Send to: yourtest@gmail.com
- Check inbox
- Verify looks good

#### 8. Send Campaign
- Click "Send Campaign"
- Confirm
- Watch progress
- Result: "Campaign sent to 3 recipients"

#### 9. Monitor
- Check dashboard
- View campaign details
- See all 3 marked as "sent"

---

## 💡 Best Practices

### Settings:
- ✅ Use app passwords, not regular passwords
- ✅ Test with a small campaign first
- ✅ Keep credentials secure
- ✅ Use a dedicated sending email

### Templates:
- ✅ Keep HTML simple
- ✅ Test on multiple email clients
- ✅ Use inline CSS (better compatibility)
- ✅ Include unsubscribe link (for compliance)
- ✅ Make mobile-friendly
- ✅ Use meaningful variable names

### Campaigns:
- ✅ Always preview before sending
- ✅ Always test send first
- ✅ Start with small batches
- ✅ Check spam folder
- ✅ Use clear subject lines
- ✅ Verify CSV format
- ✅ Clean email list (remove bounces)
- ✅ Monitor success rate

### CSV Files:
- ✅ Always include "email" column
- ✅ Remove duplicates
- ✅ Validate email addresses
- ✅ Use consistent column names
- ✅ Test with small file first
- ✅ Keep backups

---

## 🐛 Common Issues & Solutions

### Settings Issues:

**Problem:** "SMTP Configuration not found"
**Solution:** Go to Settings and configure SMTP first

**Problem:** "Authentication failed"
**Solution:** 
- Check username/password
- Use app password for Gmail
- Verify host and port

**Problem:** Test email not received
**Solution:**
- Check spam folder
- Verify SMTP credentials
- Check email provider limits

### Template Issues:

**Problem:** Variables not replaced
**Solution:** 
- Use correct syntax: {{variable}}
- Match CSV column names
- No spaces: {{name}} not {{ name }}

**Problem:** HTML not rendering
**Solution:**
- Check HTML syntax
- Use inline CSS
- Test in preview

### Campaign Issues:

**Problem:** "No pending recipients found"
**Solution:** Upload CSV file first

**Problem:** High failure rate
**Solution:**
- Check email addresses in CSV
- Verify SMTP limits
- Check for typos
- Review failed recipients

**Problem:** Emails going to spam
**Solution:**
- Avoid spam trigger words
- Include unsubscribe link
- Use proper from address
- Warm up new domain
- Check SPF/DKIM records

---

## 📊 Understanding Results

### Campaign Status:
- **Draft:** Not sent yet
- **Sending:** Currently sending
- **Completed:** All sent
- **Failed:** Errors occurred

### Recipient Status:
- **Pending:** Not sent yet (yellow)
- **Sent:** Successfully delivered (green)
- **Failed:** Delivery failed (red)

### Success Rate:
- **95%+:** Excellent
- **90-95%:** Good
- **85-90%:** Review settings
- **<85%:** Check email list quality

---

## 🎓 Tips & Tricks

### Personalization:
```html
<!-- Basic -->
Hi {{name}},

<!-- Advanced -->
Hi {{first_name}},
Your order #{{order_id}} for {{product_name}} is ready!
Total: ${{amount}}
```

### Conditional Content:
```html
<!-- Use different messages based on data -->
{{#if vip}}
  <p>As a VIP member, enjoy 30% off!</p>
{{else}}
  <p>Enjoy 20% off!</p>
{{/if}}
```

### Testing:
- Test with 1-2 recipients first
- Use your own emails
- Check different devices
- Review spam score

### Optimization:
- Keep subject lines under 50 characters
- Use clear call-to-action
- Mobile-first design
- Fast-loading images

---

## 📚 Quick Reference

### Workflow:
```
Settings → Templates → Campaigns → Upload CSV → Preview → Test → Send → Monitor
```

### Required Fields:
- Settings: Host, Port, Username, Password, From Email
- Template: Name, Content
- Campaign: Name, Subject, Body
- CSV: email column

### Key URLs:
- Settings: /settings
- Templates: /templates
- Campaigns: /campaigns
- Dashboard: /dashboard

---

## 🎉 You're Ready!

Now you know how to:
- ✅ Configure SMTP settings
- ✅ Create email templates
- ✅ Create campaigns
- ✅ Upload recipients
- ✅ Preview emails
- ✅ Test send
- ✅ Send campaigns
- ✅ Monitor results

**Start sending professional email campaigns!** 📧🚀
