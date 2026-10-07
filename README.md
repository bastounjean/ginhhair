# GI N' HAIR · site du barber club

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/bastounjean/ginhhair)

Site en français pour le barber club étudiant (Anton, Gatien, Baptiste).

## Pages

| URL | Contenu |
|---|---|
| `/` | Accueil : présentation rigolote, défilé de polaroids, explications, lien vers le jeu |
| `/equipe` | Les trois barbers : faux diplômes, bio, stats, mur de polaroids cliquables (visionneuse) |
| `/rdv` | Planning de la semaine, une couleur par barber (filtrable). Le client clique un créneau **ou propose son propre horaire** |
| `/espace` | Inscription / connexion par email, « Mon planning » (RDV à venir + historique, annulation), **tondeuse de fidélité** qui se remplit (10 visites = 1 coupe offerte) |
| `/jeu` | Tond'Clicker : on clique sur le crâne, on achète du matos, on embauche Anton/Gatien/Baptiste |
| `/barber` | Espace barbers (lien en pied de page) : publier des dispos, accepter/refuser les demandes, marquer « Venu ✓ » (remplit la tondeuse du client), journal des emails |

## Emails envoyés automatiquement
- au client : bienvenue, RDV **accepté**, RDV **refusé** (avec le petit mot du barber), tondeuse pleine
- au barber : nouvelle demande (à tous les barbers si le client a choisi « peu importe »), annulation

Sans service mail configuré (Brevo ou SMTP), les emails ne partent pas : ils sont affichés dans la console et dans l'espace barbers (« Derniers emails envoyés »).

## Technique
Node.js ≥ 20 + Express, base SQLite via `@libsql/client` : en local un simple fichier (`data/barber.db`), en ligne une base **Turso** gratuite (SQLite hébergé). Emails via l'API Brevo ou n'importe quel SMTP. HTML/CSS/JS sans framework.

```bash
npm install
npm start          # http://localhost:3000
```

Au premier lancement, les trois comptes barbers sont créés. Par défaut :
`anton@ginhair.local / anton-tondeuse`, `gatien@…/gatien-tondeuse`, `baptiste@…/baptiste-tondeuse`.
**En production, définir les variables ci-dessous AVANT le premier lancement.**

## Mise en ligne 100 % gratuite (Render + Turso + Brevo)

| Service | Rôle | Offre gratuite |
|---|---|---|
| GitHub | héberge le code | gratuit |
| Render | fait tourner le site, adresse `https://ginhair.onrender.com` | gratuit, mais le site **s'endort après 15 min sans visite** : la première visite suivante met ~1 min à charger |
| Turso | base de données (comptes, créneaux, RDV) | gratuit (largement suffisant) |
| Brevo | envoi des mails | 300 mails/jour gratuits |

1. **GitHub** : le code est sur https://github.com/bastounjean/ginhhair.
2. **Turso** (turso.tech) : créer un compte, une base `ginhair`, puis récupérer son **URL** (`libsql://ginhair-xxx.turso.io`) et créer un **token**.
3. **Brevo** (brevo.com) : créer un compte, valider l'adresse d'expéditeur (ex. le Gmail du barber club) dans « Expéditeurs », puis créer une **clé API** (SMTP & API → Clés API).
4. **Render** : cliquer sur le bouton « Deploy to Render » en haut de cette page (ou « New » → « Blueprint » → choisir le dépôt). Le fichier `render.yaml` est lu automatiquement ; remplir les valeurs demandées :
   - `DATABASE_URL`, `DATABASE_TOKEN` (Turso)
   - `BREVO_API_KEY`, `MAIL_FROM_EMAIL` (l'adresse validée chez Brevo)
   - `BARBER_ANTON_EMAIL` / `BARBER_ANTON_PASSWORD`, idem `GATIEN` et `BAPTISTE`
5. Le site est en ligne. Chaque modification poussée sur GitHub le redéploie.

Astuce anti-sommeil (facultatif) : un moniteur gratuit UptimeRobot qui visite le site toutes les 10 min l'empêche de s'endormir.

Un nom de domaine (`ginhair.fr`) reste payant (~10 €/an) mais n'est pas obligatoire.

## Variables d'environnement

| Variable | Rôle |
|---|---|
| `DATABASE_URL`, `DATABASE_TOKEN` | Base Turso. Sans elles : fichier local `data/barber.db` |
| `BREVO_API_KEY`, `MAIL_FROM_EMAIL`, `MAIL_FROM_NAME` | Envoi via Brevo |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE` | Alternative : envoi par SMTP (Gmail, etc.) |
| `BARBER_<NOM>_EMAIL`, `BARBER_<NOM>_PASSWORD` | Comptes barbers, lus **au premier démarrage** |
| `SITE_URL` | Adresse publique pour les liens dans les mails (détectée automatiquement sur Render) |
| `TZ` | Fuseau du planning (Europe/Paris par défaut) |

## Ajouter des photos
Déposer les images dans `public/img/` puis les ajouter dans `TEAM` en haut de `public/js/common.js` (nom du fichier + légende). Les textes de présentation sont au même endroit.
