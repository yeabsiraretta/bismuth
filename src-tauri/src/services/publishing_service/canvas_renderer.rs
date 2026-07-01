//! Canvas-to-HTML renderer for published pages.
//!
//! Transforms a `CanvasDocument` into static HTML/CSS that preserves
//! the visual layout of all elements, components, and pages.

use crate::models::canvas::{CanvasDocument, CanvasElement, ComponentDefinition, ElementType, Page};

/// Renders a full canvas document as a standalone HTML section.
/// Each page becomes a separate `<section>` with positioned elements.
pub fn render_canvas_html(canvas: &CanvasDocument) -> String {
    let mut html = String::new();
    html.push_str(&format!(
        "<div class=\"canvas-embed\" data-canvas-id=\"{}\">\n",
        canvas.id
    ));
    html.push_str(&format!(
        "  <h2 class=\"canvas-title\">{}</h2>\n",
        escape(&canvas.name)
    ));

    if canvas.pages.is_empty() {
        // No pages — render all elements flat
        html.push_str("  <div class=\"canvas-page\">\n");
        let bounds = compute_bounds(&canvas.elements);
        render_elements(&mut html, &canvas.elements, &canvas.components, &bounds);
        html.push_str("  </div>\n");
    } else {
        for page in &canvas.pages {
            html.push_str(&render_page(page, &canvas.elements, &canvas.components));
        }
    }

    html.push_str("</div>\n");
    html
}

/// Renders a single page (tab) of a canvas document.
fn render_page(
    page: &Page,
    all_elements: &[CanvasElement],
    components: &[ComponentDefinition],
) -> String {
    let page_elements: Vec<&CanvasElement> = if page.elements.is_empty() {
        // If page has no element IDs, show all top-level elements
        all_elements.iter().filter(|e| e.parent_id.is_none()).collect()
    } else {
        all_elements
            .iter()
            .filter(|e| page.elements.contains(&e.id))
            .collect()
    };

    let owned: Vec<CanvasElement> = page_elements.iter().map(|e| (*e).clone()).collect();
    let bounds = compute_bounds(&owned);

    let mut html = String::new();
    let bg = page
        .background
        .as_deref()
        .unwrap_or("transparent");
    html.push_str(&format!(
        "  <section class=\"canvas-page\" data-page=\"{}\" style=\"background:{}\">\n",
        escape(&page.name),
        bg
    ));
    html.push_str(&format!(
        "    <h3 class=\"canvas-page-title\">{}</h3>\n",
        escape(&page.name)
    ));

    html.push_str(&format!(
        "    <div class=\"canvas-viewport\" style=\"width:{}px;height:{}px;position:relative\">\n",
        bounds.width, bounds.height
    ));
    render_elements_ref(&mut html, &page_elements, all_elements, components, &bounds);
    html.push_str("    </div>\n");
    html.push_str("  </section>\n");
    html
}

/// Bounding box for normalizing element positions.
struct Bounds {
    min_x: f64,
    min_y: f64,
    width: f64,
    height: f64,
}

fn compute_bounds(elements: &[CanvasElement]) -> Bounds {
    if elements.is_empty() {
        return Bounds { min_x: 0.0, min_y: 0.0, width: 800.0, height: 600.0 };
    }
    let min_x = elements.iter().map(|e| e.x).fold(f64::INFINITY, f64::min);
    let min_y = elements.iter().map(|e| e.y).fold(f64::INFINITY, f64::min);
    let max_x = elements.iter().map(|e| e.x + e.width).fold(f64::NEG_INFINITY, f64::max);
    let max_y = elements.iter().map(|e| e.y + e.height).fold(f64::NEG_INFINITY, f64::max);
    let width = (max_x - min_x).max(100.0);
    let height = (max_y - min_y).max(100.0);
    Bounds { min_x, min_y, width, height }
}

fn render_elements(
    html: &mut String,
    elements: &[CanvasElement],
    components: &[ComponentDefinition],
    bounds: &Bounds,
) {
    let refs: Vec<&CanvasElement> = elements.iter().collect();
    render_elements_ref(html, &refs, elements, components, bounds);
}

