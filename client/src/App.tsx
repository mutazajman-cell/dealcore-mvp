import { useMemo, useState } from "react";
import { Switch, Route, Router } from "wouter";
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

type Stats = {
  items: number;
  brands: number;
  categories: number;
  leads: number;
  lastUpdated: string;
};

type LeadMode = "buyer_request" | "supplier_onboarding" | "general";

const categoriesFallback = ["All", "Workstation Laptop", "Business Laptop", "Rugged Laptop", "Laptop"];

function Logo() {
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
        <div className="text-xs text-muted-foreground">Laptop supply catalog</div>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(() => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm"
      aria-label="Toggle theme"
      data-testid="button-theme-toggle"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function formatPrice(value: CatalogItem["priceAed"]) {
  if (value === "" || value === undefined || value === null) return "By request";
  const number = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(number)) return "By request";
  return `${new Intl.NumberFormat("en-AE").format(number)} AED`;
}

function buildWhatsAppLink(item: CatalogItem) {
  const base = item.whatsapp || "https://wa.me/";
  const text = encodeURIComponent(
    `Hello, I want to request current availability and final offer for: ${item.title} (${formatPrice(item.priceAed)}).`,
  );
  return base.includes("?") ? `${base}&text=${text}` : `${base}?text=${text}`;
}

function RequestPanel({
  mode,
  product,
  onClose,
}: {
  mode: LeadMode;
  product?: CatalogItem;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const defaultMessage =
    mode === "supplier_onboarding"
      ? "We want to add our supplier stock to the catalog. Please contact us."
      : product
        ? `Please send final offer and availability for ${product.title}.`
        : "Please contact me about the current laptop catalog.";
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
        productTitle: product?.title || "",
        ...form,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Request saved",
        description: "The request is now in the project backend. You can follow up manually.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Request was not saved",
        description: error instanceof Error ? error.message : "Please check the fields and try again.",
        variant: "destructive",
      });
    },
  });

  const title =
    mode === "supplier_onboarding"
      ? "Add supplier stock"
      : product
        ? `Request: ${product.title}`
        : "Send a request";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 sm:items-center sm:p-6" role="dialog">
      <div className="w-full max-w-2xl rounded-t-3xl border border-border bg-card p-5 shadow-2xl sm:rounded-3xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Lead capture</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight" data-testid="text-request-title">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border"
            aria-label="Close request form"
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
              Name
              <input
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="min-h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="Your name"
                data-testid="input-lead-name"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Contact
              <input
                required
                value={form.contact}
                onChange={(event) => setForm({ ...form, contact: event.target.value })}
                className="min-h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="WhatsApp, phone or email"
                data-testid="input-lead-contact"
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-medium">
            Company
            <input
              value={form.company}
              onChange={(event) => setForm({ ...form, company: event.target.value })}
              className="min-h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="Optional"
              data-testid="input-lead-company"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Message
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
            {mutation.isPending ? "Saving..." : "Save request"}
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function ProductCard({ item, onRequest }: { item: CatalogItem; onRequest: (item: CatalogItem) => void }) {
  return (
    <article className="group rounded-3xl border border-card-border bg-card p-4 shadow-sm" data-testid={`card-product-${item.id}`}>
      <div className="flex min-h-36 items-center justify-center rounded-2xl bg-muted text-primary">
        <Laptop className="h-12 w-12" aria-hidden="true" />
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{item.brand}</p>
          <h3 className="mt-1 text-base font-semibold leading-tight" data-testid={`text-product-title-${item.id}`}>
            {item.title}
          </h3>
        </div>
        <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          {item.condition || "A/B"}
        </span>
      </div>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-2xl bg-background p-3">
          <Cpu className="mb-1 h-3.5 w-3.5 text-muted-foreground" />
          <div className="font-medium">{item.cpu || "CPU"}</div>
        </div>
        <div className="rounded-2xl bg-background p-3">
          <div className="mb-1 text-muted-foreground">RAM</div>
          <div className="font-medium">{item.ramGb ? `${item.ramGb} GB` : "Ask"}</div>
        </div>
        <div className="rounded-2xl bg-background p-3">
          <div className="mb-1 text-muted-foreground">SSD</div>
          <div className="font-medium">{item.ssdGb ? `${item.ssdGb} GB` : "Ask"}</div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold tabular-nums" data-testid={`text-price-${item.id}`}>
            {formatPrice(item.priceAed)}
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {item.location || "UAE"} · {item.availability}
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
          Request
        </button>
        <a
          href={buildWhatsAppLink(item)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-3 text-sm font-semibold"
          data-testid={`link-whatsapp-${item.id}`}
        >
          WhatsApp
        </a>
      </div>
    </article>
  );
}

function Home() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [brand, setBrand] = useState("All");
  const [leadMode, setLeadMode] = useState<LeadMode | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<CatalogItem | undefined>();

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
      const matchesQuery =
        !needle ||
        [item.title, item.brand, item.model, item.cpu, item.description, item.category]
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Logo />
          <nav className="hidden items-center gap-2 md:flex" aria-label="Primary navigation">
            <button
              onClick={() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" })}
              className="min-h-11 rounded-full px-4 text-sm font-medium text-muted-foreground hover:text-foreground"
              data-testid="button-nav-catalog"
            >
              Catalog
            </button>
            <button
              onClick={() => document.getElementById("suppliers")?.scrollIntoView({ behavior: "smooth" })}
              className="min-h-11 rounded-full px-4 text-sm font-medium text-muted-foreground hover:text-foreground"
              data-testid="button-nav-suppliers"
            >
              Suppliers
            </button>
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openRequest("supplier_onboarding")}
              className="hidden min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold sm:inline-flex"
              data-testid="button-add-supplier-header"
            >
              Add supplier
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-16">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Active v0.1 catalog · UAE sourcing
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl" data-testid="text-hero-title">
              Find available professional laptops from Sharjah suppliers faster.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
              A working sourcing resource with initial supplier stock, searchable catalog, request capture and WhatsApp follow-up.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
                data-testid="button-view-catalog"
              >
                View catalog <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => openRequest("general")}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-border px-5 text-sm font-semibold"
                data-testid="button-request-offer"
              >
                Request commercial offer
              </button>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-card-border bg-card p-5 shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Published items", value: statsQuery.data?.items ?? items.length, icon: Database },
                { label: "Brands", value: statsQuery.data?.brands ?? 0, icon: ShieldCheck },
                { label: "Categories", value: statsQuery.data?.categories ?? 0, icon: Filter },
                { label: "Saved leads", value: statsQuery.data?.leads ?? 0, icon: Users },
              ].map((stat) => (
                <div key={stat.label} className="rounded-3xl bg-background p-4" data-testid={`card-stat-${stat.label}`}>
                  <stat.icon className="h-5 w-5 text-primary" />
                  <div className="mt-5 text-3xl font-semibold tabular-nums">{stat.value}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-3xl bg-primary p-5 text-primary-foreground">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4" /> Ready for market testing
              </div>
              <p className="mt-3 text-sm leading-6 opacity-90">
                Use this link for first supplier conversations, buyer requests and commercial proposal validation.
              </p>
            </div>
          </aside>
        </section>

        <section id="catalog" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 border-t border-border pt-8 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Live catalog</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Initial supplier assortment</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Search and filter the active v0.1 stock. Availability is confirmed after request.
              </p>
            </div>
            <div className="text-sm text-muted-foreground" data-testid="text-result-count">
              Showing {filtered.length} of {items.length} products
            </div>
          </div>

          <div className="mt-6 grid gap-3 rounded-3xl border border-card-border bg-card p-3 lg:grid-cols-[1fr_220px_180px]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="min-h-12 w-full rounded-2xl border border-input bg-background pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="Search brand, model, CPU..."
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
                  {value}
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
                  {value}
                </option>
              ))}
            </select>
          </div>

          {catalogQuery.isLoading ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-96 animate-pulse rounded-3xl bg-muted" />
              ))}
            </div>
          ) : filtered.length ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <ProductCard key={item.id} item={item} onRequest={(product) => openRequest("buyer_request", product)} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-3xl border border-dashed border-border bg-card p-10 text-center">
              <PackagePlus className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No matching products yet</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Send a request anyway and the team can source the right configuration manually.
              </p>
              <button
                type="button"
                onClick={() => openRequest("general")}
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
                data-testid="button-empty-request"
              >
                Send request
              </button>
            </div>
          )}
        </section>

        <section id="suppliers" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-4 rounded-[2rem] border border-card-border bg-card p-6 lg:grid-cols-[1fr_0.7fr] lg:p-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">For suppliers</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Add partial stock now, improve the catalog later.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Suppliers can share a partial assortment first. The resource can publish selected items, receive buyer requests and update stock progressively.
              </p>
            </div>
            <div className="flex items-center lg:justify-end">
              <button
                type="button"
                onClick={() => openRequest("supplier_onboarding")}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
                data-testid="button-add-supplier-section"
              >
                <Building2 className="h-4 w-4" /> Add supplier stock
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-8 text-sm text-muted-foreground sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 sm:flex-row">
          <div>Sharjah Sourcing v0.1 · working MVP</div>
          <div>Temporary launch environment. Main .ae domain can be connected later.</div>
        </div>
      </footer>

      {leadMode && <RequestPanel mode={leadMode} product={selectedProduct} onClose={() => setLeadMode(null)} />}
    </div>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={Home} />
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
