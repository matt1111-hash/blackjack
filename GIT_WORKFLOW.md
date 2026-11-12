# GIT_WORKFLOW.md
**Version: 1.2 (2026-05-24) | Scope: minden repo | Mód: solo desktop developer**

---

## Alapelv

> Egy ember. Egy gép (otthon). Egy `main` branch. GitHub = backup, nem peer review.

Ami **vállalati GitHub-flow-ban** kötelező (PR, branch policy, review, merge train), az itt **felesleges súly**. A modell csak akkor használjon bonyolultabb git műveletet, ha az ember kifejezetten kéri.

---

## A 10 alapelv

| # | Alapelv | Konkrét szabály |
|---|---------|-----------------|
| 1 | **`main` by default** | Branch csak ember kifejezett kérésére, dependabot/Jules PR-nál, vagy előre jóváhagyott nagy kockázatú izolációhoz. |
| 2 | **4 napi művelet** | `status`, `diff`, `commit`, `push`. Ennyi. |
| 3 | **Nincs PR** | Solo dev = te vagy a reviewer. AI review (`q review` / `multi-review`) pótolja. |
| 4 | **Commit üzenet: lazán strukturált magyar** | Első sor max 72 karakter, modul-prefix javasolt. Tilos: `wip`, `update`, `fix bug`. |
| 5 | **Pre-commit minimum** | Secret scan (gitleaks) + syntax check. NEM full lint, NEM full test. |
| 6 | **Nincs rebase, nincs squash dance** | Konfliktus → manuális merge. |
| 7 | **Force push tilos** | Egyetlen kivétel: titok-pucolás BFG/git-filter-repo után. |
| 8 | **Tag opcionális** | Csak valódi release-nél. Semver csak ha másnak adsz ki. |
| 9 | **GitHub = backup** | Lokálisan ne csinálj külön branchet "mentésre". `git reflog` van mindig. |
| 10 | **AI review push előtt opcionális, nem kötelező** | A quality gate kötelező, az AI review csak ha kell. |

---

## Engedélyezett napi műveletek

```bash
git status                    # mit változtattam
git diff                      # mi a változás
git diff --stat               # csak fájllista
git add <file>                # explicit, sose `git add .` modell által
git add -p                    # részenkénti review
git commit -m "..."           # magyar commit üzenet
git push                      # main-ra
git log --oneline -20         # mit csináltam
git log -p <file>             # konkrét fájl története
git show <commit>             # egy commit teljes diff-je
git reflog                    # ha eltévedtem
```

---

## Ritka műveletek (agent csak jóváhagyással)

Ezek nem napi műveletek. Agent csak `git status` + `git diff --stat` áttekintése után, explicit emberi jóváhagyással futtatja őket.

```bash
git tag v1.0.0                # release tag
git stash                     # gyors félretevés
git stash pop                 # vissza
git checkout <commit> -- <file>  # egy fájl visszahozása régebbi commitból
git pull --ff-only            # több gép között (csak fast-forward!)
```

---

## Human-only recovery (agent: dry-run / report, hacsak az ember nem engedélyezi)

Ezek a parancsok adatot törölhetnek vagy írhatnak felül. Agent csak akkor futtatja, ha az ember **explicit jóváhagyást** adott, máskülönben csak jelenti mit kellene futtatni.

```bash
git restore <file>            # munka eldobása fájlszinten
git restore --staged <file>   # unstaging
git reset --hard <commit>     # vissza egy állapotra (DESTRUKTÍV)
git clean -fd                 # untracked fájlok törlése (DESTRUKTÍV)
git clean -fdx                # + gitignore-olt is (KÜLÖNÖSEN VESZÉLYES)
```

**Agent viselkedés:** Inkább `git diff` + riport, mint automatikus `git restore`. Az ember dönt, mi vesszen el.

---

## Tiltott műveletek (agent által)

