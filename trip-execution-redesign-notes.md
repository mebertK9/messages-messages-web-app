# Trip-Ausführung: Diskussionsstand (Planungssitzung)

## Verlauf der Diskussion (kurz)

Gestartet als Review der bestehenden `ActiveTripPage`: stale Client-State beim
Abschließen eines Stops, verwaiste Wünsche an bereits fertigen Stops, fehlender
Zurück-Button. Auf Wunsch komplett neu aufgerollt ("grüne Wiese" ab dem Moment
von "Los geht's"), Backend zunächst als fix gesetzt. Beim Durchgehen der
Kernregeln (Stop abschließen / auslassen / Trip beenden) kam die Idee eines
"Last-Minute-Fensters" zwischen Trip-Start und erstem Stop auf - dabei stellte
sich heraus, dass das Backend gar kein "Stop gestartet"-Konzept kennt (Stops
sind ab `POST /trips` alle gleichzeitig `active`). Das führte zur eigentlichen
Grundsatzfrage: Die automatische Zuordnung neuer Wünsche zu laufenden Trips
(serverseitig in `POST /wishes` eingebaut) erzeugt genau die Hektik, die die
App eigentlich beseitigen soll. Entscheidung: dieses Verhalten wird
abgeschaltet, "keine Backend-Änderung" wird dafür bewusst aufgeweicht. Direkt
im Anschluss kam eine neue, gegenläufige Idee auf: die Einkäuferin soll
jederzeit freiwillig einen offenen Wunsch vom Dashboard aus in einen laufenden
Stop ziehen können - dafür existiert bereits ein ungenutzter Endpunkt. Diese
Idee ist unentschieden und Gegenstand von Punkt 3/4 dieser Datei.

## Endpunkte, die infrage gestellt sind

- **`POST /trips/{tripId}/stops/{stopId}/wishes`** (manuelle Zuordnung eines
  offenen Wunsches zu einem Stop). Bisher von der App nie aufgerufen. Zwei
  gegensätzliche Zukünfte im Raum:
  - Reaktivieren als Basis für das neue "Dashboard-Pull"-Feature (Einkäuferin
    zieht sich freiwillig einen Wunsch in einen laufenden Stop).
  - Endgültig streichen/deaktivieren, falls dieses Feature verworfen wird.
  Status: **offen**, siehe Pro/Contra unten.

## Endpunkte, deren Funktion dem allerersten Ansatz widersprechen

- **Automatische Zuordnungs-Logik in `POST /wishes`** (nicht der Endpunkt
  selbst, sondern sein Nebeneffekt): Ein neu erstellter Wunsch wird
  automatisch einem passenden, laufenden Stop zugeordnet, solange der Trip
  `active` ist - unabhängig davon, ob gerade der erste oder der letzte Stop
  bearbeitet wird. Das ist exakt die Automatik, die "Last-Minute-Wünsche
  während des gesamten Einkaufs" ermöglicht und damit der heute festgelegten
  Philosophie ("Wunsch und Einkauf entzerren") direkt widerspricht.
  **Entscheidung bereits getroffen:** dieses Verhalten wird geändert - neue
  Wünsche während eines aktiven Trips bleiben `open` und werden nicht mehr
  automatisch zugeordnet. Erfordert eine Backend-Änderung.
- Damit einhergehend vermutlich obsolet: der Notification-Typ
  `wishAddedToActiveTrip`, der ausschließlich diese Automatik begleitet.

## Pro & Contra: "Einkäuferin darf jederzeit aus dem Dashboard einen Wunsch nachziehen"

Bewertungsgrundlage ist ausdrücklich **nicht** die ursprüngliche
Anforderungsbeschreibung, sondern das Statement von 2:34 Uhr: Wunsch und
Einkauf sollen entzerrt werden, jeder soll jederzeit asynchron Wünsche
eintragen können, Hektik vor und während des Einkaufs soll verschwinden -
insbesondere das Muster "ah, jetzt fällt mir erst ein, was ich noch wollte".
Last-Minute-Wünsche wurden bewusst gestrichen, weil sie genau diese Hektik
technisch nachbilden.

