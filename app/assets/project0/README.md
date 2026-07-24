# Project 0 (F1) — сюда кладём 6 STL

Клади файлы **ровно с этими именами** (id из `F1_PARTS`, cad-onboarding-f1.jsx:21):

| Файл | Что это | Промпт, по которому чекается (точное совпадение) |
|------|---------|--------------------------------------------------|
| `wheel.stl`   | Front wheel ×4  | `F1 front wheel rim, 13 inch, 6-spoke, center-lock hub, 30mm width` |
| `wing.stl`    | Rear wing       | `F1 rear wing, single element, 900mm span, DRS flap gap 10mm` |
| `nose.stl`    | Nosecone        | `F1 nosecone, 900mm length, tapered profile, front crash structure mount` |
| `sidepod.stl` | Sidepod         | `F1 sidepod, undercut inlet 250x150mm, radiator duct, 1400mm length` |
| `floor.stl`   | Floor & diffuser| `F1 floor edge with diffuser, venturi tunnel, 3-strake, 900mm width` |
| `halo.stl`    | Halo            | `F1 halo cockpit protection, titanium tube, 3-point mount, FIA profile` |

Регистр важен, расширение `.stl` строчными. Если имя не совпадёт — деталь не подставится,
и Project 0 молча уйдёт на бэкенд вместо локального показа.

## Требования к файлам
- **Формат**: STL (бинарный лучше — меньше весит).
- **Размер**: low-poly, желательно **до ~2 МБ** каждый. Они едут внутри DMG/EXE:
  6 × 10 МБ = +60 МБ к установщику на ровном месте.
- **Лицензия**: CC / public domain. Мы их распространяем в составе приложения —
  это уже не «юзер скачал у себя», а наша дистрибуция.

## Заметки
- Промпты в `F1_PARTS` помечены в коде как **placeholder** («pending the founder's real
  reference photos + verified prompts»). Если твои STL про другие детали — скажи, поправлю
  и таблицу, и промпты; менять надо в ОДНОМ месте (cad-onboarding-f1.jsx:21).
- Что происходит дальше (таск 2.6): `send()` при точном совпадении с промптом **не идёт на
  бэкенд** — синтезирует ран-события (~15с для правдоподобия) и копирует STL в
  `~/Documents/ORYND/project0/` → `filesDir` → чекофф. Т.е. работает офлайн и не тратит
  ни кредит, ни LLM.
- ⚠️ Порядок твой: **сначала показываю визуал → ты смотришь → потом подключаю функционал.**

## Локальный showcase-набор и сборка

`generate_f1_assets.js` воспроизводимо создаёт шесть low-poly бинарных STL без
внешних моделей. Его результат — только визуальный F1 showcase, не инженерная
или безопасная для реального автомобиля геометрия.

- `assembly.json` содержит координаты всех десяти instances: четыре колеса,
  два зеркальных sidepod'а и остальные уникальные детали.
- Единицы — миллиметры. Оси: `X` вперёд к nose, `Y` влево, `Z` вверх.
- Порядок склейки и mate-описания указаны в `assemblyOrder` и `mate` у каждого
  instance в `assembly.json`.