| ❌ Művelet | Indok |
|-----------|-------|
| `git rebase` | Lineáris history nem cél, manuális merge tisztább. |
| `git rebase -i` interaktív squash | Felesleges bonyodalom solo dev módban. |
| `git push --force` | Csak ember csinálhatja, csak titok-pucolás után. |
| `git push --force-with-lease` | Ugyanaz, csak finomabb név. |
| `git merge --squash` | Történet hamisítása. |
| `git filter-branch` / BFG | Csak ember, csak secret leak után. |
| Automatikus branch létrehozás | Branch csak explicit emberi kérésre vagy előre jóváhagyott izolációhoz. |
| `git cherry-pick` | Manuális copy-paste tisztább. |
| Automata `git commit` az agenttől | Az ember commitol, az agent javasol üzenetet. |
| Automata `git push` az agenttől | Push = ember döntése. |
| Új remote hozzáadása | Csak ember. |
| `.git/hooks/` módosítása | Csak ember. |
| Submodule / subtree | Túl bonyolult solo dev módban. |

---

## Commit üzenet sablon

### Általános formátum

```
modul: rövid magyar leírás (max 72 char)

Opcionális hosszabb leírás, ha kell.
- Mit változtattam
- Miért
- Milyen ellenőrzés futott

Refs: kapcsolódó context (issue, prev commit, doc)
```

### Engedélyezett prefixek

| Prefix | Mikor |
|--------|-------|
| `auth:` | autentikáció, jogosultság |
| `api:` | API endpoint, contract |
| `domain:` | üzleti logika, entities |
| `ui:` | frontend, GUI változás |
| `cli:` | parancssor, TUI |
| `db:` | séma, migráció, query |
| `config:` | env, beállítás, secret kezelés |
| `deps:` | dependency frissítés |
| `test:` | csak teszt változás |
| `docs:` | README, AGENTS.md, comment |
| `ci:` | quality_gate, github actions |
| `refactor:` | nincs viselkedésváltozás |
| `fix:` | hibajavítás (konkrétan!) |
| `chore:` | takarítás, formattálás |
| `wip:` | **TILOS final commitban**, csak stash név |

### Példák — JÓ

```
auth: jwt expiry 24h-ra állítva

api: új endpoint /financial-metrics/historical
  - 5 éves visszamenőleges adat
  - cache 24h-ra
  - rate limit 100/min

fix: dexter FINANCE_API_BASE_URL hiányakor nem dobott explicit hibát

deps: pydantic 2.5 → 2.7 (CVE-2024-12345)

refactor: home_energy konfigbetöltés átszervezve domain alá

docs: AGENTS.md frissítve v3.0-ra (SZKEA, stack adapterek)
```

### Példák — TILOS

```
❌ update
❌ fix
❌ wip
❌ asdf
❌ misc changes
❌ Updated authentication system to use JWT tokens with 24 hour expiry  (angol)
❌ feat(auth): JWT expiry              (conventional commits parádé)
❌ 🎉 awesome new feature               (emoji parádé)
❌ Fix bug                              (semmitmondó)
```

---

## Konfliktus kezelés

**Mikor lehet konfliktus solo dev módban?**

1. Másik gépről pushed változás → `git pull --ff-only` failel
2. `git stash pop` után
3. `git cherry-pick` után (de ezt nem csinálunk)
4. `git rebase` után (de ezt nem csinálunk)

**Megoldás:**

```bash
# 1. Mentsd amit lokálisan dolgozol
git stash push -m "lokális munka mentés"

# 2. Hozd be a távoli változást
git pull --ff-only

# 3. Hozd vissza a munkát
git stash pop

# 4. Konfliktus? Manuális szerkesztés.
#    Konfliktus markerek: <<<<<<< ======= >>>>>>>
#    NINCS automata "okos" resolve.

# 5. Ellenőrzés
git diff
git status

# 6. Folytatás normál módon
git add <file>
git commit -m "merge: <leírás>"
```

**Soha nem:**
- `git pull` rebase módban
- `--strategy-option=theirs/ours` automatikusan
- Az agent maga "okosan" eldönti melyik változat jó

---

## Visszaállítás (recovery)

Az alábbi parancsok emberi recovery példák. Agent legfeljebb dry-run információt ad és riportol, kivéve ha az ember explicit jóváhagyja a futtatást.

### "Eltévedtem, vissza akarok menni"

```bash
git reflog                    # az utolsó 30 művelet
git reset --hard HEAD@{5}     # vissza 5 művelettel
```

### "Véletlenül commitoltam valamit"

