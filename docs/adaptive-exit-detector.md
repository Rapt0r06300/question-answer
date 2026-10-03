# Adaptive Exit Detector

Le détecteur réduit les erreurs lors du retour depuis une publicité réellement affichée.

Il combine le libellé de sortie (X, Close, Done, Skip), la position proche d'un bord, une petite taille, le caractère interactif et une temporisation minimale. Les CTA commerciaux comme Install, Get, Open, Buy, Learn More et App Store sont rejetés.

Un candidat n'est accepté qu'au-dessus d'un seuil de confiance élevé. Deux candidats trop proches rendent le résultat ambigu. Le contrôleur utilise retry/backoff puis rend la main si aucune sortie fiable n'est trouvée.

Le bridge d'accessibilité produit uniquement des indications pour Voice Control ou Switch Control. Il ne contourne pas les protections antifraude et ne génère aucune impression publicitaire.
