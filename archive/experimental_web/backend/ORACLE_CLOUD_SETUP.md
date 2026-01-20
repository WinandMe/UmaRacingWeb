# Oracle Cloud Always Free - Backend Deployment Guide

## Overview
Oracle Cloud Always Free tier is **completely free forever** with no credit card required (though they ask for one, it's not charged).

**Included Free:**
- 2 ARM-based VM instances (4GB RAM each)
- 1 AMD-based VM instance
- 20GB storage
- Always-on (no sleep)
- Sufficient for small hobby projects

---

## Step 1: Sign Up for Oracle Cloud
1. Go to: https://www.oracle.com/cloud/free/
2. Click **Start for free**
3. Enter email (no credit card required)
4. Verify email
5. Choose region closest to you

---

## Step 2: Create a Compute Instance

1. **Log in** to Oracle Cloud Console
2. Go to **Compute** → **Instances**
3. Click **Create Instance**
4. Configure:
   - **Name:** uma-racing-backend
   - **Image:** Ubuntu 22.04 (or latest)
   - **Shape:** Ampere (ARM) - A1 Compute (Always Free eligible)
   - **OCPU Count:** 4 (free tier allows this)
   - **RAM:** 24GB (free tier allows this)
   - **Storage:** 50GB
   - **Public IP Address:** Assign public IPv4
   - **SSH Key:** Generate and download (save as `oracle-key.key`)
5. Click **Create**

Wait 2-3 minutes for instance to start...

---

## Step 3: Connect to Your Instance

```powershell
# Change permissions on SSH key
icacls oracle-key.key /inheritance:r /grant:r "%username%:F"

# Connect via SSH (get IP from Oracle Console)
ssh -i oracle-key.key ubuntu@YOUR_INSTANCE_IP

# Update system
sudo apt update && sudo apt upgrade -y
```

---

## Step 4: Install Dependencies

```bash
# Install Python and pip
sudo apt install -y python3 python3-pip python3-venv git

# Install other dependencies
sudo apt install -y build-essential libssl-dev libffi-dev

# Create a virtual environment
python3 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip
```

---

## Step 5: Deploy Your Backend

```bash
# Clone your repo (or upload via SCP)
git clone https://github.com/YOUR_USERNAME/UmaRacingWeb.git
cd UmaRacingWeb/backend

# Install requirements
pip install -r requirements.txt

# Set environment variables
export ENVIRONMENT=production
export SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")

# Run the app with gunicorn
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 main:app &
```

---

## Step 6: Configure Firewall

In Oracle Console:

1. Go to **Virtual Cloud Networks** → Your VCN → **Security Lists**
2. Click default security list
3. Add **Ingress Rule:**
   - Protocol: TCP
   - Source: 0.0.0.0/0
   - Port: 8000
   - Click **Add Ingress Rule**

---

## Step 7: Get Your Backend URL

Your backend is now at:
```
http://YOUR_INSTANCE_IP:8000/api
```

Find YOUR_INSTANCE_IP in Oracle Console → Compute → Instances

---

## Step 8: Update Frontend

```javascript
const API_BASE = "http://YOUR_INSTANCE_IP:8000/api";
```

---

## (Optional) Set Up HTTPS with Caddy

For production, use HTTPS:

```bash
# Install Caddy
sudo apt install -y caddy

# Create Caddyfile
sudo nano /etc/caddy/Caddyfile
```

Add:
```
your-domain.com {
    reverse_proxy localhost:8000
}
```

Then:
```bash
sudo systemctl start caddy
sudo systemctl enable caddy
```

---

## Keep Backend Running 24/7

Use systemd service:

```bash
sudo nano /etc/systemd/system/uma-racing.service
```

Paste:
```ini
[Unit]
Description=Uma Racing Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/UmaRacingWeb/backend
Environment="PATH=/home/ubuntu/venv/bin"
ExecStart=/home/ubuntu/venv/bin/gunicorn -w 4 -b 0.0.0.0:8000 main:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl start uma-racing
sudo systemctl enable uma-racing
sudo systemctl status uma-racing
```

---

## Useful Commands

```bash
# SSH into instance
ssh -i oracle-key.key ubuntu@YOUR_IP

# View logs
sudo journalctl -u uma-racing -f

# Restart service
sudo systemctl restart uma-racing

# Stop service
sudo systemctl stop uma-racing

# Check if port 8000 is listening
sudo netstat -tulpn | grep 8000
```

---

## Cost
✅ **Completely Free Forever** (no credit card charged)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Connection timeout | Check firewall rules in Oracle Console |
| 404 errors | Verify backend is running: `sudo systemctl status uma-racing` |
| Port already in use | Change port in gunicorn command |
| Import errors | Ensure `pip install -r requirements.txt` completed |
