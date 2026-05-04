# DealCore.ae — Marketing & Content Brief

Version 2.0 · 2026-05-04

---

## 0. Context

DealCore.ae supplies business laptops (Lenovo ThinkPad, Dell Latitude, Dell Precision, HP EliteBook) to UAE customers — SMEs, IT departments, freelancers and enterprise buyers across all seven Emirates.

- Brand: **DealCore.ae**
- Legal entity: **ALJIHAZ COMPUTER TRADING (S.P.S - L.L.C)**
- Website: https://dealcore.ae
- WhatsApp: +971 50 298 0483
- Email: info@dealcore.ae
- Catalog: 120 SKUs, AED pricing, UAE delivery 1–3 business days
- Payment: Card, Tabby, Tamara (subject to provider approval)

---

## 10. Site redesign

- Card grid: 4 columns desktop, 2 mobile
- Filters: brand, category, price, condition
- Search by model and part number
- Mobile-first, page speed <2s (Lighthouse >90)
- Cart + checkout with WhatsApp confirmation; Tabby and Tamara placeholders pending provider approval
- Brand colours: #0f172a (deal) + #16a34a (core)
- Pages: Home, Shop, Product, Cart, Checkout, About, Contact, Delivery, Returns, Terms, Privacy

## 11. Catalog refresh

- Audit 120 SKUs: stock, real AED prices, photos in a single style
- Remove discontinued models
- Add 30–50 fresh 2024–2025 models
- Detailed product cards: specs, benchmarks (CB R23, 3DMark), embedded video review
- Badges: "Hot", "New", "−15%", "Open Box"

## 12. UAE business-month promo

- Banner on homepage + sticky bar in header
- Promo code AED50 on checkout (AED 50 off above AED 1,499)
- Teaser via WhatsApp broadcast 3 days before launch
- Duration: 14 days, then rotate
- KPI: discount-attributed orders >20% of weekly volume

## 13. Open Box clearance

- Select 5–10 SKUs: showroom units, returns, light cosmetic blemishes
- 15–25% discount vs. standard AED price
- "Open Box" category + card badge
- Each unit photographed individually (defect-honest photos)
- Warranty 6 months (instead of 12)

## 14. Marketing analysis

**Target audience (5 personas):**
1. SMB procurement — 50+ laptops/year, needs price + VAT invoice
2. IT system administrator — corporate models, drop-in replacements
3. Freelancer / IT pro — price-performance, ThinkPad/Latitude
4. Reseller — bulk from 5+ units, margin on resale
5. UAE student in tech — best performance per AED

**UAE competitors:**
- Sharaf DG, Jumbo, Emax — new retail prices and warranty terms
- Dubizzle / Amazon.ae top sellers of business laptops — prices, ratings, delivery
- Local refurbished specialists in Dubai / Sharjah — landing pages, packaging

**Traffic channels:**
- Google Ads (Search + Shopping in UAE)
- Meta Ads (Instagram + Facebook, UAE geo)
- TikTok UAE
- YouTube reviews + Shorts
- SEO: Arabic + English long-tail
- Metrics: CPC, CR to order, CAC, LTV

**Value proposition matrix:** what we offer each persona (price, speed, warranty, VAT invoice).

**Funnel:** touch → click → cart → checkout → repeat. Conversion measured at each step.

## 15. Paid social

| Channel | Format | Test budget |
|---|---|---|
| Google Ads UAE | Search + Shopping | AED 3,000 |
| Meta Ads UAE | feed + reels, B2B targeting | AED 3,000 |
| TikTok UAE | short videos, lifestyle/work | AED 1,500 |
| YouTube channel | reviews + Shorts | AED 0 (organic) |
| YouTube Ads UAE | pre-rolls on tech videos | AED 2,500 |

Launch KPIs: **CPL <AED 50**, **CR to order >1.5%**, **ROAS >3x** within 30 days.

## 16. AI brand persona and content factory

**Persona:** Layla (working name)
- UAE-based tech reviewer, late twenties
- Smart-casual office wardrobe, modern abaya for select scenes
- Personality: pragmatic, friendly, business-savvy, knows enterprise IT
- Always shown with a ThinkPad / Latitude / EliteBook

**Content formats:**
1. **Reels** 15–30 sec — office/IT humour with discreet product placement
2. **Shorts/TikToks** 30–60 sec — "top 3 business laptops under AED 2,000", "buying refurbished in UAE — what to check"
3. **YouTube reviews** 5–15 min — unboxings, benchmarks, comparisons, AI voiceover

