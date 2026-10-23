"""
Script to generate the complete 150 distinct layout catalog for AuthCraft V2.
Each layout has unique IDs, descriptive names, custom design tokens, families, tags, and content.
"""
import json

CATEGORIES = [
    {
        "id": "minimal",
        "label": "Minimal & Clean",
        "count": 15,
        "description": "Airy, high-contrast layouts focusing on typography, whitespace, and distraction-free entry."
    },
    {
        "id": "luxury",
        "label": "Luxury & Premium",
        "count": 15,
        "description": "High-end obsidian, gold, titanium and emerald aesthetics for private banking, horlogerie and fine estates."
    },
    {
        "id": "saas",
        "label": "Modern SaaS",
        "count": 15,
        "description": "Sleek, product-led interfaces inspired by Linear, Stripe, Raycast, Supabase, and Vercel."
    },
    {
        "id": "corporate",
        "label": "Corporate & Professional",
        "count": 15,
        "description": "Trust-first, compliance-ready enterprise portals with security assurances and executive dignity."
    },
    {
        "id": "glassmorphism",
        "label": "Glassmorphism",
        "count": 10,
        "description": "Multi-layer backdrop frosted glass, specular highlights, and iridescent atmospheric gradients."
    },
    {
        "id": "dark",
        "label": "Dark & Elegant",
        "count": 10,
        "description": "Onyx, deep space, charcoal and midnight noir interfaces optimized for low-light environments."
    },
    {
        "id": "gradient",
        "label": "Gradient & Colorful",
        "count": 10,
        "description": "Vibrant chromatic energy, aurora glows, sunset horizons, and electric neon dynamics."
    },
    {
        "id": "split",
        "label": "Split Screen",
        "count": 10,
        "description": "Dual-column viewports balancing brand storytelling, social proof, or live metrics against the sign-in form."
    },
    {
        "id": "startup",
        "label": "Startup & Developer",
        "count": 10,
        "description": "Terminal CLI aesthetics, monospace prompts, hacker-first dark slates, and git-inspired motifs."
    },
    {
        "id": "ecommerce",
        "label": "E-commerce & Retail",
        "count": 10,
        "description": "Customer-friendly warm retail designs for boutiques, artisan roasters, fashion drops, and makers."
    },
    {
        "id": "creative",
        "label": "Creative & Portfolio",
        "count": 10,
        "description": "Asymmetrical, neo-brutalist, Bauhaus, and design-studio layouts for agencies and artists."
    },
    {
        "id": "education",
        "label": "Education & Community",
        "count": 10,
        "description": "Welcoming, accessible academic and social hubs for universities, bootcamps, and foundations."
    },
    {
        "id": "editorial",
        "label": "Editorial & Typography",
        "count": 5,
        "description": "Broadsheet, publication, and literary styles with dramatic serif titles and editorial columns."
    },
    {
        "id": "compact",
        "label": "Compact & Mobile-First",
        "count": 5,
        "description": "High-density mobile sheets, floating app docks, and space-saving authentication modals."
    }
]

