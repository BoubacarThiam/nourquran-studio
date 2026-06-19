/**
 * Bibliothèque de vidéos de fond sélectionnées à la main.
 * Les miniatures (images.pexels.com) sont publiques — aucune clé API nécessaire.
 * L'URL de lecture est récupérée via /api/pexels/video/{id} lorsque la clé est configurée.
 */

export interface CuratedVideo {
  id:        string;  // ID Pexels
  category:  string;
  label:     string;
  thumbnail: string;
  duration:  number;  // secondes (approximatif)
}

export const CURATED_CATEGORIES: Record<string, string> = {
  mosque:   "Mosquée & Islam",
  desert:   "Désert & Dunes",
  sky:      "Ciel étoilé",
  sunrise:  "Lever & Coucher",
  ocean:    "Mer & Eau",
  nature:   "Nature & Forêt",
  rain:     "Pluie & Nuages",
  light:    "Lumière & Bokeh",
};

function t(id: string) {
  return `https://images.pexels.com/videos/${id}/free-video-${id}.jpg?auto=compress&cs=tinysrgb&w=640&h=360`;
}

export const CURATED_VIDEOS: CuratedVideo[] = [
  // ── Mosquée & Islam ──────────────────────────────────────────────────
  { id: "3569183", category: "mosque",  label: "Mosquée dorée",          thumbnail: t("3569183"), duration: 20 },
  { id: "5206707", category: "mosque",  label: "Architecture islamique",  thumbnail: t("5206707"), duration: 15 },
  { id: "3876383", category: "mosque",  label: "Intérieur de mosquée",   thumbnail: t("3876383"), duration: 18 },
  { id: "4007009", category: "mosque",  label: "Coupole & Minarets",     thumbnail: t("4007009"), duration: 22 },

  // ── Désert & Dunes ───────────────────────────────────────────────────
  { id: "856016",  category: "desert",  label: "Dunes de sable doré",    thumbnail: t("856016"),  duration: 18 },
  { id: "3629537", category: "desert",  label: "Désert au coucher",      thumbnail: t("3629537"), duration: 25 },
  { id: "1192116", category: "desert",  label: "Horizon désertique",     thumbnail: t("1192116"), duration: 20 },
  { id: "3130281", category: "desert",  label: "Dunes ondulantes",       thumbnail: t("3130281"), duration: 15 },

  // ── Ciel étoilé ──────────────────────────────────────────────────────
  { id: "3066029", category: "sky",     label: "Voie lactée",            thumbnail: t("3066029"), duration: 30 },
  { id: "1624360", category: "sky",     label: "Étoiles timelapse",      thumbnail: t("1624360"), duration: 20 },
  { id: "1448735", category: "sky",     label: "Ciel nocturne",          thumbnail: t("1448735"), duration: 15 },

  // ── Lever & Coucher de soleil ────────────────────────────────────────
  { id: "4812207", category: "sunrise", label: "Coucher de soleil doré", thumbnail: t("4812207"), duration: 30 },
  { id: "5498527", category: "sunrise", label: "Lever de soleil",        thumbnail: t("5498527"), duration: 25 },
  { id: "1578922", category: "sunrise", label: "Horizon embrasé",        thumbnail: t("1578922"), duration: 20 },
  { id: "857251",  category: "sunrise", label: "Crépuscule montagnard",  thumbnail: t("857251"),  duration: 22 },

  // ── Mer & Eau ────────────────────────────────────────────────────────
  { id: "4062069", category: "ocean",   label: "Mer apaisante",          thumbnail: t("4062069"), duration: 25 },
  { id: "2170237", category: "ocean",   label: "Vagues sur la plage",    thumbnail: t("2170237"), duration: 20 },
  { id: "3126453", category: "ocean",   label: "Océan nocturne",         thumbnail: t("3126453"), duration: 18 },

  // ── Nature & Forêt ───────────────────────────────────────────────────
  { id: "3296602", category: "nature",  label: "Forêt mystique",         thumbnail: t("3296602"), duration: 30 },
  { id: "4947476", category: "nature",  label: "Rayons de lumière",      thumbnail: t("4947476"), duration: 20 },
  { id: "1388942", category: "nature",  label: "Verdure paisible",       thumbnail: t("1388942"), duration: 25 },

  // ── Pluie & Nuages ───────────────────────────────────────────────────
  { id: "2499611", category: "rain",    label: "Pluie sur fenêtre",      thumbnail: t("2499611"), duration: 20 },
  { id: "4622982", category: "rain",    label: "Nuages dramatiques",     thumbnail: t("4622982"), duration: 15 },

  // ── Lumière & Bokeh ──────────────────────────────────────────────────
  { id: "1426785", category: "light",   label: "Bokeh doré",             thumbnail: t("1426785"), duration: 20 },
  { id: "3785418", category: "light",   label: "Lumières flottantes",    thumbnail: t("3785418"), duration: 18 },
  { id: "2068193", category: "light",   label: "Particules lumineuses",  thumbnail: t("2068193"), duration: 22 },
];