fn render_elements_ref(
    html: &mut String,
    elements: &[&CanvasElement],
    all_elements: &[CanvasElement],
    components: &[ComponentDefinition],
    bounds: &Bounds,
) {
    let mut sorted: Vec<&&CanvasElement> = elements.iter().collect();
    sorted.sort_by_key(|e| e.z_index);

    for elem in sorted {
        if !elem.visible {
            continue;
        }
        let children: Vec<&CanvasElement> = all_elements
            .iter()
            .filter(|c| c.parent_id.as_deref() == Some(&elem.id))
            .collect();
        render_element(html, elem, &children, all_elements, components, bounds);
    }
}

fn render_element(
    html: &mut String,
    elem: &CanvasElement,
    children: &[&CanvasElement],
    all_elements: &[CanvasElement],
    components: &[ComponentDefinition],
    bounds: &Bounds,
) {
    let x = elem.x - bounds.min_x;
    let y = elem.y - bounds.min_y;
    let opacity = prop_f64(elem, "opacity", 1.0);
    let fill = prop_str(elem, "fill", "transparent");
    let stroke = prop_str(elem, "stroke", "none");
    let stroke_w = prop_f64(elem, "strokeWidth", 0.0);
    let radius = prop_f64(elem, "borderRadius", prop_f64(elem, "radius", 0.0));
    let rotation = if elem.rotation.abs() > 0.01 {
        format!("transform:rotate({}deg);", elem.rotation)
    } else {
        String::new()
    };
    let name = elem.name.as_deref().unwrap_or("");

    match elem.element_type {
        ElementType::Rectangle => {
            html.push_str(&format!(
                "      <div class=\"cv-rect\" title=\"{}\" style=\"left:{x}px;top:{y}px;width:{}px;height:{}px;\
                 background:{fill};border:{stroke_w}px solid {stroke};border-radius:{radius}px;\
                 opacity:{opacity};{rotation}position:absolute\"></div>\n",
                escape(name), elem.width, elem.height,
                x = x, y = y, fill = fill, stroke_w = stroke_w, stroke = stroke,
                radius = radius, opacity = opacity, rotation = rotation,
            ));
        }
        ElementType::Circle => {
            html.push_str(&format!(
                "      <div class=\"cv-circle\" title=\"{}\" style=\"left:{x}px;top:{y}px;width:{}px;height:{}px;\
                 background:{fill};border:{stroke_w}px solid {stroke};border-radius:50%;\
                 opacity:{opacity};{rotation}position:absolute\"></div>\n",
                escape(name), elem.width, elem.height,
                x = x, y = y, fill = fill, stroke_w = stroke_w, stroke = stroke,
                opacity = opacity, rotation = rotation,
            ));
        }
        ElementType::Text => {
            let text = prop_str(elem, "text", "");
            let font_size = prop_f64(elem, "fontSize", 16.0);
            let font_family = prop_str(elem, "fontFamily", "Inter, sans-serif");
            let font_weight = prop_f64(elem, "fontWeight", 400.0) as i32;
            let text_align = prop_str(elem, "textAlign", "left");
            html.push_str(&format!(
                "      <div class=\"cv-text\" title=\"{}\" style=\"left:{x}px;top:{y}px;width:{}px;\
                 color:{fill};font-size:{font_size}px;font-family:{font_family};\
                 font-weight:{font_weight};text-align:{text_align};\
                 opacity:{opacity};{rotation}position:absolute\">{text}</div>\n",
                escape(name), elem.width,
                x = x, y = y, fill = fill, font_size = font_size,
                font_family = font_family, font_weight = font_weight,
                text_align = text_align, opacity = opacity, rotation = rotation,
                text = escape(&text),
            ));
        }
        ElementType::Image => {
            let src = prop_str(elem, "src", "");
            html.push_str(&format!(
                "      <img class=\"cv-image\" alt=\"{}\" src=\"{}\" style=\"left:{x}px;top:{y}px;\
                 width:{}px;height:{}px;opacity:{opacity};{rotation}\
                 position:absolute;object-fit:cover\" />\n",
                escape(name), escape(&src), elem.width, elem.height,
                x = x, y = y, opacity = opacity, rotation = rotation,
            ));
        }
        ElementType::Frame | ElementType::Screen => {
            let clip = prop_bool(elem, "clipContent", true);
            let overflow = if clip { "hidden" } else { "visible" };
            html.push_str(&format!(
                "      <div class=\"cv-frame\" title=\"{}\" style=\"left:{x}px;top:{y}px;width:{}px;height:{}px;\
                 background:{fill};border:{stroke_w}px solid {stroke};border-radius:{radius}px;\
                 overflow:{overflow};opacity:{opacity};{rotation}position:absolute\">\n",
                escape(name), elem.width, elem.height,
                x = x, y = y, fill = fill, stroke_w = stroke_w, stroke = stroke,
                radius = radius, overflow = overflow, opacity = opacity, rotation = rotation,
            ));
            if !name.is_empty() {
                html.push_str(&format!(
                    "        <span class=\"cv-frame-label\">{}</span>\n",
                    escape(name)
                ));
            }
            // Render child elements relative to frame
            let frame_bounds = Bounds {
                min_x: elem.x,
                min_y: elem.y,
                width: elem.width,
                height: elem.height,
            };
            for child in children {
                let grandchildren: Vec<&CanvasElement> = all_elements
                    .iter()
                    .filter(|c| c.parent_id.as_deref() == Some(&child.id))
                    .collect();
                render_element(html, child, &grandchildren, all_elements, components, &frame_bounds);
            }
            html.push_str("      </div>\n");
        }
        ElementType::Group => {
            html.push_str(&format!(
                "      <div class=\"cv-group\" title=\"{}\" style=\"left:{x}px;top:{y}px;\
                 opacity:{opacity};{rotation}position:absolute\">\n",
                escape(name), x = x, y = y, opacity = opacity, rotation = rotation,
            ));
            let group_bounds = Bounds {
                min_x: elem.x,
                min_y: elem.y,
                width: elem.width,
                height: elem.height,
            };
            for child in children {
                let grandchildren: Vec<&CanvasElement> = all_elements
                    .iter()
                    .filter(|c| c.parent_id.as_deref() == Some(&child.id))
                    .collect();
                render_element(html, child, &grandchildren, all_elements, components, &group_bounds);
            }
            html.push_str("      </div>\n");
        }
        ElementType::ComponentInstance => {
            let comp_id = prop_str(elem, "componentId", "");
            if let Some(def) = components.iter().find(|c| c.id == comp_id) {
                render_component_instance(html, elem, def, bounds);
            } else {
                // Unknown component — render as a placeholder
                html.push_str(&format!(
                    "      <div class=\"cv-component\" title=\"{}\" style=\"left:{x}px;top:{y}px;\
                     width:{}px;height:{}px;border:1px dashed var(--muted,#9ca3af);\
                     opacity:{opacity};{rotation}position:absolute\"></div>\n",
                    escape(name), elem.width, elem.height,
                    x = x, y = y, opacity = opacity, rotation = rotation,
                ));
            }
        }
        ElementType::Line | ElementType::Arrow => {
            render_line_svg(html, elem, bounds);
        }
        ElementType::Pen => {
            // Pen paths rendered as SVG path
            let path_data = prop_str(elem, "pathData", "");
            if !path_data.is_empty() {
                html.push_str(&format!(
                    "      <svg class=\"cv-pen\" style=\"left:{x}px;top:{y}px;width:{}px;height:{}px;\
                     opacity:{opacity};{rotation}position:absolute;overflow:visible\">\
                     <path d=\"{}\" fill=\"{fill}\" stroke=\"{stroke}\" stroke-width=\"{stroke_w}\"/></svg>\n",
                    elem.width, elem.height,
                    escape(&path_data),
                    x = x, y = y, fill = fill, stroke = stroke, stroke_w = stroke_w,
                    opacity = opacity, rotation = rotation,
                ));
            }
        }
    }
}

