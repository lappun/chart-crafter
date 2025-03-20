# Chart Crafter

[![Deploy to Cloudflare Pages](https://img.shields.io/badge/Deploy%20to-CF%20Pages-f38020?logo=cloudflare)](https://dash.cloudflare.com/?to=/:account/pages/new)

A cloud-native chart sharing platform that creates secure, temporary URLs for data visualization sharing. Features include:

- 📈 Create interactive charts with expiration dates
- 🔗 Generate unique, shareable URLs
- 🔒 Password-protected chart deletion
- ⚡ Edge-rendered chart images for social sharing
- 🧹 Automatic expiration cleanup

## Getting Started
First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## Configuration

Required environment variables:

```bash
NEXT_PUBLIC_BASE_URL="https://your-domain.com"  # Base URL for generated links
MASTER_KEY="your-secure-key"                    # Admin/master key for privileged operations
```

## API Documentation

### Create a Chart
`POST /api/chart`
```json
{
  "name": "Sales Report",
  "description": "Q4 2023 Performance",
  "data": {/* ECharts configuration */},
  "expiresIn": "1d" // 1h, 30d, etc.
}
```

Response:
```json
{
  "id": "20240101-123e4567",
  "url": "https://.../chart/20240101-123e4567/",
  "password": "generated-password",
  "svg": "<!-- Generated SVG -->"
}
```

### Delete a Chart
`DELETE /api/chart/[id]`
- Authorization: `Bearer MASTER_KEY` or `X-Delete-Password: chart-password`

### Admin Endpoints
`GET /api/chart` - List all charts (requires master key)
`GET /api/status` - Service health check

## Deployment
The application is optimized for Cloudflare Pages with:

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Cloudflare integration

Besides the `dev` script mentioned above `c3` has added a few extra scripts that allow you to integrate the application with the [Cloudflare Pages](https://pages.cloudflare.com/) environment, these are:
  - `pages:build` to build the application for Pages using the [`@cloudflare/next-on-pages`](https://github.com/cloudflare/next-on-pages) CLI
  - `preview` to locally preview your Pages application using the [Wrangler](https://developers.cloudflare.com/workers/wrangler/) CLI
  - `deploy` to deploy your Pages application using the [Wrangler](https://developers.cloudflare.com/workers/wrangler/) CLI

> __Note:__ while the `dev` script is optimal for local development you should preview your Pages application as well (periodically or before deployments) in order to make sure that it can properly work in the Pages environment (for more details see the [`@cloudflare/next-on-pages` recommended workflow](https://github.com/cloudflare/next-on-pages/blob/main/internal-packages/next-dev/README.md#recommended-development-workflow))

## Security Considerations

1. All operations require HTTPS
2. Chart deletion requires either:
   - The original generated password
   - Master key for admin override
3. Data is automatically purged after expiration
4. Sensitive operations are logged

## Maintenance

Run the cleanup script periodically to remove expired charts:
```bash
node scripts/delete-expired-urls.js
```

> **Warning:** The master key grants full access to all charts. Rotate regularly and store securely.
