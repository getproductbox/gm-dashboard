# 🚀 GM Booking Widget - Netlify Deployment Guide

## Step-by-Step Deployment Instructions

### **Step 1: Prepare Files**
✅ **DONE** - Widget files are ready in `widget-deploy/` directory

### **Step 2: Deploy to Netlify**

#### Option A: Manual Deployment (Recommended)
1. Go to [Netlify](https://netlify.com)
2. Click "New site from Git" or "Deploy manually"
3. Drag and drop the `widget-deploy` folder contents
4. Set the site name to: `booking-widget`
5. Click "Deploy site"

#### Option B: Git Deployment
1. Create a new repository on GitHub
2. Upload the `widget-deploy` folder contents
3. Connect the repository to Netlify
4. Set the site name to: `booking-widget`

### **Step 3: Configure Custom Domain**

1. In your Netlify dashboard, go to **Site settings** > **Domain management**
2. Click **"Add custom domain"**
3. Enter: `booking-widget.getproductbox.com`
4. Click **"Verify"**

### **Step 4: DNS Configuration**

Add this CNAME record to your DNS provider (where you manage getproductbox.com):

```
Type: CNAME
Name: booking-widget
Value: your-netlify-site.netlify.app
TTL: 3600 (or default)
```

**DNS Provider Instructions:**
- **Cloudflare**: Add CNAME record in DNS settings
- **GoDaddy**: Add CNAME record in DNS management
- **Namecheap**: Add CNAME record in domain list
- **AWS Route 53**: Create CNAME record

### **Step 5: Verify Deployment**

Once deployed, test these URLs:
- `https://booking-widget.getproductbox.com/` (landing page)
- `https://booking-widget.getproductbox.com/widget.css` (CSS file)
- `https://booking-widget.getproductbox.com/gm-booking-widget-standalone.js` (JS file)

### **Step 6: Test Widget Integration**

Create a test HTML file to verify the widget works:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Widget Test</title>
    <link rel="stylesheet" href="https://booking-widget.getproductbox.com/widget.css">
    <script src="https://booking-widget.getproductbox.com/gm-booking-widget-standalone.js"></script>
</head>
<body>
    <h1>Widget Test</h1>
    <div data-gm-widget="booking" data-venue="manor"></div>
</body>
</html>
```

## 🎯 **Final Integration URLs**

Once deployed, use these URLs in your marketing websites:

```html
<!-- CSS -->
<link rel="stylesheet" href="https://booking-widget.getproductbox.com/widget.css">

<!-- JavaScript -->
<script src="https://booking-widget.getproductbox.com/gm-booking-widget-standalone.js"></script>

<!-- Widget Container -->
<div data-gm-widget="booking" data-venue="manor"></div>
```

## 📋 **Configuration Options**

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-venue` | `"manor"`, `"hippie"`, `"both"` | Which venues to show |
| `data-venue-area` | `"upstairs"`, `"downstairs"`, `"full_venue"` | Default area selection |
| `data-theme` | `"light"`, `"dark"` | Widget theme |
| `data-primary-color` | Any CSS color | Button color |
| `data-show-special-requests` | `"true"`, `"false"` | Show/hide special requests |

## 🔧 **Troubleshooting**

### **Widget not loading:**
- Check that files are accessible at the URLs
- Verify DNS propagation (can take up to 24 hours)
- Check browser console for errors

### **CORS errors:**
- Ensure your Supabase Edge Function allows requests from `booking-widget.getproductbox.com`
- Check API key configuration

### **DNS issues:**
- Verify CNAME record is correct
- Wait for DNS propagation
- Check with `nslookup booking-widget.getproductbox.com`

## 📞 **Next Steps**

Once deployed:
1. Test the widget on a staging marketing website
2. Update the marketing AI with the integration URLs
3. Monitor bookings in your GM Dashboard
4. Set up analytics tracking for successful bookings

---

**Deployment Checklist:**
- [ ] Deploy to Netlify
- [ ] Configure custom domain
- [ ] Set up DNS records
- [ ] Test widget files are accessible
- [ ] Test widget functionality
- [ ] Update marketing AI with integration URLs 