```bash
# Még nem pusholtam:
git reset --soft HEAD~1       # vissza, de a változások staged-ben maradnak
git reset --hard HEAD~1       # vissza, és változások eldobva (VESZÉLY)

# Már pusholtam:
git revert HEAD               # új commit ami visszacsinálja
git push
```

### "Véletlenül commitoltam egy secret-et"

**Ezt csak ember csinálhatja, megfontoltan.** Az agent NE nyúljon hozzá.

1. Forgasd a secretet azonnal (regenerate, revoke)
2. `bfg --delete-files <fájl>` vagy `git filter-repo`
3. Force push (ez az egyetlen engedélyezett force push)
4. Mindenki aki klónozta, újraklónoz
5. `gitleaks detect` ellenőrzés

### "Untracked fájlok rendetlenné teszik a status-t"

```bash
git clean -n                  # MIT törölnék (dry-run, mindig először!)
git clean -fd                 # tényleges törlés, fájlok + üres mappák
git clean -fdx                # + a .gitignore-olt fájlok is (VESZÉLY)
```

---

## Edge case-ek

### Több gép közötti szinkron

A te 2026-os setupod gyakran: laptop + desktop ugyanazon a repón.

```bash
# Reggel az adott gépen
git pull --ff-only

# Munka...

# Este, mielőtt másik gépre mész
git status               # tiszta-e?
git push                 # mindent fel
```

**Tilos:**
- `git pull` rebase módban (default `pull.rebase=false`)
- Két gépen párhuzamos commit ugyanarra a fájlra → konfliktus

### `.gitignore` higiénia

Minimum sablon minden repóban:

```gitignore
# Python
__pycache__/
*.pyc
.pytest_cache/
.coverage
htmlcov/
.mypy_cache/
.ruff_cache/
venv/
.venv/

# Node
node_modules/
.next/
dist/
build/

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Env
.env
.env.local
.env.*.local

# Codegraph / Codex artifacts
.codegraph/
.codex/

# Quality artifacts
.quality_gate.local.conf
quality_report_*.txt

# Secrets
*.pem
*.key
secrets/
```

### Tag-ek

Csak akkor:
- Külső release (PyPI / npm publish)
- Stabil mérföldkő amit emlékezetbe akarsz vésni
- "Production ready" mérföldkő dokumentálása

```bash
git tag -a v1.0.0 -m "Első stabil verzió"
git push --tags
```

**Semver formátum** (`v1.2.3`): csak ha másnak adsz ki. Belső jelölésnek `v0.1`, `milestone-1` is jó.

### Nagy fájlok

GitHub limit: 100MB / fájl. Soft warning: 50MB.

**Megelőzés:**
- `.gitignore`-ba minden binary, ML modell, dataset
- Helyette: `data/README.md` ami leírja honnan kell letölteni
- Git LFS csak végszükségből (külön config, extra bonyodalom)

---

## Jules / külső agent integrálás

Ha Jules vagy más külső agent PR-t csinál (pl. dependabot):

1. PR-t **csak akkor** fogadj el, ha:
   - Quality gate ZÖLD
   - Te elolvastad a diff-et
   - Nincs scope creep
2. **Soha** ne fogadj automatikus mergelés-t
3. Merge után lokálisan `git pull --ff-only`

Ez kivétel a "nincs PR" szabály alól: itt a PR csak interfész a bot-tal, nem peer review rituálé.

---

## Mit ellenőrizz a session végén (agent)

Mielőtt jelented hogy "KÉSZ":

```bash
git status                    # tiszta-e a tree?
git log --oneline -3          # mit commitoltam?
git diff --stat               # milyen lokális módosítás maradt?
git diff origin/main          # csak ha van origin/main és push előtt állsz
```

**Ha nem szándékos vagy nem dokumentált módosítás maradt a worktree-ben → NEM KÉSZ.**
Szándékos dirty (a feladat eredménye) elfogadható — az agent gyakran nem commitolhat. Ilyenkor a HANDOFF pontosan listázza a módosított fájlokat és javasol commit üzenetet az embernek.

---

## Hivatkozott fájlok

- **AGENTS.md** — agent szerződés, SZKEA módszer
- **PRODUCTION_MANDATE.md** — release döntés kritériumok
- **HANDOFF.md** — záró riport sablon
