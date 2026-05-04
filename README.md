# DealCore.ae — Business Laptops in UAE

Static ecommerce showcase for **DealCore.ae**, operated by **ALJIHAZ COMPUTER TRADING (S.P.S - L.L.C)**. UAE delivery, AED pricing, business laptops (Lenovo ThinkPad, Dell Latitude, HP EliteBook, Dell Precision).

- Production domain: [dealcore.ae](https://dealcore.ae)
- Hosting: GitHub Pages (`main` branch)
- Custom domain via `CNAME` file (do not modify)

## Project structure

```
.
├── CNAME              # custom domain (dealcore.ae) — DO NOT MODIFY
├── README.md          # this file
├── catalog.json       # product catalog (single source of truth, AED prices)
├── index.html         # full single-file static site (HTML + CSS + JS)
├── marketing_brief.md # internal marketing notes
└── photos/            # local product photos referenced from catalog.json
```

## Stack

- Pure static site — no build step, no framework, no bundler.
- Hash-routed SPA inside `index.html` (`#/`, `#/shop`, `#/product/:id`, `#/cart`, `#/checkout`, `#/about`, `#/contact`, `#/delivery`, `#/returns`, `#/terms`, `#/privacy`).
- Cart persisted in `localStorage`.
- Checkout submits the order summary to WhatsApp `+971 50 298 0483`.

## Pages

| Route | Description |
|-------|-------------|
| `#/` | Home: hero, featured laptops, quick brand links |
| `#/shop` | Product listing with brand filter and search |
| `#/product/:id` | Product detail (CPU / RAM / SSD / Screen / Condition / Warranty / Delivery) |
| `#/cart` | Cart with quantity edit and line totals |
| `#/checkout` | Customer details + payment placeholder (Card / Tabby / Tamara) → WhatsApp |
| `#/about` | About Us |
| `#/contact` | Contact Us |
| `#/delivery` | Delivery Policy |
| `#/returns` | Return & Refund Policy |
| `#/terms` | Terms & Conditions |
| `#/privacy` | Privacy Policy |

## Catalog format

`catalog.json` is an array of product objects. Only items with `"status": "active"` are displayed.

```json
{
  "status": "active",
  "id": "M-0001",
  "brand": "Dell",
  "model": "Latitude 5490",
  "category": "Business Laptop",
  "shortSpecs": "16GB / 512GB SSD · 14\"",
  "cpu": "Intel 8th Gen",
  "ram": "8–16 GB DDR4",
  "ssd": "256–512 GB NVMe SSD",
  "screen": "14\"",
  "condition": "Refurbished — Grade A",
  "warranty": "12 months DealCore.ae warranty",
  "delivery": "UAE delivery 1–3 business days",
  "photo": "photos/M-0001.jpg",
  "gallery": "photos/M-0001.jpg",
  "description": "Dell Latitude 5490 business laptop ...",
  "priceAED": 1299
}
```

All prices are stored as integer AED in `priceAED`. The site formats values via `Intl.NumberFormat("en-AE")`.

## How to update the catalog

1. Edit `catalog.json` directly (add / update / remove items).
2. Place any new product images in `photos/` and reference them via `"photo": "photos/<id>.jpg"`.
3. Commit and push to `main`. GitHub Pages will redeploy automatically.

## Local preview

No build step is required. From the project root:

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

Or any other static file server (Node `npx http-server`, Caddy, nginx, etc.).

## Deployment

- Branch: `main`
- Provider: GitHub Pages
- Custom domain: `dealcore.ae` (configured via `CNAME`, do **not** modify the file).

Pushing to `main` is the deployment.

## Contacts

- Brand: DealCore.ae
- Legal entity: ALJIHAZ COMPUTER TRADING (S.P.S - L.L.C)
- WhatsApp: +971 50 298 0483
- Email: info@dealcore.ae
- Country: United Arab Emirates
