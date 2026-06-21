/**
 * Bibliothèque de vidéos de fond sélectionnées à la main.
 *
 * Important : les miniatures Pexels n'ont PAS d'URL prévisible à partir du
 * seul ID (le nom de fichier dépend d'un slug propre à chaque vidéo, ex.
 * "aesthetic-vibe-summer-...-33170755.jpeg", pas "free-video-33170755.jpg").
 * Toutes les entrées ci-dessous ont donc été vérifiées une à une via l'API
 * Pexels (existence + URL de miniature réelle) avant d'être ajoutées — ne
 * pas reconstruire une URL de miniature à partir d'un ID sans la vérifier,
 * la plupart des tentatives échouent avec une 404.
 */

export interface CuratedVideo {
  id:        string;  // ID Pexels
  category:  string;
  label:     string;
  thumbnail: string;
  duration:  number;  // secondes (valeur réelle Pexels)
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

export const CURATED_VIDEOS: CuratedVideo[] = [
  // ── Mosquée & Islam ──────────────────────────────────────────────────
  { id: "6576070",  category: "mosque",  label: "Mosquée illuminée",      thumbnail: "https://images.pexels.com/videos/6576070/pexels-photo-6576070.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 18 },
  { id: "12959912", category: "mosque",  label: "Architecture sacrée",    thumbnail: "https://images.pexels.com/videos/12959912/pexels-photo-12959912.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 35 },
  { id: "7318023",  category: "mosque",  label: "Dôme et minaret",        thumbnail: "https://images.pexels.com/videos/7318023/pexels-photo-7318023.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 22 },
  { id: "20288879", category: "mosque",  label: "Mosquée de Songkhla",    thumbnail: "https://images.pexels.com/videos/20288879/central-mosque-songkhla-mosque-mosque-songkhla-mosque-thailand-20288879.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 34 },

  // ── Désert & Dunes ───────────────────────────────────────────────────
  { id: "856016",   category: "desert",  label: "Dunes de sable doré",    thumbnail: "https://images.pexels.com/videos/856016/free-video-856016.jpg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 30 },
  { id: "1192116",  category: "desert",  label: "Horizon désertique",     thumbnail: "https://images.pexels.com/videos/1192116/free-video-1192116.jpg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 66 },
  { id: "17833698", category: "desert",  label: "Dunes balayées par le vent", thumbnail: "https://images.pexels.com/videos/17833698/desert-dune-dunes-sand-dunes-17833698.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 10 },
  { id: "8865223",  category: "desert",  label: "Étendue désertique",     thumbnail: "https://images.pexels.com/videos/8865223/pexels-photo-8865223.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 16 },
  { id: "33170755", category: "desert",  label: "Ambiance désert sauvage", thumbnail: "https://images.pexels.com/videos/33170755/aesthetic-vibe-summer-american-wilderness-cinematic-video-clips-desert-vibe-33170755.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 21 },
  { id: "16905150", category: "desert",  label: "Dunes au lever du soleil", thumbnail: "https://images.pexels.com/videos/16905150/windy-sand-dunes-at-sunrise-16905150.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 21 },

  // ── Ciel étoilé ──────────────────────────────────────────────────────
  { id: "1448735",  category: "sky",     label: "Ciel nocturne",          thumbnail: "https://images.pexels.com/videos/1448735/free-video-1448735.jpg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 32 },
  { id: "12336972", category: "sky",     label: "Voûte étoilée",          thumbnail: "https://images.pexels.com/videos/12336972/pexels-photo-12336972.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 20 },
  { id: "12336940", category: "sky",     label: "Ciel constellé",         thumbnail: "https://images.pexels.com/videos/12336940/pexels-photo-12336940.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 21 },
  { id: "14369240", category: "sky",     label: "Nuit profonde",          thumbnail: "https://images.pexels.com/videos/14369240/abundance-abundant-adoration-adventure-14369240.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 14 },
  { id: "12336965", category: "sky",     label: "Étoiles scintillantes",  thumbnail: "https://images.pexels.com/videos/12336965/pexels-photo-12336965.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 21 },

  // ── Lever & Coucher de soleil ────────────────────────────────────────
  { id: "4812207",  category: "sunrise", label: "Coucher de soleil doré", thumbnail: "https://images.pexels.com/videos/4812207/air-child-dad-dress-4812207.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=630", duration: 9 },
  { id: "857251",   category: "sunrise", label: "Crépuscule montagnard",  thumbnail: "https://images.pexels.com/videos/857251/free-video-857251.jpg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 14 },
  { id: "4460096",  category: "sunrise", label: "Aube dorée",             thumbnail: "https://images.pexels.com/videos/4460096/pexels-photo-4460096.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 14 },
  { id: "5009153",  category: "sunrise", label: "Lever de soleil paisible", thumbnail: "https://images.pexels.com/videos/5009153/pexels-photo-5009153.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 47 },
  { id: "35473059", category: "sunrise", label: "Ciel embrasé",           thumbnail: "https://images.pexels.com/videos/35473059/pexels-photo-35473059.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 12 },
  { id: "5926176",  category: "sunrise", label: "Crépuscule nuageux",     thumbnail: "https://images.pexels.com/videos/5926176/autumn-mood-autumn-mood-forest-clouds-dark-sky-5926176.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 45 },

  // ── Mer & Eau ────────────────────────────────────────────────────────
  { id: "3126453",  category: "ocean",   label: "Océan nocturne",         thumbnail: "https://images.pexels.com/videos/3126453/free-video-3126453.jpg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 23 },
  { id: "3637949",  category: "ocean",   label: "Vagues douces",          thumbnail: "https://images.pexels.com/videos/3637949/free-video-3637949.jpg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 33 },
  { id: "5404691",  category: "ocean",   label: "Vagues sur le rivage",   thumbnail: "https://images.pexels.com/videos/5404691/beach-waves-breaking-waves-crashing-waves-ocean-5404691.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 43 },
  { id: "36301470", category: "ocean",   label: "Mer calme",              thumbnail: "https://images.pexels.com/videos/36301470/pexels-photo-36301470.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 15 },
  { id: "5921867",  category: "ocean",   label: "Étendue marine",         thumbnail: "https://images.pexels.com/videos/5921867/pexels-photo-5921867.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 25 },

  // ── Nature & Forêt ───────────────────────────────────────────────────
  { id: "13749770", category: "nature",  label: "Survol de forêt",        thumbnail: "https://images.pexels.com/videos/13749770/dji-drone-flying-forrest-13749770.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 36 },
  { id: "6564550",  category: "nature",  label: "Rayons à travers les arbres", thumbnail: "https://images.pexels.com/videos/6564550/pexels-photo-6564550.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 39 },
  { id: "11265968", category: "nature",  label: "Lumière filtrée",        thumbnail: "https://images.pexels.com/videos/11265968/lens-flare-slowmotion-sun-flare-11265968.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 10 },
  { id: "35659481", category: "nature",  label: "Forêt vue du ciel",      thumbnail: "https://images.pexels.com/videos/35659481/aerial-forest-cinematic-nature-drone-flight-drone-movement-35659481.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 12 },

  // ── Pluie & Nuages ───────────────────────────────────────────────────
  { id: "2499611",  category: "rain",    label: "Pluie sur fenêtre",      thumbnail: "https://images.pexels.com/videos/2499611/free-video-2499611.jpg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=630", duration: 22 },
  { id: "6252535",  category: "rain",    label: "Pluie apaisante",        thumbnail: "https://images.pexels.com/videos/6252535/pexels-photo-6252535.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 47 },
  { id: "15419572", category: "rain",    label: "Gouttes mystiques",      thumbnail: "https://images.pexels.com/videos/15419572/glass-mystical-rain-raindrops-15419572.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 30 },
  { id: "13292544", category: "rain",    label: "Gouttes en gros plan",   thumbnail: "https://images.pexels.com/videos/13292544/backgrouns-videos-close-up-drop-of-water-droplets-13292544.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 43 },
  { id: "8549580",  category: "rain",    label: "Ambiance cosy sous la pluie", thumbnail: "https://images.pexels.com/videos/8549580/coffee-cold-weather-cosy-cosy-home-8549580.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 38 },

  // ── Lumière & Bokeh ──────────────────────────────────────────────────
  { id: "10296170", category: "light",   label: "Particules dorées",      thumbnail: "https://images.pexels.com/videos/10296170/pexels-photo-10296170.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 20 },
  { id: "4173717",  category: "light",   label: "Bokeh lumineux",         thumbnail: "https://images.pexels.com/videos/4173717/pexels-photo-4173717.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 66 },
  { id: "34645258", category: "light",   label: "Lumières abstraites",    thumbnail: "https://images.pexels.com/videos/34645258/3d-abstract-art-award-34645258.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 20 },
  { id: "34645311", category: "light",   label: "Ambiance éthérée",       thumbnail: "https://images.pexels.com/videos/34645311/abstract-aesthetic-airy-ambient-34645311.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200", duration: 20 },
];
