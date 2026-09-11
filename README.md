# Alpha Quarante

Site d'inscription pour l'événement annuel — design rouge soie & or champagne.

## Démarrage rapide

```bash
cd backend
npm install
copy .env.example .env   # puis remplir EMAIL_USER, EMAIL_PASS, EVENT_LINK
npm start
```

Ouvre **http://localhost:3000**

Sous Windows, tu peux aussi double-cliquer `DEMARRER_SERVEUR.bat`.

## Pages

| URL | Rôle |
|-----|------|
| `/` | Accueil (compte à rebours, infos, FAQ) |
| `/inscription.html` | Formulaire en 3 étapes |
| `/confirmation.html` | Merci + confettis |

## Flux inscription

1. Le formulaire envoie `POST /api/register`
2. Le serveur enregistre dans `backend/db/inscriptions.json`
3. Nodemailer envoie l'email avec `EVENT_LINK`
4. Redirection vers la page de confirmation

## Email (Gmail)

1. Active la validation en 2 étapes Google
2. Crée un [mot de passe d'application](https://myaccount.google.com/apppasswords)
3. Dans `.env` :

```
EMAIL_USER=ton.email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
EVENT_LINK=https://ton-lien-zoom-ou-meet
```

Sans credentials email, l'inscription est quand même enregistrée (l'envoi est ignoré avec un warning).

## Hébergement

- **Tout-en-un** : déploie le dossier `backend` (Render, Railway, Fly.io) — Express sert déjà le `frontend/`
- **Séparé** : frontend sur Netlify/Vercel, backend ailleurs — définis `FRONTEND_URL` pour le CORS

## Stack

HTML / CSS / JS · Express · Nodemailer · JSON storage
