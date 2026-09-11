# Site en ligne 24h/24 (sans laisser ton PC allumé)

## Pourquoi le site s’éteint ?

Le serveur tourne **sur ton PC**.  
Éteindre / mettre en veille le PC = le site et le lien Cloudflare s’arrêtent.  
C’est normal : un PC éteint ne peut rien héberger.

## Solution : héberger en ligne (gratuit)

On utilise **Render** : le site reste accessible partout, même PC éteint.

### Étapes (environ 10 min)

1. Crée un compte sur https://render.com (avec GitHub ou email)
2. Mets le projet sur GitHub (ou demande-moi de t’aider à le pousser)
3. Sur Render : **New** → **Blueprint** → choisis le dépôt `alpha-quarante`
   - Ou **New** → **Web Service** → racine du projet
   - Build : `cd backend && npm install --omit=dev`
   - Start : `node backend/server.js`
4. Dans **Environment**, ajoute :
   - `EMAIL_USER` = `alphaquarante40@gmail.com`
   - `EMAIL_PASS` = ton mot de passe d’application Gmail (16 caractères)
   - `INVITE_LINK` = `https://alpha40.com/`
   - `NODE_ENV` = `production`
   - `HOST` = `0.0.0.0`
5. Clique **Deploy**

Tu obtiens une adresse du type :

`https://alpha-quarante-xxxx.onrender.com`

**C’est CE lien** à partager (téléphone + PC, partout, PC éteint).

### À savoir (plan gratuit Render)

- Le site peut “dormir” après ~15 min sans visite, puis se réveiller en ~30 s au prochain clic
- Les inscriptions sont stockées sur le serveur Render (fichier JSON)

Quand tu veux, dis-moi « mets le site sur Render / GitHub » et on le fait ensemble.
