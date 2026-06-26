# 📱 Guide d'obtention de l'APK & Déploiement Web - Pilotage Soutien

Ce guide vous explique étape par étape comment déployer votre application sur le web et générer votre fichier **APK** pour l'installer directement sur votre téléphone Android.

---

## 🚀 1. Déploiement Web (Instantané)

L'application web est entièrement prête et configurée pour être déployée sur le cloud.

### Étape de déploiement :
1. Dans l'interface de **Google AI Studio** (en haut à droite de votre écran), cliquez sur le bouton **Partager / Share** ou **Déployer / Deploy**.
2. Suivez les instructions rapides pour déployer l'application sur **Cloud Run**.
3. Vous obtiendrez un lien public sécurisé (`https://...`) accessible depuis n'importe quel navigateur (ordinateur, tablette ou smartphone).

---

## 🤖 2. Génération de l'APK Android (Mobile)

Pour transformer cette application web en une application Android native (.apk), nous avons configuré et intégré **Capacitor** (par Ionic) dans votre projet. Le projet Android natif a été entièrement créé et synchronisé.

Puisque la compilation finale en APK nécessite le SDK Android et Java (qui ne peuvent pas fonctionner dans ce conteneur de développement cloud léger), vous pouvez générer l'APK très facilement en local sur votre ordinateur en suivant ces étapes :

### Étape 1 : Télécharger votre projet
1. Dans le menu de configuration de Google AI Studio (ou via les options d'exportation), choisissez **Exporter le projet** ou téléchargez le projet sous forme de fichier **ZIP**.
2. Extrayez le fichier ZIP dans un dossier sur votre ordinateur.

### Étape 2 : Prérequis sur votre ordinateur
Assurez-vous d'avoir les éléments suivants installés (gratuits) :
- [Node.js](https://nodejs.org/) (version 18 ou supérieure)
- [Android Studio](https://developer.android.com/studio) (pour compiler l'APK facilement)

### Étape 3 : Installer et synchroniser (dans le terminal de votre dossier extrait)
Ouvrez votre terminal ou invite de commande dans le dossier de votre projet extrait, puis exécutez :
```bash
# 1. Installez les dépendances du projet
npm install

# 2. Compilez le code de l'application web
npm run build

# 3. Synchronisez les fichiers compilés avec le dossier Android
npx cap copy android
```

### Étape 4 : Compiler l'APK avec Android Studio
1. Ouvrez **Android Studio**.
2. Choisissez **Open an Existing Project** (Ouvrir un projet existant).
3. Sélectionnez le dossier nommé **`android`** situé à la racine de votre projet extrait.
4. Laissez Android Studio télécharger les outils nécessaires (Gradle) pendant quelques instants.
5. Dans le menu du haut d'Android Studio, cliquez sur :
   👉 **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
6. Une fois la compilation terminée, une notification apparaîtra en bas à droite avec un lien **"locate"** (localiser). Cliquez dessus pour ouvrir le dossier contenant votre fichier **`app-debug.apk`** !

---

## 📲 3. Installer l'APK sur votre téléphone

1. Transférez le fichier **`app-debug.apk`** sur votre smartphone (par email, Google Drive, WhatsApp ou câble USB).
2. Sur votre téléphone, ouvrez le fichier `.apk` pour l'installer.
3. *Note : Si votre téléphone affiche une alerte concernant les "sources inconnues" (Play Protect), c'est tout à fait normal pour les applications développées par vous-même que vous installez manuellement. Cliquez sur **Installer quand même** ou **Autoriser cette source**.*

Félicitations ! Votre application "Pilotage Soutien" est maintenant installée sur votre smartphone ! 🎉