LAYOUT_DATA = [
    # 1. Minimal and Clean (15)
    ("minimal-clean-01", "Nordic Alabaster", "minimal", "centered-minimal", "pure Scandinavian minimalism with stark contrast and clean margins",
     "bg-white text-slate-900", "bg-white border border-slate-200/80 shadow-sm p-8 sm:p-10 rounded-xl", "inside", "#0f172a", "bg-slate-900 hover:bg-slate-800 text-white shadow-sm", "border-slate-200 focus:border-slate-900 focus:ring-slate-900/10", "sans", "light", "rounded-xl", None, "dots", True, False),
    ("minimal-clean-02", "Paper & Ink", "minimal", "centered-minimal", "editorial paper texture aesthetic with subtle sepia warmth",
     "bg-stone-50 text-stone-900", "bg-white border border-stone-200 shadow-sm p-8 rounded-lg", "inside", "#1c1917", "bg-stone-900 hover:bg-stone-800 text-stone-50", "border-stone-300 focus:border-stone-900", "sans", "light", "rounded-lg", None, "none", False, False),
    ("minimal-clean-03", "Helvetica Mono-Line", "minimal", "centered-minimal", "brutalist precision with sharp borders and modernist spacing",
     "bg-zinc-100 text-zinc-950", "bg-white border-2 border-zinc-950 p-8 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]", "inside", "#09090b", "bg-zinc-950 hover:bg-zinc-800 text-white rounded-none", "border-2 border-zinc-950 rounded-none focus:ring-0", "sans", "light", "rounded-none", None, "none", False, False),
    ("minimal-clean-04", "Zen Monolith", "minimal", "centered-card", "meditative calm with balanced negative space and neutral gray tones",
     "bg-neutral-50 text-neutral-800", "bg-white/90 border border-neutral-200 shadow-md p-10 rounded-2xl", "inside", "#262626", "bg-neutral-800 hover:bg-neutral-700 text-white", "border-neutral-200 focus:border-neutral-800", "sans", "light", "rounded-2xl", None, "none", False, False),
    ("minimal-clean-05", "Tokyo High-Rise", "minimal", "centered-card", "compact Japanese grid layout with high-density precision",
     "bg-slate-100/70 text-slate-900", "bg-white border border-slate-200 shadow-lg p-8 rounded-lg", "inside", "#0284c7", "bg-sky-600 hover:bg-sky-500 text-white", "border-slate-200 focus:border-sky-600", "sans", "light", "rounded-lg", {"text": "VERIFIED SYSTEM", "variant": "blue"}, "grid", True, True),
    ("minimal-clean-06", "Ghostline Transparent", "minimal", "centered-minimal", "ultra-subtle hairline borders without heavy background cards",
     "bg-white text-slate-900", "bg-transparent border border-slate-100 p-8 rounded-xl", "inside", "#475569", "bg-slate-900 hover:bg-slate-800 text-white", "border-slate-200 focus:border-slate-800", "sans", "light", "rounded-xl", None, "none", False, False),
    ("minimal-clean-07", "Airspace Floating", "minimal", "centered-card", "elevated light card with airy soft drop shadows",
     "bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800", "bg-white shadow-xl border border-slate-100 p-10 rounded-3xl", "inside", "#3b82f6", "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20", "border-slate-200 focus:border-blue-600", "sans", "light", "rounded-3xl", None, "none", False, False),
    ("minimal-clean-08", "Clean Slate Neutral", "minimal", "centered-card", "balanced corporate slate tone suitable for everyday web apps",
     "bg-slate-50 text-slate-900", "bg-white border border-slate-200 shadow p-8 rounded-xl", "inside", "#0f172a", "bg-slate-900 hover:bg-slate-800 text-white", "border-slate-300 focus:border-slate-900", "sans", "light", "rounded-xl", None, "dots", False, False),
    ("minimal-clean-09", "Vellum Warm", "minimal", "centered-card", "gentle parchment cream tone with smooth tactile comfort",
     "bg-amber-50/40 text-stone-900", "bg-white/95 border border-amber-200/60 shadow-sm p-8 rounded-xl", "inside", "#78350f", "bg-amber-900 hover:bg-amber-800 text-amber-50", "border-amber-200 focus:border-amber-900", "serif", "light", "rounded-xl", None, "none", False, False),
    ("minimal-clean-10", "Focus Underline", "minimal", "centered-minimal", "line-first input fields with modern understated buttons",
     "bg-white text-gray-900", "bg-white p-8 sm:p-10 max-w-md w-full", "inside", "#111827", "bg-gray-900 hover:bg-black text-white rounded-md", "border-b-2 border-t-0 border-x-0 border-gray-300 rounded-none focus:border-gray-900 focus:ring-0 px-1", "sans", "light", "rounded-none", None, "none", False, False),
    ("minimal-clean-11", "Soft Pill Gentle", "minimal", "centered-card", "hyper-rounded corners with smooth friendly aesthetics",
     "bg-neutral-50 text-neutral-900", "bg-white border border-neutral-100 shadow-md p-10 rounded-[2.5rem]", "inside", "#4f46e5", "bg-indigo-600 hover:bg-indigo-500 text-white rounded-full", "rounded-full border-neutral-200 px-4", "sans", "light", "rounded-full", None, "none", False, False),
    ("minimal-clean-12", "Bare Grid Canvas", "minimal", "centered-card", "architectural blueprint background with crisp clean box",
     "bg-slate-50 text-slate-800", "bg-white border border-slate-200 shadow-sm p-8 rounded-lg", "inside", "#2563eb", "bg-blue-600 hover:bg-blue-500 text-white", "border-slate-300 focus:border-blue-600", "sans", "light", "rounded-lg", None, "grid", False, False),
    ("minimal-clean-13", "Monochrome Ink", "minimal", "centered-card", "strict black and white contrast without gray distraction",
     "bg-white text-black", "bg-white border-2 border-black p-8 rounded-md shadow-[6px_6px_0px_#000]", "inside", "#000000", "bg-black hover:bg-neutral-800 text-white rounded-none", "border border-black rounded-none", "sans", "light", "rounded-none", None, "none", False, False),
    ("minimal-clean-14", "Alpine Pure", "minimal", "centered-card", "crisp high-altitude freshness with cool icy cyan tinting",
     "bg-cyan-50/30 text-slate-800", "bg-white border border-cyan-100 shadow-md p-9 rounded-2xl", "inside", "#0891b2", "bg-cyan-700 hover:bg-cyan-600 text-white", "border-slate-200 focus:border-cyan-600", "sans", "light", "rounded-2xl", None, "none", False, False),
    ("minimal-clean-15", "Canvas Clean Studio", "minimal", "centered-card", "spacious studio layout tailored for design tools and creator platforms",
     "bg-gray-50 text-gray-900", "bg-white border border-gray-200 shadow-sm p-10 rounded-xl", "inside", "#18181b", "bg-zinc-900 hover:bg-zinc-800 text-white", "border-gray-200 focus:border-zinc-900", "sans", "light", "rounded-xl", None, "dots", False, False),

    # 2. Luxury and Premium (15)
    ("luxury-premium-01", "The Sovereign Crest", "luxury", "luxury-crest", "deep obsidian noir framed in brushed 24k gold leaf and serif royal crest",
     "bg-neutral-950 text-amber-100", "bg-neutral-900/90 border border-amber-500/40 shadow-[0_0_50px_rgba(217,119,6,0.15)] p-10 rounded-xl backdrop-blur-md", "inside", "#d97706", "bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-600 text-neutral-950 font-semibold shadow-lg shadow-amber-500/20 hover:brightness-110", "bg-neutral-950/70 border-amber-500/30 text-amber-100 focus:border-amber-400 focus:ring-amber-400/20 placeholder-amber-200/30", "serif", "luxury", "rounded-xl", {"text": "PRIVATE VAULT", "variant": "gold"}, "gold-border", True, True),
    ("luxury-premium-02", "Monaco Private Wealth", "luxury", "split-left", "split-screen private wealth management with Swiss precision and marble aesthetics",
     "bg-slate-950 text-slate-100", "bg-slate-900/95 border border-slate-700/60 p-10 rounded-2xl shadow-2xl", "inside", "#94a3b8", "bg-gradient-to-r from-slate-200 to-slate-400 text-slate-950 font-semibold hover:from-white hover:to-slate-300", "bg-slate-950/80 border-slate-700 text-white focus:border-slate-400", "serif", "luxury", "rounded-2xl", {"text": "PORTFOLIO ACCESS", "variant": "silver"}, "none", True, False),
    ("luxury-premium-03", "Maison Haute Horlogerie", "luxury", "luxury-crest", "chronograph dark slate with micro-metered golden accents and horological precision",
     "bg-zinc-950 text-zinc-100", "bg-zinc-900/90 border border-yellow-600/30 shadow-2xl p-10 rounded-lg", "inside", "#ca8a04", "bg-yellow-600 hover:bg-yellow-500 text-zinc-950 font-bold tracking-wide", "bg-zinc-950 border-zinc-800 text-white focus:border-yellow-600", "serif", "luxury", "rounded-lg", {"text": "CHRONOMÈTRE CERTIFIÉ", "variant": "gold"}, "grid", False, False),
    ("luxury-premium-04", "Atelier Parisien", "luxury", "centered-card", "warm French alabaster ivory with deckle edge elegance and bronze highlights",
     "bg-stone-100 text-stone-900", "bg-[#FAF8F5] border border-amber-900/20 shadow-xl p-10 rounded-xl", "inside", "#78350f", "bg-[#292524] hover:bg-black text-[#F5F5F4] tracking-widest font-serif", "bg-white border-amber-900/20 text-stone-900 focus:border-amber-800", "serif", "luxury", "rounded-xl", {"text": "MAISON FONDÉE 1884", "variant": "amber"}, "none", False, False),
    ("luxury-premium-05", "Belvedere Penthouse", "luxury", "split-right", "architectural luxury residential aesthetic with stone textures and sleek bronze",
     "bg-stone-900 text-stone-100", "bg-stone-900/90 border border-stone-700 p-10 rounded-2xl shadow-2xl", "inside", "#d97706", "bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold", "bg-stone-950 border-stone-700 text-white focus:border-amber-500", "sans", "luxury", "rounded-2xl", {"text": "RESIDENTS CONCIERGE", "variant": "amber"}, "none", False, True),
    ("luxury-premium-06", "Aura Fine Jewelry", "luxury", "centered-card", "deep emerald velvet tone with diamond-cut facet border and sparkling accents",
     "bg-[#031d16] text-emerald-50", "bg-[#062c22]/90 border border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.15)] p-10 rounded-2xl backdrop-blur-md", "inside", "#10b981", "bg-gradient-to-r from-emerald-400 to-teal-300 text-neutral-950 font-bold hover:brightness-110", "bg-[#021812] border-emerald-600/30 text-white focus:border-emerald-400", "serif", "luxury", "rounded-2xl", {"text": "HIGH JEWELRY SALON", "variant": "emerald"}, "none", False, False),
    ("luxury-premium-07", "Vanderbilt Heritage", "luxury", "luxury-crest", "classic mahogany wood and parchment prestige with gold seal dividers",
     "bg-[#140e0a] text-amber-50", "bg-[#1f1712]/95 border border-amber-700/50 shadow-2xl p-10 rounded-lg", "inside", "#b45309", "bg-amber-700 hover:bg-amber-600 text-amber-50 font-serif", "bg-[#140e0a] border-amber-800/40 text-amber-100 focus:border-amber-500", "serif", "luxury", "rounded-lg", {"text": "ESTATE ARCHIVE", "variant": "gold"}, "gold-border", False, False),
    ("luxury-premium-08", "Kurogane Obsidian", "luxury", "centered-card", "ultra-matte Japanese sumi-e black with gloss foil stamping and zen discipline",
     "bg-[#0d0d0e] text-neutral-200", "bg-[#141416] border border-neutral-800 shadow-2xl p-10 rounded-none", "inside", "#f4f4f5", "bg-neutral-100 hover:bg-white text-neutral-950 font-semibold tracking-widest rounded-none", "bg-[#0d0d0e] border-neutral-800 text-white focus:border-white rounded-none", "sans", "luxury", "rounded-none", {"text": "黒鉄 PRIVATE", "variant": "slate"}, "none", False, False),
    ("luxury-premium-09", "The Mayfair Club", "luxury", "luxury-crest", "private members club racing green with polished brass coat of arms",
     "bg-[#0b1c14] text-amber-100", "bg-[#102a1e]/90 border border-amber-600/40 shadow-2xl p-10 rounded-xl", "inside", "#d97706", "bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-neutral-950 font-serif font-bold", "bg-[#081710] border-amber-600/30 text-amber-100 focus:border-amber-500", "serif", "luxury", "rounded-xl", {"text": "MEMBERS ONLY", "variant": "gold"}, "gold-border", True, False),
    ("luxury-premium-10", "Riviera Yachting", "luxury", "split-left", "deep Mediterranean azure with pearl white card and polished nautical chrome",
     "bg-[#041226] text-sky-100", "bg-[#0b1e38]/90 border border-sky-400/30 p-10 rounded-2xl shadow-2xl", "inside", "#38bdf8", "bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold", "bg-[#041226] border-sky-800 text-white focus:border-sky-400", "sans", "luxury", "rounded-2xl", {"text": "MONACO YACHT CLUB", "variant": "blue"}, "none", False, True),
    ("luxury-premium-11", "Grand Cru Reserve", "luxury", "luxury-crest", "burgundy wine tone with aged bronze framing and vintage French estate heritage",
     "bg-[#1c080d] text-rose-50", "bg-[#2b0c14]/90 border border-rose-800/40 shadow-2xl p-10 rounded-xl", "inside", "#e11d48", "bg-gradient-to-r from-rose-800 to-amber-700 hover:brightness-110 text-white font-serif", "bg-[#150509] border-rose-900/50 text-rose-100 focus:border-rose-600", "serif", "luxury", "rounded-xl", {"text": "PREMIER GRAND CRU", "variant": "amber"}, "gold-border", False, False),
    ("luxury-premium-12", "Elysium Private Office", "luxury", "corporate-portal", "high-net-worth dark graphite multi-family office with 2FA security emblem",
     "bg-[#0f1115] text-slate-100", "bg-[#181a20] border border-amber-500/30 shadow-2xl p-10 rounded-xl", "inside", "#f59e0b", "bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold", "bg-[#0f1115] border-slate-700 text-white focus:border-amber-500", "sans", "luxury", "rounded-xl", {"text": "MULTI-FAMILY OFFICE", "variant": "gold"}, "grid", False, False),
    ("luxury-premium-13", "Silk & Cashmere", "luxury", "centered-card", "warm greige with matte tactile luxury and ultra-soft pillowy shadows",
     "bg-[#F3EFEA] text-[#2C2724]", "bg-white/90 border border-[#E3DDD5] shadow-[0_20px_50px_rgba(44,39,36,0.06)] p-10 rounded-3xl", "inside", "#786F66", "bg-[#2C2724] hover:bg-[#1A1715] text-[#F3EFEA] font-medium tracking-wide", "bg-[#FAF8F5] border-[#E3DDD5] text-[#2C2724] focus:border-[#786F66]", "serif", "luxury", "rounded-3xl", None, "none", False, False),
    ("luxury-premium-14", "Palazzo Venezia", "luxury", "centered-card", "classical Venetian terracotta and gold with ornate proportional harmony",
     "bg-[#17100D] text-amber-100", "bg-[#241A16] border border-amber-600/30 shadow-2xl p-10 rounded-xl", "inside", "#d97706", "bg-amber-600 hover:bg-amber-500 text-neutral-950 font-serif font-bold", "bg-[#17100D] border-amber-900 text-amber-100 focus:border-amber-500", "serif", "luxury", "rounded-xl", {"text": "PALAZZO DUCALE", "variant": "gold"}, "gold-border", False, False),
    ("luxury-premium-15", "Chronos Titanium", "luxury", "centered-card", "brushed titanium luster with sapphire subtle glow and luxury chronograph dial markings",
     "bg-slate-950 text-slate-100", "bg-slate-900/90 border border-slate-600/50 shadow-[0_0_40px_rgba(148,163,184,0.15)] p-10 rounded-2xl backdrop-blur-md", "inside", "#38bdf8", "bg-gradient-to-r from-slate-200 via-sky-100 to-slate-300 text-slate-950 font-bold hover:brightness-105", "bg-slate-950 border-slate-700 text-white focus:border-sky-400", "sans", "luxury", "rounded-2xl", {"text": "TITANIUM EDITION", "variant": "silver"}, "grid", True, False),

    # 3. Modern SaaS (15)
    ("modern-saas-01", "Linear Obsidian Dark", "saas", "centered-card", "keyboard-first dark interface with purple ambient edge glow and razor sharpness",
     "bg-[#08090a] text-slate-100", "bg-[#121316] border border-white/10 shadow-[0_0_50px_rgba(99,102,241,0.12)] p-8 sm:p-10 rounded-2xl", "inside", "#6366f1", "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25", "bg-[#08090a] border-white/10 text-white focus:border-indigo-500", "sans", "dark", "rounded-2xl", {"text": "ISSUE TRACKER", "variant": "purple"}, "grid", True, False),
    ("modern-saas-02", "Stripe Aurora Flow", "saas", "centered-card", "iconic payment-grade multi-color gradient canvas with crystal clear white card",
     "bg-slate-50 text-slate-900", "bg-white border border-slate-200/80 shadow-2xl p-10 rounded-2xl", "inside", "#635bff", "bg-[#635bff] hover:bg-[#534be0] text-white shadow-lg shadow-indigo-500/20 font-medium", "border-slate-200 focus:border-[#635bff]", "sans", "light", "rounded-2xl", {"text": "PAYMENT INFRASTRUCTURE", "variant": "purple"}, "mesh", True, True),
    ("modern-saas-03", "Vercel Carbon Triangles", "saas", "centered-card", "high-velocity next-generation frontend cloud interface with monochrome discipline",
     "bg-black text-white", "bg-zinc-950 border border-zinc-800 p-10 rounded-xl shadow-2xl", "inside", "#ffffff", "bg-white hover:bg-zinc-200 text-black font-semibold", "bg-black border-zinc-800 text-white focus:border-white", "sans", "dark", "rounded-xl", {"text": "SERVERLESS CLOUD", "variant": "slate"}, "dots", False, False),
    ("modern-saas-04", "Raycast Dark Extension", "saas", "centered-card", "command palette inspired aesthetic with sharp ruby crimson focal button",
     "bg-[#0e0f12] text-zinc-100", "bg-[#17181c] border border-white/10 shadow-2xl p-8 rounded-xl", "inside", "#ff6363", "bg-[#ff6363] hover:bg-[#ff4f4f] text-white font-medium", "bg-[#0e0f12] border-zinc-800 text-white focus:border-rose-500", "sans", "dark", "rounded-xl", {"text": "COMMAND PALETTE", "variant": "amber"}, "none", False, False),
    ("modern-saas-05", "Supabase Emerald Grid", "saas", "centered-card", "developer database dark portal with glowing emerald accents and SQL query hints",
     "bg-[#121212] text-zinc-100", "bg-[#1c1c1c] border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.1)] p-9 rounded-xl", "inside", "#10b981", "bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold", "bg-[#121212] border-zinc-800 text-white focus:border-emerald-500", "sans", "dark", "rounded-xl", {"text": "OPEN SOURCE DATABASE", "variant": "emerald"}, "grid", True, False),
    ("modern-saas-06", "Figma Canvas Purple", "saas", "centered-card", "collaborative design canvas feel with bright electric violet and multiplayer energy",
     "bg-neutral-900 text-white", "bg-neutral-800/90 border border-neutral-700 shadow-2xl p-9 rounded-2xl", "inside", "#a855f7", "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30", "bg-neutral-900 border-neutral-700 text-white focus:border-purple-500", "sans", "dark", "rounded-2xl", None, "dots", False, False),
    ("modern-saas-07", "Notion Clean Document", "saas", "centered-minimal", "warm ivory document layout with minimal headers and seamless block typography",
     "bg-[#FAFAEE]/60 text-[#37352F]", "bg-white border border-[#EDEDED] shadow-sm p-8 sm:p-10 rounded-lg", "inside", "#37352f", "bg-[#37352F] hover:bg-black text-white font-medium", "border-[#E3E2E0] focus:border-[#37352F]", "sans", "light", "rounded-lg", None, "none", False, False),
    ("modern-saas-08", "Prisma Cyan Schema", "saas", "centered-card", "type-safe database ORM portal with electric cyan highlighting",
     "bg-[#0C344B] text-slate-100", "bg-[#092232]/90 border border-teal-400/40 shadow-2xl p-9 rounded-xl", "inside", "#2dd4bf", "bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold", "bg-[#061824] border-teal-800 text-white focus:border-teal-400", "sans", "dark", "rounded-xl", {"text": "TYPE-SAFE ORM", "variant": "blue"}, "grid", False, False),
    ("modern-saas-09", "Resend Elegant Mail", "saas", "centered-card", "modern developer email platform with monochromatic precision and high deliverability feel",
     "bg-black text-zinc-100", "bg-zinc-950 border border-zinc-800 shadow-2xl p-9 rounded-2xl", "inside", "#f4f4f5", "bg-white hover:bg-zinc-200 text-black font-semibold", "bg-black border-zinc-800 text-white focus:border-white", "sans", "dark", "rounded-2xl", {"text": "EMAIL API FOR DEVS", "variant": "slate"}, "dots", False, False),
    ("modern-saas-10", "Arc Spaces Cobalt", "saas", "centered-card", "playful browser space feel with translucent glass and cobalt blue accents",
     "bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 text-white", "bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-9 rounded-3xl", "inside", "#38bdf8", "bg-sky-500 hover:bg-sky-400 text-white font-semibold", "bg-white/5 border-white/20 text-white focus:border-sky-400", "sans", "dark", "rounded-3xl", None, "mesh", False, False),
    ("modern-saas-11", "Tailwind Cyan Glow", "saas", "centered-card", "utility-first developer vibe with vibrant cyan neon glow and slate chassis",
     "bg-slate-950 text-slate-100", "bg-slate-900/95 border border-sky-500/30 shadow-[0_0_50px_rgba(14,165,233,0.15)] p-9 rounded-2xl", "inside", "#0ea5e9", "bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold", "bg-slate-950 border-slate-700 text-white focus:border-sky-400", "sans", "dark", "rounded-2xl", None, "grid", True, False),
    ("modern-saas-12", "Loom Cyber Glow", "saas", "centered-card", "video messaging platform aesthetic with bright magenta energetic buttons",
     "bg-slate-900 text-white", "bg-slate-800/90 border border-slate-700 shadow-2xl p-9 rounded-2xl", "inside", "#ec4899", "bg-pink-600 hover:bg-pink-500 text-white font-semibold shadow-lg shadow-pink-600/30", "bg-slate-900 border-slate-700 text-white focus:border-pink-500", "sans", "dark", "rounded-2xl", None, "mesh", False, False),
    ("modern-saas-13", "Craft Document Slate", "saas", "centered-card", "native app feel with refined rounded controls and soft pastel highlights",
     "bg-slate-100/80 text-slate-800", "bg-white border border-slate-200/60 shadow-lg p-10 rounded-2xl", "inside", "#6366f1", "bg-indigo-600 hover:bg-indigo-500 text-white", "border-slate-200 focus:border-indigo-600", "sans", "light", "rounded-2xl", None, "none", False, False),
    ("modern-saas-14", "Framer Motion Kinetic", "saas", "centered-card", "interactive layout builder style with neon gradient border preview",
     "bg-[#050505] text-white", "bg-[#111111] border border-neutral-800 shadow-[0_0_40px_rgba(59,130,246,0.15)] p-9 rounded-2xl", "inside", "#3b82f6", "bg-blue-600 hover:bg-blue-500 text-white font-medium", "bg-black border-neutral-800 text-white focus:border-blue-500", "sans", "dark", "rounded-2xl", None, "mesh", False, False),
    ("modern-saas-15", "Intercom Messenger Indigo", "saas", "centered-card", "conversational customer support dashboard styling with friendly indigo focus",
     "bg-slate-50 text-slate-900", "bg-white border border-slate-200 shadow-xl p-9 rounded-2xl", "inside", "#2563eb", "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20", "border-slate-300 focus:border-blue-600", "sans", "light", "rounded-2xl", None, "none", False, False),

    # 4. Corporate and Professional (15)
    ("corporate-prof-01", "Enterprise Single Sign-On", "corporate", "corporate-portal", "Fortune 500 enterprise SSO portal with compliance and security seals",
     "bg-slate-100 text-slate-900", "bg-white border border-slate-200 shadow-xl p-10 rounded-lg", "inside", "#1e3a8a", "bg-blue-900 hover:bg-blue-800 text-white font-semibold", "border-slate-300 focus:border-blue-900", "sans", "light", "rounded-lg", {"text": "SAML 2.0 / OIDC VERIFIED", "variant": "blue"}, "none", True, False),
    ("corporate-prof-02", "Deloitte Advisory Suite", "corporate", "centered-card", "executive consulting portal with trusted green accent and crisp formal lines",
     "bg-neutral-900 text-white", "bg-neutral-950 border border-neutral-800 shadow-2xl p-10 rounded-md", "inside", "#84cc16", "bg-lime-500 hover:bg-lime-400 text-neutral-950 font-bold", "bg-neutral-900 border-neutral-800 text-white focus:border-lime-500", "sans", "dark", "rounded-md", {"text": "GLOBAL ADVISORY", "variant": "emerald"}, "none", False, False),
    ("corporate-prof-03", "Zurich Financial Assurance", "corporate", "split-left", "Swiss banking and reinsurance grade interface with security audit guarantee",
     "bg-slate-50 text-slate-900", "bg-white border border-slate-200 shadow-2xl p-10 rounded-xl", "inside", "#0369a1", "bg-sky-800 hover:bg-sky-700 text-white font-semibold", "border-slate-300 focus:border-sky-800", "sans", "light", "rounded-xl", {"text": "FINMA COMPLIANT", "variant": "blue"}, "none", True, False),
    ("corporate-prof-04", "Lexington Legal Chambers", "corporate", "centered-card", "authoritative law firm and arbitration portal with warm mahogany and serif crest",
     "bg-stone-900 text-stone-100", "bg-stone-950 border border-stone-800 p-10 rounded-lg shadow-2xl", "inside", "#ca8a04", "bg-yellow-700 hover:bg-yellow-600 text-stone-950 font-bold font-serif", "bg-stone-900 border-stone-800 text-white focus:border-yellow-600", "serif", "luxury", "rounded-lg", {"text": "ATTORNEY-CLIENT PORTAL", "variant": "amber"}, "none", False, False),
    ("corporate-prof-05", "Federal Security Gate", "corporate", "corporate-portal", "government and aerospace authentication with dual-factor military-grade token prompt",
     "bg-slate-900 text-slate-100", "bg-slate-950 border border-cyan-500/40 p-10 rounded-none shadow-2xl", "inside", "#06b6d4", "bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-none", "bg-slate-900 border-slate-700 text-white focus:border-cyan-400 rounded-none", "mono", "dark", "rounded-none", {"text": "FEDRAMP HIGH LEVEL", "variant": "blue"}, "grid", False, False),
    ("corporate-prof-06", "Global Logistics Freight", "corporate", "centered-card", "supply chain and cargo manifest portal with heavy high-visibility orange badges",
     "bg-slate-100 text-slate-900", "bg-white border border-slate-200 shadow-md p-9 rounded-lg", "inside", "#ea580c", "bg-orange-600 hover:bg-orange-500 text-white font-bold", "border-slate-300 focus:border-orange-600", "sans", "light", "rounded-lg", {"text": "CARGO DISPATCH 24/7", "variant": "amber"}, "none", False, False),
    ("corporate-prof-07", "Healthcare HIPAA Trust", "corporate", "split-left", "medical record and hospital system access with strict HIPAA compliance notices",
     "bg-sky-50/40 text-slate-900", "bg-white border border-sky-100 shadow-xl p-10 rounded-2xl", "inside", "#0284c7", "bg-sky-700 hover:bg-sky-600 text-white font-semibold", "border-slate-200 focus:border-sky-700", "sans", "light", "rounded-2xl", {"text": "HIPAA BAA CERTIFIED", "variant": "blue"}, "none", False, True),
    ("corporate-prof-08", "Apex Capital Partners", "corporate", "centered-card", "private equity and venture partner access with dignified navy slate palette",
     "bg-slate-950 text-slate-100", "bg-slate-900 border border-slate-800 p-10 rounded-xl shadow-2xl", "inside", "#38bdf8", "bg-sky-600 hover:bg-sky-500 text-white font-semibold", "bg-slate-950 border-slate-700 text-white focus:border-sky-500", "sans", "dark", "rounded-xl", {"text": "LIMITED PARTNERS ONLY", "variant": "slate"}, "none", False, False),
    ("corporate-prof-09", "McKinsey Strategic Portal", "corporate", "centered-card", "clean analytical corporate dashboard with deep cobalt headers and structured fields",
     "bg-slate-50 text-slate-900", "bg-white border border-slate-200 shadow-lg p-10 rounded-lg", "inside", "#1e40af", "bg-blue-800 hover:bg-blue-700 text-white font-semibold", "border-slate-300 focus:border-blue-800", "sans", "light", "rounded-lg", None, "none", False, False),
    ("corporate-prof-10", "Nordic Banking Nordea", "corporate", "centered-card", "Scandinavian trust banking with clean blue typography and minimal visual clutter",
     "bg-white text-slate-900", "bg-white border border-slate-200 shadow-sm p-9 rounded-xl", "inside", "#0284c7", "bg-sky-600 hover:bg-sky-500 text-white font-semibold", "border-slate-300 focus:border-sky-600", "sans", "light", "rounded-xl", None, "none", False, False),
    ("corporate-prof-11", "Chartered Global Accounting", "corporate", "centered-card", "audit and fiscal compliance login with double-line accounting borders",
     "bg-stone-50 text-stone-900", "bg-white border-2 border-stone-300 shadow-md p-10 rounded-md", "inside", "#44403c", "bg-stone-800 hover:bg-stone-700 text-white font-semibold", "border-stone-300 focus:border-stone-800", "sans", "light", "rounded-md", {"text": "SOC 2 TYPE II CERTIFIED", "variant": "slate"}, "none", False, False),
    ("corporate-prof-12", "Quantum Defense Systems", "corporate", "corporate-portal", "hardened defense contractor login with hardware token challenge banner",
     "bg-zinc-950 text-zinc-100", "bg-zinc-900 border border-zinc-700 p-10 rounded-none shadow-2xl", "inside", "#ef4444", "bg-red-700 hover:bg-red-600 text-white font-bold rounded-none", "bg-zinc-950 border-zinc-700 text-white focus:border-red-500 rounded-none", "mono", "dark", "rounded-none", {"text": "CLEARANCE LEVEL 4", "variant": "amber"}, "grid", False, False),
    ("corporate-prof-13", "Vanguard Institutional", "corporate", "centered-card", "conservative index fund and asset custody portal with trusted red-brick accent",
     "bg-slate-100 text-slate-900", "bg-white border border-slate-200 shadow-md p-10 rounded-lg", "inside", "#991b1b", "bg-red-800 hover:bg-red-700 text-white font-semibold", "border-slate-300 focus:border-red-800", "sans", "light", "rounded-lg", None, "none", False, False),
    ("corporate-prof-14", "Benchmark Energy Solutions", "corporate", "centered-card", "industrial power and grid infrastructure dashboard with safety green indicators",
     "bg-slate-900 text-slate-100", "bg-slate-800 border border-slate-700 p-9 rounded-xl shadow-xl", "inside", "#22c55e", "bg-emerald-600 hover:bg-emerald-500 text-white font-bold", "bg-slate-900 border-slate-700 text-white focus:border-emerald-400", "sans", "dark", "rounded-xl", {"text": "GRID STATUS: NOMINAL", "variant": "emerald"}, "none", False, False),
    ("corporate-prof-15", "Meridian Telecom Carrier", "corporate", "centered-card", "telecom backbone network NOC operations gateway with high availability guarantee",
     "bg-slate-950 text-slate-100", "bg-slate-900 border border-slate-700 p-9 rounded-xl shadow-2xl", "inside", "#8b5cf6", "bg-purple-700 hover:bg-purple-600 text-white font-semibold", "bg-slate-950 border-slate-700 text-white focus:border-purple-400", "sans", "dark", "rounded-xl", {"text": "CARRIER SLA 99.999%", "variant": "purple"}, "none", False, False),

    # 5. Glassmorphism (10)
    ("glassmorphism-01", "Frosted Aurora Borealis", "glassmorphism", "glassmorphism", "iridescent purple-emerald mesh with ultra-frosted glass blur and specular sheen",
     "bg-slate-950 text-white", "bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] p-10 rounded-3xl", "inside", "#a855f7", "bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 hover:brightness-110 text-white font-semibold shadow-lg shadow-purple-500/25", "bg-white/10 border-white/20 text-white focus:border-white focus:bg-white/20 placeholder-white/50", "sans", "dark", "rounded-3xl", {"text": "CRYSTAL FROST", "variant": "purple"}, "mesh", True, True),
    ("glassmorphism-02", "Subzero Glacier Ice", "glassmorphism", "glassmorphism", "crystalline ice blue refraction over deep navy abyss with glowing cyan edges",
     "bg-[#040d1a] text-sky-100", "bg-sky-500/10 backdrop-blur-xl border border-sky-400/30 shadow-[0_0_50px_rgba(56,189,248,0.2)] p-10 rounded-3xl", "inside", "#38bdf8", "bg-gradient-to-r from-sky-400 to-teal-400 hover:brightness-105 text-slate-950 font-bold", "bg-sky-950/40 border-sky-400/30 text-white focus:border-sky-300 placeholder-sky-200/40", "sans", "dark", "rounded-3xl", {"text": "SUBZERO CHILL", "variant": "blue"}, "mesh", False, False),
    ("glassmorphism-03", "Cyberpunk Neon Glass", "glassmorphism", "glassmorphism", "hot magenta and neon cyan dual glow behind smoked translucent obsidian glass",
     "bg-[#0a0512] text-fuchsia-100", "bg-purple-950/30 backdrop-blur-2xl border border-fuchsia-500/40 shadow-[0_0_40px_rgba(217,70,239,0.25)] p-10 rounded-2xl", "inside", "#d946ef", "bg-gradient-to-r from-fuchsia-600 to-cyan-500 text-white font-bold hover:brightness-110", "bg-black/50 border-fuchsia-500/30 text-white focus:border-cyan-400", "sans", "dark", "rounded-2xl", {"text": "NEON REFRAC", "variant": "purple"}, "mesh", True, False),
    ("glassmorphism-04", "Opal Sheen Iridescent", "glassmorphism", "glassmorphism", "mother-of-pearl shifting pastel colors with ethereal white frosted shield",
     "bg-slate-100 text-slate-800", "bg-white/70 backdrop-blur-xl border border-white/80 shadow-2xl p-10 rounded-3xl", "inside", "#6366f1", "bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-400/20", "bg-white/60 border-slate-200 text-slate-900 focus:border-indigo-600", "sans", "light", "rounded-3xl", None, "mesh", False, False),
    ("glassmorphism-05", "Amethyst Haze", "glassmorphism", "glassmorphism", "deep royal purple gemstone haze with soft backlit vignette and velvet glass",
     "bg-[#0f071a] text-purple-100", "bg-purple-900/20 backdrop-blur-2xl border border-purple-400/30 shadow-2xl p-10 rounded-3xl", "inside", "#c084fc", "bg-purple-600 hover:bg-purple-500 text-white font-semibold", "bg-black/40 border-purple-500/30 text-white focus:border-purple-300", "sans", "dark", "rounded-3xl", None, "mesh", False, False),
    ("glassmorphism-06", "Liquid Quartz Crystal", "glassmorphism", "glassmorphism", "prismatic liquid light dispersion with high-clarity optical glass panels",
     "bg-zinc-950 text-white", "bg-zinc-900/40 backdrop-blur-2xl border border-white/25 shadow-2xl p-10 rounded-2xl", "inside", "#ffffff", "bg-white hover:bg-zinc-200 text-black font-semibold", "bg-white/5 border-white/20 text-white focus:border-white", "sans", "dark", "rounded-2xl", None, "mesh", False, False),
    ("glassmorphism-07", "Solar Flares Golden Glass", "glassmorphism", "glassmorphism", "warm radiant amber solar glow with sunset acrylic translucence",
     "bg-[#140b03] text-amber-100", "bg-amber-950/20 backdrop-blur-xl border border-amber-500/30 shadow-2xl p-10 rounded-3xl", "inside", "#f59e0b", "bg-gradient-to-r from-amber-500 to-orange-500 text-neutral-950 font-bold", "bg-black/40 border-amber-500/30 text-amber-100 focus:border-amber-400", "sans", "dark", "rounded-3xl", None, "mesh", False, False),
    ("glassmorphism-08", "Dark Translucent Onyx", "glassmorphism", "glassmorphism", "stealth smoked acrylic with 85% opacity and precision edge chamfer",
     "bg-[#050507] text-slate-200", "bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl p-10 rounded-2xl", "inside", "#60a5fa", "bg-blue-600 hover:bg-blue-500 text-white font-semibold", "bg-black/50 border-white/10 text-white focus:border-blue-400", "sans", "dark", "rounded-2xl", None, "dots", False, False),
    ("glassmorphism-09", "Emerald Dew Glass", "glassmorphism", "glassmorphism", "botanical morning dew frost with fresh emerald specular glimmers",
     "bg-[#02130e] text-emerald-100", "bg-emerald-950/20 backdrop-blur-2xl border border-emerald-500/30 shadow-2xl p-10 rounded-3xl", "inside", "#34d399", "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold", "bg-black/40 border-emerald-500/30 text-white focus:border-emerald-300", "sans", "dark", "rounded-3xl", None, "mesh", False, False),
    ("glassmorphism-10", "Vivid Prismatic Mirage", "glassmorphism", "glassmorphism", "kinetic chromatic aberration effect with multi-spectrum refractive card",
     "bg-slate-950 text-white", "bg-white/15 backdrop-blur-3xl border border-white/30 shadow-[0_0_50px_rgba(255,255,255,0.1)] p-10 rounded-3xl", "inside", "#38bdf8", "bg-gradient-to-r from-sky-400 via-indigo-400 to-pink-400 text-slate-950 font-bold", "bg-white/10 border-white/20 text-white focus:border-white", "sans", "dark", "rounded-3xl", None, "mesh", False, False),

    # 6. Dark and Elegant (10)
    ("dark-elegant-01", "Midnight Velvet Noir", "dark", "centered-card", "plush deep charcoal black with soft tactile card shadow and subtle pearl buttons",
     "bg-[#0c0d10] text-slate-200", "bg-[#14161d] border border-slate-800 shadow-2xl p-10 rounded-2xl", "inside", "#f8fafc", "bg-slate-100 hover:bg-white text-slate-950 font-semibold", "bg-[#0c0d10] border-slate-800 text-white focus:border-slate-400", "sans", "dark", "rounded-2xl", None, "none", True, False),
    ("dark-elegant-02", "Deep Space Carbon", "dark", "centered-card", "carbon fiber weave aesthetic with high-tech matte finish and slate-gray accents",
     "bg-[#08080a] text-zinc-200", "bg-[#101014] border border-zinc-800 p-10 rounded-xl shadow-2xl", "inside", "#64748b", "bg-slate-700 hover:bg-slate-600 text-white font-medium", "bg-[#08080a] border-zinc-800 text-white focus:border-slate-500", "sans", "dark", "rounded-xl", None, "grid", False, False),
    ("dark-elegant-03", "Charcoal Luxe Minimal", "dark", "centered-minimal", "understated dark elegance without heavy containers, highlighting pure text forms",
     "bg-[#111113] text-neutral-200", "bg-transparent border border-neutral-800 p-8 rounded-xl", "inside", "#d4d4d8", "bg-neutral-200 hover:bg-white text-neutral-950 font-medium", "bg-neutral-950 border-neutral-800 text-white focus:border-neutral-400", "sans", "dark", "rounded-xl", None, "none", False, False),
    ("dark-elegant-04", "Eclipse Noir Monolith", "dark", "centered-card", "lunar eclipse halo with subtle dark rim light and pure deep black interior",
     "bg-black text-white", "bg-neutral-950 border border-neutral-800 shadow-[0_0_60px_rgba(255,255,255,0.05)] p-10 rounded-2xl", "inside", "#ffffff", "bg-white hover:bg-neutral-200 text-black font-semibold", "bg-black border-neutral-800 text-white focus:border-white", "sans", "dark", "rounded-2xl", None, "dots", False, False),
    ("dark-elegant-05", "Black Pearl Luster", "dark", "centered-card", "deep peacock undertone with iridescent charcoal sheen and silver typography",
     "bg-[#090d12] text-slate-100", "bg-[#101620] border border-slate-700/60 shadow-2xl p-10 rounded-2xl", "inside", "#94a3b8", "bg-slate-200 hover:bg-white text-slate-950 font-semibold", "bg-[#090d12] border-slate-700 text-white focus:border-slate-300", "sans", "dark", "rounded-2xl", {"text": "BLACK PEARL", "variant": "silver"}, "none", False, False),
    ("dark-elegant-06", "Onyx Shadow Monolith", "dark", "centered-card", "high-density obsidian stone monolith with dark polished bevel edges",
     "bg-[#050505] text-neutral-300", "bg-[#0f0f11] border border-neutral-800 shadow-2xl p-10 rounded-xl", "inside", "#a1a1aa", "bg-neutral-800 hover:bg-neutral-700 text-white font-medium", "bg-[#050505] border-neutral-800 text-white focus:border-neutral-500", "sans", "dark", "rounded-xl", None, "none", False, False),
    ("dark-elegant-07", "Vortex Cyber Slate", "dark", "centered-card", "cinematic dark slate with electric blue outline buttons and telemetry look",
     "bg-[#0b0e14] text-slate-200", "bg-[#121722] border border-blue-500/30 shadow-2xl p-9 rounded-xl", "inside", "#3b82f6", "bg-blue-600 hover:bg-blue-500 text-white font-semibold", "bg-[#0b0e14] border-slate-700 text-white focus:border-blue-500", "sans", "dark", "rounded-xl", None, "grid", False, False),
    ("dark-elegant-08", "Starlight Black Void", "dark", "centered-card", "deep cosmic void with tiny pinpoint starlight particles and serene calm",
     "bg-[#020204] text-slate-100", "bg-[#0a0a10] border border-indigo-900/40 shadow-2xl p-10 rounded-2xl", "inside", "#818cf8", "bg-indigo-600 hover:bg-indigo-500 text-white font-medium", "bg-[#020204] border-indigo-950 text-white focus:border-indigo-500", "sans", "dark", "rounded-2xl", None, "dots", False, False),
    ("dark-elegant-09", "Abyss Stealth Armor", "dark", "centered-card", "angular stealth fighter styling with matte radar-absorbent dark surfaces",
     "bg-[#08090a] text-zinc-300", "bg-[#111215] border border-zinc-700/50 p-9 rounded-md shadow-2xl", "inside", "#71717a", "bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-md", "bg-[#08090a] border-zinc-700 text-white focus:border-zinc-400", "sans", "dark", "rounded-md", None, "none", False, False),
    ("dark-elegant-10", "Cyber Night Blade", "dark", "centered-card", "razor-sharp noir design with subtle blood-crimson accent line and pure black body",
     "bg-black text-neutral-200", "bg-neutral-950 border-t-2 border-t-rose-600 border-x border-b border-neutral-800 p-10 rounded-lg shadow-2xl", "inside", "#e11d48", "bg-rose-600 hover:bg-rose-500 text-white font-semibold", "bg-black border-neutral-800 text-white focus:border-rose-600", "sans", "dark", "rounded-lg", None, "none", False, False),

    # 7. Gradient and Colorful (10)
    ("gradient-color-01", "Sunset Horizon Coral", "gradient", "centered-card", "warm California sunset radiant gradient flowing through coral, orange, and rose",
     "bg-gradient-to-br from-amber-500 via-rose-500 to-purple-600 text-white", "bg-white/95 text-slate-900 shadow-2xl p-10 rounded-3xl backdrop-blur-md", "inside", "#f43f5e", "bg-gradient-to-r from-rose-500 to-amber-500 hover:brightness-105 text-white font-bold shadow-lg shadow-rose-500/25", "border-slate-200 focus:border-rose-500", "sans", "light", "rounded-3xl", {"text": "SUMMER DROP", "variant": "amber"}, "mesh", True, True),
    ("gradient-color-02", "Cosmic Purple Nebula", "gradient", "centered-card", "deep galactic interstellar nebula with vibrant ultraviolet and fuchsia light blooms",
     "bg-gradient-to-tr from-indigo-950 via-purple-900 to-slate-950 text-purple-100", "bg-slate-900/90 border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.2)] p-10 rounded-2xl backdrop-blur-md", "inside", "#c084fc", "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold", "bg-black/60 border-purple-500/30 text-white focus:border-purple-400", "sans", "dark", "rounded-2xl", None, "mesh", False, False),
    ("gradient-color-03", "Ocean Wave Azure", "gradient", "centered-card", "refreshing Pacific ocean turquoise and deep cobalt rolling surf gradient",
     "bg-gradient-to-b from-cyan-500 to-blue-700 text-white", "bg-white text-slate-900 shadow-2xl p-10 rounded-3xl", "inside", "#0284c7", "bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-105 text-white font-bold", "border-slate-200 focus:border-cyan-600", "sans", "light", "rounded-3xl", None, "none", False, False),
    ("gradient-color-04", "Northern Lights Aurora", "gradient", "centered-card", "luminescent Arctic sky green and violet waves reflecting off frozen tundra",
     "bg-[#020d09] text-emerald-100", "bg-[#061e16]/90 border border-emerald-400/40 shadow-[0_0_50px_rgba(52,211,153,0.2)] p-10 rounded-2xl backdrop-blur-md", "inside", "#34d399", "bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-neutral-950 font-bold", "bg-black/50 border-emerald-500/30 text-white focus:border-emerald-400", "sans", "dark", "rounded-2xl", None, "mesh", False, False),
    ("gradient-color-05", "Tropical Citrus Punch", "gradient", "centered-card", "high-energy lime green, bright lemon, and sunny tangerine summer punch",
     "bg-gradient-to-br from-yellow-300 via-lime-400 to-emerald-500 text-slate-900", "bg-white shadow-2xl p-10 rounded-3xl", "inside", "#15803d", "bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/25", "border-slate-200 focus:border-emerald-600", "sans", "light", "rounded-3xl", None, "none", False, False),
    ("gradient-color-06", "Neon Synthwave 80s", "gradient", "centered-card", "retro Outrun grid with laser neon pink and cyan electric glow",
     "bg-[#08020f] text-pink-100", "bg-[#140624]/90 border border-pink-500/50 shadow-[0_0_50px_rgba(236,72,153,0.3)] p-10 rounded-2xl", "inside", "#ec4899", "bg-gradient-to-r from-pink-500 to-cyan-500 hover:brightness-110 text-white font-bold", "bg-black/60 border-pink-500/40 text-white focus:border-cyan-400", "sans", "dark", "rounded-2xl", {"text": "SYNTHWAVE 1984", "variant": "purple"}, "grid", False, False),
    ("gradient-color-07", "Berry Blast Magenta", "gradient", "centered-card", "rich wild raspberry and blueberry confection with bright friendly highlights",
     "bg-gradient-to-tr from-fuchsia-600 via-rose-600 to-indigo-700 text-white", "bg-white text-slate-900 shadow-2xl p-10 rounded-3xl", "inside", "#e11d48", "bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg shadow-rose-600/30", "border-slate-200 focus:border-rose-600", "sans", "light", "rounded-3xl", None, "none", False, False),
    ("gradient-color-08", "Mojave Desert Dune", "gradient", "centered-card", "warm terracotta, ochre, and warm sand dunes under desert twilight",
     "bg-gradient-to-b from-amber-100 via-orange-100 to-stone-200 text-stone-900", "bg-white/95 border border-amber-200 shadow-xl p-10 rounded-2xl", "inside", "#c2410c", "bg-orange-700 hover:bg-orange-600 text-white font-semibold", "border-stone-200 focus:border-orange-700", "sans", "light", "rounded-2xl", None, "none", False, False),
    ("gradient-color-09", "Electric Violet Flux", "gradient", "centered-card", "hypnotic electric violet and blue quantum glow with high visual saturation",
     "bg-[#060412] text-violet-100", "bg-[#100b2a]/90 border border-violet-500/40 shadow-[0_0_40px_rgba(139,92,246,0.25)] p-10 rounded-2xl", "inside", "#8b5cf6", "bg-violet-600 hover:bg-violet-500 text-white font-bold shadow-lg shadow-violet-600/30", "bg-black/50 border-violet-500/30 text-white focus:border-violet-400", "sans", "dark", "rounded-2xl", None, "mesh", False, False),
    ("gradient-color-10", "Peach Sunrise Pastel", "gradient", "centered-card", "gentle pastel peach, cream and soft lavender morning bloom with pillowy comfort",
     "bg-gradient-to-br from-rose-100 via-orange-100 to-indigo-100 text-slate-800", "bg-white/95 shadow-xl border border-white/60 p-10 rounded-3xl", "inside", "#f43f5e", "bg-rose-500 hover:bg-rose-600 text-white font-medium", "border-rose-100 focus:border-rose-500", "sans", "light", "rounded-3xl", None, "none", False, False),

    # 8. Split Screen (10)
    ("split-screen-01", "Left Testimonial Spotlight", "split", "split-left", "prominent left hero with high-profile customer quote, author portrait, and company validation",
     "bg-slate-50 text-slate-900", "bg-white p-10 sm:p-12 shadow-none border-l border-slate-200", "inside", "#4f46e5", "bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md", "border-slate-200 focus:border-indigo-600", "sans", "light", "rounded-xl", None, "none", True, False),
    ("split-screen-02", "Right Product Showcase", "split", "split-right", "sign-in on left with interactive product screenshot preview and live metric pills on right",
     "bg-white text-slate-900", "bg-white p-10 sm:p-12 shadow-none", "inside", "#2563eb", "bg-blue-600 hover:bg-blue-500 text-white font-semibold", "border-slate-200 focus:border-blue-600", "sans", "light", "rounded-xl", None, "none", True, True),
    ("split-screen-03", "Asymmetric Analytics Telemetry", "split", "split-left", "deep navy telemetry panel with live server health graphs and KPI summaries on left",
     "bg-slate-950 text-slate-100", "bg-slate-900 p-10 sm:p-12 border-l border-slate-800 shadow-2xl", "inside", "#38bdf8", "bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold", "bg-slate-950 border-slate-800 text-white focus:border-sky-400", "sans", "dark", "rounded-xl", {"text": "99.99% UPTIME", "variant": "blue"}, "grid", False, False),
    ("split-screen-04", "Architectural Studio Split", "split", "split-right", "clean modern architectural gallery on right with monochrome minimalist form on left",
     "bg-stone-50 text-stone-900", "bg-white p-10 sm:p-12 border-r border-stone-200", "inside", "#1c1917", "bg-stone-900 hover:bg-black text-white font-medium", "border-stone-300 focus:border-stone-900", "sans", "light", "rounded-none", None, "none", False, False),
    ("split-screen-05", "Developer Code Pipeline Split", "split", "split-left", "syntax-highlighted code editor snippet on left with quick OAuth sign-in on right",
     "bg-[#0d1117] text-slate-100", "bg-[#161b22] p-10 sm:p-12 border-l border-[#30363d] shadow-2xl", "inside", "#238636", "bg-[#238636] hover:bg-[#2ea043] text-white font-semibold", "bg-[#0d1117] border-[#30363d] text-white focus:border-[#58a6ff]", "mono", "dark", "rounded-xl", {"text": "GIT WORKFLOW", "variant": "emerald"}, "none", False, False),
    ("split-screen-06", "Luxury Fashion Lookbook", "split", "split-right", "haute couture runway photo aesthetic on right with refined serif sign-in on left",
     "bg-[#111] text-[#EEE]", "bg-[#1A1A1A] p-10 sm:p-12 border-r border-neutral-800", "inside", "#d4af37", "bg-amber-600 hover:bg-amber-500 text-black font-serif font-bold", "bg-[#111] border-neutral-800 text-white focus:border-amber-400", "serif", "luxury", "rounded-none", {"text": "PARIS FASHION WEEK", "variant": "gold"}, "none", False, False),
    ("split-screen-07", "Fintech Trading Terminal Split", "split", "split-left", "real-time market order book and candlestick chart visualization on left pane",
     "bg-neutral-950 text-neutral-100", "bg-neutral-900 p-10 sm:p-12 border-l border-neutral-800", "inside", "#22c55e", "bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold", "bg-neutral-950 border-neutral-800 text-white focus:border-emerald-400", "sans", "dark", "rounded-lg", {"text": "MARKET OPEN", "variant": "emerald"}, "none", False, False),
    ("split-screen-08", "Travel Odyssey Wanderlust", "split", "split-right", "breathtaking alpine mountain pass photography on right with warm hospitable form on left",
     "bg-white text-slate-900", "bg-white p-10 sm:p-12", "inside", "#f97316", "bg-orange-500 hover:bg-orange-600 text-white font-semibold", "border-slate-200 focus:border-orange-500", "sans", "light", "rounded-2xl", None, "none", False, False),
    ("split-screen-09", "University Campus Quad", "split", "split-left", "historic collegiate library stone arches on left with student portal on right",
     "bg-stone-50 text-stone-900", "bg-white p-10 sm:p-12 border-l border-stone-200", "inside", "#1e3a8a", "bg-blue-900 hover:bg-blue-800 text-white font-serif", "border-stone-300 focus:border-blue-900", "serif", "light", "rounded-lg", {"text": "STUDENT PORTAL", "variant": "blue"}, "none", False, False),
    ("split-screen-10", "AI Compute Cluster Split", "split", "split-left", "neural network tensor node visualization on left with GPU cluster gateway on right",
     "bg-[#05070d] text-slate-100", "bg-[#0b0e17] p-10 sm:p-12 border-l border-indigo-900/40 shadow-2xl", "inside", "#6366f1", "bg-indigo-600 hover:bg-indigo-500 text-white font-semibold", "bg-[#05070d] border-indigo-950 text-white focus:border-indigo-400", "sans", "dark", "rounded-xl", {"text": "H100 CLUSTER READY", "variant": "purple"}, "grid", False, False),

    # 9. Startup and Developer (10)
    ("startup-dev-01", "Matrix Terminal Bash CLI", "startup", "terminal", "authentic Unix shell interface with prompt cursor, green telemetry, and ANSI monochrome",
     "bg-black text-green-400 font-mono", "bg-[#050a05] border border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.2)] p-8 rounded-none", "inside", "#22c55e", "bg-green-500 hover:bg-green-400 text-black font-bold font-mono rounded-none tracking-widest", "bg-black border border-green-500/40 text-green-300 focus:border-green-400 font-mono rounded-none", "mono", "dark", "rounded-none", {"text": "SSH:22 ACTIVE", "variant": "emerald"}, "terminal-bar", True, True),
    ("startup-dev-02", "GitHub Octo Dark", "startup", "centered-card", "familiar GitHub dark developer interface with subtle border borders and commit green buttons",
     "bg-[#0d1117] text-[#c9d1d9]", "bg-[#161b22] border border-[#30363d] shadow-xl p-8 sm:p-10 rounded-xl", "inside", "#238636", "bg-[#238636] hover:bg-[#2ea043] text-white font-semibold shadow-sm", "bg-[#0d1117] border-[#30363d] text-white focus:border-[#58a6ff]", "sans", "dark", "rounded-xl", {"text": "VCS VERIFIED", "variant": "slate"}, "none", False, False),
    ("startup-dev-03", "Y-Combinator Hacker Orange", "startup", "centered-card", "legendary Silicon Valley Hacker News minimalist aesthetic with signature orange badge",
     "bg-[#F6F6EF] text-[#222222]", "bg-white border border-[#E0E0D8] shadow-sm p-8 rounded-md", "inside", "#ff6600", "bg-[#ff6600] hover:bg-[#e65c00] text-white font-bold rounded-sm", "border-[#CCCCCC] focus:border-[#ff6600] rounded-sm", "sans", "light", "rounded-sm", {"text": "BATCH W26", "variant": "amber"}, "none", True, False),
    ("startup-dev-04", "VSCode Monokai Dark", "startup", "terminal", "beloved code editor palette featuring vibrant yellow, cyan, and magenta syntax accents",
     "bg-[#1e1e1e] text-[#d4d4d4]", "bg-[#252526] border border-[#3e3e42] shadow-2xl p-8 rounded-lg", "inside", "#0e639c", "bg-[#0e639c] hover:bg-[#1177bb] text-white font-medium", "bg-[#3c3c3c] border-[#3e3e42] text-white focus:border-[#007acc]", "mono", "dark", "rounded-lg", {"text": "WORKSPACE: ACTIVE", "variant": "blue"}, "terminal-bar", False, False),
    ("startup-dev-05", "DevOps Pipeline Runner", "startup", "centered-card", "CI/CD automated build dashboard feel with status pills and build pipeline breadcrumbs",
     "bg-slate-900 text-slate-100", "bg-slate-800/90 border border-slate-700 shadow-xl p-8 rounded-xl", "inside", "#06b6d4", "bg-cyan-600 hover:bg-cyan-500 text-white font-bold", "bg-slate-900 border-slate-700 text-white focus:border-cyan-400", "sans", "dark", "rounded-xl", {"text": "PIPELINE #8492 PASSING", "variant": "emerald"}, "grid", False, False),
    ("startup-dev-06", "Silicon Pitch Deck", "startup", "centered-card", "venture-backed startup pitch style with energetic purple-indigo gradient and seed badge",
     "bg-slate-50 text-slate-900", "bg-white border border-slate-200 shadow-xl p-10 rounded-2xl", "inside", "#6366f1", "bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/25", "border-slate-300 focus:border-indigo-600", "sans", "light", "rounded-2xl", {"text": "SERIES A EXPEDITION", "variant": "purple"}, "none", False, False),
    ("startup-dev-07", "Rust Cargo Safety", "startup", "terminal", "memory-safe systems programming aesthetic with warm copper rust accents and strict types",
     "bg-[#141210] text-[#e0dedb]", "bg-[#1e1b18] border border-[#d97706]/40 shadow-2xl p-8 rounded-lg", "inside", "#d97706", "bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold font-mono", "bg-[#141210] border-[#38332e] text-white focus:border-amber-500 font-mono", "mono", "dark", "rounded-lg", {"text": "0 UNSAFE BLOCKS", "variant": "amber"}, "terminal-bar", False, False),
    ("startup-dev-08", "API Gateway Console", "startup", "centered-card", "microservices reverse proxy auth gate with request latency telemetry pill",
     "bg-zinc-950 text-zinc-100", "bg-zinc-900 border border-zinc-800 p-9 rounded-xl shadow-2xl", "inside", "#3b82f6", "bg-blue-600 hover:bg-blue-500 text-white font-semibold", "bg-zinc-950 border-zinc-700 text-white focus:border-blue-400", "sans", "dark", "rounded-xl", {"text": "P99 LATENCY: 4MS", "variant": "blue"}, "dots", False, False),
    ("startup-dev-09", "Linux Shell Bash Noir", "startup", "terminal", "raw Bourne-Again Shell terminal with prompt `$ ./authenticate --user` banner",
     "bg-black text-white font-mono", "bg-[#0c0c0c] border border-white/20 p-8 rounded-none shadow-2xl", "inside", "#ffffff", "bg-white hover:bg-neutral-200 text-black font-bold font-mono rounded-none", "bg-black border-white/30 text-white focus:border-white font-mono rounded-none", "mono", "dark", "rounded-none", {"text": "KERNEL 6.8.0-RT", "variant": "slate"}, "terminal-bar", False, False),
    ("startup-dev-10", "Hackathon Midnight Rush", "startup", "centered-card", "energetic 48-hour builder vibe with electric neon green countdown badge",
     "bg-[#070b0e] text-slate-100", "bg-[#0e161c] border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.15)] p-9 rounded-2xl", "inside", "#10b981", "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold", "bg-[#070b0e] border-slate-700 text-white focus:border-emerald-400", "sans", "dark", "rounded-2xl", {"text": "DEMO DAY: 04:12:00", "variant": "emerald"}, "grid", False, False),

    # 10. E-commerce and Retail (10)
    ("ecommerce-retail-01", "Luxury Boutique Avenue", "ecommerce", "centered-card", "high-end flagship retail store aesthetic with warm taupe and bespoke shopping bag motif",
     "bg-[#FBF9F7] text-stone-900", "bg-white border border-stone-200 shadow-lg p-10 rounded-xl", "inside", "#44403c", "bg-stone-900 hover:bg-black text-white font-medium tracking-wider", "border-stone-300 focus:border-stone-900", "serif", "light", "rounded-xl", {"text": "CONCIERGE ACCESS", "variant": "amber"}, "none", True, False),
    ("ecommerce-retail-02", "Streetwear Limited Drop", "ecommerce", "centered-card", "hypebeast countdown aesthetic with bold heavy black typography and bright neon stickers",
     "bg-white text-black", "bg-white border-4 border-black p-8 rounded-none shadow-[8px_8px_0px_#000]", "inside", "#000000", "bg-black hover:bg-neutral-800 text-white font-black uppercase tracking-wider rounded-none", "border-2 border-black rounded-none focus:ring-0", "sans", "light", "rounded-none", {"text": "DROP 04 // 500 UNITS", "variant": "slate"}, "none", False, False),
    ("ecommerce-retail-03", "Artisan Coffee Roasters", "ecommerce", "centered-card", "warm roasted espresso and kraft paper tone with friendly neighborhood roastery warmth",
     "bg-[#F4ECE4] text-[#3D2C1E]", "bg-white border border-[#E0D0C0] shadow-md p-10 rounded-2xl", "inside", "#78350f", "bg-[#5A3825] hover:bg-[#432918] text-amber-50 font-medium", "border-[#D0C0B0] focus:border-[#78350f]", "serif", "light", "rounded-2xl", {"text": "ORIGIN: ETHIOPIA YIRGACHEFFE", "variant": "amber"}, "none", False, False),
    ("ecommerce-retail-04", "Sneakerhead Vault", "ecommerce", "centered-card", "dark athletic footwear gallery with bright orange pull tabs and verification seals",
     "bg-zinc-950 text-white", "bg-zinc-900 border border-zinc-800 shadow-2xl p-9 rounded-2xl", "inside", "#ff5500", "bg-[#ff5500] hover:bg-[#e04b00] text-white font-black uppercase", "bg-zinc-950 border-zinc-800 text-white focus:border-[#ff5500]", "sans", "dark", "rounded-2xl", {"text": "100% VERIFIED AUTHENTIC", "variant": "amber"}, "dots", False, False),
    ("ecommerce-retail-05", "Organic Harvest Market", "ecommerce", "centered-card", "fresh earth tones, avocado green accents, and sustainable community co-op pride",
     "bg-[#F5F8F2] text-[#233518]", "bg-white border border-emerald-100 shadow-md p-10 rounded-2xl", "inside", "#15803d", "bg-emerald-700 hover:bg-emerald-600 text-white font-medium", "border-emerald-200 focus:border-emerald-700", "sans", "light", "rounded-2xl", {"text": "USDA ORGANIC CERTIFIED", "variant": "emerald"}, "none", False, False),
    ("ecommerce-retail-06", "Nordic Furniture Design", "ecommerce", "centered-card", "Danish modern interior lookbook with clean birch wood tones and soft gray shadows",
     "bg-stone-100/70 text-stone-900", "bg-white border border-stone-200 shadow-sm p-10 rounded-lg", "inside", "#57534e", "bg-stone-800 hover:bg-stone-700 text-white", "border-stone-200 focus:border-stone-800", "sans", "light", "rounded-lg", None, "none", False, False),
    ("ecommerce-retail-07", "Clean Cosmetics Beauty", "ecommerce", "centered-card", "delicate blush pink, clean skincare typography, and dermatologist-tested seal",
     "bg-[#FAF4F2] text-[#4A3B37]", "bg-white/90 border border-rose-100 shadow-lg p-10 rounded-3xl", "inside", "#e11d48", "bg-rose-700 hover:bg-rose-600 text-white font-medium", "border-rose-100 focus:border-rose-700", "sans", "light", "rounded-3xl", {"text": "DERMATOLOGIST TESTED", "variant": "purple"}, "none", False, False),
    ("ecommerce-retail-08", "Antiquarian Bookstore", "ecommerce", "centered-card", "aged leather, gold-embossed spines, and rare manuscript collectors catalog",
     "bg-[#1A1412] text-[#EFEBE4]", "bg-[#281F1C] border border-amber-900/40 shadow-2xl p-10 rounded-xl", "inside", "#b45309", "bg-amber-700 hover:bg-amber-600 text-amber-50 font-serif", "bg-[#1A1412] border-amber-900/60 text-amber-100 focus:border-amber-500", "serif", "luxury", "rounded-xl", {"text": "FIRST EDITION ARCHIVE", "variant": "gold"}, "gold-border", False, False),
    ("ecommerce-retail-09", "Modern Tech Gadget Store", "ecommerce", "centered-card", "sleek consumer electronics checkout with fast one-click auth and Apple-like poise",
     "bg-slate-50 text-slate-900", "bg-white border border-slate-200 shadow-xl p-9 rounded-2xl", "inside", "#2563eb", "bg-blue-600 hover:bg-blue-500 text-white font-semibold", "border-slate-300 focus:border-blue-600", "sans", "light", "rounded-2xl", None, "none", False, False),
    ("ecommerce-retail-10", "Artisan Bakery Pastry", "ecommerce", "centered-card", "warm golden brioche crust tone with sourdough flour dust texture and morning aroma",
     "bg-[#FFFDF9] text-[#422A14]", "bg-white border border-amber-100 shadow-md p-10 rounded-3xl", "inside", "#b45309", "bg-amber-800 hover:bg-amber-700 text-white font-serif", "border-amber-200 focus:border-amber-800", "serif", "light", "rounded-3xl", {"text": "FRESH BAKE 6:00 AM", "variant": "amber"}, "none", False, False),

    # 11. Creative and Portfolio (10)
    ("creative-portfolio-01", "Neo-Brutalist Studio Poster", "creative", "centered-card", "high-impact brutalist typography with heavy black borders, neon yellow pop, and sticker badges",
     "bg-[#FFFF00] text-black", "bg-white border-4 border-black p-8 rounded-none shadow-[10px_10px_0px_#000]", "inside", "#000000", "bg-black hover:bg-neutral-800 text-white font-black uppercase rounded-none tracking-widest", "border-2 border-black rounded-none focus:ring-0", "sans", "light", "rounded-none", {"text": "CREATIVE DIR // ARCHIVE", "variant": "slate"}, "none", True, True),
    ("creative-portfolio-02", "Bauhaus Primary Geometry", "creative", "centered-card", "timeless modernism celebrating pure primary red, blue, and yellow geometric blocks",
     "bg-neutral-100 text-neutral-900", "bg-white border-4 border-red-600 p-9 rounded-none shadow-[8px_8px_0px_#2563eb]", "inside", "#dc2626", "bg-red-600 hover:bg-red-500 text-white font-bold rounded-none", "border-2 border-blue-600 rounded-none focus:border-yellow-500", "sans", "light", "rounded-none", {"text": "WEIMAR 1919", "variant": "amber"}, "none", False, False),
    ("creative-portfolio-03", "White Cube Art Gallery", "creative", "centered-minimal", "ultra-quiet exhibition space where form fields sit like museum label captions",
     "bg-white text-neutral-900", "bg-white p-10 sm:p-12 max-w-md w-full", "inside", "#171717", "bg-neutral-900 hover:bg-black text-white font-light tracking-widest", "border-b border-neutral-300 rounded-none focus:border-black px-0", "sans", "light", "rounded-none", None, "none", False, False),
    ("creative-portfolio-04", "Indie Zine Underground", "creative", "centered-card", "photocopied halftone texture and DIY punk typography with attitude",
     "bg-stone-200 text-stone-900", "bg-white border-2 border-dashed border-stone-800 p-8 rounded-sm shadow-md", "inside", "#1c1917", "bg-stone-900 hover:bg-stone-800 text-white font-mono uppercase", "border border-stone-800 rounded-none", "mono", "light", "rounded-sm", {"text": "ISSUE #42", "variant": "slate"}, "dots", False, False),
    ("creative-portfolio-05", "Pastel Dream Collage", "creative", "centered-card", "playful soft lilac, butter yellow, and mint green collage cards for creative illustrators",
     "bg-purple-50 text-slate-900", "bg-white/95 border-2 border-purple-200 shadow-xl p-10 rounded-3xl", "inside", "#9333ea", "bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-md shadow-purple-300", "border-purple-200 focus:border-purple-600", "sans", "light", "rounded-3xl", None, "none", False, False),
    ("creative-portfolio-06", "Film Grain 35mm Analog", "creative", "centered-card", "cinematic darkroom grain with amber exposure accents and vintage Leica frame",
     "bg-[#121110] text-[#E8E6E3]", "bg-[#1E1C1A] border border-amber-900/30 p-10 rounded-lg shadow-2xl", "inside", "#d97706", "bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold", "bg-[#121110] border-stone-800 text-white focus:border-amber-500", "mono", "dark", "rounded-lg", {"text": "KODACHROME 64", "variant": "amber"}, "none", False, False),
    ("creative-portfolio-07", "Architectural Wireframe Grid", "creative", "centered-card", "cyan blueprint isometric lines with drafting notes and coordinate callouts",
     "bg-[#071318] text-cyan-100", "bg-[#0b1f28] border border-cyan-500/40 p-9 rounded-md shadow-2xl", "inside", "#06b6d4", "bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono", "bg-[#071318] border-cyan-800 text-white focus:border-cyan-400 font-mono", "mono", "dark", "rounded-md", {"text": "ELEVATION: NORTH", "variant": "blue"}, "grid", False, False),
    ("creative-portfolio-08", "Motion 3D Studio Dark", "creative", "centered-card", "Blender/Cinema4D dark viewport aesthetic with neon viewport bounding boxes",
     "bg-[#0e0e11] text-zinc-200", "bg-[#18181f] border border-indigo-500/30 shadow-[0_0_40px_rgba(99,102,241,0.15)] p-9 rounded-2xl", "inside", "#6366f1", "bg-indigo-600 hover:bg-indigo-500 text-white font-bold", "bg-[#0e0e11] border-zinc-700 text-white focus:border-indigo-400", "sans", "dark", "rounded-2xl", {"text": "OCTANE ENGINE", "variant": "purple"}, "dots", False, False),
    ("creative-portfolio-09", "Typographic Bold Poster", "creative", "centered-card", "gigantic oversized sans-serif headers taking center stage with crisp contrast",
     "bg-white text-black", "bg-black text-white p-10 rounded-2xl shadow-2xl", "inside", "#ffffff", "bg-white hover:bg-neutral-200 text-black font-black uppercase tracking-wider", "bg-neutral-900 border-neutral-700 text-white focus:border-white", "sans", "dark", "rounded-2xl", None, "none", False, False),
    ("creative-portfolio-10", "Risograph Neon Print", "creative", "centered-card", "tactile misregistered ink effects in fluorescent pink and cornflower blue",
     "bg-[#FFF8F0] text-[#1E232A]", "bg-white border-2 border-rose-500 p-9 rounded-xl shadow-[6px_6px_0px_#2563eb]", "inside", "#f43f5e", "bg-rose-500 hover:bg-rose-600 text-white font-bold", "border-2 border-blue-500 focus:border-rose-500", "sans", "light", "rounded-xl", {"text": "2-COLOR RISO PRINT", "variant": "purple"}, "none", False, False),

    # 12. Education and Community (10)
    ("education-community-01", "Campus Academic Ivy", "education", "banner-stacked", "distinguished university crest header with deep collegiate blue and gold accents",
     "bg-slate-100 text-slate-900", "bg-white border border-slate-200 shadow-xl p-10 rounded-xl", "banner", "#1e3a8a", "bg-blue-900 hover:bg-blue-800 text-white font-semibold", "border-slate-300 focus:border-blue-900", "serif", "light", "rounded-xl", {"text": "UNIVERSITY REGISTRAR", "variant": "blue"}, "none", True, False),
    ("education-community-02", "Code Academy Bootcamp", "education", "centered-card", "friendly welcoming learning hub with progress tracker badge and encouraging copy",
     "bg-slate-900 text-slate-100", "bg-slate-800 border border-slate-700 shadow-xl p-9 rounded-2xl", "inside", "#10b981", "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold", "bg-slate-900 border-slate-700 text-white focus:border-emerald-400", "sans", "dark", "rounded-2xl", {"text": "CURRICULUM WEEK 1", "variant": "emerald"}, "none", False, False),
    ("education-community-03", "Open Knowledge Library", "education", "centered-card", "warm democratic public library vibe encouraging open access and universal literacy",
     "bg-amber-50/50 text-stone-900", "bg-white border border-stone-200 shadow-sm p-10 rounded-xl", "inside", "#0284c7", "bg-sky-700 hover:bg-sky-600 text-white font-medium", "border-stone-300 focus:border-sky-700", "sans", "light", "rounded-xl", {"text": "CREATIVE COMMONS", "variant": "blue"}, "none", False, False),
    ("education-community-04", "STEM Research Lab", "education", "centered-card", "laboratory precision with scientific notation and peer-reviewed verification stamp",
     "bg-slate-950 text-slate-100", "bg-slate-900 border border-teal-500/30 p-9 rounded-xl shadow-2xl", "inside", "#14b8a6", "bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold", "bg-slate-950 border-slate-700 text-white focus:border-teal-400", "mono", "dark", "rounded-xl", {"text": "LAB PROTOCOL #901", "variant": "blue"}, "grid", False, False),
    ("education-community-05", "Language Immersion Duo", "education", "centered-card", "fun vibrant gamified language learning with celebratory streak indicators",
     "bg-[#58cc02]/10 text-slate-900", "bg-white border-2 border-[#58cc02]/30 shadow-xl p-10 rounded-3xl", "inside", "#58cc02", "bg-[#58cc02] hover:bg-[#46a302] text-white font-black uppercase tracking-wide", "border-slate-200 focus:border-[#58cc02]", "sans", "light", "rounded-3xl", {"text": "🔥 14-DAY STREAK", "variant": "amber"}, "none", False, False),
    ("education-community-06", "K-12 Bright Explorer", "education", "centered-card", "bright primary friendly colors with oversized readable buttons for young students",
     "bg-yellow-50 text-slate-900", "bg-white border-2 border-yellow-300 shadow-lg p-10 rounded-3xl", "inside", "#2563eb", "bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg rounded-2xl", "border-2 border-slate-200 rounded-2xl", "sans", "light", "rounded-2xl", None, "none", False, False),
    ("education-community-07", "Scholarly Paper Journal", "education", "centered-card", "academic preprint and citation network archive with DOI identifier stamp",
     "bg-stone-100 text-stone-900", "bg-white border border-stone-300 shadow-md p-10 rounded-lg", "inside", "#1c1917", "bg-stone-900 hover:bg-black text-white font-serif", "border-stone-300 focus:border-stone-900", "serif", "light", "rounded-lg", {"text": "PEER-REVIEWED ARCHIVE", "variant": "slate"}, "none", False, False),
    ("education-community-08", "Makerspace Workshop", "education", "centered-card", "hands-on fabrication lab portal with 3D printer and laser cutter job queue badge",
     "bg-neutral-900 text-neutral-100", "bg-neutral-800 border border-amber-500/40 p-9 rounded-xl shadow-2xl", "inside", "#f59e0b", "bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold", "bg-neutral-900 border-neutral-700 text-white focus:border-amber-400", "sans", "dark", "rounded-xl", {"text": "FAB LAB CERTIFIED", "variant": "amber"}, "grid", False, False),
    ("education-community-09", "Non-Profit Foundation Impact", "education", "split-left", "inspiring mission photograph on left with donor/volunteer community login on right",
     "bg-emerald-50/40 text-slate-900", "bg-white p-10 sm:p-12 shadow-xl border-l border-emerald-100", "inside", "#059669", "bg-emerald-600 hover:bg-emerald-500 text-white font-semibold", "border-slate-200 focus:border-emerald-600", "sans", "light", "rounded-xl", {"text": "501(c)(3) ACCREDITED", "variant": "emerald"}, "none", False, True),
    ("education-community-10", "Alumni Association Commons", "education", "banner-stacked", "prestigious alumni network portal with reunion year banner and class gift updates",
     "bg-slate-100 text-slate-900", "bg-white border border-slate-200 shadow-xl p-10 rounded-xl", "banner", "#0f172a", "bg-slate-900 hover:bg-slate-800 text-white font-semibold", "border-slate-300 focus:border-slate-900", "serif", "light", "rounded-xl", {"text": "ALUMNI PORTAL", "variant": "blue"}, "none", False, False),

    # 13. Editorial and Typography (5)
    ("editorial-typo-01", "The Broadsheet Morning Edition", "editorial", "editorial", "century-old newspaper front page with multi-column serif masthead and lead editorial",
     "bg-[#FDFBF7] text-[#111111]", "bg-white border-y-4 border-black p-10 max-w-lg w-full shadow-md", "inside", "#000000", "bg-black hover:bg-neutral-800 text-white font-serif uppercase tracking-widest", "border-b-2 border-t-0 border-x-0 border-black rounded-none focus:ring-0", "serif", "light", "rounded-none", {"text": "VOL. CXLII NO. 48,201", "variant": "slate"}, "none", True, True),
    ("editorial-typo-02", "Literary Review Quarterly", "editorial", "editorial", "poetic essays and book criticism with delicate Roman drop caps and generous margins",
     "bg-[#F7F4EC] text-[#2D2A26]", "bg-white/80 border border-[#DDD7C8] p-10 sm:p-12 rounded-sm shadow-sm", "inside", "#78350f", "bg-[#2D2A26] hover:bg-black text-[#F7F4EC] font-serif tracking-wider", "border-[#DDD7C8] focus:border-[#78350f]", "serif", "light", "rounded-sm", {"text": "SUMMER QUARTERLY", "variant": "amber"}, "none", False, False),
    ("editorial-typo-03", "Vogue High-Fashion Masthead", "editorial", "editorial", "dramatic ultra-bold Didone typography with runway glamour and haute couture pacing",
     "bg-white text-black", "bg-white p-10 max-w-md w-full", "inside", "#000000", "bg-black hover:bg-neutral-800 text-white font-serif tracking-[0.25em] text-xs uppercase py-3", "border-b border-black rounded-none focus:ring-0 px-0", "serif", "light", "rounded-none", {"text": "THE SEPTEMBER ISSUE", "variant": "slate"}, "none", False, False),
    ("editorial-typo-04", "Modern Typographer Monograph", "editorial", "centered-card", "celebration of grid layouts, kerning tables, and Swiss typographic proportion",
     "bg-neutral-100 text-neutral-900", "bg-white border-2 border-neutral-900 p-10 rounded-none shadow-[6px_6px_0px_#171717]", "inside", "#171717", "bg-neutral-900 hover:bg-neutral-800 text-white font-mono rounded-none", "border border-neutral-900 rounded-none", "mono", "light", "rounded-none", {"text": "GRID SYSTEM: 12-COL", "variant": "slate"}, "none", False, False),
    ("editorial-typo-05", "The Atlantic Essay Longform", "editorial", "editorial", "distinguished long-form journalism portal with dignified reader view and bookmarking",
     "bg-[#F8F9FA] text-[#1A1A1A]", "bg-white border border-slate-200 p-10 sm:p-12 rounded-lg shadow-sm", "inside", "#0f172a", "bg-slate-900 hover:bg-black text-white font-serif", "border-slate-300 focus:border-slate-900", "serif", "light", "rounded-lg", {"text": "LONGFORM EDITION", "variant": "blue"}, "none", False, False),

    # 14. Compact and Mobile-First (5)
    ("compact-mobile-01", "iOS Floating Sheet", "compact", "compact-dock", "native iOS sheet presentation modal with drag indicator bar and smooth rounded corners",
     "bg-slate-900/60 backdrop-blur-md text-slate-900", "bg-white p-6 sm:p-8 rounded-[2rem] shadow-2xl max-w-sm w-full mx-auto", "inside", "#007aff", "bg-[#007aff] hover:bg-[#0062cc] text-white font-semibold rounded-xl", "border-slate-200 focus:border-[#007aff] rounded-xl", "sans", "light", "rounded-xl", None, "none", True, True),
    ("compact-mobile-02", "Pocket Mini-Card", "compact", "compact-dock", "condensed ultra-efficient card taking minimal vertical viewport for fast authentication",
     "bg-slate-100 text-slate-900", "bg-white border border-slate-200 shadow-lg p-6 rounded-2xl max-w-xs w-full mx-auto", "inside", "#4f46e5", "bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg py-2 text-sm", "border-slate-200 focus:border-indigo-600 py-1.5 text-sm", "sans", "light", "rounded-lg", None, "none", False, False),
    ("compact-mobile-03", "Bottom Drawer Slide-Up", "compact", "compact-dock", "mobile drawer docked to bottom edge of screen for ergonomic thumb-reach access",
     "bg-slate-950/70 text-slate-100", "bg-slate-900 border-t border-slate-700 shadow-2xl p-6 sm:p-8 rounded-t-3xl max-w-md w-full mx-auto", "inside", "#38bdf8", "bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl", "bg-slate-950 border-slate-700 text-white focus:border-sky-400 rounded-xl", "sans", "dark", "rounded-xl", None, "none", False, False),
    ("compact-mobile-04", "Thumb Action Floating Dock", "compact", "compact-dock", "ergonomic floating capsule dock positioned for natural single-hand mobile use",
     "bg-gradient-to-b from-indigo-950 to-slate-950 text-white", "bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl p-6 rounded-3xl max-w-sm w-full mx-auto", "inside", "#6366f1", "bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl", "bg-slate-950 border-slate-800 text-white focus:border-indigo-400 rounded-xl", "sans", "dark", "rounded-2xl", None, "dots", False, False),
    ("compact-mobile-05", "Micro-Auth Key Ring", "compact", "compact-dock", "compact security key and passkey first authentication badge for wearable and embedded screens",
     "bg-black text-white", "bg-zinc-900 border border-zinc-700 p-6 rounded-2xl max-w-xs w-full mx-auto shadow-2xl", "inside", "#ffffff", "bg-white hover:bg-zinc-200 text-black font-semibold rounded-lg text-sm", "bg-black border-zinc-700 text-white focus:border-white rounded-lg text-sm", "sans", "dark", "rounded-lg", {"text": "WEBAUTHN READY", "variant": "slate"}, "none", False, False)
]

