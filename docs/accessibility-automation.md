# Accessibility Automation Coordinator

Le coordinateur choisit le meilleur mécanisme d'assistance disponible selon le contexte.

Profils:
- JustPlay: scan rapide et retour de publicité.
- ZBD survey: formulaire non préempté.
- ZBD game: activité interruptible.
- Generic: fallback prudent.

Ordre de fallback: élément accessible nommé, Voice Control avec numéros, Switch Control item scanning, puis grille Voice Control. Les CTA commerciaux restent bloqués et l'absence de candidat fiable provoque une attente plutôt qu'une action aléatoire.

Le coordinateur comprend un kill-switch logiciel et génère un plan de configuration iPhone pour Voice Control, Switch Control, Vocal Shortcuts et Accessibility Shortcut.

Important: le userscript ne peut pas activer silencieusement les réglages d'accessibilité système ni injecter des taps dans une autre app. Le module coordonne les capacités réellement disponibles et ne contourne pas les protections iOS ou antifraude.
