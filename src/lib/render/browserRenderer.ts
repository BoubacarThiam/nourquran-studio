/**
 * Renderer canvas côté navigateur qui reproduit fidèlement la composition Remotion.
 * Utilisé pour l'enregistrement vidéo WebM sans serveur.
 */

import type { QuranCompositionProps, RenderVerse } from "@/types/remotion";
import type { WordSegment } from "@/types/quran";
import { BISMILLAH_ARABIC, BISMILLAH_TRANSLATIONS } from "@/lib/quran/bismillah";

export interface Dimensions {
  width:  number;
  height: number;
  /** Rapport canvas / composition Remotion (ex. 0.5 pour la moitié de la résolution) */
  scale:  number;
}

export function getCompositionDimensions(
  aspectRatio: string,
  resolution:  string,
): Dimensions {
  // Rendu à la moitié de la résolution native pour de meilleures performances
  const fullBase  = resolution === "1080p" ? 1080 : 720;
  const halfBase  = fullBase / 2;
  const scale     = 0.5;

  switch (aspectRatio) {
    case "16:9": return { width: Math.round(halfBase * 16 / 9), height: halfBase, scale };
    case "9:16": return { width: halfBase,  height: Math.round(halfBase * 16 / 9), scale };
    case "1:1":  return { width: halfBase,  height: halfBase, scale };
    case "4:5":  return { width: Math.round(halfBase * 4 / 5), height: halfBase, scale };
    default:     return { width: halfBase,  height: Math.round(halfBase * 16 / 9), scale };
  }
}

function getCanvasFont(arabicFont: string): string {
  switch (arabicFont) {
    case "amiri":        return '"Amiri", serif';
    case "scheherazade": return '"Scheherazade New", "Amiri", serif';
    default:             return '"Noto Naskh Arabic", "Amiri", serif';
  }
}

function findCurrentVerse(verses: RenderVerse[], absoluteMs: number): {
  verse: RenderVerse;
  verseElapsedMs: number; // temps écoulé depuis le début de ce verset
} | null {
  if (verses.length === 0) return null;

  const hasChapterAudio = verses[0]._chapterAudio;

  if (hasChapterAudio) {
    // Timestamps absolus dans l'audio du chapitre
    const exact = verses.find(
      (v) => absoluteMs >= v._timestampFrom && absoluteMs < v._timestampTo,
    );
    if (exact) {
      return { verse: exact, verseElapsedMs: absoluteMs - exact._timestampFrom };
    }
    const started = verses.filter((v) => absoluteMs >= v._timestampFrom);
    const last = started.length > 0 ? started[started.length - 1] : verses[0];
    return { verse: last, verseElapsedMs: absoluteMs - last._timestampFrom };
  }

  // Sans audio de chapitre : accumuler les durées estimées
  let cumMs = 0;
  for (const verse of verses) {
    const dur = verse._durationMs || 5000;
    if (absoluteMs < cumMs + dur) {
      return { verse, verseElapsedMs: absoluteMs - cumMs };
    }
    cumMs += dur;
  }
  const last = verses[verses.length - 1];
  return { verse: last, verseElapsedMs: absoluteMs - (cumMs - (last._durationMs || 5000)) };
}

