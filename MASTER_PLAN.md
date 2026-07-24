# ORYND CAD Bridge (Extension) — MASTER PLAN
> **Единственный источник правды для Extension.** Обновляется после каждой сессии.
> Отдельный продукт от ORYND Workspace (`design/orynd-design-system/`) — НЕ трогать Workspace
> без прямой команды founder'а. Бэкенд (`orynd_core/`) общий для обоих.
> Этот репозиторий — отдельный git (`origin` → `extension-oryndai-solid-app`), коммитить и
> пушить ТОЛЬКО отсюда, не из корня `ORYND_Workspace`.

## Что мы строим
Electron-панель, встраивается в CAD-приложения (сейчас: Fusion 360; план: SolidWorks, AutoCAD).
Пользователь пишет промпт → панель шлёт на бэкенд ORYND → LLM (любой BYOK-провайдер: Claude/
OpenAI/Gemini/Groq) оркестрирует → строит деталь макросом прямо в открытом CAD-документе.

## Этапы (статус)

### Stage 0 — Внутренняя проводка ✅ DONE (13.07.2026)
Key/MCP тоггл в композере, gating Send, MCP-плашка (поллинг статуса), 8 заглушек убраны,
честная copy. Детали: `knowledge_base/01_sessions/EXTENSION_RELEASE_PLAN_2026-07-13.md`.

### Stage 1 — V1 Launch baseline ◀ ТЕКУЩИЙ ЭТАП
BYOK любой провайдер, видимый счётчик кредитов, Share (V1 = GIF share-sheet), F1-онбординг
живым прогоном, деплой на прод, e2e на чистом аккаунте, релиз-тег.
**Definition of Done:** новый юзер регистрируется → вставляет любой ключ (или без ключа, MCP) →
строит деталь через F1-онбординг → шарит → всё видно/работает, без dev-заглушек.
**Активный план:** `ACTIVE_TASK.md` (этот каталог).

### Stage 2 — Supabase-backed credits/paywall (founder-guided, ждёт «go»)
`generation_credits`/`generations`/`plans` таблицы, серверное списание, реальный триал вместо
localStorage-мока. Спека: `knowledge_base/00_inbox/PLAN_v1_launch_credits_share_onboarding_2026-07-14.md`.

### Stage 3 — Site Phase 2: публичный шаринг (после Stage 1, не блокер)
Отдельный Vercel `share.orynd.app`, `/p/[id]`, таблица `shared_parts`, STL→glTF конвертация,
community-showcase интеграция. Спека в том же файле, что Stage 2.

### Stage 4 — UI rewrite (сознательно отложено)
Founder: делать только когда будут ресурсы/время и достаточно юзеров протестят текущий UI.
Не начинать без явной команды.

## Правило работы (чтобы не плодить файлы)
- Новая сессия → читай `_SESSION_MEMORY.md` (entry point) → `ACTIVE_TASK.md` (что делать сейчас).
- Прогресс — правь `ACTIVE_TASK.md` на месте (чекбоксы) + дописывай Progress Log в `_SESSION_MEMORY.md`.
- Новый `PLAN_*.md`/`HANDOFF_*.md` в `knowledge_base/01_sessions/` — только когда закрываем этап
  (архивная запись целиком, как `CHANGELOG`), НЕ как замена активному плану.
- Когда Stage 1 закрыт — отметить ✅ здесь, поднять Stage 2 в «ТЕКУЩИЙ ЭТАП», ACTIVE_TASK.md
  переписывается под Stage 2 (не накапливается новый параллельный файл).
