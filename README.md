# NourQuran Studio 🌙

**Plateforme de création de vidéos de récitation coranique** — créez des vidéos professionnelles avec synchronisation karaoké mot-à-mot, prêtes pour YouTube, Shorts, Reels et TikTok.

---

## Stack technique

| Couche | Technologie |
|--------|------------|
| Framework | Next.js 14 (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui (thème sombre, accents dorés) |
| Rendu vidéo | Remotion 4 (`@remotion/player` + `@remotion/renderer`) |
| État éditeur | Zustand |
| Base de données | SQLite + Prisma 5 |
| Traitement vidéo | FFmpeg (serveur) |

---

## Variables d'environnement

Copier `.env.local` et remplir les valeurs :

| Variable | Description | Requis |
|----------|-------------|--------|
| `DATABASE_URL` | Chemin SQLite (`file:./prisma/dev.db`) | ✅ |
| `PEXELS_API_KEY` | Clé API Pexels pour les fonds vidéo ([pexels.com/api](https://www.pexels.com/api/)) | ✅ |
| `QURAN_API_BASE` | Base URL Quran.com v4 | optionnel |
| `BACKGROUND_CACHE_DIR` | Dossier cache local pour les fonds | optionnel |
| `RENDER_OUTPUT_DIR` | Dossier de sortie des MP4 | optionnel |

---

## Démarrage rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement (remplir PEXELS_API_KEY dans .env.local)

# 3. Générer le client Prisma et créer la base
npx prisma generate
npx prisma db push

# 4. Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

---

## Sources de données

### Quran.com API v4
- **Texte** : `GET /chapters/{id}/verses` (texte Uthmani)
- **Traductions** : `GET /verses/by_chapter/{id}?translations=136,131` (136 = Hamidullah FR, 131 = Saheeh EN)
- **Segments audio (timestamps)** : `GET /recitations/{recitation_id}/by_chapter/{chapter_id}` → champ `word_segments`
- **Audio MP3** : `https://verses.quran.com/{reciter_folder}/{padded_surah}{padded_verse}.mp3`
- **Fallback** : everyayah.com `https://everyayah.com/data/{reciter_folder}/{padded_surah}{padded_verse}.mp3`

### Récitateurs intégrés

| Nom | ID Quran.com | Dossier audio |
|-----|-------------|---------------|
| Mishary Alafasy | 7 | `Alafasy_128kbps` |
| Abdul Basit | 1 | `AbdulBaset_64kbps` |
| Sudais | 6 | `Abdurrahmaan_As-Sudais_192kbps` |
| Shuraim | 11 | `Shuraym_64kbps` |
| Maher Al-Muaiqly | 10 | `Maher_AlMuaiqly_128kbps` |
| Yasser Al-Dosari ⭐ | 137 | `Yasser_Ad-Dussary_128kbps` |
| Muhammad Al-Luhaidan ⭐ | 140 | `Muhammad_Luhaidan_64kbps` |

*⭐ Récitateurs prioritaires*

---

## Architecture du projet

```
nourquran-studio/
├── src/
│   ├── app/                    # Routes Next.js App Router
│   │   ├── page.tsx            # Page d'accueil / liste projets
│   │   ├── studio/page.tsx     # Éditeur principal
│   │   └── api/                # Routes API (rendu, projets, Pexels...)
│   ├── components/
│   │   ├── ui/                 # Composants shadcn/ui
│   │   ├── editor/             # Composants de l'éditeur (panneaux, contrôles)
│   │   └── remotion/           # Wrappers React pour le Player Remotion
│   ├── lib/
│   │   ├── quran/              # Client API Quran.com + parseurs
│   │   ├── pexels/             # Client API Pexels
│   │   ├── prisma.ts           # Singleton Prisma
│   │   └── utils.ts            # Utilitaires
│   ├── store/
│   │   └── editorStore.ts      # État Zustand de l'éditeur
│   └── types/
│       └── quran.ts            # Types TypeScript
├── remotion/
│   ├── Root.tsx                # Enregistrement des compositions
│   ├── index.ts                # Point d'entrée Remotion
│   ├── compositions/
│   │   └── QuranVideoComposition.tsx
│   └── components/
│       ├── Background.tsx      # Fond vidéo/image avec Ken Burns
│       ├── VerseDisplay.tsx    # Affichage d'un verset
│       ├── KaraokeText.tsx     # Surbrillance mot-à-mot
│       ├── Watermark.tsx       # Logo/watermark
│       └── IntroOutro.tsx      # Séquences intro/outro
├── prisma/
│   ├── schema.prisma           # Schéma SQLite
│   └── dev.db                  # Base SQLite (gitignorée)
└── public/
    ├── fonts/                  # Polices arabes (Uthmanic, Amiri...)
    └── backgrounds/            # Cache local des fonds Pexels
```

---

## Plan de développement

- [x] **Étape 1** — Initialisation (Next.js + Tailwind + shadcn + Prisma + Remotion)
- [ ] **Étape 2** — Couche `/lib` : client Quran.com + Pexels
- [ ] **Étape 3** — Composition Remotion de base (verset + audio)
- [ ] **Étape 4** — Surbrillance karaoké mot-à-mot
- [ ] **Étape 5** — UI éditeur (Zustand + Player)
- [ ] **Étape 6** — Branding, ambiance, intro/outro, effets
- [ ] **Étape 7** — Rendu serveur + export MP4
- [ ] **Étape 8** — Sauvegarde projets (Prisma)
- [ ] **Étape 9** — Polissage, responsive, i18n

---

## Licence

Projet privé — NourQuran Studio © 2025
