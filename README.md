# Next.js Dashboard

Application Next.js construite avec l'App Router pour gerer un petit tableau de bord de facturation.

Le projet permet notamment de :

- afficher un dashboard avec des indicateurs de facturation
- se connecter et s'inscrire avec `NextAuth`
- consulter la liste des factures
- rechercher et paginer les factures
- creer, modifier et supprimer des factures
- utiliser une base PostgreSQL pour les utilisateurs, clients, factures et revenus

## Stack

- `Next.js`
- `React`
- `TypeScript`
- `Tailwind CSS`
- `NextAuth`
- `PostgreSQL`
- `pnpm`

## Lancer le projet en local

### 1. Cloner le depot

```bash
git clone <url-du-repo>
cd nextjs-dashboard
```

### 2. Installer les dependances

```bash
pnpm install
```

### 3. Configurer les variables d'environnement

Copiez le fichier d'exemple :

```bash
cp .env.example .env
```

Puis renseignez au minimum les variables necessaires, en particulier :

- `POSTGRES_URL`
- `AUTH_SECRET`

Le projet utilise PostgreSQL, il faut donc disposer d'une base accessible localement ou a distance.

### 4. Initialiser la base de donnees

Une route de seed est disponible pour creer les tables et injecter des donnees de demo.

Apres avoir lance le projet, ouvrez :

```txt
http://localhost:3000/seed
```

### 5. Demarrer le serveur de developpement

```bash
pnpm dev
```

Ensuite, ouvrez l'application dans votre navigateur :

```txt
http://localhost:3000
```

## Scripts utiles

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
```
