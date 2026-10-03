# Cooldown Window Scheduler

Le scheduler traite JustPlay comme une horloge cyclique et utilise le temps mort pour ZBD.

## Priorités

1. Si JustPlay est READY, il devient prioritaire.
2. Sinon, le scheduler calcule la fenêtre restante avant JustPlay.
3. Il classe les activités ZBD selon :
   - sats/minute observés ou estimés ;
   - probabilité de complétion ;
   - durée estimée ;
   - interruptibilité ;
   - capacité à tenir dans la fenêtre restante.
4. Les jeux ZBD sont considérés interruptibles par défaut, les quests semi-interruptibles et les surveys non-interruptibles.
5. À l'approche de JustPlay, une activité interruptible peut être quittée ; une survey non-interruptible attend un point sûr.

## Automatisation

Le scheduler peut ouvrir automatiquement la meilleure cible disponible quand un lien sûr existe et éviter les bascules inutiles. Les actions qui doivent rester humaines — publicité récompensée, CAPTCHA, vérification ou autre contrôle — ne sont pas simulées.
