# Deploy WUWAHENTAI

Recommended setup: a VPS that allows adult content, Nginx, Python 3, and HTTPS via Certbot.

## 1. Buy the domain

Buy `wuwahentai.net` from a registrar such as Namecheap, GoDaddy, Name.com, Porkbun, Cloudflare Registrar, or another provider.

After buying it, point DNS to your VPS:

```text
A     @      YOUR_SERVER_IP
A     www    YOUR_SERVER_IP
```

DNS can take a few minutes to several hours to propagate.

## 2. Upload the site

On the VPS:

```bash
sudo mkdir -p /var/www/wuwahentai
sudo chown -R $USER:$USER /var/www/wuwahentai
```

From your PC, upload this project folder to `/var/www/wuwahentai`.

Example with `scp`:

```bash
scp -r ./* USER@YOUR_SERVER_IP:/var/www/wuwahentai/
```

## 3. Install server packages

Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y python3 nginx certbot python3-certbot-nginx
```

## 4. Install the systemd service

Copy:

```bash
sudo cp /var/www/wuwahentai/deploy/wuwahentai.service /etc/systemd/system/wuwahentai.service
sudo systemctl daemon-reload
sudo systemctl enable --now wuwahentai
sudo systemctl status wuwahentai
```

## 5. Install Nginx config

Copy:

```bash
sudo cp /var/www/wuwahentai/deploy/nginx-wuwahentai.conf /etc/nginx/sites-available/wuwahentai.net
sudo ln -s /etc/nginx/sites-available/wuwahentai.net /etc/nginx/sites-enabled/wuwahentai.net
sudo nginx -t
sudo systemctl reload nginx
```

## 6. Enable HTTPS

After DNS points to the VPS:

```bash
sudo certbot --nginx -d wuwahentai.net -d www.wuwahentai.net
```

## 7. Test

Open:

```text
https://wuwahentai.net
```

## Notes

- Use a host that explicitly allows adult content.
- Keep DMCA/report removal contact/process ready.
- Keep minors, minor-coded characters, and non-consensual/illegal content blocked.
- The Rule34 proxy can be rate-limited by Rule34. The app caches results in `.cache/rule34`.
