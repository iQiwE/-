---
name: project-lifecycle
description: >-
  Управление жизненным циклом и процессами веб-приложения аренды недвижимости (Backend NestJS на порту 4000 и Frontend Next.js на порту 3000).
  Активируется при получении команд /start (запуск бэкенда и фронтенда, проверка статуса) и /stop (остановка серверов, завершение процессов и освобождение портов).
---

# Project Lifecycle Skill: /start & /stop

Этот скилл обеспечивает надёжный запуск и остановку локального стека проекта аренды жилья:
- **Backend**: NestJS (REST API на `http://localhost:4000/api/v1`)
- **Frontend**: Next.js (Веб-интерфейс на `http://localhost:3000`)

---

## 1. Команда `/start` (Запуск проекта)

Когда пользователь вводит `/start` (или просит запустить сервисы):

1. **Проверка портов 3000 и 4000:**
   Перед стартом убедись, что порты не заняты старыми зависшими процессами:
   ```powershell
   Get-NetTCPConnection -LocalPort 3000, 4000 -ErrorAction SilentlyContinue | Select-Object LocalAddress, LocalPort, OwningProcess, State
   ```
   Если процессы найдены, выполни шаги из раздела `/stop` перед новым запуском.

2. **Запуск Backend (порт 4000):**
   Вызови `run_command` с параметрами:
   - `CommandLine`: `npm run start:prod --prefix d:\-\backend` (или `npm run start:dev --prefix d:\-\backend`)
   - `IsDaemon`: `true`
   - `BypassSandbox`: `true` (необходимо для сетевого биндинга портов в Windows)
   - `WaitMsBeforeAsync`: `2000`
   - `toolSummary`: `Start backend server`

3. **Запуск Frontend (порт 3000):**
   Вызови `run_command` с параметрами:
   - `CommandLine`: `npm run start --prefix d:\-\frontend` (или `npm run dev --prefix d:\-\frontend`)
   - `IsDaemon`: `true`
   - `BypassSandbox`: `true`
   - `WaitMsBeforeAsync`: `2000`
   - `toolSummary`: `Start frontend server`

4. **Проверка доступности (Healthcheck):**
   Выполни проверку через PowerShell `Invoke-WebRequest` или `curl`:
   ```powershell
   Start-Sleep -Seconds 3
   $b = try { (Invoke-WebRequest -Uri "http://localhost:4000/api/v1/properties" -UseBasicParsing -TimeoutSec 5).StatusCode } catch { $_.Exception.Response.StatusCode.value__ }
   $f = try { (Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5).StatusCode } catch { $_.Exception.Response.StatusCode.value__ }
   Write-Output "Backend HTTP: $b; Frontend HTTP: $f"
   ```

5. **Отчёт пользователю:**
   Сообщи пользователю, что проект запущен и готов к работе:
   - 🌐 **Frontend**: [http://localhost:3000](http://localhost:3000)
   - ⚙️ **Backend API**: [http://localhost:4000/api/v1](http://localhost:4000/api/v1)

---

## 2. Команда `/stop` (Остановка проекта)

Когда пользователь вводит `/stop` (или просит остановить/выключить проект):

1. **Остановка через `manage_task`:**
   Проверь активные фоновые задачи агента с помощью `manage_task(Action: 'list')` и принудительно заверши задачи демонов серверов (`Action: 'kill'`).

2. **Освобождение портов 3000 и 4000 (PowerShell):**
   Заверши любые процессы, удерживающие порты 3000 и 4000:
   ```powershell
   $ports = @(3000, 4000)
   foreach ($port in $ports) {
       $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
       if ($conns) {
           $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
           foreach ($procId in $pids) {
               if ($procId -gt 0) {
                   Write-Output "Stopping process $procId on port $port..."
                   Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
               }
           }
       }
   }
   ```

3. **Верификация остановки:**
   Убедись, что соединения больше не активны:
   ```powershell
   Get-NetTCPConnection -LocalPort 3000, 4000 -ErrorAction SilentlyContinue
   ```

4. **Отчёт пользователю:**
   Сообщи пользователю:
   - Проект успешно остановлен.
   - Порты 3000 (Frontend) и 4000 (Backend) освобождены.

---

## 3. Вспомогательные скрипты

В папке `scripts/` скилла расположены готовые автоматические скрипты:
- `scripts/start.ps1` — быстрый запуск обеих частей с проверкой доступности
- `scripts/stop.ps1` — корректная остановка и освобождение портов
