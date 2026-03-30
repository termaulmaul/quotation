# quotation

Full-stack quotation builder:

- frontend: Vite + React
- backend: Express + MySQL

## Run

```bash
pnpm install
pnpm dev
```

Default app URLs:

- frontend: `http://localhost:5173`
- backend: `http://localhost:3001`

For LAN access, open the frontend using your machine IP, for example:

- `http://192.168.x.x:5173`

Default database config:

- host: `127.0.0.1`
- port: `3306`
- user: `root`
- password: empty
- database: `quotation_app`

You can override these with `.env`:

```env
PORT=3001
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=quotation_app
DB_CONNECTION_LIMIT=10
```

## Scripts

- `pnpm dev` runs frontend and backend together
- `pnpm dev:web` runs only the frontend
- `pnpm dev:api` runs only the backend
- `pnpm build` builds the frontend

## Endpoints

- `GET /health`
- `GET /api/quotations`
- `GET /api/quotations/:id`
- `POST /api/quotations`
- `PUT /api/quotations/:id`
- `DELETE /api/quotations/:id`

`POST` and `PUT` accept the same payload shape:

```json
{
  "header": {
    "companyName": "PT. PRIMA SOLUSI TEKNOLOGI",
    "address": "Jl. Sudirman No. 45, Jakarta Pusat 10220",
    "phone": "(021) 5555-1234",
    "email": "info@primasolusi.co.id",
    "quotationNo": "SPH/2025/0058",
    "date": "30 Maret 2025",
    "projectName": "Instalasi Sistem CCTV & Jaringan",
    "clientName": "RSUD Pulau Seribu",
    "clientAddress": "Kepulauan Seribu, DKI Jakarta",
    "validUntil": "30 April 2025"
  },
  "sections": [
    {
      "title": "LANTAI 1",
      "rows": [
        {
          "image": null,
          "description": "IP Camera 4MP Dome Indoor",
          "qty": 4,
          "unit": "Unit",
          "unitPrice": 850000
        }
      ]
    }
  ],
  "notes": "1. Harga belum termasuk PPN 11%.",
  "taxRate": 0.11
}
```
