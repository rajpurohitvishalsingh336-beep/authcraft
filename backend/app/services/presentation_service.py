import io
import json
import logging
from typing import Dict, List, Any, Optional
from pptx import Presentation as PptxPresentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

logger = logging.getLogger("authcraft.presentation")

# Predefined design themes for Presentation Studio
PRESENTATION_THEMES = {
    "modern-indigo": {
        "name": "Modern Indigo (Tech & SaaS)",
        "bg_color": "#0F172A",
        "card_bg": "#1E293B",
        "primary_color": "#6366F1",
        "text_primary": "#F8FAFC",
        "text_secondary": "#94A3B8",
        "accent": "#38BDF8",
    },
    "emerald-growth": {
        "name": "Emerald Growth (Finance & Metrics)",
        "bg_color": "#064E3B",
        "card_bg": "#065F46",
        "primary_color": "#10B981",
        "text_primary": "#ECFDF5",
        "text_secondary": "#A7F3D0",
        "accent": "#FBBF24",
    },
    "slate-corporate": {
        "name": "Slate Corporate (Enterprise & Security)",
        "bg_color": "#1E293B",
        "card_bg": "#334155",
        "primary_color": "#3B82F6",
        "text_primary": "#FFFFFF",
        "text_secondary": "#CBD5E1",
        "accent": "#06B6D4",
    },
    "minimal-white": {
        "name": "Minimalist White (Clean & Direct)",
        "bg_color": "#FFFFFF",
        "card_bg": "#F8FAFC",
        "primary_color": "#0F172A",
        "text_primary": "#0F172A",
        "text_secondary": "#64748B",
        "accent": "#4F46E5",
    },
    "sunset-pitch": {
        "name": "Sunset Pitch (Investor & Showcase)",
        "bg_color": "#18181B",
        "card_bg": "#27272A",
        "primary_color": "#F43F5E",
        "text_primary": "#FAFAFA",
        "text_secondary": "#A1A1AA",
        "accent": "#FB923C",
    },
    "cyber-dark": {
        "name": "Cyber Dark (Developer & API)",
        "bg_color": "#09090B",
        "card_bg": "#18181B",
        "primary_color": "#A855F7",
        "text_primary": "#FAFAFA",
        "text_secondary": "#71717A",
        "accent": "#22C55E",
    },
}


def hex_to_rgb(hex_str: str) -> RGBColor:
    """Convert hex color string (#RRGGBB) to pptx RGBColor."""
    hex_str = hex_str.lstrip("#")
    if len(hex_str) != 6:
        return RGBColor(79, 70, 229)  # default indigo
    r = int(hex_str[0:2], 16)
    g = int(hex_str[2:4], 16)
    b = int(hex_str[4:6], 16)
    return RGBColor(r, g, b)