/// Renders a component instance by inlining the component definition's elements.
fn render_component_instance(
    html: &mut String,
    instance: &CanvasElement,
    def: &ComponentDefinition,
    bounds: &Bounds,
) {
    let x = instance.x - bounds.min_x;
    let y = instance.y - bounds.min_y;
    let name = instance.name.as_deref().unwrap_or(&def.name);
    let opacity = prop_f64(instance, "opacity", 1.0);

    // Scale factor from definition size to instance size
    let sx = instance.width / def.width.max(1.0);
    let sy = instance.height / def.height.max(1.0);

    html.push_str(&format!(
        "      <div class=\"cv-component\" title=\"{}\" style=\"left:{}px;top:{}px;\
         width:{}px;height:{}px;opacity:{};position:absolute;overflow:hidden\">\n",
        escape(name), x, y, instance.width, instance.height, opacity,
    ));

    // Render component's master elements scaled into the instance bounds
    let comp_bounds = Bounds {
        min_x: 0.0,
        min_y: 0.0,
        width: def.width,
        height: def.height,
    };
    html.push_str(&format!(
        "        <div style=\"transform:scale({},{});transform-origin:0 0;width:{}px;height:{}px;position:relative\">\n",
        sx, sy, def.width, def.height,
    ));
    for elem in &def.elements {
        let children: Vec<&CanvasElement> = def
            .elements
            .iter()
            .filter(|c| c.parent_id.as_deref() == Some(&elem.id))
            .collect();
        if elem.parent_id.is_none() {
            render_element(html, elem, &children, &def.elements, &[], &comp_bounds);
        }
    }
    html.push_str("        </div>\n");
    html.push_str("      </div>\n");
}