print(f"Total defined layouts: {len(LAYOUT_DATA)}")
assert len(LAYOUT_DATA) == 150, f"Expected 150 layouts, got {len(LAYOUT_DATA)}"

# Category count verification
cat_counts = {}
for item in LAYOUT_DATA:
    cat = item[2]
    cat_counts[cat] = cat_counts.get(cat, 0) + 1

for cat in CATEGORIES:
    cid = cat["id"]
    expected = cat["count"]
    actual = cat_counts.get(cid, 0)
    print(f"Category {cid}: expected {expected}, got {actual}")
    assert expected == actual, f"Category {cid} mismatch: {expected} != {actual}"

# Hero data enrichment for layouts
HERO_DATA = {
    "split-screen-01": {
        "heroTitle": "Securing the world's most ambitious software.",
        "heroSubtitle": "Autonomous zero-trust authentication infrastructure.",
        "heroQuote": "AuthCraft gave our engineering team instant zero-trust authentication without maintaining custom auth microservices.",
        "heroAuthor": "Dr. Elena Rostova",
        "heroAuthorRole": "CTO, HyperScale Systems"
    },
    "split-screen-02": {
        "heroTitle": "Unified Identity & Access Architecture",
        "heroSubtitle": "Real-time session telemetry, automated credential rotation, and frictionless SSO integration across 140+ countries.",
        "heroQuote": "We deployed hosted authentication to 45,000 customers in a single afternoon.",
        "heroAuthor": "Marcus Vance",
        "heroAuthorRole": "VP Product, Horizon SaaS"
    },
    "split-screen-03": {
        "heroTitle": "Mission-Critical Telemetry",
        "heroSubtitle": "Sub-5ms authentication routing, distributed rate-limiting, and zero-downtime key rotation."
    },
    "split-screen-04": {
        "heroTitle": "Spatial Architecture & Form",
        "heroSubtitle": "Clean spaces, intentional proportion, and enduring materiality."
    },
    "split-screen-05": {
        "heroTitle": "Automated Deployments at Scale",
        "heroSubtitle": "Instant Git-driven CI/CD authentication keys with automated HMAC validation."
    },
    "split-screen-06": {
        "heroTitle": "Haute Couture Salon",
        "heroSubtitle": "Private atelier previews, personal styling concierges, and seasonal runway access."
    },
    "split-screen-07": {
        "heroTitle": "Ultra-Low Latency Order Matching",
        "heroSubtitle": "Microsecond execution, cross-margin risk controls, and cold-storage asset vaults."
    },
    "split-screen-08": {
        "heroTitle": "Expeditions Beyond Horizons",
        "heroSubtitle": "Discover secluded alpine sanctuaries, bespoke charter routes, and pristine wilderness."
    },
    "split-screen-09": {
        "heroTitle": "University Academic Registry",
        "heroSubtitle": "Access degree audit records, research peer review repositories, and campus resources."
    },
    "split-screen-10": {
        "heroTitle": "High-Density GPU Clusters",
        "heroSubtitle": "Cluster orchestration, multi-node distributed training, and automated checkpoint caching."
    },
    "luxury-premium-01": {
        "heroTitle": "The Sovereign Vault",
        "heroSubtitle": "Private wealth custody and legacy asset protection since 1892."
    },
    "luxury-premium-02": {
        "heroTitle": "Monaco Wealth Partners",
        "heroSubtitle": "Discretion, generational stewardship, and private multi-currency reserves."
    },
    "luxury-premium-03": {
        "heroTitle": "Haute Horlogerie Genevoise",
        "heroSubtitle": "Handcrafted perpetual calendars and tourbillon masterworks."
    },
    "luxury-premium-04": {
        "heroTitle": "Atelier Place Vendôme",
        "heroSubtitle": "Bespoke high jewelry creations hand-set by master lapidaries."
    },
    "luxury-premium-05": {
        "heroTitle": "Belvedere Private Residences",
        "heroSubtitle": "Architectural residences with panoramic mountain and ocean vistas."
    },
    "corporate-prof-03": {
        "heroTitle": "Zurich Reinsurance & Custody",
        "heroSubtitle": "FINMA compliant sovereign balance sheet risk underwriting."
    },
    "corporate-prof-07": {
        "heroTitle": "Metropolitan Medical Network",
        "heroSubtitle": "Zero-trust electronic health records with continuous biometric verification."
    },
    "education-community-09": {
        "heroTitle": "Global Literacy Initiative",
        "heroSubtitle": "Empowering 1.2M students worldwide with open instructional access."
    }
}

