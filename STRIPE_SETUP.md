# Intégration Stripe — Guide de mise en route

Ce guide explique comment brancher l'intégration Stripe qui a été ajoutée au site
`fuzionpilot.com`. Tout est déjà codé — il reste **3 étapes** avant que ça fonctionne :

1. Créer les produits / prix dans Stripe (mode Test)
2. Configurer les variables d'environnement sur Vercel
3. Configurer le webhook Stripe

---

## 1 — Créer les produits dans Stripe (mode Test)

Connecte-toi sur <https://dashboard.stripe.com> et **bascule en mode Test**.

> Dans la nouvelle UI Stripe, le mode Test s'active via le menu du compte en haut
> à gauche (clique sur **"Fuzionpilot"** → **Sandboxes**). Ou vas-y directement :
> <https://dashboard.stripe.com/test/apikeys>

### 1a — Créer le produit Pro

Dashboard → **Catalogue de produits** → **+ Ajouter un produit**

- Nom : `Fuzion Pilot Pro`
- Description : `Pour les agences en croissance — 10 modèles, équipe illimitée, outreach complet.`
- Ajouter **deux prix** sur ce même produit :
  - **39 €** / récurrent / mensuel → note le `price_id` (ex : `price_1Qxx...`)
  - **348 €** / récurrent / annuel (= 29 € × 12) → note le `price_id`

### 1b — Créer le produit Enterprise

Pareil avec :
- Nom : `Fuzion Pilot Enterprise`
- Deux prix :
  - **149 €** / mensuel → note le `price_id`
  - **1428 €** / annuel (= 119 € × 12) → note le `price_id`

### 1c — Reporter les 4 Price IDs dans `checkout.html`

Ouvre `checkout.html`, trouve la constante `PLANS` (ligne ~250) et remplace les
placeholders `price_PRO_MONTHLY_ID`, etc. par les vrais IDs :

```js
const PLANS = {
  pro: {
    monthly: { price: 39,  priceId: 'price_1Qxx...VRAI_ID_ICI' },
    annual:  { price: 29,  priceId: 'price_1Qxx...VRAI_ID_ICI' },
    ...
  },
  enterprise: {
    monthly: { price: 149, priceId: 'price_1Qxx...VRAI_ID_ICI' },
    annual:  { price: 119, priceId: 'price_1Qxx...VRAI_ID_ICI' },
    ...
  }
};
```

---

## 2 — Configurer les variables d'environnement sur Vercel

### 2a — Récupérer tes clés Stripe (mode Test)

<https://dashboard.stripe.com/test/apikeys>

- **Publishable key** : commence par `pk_test_...` → va dans le frontend
- **Secret key** : commence par `sk_test_...` → va dans Vercel (SURTOUT PAS dans le frontend)

### 2b — Mettre la publishable key dans `checkout.html`

Dans `checkout.html`, remplace `pk_test_YOUR_PUBLISHABLE_KEY_HERE` par ta vraie
clé `pk_test_...` (ligne ~240).

```js
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51...'; // ta clé ici
```

> C'est une clé publique conçue pour être visible dans le frontend — aucun risque.

### 2c — Mettre la secret key et le webhook secret dans Vercel

Sur Vercel, ouvre ton projet `fuzion-pilot-site` → **Settings** → **Environment Variables**
et ajoute :

| Name                      | Value                       | Environment           |
|---------------------------|-----------------------------|-----------------------|
| `STRIPE_SECRET_KEY`       | `sk_test_...` (ta secret)   | Production, Preview   |
| `STRIPE_WEBHOOK_SECRET`   | `whsec_...` (étape 3)       | Production, Preview   |

Redéploie ensuite : **Deployments** → bouton `...` sur le dernier → **Redeploy**.

---

## 3 — Configurer le webhook Stripe

Le webhook permet à Stripe de notifier ton site quand un paiement réussit ou échoue.

### 3a — Créer le webhook dans Stripe

<https://dashboard.stripe.com/test/webhooks> → **+ Ajouter un endpoint**

- URL du endpoint : `https://fuzionpilot.com/api/webhook`
- Événements à écouter (minimum) :
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

Une fois créé, Stripe te donne un **Signing secret** (format `whsec_...`).
Copie-le et colle-le dans la variable Vercel `STRIPE_WEBHOOK_SECRET` (étape 2c).

### 3b — Vérifier que le webhook fonctionne

Dashboard Stripe → page du webhook → **Envoyer un événement test** →
choisis `invoice.payment_succeeded` → **Envoyer**.

