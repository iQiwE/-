# Инструкции и команды проекта (Antigravity Rules)

## Поддерживаемые пользовательские команды

### `/start`
При получении команды `/start` или просьбы запустить проект:
1. Активируй скилл `project-lifecycle`.
2. Запусти Backend (`npm run start:prod` в `d:\-\backend`) и Frontend (`npm run start` в `d:\-\frontend`) в фоновом режиме (`IsDaemon: true`, `BypassSandbox: true`).
3. Дождись готовности серверов (проверка `http://localhost:4000/api/v1/properties` и `http://localhost:3000`).
4. Выведи пользователю подтверждение и кликабельные ссылки на сервисы.

### `/stop`
При получении команды `/stop` или просьбы остановить проект:
1. Активируй скилл `project-lifecycle`.
2. Заверши активные фоновые процессы через `manage_task` (Action: `kill`) и освободи порты 3000 и 4000 (PowerShell `Stop-Process`).
3. Подтверди пользователю, что все серверы остановлены и порты свободны.