category_labels = {c["id"]: c["label"] for c in CATEGORIES}

def escape_ts(s):
    if s is None:
        return "undefined"
    return json.dumps(s)

ts_output = """// AUTHCRAFT V2 — 150 DISTINCT LOGIN PAGE LAYOUTS CATALOG
// Autogenerated and deterministically validated catalog of 150 unique designs.

import { CategoryMeta, LayoutCategory, LayoutDefinition } from './types';

export const LAYOUT_CATEGORIES: CategoryMeta[] = """ + json.dumps(CATEGORIES, indent=2) + """;

export const LAYOUT_CATALOG: LayoutDefinition[] = [
"""

for item in LAYOUT_DATA:
    (lid, name, cat, family, desc, container, card, hdr_pos, accent, btn, inp, font, theme, radius, badge, deco, feat, isnew) = item
    cat_label = category_labels[cat]
    hero_info = HERO_DATA.get(lid, {})

    tags = [cat, family, theme]
    if feat:
        tags.append("featured")
    if isnew:
        tags.append("new")
    if "gold" in (deco or "") or "luxury" in theme:
        tags.append("luxury")

    badge_str = "undefined"
    if badge:
        badge_str = f"{{ text: {escape_ts(badge['text'])}, variant: '{badge['variant']}' }}"

    hero_fields = ""
    if "heroTitle" in hero_info:
        hero_fields += f"\n      heroTitle: {escape_ts(hero_info['heroTitle'])},"
    if "heroSubtitle" in hero_info:
        hero_fields += f"\n      heroSubtitle: {escape_ts(hero_info['heroSubtitle'])},"
    if "heroQuote" in hero_info:
        hero_fields += f"\n      heroQuote: {escape_ts(hero_info['heroQuote'])},"
    if "heroAuthor" in hero_info:
        hero_fields += f"\n      heroAuthor: {escape_ts(hero_info['heroAuthor'])},"
    if "heroAuthorRole" in hero_info:
        hero_fields += f"\n      heroAuthorRole: {escape_ts(hero_info['heroAuthorRole'])},"

    ts_output += f"""  {{
    id: '{lid}',
    name: {escape_ts(name)},
    category: '{cat}',
    categoryLabel: '{cat_label}',
    description: {escape_ts(desc)},
    family: '{family}',
    tags: {json.dumps(tags)},
    isFeatured: {'true' if feat else 'false'},
    isNew: {'true' if isnew else 'false'},
    tokens: {{
      container: {escape_ts(container)},
      card: {escape_ts(card)},
      headerPosition: '{hdr_pos}',
      accentColor: '{accent}',
      primaryBtn: {escape_ts(btn)},
      inputStyle: {escape_ts(inp)},
      fontFamily: '{font}',
      theme: '{theme}',
      borderRadius: '{radius}',
      badge: {badge_str},
      decorations: '{deco}',
      socialPlacement: 'bottom',{hero_fields}
    }},
  }},
"""

