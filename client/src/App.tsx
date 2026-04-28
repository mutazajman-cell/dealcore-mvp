import { useEffect, useMemo, useState } from "react";
import { Switch, Route, Router, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider, useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Cpu,
  Database,
  Filter,
  Laptop,
  MapPin,
  Moon,
  PackagePlus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
  X,
} from "lucide-react";
import { queryClient, apiRequest } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import type { CatalogItem } from "@shared/schema";

type Lang = "en" | "ru";

type Stats = {
  items: number;
  brands: number;
  categories: number;
  leads: number;
  lastUpdated: string;
};

type LeadMode = "buyer_request" | "supplier_onboarding" | "general";

const categoriesFallback = ["All", "Workstation Laptop", "Business Laptop", "Rugged Laptop", "Laptop"];

const categoryLabels: Record<Lang, Record<string, string>> = {
  en: {
    All: "All",
    "Workstation Laptop": "Workstation Laptop",
    "Business Laptop": "Business Laptop",
    "Rugged Laptop": "Rugged Laptop",
    Laptop: "Laptop",
  },
  ru: {
    All: "Все категории",
    "Workstation Laptop": "Рабочие станции",
    "Business Laptop": "Бизнес-ноутбуки",
    "Rugged Laptop": "Защищенные ноутбуки",
    Laptop: "Ноутбуки",
  },
};