Dans Vercel → **Logs** de la fonction `/api/webhook`, tu dois voir
`[webhook] invoice.payment_succeeded ...`. Si oui, le webhook fonctionne.

---

## 4 — Tester le flow complet (mode Test)

1. Va sur <https://fuzionpilot.com/pricing.html>
2. Clique sur **Choisir Pro**
3. Remplis le formulaire `checkout.html` avec :
   - Nom / email : n'importe quoi
   - **Carte de test Stripe** : `4242 4242 4242 4242`
   - Date : n'importe quelle date future (ex : `12 / 34`)
   - CVC : n'importe lequel (ex : `123`)
   - Code postal : n'importe lequel (ex : `75000`)
4. Le paiement doit passer, tu dois arriver sur `success.html`
5. Dans Stripe → **Payments**, tu dois voir le paiement test

Autres cartes de test utiles :
- `4000 0000 0000 9995` : carte refusée (fonds insuffisants)
- `4000 0027 6000 3184` : demande 3DS / Strong Customer Authentication

Liste complète : <https://docs.stripe.com/testing#cards>

---

## 5 — Passage en production (plus tard)

Quand ton compte Stripe est validé et que tu es prêt à encaisser vraiment :

1. Refais l'étape 1 (créer les produits) **en mode Live** cette fois
2. Remplace `pk_test_...` par `pk_live_...` dans `checkout.html`
3. Remplace `sk_test_...` par `sk_live_...` dans les env vars Vercel
4. Recrée un webhook en mode Live avec son propre `whsec_...`
5. Redéploie

---

## Architecture — qu'est-ce qui a été créé ?

```
fuzion-pilot-site/
├── api/
│   ├── create-subscription.js   # POST — crée Customer + Subscription incomplete,
│   │                              renvoie clientSecret pour Stripe Elements
│   └── webhook.js               # POST — reçoit les événements Stripe (signés)
├── checkout.html                # Page de paiement avec Stripe Elements (custom form)
├── success.html                 # Page de confirmation après paiement réussi
├── cancel.html                  # Page si l'utilisateur annule
├── pricing.html                 # (mise à jour) boutons redirigent vers checkout.html
├── package.json                 # (nouveau) dépendance `stripe`
├── .env.example                 # template des variables d'env
├── .gitignore                   # (nouveau) exclut .env, node_modules, .vercel, etc.
└── STRIPE_SETUP.md              # ce guide
```

### Flow d'un paiement

```
pricing.html (bouton "Choisir Pro")
        ↓
checkout.html (formulaire Stripe Elements + carte)
        ↓  POST /api/create-subscription { priceId, email, name }
api/create-subscription.js
  ├─ stripe.customers.create(...)
  ├─ stripe.subscriptions.create({ payment_behavior: 'default_incomplete' })
  └─ renvoie { clientSecret } du PaymentIntent
        ↓
checkout.html : stripe.confirmCardPayment(clientSecret, { card, billing_details })
        ↓  (Stripe charge la carte côté Stripe)
success.html
        ↓
Stripe envoie les webhooks → api/webhook.js
  ├─ invoice.payment_succeeded      → TODO : créer le compte agence dans Fuzion Pilot
  ├─ customer.subscription.created  → logging
  └─ invoice.payment_failed         → TODO : notifier l'user
```

---

## TODO — intégration avec l'app Fuzion Pilot (prochaine session)

Dans `api/webhook.js`, l'événement `invoice.payment_succeeded` contient tout ce qu'il
faut (customer.email, subscription.metadata.plan, etc.) pour :

1. Appeler l'API Fuzion Pilot (`lcx-agency.onrender.com`) et créer un compte agence
2. Envoyer un email de bienvenue avec un lien d'activation / mot de passe temporaire
3. Lier l'ID Stripe customer au compte agence pour la gestion des abonnements

Ce TODO est marqué dans le code avec `// TODO:`.

---

## Problèmes courants

- **"Stripe is not defined"** → vérifie que `<script src="https://js.stripe.com/v3/"></script>` est bien dans `checkout.html` (il y est déjà)
- **CORS error** → normal si tu testes en local avec `file://`. Utilise `vercel dev` en local ou teste directement sur fuzionpilot.com
- **Webhook signature verification failed** → tu as oublié de mettre le bon `STRIPE_WEBHOOK_SECRET` dans Vercel
- **PaymentIntent status "requires_action"** → carte qui demande 3DS ; `stripe.confirmCardPayment` gère ça automatiquement normalement
