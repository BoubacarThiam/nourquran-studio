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

function drawArabicKaraoke(
  ctx:            CanvasRenderingContext2D,
  words:          WordSegment[],
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

  // Mesure des largeurs
  const measured = words.map((w) => ({
    word:  w,
    width: ctx.measureText(w.text_uthmani).width,
  }));

  // Construction des lignes RTL
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

  const totalH = lines.length * lineHeight;
  const topY   = centerY - totalH / 2;

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

  const scaledTransFontSize = Math.round(translationFontSize * scale);
  const padding    = width  * 0.08;
  const maxTextW   = width  - padding * 2;
  const fontFamily = getCanvasFont(arabicFont);

  const textCenterY =
    textPosition === "top"    ? height * 0.28 :
    textPosition === "bottom" ? height * 0.72 :
    height * 0.52;

  // ── Numéro de verset (absent pour la basmala, qui n'a pas de numéro réel) ──
  if (rv.verse_number > 0) {
    const verseNumFontSize = Math.max(10, arabicFontSize * 0.22);
    ctx.font         = `${verseNumFontSize}px sans-serif`;
    ctx.fillStyle    = "rgba(250,189,0,0.65)";
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.direction    = "ltr";
    ctx.fillText(`﴾ ${rv.verse_key} ﴿`, width / 2, textCenterY - arabicFontSize * 1.6);
  }

  // ── Texte arabe karaoké ───────────────────────────────────────────
  // Inclure tous les mots réels (char_type === "word"), excluant marqueurs de fin
  const arabicWords = rv.words.filter((w) => w.char_type === "word");
  if (arabicWords.length > 0) {
    drawArabicKaraoke(
      ctx, arabicWords, wordTimingMs,
      width / 2, textCenterY,
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
    ctx.fillText(rv.text_uthmani, width / 2, textCenterY);
    ctx.direction    = "ltr";
  }

  // ── Séparateur doré ───────────────────────────────────────────────
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

  // ── Traduction principale ─────────────────────────────────────────
  const [t1, t2] = rv.translations;
  let transY = sepY + 14;

  if (t1?.text) {
    ctx.font         = `${scaledTransFontSize}px "Inter", "Helvetica", sans-serif`;
    ctx.fillStyle    = "rgba(255,255,255,0.88)";
    ctx.textAlign    = "center";
    ctx.textBaseline = "top";
    ctx.direction    = "ltr";
    const linesDrawn = drawWrappedText(ctx, t1.text, width / 2, transY, maxTextW * 0.78, scaledTransFontSize * 1.75);
    transY += linesDrawn * scaledTransFontSize * 1.75 + 8;
  }

  if (t2?.text) {
    const t2Size = Math.round(scaledTransFontSize * 0.82);
    ctx.font         = `italic ${t2Size}px "Inter", "Helvetica", sans-serif`;
    ctx.fillStyle    = "rgba(255,255,255,0.50)";
    ctx.textAlign    = "center";
    ctx.textBaseline = "top";
    ctx.direction    = "ltr";
    drawWrappedText(ctx, t2.text, width / 2, transY, maxTextW * 0.78, t2Size * 1.75);
  }
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