**Pro**

- Es ist eine **aktive, ruhige Entscheidung der Einkäuferin** vom Dashboard
  aus - kein Zuruf, kein WhatsApp, keine Unterbrechung durch Dritte während
  des Einkaufs im Laden. Das trifft den Kern von "keine Hektik für die
  Einkäuferin" eher als die verworfene Automatik, die ja fremdgesteuert war.
- Es bleibt **transparent statt unsichtbar**: Anders als die abgeschaltete
  Automatik passiert hier nichts im Hintergrund - die Einkäuferin sieht genau,
  was sie sich zusätzlich vornimmt, und wählt bewusst einen Stop.
- Trifft eine andere Rolle als das gestrichene Last-Minute-Fenster: dort ging
  es um **Wunsch-Ersteller**, die in letzter Sekunde noch etwas reinschieben
  wollten (genau das, was verhindert werden soll). Hier geht es um die
  **Einkäuferin selbst**, die sich am bereits vorhandenen, längst asynchron
  gefüllten Wunsch-Pool bedient - kein Widerspruch zu "jederzeit eintragen,
  wird schon vorher erledigt", sondern eher dessen konsequente Nutzung.
- Passt zur "wenige Klicks"-Philosophie: ein Wunsch, der ohnehin schon in der
  App liegt, kostet nur einen zusätzlichen Tap, keine neue Erfassung.

**Contra**

- Weicht die zentrale Trennlinie des heutigen Statements auf: "Ich plane jetzt
  die gespeicherten Wünsche in meinen Einkauf ein und starte ihn" sollte ein
  **abgeschlossener** Moment sein. Ein dauerhaft verfügbarer Dashboard-Zugriff
  während des gesamten Trips macht den Umfang des Einkaufs wieder fließend -
  fachlich dieselbe Unschärfe wie bei der gestrichenen Automatik, nur manuell
  statt automatisch ausgelöst.
- Reißt exakt die Fehlerklasse wieder auf, die den ganzen heutigen Anlass
  bildete: ein Wunsch, der in einen bereits abgeschlossenen Stop gezogen wird,
  oder in einen Stop, den die Einkäuferin gedanklich schon verlassen hat,
  erzeugt wieder Uneindeutigkeit ("ist das schon erledigt oder nicht?") -
  dieselbe Art von Inkonsistenz, die die B-Automatik verursacht hat.
- Die reine **Verfügbarkeit** der Möglichkeit kann die beschriebene Hektik
  psychologisch reproduzieren, auch wenn sie technisch "freiwillig" ist: Wenn
  das Dashboard mit allen offenen Wünschen jederzeit einen Klick entfernt ist,
  entsteht wieder ein Anreiz zum spontanen Nachplanen - genau das Muster "ah,
  das nehm ich doch noch mit", das laut Statement verschwinden soll.
- Der explizit gewählte Kompromiss von vorhin (ein einmaliges Last-Minute-
  Fenster nur zwischen "Los geht's" und erstem Stop, danach "zu spät") wurde
  bewusst als **einzige** erlaubte Nachbesserungs-Chance definiert. Ein
  dauerhafter Dashboard-Zugriff während des ganzen Trips unterläuft dieses
  Prinzip "danach ist es zu spät", selbst wenn die Automatik dahinter fehlt.
- Zusätzlicher Umfang (neuer Datenfluss Dashboard/Wunschliste → aktive
  Stop-Liste, neue UI, neue Fehlerfälle) direkt nachdem die heutige
  Grundsatzentscheidung war, Komplexität für das MVP zu **reduzieren**, nicht
  zu erweitern.

## Für morgen

- Anforderungen aktualisieren (insbesondere: Last-Minute-Regel final
  formulieren, Dashboard-Pull-Feature entscheiden).
- Technische/architektonische Entscheidungen treffen: Umfang der
  Backend-Änderung für das Abschalten der Auto-Zuordnung, Verbleib/Streichung
  von `POST /trips/{tripId}/stops/{stopId}/wishes`.