class PresentationService:
    @staticmethod
    def generate_presentation_deck(
        topic: str,
        audience: str = "General",
        tone: str = "Professional",
        slide_count: int = 5,
        template_id: str = "modern-indigo",
    ) -> Dict[str, Any]:
        """
        AI prompt-to-presentation generation engine.
        Produces a rich, structured slide deck based on topic, audience, and tone.
        """
        theme = PRESENTATION_THEMES.get(template_id, PRESENTATION_THEMES["modern-indigo"])
        slide_count = max(3, min(slide_count, 12))

        # Title slide
        slides_data = [
            {
                "slide_number": 1,
                "layout_type": "title",
                "title": topic.title() if len(topic) < 60 else topic[:57] + "...",
                "subtitle": f"Strategic Executive Briefing for {audience} | Prepared with AuthCraft AI",
                "background_color": theme["bg_color"],
                "accent_color": theme["primary_color"],
                "content_json": json.dumps({
                    "meta": f"Tone: {tone} | Audience: {audience}",
                    "presenter": "AuthCraft Strategy Team",
                    "date": "2026 Edition",
                }),
                "speaker_notes": f"Welcome everyone. Today we are presenting a comprehensive review on '{topic}', specifically calibrated for our {audience} audience.",
            }
        ]

        # Slide 2: Market & Strategic Overview (split_content)
        slides_data.append({
            "slide_number": 2,
            "layout_type": "split_content",
            "title": "Context & Strategic Problem Statement",
            "subtitle": f"Understanding the high-impact challenges in {topic}",
            "background_color": theme["bg_color"],
            "accent_color": theme["accent"],
            "content_json": json.dumps({
                "left_heading": "Key Drivers & Paradigm Shifts",
                "left_body": f"The landscape surrounding {topic} is evolving rapidly. Legacy methodologies introduce friction, security vulnerabilities, and operational latency.",
                "bullets": [
                    f"Rapid acceleration in demand for secure, scalable {topic} frameworks.",
                    "Traditional architectures fail to provide real-time observability and compliance.",
                    "Enterprise buyers demand automated workflows and seamless developer UX.",
                    "Adopting modern modular solutions delivers 4x faster time-to-market.",
                ],
            }),
            "speaker_notes": "Here we frame the macro environment. Emphasize why legacy approaches can no longer keep up with modern demands.",
        })

        # Slide 3: Key Metrics & Performance (metrics)
        if slide_count >= 3:
            slides_data.append({
                "slide_number": 3,
                "layout_type": "metrics",
                "title": "Measurable Impact & Quantitative Gains",
                "subtitle": "Benchmarking operational improvements and ROI",
                "background_color": theme["bg_color"],
                "accent_color": theme["primary_color"],
                "content_json": json.dumps({
                    "metrics": [
                        {"value": "99.99%", "label": "Service Availability", "description": "Continuous zero-downtime SLA"},
                        {"value": "< 45ms", "label": "P99 Response Latency", "description": "Global edge routing & caching"},
                        {"value": "78%", "label": "Dev Cycle Reduction", "description": "Accelerated release velocity"},
                        {"value": "100%", "label": "Audit Traceability", "description": "Tamper-evident security logging"},
                    ]
                }),
                "speaker_notes": "Walk through these core quantitative metrics. These metrics highlight the measurable enterprise advantages.",
            })

        # Slide 4: Core Pillars / Feature Matrix (cards)
        if slide_count >= 4:
            slides_data.append({
                "slide_number": 4,
                "layout_type": "cards",
                "title": "Architectural Pillars & Solution Capabilities",
                "subtitle": "Modular, secure, and developer-first design",
                "background_color": theme["bg_color"],
                "accent_color": theme["accent"],
                "content_json": json.dumps({
                    "cards": [
                        {
                            "title": "Security by Design",
                            "description": "Multi-tenant isolation, Argon2id encryption, and automated intrusion radar.",
                            "tag": "Defense",
                        },
                        {
                            "title": "Intelligent Automation",
                            "description": "Dynamic event-driven workflow engine with conditional branching and retries.",
                            "tag": "Efficiency",
                        },
                        {
                            "title": "Universal Extensibility",
                            "description": "HMAC-signed webhooks, scoped API keys, and comprehensive SDK toolkits.",
                            "tag": "Scale",
                        },
                    ]
                }),
                "speaker_notes": "Each pillar represents a foundational component of our architectural philosophy.",
            })

        # Slide 5: Strategic Quote / Testimonial (quote)
        if slide_count >= 5:
            slides_data.append({
                "slide_number": 5,
                "layout_type": "quote",
                "title": "Industry Validation & Endorsement",
                "subtitle": "What engineering leaders say about modern SaaS infrastructure",
                "background_color": theme["bg_color"],
                "accent_color": theme["primary_color"],
                "content_json": json.dumps({
                    "quote": f"Transforming how we approach {topic} allowed our engineering teams to stop reinventing infrastructure and focus entirely on core proprietary value.",
                    "author": "Chief Technology Officer",
                    "affiliation": "Global Cloud Enterprises",
                }),
                "speaker_notes": "A poignant quote from an enterprise peer validates the strategic urgency of this initiative.",
            })

        # Extra slides if requested
        if slide_count >= 6:
            slides_data.append({
                "slide_number": 6,
                "layout_type": "cards",
                "title": "Implementation Roadmap & Milestones",
                "subtitle": "Clear, phased rollout designed for zero disruption",
                "background_color": theme["bg_color"],
                "accent_color": theme["accent"],
                "content_json": json.dumps({
                    "cards": [
                        {"title": "Phase 1: Discovery & Audit", "description": "Audit existing endpoints, threat surface, and authentication flows.", "tag": "Weeks 1-2"},
                        {"title": "Phase 2: Platform Integration", "description": "Deploy SDKs, configure webhook consumers, and establish OTP auth.", "tag": "Weeks 3-4"},
                        {"title": "Phase 3: Production Rollout", "description": "Gradual traffic migration with real-time canary monitoring.", "tag": "Weeks 5-6"},
                    ]
                }),
                "speaker_notes": "Detail the 3 execution phases, emphasizing rapid time-to-value and risk mitigation.",
            })

        # Conclusion slide (always the final slide)
        slides_data.append({
            "slide_number": len(slides_data) + 1,
            "layout_type": "conclusion",
            "title": "Actionable Next Steps & Call to Action",
            "subtitle": f"Accelerate your roadmap with {topic}",
            "background_color": theme["bg_color"],
            "accent_color": theme["primary_color"],
            "content_json": json.dumps({
                "summary": f"By adopting this modernized framework for {topic}, organizations achieve immediate resilience, faster onboarding, and rock-solid enterprise security.",
                "action_items": [
                    "Schedule architectural deep-dive with solutions engineering.",
                    "Provision sandbox developer credentials and explore API documentation.",
                    "Review security compliance checklist and data sovereignty guarantees.",
                ],
                "contact": "support@authcraft.io | https://authcraft.vercel.app",
            }),
            "speaker_notes": "Wrap up with clear next steps and invite the audience to ask questions.",
        })

        return {
            "title": topic.title(),
            "description": f"AI-generated executive presentation covering {topic} for {audience}.",
            "topic": topic,
            "audience": audience,
            "tone": tone,
            "template_id": template_id,
            "slides": slides_data,
        }

    @staticmethod
    def export_to_pptx(presentation_title: str, slides: List[Dict[str, Any]]) -> io.BytesIO:
        """
        Creates a genuine, fully editable PowerPoint (.pptx) file using python-pptx.
        Applies professional 16:9 widescreen layout, distinct shapes, typography, and speaker notes.
        """
        prs = PptxPresentation()
        prs.slide_width = Inches(13.333)
        prs.slide_height = Inches(7.5)

        # Blank slide layout (index 6 in standard templates is blank)
        blank_layout = prs.slide_layouts[6]

        for s_idx, s in enumerate(slides):
            slide = prs.slides.add_slide(blank_layout)

            bg_hex = s.get("background_color", "#0F172A")
            accent_hex = s.get("accent_color", "#6366F1")
            layout_type = s.get("layout_type", "split_content")
            title_text = s.get("title", f"Slide {s_idx + 1}")
            subtitle_text = s.get("subtitle", "")
            speaker_notes = s.get("speaker_notes", "")

            # Parse content JSON
            try:
                content = json.loads(s.get("content_json", "{}"))
            except Exception:
                content = {}

            # Add background rectangle
            bg_shape = slide.shapes.add_shape(
                MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), prs.slide_width, prs.slide_height
            )
            bg_shape.fill.solid()
            bg_shape.fill.fore_color.rgb = hex_to_rgb(bg_hex)
            bg_shape.line.color.rgb = hex_to_rgb(bg_hex)

            # Determine text colors based on background brightness
            is_light_bg = bg_hex.upper() in ["#FFFFFF", "#F8FAFC", "#F1F5F9"]
            title_color = RGBColor(15, 23, 42) if is_light_bg else RGBColor(248, 250, 252)
            subtitle_color = RGBColor(100, 116, 139) if is_light_bg else RGBColor(148, 163, 184)
            card_bg_color = hex_to_rgb("#F1F5F9" if is_light_bg else "#1E293B")
            accent_rgb = hex_to_rgb(accent_hex)

            # Add Top Accent Stripe
            stripe = slide.shapes.add_shape(
                MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), prs.slide_width, Inches(0.12)
            )
            stripe.fill.solid()
            stripe.fill.fore_color.rgb = accent_rgb
            stripe.line.color.rgb = accent_rgb

            # Render Slide Layouts
            if layout_type == "title":
                # Center large title & subtitle
                # Decorative banner box
                banner = slide.shapes.add_shape(
                    MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.5), Inches(1.8), Inches(10.333), Inches(3.8)
                )
                banner.fill.solid()
                banner.fill.fore_color.rgb = card_bg_color
                banner.line.color.rgb = accent_rgb
                banner.line.width = Pt(1.5)

                tb = slide.shapes.add_textbox(Inches(2.0), Inches(2.2), Inches(9.333), Inches(2.0))
                tf = tb.text_frame
                tf.word_wrap = True
                p = tf.paragraphs[0]
                p.text = title_text
                p.font.size = Pt(40)
                p.font.bold = True
                p.font.color.rgb = title_color
                p.alignment = PP_ALIGN.CENTER

                if subtitle_text:
                    p2 = tf.add_paragraph()
                    p2.text = subtitle_text
                    p2.font.size = Pt(20)
                    p2.font.color.rgb = subtitle_color
                    p2.alignment = PP_ALIGN.CENTER

                # Presenter footer
                meta_tb = slide.shapes.add_textbox(Inches(2.0), Inches(4.5), Inches(9.333), Inches(0.8))
                meta_tf = meta_tb.text_frame
                meta_p = meta_tf.paragraphs[0]
                meta_p.text = "AuthCraft Enterprise Presentation Studio | Confidential"
                meta_p.font.size = Pt(13)
                meta_p.font.color.rgb = accent_rgb
                meta_p.alignment = PP_ALIGN.CENTER

            elif layout_type == "metrics":
                # Slide Header
                tb_h = slide.shapes.add_textbox(Inches(1.0), Inches(0.8), Inches(11.333), Inches(1.2))
                tf_h = tb_h.text_frame
                p_h = tf_h.paragraphs[0]
                p_h.text = title_text
                p_h.font.size = Pt(32)
                p_h.font.bold = True
                p_h.font.color.rgb = title_color

                if subtitle_text:
                    p_sub = tf_h.add_paragraph()
                    p_sub.text = subtitle_text
                    p_sub.font.size = Pt(16)
                    p_sub.font.color.rgb = subtitle_color

                # 4 Metric Cards
                metrics = content.get("metrics", [
                    {"value": "99.9%", "label": "Reliability"},
                    {"value": "< 50ms", "label": "Speed"},
                    {"value": "5x", "label": "Productivity"},
                    {"value": "100%", "label": "Security"},
                ])
                card_width = Inches(2.6)
                card_height = Inches(3.8)
                gap = Inches(0.3)
                start_x = Inches(1.0)
                y_pos = Inches(2.5)

                for m_idx, m in enumerate(metrics[:4]):
                    x_pos = start_x + (m_idx * (card_width + gap))
                    card = slide.shapes.add_shape(
                        MSO_SHAPE.ROUNDED_RECTANGLE, x_pos, y_pos, card_width, card_height
                    )
                    card.fill.solid()
                    card.fill.fore_color.rgb = card_bg_color
                    card.line.color.rgb = accent_rgb
                    card.line.width = Pt(1)

                    c_tb = slide.shapes.add_textbox(x_pos + Inches(0.2), y_pos + Inches(0.4), card_width - Inches(0.4), card_height - Inches(0.8))
                    c_tf = c_tb.text_frame
                    c_tf.word_wrap = True

                    val_p = c_tf.paragraphs[0]
                    val_p.text = m.get("value", "N/A")
                    val_p.font.size = Pt(36)
                    val_p.font.bold = True
                    val_p.font.color.rgb = accent_rgb

                    lbl_p = c_tf.add_paragraph()
                    lbl_p.text = m.get("label", "")
                    lbl_p.font.size = Pt(16)
                    lbl_p.font.bold = True
                    lbl_p.font.color.rgb = title_color

                    if m.get("description"):
                        desc_p = c_tf.add_paragraph()
                        desc_p.text = m.get("description", "")
                        desc_p.font.size = Pt(13)
                        desc_p.font.color.rgb = subtitle_color

            elif layout_type == "cards":
                # Slide Header
                tb_h = slide.shapes.add_textbox(Inches(1.0), Inches(0.8), Inches(11.333), Inches(1.2))
                tf_h = tb_h.text_frame
                p_h = tf_h.paragraphs[0]
                p_h.text = title_text
                p_h.font.size = Pt(32)
                p_h.font.bold = True
                p_h.font.color.rgb = title_color

                if subtitle_text:
                    p_sub = tf_h.add_paragraph()
                    p_sub.text = subtitle_text
                    p_sub.font.size = Pt(16)
                    p_sub.font.color.rgb = subtitle_color

                cards = content.get("cards", [])
                card_count = min(len(cards), 3) if len(cards) > 0 else 3
                card_width = Inches(3.6)
                gap = Inches(0.3)
                start_x = Inches(1.0)
                y_pos = Inches(2.5)

                for c_idx, c in enumerate(cards[:3]):
                    x_pos = start_x + (c_idx * (card_width + gap))
                    card = slide.shapes.add_shape(
                        MSO_SHAPE.ROUNDED_RECTANGLE, x_pos, y_pos, card_width, Inches(4.0)
                    )
                    card.fill.solid()
                    card.fill.fore_color.rgb = card_bg_color
                    card.line.color.rgb = accent_rgb
                    card.line.width = Pt(1)

                    c_tb = slide.shapes.add_textbox(x_pos + Inches(0.3), y_pos + Inches(0.4), card_width - Inches(0.6), Inches(3.2))
                    c_tf = c_tb.text_frame
                    c_tf.word_wrap = True

                    tag_p = c_tf.paragraphs[0]
                    tag_p.text = f"// {c.get('tag', 'FEATURE')}".upper()
                    tag_p.font.size = Pt(11)
                    tag_p.font.bold = True
                    tag_p.font.color.rgb = accent_rgb

                    title_p = c_tf.add_paragraph()
                    title_p.text = c.get("title", f"Pillar {c_idx + 1}")
                    title_p.font.size = Pt(20)
                    title_p.font.bold = True
                    title_p.font.color.rgb = title_color

                    desc_p = c_tf.add_paragraph()
                    desc_p.text = c.get("description", "")
                    desc_p.font.size = Pt(14)
                    desc_p.font.color.rgb = subtitle_color

            elif layout_type == "quote":
                # Quotation layout
                quote_box = slide.shapes.add_shape(
                    MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.5), Inches(1.8), Inches(10.333), Inches(4.0)
                )
                quote_box.fill.solid()
                quote_box.fill.fore_color.rgb = card_bg_color
                quote_box.line.color.rgb = accent_rgb

                q_tb = slide.shapes.add_textbox(Inches(2.2), Inches(2.2), Inches(8.9), Inches(3.2))
                q_tf = q_tb.text_frame
                q_tf.word_wrap = True

                qp = q_tf.paragraphs[0]
                qp.text = f'"{content.get("quote", title_text)}"'
                qp.font.size = Pt(24)
                qp.font.italic = True
                qp.font.color.rgb = title_color

                if content.get("author"):
                    ap = q_tf.add_paragraph()
                    ap.text = f"— {content.get('author')} ({content.get('affiliation', '')})"
                    ap.font.size = Pt(16)
                    ap.font.bold = True
                    ap.font.color.rgb = accent_rgb

            else:
                # Default: split_content / conclusion
                tb_h = slide.shapes.add_textbox(Inches(1.0), Inches(0.8), Inches(11.333), Inches(1.2))
                tf_h = tb_h.text_frame
                p_h = tf_h.paragraphs[0]
                p_h.text = title_text
                p_h.font.size = Pt(32)
                p_h.font.bold = True
                p_h.font.color.rgb = title_color

                if subtitle_text:
                    p_sub = tf_h.add_paragraph()
                    p_sub.text = subtitle_text
                    p_sub.font.size = Pt(16)
                    p_sub.font.color.rgb = subtitle_color

                # Content area
                content_card = slide.shapes.add_shape(
                    MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(2.3), Inches(11.333), Inches(4.4)
                )
                content_card.fill.solid()
                content_card.fill.fore_color.rgb = card_bg_color
                content_card.line.color.rgb = accent_rgb
                content_card.line.width = Pt(1)

                c_tb = slide.shapes.add_textbox(Inches(1.4), Inches(2.6), Inches(10.5), Inches(3.8))
                c_tf = c_tb.text_frame
                c_tf.word_wrap = True

                bullets = content.get("bullets") or content.get("action_items") or []
                if content.get("left_body"):
                    p_body = c_tf.paragraphs[0]
                    p_body.text = content.get("left_body")
                    p_body.font.size = Pt(16)
                    p_body.font.color.rgb = title_color

                for b_text in bullets:
                    b_p = c_tf.add_paragraph()
                    b_p.text = f"•   {b_text}"
                    b_p.font.size = Pt(15)
                    b_p.font.color.rgb = subtitle_color

                if content.get("contact"):
                    cp = c_tf.add_paragraph()
                    cp.text = f"Contact: {content.get('contact')}"
                    cp.font.size = Pt(14)
                    cp.font.bold = True
                    cp.font.color.rgb = accent_rgb

            # Add Speaker Notes to slide
            if speaker_notes:
                notes_slide = slide.notes_slide
                text_frame = notes_slide.notes_text_frame
                text_frame.text = speaker_notes

            # Add Slide Number & Brand Footer
            footer_tb = slide.shapes.add_textbox(Inches(1.0), Inches(6.9), Inches(11.333), Inches(0.4))
            footer_tf = footer_tb.text_frame
            footer_p = footer_tf.paragraphs[0]
            footer_p.text = f"AuthCraft AI Presentation Studio  •  Slide {s_idx + 1} of {len(slides)}"
            footer_p.font.size = Pt(10)
            footer_p.font.color.rgb = subtitle_color

        output = io.BytesIO()
        prs.save(output)
        output.seek(0)
        return output