/// Renders a line or arrow as inline SVG.
fn render_line_svg(html: &mut String, elem: &CanvasElement, bounds: &Bounds) {
    let x = elem.x - bounds.min_x;
    let y = elem.y - bounds.min_y;
    let stroke = prop_str(elem, "stroke", "#000");
    let stroke_w = prop_f64(elem, "strokeWidth", 2.0);
    let opacity = prop_f64(elem, "opacity", 1.0);
    let is_arrow = elem.element_type == ElementType::Arrow;
    let end_arrow = is_arrow || prop_bool(elem, "endArrow", false);

    let marker = if end_arrow {
        format!(
            "<defs><marker id=\"ah-{}\" markerWidth=\"10\" markerHeight=\"7\" \
             refX=\"10\" refY=\"3.5\" orient=\"auto\"><polygon points=\"0 0, 10 3.5, 0 7\" \
             fill=\"{}\"/></marker></defs>",
            elem.id, stroke
        )
    } else {
        String::new()
    };
    let marker_attr = if end_arrow {
        format!("marker-end=\"url(#ah-{})\"", elem.id)
    } else {
        String::new()
    };

    html.push_str(&format!(
        "      <svg class=\"cv-line\" style=\"left:{x}px;top:{y}px;width:{}px;height:{}px;\
         opacity:{opacity};position:absolute;overflow:visible\">{marker}\
         <line x1=\"0\" y1=\"0\" x2=\"{}\" y2=\"{}\" stroke=\"{stroke}\" \
         stroke-width=\"{stroke_w}\" {marker_attr}/></svg>\n",
        elem.width.max(2.0), elem.height.max(2.0),
        elem.width, elem.height,
        x = x, y = y, opacity = opacity, marker = marker,
        stroke = stroke, stroke_w = stroke_w, marker_attr = marker_attr,
    ));
}

fn prop_str(e: &CanvasElement, k: &str, d: &str) -> String { e.properties.get(k).and_then(|v| v.as_str()).unwrap_or(d).to_string() }
fn prop_f64(e: &CanvasElement, k: &str, d: f64) -> f64 { e.properties.get(k).and_then(|v| v.as_f64()).unwrap_or(d) }
fn prop_bool(e: &CanvasElement, k: &str, d: bool) -> bool { e.properties.get(k).and_then(|v| v.as_bool()).unwrap_or(d) }
fn escape(t: &str) -> String { t.replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;").replace('"', "&quot;") }

/// CSS for canvas-rendered elements in published pages.
pub fn canvas_css() -> &'static str {
    ".canvas-embed{margin:2rem 0;border:1px solid var(--border,#e5e7eb);border-radius:8px;overflow:hidden}\
     .canvas-title{font-size:1.1em;padding:12px 16px;margin:0;background:var(--code-bg,#f3f4f6);border-bottom:1px solid var(--border,#e5e7eb)}\
     .canvas-page{padding:16px}.canvas-page+.canvas-page{border-top:1px solid var(--border,#e5e7eb)}\
     .canvas-page-title{font-size:.9em;color:var(--muted,#6b7280);margin:0 0 12px}\
     .canvas-viewport{background:var(--bg,#fff);border-radius:4px}\
     .cv-frame-label{display:block;font-size:11px;color:var(--muted,#6b7280);padding:2px 6px;position:absolute;top:-18px;left:0;white-space:nowrap}\
     .cv-text{white-space:pre-wrap;word-break:break-word}.cv-component{border-radius:4px}.cv-image{border-radius:4px}\
     .canvas-standalone{max-width:960px;margin:0 auto;padding:2rem}.canvas-standalone h1{margin-bottom:1.5rem}"
}

