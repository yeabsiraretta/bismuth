/**
 * CodeMirror WidgetType for rendering link embed previews.
 *
 * Renders a card with favicon, title, description, image, and URL domain.
 * Includes refresh and copy buttons on hover.
 */

import { WidgetType } from '@codemirror/view';
import type { LinkEmbedData } from '../types';
import { serializeLinkEmbedData } from '../types';

export class LinkEmbedWidget extends WidgetType {
  constructor(private data: LinkEmbedData) {
    super();
  }

  toDOM(): HTMLElement {
    const card = document.createElement('a');
    card.className = 'cm-link-embed-card';
    card.href = this.data.url;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.setAttribute('draggable', 'false');

    // Content area (left side)
    const content = document.createElement('div');
    content.className = 'cm-link-embed-content';

    // Header: favicon + site name/domain
    const header = document.createElement('div');
    header.className = 'cm-link-embed-header';

    if (this.data.favicon) {
      const favicon = document.createElement('img');
      favicon.className = 'cm-link-embed-favicon';
      favicon.src = this.data.favicon;
      favicon.width = 16;
      favicon.height = 16;
      favicon.loading = 'lazy';
      favicon.onerror = () => {
        favicon.style.display = 'none';
      };
      header.appendChild(favicon);
    }

    const domain = document.createElement('span');
    domain.className = 'cm-link-embed-domain';
    domain.textContent = this.data.site_name || this.extractDomain();
    header.appendChild(domain);
    content.appendChild(header);

    // Title
    if (this.data.title) {
      const title = document.createElement('div');
      title.className = 'cm-link-embed-title';
      title.textContent = this.data.title;
      content.appendChild(title);
    }

    // Description
    if (this.data.description) {
      const desc = document.createElement('div');
      desc.className = 'cm-link-embed-desc';
      desc.textContent =
        this.data.description.length > 200
          ? this.data.description.slice(0, 197) + '...'
          : this.data.description;
      content.appendChild(desc);
    }

    card.appendChild(content);

    // Image (right side)
    if (this.data.image) {
      const imgWrap = document.createElement('div');
      imgWrap.className = 'cm-link-embed-img-wrap';
      const img = document.createElement('img');
      img.className = 'cm-link-embed-img';
      img.src = this.data.image;
      img.loading = 'lazy';
      img.onerror = () => {
        imgWrap.style.display = 'none';
      };
      if (this.data.aspectRatio) {
        img.style.aspectRatio = this.data.aspectRatio;
      }
      imgWrap.appendChild(img);
      card.appendChild(imgWrap);
    }

    // Action buttons (visible on hover)
    const actions = document.createElement('div');
    actions.className = 'cm-link-embed-actions';

    const copyBtn = this.makeButton('Copy', () => {
      const block = '```link-embed\n' + serializeLinkEmbedData(this.data) + '\n```';
      navigator.clipboard.writeText(block);
      copyBtn.textContent = 'Copied';
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
      }, 1200);
    });
    actions.appendChild(copyBtn);

    card.appendChild(actions);

    // Prevent editor from handling the click
    card.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    return card;
  }

  eq(other: LinkEmbedWidget): boolean {
    return (
      this.data.url === other.data.url &&
      this.data.title === other.data.title &&
      this.data.image === other.data.image
    );
  }

  ignoreEvent(): boolean {
    return true;
  }

  private extractDomain(): string {
    try {
      return new URL(this.data.url).hostname.replace(/^www\./, '');
    } catch {
      return this.data.url;
    }
  }

  private makeButton(label: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'cm-link-embed-btn';
    btn.textContent = label;
    btn.title = label;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });
    return btn;
  }
}
