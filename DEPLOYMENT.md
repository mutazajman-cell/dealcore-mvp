# Dealcore / Sharjah Sourcing MVP deployment

## Recommended hosting

Use a Node.js hosting provider that supports:

- Node.js web service
- Custom domain
- Persistent disk / volume
- Environment variables

Recommended fast path: Render Web Service with a persistent disk.

Why: this MVP uses SQLite. The database file must live on a persistent disk, not on an ephemeral filesystem.

## Build and start commands

Build command:

```bash
npm install && npm run build
```

Start command:

```bash
npm start
```

## Environment variables

Set:

```text
NODE_ENV=production
DATABASE_PATH=/opt/render/project/src/storage/data.db
```

## Persistent disk

Attach a persistent disk to the web service.

Mount path:

```text
/opt/render/project/src/storage
```

Suggested initial size:

```text
1 GB
```

The app creates the database and tables automatically.

## Domain

After the hosting service is live, add the custom domain:

```text
dealcore.ae
www.dealcore.ae
```

Then the hosting service will show DNS records.

Send those exact records to AEserver support.

Typical Render DNS records:

```text
Type: A
Name: @
Value: 216.24.57.1

Type: CNAME
Name: www
Value: <your-service>.onrender.com
```

Do not send DNS records before the hosting service is created, because the exact service subdomain is generated during deployment.

## Admin

Admin route:

```text
/#/admin
```

Admin code:

```text
7788
```
