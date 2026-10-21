/*
 * Passo a Passo — the visual stage.
 * Grid: one row per tense, one column per segment. Each segment is revealed in
 * all rows at once and stays there, so the learner can compare tenses.
 */
(function (root) {
  'use strict';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));

  function tokenHtml(tok, lang, showMeaning) {
    const d = tok.disp || { type: 'plain' };
    const c = tok.first ? cap : (s) => s;
    let word;
    if (d.type === 'split') word = `${esc(c(d.base))}<span class="end">${esc(d.end)}</span>`;
    else if (d.type === 'aux') word = `<span class="aux">${esc(c(d.aux))}</span>${d.mid ? ' <span class="mid">' + esc(d.mid) + '</span>' : ''} <span class="part">${esc(d.part)}</span>`;
    else word = esc(c(tok.text));
    const m = tok.m && tok.m[lang];
    return `<span class="ic" aria-hidden="true">${esc(tok.ic || '')}</span>`
      + `<span class="w">${word}${tok.post ? '<span class="post">' + esc(tok.post) + '</span>' : ''}</span>`
      + (showMeaning && m ? `<span class="m" dir="auto">${esc(m)}</span>` : '');
  }

  class Stage {
    constructor(el) { this.el = el; this.scene = null; }

    clear() { this.el.innerHTML = ''; this.scene = null; }

    // ---------- Title card ----------
    title(d) {
      this.scene = 'title';
      this.el.innerHTML = `<div class="scene title-scene">
        <div class="badge">${esc(d.badge)}</div>
        <h2>${esc(d.title)}</h2>
        <p>${esc(d.goal)}</p>
        ${d.rows ? `<div class="row-pills">${d.rows.map((r) => `<span class="pill t-${r.time}">${esc(r.icon)} ${esc(r.label)} <small dir="ltr">${esc(r.it)}</small></span>`).join('')}</div>` : ''}
        ${d.info ? `<div class="title-info">${esc(d.info)}</div>` : ''}
        ${d.vocab && d.vocab.length ? `<div class="vocab-head">${esc(d.vocabLabel)}</div><div class="vocab" dir="ltr">${d.vocab.map((v, i) => `<span class="vchip r-${v.role}" style="--d:${i * 60}ms"><i aria-hidden="true">${esc(v.ic || '•')}</i><b>${esc(v.it)}</b><small dir="auto">${esc(v.m || '')}</small></span>`).join('')}</div>` : ''}
      </div>`;
    }

    // ---------- Comparison grid ----------
    grid(model, sentence, opts) {
      this.scene = 'grid';
      const { lang, showMeaning } = opts;
      const n = sentence.segs.length;
      let cells = '';
      model.rows.forEach((row, r) => {
        const line = 2 * r + 1;
        cells += `<div class="rlabel t-${row.time}" data-row="${r}" style="grid-row:${line} / span 2">
            <span class="ricon">${esc(row.icon)}</span><b dir="auto">${esc(row.label[lang])}</b><small>${esc(row.it)}</small></div>`;
        sentence.rows[r].tokens.forEach((tok, s) => {
          cells += `<div class="tok r-${tok.role} hid" data-row="${r}" data-seg="${s}" style="grid-row:${line};grid-column:${s + 2}">${tokenHtml(tok, lang, showMeaning)}</div>`;
        });
        cells += `<div class="gloss hid" data-row="${r}" dir="auto" style="grid-row:${line + 1};grid-column:2 / -1"><span class="full" dir="ltr">${esc(sentence.rows[r].full)}</span><span class="tr">${esc(sentence.rows[r].gloss[lang])}</span></div>`;
      });
      const roles = Array.from(new Set(sentence.segs.map((g) => g.role)));
      const head = opts.kindLabel ? `<div class="grid-head"><span class="kind k-${sentence.kind}">${esc(opts.kindLabel)}</span>
        <span class="legend">${roles.map((r) => `<span class="lg r-${r}"><i></i>${esc((opts.roles || {})[r] || r)}</span>`).join('')}</span></div>` : '';
      this.el.innerHTML = `<div class="scene grid-scene">${head}<div class="grid-scroll"><div class="grid" dir="ltr" style="grid-template-columns:max-content repeat(${n}, max-content)">${cells}</div></div></div>`;
      this.gridEl = $('.grid', this.el);
    }

    reveal(seg, animate) {
      $$(`.tok[data-seg="${seg}"]`, this.gridEl).forEach((t, i) => {
        t.classList.remove('hid');
        if (animate) { t.style.animationDelay = `${i * 110}ms`; t.classList.add('pop'); }
      });
      const first = $(`.tok[data-seg="${seg}"]`, this.gridEl);
      if (first && first.scrollIntoView) {
        const sc = $('.grid-scroll', this.el);
        const right = first.offsetLeft + first.offsetWidth;
        if (right > sc.scrollLeft + sc.clientWidth) sc.scrollTo({ left: right - sc.clientWidth + 24, behavior: animate ? 'smooth' : 'auto' });
      }
    }

    revealAll() { if (this.gridEl) $$('.tok', this.gridEl).forEach((t) => t.classList.remove('hid')); }

    showGloss(r, on) { const g = $(`.gloss[data-row="${r}"]`, this.gridEl); if (g) g.classList.toggle('hid', on === false); }

    focusRow(r) {
      if (!this.gridEl) return;
      $$('[data-row]', this.gridEl).forEach((el) => el.classList.toggle('active', r != null && +el.dataset.row === r));
      this.gridEl.classList.toggle('has-focus', r != null);
    }

    // Karaoke: light up the token being spoken in row r (null clears)
    karaoke(r, s) {
      if (!this.gridEl) return;
      $$('.tok.sung, .tok.now', this.gridEl).forEach((el) => el.classList.remove('sung', 'now'));
      if (r == null) return;
      $$(`.tok[data-row="${r}"]`, this.gridEl).forEach((el) => {
        const k = +el.dataset.seg;
        if (k < s) el.classList.add('sung');
        else if (k === s) el.classList.add('now');
      });
    }

    focusCell(r, s) {
      if (!this.gridEl) return;
      $$('.tok.speaking', this.gridEl).forEach((el) => el.classList.remove('speaking'));
      if (r == null) return;
      const el = $(`.tok[data-row="${r}"][data-seg="${s}"]`, this.gridEl);
      if (el) el.classList.add('speaking');
    }

    cover(on) { if (this.gridEl) this.gridEl.classList.toggle('covered', !!on); }

    // ---------- Overview: timeline of tenses ----------
    timeline(d) {
      this.scene = 'timeline';
      const col = (time) => `<div class="tl-col t-${time}"><div class="tl-head">${esc(d.heads[time])}</div>
        ${d.tenses.filter((t) => t.time === time).map((t) => `<div class="tl-card hid" data-key="${t.key}">
          <div class="tl-it" dir="ltr">${esc(t.it)}</div><div class="tl-name">${esc(t.name)}</div>
          <div class="stars" aria-label="${t.freq}/3">${'★'.repeat(t.freq)}<span>${'★'.repeat(3 - t.freq)}</span></div></div>`).join('')}</div>`;
      this.el.innerHTML = `<div class="scene timeline-scene"><div class="tl-arrow"></div><div class="tl">${['past', 'present', 'future'].map(col).join('')}</div></div>`;
    }

    tlReveal(key, animate) {
      const c = $(`.tl-card[data-key="${key}"]`, this.el);
      if (!c) return;
      c.classList.remove('hid');
      if (animate) c.classList.add('pop');
      $$('.tl-card.speaking', this.el).forEach((e) => e.classList.remove('speaking'));
      if (animate) c.classList.add('speaking');
    }

    tlMark(keys) {
      $$('.tl-card', this.el).forEach((c) => {
        c.classList.toggle('marked', keys.includes(c.dataset.key));
        c.classList.remove('speaking');
      });
    }

    // ---------- Overview: structure ladder ----------
    ladder(d) {
      this.scene = 'ladder';
      this.el.innerHTML = `<div class="scene ladder-scene">${d.steps.map((s, i) => `
        <div class="step hid" data-i="${i}" style="--i:${i}">
          <div class="step-n">${i + 1}</div>
          <div class="step-body"><b>${esc(s.name)}</b><div class="ex" dir="ltr">${s.html}</div><div class="tr" dir="auto">${esc(s.gloss)}</div></div>
        </div>`).join('')}</div>`;
    }

    ladderReveal(i, animate) {
      const s = $(`.step[data-i="${i}"]`, this.el);
      if (!s) return;
      s.classList.remove('hid');
      if (animate) s.classList.add('pop');
    }

    // ---------- Overview: roadmap ----------
    road(d) {
      this.scene = 'road';
      this.el.innerHTML = `<div class="scene road-scene">${d.units.map((u, i) => `
        <div class="road-unit pop" style="animation-delay:${i * 140}ms"><span class="lvl">${esc(u.level)}</span><span dir="auto">${esc(u.title)}</span></div>`).join('')}</div>`;
    }

    // Generic container used by quizzes
    panel(html) {
      this.scene = 'panel';
      this.el.innerHTML = `<div class="scene panel-scene">${html}</div>`;
      return $('.panel-scene', this.el);
    }
  }

  // ---------- Instructor caption (one span per word, for karaoke) ----------
  function captionHtml(line) {
    return root.PassoSpeech.parse(line).map((p) => {
      let i = p.offset;
      const html = esc(p.text).replace(/\S+/g, (w) => `<span class="cw" data-w="${i++}">${w}</span>`);
      return p.target ? `<span class="it" dir="ltr">${html}</span>` : html;
    }).join('');
  }

  root.PassoStage = { Stage, tokenHtml, captionHtml, esc };
})(typeof self !== 'undefined' ? self : this);
