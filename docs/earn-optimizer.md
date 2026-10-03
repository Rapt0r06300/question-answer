# Earn Optimizer

Earn Optimizer compare les opportunités avec des données locales réelles.

Pour un sondage, il estime `rewardSats × probabilitéDeComplétion / minutes`. La probabilité utilise l'historique local avec décroissance temporelle et un prior conservateur.

Pour un jeu ou une quest, il utilise les sessions enregistrées : sats réellement gagnés / minutes actives. Une publicité récompensée est toujours une action humaine dans l'application native ; Question Answer peut ouvrir l'app si un lien sûr existe mais ne regarde, ne clique et ne simule jamais la publicité.

Les résultats de screenout servent uniquement aux statistiques et ne modifient jamais le profil.
