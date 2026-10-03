# Game Rotation Manager

Le Game Rotation Manager applique un plafond dur de **500 sats par jeu** par défaut.

Il classe les jeux non plafonnés selon leur rendement réellement observé (sats/minute), affiche le gain cumulé et le budget restant, puis propose le prochain jeu lorsque le plafond est atteint.

Sur iPhone, `OUVRIR LE JEU` est un handoff vers l'application native lorsqu'un lien sûr existe. Les interactions dans le jeu et les publicités récompensées restent de vraies actions dans l'application. Le manager ne fournit aucune API `watch`, `click`, `simulate` ou contournement anti-bot.

Les sessions enregistrent uniquement le jeu, les timestamps et les sats gagnés. Elles alimentent le classement futur.
