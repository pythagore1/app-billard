# Ruach Billard — Guide de déploiement (Cloudflare Pages)

## Structure du projet

```
ruach-billard/
├── index.html          ← Application principale (PWA)
├── sw.js               ← Service Worker (cache & offline)
├── manifest.json       ← Manifest PWA
├── _headers            ← Headers HTTP Cloudflare Pages
├── _redirects          ← Redirections SPA Cloudflare Pages
└── icons/
    ├── icon-72.png
    ├── icon-96.png
    ├── icon-128.png
    ├── icon-144.png
    ├── icon-152.png
    ├── icon-192.png    ← Principale (Android, iOS)
    ├── icon-384.png
    ├── icon-512.png    ← Splash screen
    └── screenshot-mobile.png
```

---

## 🚀 Déploiement sur Cloudflare Pages (RECOMMANDÉ)

### Première fois

1. Créez un compte sur [cloudflare.com](https://cloudflare.com) (gratuit)

2. Dans le **Dashboard Cloudflare** → **Workers & Pages** → **Create application** → **Pages**

3. Connectez votre **dépôt GitHub** ou uploadez directement :
   - **Via GitHub** (recommandé) : connectez votre repo → Cloudflare redéploie automatiquement à chaque push
   - **Upload direct** : glissez le dossier entier dans l'interface

4. Configuration du build :
   - Framework preset : **None**
   - Build command : **(laisser vide)**
   - Build output directory : `/` ou **(laisser vide)**

5. Votre site est en ligne sur `https://ruach-billard.pages.dev`

> ✅ Cloudflare Pages est **gratuit** et inclut :
> - CDN mondial (ultra-rapide en Afrique avec des PoP à Nairobi, Lagos, etc.)
> - HTTPS automatique
> - Déploiements illimités
> - Bande passante illimitée

### Mises à jour

Modifiez vos fichiers → pushes sur GitHub → Cloudflare redéploie en ~30 secondes.

---

## 🖼️ Héberger les images sur Cloudflare Images

Cloudflare Images vous donne un CDN d'images avec redimensionnement automatique pour **5$/mois** (100 000 images stockées, livraisons illimitées).

### Étape 1 — Activer Cloudflare Images

1. Dans le Dashboard → **Images** (dans la colonne gauche)
2. Cliquez **Get started** → entrez vos infos de paiement (5$/mois)
3. Notez votre **Account Hash** (format `abc123def456`)

### Étape 2 — Uploader une image produit

**Via l'interface web :**
1. Dashboard → **Images** → **Upload**
2. Choisissez votre photo produit
3. Copiez l'**Image ID** généré (ex: `a1b2c3d4-e5f6-...`)

**Via l'API (pour automatiser) :**
```bash
curl -X POST https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/images/v1 \
  -H "Authorization: Bearer {API_TOKEN}" \
  -F file=@photo-produit.jpg
```

### Étape 3 — Créer des variants d'image

Dans **Images → Variants**, créez ces 2 variants :

| Nom | Largeur | Hauteur | Ajustement |
|-----|---------|---------|------------|
| `card` | 600 | 600 | Cover (recadrage) |
| `public` | 1200 | 1200 | Scale down |

> ⚠️ Le variant `public` existe déjà par défaut (original), assurez-vous qu'il est activé.

### Étape 4 — Former l'URL Cloudflare Images

```
https://imagedelivery.net/{ACCOUNT_HASH}/{IMAGE_ID}/{VARIANT}
```

Exemples :
```
https://imagedelivery.net/abc123def456/a1b2c3d4-e5f6-7890/card
https://imagedelivery.net/abc123def456/a1b2c3d4-e5f6-7890/public
```

### Étape 5 — Coller l'URL dans l'admin

1. Ouvrez votre site → **Admin** → **Ajouter/Modifier un produit**
2. Dans la variante, collez l'URL Cloudflare Images dans le champ **"URL image"**
3. La PWA détecte automatiquement les URLs `imagedelivery.net` et applique :
   - **`card`** (600×600) pour les miniatures dans la grille
   - **`public`** (original) pour les images en plein écran dans la modale

---

## Comment mettre à jour les produits

### Étape 1 — Exporter depuis l'admin

1. Ouvrez votre site → cliquez **Admin** → connectez-vous
2. **Paramètres** → **"Exporter les données (JSON)"**
3. Un fichier `ruach-billard-data.json` est téléchargé

### Étape 2 — Mettre à jour index.html

Ouvrez `index.html` dans un éditeur (VS Code, Notepad++)

Cherchez (environ ligne 660) :
```
var DEF_PRODUCTS=[
```

Remplacez le contenu de `DEF_PRODUCTS` et `DEF_CONTACTS` par les valeurs du JSON exporté.

### Étape 3 — Incrémenter la version SW

Dans `sw.js`, ligne 3 :
```javascript
const CACHE_VERSION = 'v2';  // ← incrémentez à chaque déploiement
```

### Étape 4 — Déployer sur Cloudflare

Pushez sur GitHub → Cloudflare redéploie automatiquement.

---

## Optimisations performances incluses

| Optimisation | Détail |
|---|---|
| **Lazy loading images** | Intersection Observer (charge les images 200px avant qu'elles apparaissent) |
| **Cloudflare Images** | CDN mondial, variants auto (card/public), format WebP automatique |
| **Service Worker** | Cache-first pour images, Network-first pour HTML |
| **Font preload** | Polices Google chargées en non-bloquant (`preload + onload`) |
| **decoding="async"** | Décodage des images en arrière-plan |
| **Cloudflare CDN** | PoP (points de présence) en Afrique centrale |
| **HTTP Headers** | Cache longue durée pour assets statiques |

---

## Vider le cache (en cas de problème)

### Forcer la mise à jour du SW
Dans `sw.js`, incrémentez `CACHE_VERSION` → déployez → tous les visiteurs reçoivent une barre de notification pour mettre à jour.

### Sur Chrome PC
- `Ctrl+Shift+R` = rechargement forcé
- `F12` → Application → Service Workers → Unregister → Storage → Clear site data

### Sur mobile Android
- Menu ⋮ → Paramètres → Confidentialité → Effacer données de navigation

---

## URLs utiles

- Cloudflare Pages : https://dash.cloudflare.com → Workers & Pages
- Cloudflare Images : https://dash.cloudflare.com → Images
- Documentation Images : https://developers.cloudflare.com/images/
