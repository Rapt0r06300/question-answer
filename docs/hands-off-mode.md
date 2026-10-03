# Hands-off mode

Hands-off mode lance périodiquement l'optimizer, reprend après un retour de navigation ou une remise au premier plan, et évite les exécutions concurrentes.

Le démarrage est idempotent. STOP invalide immédiatement la génération courante et annule le prochain timer. Un ancien callback ne peut donc pas reprendre la boucle après l'arrêt.

Les interactions protégées qui exigent réellement l'utilisateur (vérification, CAPTCHA, interaction publicitaire récompensée ou contrôle natif iOS inaccessible au runtime) restent en attente utilisateur. Le mode hands-off ne simule ni présence, ni visionnage, ni impression publicitaire.