**Production:**
- Imagery: SDXL + a custom LoRA (trained on 30–50 brand-safe reference photos)
- Video: Sora / Veo / Kling — short clip generation
- Voice: ElevenLabs (English with subtle UAE accent) or licensed clone
- Editing: CapCut templates, consistent thumbnails
- Cadence: 3–5 clips/week

**YouTube channel:**
- Name: DealCore.ae (or Layla × DealCore)
- Avatar: AI persona
- Schedule: 1 long review + 5 Shorts/week
- Thumbnails: unified style, #0f172a / #16a34a

## 17. Launch sequence

- Test cohort: AED 1,500–3,000 per channel
- A/B: 3 creatives per channel
- Day 14 — rebalance by ROI
- Day 30 — scale winners by 3x

---

# Appendix A. AI persona prompt

## A.1 Base image prompt (SDXL/Midjourney)

```
masterpiece, best quality, ultra detailed, photorealistic editorial style,
female tech reviewer, late twenties, character name Layla,
shoulder-length dark hair, warm brown eyes, healthy clear skin,
slim professional build, height 168cm,
wearing smart-casual office attire — crisp white shirt, tailored dark blazer
with subtle silver pin (brand: DealCore.ae), tapered trousers, leather loafers,
holding a modern ThinkPad laptop,
calm confident expression, professional aura,
soft cinematic lighting, shallow depth of field, 85mm portrait,
backdrop: modern Dubai co-working space, glass walls, city skyline soft bokeh,
brand colour accents (deep navy #0f172a, fresh green #16a34a),
8k, sharp focus, photorealistic textures on skin and fabric,
character consistency token LAYLA_DEALCORE
```

**Negative prompt:**
```
nsfw, lowres, bad anatomy, bad hands, extra fingers, watermark, text,
deformed face, blurry, cartoonish, plastic skin
```

## A.2 Scene variations

**Laptop unboxing:**
```
LAYLA_DEALCORE at minimalist desk, unboxing a ThinkPad X1 Carbon,
opening cardboard box with care, soft window light from left,
green brand highlights, focused expression, hands visible
```

**Side-by-side review:**
```
LAYLA_DEALCORE at clean desk with two laptops side by side,
pointing at one with confident expression,
keyboard backlight reflecting on her face,
floating spec UI in foreground (#0f172a),
business setting, modern Dubai office
```

**Reel/short:**
```
LAYLA_DEALCORE walking through Dubai Marina at golden hour,
holding glowing ThinkPad open showing DealCore.ae on screen,
cinematic dolly shot, dynamic angle,
9:16 vertical, 60fps, photorealistic editorial style
```

## A.3 Video prompt (Sora / Veo / Kling)

```
cinematic 9:16 vertical clip, 8 seconds,
character: LAYLA_DEALCORE late-twenties tech reviewer, business-casual blazer,
holding ThinkPad laptop, modern Dubai co-working space,
camera: slow dolly-in from medium to close-up,
action: she opens the laptop, screen glows green (#16a34a),
DealCore.ae logo briefly visible on lid,
mood: confident professional, calm friendly gaze,
lighting: warm golden hour, glass reflections, shallow DOF,
style: photorealistic editorial, 8k
```

## A.4 Voice prompt (ElevenLabs)

```
Voice: female, late 20s,
neutral English with a subtle UAE accent,
tone: confident, friendly, knowledgeable,
pace: medium, clear, calm,
texture: warm mid-range, clean, no breathiness,
delivery: short informative sentences, natural pauses,
sample phrase:
«Hi, I'm Layla. Today let's break down this ThinkPad — specs, price in AED,
and whether it's worth it for your team in the UAE.»
```

## A.5 Shorts script template (60 sec)

```
HOOK 0–3s: punchy line ("Don't buy a business laptop until you see this")
PROBLEM 3–10s: target-audience pain (slow / overpaying / no warranty)
TWIST 10–25s: show specific DealCore.ae model with AED price
PROOF 25–45s: 2–3 facts (benchmark, AED price comparison, 12-mo warranty)
CTA 45–60s: "Link in bio. dealcore.ae. WhatsApp +971 50 298 0483."
```

## A.6 Persona canon sheet

| Parameter | Canon |
|---|---|
| Name | Layla |
| Age | late 20s |
| Height | 168 cm |
| Hair | dark, shoulder length |
| Eyes | warm brown |
| Skin | healthy clear, neutral tone |
| Outfit | white shirt, tailored dark blazer with DealCore.ae pin, tapered trousers, loafers |
| Accessory | ThinkPad / Latitude / EliteBook |
| Personality | pragmatic, friendly, business-savvy |
| Brand colours | #0f172a navy, #16a34a green |
| Settings | Dubai co-working space / Marina golden hour / unboxing desk |
