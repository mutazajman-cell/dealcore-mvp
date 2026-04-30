import { useEffect, useMemo, useState } from "react";
import { Switch, Route, Router, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider, useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Cpu,
  Database,
  Filter,
  HandCoins,
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
import type { CargoRequest, CatalogItem, InspectionReport, Inspector, Lead, ModelLibraryEntry, Supplier } from "@shared/schema";

type Lang = "en" | "ru";

type Stats = {
  items: number;
  brands: number;
  categories: number;
  leads: number;
  suppliers?: number;
  lastUpdated: string;
};

type LeadMode = "buyer_request" | "inspection_request" | "cargo_request" | "supplier_onboarding" | "general";

const ADMIN_CODE = "7788";

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
    navInspection: "Inspection",
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
    inspectProduct: "Order inspection",
    cargoProduct: "Buyout & delivery",
    whatsapp: "WhatsApp",
    inspectionEyebrow: "Paid pre-purchase check",
    inspectionTitle: "Independent laptop inspection before payment.",
    inspectionBody:
      "The buyer can speak with the supplier directly, then order an expert visit before purchase. The expert checks the laptop and sends a report before the buyer decides whether to pay. Live photos and video are produced only by the inspection expert: the video records the on-site tests from this checklist, and live photos document any external defects found on the unit.",
    inspectionChecklist: ["Display test", "Temperature test", "Ports", "Keyboard", "Battery wear"],
    inspectionNote:
      "Catalog cards use a typical model-library photo on a white/neutral background. Suppliers and Dealcore staff do not upload live product photos. Live photos and the test video are created only by the inspection expert after an inspection order. Payment, pickup and delivery are handled separately through the buyer or a logistics partner.",
    inspectionCta: "Order inspection",
    cargoEyebrow: "Partner buyout and cargo",
    cargoTitle: "After inspection, send buyout and delivery to the partner.",
    cargoBody:
      "The buyer fills product price, supplier contact, UAE pickup point and Russia delivery details. The cargo/payment partner takes over the buyout, pickup and shipping process.",
    cargoCta: "Request buyout and delivery",
    suppliersEyebrow: "For suppliers",
    suppliersTitle: "Add partial stock now, improve the catalog later.",
    suppliersBody:
      "Suppliers can share a partial assortment first. The resource can publish selected items, receive buyer requests and update stock progressively.",
    addSupplierStock: "Add supplier stock",
    footerLeft: "Sharjah Sourcing v0.1 · working MVP",
    footerRight: "Temporary launch environment. Main .ae domain can be connected later.",
    adminPanel: "Admin panel",
    requestPanel: {
      eyebrow: "Lead capture",
      addSupplierTitle: "Add supplier stock",
      sendRequestTitle: "Send a request",
      inspectionTitle: "Order pre-purchase inspection",
      cargoTitle: "Buyout and delivery request",
      productTitle: (title: string) => `Request: ${title}`,
      inspectionProductTitle: (title: string) => `Inspection: ${title}`,
      cargoProductTitle: (title: string) => `Buyout and delivery: ${title}`,
      name: "Name",
      contact: "Contact",
      company: "Company",
      message: "Message",
      cityRf: "City in Russia",
      deliveryAddressRf: "Delivery address in Russia",
      itemPriceAed: "Item price AED",
      quantity: "Quantity",
      supplierContact: "Supplier contact",
      supplierAddressUae: "Pickup address in UAE",
      paymentMethod: "Payment method",
      inspector: "Inspection executor",
      namePlaceholder: "Your name",
      contactPlaceholder: "WhatsApp, phone or email",
      companyPlaceholder: "Optional",
      cityRfPlaceholder: "Moscow",
      deliveryAddressRfPlaceholder: "City, street, pickup details",
      itemPriceAedPlaceholder: "2600",
      quantityPlaceholder: "1",
      supplierContactPlaceholder: "Supplier WhatsApp or shop contact",
      supplierAddressUaePlaceholder: "Shop / market / location",
      paymentMethodPlaceholder: "Crypto, cash, transfer, other",
      closeLabel: "Close request form",
      saving: "Saving...",
      save: "Save request",
      defaultSupplierMessage: "We want to add our supplier stock to the catalog. Please contact us.",
      defaultProductMessage: (title: string) => `Please send final offer and availability for ${title}.`,
      defaultInspectionMessage: (title: string) =>
        `I want to order a paid pre-purchase inspection for ${title}. Please contact me with the inspection price and payment instructions.`,
      defaultCargoMessage: (title: string) =>
        `I want to request partner buyout and delivery for ${title}. Please contact me to confirm the buyout/payment/cargo process.`,
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
    navInspection: "Проверка",
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
    inspectProduct: "Заказать проверку",
    cargoProduct: "Выкуп и доставка",
    whatsapp: "WhatsApp",
    inspectionEyebrow: "Платная проверка перед выкупом",
    inspectionTitle: "Независимая проверка ноутбука до оплаты поставщику.",
    inspectionBody:
      "Покупатель может напрямую обсудить товар с поставщиком, а перед оплатой заказать выезд эксперта. Эксперт проверяет ноутбук по чек-листу и отправляет отчет покупателю. Живые фото и видео делает только эксперт-проверяющий: видео фиксирует тесты по чек-листу, живые фото показывают внешние дефекты, если они есть.",
    inspectionChecklist: ["Тест дисплея", "Тест температуры", "Порты", "Клавиатура", "Износ АКБ"],
    inspectionNote:
      "В каталоге используются типовые библиотечные фото моделей на белом/нейтральном фоне. Поставщики и сотрудники Dealcore не загружают живые фото товара. Живые фото и видео тестов создаёт только эксперт-проверяющий после заказа проверки. Оплата товара, забор и доставка оформляются отдельно через покупателя или логистического партнера.",
    inspectionCta: "Заказать проверку",
    cargoEyebrow: "Выкуп и доставка через партнера",
    cargoTitle: "После проверки покупатель передает выкуп и доставку партнеру.",
    cargoBody:
      "Покупатель указывает цену товара, контакт поставщика, адрес забора в ОАЭ и адрес получения в РФ. Партнер дальше сам принимает оплату, забирает товар и отправляет груз.",
    cargoCta: "Оформить выкуп и доставку",
    suppliersEyebrow: "Для поставщиков",
    suppliersTitle: "Добавьте часть ассортимента сейчас, улучшайте каталог позже.",
    suppliersBody:
      "Поставщики могут сначала передать частичный ассортимент. Ресурс публикует выбранные позиции, принимает заявки и постепенно обновляет наличие.",
    addSupplierStock: "Добавить ассортимент",
    footerLeft: "Sharjah Sourcing v0.1 · рабочий MVP",
    footerRight: "Временная среда запуска. Основной .ae домен можно подключить позже.",
    adminPanel: "Рабочая панель",
    requestPanel: {
      eyebrow: "Сбор заявки",
      addSupplierTitle: "Добавить ассортимент поставщика",
      sendRequestTitle: "Отправить заявку",
      inspectionTitle: "Заказать проверку перед выкупом",
      cargoTitle: "Заявка на выкуп и доставку",
      productTitle: (title: string) => `Заявка: ${title}`,
      inspectionProductTitle: (title: string) => `Проверка: ${title}`,
      cargoProductTitle: (title: string) => `Выкуп и доставка: ${title}`,
      name: "Имя",
      contact: "Контакт",
      company: "Компания",
      message: "Сообщение",
      cityRf: "Город в РФ",
      deliveryAddressRf: "Адрес получения в РФ",
      itemPriceAed: "Цена товара AED",
      quantity: "Количество",
      supplierContact: "Контакт поставщика",
      supplierAddressUae: "Адрес забора в ОАЭ",
      paymentMethod: "Как удобно оплатить",
      inspector: "Исполнитель проверки",
      namePlaceholder: "Ваше имя",
      contactPlaceholder: "WhatsApp, телефон или email",
      companyPlaceholder: "Необязательно",
      cityRfPlaceholder: "Москва",
      deliveryAddressRfPlaceholder: "Город, улица, склад/адрес получения",
      itemPriceAedPlaceholder: "2600",
      quantityPlaceholder: "1",
      supplierContactPlaceholder: "WhatsApp поставщика или контакт магазина",
      supplierAddressUaePlaceholder: "Магазин / рынок / локация",
      paymentMethodPlaceholder: "Крипта, наличные, перевод, другое",
      closeLabel: "Закрыть форму заявки",
      saving: "Сохраняем...",
      save: "Сохранить заявку",
      defaultSupplierMessage: "Хотим добавить ассортимент поставщика в каталог. Свяжитесь с нами.",
      defaultProductMessage: (title: string) =>
        `Прошу отправить финальное коммерческое предложение и актуальное наличие по позиции: ${title}.`,
      defaultInspectionMessage: (title: string) =>
        `Хочу заказать платную проверку перед выкупом по позиции: ${title}. Свяжитесь со мной, чтобы согласовать стоимость проверки и способ предоплаты.`,
      defaultCargoMessage: (title: string) =>
        `Хочу оформить выкуп и доставку через партнера по позиции: ${title}. Свяжитесь со мной, чтобы согласовать оплату, забор и доставку.`,
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

function quantityLabel(value: CatalogItem["quantity"], lang: Lang) {
  const text = value === undefined || value === null ? "" : String(value).trim();
  if (!text) return lang === "ru" ? "Количество уточнить" : "Qty by request";
  return lang === "ru" ? `В наличии: ${text} шт.` : `Available: ${text} pcs`;
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

function productPhotoSrc(item?: Pick<CatalogItem, "photoUrl">) {
  if (!item?.photoUrl) return "";
  if (/^https?:\/\//i.test(item.photoUrl)) return item.photoUrl;
  return item.photoUrl.replace(/^\/+/, "");
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
      : mode === "inspection_request"
        ? t.defaultInspectionMessage(displayTitle || (lang === "ru" ? "выбранному товару" : "the selected item"))
      : mode === "cargo_request"
        ? t.defaultCargoMessage(displayTitle || (lang === "ru" ? "выбранному товару" : "the selected item"))
      : product
        ? t.defaultProductMessage(displayTitle)
        : t.defaultGeneralMessage;
  const [form, setForm] = useState({
    name: "",
    contact: "",
    company: "",
    message: defaultMessage,
  });
  const [selectedInspectorId, setSelectedInspectorId] = useState("");
  const [cargoForm, setCargoForm] = useState({
    cityRf: "",
    deliveryAddressRf: "",
    itemPriceAed: product?.priceAed ? String(product.priceAed) : "",
    quantity: product?.quantity ? String(product.quantity) : "1",
    supplierContact: product?.whatsapp || "",
    supplierAddressUae: product?.location || "UAE",
    paymentMethod: "",
  });
  const inspectorsQuery = useQuery<Inspector[]>({
    queryKey: ["/api/inspectors"],
    enabled: mode === "inspection_request",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (mode === "cargo_request") {
        const res = await apiRequest("POST", "/api/cargo-requests", {
          productId: product?.id || "",
          productTitle: product ? productTitle(product, lang) : "",
          buyerName: form.name,
          buyerContact: form.contact,
          cityRf: cargoForm.cityRf,
          deliveryAddressRf: cargoForm.deliveryAddressRf,
          itemPriceAed: cargoForm.itemPriceAed,
          quantity: cargoForm.quantity,
          supplierContact: cargoForm.supplierContact,
          supplierAddressUae: cargoForm.supplierAddressUae,
          paymentMethod: cargoForm.paymentMethod,
          comments: form.message,
        });
        return res.json();
      }
      const selectedInspector = (inspectorsQuery.data || []).find((item) => String(item.id) === selectedInspectorId);
      const res = await apiRequest("POST", "/api/leads", {
        requestType: mode,
        productId: product?.id || "",
        productTitle: product ? productTitle(product, lang) : "",
        ...form,
        message:
          mode === "inspection_request" && selectedInspector
            ? `${form.message}\n\n${lang === "ru" ? "Выбранный исполнитель" : "Selected inspector"}: ${selectedInspector.name}, ${selectedInspector.location}, ${selectedInspector.priceAed} AED, ${selectedInspector.contact}`
            : form.message,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cargo-requests"] });
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
    mode === "supplier_onboarding"
      ? t.addSupplierTitle
      : mode === "inspection_request"
        ? product
          ? t.inspectionProductTitle(displayTitle)
          : t.inspectionTitle
      : mode === "cargo_request"
        ? product
          ? t.cargoProductTitle(displayTitle)
          : t.cargoTitle
        : product
          ? t.productTitle(displayTitle)
          : t.sendRequestTitle;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-border bg-card p-5 shadow-2xl sm:rounded-3xl sm:p-6">
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
          {mode === "inspection_request" ? (
            <div className="grid gap-3 rounded-2xl border border-border bg-background p-3">
              <div className="text-sm font-semibold">{t.inspector}</div>
              <div className="grid gap-2">
                {(inspectorsQuery.data || []).map((inspector) => (
                  <button
                    key={inspector.id}
                    type="button"
                    onClick={() => setSelectedInspectorId(String(inspector.id))}
                    className={`grid gap-1 rounded-2xl border p-3 text-left text-sm ${
                      selectedInspectorId === String(inspector.id)
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card"
                    }`}
                    data-testid={`button-select-inspector-${inspector.id}`}
                  >
                    <span className="font-semibold">
                      {inspector.name} · {inspector.priceAed || "—"} AED · ★ {inspector.rating}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {inspector.location} · {inspector.languages} · {inspector.availability}
                    </span>
                  </button>
                ))}
                {!inspectorsQuery.data?.length ? (
                  <div className="rounded-2xl border border-dashed border-border bg-card p-3 text-sm text-muted-foreground">
                    {lang === "ru" ? "Исполнителей пока нет в базе." : "No inspectors in the database yet."}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
          {mode === "cargo_request" ? (
            <div className="grid gap-3 rounded-2xl border border-border bg-background p-3 sm:grid-cols-2">
              {[
                ["cityRf", t.cityRf, t.cityRfPlaceholder],
                ["deliveryAddressRf", t.deliveryAddressRf, t.deliveryAddressRfPlaceholder],
                ["itemPriceAed", t.itemPriceAed, t.itemPriceAedPlaceholder],
                ["quantity", t.quantity, t.quantityPlaceholder],
                ["supplierContact", t.supplierContact, t.supplierContactPlaceholder],
                ["supplierAddressUae", t.supplierAddressUae, t.supplierAddressUaePlaceholder],
                ["paymentMethod", t.paymentMethod, t.paymentMethodPlaceholder],
              ].map(([key, label, placeholder]) => (
                <label key={key} className="grid gap-2 text-sm font-medium">
                  {label}
                  <input
                    value={String(cargoForm[key as keyof typeof cargoForm])}
                    onChange={(event) => setCargoForm({ ...cargoForm, [key]: event.target.value })}
                    className="min-h-11 rounded-xl border border-input bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    placeholder={placeholder}
                    data-testid={`input-cargo-${key}`}
                  />
                </label>
              ))}
            </div>
          ) : null}
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
  onInspection,
  onCargo,
}: {
  lang: Lang;
  item: CatalogItem;
  onRequest: (item: CatalogItem) => void;
  onInspection: (item: CatalogItem) => void;
  onCargo: (item: CatalogItem) => void;
}) {
  const t = copy[lang];

  return (
    <article className="group rounded-3xl border border-card-border bg-card p-4 shadow-sm" data-testid={`card-product-${item.id}`}>
      <div className="flex min-h-36 items-center justify-center overflow-hidden rounded-2xl bg-white text-primary">
        {productPhotoSrc(item) ? (
          <img
            src={productPhotoSrc(item)}
            alt={`${item.brand} ${item.model}`}
            className="h-40 w-full object-contain p-3 transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
            data-testid={`img-product-${item.id}`}
          />
        ) : (
          <Laptop className="h-12 w-12" aria-hidden="true" />
        )}
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
          <div
            className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
            data-testid={`text-quantity-${item.id}`}
          >
            <PackagePlus className="h-3 w-3" /> {quantityLabel(item.quantity, lang)}
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        <button
          type="button"
          onClick={() => onInspection(item)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary/10 px-3 text-sm font-semibold text-primary"
          data-testid={`button-inspection-${item.id}`}
        >
          <ClipboardCheck className="h-4 w-4" /> {t.inspectProduct}
        </button>
        <button
          type="button"
          onClick={() => onCargo(item)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-background px-3 text-sm font-semibold text-primary"
          data-testid={`button-cargo-${item.id}`}
        >
          <HandCoins className="h-4 w-4" /> {t.cargoProduct}
        </button>
        <div className="grid grid-cols-2 gap-2">
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
      </div>
    </article>
  );
}

function AdminPage() {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [productForm, setProductForm] = useState({
    category: "Laptop",
    brand: "",
    model: "",
    cpu: "",
    ramGb: "",
    ssdGb: "",
    condition: "A/B",
    quantity: "",
    priceAed: "",
    seller: "",
    whatsapp: "",
    location: "Sharjah, UAE",
    availability: "Check availability",
    photoUrl: "",
  });
  const [modelSearch, setModelSearch] = useState("");
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    contact: "",
    company: "",
    location: "Sharjah, UAE",
    whatsapp: "",
    categories: "Laptops",
    notes: "",
  });
  const [inspectorForm, setInspectorForm] = useState({
    name: "",
    contact: "",
    location: "Sharjah, UAE",
    languages: "RU / EN",
    priceAed: "120",
    rating: "5.0",
    completedChecks: "0",
    availability: "Today / tomorrow",
    notes: "",
  });
  const [reportForm, setReportForm] = useState({
    leadId: "",
    productTitle: "",
    inspectorName: "",
    supplierName: "",
    serialNumber: "",
    displayTest: "Pass",
    temperatureTest: "Pass",
    portsTest: "Pass",
    keyboardTest: "Pass",
    batteryTest: "Pass",
    photosLink: "",
    verdict: "pass",
    comments: "",
  });

  const catalogQuery = useQuery<CatalogItem[]>({ queryKey: ["/api/catalog"], enabled: unlocked });
  const leadsQuery = useQuery<Lead[]>({ queryKey: ["/api/leads"], enabled: unlocked });
  const suppliersQuery = useQuery<Supplier[]>({ queryKey: ["/api/suppliers"], enabled: unlocked });
  const inspectorsQuery = useQuery<Inspector[]>({ queryKey: ["/api/inspectors"], enabled: unlocked });
  const reportsQuery = useQuery<InspectionReport[]>({ queryKey: ["/api/inspection-reports"], enabled: unlocked });
  const cargoQuery = useQuery<CargoRequest[]>({ queryKey: ["/api/cargo-requests"], enabled: unlocked });
  const statsQuery = useQuery<Stats>({ queryKey: ["/api/stats"], enabled: unlocked });
  const modelLibraryQuery = useQuery<ModelLibraryEntry[]>({ queryKey: ["/api/model-library"], enabled: unlocked });

  const modelOptions = useMemo(() => {
    const byModel = new Map<string, CatalogItem>();
    for (const entry of modelLibraryQuery.data || []) {
      const key = `${entry.brand} ${entry.model}`.trim();
      if (!key) continue;
      const synthetic: CatalogItem = {
        id: `lib-${entry.modelId}`,
        category: entry.category || "Laptop",
        subcategory: entry.subcategory || "",
        brand: entry.brand,
        model: entry.model,
        title: entry.catalogTitle || `${entry.brand} ${entry.model}`,
        description: entry.descriptionEn || entry.descriptionRu || "",
        cpu: entry.cpu || "",
        ramGb: entry.ramGb || "",
        ssdGb: entry.ssdGb || "",
        condition: "",
        quantity: "",
        priceAed: entry.basePriceAed || "",
        priceRub: "",
        priceStatus: "By request",
        availability: "Check availability",
        seller: "",
        whatsapp: "",
        location: "UAE",
        leadAction: "Request price",
        photoUrl: entry.photoUrl || "",
      };
      byModel.set(key, synthetic);
    }
    for (const item of catalogQuery.data || []) {
      const key = `${item.brand} ${item.model}`.trim();
      if (!key) continue;
      const existing = byModel.get(key);
      if (!existing) {
        byModel.set(key, item);
      } else if (!existing.photoUrl && item.photoUrl) {
        byModel.set(key, { ...existing, photoUrl: item.photoUrl });
      }
    }
    return Array.from(byModel.values()).sort((a, b) =>
      `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`),
    );
  }, [catalogQuery.data, modelLibraryQuery.data]);

  const modelBrands = useMemo(
    () => Array.from(new Set(modelOptions.map((item) => item.brand).filter(Boolean))).sort(),
    [modelOptions],
  );

  const filteredModelOptions = useMemo(() => {
    const terms = modelSearch
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    const filtered = terms.length
      ? modelOptions.filter((item) => {
          const haystack = [item.brand, item.model, item.cpu, item.category, item.subcategory]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return terms.every((term) => haystack.includes(term));
        })
      : modelOptions;

    return filtered.slice(0, 8);
  }, [modelOptions, modelSearch]);

  function applyModelFromLibrary(modelKey: string) {
    const item = modelOptions.find((option) => `${option.brand} ${option.model}`.trim() === modelKey);
    if (!item) return;
    setProductForm((current) => ({
      ...current,
      category: item.category || current.category,
      brand: item.brand || current.brand,
      model: item.model || current.model,
      cpu: String(item.cpu || current.cpu || ""),
      ramGb: String(item.ramGb || current.ramGb || ""),
      ssdGb: String(item.ssdGb || current.ssdGb || ""),
      photoUrl: item.photoUrl || current.photoUrl,
    }));
    setModelSearch(`${item.brand} ${item.model}`.trim());
  }

  const productMutation = useMutation({
    mutationFn: async () => {
      const title = `${productForm.brand} ${productForm.model}`.trim();
      const quantityText = productForm.quantity ? ` Quantity: ${productForm.quantity} pcs.` : "";
      const description = `${title}, ${productForm.cpu || "CPU by request"}, ${productForm.ramGb || "RAM"}GB RAM, ${
        productForm.ssdGb || "SSD"
      }GB SSD. Supplier: ${productForm.seller || "UAE supplier"}.${quantityText}`;
      const res = await apiRequest("POST", "/api/products", {
        ...productForm,
        title,
        description,
        subcategory: "",
        priceRub: "",
        priceStatus: productForm.priceAed ? "Fixed" : "By request",
        leadAction: "Request price",
        photoUrl: productForm.photoUrl,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catalog"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Товар добавлен", description: "Он уже доступен в каталоге." });
      setProductForm({
        category: "Laptop",
        brand: "",
        model: "",
        cpu: "",
        ramGb: "",
        ssdGb: "",
        condition: "A/B",
        quantity: "",
        priceAed: "",
        seller: "",
        whatsapp: "",
        location: "Sharjah, UAE",
        availability: "Check availability",
        photoUrl: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Товар не добавлен",
        description: error instanceof Error ? error.message : "Проверь поля",
        variant: "destructive",
      });
    },
  });

  const supplierMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/suppliers", supplierForm);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Поставщик добавлен", description: "Контакт сохранен в рабочей базе." });
      setSupplierForm({
        name: "",
        contact: "",
        company: "",
        location: "Sharjah, UAE",
        whatsapp: "",
        categories: "Laptops",
        notes: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Поставщик не добавлен",
        description: error instanceof Error ? error.message : "Проверь поля",
        variant: "destructive",
      });
    },
  });

  const inspectorMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/inspectors", inspectorForm);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inspectors"] });
      toast({ title: "Исполнитель добавлен", description: "Теперь его можно выбирать при заказе проверки." });
      setInspectorForm({
        name: "",
        contact: "",
        location: "Sharjah, UAE",
        languages: "RU / EN",
        priceAed: "120",
        rating: "5.0",
        completedChecks: "0",
        availability: "Today / tomorrow",
        notes: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Исполнитель не добавлен",
        description: error instanceof Error ? error.message : "Проверь поля",
        variant: "destructive",
      });
    },
  });

  const reportMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/inspection-reports", reportForm);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inspection-reports"] });
      toast({ title: "Отчет сохранен", description: "Отчет проверки появился в рабочей панели." });
      setReportForm({
        leadId: "",
        productTitle: "",
        inspectorName: "",
        supplierName: "",
        serialNumber: "",
        displayTest: "Pass",
        temperatureTest: "Pass",
        portsTest: "Pass",
        keyboardTest: "Pass",
        batteryTest: "Pass",
        photosLink: "",
        verdict: "pass",
        comments: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Отчет не сохранен",
        description: error instanceof Error ? error.message : "Проверь поля",
        variant: "destructive",
      });
    },
  });

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-background px-4 py-10 text-foreground">
        <div className="mx-auto max-w-md rounded-[2rem] border border-card-border bg-card p-6 shadow-sm">
          <Logo lang="ru" />
          <h1 className="mt-8 text-2xl font-semibold tracking-tight">Рабочая панель</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Введите код доступа, чтобы добавлять товары, поставщиков и смотреть заявки.
          </p>
          <form
            className="mt-6 grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (code.trim() === ADMIN_CODE) {
                setUnlocked(true);
              } else {
                toast({ title: "Неверный код", description: "Проверь код доступа.", variant: "destructive" });
              }
            }}
          >
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="min-h-12 rounded-2xl border border-input bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="Код доступа"
              data-testid="input-admin-code"
            />
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
              data-testid="button-admin-unlock"
            >
              Открыть панель
            </button>
          </form>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Товаров в каталоге", value: statsQuery.data?.items ?? catalogQuery.data?.length ?? 0 },
    { label: "Заявок", value: statsQuery.data?.leads ?? leadsQuery.data?.length ?? 0 },
    { label: "Поставщиков", value: statsQuery.data?.suppliers ?? suppliersQuery.data?.length ?? 0 },
    { label: "Исполнителей проверки", value: inspectorsQuery.data?.length ?? 0 },
    { label: "Отчетов проверки", value: reportsQuery.data?.length ?? 0 },
    { label: "Заявок карго", value: cargoQuery.data?.length ?? 0 },
  ];
  const inspectionLeads = (leadsQuery.data || []).filter((lead) => lead.requestType === "inspection_request");
  const regularLeads = (leadsQuery.data || []).filter((lead) => lead.requestType !== "inspection_request");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <Logo lang="ru" />
          <a href="#/ru" className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-4 text-sm font-semibold">
            Открыть витрину RU
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Admin v1</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Рабочий инструмент запуска</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            Здесь добавляются товары и поставщики. Заявки покупателей появляются ниже. Это минимальная рабочая панель, чтобы начать работу в сети.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map((item) => (
            <div key={item.label} className="rounded-3xl border border-card-border bg-card p-5">
              <div className="text-3xl font-semibold tabular-nums">{item.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-[2rem] border border-card-border bg-card p-5">
            <h2 className="text-xl font-semibold tracking-tight">Добавить товар</h2>
            <form
              className="mt-5 grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                productMutation.mutate();
              }}
            >
              <div className="grid gap-3 rounded-2xl border border-border bg-background p-3">
                <label className="grid gap-2 text-sm font-medium">
                  Найти модель в библиотеке
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={modelSearch}
                      onChange={(event) => setModelSearch(event.target.value)}
                      className="min-h-11 w-full rounded-xl border border-input bg-card pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Например: Dell 7770, ZBook, Toughbook, 5420"
                      data-testid="input-product-model-search"
                    />
                  </div>
                </label>

                <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Быстрый выбор бренда">
                  {modelBrands.map((brand) => (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => setModelSearch(brand)}
                      className="shrink-0 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold"
                      data-testid={`button-model-brand-${brand.toLowerCase()}`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>

                <div className="grid gap-2" data-testid="list-model-search-results">
                  {filteredModelOptions.map((item) => {
                    const value = `${item.brand} ${item.model}`.trim();
                    const active = value === `${productForm.brand} ${productForm.model}`.trim();
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => applyModelFromLibrary(value)}
                        className={`grid min-h-20 grid-cols-[76px_1fr] items-center gap-3 rounded-2xl border p-2 text-left transition ${
                          active ? "border-primary bg-primary/10" : "border-border bg-card"
                        }`}
                        data-testid={`button-model-option-${value.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                      >
                        <span className="flex h-16 items-center justify-center overflow-hidden rounded-xl bg-white">
                          {productPhotoSrc(item) ? (
                            <img
                              src={productPhotoSrc(item)}
                              alt={value}
                              className="h-full w-full object-contain p-1"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <Laptop className="h-6 w-6 text-primary" />
                          )}
                        </span>
                        <span>
                          <span className="block text-sm font-semibold leading-tight">{value}</span>
                          <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                            {item.cpu || "CPU"} · {item.ramGb || "RAM"}GB RAM · {item.ssdGb || "SSD"}GB SSD
                          </span>
                        </span>
                      </button>
                    );
                  })}
                  {!filteredModelOptions.length ? (
                    <div className="rounded-2xl border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
                      Модель не найдена. Можно заполнить бренд и модель вручную ниже, фото добавим позже.
                    </div>
                  ) : null}
                </div>
              </div>

              {productForm.photoUrl ? (
                <div className="grid gap-3 rounded-2xl border border-border bg-background p-3 sm:grid-cols-[160px_1fr] sm:items-center">
                  <div className="flex h-28 items-center justify-center overflow-hidden rounded-xl bg-white">
                    <img
                      src={productPhotoSrc({ photoUrl: productForm.photoUrl })}
                      alt={`${productForm.brand} ${productForm.model}`}
                      className="h-full w-full object-contain p-2"
                      data-testid="img-product-preview"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Фото модели подставится автоматически · Library photo auto-applied</div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Сотрудники и поставщики не загружают живые фото товара. В каталоге используется только типовое фото из библиотеки моделей. Живые фото и видео делает эксперт-проверяющий после заказа проверки. Руками остаётся внести поставщика, цену, состояние и WhatsApp.
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Suppliers and staff do not upload live product photos. The catalog only uses typical model-library images. Live photos and test video are produced by the inspection expert after an inspection order. Manually fill only supplier, price, condition and WhatsApp.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["brand", "Бренд", "Dell"],
                  ["model", "Модель", "Precision 7770"],
                  ["cpu", "CPU", "i7 / i9 / Xeon"],
                  ["ramGb", "RAM GB", "32"],
                  ["ssdGb", "SSD GB", "512"],
                  ["quantity", "Количество", "5"],
                  ["priceAed", "Цена AED", "2600"],
                  ["seller", "Поставщик", "Supplier name"],
                  ["whatsapp", "WhatsApp номер", "+971 50 123 4567"],
                ].map(([key, label, placeholder]) => (
                  <label key={key} className="grid gap-2 text-sm font-medium">
                    {label}
                    <input
                      required={key === "brand" || key === "model"}
                      value={String(productForm[key as keyof typeof productForm])}
                      onChange={(event) => setProductForm({ ...productForm, [key]: event.target.value })}
                      className="min-h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                      placeholder={placeholder}
                      data-testid={`input-product-${key}`}
                    />
                  </label>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="grid gap-2 text-sm font-medium">
                  Категория
                  <select
                    value={productForm.category}
                    onChange={(event) => setProductForm({ ...productForm, category: event.target.value })}
                    className="min-h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="Laptop">Laptop</option>
                    <option value="Business Laptop">Business Laptop</option>
                    <option value="Workstation Laptop">Workstation Laptop</option>
                    <option value="Rugged Laptop">Rugged Laptop</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Состояние
                  <input
                    value={productForm.condition}
                    onChange={(event) => setProductForm({ ...productForm, condition: event.target.value })}
                    className="min-h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Локация
                  <input
                    value={productForm.location}
                    onChange={(event) => setProductForm({ ...productForm, location: event.target.value })}
                    className="min-h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={productMutation.isPending}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                data-testid="button-product-save"
              >
                {productMutation.isPending ? "Сохраняем..." : "Добавить товар в каталог"}
              </button>
            </form>
          </section>

          <section className="rounded-[2rem] border border-card-border bg-card p-5">
            <h2 className="text-xl font-semibold tracking-tight">Добавить поставщика</h2>
            <form
              className="mt-5 grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                supplierMutation.mutate();
              }}
            >
              {[
                ["name", "Имя контакта", "Ahmed"],
                ["contact", "Контакт", "+971 50 123 4567 / email"],
                ["company", "Компания", "Supplier LLC"],
                ["whatsapp", "WhatsApp номер", "+971 50 123 4567"],
                ["location", "Локация", "Sharjah, UAE"],
                ["categories", "Что поставляет", "Laptops, workstations"],
              ].map(([key, label, placeholder]) => (
                <label key={key} className="grid gap-2 text-sm font-medium">
                  {label}
                  <input
                    required={key === "name" || key === "contact"}
                    value={String(supplierForm[key as keyof typeof supplierForm])}
                    onChange={(event) => setSupplierForm({ ...supplierForm, [key]: event.target.value })}
                    className="min-h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    placeholder={placeholder}
                    data-testid={`input-supplier-${key}`}
                  />
                </label>
              ))}
              <label className="grid gap-2 text-sm font-medium">
                Заметки
                <textarea
                  value={supplierForm.notes}
                  onChange={(event) => setSupplierForm({ ...supplierForm, notes: event.target.value })}
                  className="min-h-24 rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Что обещал, как часто обновляет наличие, условия оплаты..."
                />
              </label>
              <button
                type="submit"
                disabled={supplierMutation.isPending}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                data-testid="button-supplier-save"
              >
                {supplierMutation.isPending ? "Сохраняем..." : "Добавить поставщика"}
              </button>
            </form>
          </section>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] border border-card-border bg-card p-5">
            <h2 className="text-xl font-semibold tracking-tight">Добавить исполнителя проверки</h2>
            <form
              className="mt-5 grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                inspectorMutation.mutate();
              }}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["name", "Имя", "Ali"],
                  ["contact", "Контакт", "+971 50 123 4567"],
                  ["location", "Локация", "Sharjah / Dubai"],
                  ["languages", "Языки", "RU / EN"],
                  ["priceAed", "Цена AED", "120"],
                  ["availability", "Доступность", "Today / tomorrow"],
                ].map(([key, label, placeholder]) => (
                  <label key={key} className="grid gap-2 text-sm font-medium">
                    {label}
                    <input
                      required={key === "name" || key === "contact"}
                      value={String(inspectorForm[key as keyof typeof inspectorForm])}
                      onChange={(event) => setInspectorForm({ ...inspectorForm, [key]: event.target.value })}
                      className="min-h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                      placeholder={placeholder}
                      data-testid={`input-inspector-${key}`}
                    />
                  </label>
                ))}
              </div>
              <label className="grid gap-2 text-sm font-medium">
                Заметки
                <textarea
                  value={inspectorForm.notes}
                  onChange={(event) => setInspectorForm({ ...inspectorForm, notes: event.target.value })}
                  className="min-h-24 rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Что умеет проверять, какие районы, условия оплаты..."
                  data-testid="textarea-inspector-notes"
                />
              </label>
              <button
                type="submit"
                disabled={inspectorMutation.isPending}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                data-testid="button-inspector-save"
              >
                {inspectorMutation.isPending ? "Сохраняем..." : "Добавить исполнителя"}
              </button>
            </form>
          </section>

          <section className="rounded-[2rem] border border-card-border bg-card p-5">
            <h2 className="text-xl font-semibold tracking-tight">Отчет проверки</h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Видео — фиксирует тесты по чек-листу (дисплей, температура, порты, клавиатура, АКБ). Живые фото — только внешние дефекты, если они есть. В карточке каталога остаётся типовое библиотечное фото модели.
            </p>
            <form
              className="mt-5 grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                reportMutation.mutate();
              }}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium">
                  Заявка на проверку
                  <select
                    value={reportForm.leadId}
                    onChange={(event) => {
                      const lead = inspectionLeads.find((item) => String(item.id) === event.target.value);
                      setReportForm({
                        ...reportForm,
                        leadId: event.target.value,
                        productTitle: lead?.productTitle || reportForm.productTitle,
                      });
                    }}
                    className="min-h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    data-testid="select-report-lead"
                  >
                    <option value="">Без привязки</option>
                    {inspectionLeads.map((lead) => (
                      <option key={lead.id} value={lead.id}>
                        #{lead.id} · {lead.productTitle || lead.name}
                      </option>
                    ))}
                  </select>
                </label>
                {[
                  ["productTitle", "Товар", "Dell Precision 7770"],
                  ["inspectorName", "Исполнитель", "Ali"],
                  ["supplierName", "Поставщик", "Supplier LLC"],
                  ["serialNumber", "Serial / Service Tag", "ABC123"],
                  ["photosLink", "Ссылка на видео тестов и фото дефектов", "Google Drive / WhatsApp"],
                ].map(([key, label, placeholder]) => (
                  <label key={key} className="grid gap-2 text-sm font-medium">
                    {label}
                    <input
                      required={key === "productTitle" || key === "inspectorName"}
                      value={String(reportForm[key as keyof typeof reportForm])}
                      onChange={(event) => setReportForm({ ...reportForm, [key]: event.target.value })}
                      className="min-h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                      placeholder={placeholder}
                      data-testid={`input-report-${key}`}
                    />
                  </label>
                ))}
                {[
                  ["displayTest", "Дисплей"],
                  ["temperatureTest", "Температура"],
                  ["portsTest", "Порты"],
                  ["keyboardTest", "Клавиатура"],
                  ["batteryTest", "АКБ"],
                ].map(([key, label]) => (
                  <label key={key} className="grid gap-2 text-sm font-medium">
                    {label}
                    <select
                      value={String(reportForm[key as keyof typeof reportForm])}
                      onChange={(event) => setReportForm({ ...reportForm, [key]: event.target.value })}
                      className="min-h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                      data-testid={`select-report-${key}`}
                    >
                      <option value="Pass">Pass</option>
                      <option value="Issue">Есть замечание</option>
                      <option value="Fail">Fail</option>
                      <option value="Not checked">Не проверял</option>
                    </select>
                  </label>
                ))}
                <label className="grid gap-2 text-sm font-medium">
                  Итог
                  <select
                    value={reportForm.verdict}
                    onChange={(event) => setReportForm({ ...reportForm, verdict: event.target.value })}
                    className="min-h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    data-testid="select-report-verdict"
                  >
                    <option value="pass">Рекомендую</option>
                    <option value="conditional">Есть замечания</option>
                    <option value="fail">Не рекомендую</option>
                  </select>
                </label>
              </div>
              <label className="grid gap-2 text-sm font-medium">
                Комментарий
                <textarea
                  value={reportForm.comments}
                  onChange={(event) => setReportForm({ ...reportForm, comments: event.target.value })}
                  className="min-h-24 rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Итог проверки, что передать покупателю..."
                  data-testid="textarea-report-comments"
                />
              </label>
              <button
                type="submit"
                disabled={reportMutation.isPending}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                data-testid="button-report-save"
              >
                {reportMutation.isPending ? "Сохраняем..." : "Сохранить отчет проверки"}
                <ClipboardList className="h-4 w-4" />
              </button>
            </form>
          </section>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-[2rem] border border-card-border bg-card p-5">
            <h2 className="text-xl font-semibold tracking-tight">Последние заявки</h2>
            <div className="mt-4 grid gap-3">
              {regularLeads.slice(0, 20).map((lead) => (
                <article key={lead.id} className="rounded-2xl bg-background p-4 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-semibold">{lead.name}</div>
                    <div className="text-xs text-muted-foreground">{lead.requestType} · {lead.status}</div>
                  </div>
                  <div className="mt-1 text-muted-foreground">{lead.contact}</div>
                  {lead.productTitle ? <div className="mt-2 font-medium">{lead.productTitle}</div> : null}
                  <p className="mt-2 leading-6">{lead.message}</p>
                </article>
              ))}
              {!regularLeads.length ? <p className="text-sm text-muted-foreground">Пока обычных заявок нет.</p> : null}
            </div>
          </section>

          <section className="rounded-[2rem] border border-card-border bg-card p-5">
            <h2 className="text-xl font-semibold tracking-tight">Заявки на проверку</h2>
            <div className="mt-4 grid gap-3">
              {inspectionLeads.slice(0, 20).map((lead) => (
                <article key={lead.id} className="rounded-2xl bg-background p-4 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-semibold">{lead.name}</div>
                    <div className="text-xs text-muted-foreground">{lead.status}</div>
                  </div>
                  <div className="mt-1 text-muted-foreground">{lead.contact}</div>
                  {lead.productTitle ? <div className="mt-2 font-medium">{lead.productTitle}</div> : null}
                  <p className="mt-2 leading-6">{lead.message}</p>
                </article>
              ))}
              {!inspectionLeads.length ? <p className="text-sm text-muted-foreground">Пока заявок на проверку нет.</p> : null}
            </div>
          </section>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <section className="rounded-[2rem] border border-card-border bg-card p-5">
            <h2 className="text-xl font-semibold tracking-tight">Заявки на выкуп/доставку</h2>
            <div className="mt-4 grid gap-3">
              {(cargoQuery.data || []).slice(0, 20).map((request) => (
                <article key={request.id} className="rounded-2xl bg-background p-4 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-semibold">{request.buyerName}</div>
                    <div className="text-xs text-muted-foreground">{request.status}</div>
                  </div>
                  <div className="mt-1 text-muted-foreground">{request.buyerContact}</div>
                  {request.productTitle ? <div className="mt-2 font-medium">{request.productTitle}</div> : null}
                  <div className="mt-2 text-muted-foreground">
                    {request.cityRf || "РФ"} · {request.itemPriceAed || "цена"} AED · {request.quantity || "1"} шт.
                  </div>
                  <p className="mt-2 leading-6">{request.comments}</p>
                </article>
              ))}
              {!cargoQuery.data?.length ? <p className="text-sm text-muted-foreground">Пока заявок карго нет.</p> : null}
            </div>
          </section>

          <section className="rounded-[2rem] border border-card-border bg-card p-5">
            <h2 className="text-xl font-semibold tracking-tight">Отчеты проверки</h2>
            <div className="mt-4 grid gap-3">
              {(reportsQuery.data || []).slice(0, 20).map((report) => (
                <article key={report.id} className="rounded-2xl bg-background p-4 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-semibold">{report.productTitle}</div>
                    <div className="text-xs text-muted-foreground">{report.verdict} · {report.status}</div>
                  </div>
                  <div className="mt-1 text-muted-foreground">{report.inspectorName} · {report.supplierName}</div>
                  <div className="mt-2 text-xs leading-5 text-muted-foreground">
                    Дисплей: {report.displayTest} · Температура: {report.temperatureTest} · АКБ: {report.batteryTest}
                  </div>
                  {report.comments ? <p className="mt-2 leading-6">{report.comments}</p> : null}
                </article>
              ))}
              {!reportsQuery.data?.length ? <p className="text-sm text-muted-foreground">Пока отчетов проверки нет.</p> : null}
            </div>
          </section>

          <section className="rounded-[2rem] border border-card-border bg-card p-5">
            <h2 className="text-xl font-semibold tracking-tight">Исполнители проверки</h2>
            <div className="mt-4 grid gap-3">
              {(inspectorsQuery.data || []).slice(0, 20).map((inspector) => (
                <article key={inspector.id} className="rounded-2xl bg-background p-4 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-semibold">{inspector.name}</div>
                    <div className="text-xs text-muted-foreground">{inspector.status}</div>
                  </div>
                  <div className="mt-1 text-muted-foreground">{inspector.contact}</div>
                  <div className="mt-2">
                    {inspector.location} · {inspector.priceAed} AED · ★ {inspector.rating}
                  </div>
                  {inspector.notes ? <p className="mt-2 leading-6 text-muted-foreground">{inspector.notes}</p> : null}
                </article>
              ))}
              {!inspectorsQuery.data?.length ? <p className="text-sm text-muted-foreground">Пока исполнителей нет.</p> : null}
            </div>
          </section>
        </div>

        <div className="mt-8">
          <section className="rounded-[2rem] border border-card-border bg-card p-5">
            <h2 className="text-xl font-semibold tracking-tight">Поставщики</h2>
            <div className="mt-4 grid gap-3">
              {(suppliersQuery.data || []).slice(0, 20).map((supplier) => (
                <article key={supplier.id} className="rounded-2xl bg-background p-4 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-semibold">{supplier.company || supplier.name}</div>
                    <div className="text-xs text-muted-foreground">{supplier.status}</div>
                  </div>
                  <div className="mt-1 text-muted-foreground">{supplier.name} · {supplier.contact}</div>
                  <div className="mt-2">{supplier.location} · {supplier.categories}</div>
                  {supplier.notes ? <p className="mt-2 leading-6 text-muted-foreground">{supplier.notes}</p> : null}
                </article>
              ))}
              {!suppliersQuery.data?.length ? <p className="text-sm text-muted-foreground">Пока поставщиков нет.</p> : null}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function Home({ initialLang = "en" }: { initialLang?: Lang }) {
  const [, navigate] = useLocation();
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
              onClick={() => document.getElementById("inspection")?.scrollIntoView({ behavior: "smooth" })}
              className="min-h-11 rounded-full px-4 text-sm font-medium text-muted-foreground hover:text-foreground"
              data-testid="button-nav-inspection"
            >
              {t.navInspection}
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
                <ProductCard
                  key={item.id}
                  lang={lang}
                  item={item}
                  onRequest={(product) => openRequest("buyer_request", product)}
                  onInspection={(product) => openRequest("inspection_request", product)}
                  onCargo={(product) => openRequest("cargo_request", product)}
                />
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

        <section id="inspection" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-6 rounded-[2rem] border border-card-border bg-card p-6 lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{t.inspectionEyebrow}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">{t.inspectionTitle}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{t.inspectionBody}</p>
              <p className="mt-4 max-w-2xl rounded-2xl bg-background p-4 text-xs leading-5 text-muted-foreground">
                {t.inspectionNote}
              </p>
              <button
                type="button"
                onClick={() => openRequest("inspection_request")}
                className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
                data-testid="button-inspection-section"
              >
                <ClipboardCheck className="h-4 w-4" /> {t.inspectionCta}
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {t.inspectionChecklist.map((item, index) => (
                <div key={item} className="rounded-2xl bg-background p-4">
                  <div className="text-xs font-semibold text-primary">0{index + 1}</div>
                  <div className="mt-2 text-sm font-semibold">{item}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="cargo" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-4 rounded-[2rem] border border-card-border bg-card p-6 lg:grid-cols-[1fr_0.7fr] lg:p-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{t.cargoEyebrow}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">{t.cargoTitle}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{t.cargoBody}</p>
            </div>
            <div className="flex items-center lg:justify-end">
              <button
                type="button"
                onClick={() => openRequest("cargo_request")}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
                data-testid="button-cargo-section"
              >
                <HandCoins className="h-4 w-4" /> {t.cargoCta}
              </button>
            </div>
          </div>
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

      <button
        type="button"
        onClick={() => navigate("/admin")}
        className="fixed bottom-6 right-6 z-40 inline-flex min-h-12 items-center justify-center rounded-full border border-primary/20 bg-primary px-5 text-xs font-semibold text-primary-foreground shadow-xl shadow-black/10 sm:bottom-8 sm:right-8"
        data-testid="button-open-admin"
      >
        {t.adminPanel}
      </button>

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
      <Route path="/admin" component={AdminPage} />
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