const copy = {
  en: {
    documentTitle: "Sharjah Sourcing - Professional Laptop Catalog",
    logoSubtitle: "Laptop supply catalog",
    themeLabel: "Toggle theme",
    languageLabel: "Interface language",
    navCatalog: "Catalog",
    navSuppliers: "Suppliers",
    addSupplier: "Add supplier",
    heroBadge: "Active v0.1 catalog · UAE sourcing",
    heroTitle: "Find available professional laptops from Sharjah suppliers faster.",
    heroBody:
      "A working sourcing resource with initial supplier stock, searchable catalog, request capture and WhatsApp follow-up.",
    viewCatalog: "View catalog",
    requestOffer: "Request commercial offer",
    stats: {
      items: "Published items",
      brands: "Brands",
      categories: "Categories",
      leads: "Saved leads",
    },
    readyTitle: "Ready for market testing",
    readyBody:
      "Use this link for first supplier conversations, buyer requests and commercial proposal validation.",
    catalogEyebrow: "Live catalog",
    catalogTitle: "Initial supplier assortment",
    catalogBody: "Search and filter the active v0.1 stock. Availability is confirmed after request.",
    showing: (shown: number, total: number) => `Showing ${shown} of ${total} products`,
    searchPlaceholder: "Search brand, model, CPU...",
    allBrands: "All brands",
    loadingCards: "Loading catalog",
    emptyTitle: "No matching products yet",
    emptyBody: "Send a request anyway and the team can source the right configuration manually.",
    sendRequest: "Send request",
    conditionFallback: "A/B",
    ramAsk: "Ask",
    ssdAsk: "Ask",
    priceByRequest: "By request",
    availabilityFallback: "Check availability",
    availabilityCheck: "Check availability",
    request: "Request",
    whatsapp: "WhatsApp",
    suppliersEyebrow: "For suppliers",
    suppliersTitle: "Add partial stock now, improve the catalog later.",
    suppliersBody:
      "Suppliers can share a partial assortment first. The resource can publish selected items, receive buyer requests and update stock progressively.",
    addSupplierStock: "Add supplier stock",
    footerLeft: "Sharjah Sourcing v0.1 · working MVP",
    footerRight: "Temporary launch environment. Main .ae domain can be connected later.",
    requestPanel: {
      eyebrow: "Lead capture",
      addSupplierTitle: "Add supplier stock",
      sendRequestTitle: "Send a request",
      productTitle: (title: string) => `Request: ${title}`,
      name: "Name",
      contact: "Contact",
      company: "Company",
      message: "Message",
      namePlaceholder: "Your name",
      contactPlaceholder: "WhatsApp, phone or email",
      companyPlaceholder: "Optional",
      closeLabel: "Close request form",
      saving: "Saving...",
      save: "Save request",
      defaultSupplierMessage: "We want to add our supplier stock to the catalog. Please contact us.",
      defaultProductMessage: (title: string) => `Please send final offer and availability for ${title}.`,
      defaultGeneralMessage: "Please contact me about the current laptop catalog.",
      successTitle: "Request saved",
      successBody: "The request is now in the project backend. You can follow up manually.",
      errorTitle: "Request was not saved",
      errorBody: "Please check the fields and try again.",
    },
  },
  ru: {
    documentTitle: "Sharjah Sourcing - каталог профессиональных ноутбуков",
    logoSubtitle: "Каталог поставок ноутбуков",
    themeLabel: "Переключить тему",
    languageLabel: "Язык интерфейса",
    navCatalog: "Каталог",
    navSuppliers: "Поставщики",
    addSupplier: "Добавить поставщика",
    heroBadge: "Активный каталог v0.1 · поставки из ОАЭ",
    heroTitle: "Каталог профессиональных ноутбуков от поставщиков в ОАЭ.",
    heroBody:
      "Рабочий ресурс для покупателей из РФ: стартовый ассортимент, поиск, фильтры, заявки и связь через WhatsApp.",
    viewCatalog: "Смотреть каталог",
    requestOffer: "Получить коммерческое предложение",
    stats: {
      items: "Опубликовано",
      brands: "Брендов",
      categories: "Категорий",
      leads: "Заявок",
    },
    readyTitle: "Готово для проверки рынка",
    readyBody:
      "Эту ссылку можно использовать для первых запросов покупателей, проверки спроса и коммерческих предложений.",
    catalogEyebrow: "Живой каталог",
    catalogTitle: "Стартовый ассортимент поставщиков",
    catalogBody: "Ищите и фильтруйте активный ассортимент v0.1. Наличие подтверждается после заявки.",
    showing: (shown: number, total: number) => `Показано ${shown} из ${total} товаров`,
    searchPlaceholder: "Поиск по бренду, модели, процессору...",
    allBrands: "Все бренды",
    loadingCards: "Загрузка каталога",
    emptyTitle: "Подходящие товары пока не найдены",
    emptyBody: "Оставьте заявку, и нужную конфигурацию можно будет найти вручную.",
    sendRequest: "Оставить заявку",
    conditionFallback: "A/B",
    ramAsk: "Уточнить",
    ssdAsk: "Уточнить",
    priceByRequest: "По запросу",
    availabilityFallback: "Проверить наличие",
    availabilityCheck: "Проверить наличие",
    request: "Запросить",
    whatsapp: "WhatsApp",
    suppliersEyebrow: "Для поставщиков",
    suppliersTitle: "Добавьте часть ассортимента сейчас, улучшайте каталог позже.",
    suppliersBody:
      "Поставщики могут сначала передать частичный ассортимент. Ресурс публикует выбранные позиции, принимает заявки и постепенно обновляет наличие.",
    addSupplierStock: "Добавить ассортимент",
    footerLeft: "Sharjah Sourcing v0.1 · рабочий MVP",
    footerRight: "Временная среда запуска. Основной .ae домен можно подключить позже.",
    requestPanel: {
      eyebrow: "Сбор заявки",
      addSupplierTitle: "Добавить ассортимент поставщика",
      sendRequestTitle: "Отправить заявку",
      productTitle: (title: string) => `Заявка: ${title}`,
      name: "Имя",
      contact: "Контакт",
      company: "Компания",
      message: "Сообщение",
      namePlaceholder: "Ваше имя",
      contactPlaceholder: "WhatsApp, телефон или email",
      companyPlaceholder: "Необязательно",
      closeLabel: "Закрыть форму заявки",
      saving: "Сохраняем...",
      save: "Сохранить заявку",
      defaultSupplierMessage: "Хотим добавить ассортимент поставщика в каталог. Свяжитесь с нами.",
      defaultProductMessage: (title: string) =>
        `Прошу отправить финальное коммерческое предложение и актуальное наличие по позиции: ${title}.`,
      defaultGeneralMessage: "Свяжитесь со мной по актуальному каталогу ноутбуков.",
      successTitle: "Заявка сохранена",
      successBody: "Заявка сохранена в backend проекта. Дальше можно обработать ее вручную.",
      errorTitle: "Заявка не сохранена",
      errorBody: "Проверьте поля и попробуйте еще раз.",
    },
  },
} as const;

