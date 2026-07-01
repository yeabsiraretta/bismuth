/**
 * Marp Renderer — generates HTML slide documents from parsed presentations.
 * Handles theming, pagination, headers/footers, and export.
 */
import type { MarpPresentation, MarpExportFormat } from '../types/marp';
import { log } from '@/utils/logger';

// ─── Slide HTML generation ──────────────────────────────────────────────────

/** Render a single slide to an HTML section element */
function renderSlide(pres: MarpPresentation, slideIndex: number, showNumbers: boolean): string {
  const slide = pres.slides[slideIndex];
  if (!slide) return '';

  const dir = pres.globalDirectives;
  const slideDir = slide.directives;
  const bg = slideDir['backgroundcolor'] || slideDir['bgcolor'] || dir.backgroundColor;
  const bgImage = slideDir['backgroundimage'] || dir.backgroundImage;
  const color = slideDir['color'] || dir.color;
  const slideClass = slideDir['class'] || dir.class;
  const transition = slide.transition || '';

  let style = '';
  if (bg) style += `background-color: ${bg};`;
  if (bgImage)
    style += `background-image: url('${bgImage}'); background-size: cover; background-position: center;`;
  if (color) style += `color: ${color};`;

  const lines: string[] = [];
  lines.push(
    `<section class="slide ${slideClass}" data-index="${slideIndex}" data-transition="${transition}" style="${style}">`
  );

  // Header
  if (dir.header) {
    lines.push(`<header class="slide-header">${dir.header}</header>`);
  }

  // Content
  lines.push(`<div class="slide-content">${slide.html}</div>`);

  // Footer with optional page number
  if (dir.footer || (dir.paginate && showNumbers)) {
    lines.push('<footer class="slide-footer">');
    if (dir.footer) lines.push(`<span class="footer-text">${dir.footer}</span>`);
    if (dir.paginate && showNumbers) {
      lines.push(`<span class="page-number">${slideIndex + 1} / ${pres.slides.length}</span>`);
    }
    lines.push('</footer>');
  }

  lines.push('</section>');
  return lines.join('\n');
}

// ─── Full presentation HTML ─────────────────────────────────────────────────

/** Generate a complete HTML document for the presentation */
export function renderPresentation(pres: MarpPresentation, showNumbers: boolean = true): string {
  const slidesHtml = pres.slides.map((_, i) => renderSlide(pres, i, showNumbers)).join('\n');

  const size = pres.globalDirectives.size || '16:9';
  const [w, h] = size.split(':').map(Number);
  const aspectRatio = w && h ? `${w} / ${h}` : '16 / 9';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${pres.notePath || 'Marp Slides'}</title>
<style>
${BASE_STYLES}
.slide { aspect-ratio: ${aspectRatio}; }
${pres.themeCss}
</style>
</head>
<body>
<div class="slides-container">
${slidesHtml}
</div>
<script>
${NAVIGATION_SCRIPT}
</script>
</body>
</html>`;
}

// ─── Export ──────────────────────────────────────────────────────────────────

/** Generate the export command for Marp CLI */
export function getMarpExportCommand(inputPath: string, format: MarpExportFormat): string {
  const formatFlag = format === 'pdf' ? '--pdf' : format === 'pptx' ? '--pptx' : '--html';
  return `npx @marp-team/marp-cli ${formatFlag} "${inputPath}"`;
}

/** Generate HTML string for export (self-contained) */
export function exportAsHtml(pres: MarpPresentation): string {
  log.info('[marpRenderer] Exporting as HTML', { notePath: pres.notePath });
  return renderPresentation(pres, true);
}

// ─── Base styles ─────────────────────────────────────────────────────────────

const BASE_STYLES = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1e1e2e; overflow: hidden; }
.slides-container { width: 100vw; height: 100vh; position: relative; }
.slide {
  width: 100%; height: 100%;
  display: none; flex-direction: column;
  padding: 48px 64px;
  background: #1e1e2e; color: #cdd6f4;
  overflow: hidden; position: absolute; top: 0; left: 0;
}
.slide.active { display: flex; }
.slide-content { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.slide-content h1 { font-size: 2.5em; margin-bottom: 0.5em; color: #89b4fa; }
.slide-content h2 { font-size: 2em; margin-bottom: 0.4em; color: #a6e3a1; }
.slide-content h3 { font-size: 1.5em; margin-bottom: 0.3em; color: #f9e2af; }
.slide-content p { font-size: 1.2em; line-height: 1.6; margin-bottom: 0.6em; }
.slide-content ul { padding-left: 1.5em; font-size: 1.1em; line-height: 1.8; }
.slide-content li { margin-bottom: 0.3em; }
.slide-content code { background: #313244; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
.slide-content img { max-width: 80%; max-height: 60vh; margin: 0 auto; display: block; border-radius: 8px; }
.slide-content a { color: #89b4fa; text-decoration: underline; }
.slide-content strong { color: #f38ba8; }
.slide-header { font-size: 0.9em; color: #6c7086; padding-bottom: 12px; border-bottom: 1px solid #313244; }
.slide-footer { display: flex; justify-content: space-between; font-size: 0.8em; color: #6c7086; padding-top: 12px; border-top: 1px solid #313244; }
.page-number { font-variant-numeric: tabular-nums; }

/* Transitions */
.slide.fade-in { animation: fadeIn 0.3s ease-in; }
.slide.slide-in-left { animation: slideLeft 0.3s ease-out; }
.slide.slide-in-right { animation: slideRight 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes slideRight { from { transform: translateX(-100%); } to { transform: translateX(0); } }
`;

const NAVIGATION_SCRIPT = `
(function() {
  let current = 0;
  const slides = document.querySelectorAll('.slide');
  function show(n) {
    slides.forEach((s, i) => {
      s.classList.toggle('active', i === n);
      if (i === n) {
        const t = s.dataset.transition;
        if (t === 'fade') s.classList.add('fade-in');
        else if (t === 'slide-left') s.classList.add('slide-in-left');
        else if (t === 'slide-right') s.classList.add('slide-in-right');
      } else {
        s.classList.remove('fade-in', 'slide-in-left', 'slide-in-right');
      }
    });
  }
  show(0);
  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); current = Math.min(current + 1, slides.length - 1); show(current); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); current = Math.max(current - 1, 0); show(current); }
    if (e.key === 'Home') { e.preventDefault(); current = 0; show(current); }
    if (e.key === 'End') { e.preventDefault(); current = slides.length - 1; show(current); }
  });
})();
`;