function wrapTextLines(
  ctx:      CanvasRenderingContext2D,
  text:     string,
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawWrappedText(
  ctx:        CanvasRenderingContext2D,
  text:       string,
  x:          number,
  startY:     number,
  maxWidth:   number,
  lineHeight: number,
): number /* lines drawn */ {
  const lines = wrapTextLines(ctx, text, maxWidth);
  lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
  return lines.length;
}

interface KaraokeLayout {
  lines:  Array<{ word: WordSegment; width: number }[]>;
  totalH: number;
}

// Le découpage en lignes (measureText + retour à la ligne RTL) ne dépend que
// du texte/de la police/de la largeur disponible — jamais du temps. Sans ce
// cache, on le recalculait à chaque frame (jusqu'à 30x/s) pour un résultat
// identique, ce qui pouvait faire chuter le frame-rate réel de l'enregistrement
// (et donc des saccades dans la vidéo finale) sur les versets à nombreux mots.
const layoutCache = new Map<string, KaraokeLayout>();

function getKaraokeLayout(
  ctx:        CanvasRenderingContext2D,
  words:      WordSegment[],
  verseKey:   string,
  fontSize:   number,
  fontFamily: string,
  maxWidth:   number,
): KaraokeLayout {
  const cacheKey = `${verseKey}|${fontSize}|${fontFamily}|${maxWidth}`;
  const cached = layoutCache.get(cacheKey);
  if (cached) return cached;

  const gap = fontSize * 0.28;
  const lineHeight = fontSize * 2.3;

  ctx.font = `${fontSize}px ${fontFamily}`;
  const measured = words.map((w) => ({
    word:  w,
    width: ctx.measureText(w.text_uthmani).width,
  }));

  const lines: Array<{ word: WordSegment; width: number }[]> = [];
  let currentLine: typeof lines[0] = [];
  let currentWidth = 0;

  for (const item of measured) {
    const needed = currentWidth === 0 ? item.width : item.width + gap;
    if (currentWidth + needed > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine  = [item];
      currentWidth = item.width;
    } else {
      currentLine.push(item);
      currentWidth += needed;
    }
  }
  if (currentLine.length > 0) lines.push(currentLine);

  const layout = { lines, totalH: lines.length * lineHeight };
  layoutCache.set(cacheKey, layout);
  return layout;
}

function drawArabicKaraoke(
  ctx:            CanvasRenderingContext2D,
  words:          WordSegment[],
  verseKey:       string,
  absoluteMs:     number,
  centerX:        number,
  centerY:        number,
  fontSize:       number,
  fontFamily:     string,
  arabicColor:    string,
  highlightColor: string,
  maxWidth:       number,
): number /* height used */ {
  const gap        = fontSize * 0.28;
  const lineHeight = fontSize * 2.3;

  ctx.font          = `${fontSize}px ${fontFamily}`;
  ctx.textBaseline  = "middle";
  ctx.direction     = "rtl";

  const { lines, totalH } = getKaraokeLayout(ctx, words, verseKey, fontSize, fontFamily, maxWidth);
  const topY = centerY - totalH / 2;

  for (let l = 0; l < lines.length; l++) {
    const row      = lines[l];
    const rowWidth = row.reduce((acc, { width }) => acc + width, 0) + gap * (row.length - 1);
    let x = centerX + rowWidth / 2;

    for (const { word, width } of row) {
      const isActive = word.timestamp_from <= absoluteMs && absoluteMs < word.timestamp_to;
      const isPast   = word.timestamp_to > 0 && absoluteMs > word.timestamp_to;

      ctx.fillStyle = isActive
        ? highlightColor
        : isPast
        ? "rgba(255,255,255,0.28)"
        : arabicColor;

      if (isActive) {
        ctx.shadowColor = `${highlightColor}66`;
        ctx.shadowBlur  = fontSize * 0.4;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.textAlign = "right";
      ctx.fillText(word.text_uthmani, x, topY + l * lineHeight + lineHeight / 2);
      x -= width + gap;
    }
  }

  ctx.shadowBlur = 0;
  ctx.direction  = "ltr";
  return totalH;
}

export interface RenderFrameParams {
  ctx:         CanvasRenderingContext2D;
  width:       number;
  height:      number;
  scale:       number; // rapport canvas / résolution native (0.5 pour demi-résolution)
  absoluteMs:  number; // ms absolus dans l'audio du chapitre
  props:       QuranCompositionProps;
  bgVideoEl:   HTMLVideoElement | null;
  bgImgEl:     HTMLImageElement | null;
  frame:       number;
  totalFrames: number;
}

interface DrawBackgroundParams {
  ctx:         CanvasRenderingContext2D;
  width:       number;
  height:      number;
  props:       QuranCompositionProps;
  bgVideoEl:   HTMLVideoElement | null;
  bgImgEl:     HTMLImageElement | null;
  frame:       number;
  totalFrames: number;
}

/** Fond + overlay sombre + vignette — commun à toutes les frames (versets et basmala). */
function drawBackground({
  ctx, width, height, props, bgVideoEl, bgImgEl, frame, totalFrames,
}: DrawBackgroundParams): void {
  const { background, overlayOpacity, backgroundBlur, vignette, kenBurns, kenBurnsScale } = props;

  // ── Ken Burns ──────────────────────────────────────────────────────
  const kbScale = kenBurns
    ? 1 + ((kenBurnsScale / 100) - 1) * (frame / Math.max(totalFrames - 1, 1))
    : 1;
  const drawW = width  * kbScale;
  const drawH = height * kbScale;
  const drawX = (width  - drawW) / 2;
  const drawY = (height - drawH) / 2;

  // ── Fond ──────────────────────────────────────────────────────────
  ctx.clearRect(0, 0, width, height);

  const bgType = background.type;
  if ((bgType === "pexels_video" || bgType === "upload") && bgVideoEl && bgVideoEl.readyState >= 2) {
    if (backgroundBlur > 0) ctx.filter = `blur(${backgroundBlur}px)`;
    ctx.drawImage(bgVideoEl, drawX, drawY, drawW, drawH);
    ctx.filter = "none";
  } else if (bgType === "pexels_image" && bgImgEl && bgImgEl.complete) {
    if (backgroundBlur > 0) ctx.filter = `blur(${backgroundBlur}px)`;
    ctx.drawImage(bgImgEl, drawX, drawY, drawW, drawH);
    ctx.filter = "none";
  } else {
    ctx.fillStyle = background.color ?? "#0d1117";
    ctx.fillRect(0, 0, width, height);
  }

  // ── Overlay sombre ────────────────────────────────────────────────
  ctx.fillStyle = `rgba(0,0,0,${overlayOpacity})`;
  ctx.fillRect(0, 0, width, height);

  // ── Vignette ──────────────────────────────────────────────────────
  if (vignette) {
    const r    = Math.max(width, height) * 0.75;
    const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, r);
    grad.addColorStop(0.45, "rgba(0,0,0,0)");
    grad.addColorStop(1,    "rgba(0,0,0,0.72)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }
}

export function renderCompositionFrame({
  ctx, width, height, scale, absoluteMs, props,
  bgVideoEl, bgImgEl, frame, totalFrames,
}: RenderFrameParams): void {
  const {
    verses, arabicFont, translationFontSize,
    textPosition, arabicColor, highlightColor,
  } = props;

  // Toutes les tailles de police sont définies pour la résolution native (1080p).
  // On les met à l'échelle du canvas (ex. 0.5 pour 540p).
  const arabicFontSize = Math.round(props.arabicFontSize * scale);

  drawBackground({ ctx, width, height, props, bgVideoEl, bgImgEl, frame, totalFrames });

  // ── Verset actuel ─────────────────────────────────────────────────
  const found = findCurrentVerse(verses as RenderVerse[], absoluteMs);
  if (!found) return;
  const { verse: rv, verseElapsedMs } = found;
  // Pour les reciters avec timing chapitre, utiliser absoluteMs (timestamps globaux).
  // Pour les autres (Al-Luhaidan, Maher…), les timestamps de mots sont relatifs à 0
  // donc on utilise le temps écoulé depuis le début du verset.
  const wordTimingMs = rv._chapterAudio ? absoluteMs : verseElapsedMs;

  // Fondu d'entrée/sortie du verset (même durée que l'aperçu Remotion —
  // 12 frames à 30fps — pour que l'export final soit cohérent avec ce que
  // l'utilisateur a vu dans le player). Sans ce fondu, le texte apparaissait
  // et disparaissait brutalement d'une frame à l'autre dans la vidéo exportée.
  const FADE_MS = 400;
  const verseDurationMs = rv._durationMs > 0 ? rv._durationMs : 5000;
  const fadeIn  = Math.min(verseElapsedMs / FADE_MS, 1);
  const fadeOut = Math.min((verseDurationMs - verseElapsedMs) / FADE_MS, 1);
  ctx.globalAlpha = Math.max(0, Math.min(fadeIn, fadeOut, 1));

  const scaledTransFontSize = Math.round(translationFontSize * scale);
  const padding    = width  * 0.08;
  const maxTextW   = width  - padding * 2;
  const fontFamily = getCanvasFont(arabicFont);
  // Équivalent au `gap: 24` du flexbox de l'aperçu Remotion (VerseDisplay.tsx),
  // mis à l'échelle comme les polices.
  const GAP = 24 * scale;

  // ── Mesure de chaque section avant dessin ───────────────────────────
  // L'aperçu Remotion empile numéro + texte arabe + séparateur + traduction(s)
  // dans un flexbox qui s'adapte automatiquement à la hauteur réelle de
  // chaque section. Le canvas n'a pas cette adaptation automatique : ancrer
  // seulement le texte arabe à un point fixe faisait soit chevaucher la
  // traduction avec les lignes basses d'un verset long ("verset et traduction
  // mélangés"), soit la repousser hors-cadre (ex. Ayat al-Kursi, 7 lignes).
  // On mesure donc la hauteur réelle de CHAQUE section, puis on positionne le
  // bloc entier comme un tout selon textPosition — exactement comme le ferait
  // justifyContent côté Remotion.
  const arabicWords = rv.words.filter((w) => w.char_type === "word");
  ctx.font = `${arabicFontSize}px ${fontFamily}`;
  const arabicTotalH = arabicWords.length > 0
    ? getKaraokeLayout(ctx, arabicWords, rv.verse_key, arabicFontSize, fontFamily, maxTextW).totalH
    : Math.max(1, wrapTextLines(ctx, rv.text_uthmani, maxTextW).length) * arabicFontSize * 1.3;

  const hasVerseNum      = rv.verse_number > 0;
  const verseNumFontSize = Math.max(8, Math.round(16 * scale));
  const verseNumH        = Math.round(verseNumFontSize * 1.2) + Math.round(8 * scale); // ligne + marginBottom Remotion

  const [t1, t2] = rv.translations;
  const t1LineH = scaledTransFontSize * 1.75;
  ctx.font = `${scaledTransFontSize}px "Inter", "Helvetica", sans-serif`;
  const t1Lines = t1?.text ? wrapTextLines(ctx, t1.text, maxTextW * 0.78) : [];
  const t1H = t1Lines.length * t1LineH;

  const t2Size  = Math.round(scaledTransFontSize * 0.82);
  const t2LineH = t2Size * 1.75;
  ctx.font = `italic ${t2Size}px "Inter", "Helvetica", sans-serif`;
  const t2Lines = t2?.text ? wrapTextLines(ctx, t2.text, maxTextW * 0.78) : [];
  const t2H = t2Lines.length * t2LineH;

  const sectionHeights = [
    hasVerseNum ? verseNumH : 0,
    arabicTotalH,
    1, // séparateur
    t1H,
    t2H,
  ].filter((h) => h > 0);
  const blockH = sectionHeights.reduce((a, b) => a + b, 0) + GAP * Math.max(0, sectionHeights.length - 1);

  const edgePad  = height * 0.08; // équivalent au padding 8% du conteneur Remotion
  const blockTop =
    textPosition === "top"    ? edgePad :
    textPosition === "bottom" ? height - edgePad - blockH :
    (height - blockH) / 2;

  let cursorY = blockTop;

  // ── Numéro de verset (absent pour la basmala, qui n'a pas de numéro réel) ──
  if (hasVerseNum) {
    ctx.font         = `${verseNumFontSize}px sans-serif`;
    ctx.fillStyle    = "rgba(250,189,0,0.65)";
    ctx.textAlign    = "center";
    ctx.textBaseline = "top";
    ctx.direction    = "ltr";
    ctx.fillText(`﴾ ${rv.verse_key} ﴿`, width / 2, cursorY);
    cursorY += verseNumH + GAP;
  }

  // ── Texte arabe karaoké ───────────────────────────────────────────
  const arabicCenterY = cursorY + arabicTotalH / 2;
  if (arabicWords.length > 0) {
    drawArabicKaraoke(
      ctx, arabicWords, rv.verse_key, wordTimingMs,
      width / 2, arabicCenterY,
      arabicFontSize, fontFamily,
      arabicColor, highlightColor, maxTextW,
    );
  } else {
    // Fallback : afficher le texte complet du verset si aucun mot trouvé
    ctx.font         = `${arabicFontSize}px ${fontFamily}`;
    ctx.fillStyle    = arabicColor;
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.direction    = "rtl";
    ctx.fillText(rv.text_uthmani, width / 2, arabicCenterY);
    ctx.direction    = "ltr";
  }
  cursorY += arabicTotalH + GAP;

  // ── Séparateur doré ───────────────────────────────────────────────
  const sepY    = cursorY;
  const sepGrad = ctx.createLinearGradient(width / 2 - 30, sepY, width / 2 + 30, sepY);
  sepGrad.addColorStop(0,   "rgba(250,189,0,0)");
  sepGrad.addColorStop(0.5, "rgba(250,189,0,0.4)");
  sepGrad.addColorStop(1,   "rgba(250,189,0,0)");
  ctx.strokeStyle = sepGrad;
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 30, sepY);
  ctx.lineTo(width / 2 + 30, sepY);
  ctx.stroke();
  cursorY += 1 + GAP;

  // ── Traduction principale ─────────────────────────────────────────
  if (t1Lines.length > 0) {
    ctx.font         = `${scaledTransFontSize}px "Inter", "Helvetica", sans-serif`;
    ctx.fillStyle    = "rgba(255,255,255,0.88)";
    ctx.textAlign    = "center";
    ctx.textBaseline = "top";
    ctx.direction    = "ltr";
    t1Lines.forEach((l, i) => ctx.fillText(l, width / 2, cursorY + i * t1LineH));
    cursorY += t1H + GAP;
  }

  // ── Traduction secondaire / translittération ────────────────────────
  if (t2Lines.length > 0) {
    ctx.font         = `italic ${t2Size}px "Inter", "Helvetica", sans-serif`;
    ctx.fillStyle    = "rgba(255,255,255,0.50)";
    ctx.textAlign    = "center";
    ctx.textBaseline = "top";
    ctx.direction    = "ltr";
    t2Lines.forEach((l, i) => ctx.fillText(l, width / 2, cursorY + i * t2LineH));
  }

  ctx.globalAlpha = 1;
}

export interface RenderBismillahParams {
  ctx:         CanvasRenderingContext2D;
  width:       number;
  height:      number;
  scale:       number;
  props:       QuranCompositionProps;
  bgVideoEl:   HTMLVideoElement | null;
  bgImgEl:     HTMLImageElement | null;
  frame:       number;
  totalFrames: number;
  progressMs:  number; // ms écoulées depuis le début du préroulé
  durationMs:  number; // durée totale du préroulé
}

/**
 * Carte statique de la basmala affichée avant le verset 1 — pas de karaoké
 * mot-à-mot ici (aucun audio réel ne lui correspond), juste un fondu simple.
 */
export function renderBismillahFrame({
  ctx, width, height, scale, props, bgVideoEl, bgImgEl, frame, totalFrames, progressMs, durationMs,
}: RenderBismillahParams): void {
  const { arabicFont, translationFontSize, textPosition, arabicColor, translationIds } = props;
  const arabicFontSize     = Math.round(props.arabicFontSize * scale);
  const scaledTransFontSize = Math.round(translationFontSize * scale);

  drawBackground({ ctx, width, height, props, bgVideoEl, bgImgEl, frame, totalFrames });

  const fadeMs = 400;
  const opacity = Math.min(
    progressMs / fadeMs,
    (durationMs - progressMs) / fadeMs,
    1
  );
  ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

  const padding  = width * 0.08;
  const maxTextW = width - padding * 2;
  const fontFamily = getCanvasFont(arabicFont);

  const textCenterY =
    textPosition === "top"    ? height * 0.28 :
    textPosition === "bottom" ? height * 0.72 :
    height * 0.52;

  ctx.font         = `${arabicFontSize}px ${fontFamily}`;
  ctx.fillStyle    = arabicColor;
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.direction    = "rtl";
  ctx.fillText(BISMILLAH_ARABIC, width / 2, textCenterY);
  ctx.direction    = "ltr";

  const sepY    = textCenterY + arabicFontSize * 1.5;
  const sepGrad = ctx.createLinearGradient(width / 2 - 30, sepY, width / 2 + 30, sepY);
  sepGrad.addColorStop(0,   "rgba(250,189,0,0)");
  sepGrad.addColorStop(0.5, "rgba(250,189,0,0.4)");
  sepGrad.addColorStop(1,   "rgba(250,189,0,0)");
  ctx.strokeStyle = sepGrad;
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 30, sepY);
  ctx.lineTo(width / 2 + 30, sepY);
  ctx.stroke();

  const [primaryId, secondaryId] = translationIds;
  let transY = sepY + 14;

  const primaryText = primaryId ? BISMILLAH_TRANSLATIONS[primaryId] : undefined;
  if (primaryText) {
    ctx.font         = `${scaledTransFontSize}px "Inter", "Helvetica", sans-serif`;
    ctx.fillStyle    = "rgba(255,255,255,0.88)";
    ctx.textAlign    = "center";
    ctx.textBaseline = "top";
    const linesDrawn = drawWrappedText(ctx, primaryText, width / 2, transY, maxTextW * 0.78, scaledTransFontSize * 1.75);
    transY += linesDrawn * scaledTransFontSize * 1.75 + 8;
  }

  const secondaryText = secondaryId ? BISMILLAH_TRANSLATIONS[secondaryId] : undefined;
  if (secondaryText) {
    const t2Size = Math.round(scaledTransFontSize * 0.82);
    ctx.font         = `italic ${t2Size}px "Inter", "Helvetica", sans-serif`;
    ctx.fillStyle    = "rgba(255,255,255,0.50)";
    ctx.textAlign    = "center";
    ctx.textBaseline = "top";
    drawWrappedText(ctx, secondaryText, width / 2, transY, maxTextW * 0.78, t2Size * 1.75);
  }

  ctx.globalAlpha = 1;
}