function Logo({ lang }: { lang: Lang }) {
  const t = copy[lang];

  return (
    <div className="flex items-center gap-3" data-testid="brand-logo">
      <svg
        aria-label="Sharjah Sourcing mark"
        className="h-9 w-9 text-primary"
        viewBox="0 0 42 42"
        fill="none"
      >
        <rect x="5" y="5" width="32" height="32" rx="10" stroke="currentColor" strokeWidth="2.5" />
        <path d="M14 16.5h14.5c2.4 0 4.5 1.9 4.5 4.5s-2 4.5-4.5 4.5H20" stroke="currentColor" strokeWidth="2.5" />
        <path d="M14 25.5h8.5c2.4 0 4.5-1.9 4.5-4.5s-2-4.5-4.5-4.5H14" stroke="currentColor" strokeWidth="2.5" />
      </svg>
      <div>
        <div className="text-sm font-semibold leading-none tracking-tight">Sharjah Sourcing</div>
        <div className="text-xs text-muted-foreground">{t.logoSubtitle}</div>
      </div>
    </div>
  );
}

function ThemeToggle({ label }: { label: string }) {
  const [dark, setDark] = useState(() => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <button
      type="button"
      onClick={() => setDark((value) => !value)}
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm"
      aria-label={label}
      data-testid="button-theme-toggle"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function LanguageToggle({ lang, onChange }: { lang: Lang; onChange: (next: Lang) => void }) {
  const [, navigate] = useLocation();
  const t = copy[lang];

  function choose(next: Lang) {
    onChange(next);
    navigate(next === "ru" ? "/ru" : "/en");
  }

  return (
    <div
      className="inline-flex min-h-11 items-center rounded-full border border-border bg-card p-1 text-xs font-semibold"
      aria-label={t.languageLabel}
      data-testid="language-toggle"
    >
      {(["en", "ru"] as Lang[]).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => choose(value)}
          aria-pressed={lang === value}
          className={`min-h-9 rounded-full px-3 ${
            lang === value ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
          data-testid={`button-lang-${value}`}
        >
          {value.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function formatPrice(value: CatalogItem["priceAed"], lang: Lang) {
  if (value === "" || value === undefined || value === null) return copy[lang].priceByRequest;
  const number = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(number)) return copy[lang].priceByRequest;
  const locale = lang === "ru" ? "ru-RU" : "en-AE";
  return `${new Intl.NumberFormat(locale).format(number)} AED`;
}

function categoryLabel(value: string, lang: Lang) {
  return categoryLabels[lang][value] || value;
}

function brandLabel(value: string, lang: Lang) {
  return value === "All" ? copy[lang].allBrands : value;
}

function availabilityLabel(value: string | undefined, lang: Lang) {
  if (!value) return copy[lang].availabilityFallback;
  if (lang === "ru" && value === "Check availability") return copy.ru.availabilityCheck;
  return value;
}

function productTitle(item: CatalogItem, lang: Lang) {
  if (lang === "en") return item.title;
  const name = [item.brand, item.model].filter(Boolean).join(" ");
  return name ? `Ноутбук ${name}` : item.title;
}

function productDescription(item: CatalogItem, lang: Lang) {
  if (lang === "en") return item.description;
  const name = [item.brand, item.model].filter(Boolean).join(" ") || item.title;
  const specs = [item.cpu, item.ramGb ? `${item.ramGb} ГБ RAM` : "", item.ssdGb ? `${item.ssdGb} ГБ SSD` : ""]
    .filter(Boolean)
    .join(", ");
  const condition = item.condition ? `состояние ${item.condition}` : "состояние уточняется";
  return `${name}${specs ? `, ${specs}` : ""}, ${condition}. Поставка из ОАЭ. Запросите актуальное наличие и финальное коммерческое предложение.`;
}

function buildWhatsAppLink(item: CatalogItem) {
  const base = item.whatsapp || "https://wa.me/";
  const text = encodeURIComponent(
    `Hello, I want to request current availability and final offer for: ${item.title}.`,
  );
  return base.includes("?") ? `${base}&text=${text}` : `${base}?text=${text}`;
}

function RequestPanel({
  lang,
  mode,
  product,
  onClose,
}: {
  lang: Lang;
  mode: LeadMode;
  product?: CatalogItem;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const t = copy[lang].requestPanel;
  const displayTitle = product ? productTitle(product, lang) : "";
  const defaultMessage =
    mode === "supplier_onboarding"
      ? t.defaultSupplierMessage
      : product
        ? t.defaultProductMessage(displayTitle)
        : t.defaultGeneralMessage;
  const [form, setForm] = useState({
    name: "",
    contact: "",
    company: "",
    message: defaultMessage,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/leads", {
        requestType: mode,
        productId: product?.id || "",
        productTitle: product ? productTitle(product, lang) : "",
        ...form,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: t.successTitle,
        description: t.successBody,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: t.errorTitle,
        description: error instanceof Error ? error.message : t.errorBody,
        variant: "destructive",
      });
    },
  });

  const title =
    mode === "supplier_onboarding" ? t.addSupplierTitle : product ? t.productTitle(displayTitle) : t.sendRequestTitle;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl rounded-t-3xl border border-border bg-card p-5 shadow-2xl sm:rounded-3xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{t.eyebrow}</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight" data-testid="text-request-title">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border"
            aria-label={t.closeLabel}
            data-testid="button-close-request"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          className="mt-5 grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              {t.name}
              <input
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="min-h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder={t.namePlaceholder}
                data-testid="input-lead-name"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {t.contact}
              <input
                required
                value={form.contact}
                onChange={(event) => setForm({ ...form, contact: event.target.value })}
                className="min-h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder={t.contactPlaceholder}
                data-testid="input-lead-contact"
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-medium">
            {t.company}
            <input
              value={form.company}
              onChange={(event) => setForm({ ...form, company: event.target.value })}
              className="min-h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder={t.companyPlaceholder}
              data-testid="input-lead-company"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            {t.message}
            <textarea
              required
              value={form.message}
              onChange={(event) => setForm({ ...form, message: event.target.value })}
              className="min-h-28 rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              data-testid="textarea-lead-message"
            />
          </label>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            data-testid="button-submit-lead"
          >
            {mutation.isPending ? t.saving : t.save}
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function ProductCard({
  lang,
  item,
  onRequest,
}: {
  lang: Lang;
  item: CatalogItem;
  onRequest: (item: CatalogItem) => void;
}) {
  const t = copy[lang];

  return (
    <article className="group rounded-3xl border border-card-border bg-card p-4 shadow-sm" data-testid={`card-product-${item.id}`}>
      <div className="flex min-h-36 items-center justify-center rounded-2xl bg-muted text-primary">
        <Laptop className="h-12 w-12" aria-hidden="true" />
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{item.brand}</p>
          <h3 className="mt-1 text-base font-semibold leading-tight" data-testid={`text-product-title-${item.id}`}>
            {productTitle(item, lang)}
          </h3>
        </div>
        <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          {item.condition || t.conditionFallback}
        </span>
      </div>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{productDescription(item, lang)}</p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-2xl bg-background p-3">
          <Cpu className="mb-1 h-3.5 w-3.5 text-muted-foreground" />
          <div className="font-medium">{item.cpu || "CPU"}</div>
        </div>
        <div className="rounded-2xl bg-background p-3">
          <div className="mb-1 text-muted-foreground">RAM</div>
          <div className="font-medium">{item.ramGb ? `${item.ramGb} GB` : t.ramAsk}</div>
        </div>
        <div className="rounded-2xl bg-background p-3">
          <div className="mb-1 text-muted-foreground">SSD</div>
          <div className="font-medium">{item.ssdGb ? `${item.ssdGb} GB` : t.ssdAsk}</div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold tabular-nums" data-testid={`text-price-${item.id}`}>
            {formatPrice(item.priceAed, lang)}
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {item.location || "UAE"} · {availabilityLabel(item.availability, lang)}
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onRequest(item)}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground"
          data-testid={`button-request-${item.id}`}
        >
          {t.request}
        </button>
        <a
          href={buildWhatsAppLink(item)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-3 text-sm font-semibold"
          data-testid={`link-whatsapp-${item.id}`}
        >
          {t.whatsapp}
        </a>
      </div>
    </article>
  );
}

function Home({ initialLang = "en" }: { initialLang?: Lang }) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [brand, setBrand] = useState("All");
  const [leadMode, setLeadMode] = useState<LeadMode | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<CatalogItem | undefined>();
  const t = copy[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t.documentTitle;
  }, [lang, t.documentTitle]);

  const catalogQuery = useQuery<CatalogItem[]>({ queryKey: ["/api/catalog"] });
  const statsQuery = useQuery<Stats>({ queryKey: ["/api/stats"] });

  const items = catalogQuery.data || [];
  const categories = useMemo(() => {
    const values = Array.from(new Set(items.map((item) => item.category).filter(Boolean))).sort();
    return values.length ? ["All", ...values] : categoriesFallback;
  }, [items]);
  const brands = useMemo(() => ["All", ...Array.from(new Set(items.map((item) => item.brand).filter(Boolean))).sort()], [items]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      const ruTitle = productTitle(item, "ru");
      const ruDescription = productDescription(item, "ru");
      const matchesQuery =
        !needle ||
        [item.title, ruTitle, item.brand, item.model, item.cpu, item.description, ruDescription, item.category]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle);
      const matchesCategory = category === "All" || item.category === category;
      const matchesBrand = brand === "All" || item.brand === brand;
      return matchesQuery && matchesCategory && matchesBrand;
    });
  }, [items, query, category, brand]);

  function openRequest(mode: LeadMode, product?: CatalogItem) {
    setSelectedProduct(product);
    setLeadMode(mode);
  }

  const statsCards = [
    { key: "items", label: t.stats.items, value: statsQuery.data?.items ?? items.length, icon: Database },
    { key: "brands", label: t.stats.brands, value: statsQuery.data?.brands ?? 0, icon: ShieldCheck },
    { key: "categories", label: t.stats.categories, value: statsQuery.data?.categories ?? 0, icon: Filter },
    { key: "leads", label: t.stats.leads, value: statsQuery.data?.leads ?? 0, icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Logo lang={lang} />
          <nav className="hidden items-center gap-2 md:flex" aria-label="Primary navigation">
            <button
              onClick={() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" })}
              className="min-h-11 rounded-full px-4 text-sm font-medium text-muted-foreground hover:text-foreground"
              data-testid="button-nav-catalog"
            >
              {t.navCatalog}
            </button>
            <button
              onClick={() => document.getElementById("suppliers")?.scrollIntoView({ behavior: "smooth" })}
              className="min-h-11 rounded-full px-4 text-sm font-medium text-muted-foreground hover:text-foreground"
              data-testid="button-nav-suppliers"
            >
              {t.navSuppliers}
            </button>
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openRequest("supplier_onboarding")}
              className="hidden min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold sm:inline-flex"
              data-testid="button-add-supplier-header"
            >
              {t.addSupplier}
            </button>
            <LanguageToggle lang={lang} onChange={setLang} />
            <ThemeToggle label={t.themeLabel} />
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-16">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {t.heroBadge}
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl" data-testid="text-hero-title">
              {t.heroTitle}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">{t.heroBody}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
                data-testid="button-view-catalog"
              >
                {t.viewCatalog} <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => openRequest("general")}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-border px-5 text-sm font-semibold"
                data-testid="button-request-offer"
              >
                {t.requestOffer}
              </button>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-card-border bg-card p-5 shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              {statsCards.map((stat) => (
                <div key={stat.key} className="rounded-3xl bg-background p-4" data-testid={`card-stat-${stat.key}`}>
                  <stat.icon className="h-5 w-5 text-primary" />
                  <div className="mt-5 text-3xl font-semibold tabular-nums">{stat.value}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-3xl bg-primary p-5 text-primary-foreground">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4" /> {t.readyTitle}
              </div>
              <p className="mt-3 text-sm leading-6 opacity-90">{t.readyBody}</p>
            </div>
          </aside>
        </section>

        <section id="catalog" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 border-t border-border pt-8 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{t.catalogEyebrow}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">{t.catalogTitle}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t.catalogBody}</p>
            </div>
            <div className="text-sm text-muted-foreground" data-testid="text-result-count">
              {t.showing(filtered.length, items.length)}
            </div>
          </div>

          <div className="mt-6 grid gap-3 rounded-3xl border border-card-border bg-card p-3 lg:grid-cols-[1fr_220px_180px]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="min-h-12 w-full rounded-2xl border border-input bg-background pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder={t.searchPlaceholder}
                data-testid="input-search"
              />
            </label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="min-h-12 rounded-2xl border border-input bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring"
              data-testid="select-category"
            >
              {categories.map((value) => (
                <option key={value} value={value}>
                  {categoryLabel(value, lang)}
                </option>
              ))}
            </select>
            <select
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              className="min-h-12 rounded-2xl border border-input bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring"
              data-testid="select-brand"
            >
              {brands.map((value) => (
                <option key={value} value={value}>
                  {brandLabel(value, lang)}
                </option>
              ))}
            </select>
          </div>

          {catalogQuery.isLoading ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label={t.loadingCards}>
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-96 animate-pulse rounded-3xl bg-muted" />
              ))}
            </div>
          ) : filtered.length ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <ProductCard key={item.id} lang={lang} item={item} onRequest={(product) => openRequest("buyer_request", product)} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-3xl border border-dashed border-border bg-card p-10 text-center">
              <PackagePlus className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">{t.emptyTitle}</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t.emptyBody}</p>
              <button
                type="button"
                onClick={() => openRequest("general")}
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
                data-testid="button-empty-request"
              >
                {t.sendRequest}
              </button>
            </div>
          )}
        </section>

        <section id="suppliers" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-4 rounded-[2rem] border border-card-border bg-card p-6 lg:grid-cols-[1fr_0.7fr] lg:p-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{t.suppliersEyebrow}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">{t.suppliersTitle}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{t.suppliersBody}</p>
            </div>
            <div className="flex items-center lg:justify-end">
              <button
                type="button"
                onClick={() => openRequest("supplier_onboarding")}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
                data-testid="button-add-supplier-section"
              >
                <Building2 className="h-4 w-4" /> {t.addSupplierStock}
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-8 text-sm text-muted-foreground sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 sm:flex-row">
          <div>{t.footerLeft}</div>
          <div>{t.footerRight}</div>
        </div>
      </footer>

      {leadMode && <RequestPanel lang={lang} mode={leadMode} product={selectedProduct} onClose={() => setLeadMode(null)} />}
    </div>
  );
}

function HomeEn() {
  return <Home initialLang="en" />;
}

function HomeRu() {
  return <Home initialLang="ru" />;
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={HomeEn} />
      <Route path="/en" component={HomeEn} />
      <Route path="/ru" component={HomeRu} />
      <Route component={HomeEn} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router hook={useHashLocation}>
          <AppRouter />
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