ts_output += """];

/**
 * Find layout by ID. Defaults to minimal-clean-01 if not found.
 */
export function getLayoutById(id: string): LayoutDefinition {
  const found = LAYOUT_CATALOG.find((l) => l.id === id);
  return found || LAYOUT_CATALOG[0];
}

/**
 * Filter and sort layouts by category, search query, and sort order.
 */
export function filterLayouts(options: {
  category?: LayoutCategory | 'all';
  searchQuery?: string;
  sortBy?: 'featured' | 'newest' | 'name' | 'category';
  favorites?: string[];
}): LayoutDefinition[] {
  const { category = 'all', searchQuery = '', sortBy = 'featured', favorites = [] } = options;

  let result = [...LAYOUT_CATALOG];

  if (category !== 'all') {
    result = result.filter((l) => l.category === category);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    result = result.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.categoryLabel.toLowerCase().includes(q) ||
        l.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  result.sort((a, b) => {
    // Favorites always surface first if any
    const aFav = favorites.includes(a.id) ? 1 : 0;
    const bFav = favorites.includes(b.id) ? 1 : 0;
    if (aFav !== bFav) return bFav - aFav;

    if (sortBy === 'featured') {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'newest') {
      if (a.isNew && !b.isNew) return -1;
      if (!a.isNew && b.isNew) return 1;
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'category') {
      return a.category.localeCompare(b.category);
    }
    return 0;
  });

  return result;
}
"""

with open("src/lib/layouts/catalog.ts", "w", encoding="utf-8") as f:
    f.write(ts_output)

print("Wrote src/lib/layouts/catalog.ts successfully!")

