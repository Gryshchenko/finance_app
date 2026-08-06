# Sharing — Dashboard / Transactions TODO

Мета: у dashboard бачити доступні через групу категорії/рахунки/доходи, створювати
транзакції в спільні категорії та бачити статистику. Модель шерингу — **пер-item**
(`groupshareditem` зберігає конкретні `accountId`/`categoryId`/`incomeId`).

## Зафіксовані рішення

- **Гранулярність:** пер-item (не пер-user). Не переходимо на owner-based scope.
- **Read:** бачити своє + зашерене мені (`resolveAccessibleItems`).
- **Просте правило доступу:** `shared → CREATE / add amount дозволено; EDIT / DELETE — ні`.
  Однаково для всіх типів (account / category / income).
- **Write у shared дозволено** → `addAmount` і валідація на create резолвлять ціль по
  **item (own OR accessible)**, НЕ по `userId` реквестера.
- **Edit/Delete** сутностей і чужих транзакцій — строго `where({ userId })` (own-only).
- `transactions.userId` = реквестер (хто вніс).

> ⚠️ Наслідок «write у shared»: `addAmount` мусить оновлювати рахунок по `accountId`
> у межах own+accessible. Якщо лишити `where({ userId, accountId })` — для чужого
> shared-рахунку оновиться 0 рядків, баланс мовчки не зміниться, а транзакція вставиться.
> Валідація проти accessible-набору (п.1) — єдиний захист від запису в рахунок
> стороннього юзера, тому обовʼязкова.

---

## 1. Заборонити запис «лівих» id — тільки own + accessible (не будь-який int)

Зараз `createTransaction` вставляє будь-які id без перевірки (IDOR на запис).
Правило: `accountId`/`incomeId`/`categoryId` мусять бути **own АБО accessible**
(∈ `resolveAccessibleItems`). Будь-який інший — reject.

- [ ] **Валідувати `categoryId` на create** — `createExpenseTransaction`
      (`TransactionService.ts:245`) перевіряє тільки рахунок, категорію — ніде.
- [ ] **Валідувати `incomeId` на create** — `createIncomeTransaction`
      (`TransactionService.ts:231`) не перевіряє `incomeId`.
- [ ] **Валідувати `accountId` на create** проти own+accessible (не будь-який int).
- [ ] **`getAccount` на write → own OR accessible** (`TransactionService.ts:235,249,275,276`).
      Оскільки write у shared дозволено, валідація рахунку має пускати shared-рахунки,
      але СТРОГО з accessible-набору.
- [ ] **`addAmount` → оновлювати по `accountId` у межах own+accessible**, а не
      `where({ userId, accountId })`. Інакше для чужого shared-рахунку оновиться 0 рядків
      і баланс мовчки не зміниться (транзакція при цьому вставиться) → розсинхрон.
- [ ] **`patchTransaction` / `deleteTransaction` — лишити own-only** (edit/delete
      заборонено для shared). Але якщо patch змінює id — валідувати нові проти own+accessible.

---

## 2. Фікс `resolveAccessibleItems` (утиліта) — вже майже ок

`utils/resolveAccessibleItems.ts`

- [x] `array_agg` (не `tarray_agg`), `??` для колонок, `status = Connected`, `DISTINCT`,
      дужки навколо OR — зроблено.
- [ ] Розглянути повернення `{accountIds, categoryIds, incomeIds}` одним запитом,
      щоб не робити 3 roundtrip-и на дашборд.
- [ ] Узгодити контракт помилки: `undefined` = fail-closed (обробити у викликачах).

---

## 3. Фікс read-методів (списки) — баг «або/або» → union

У всіх трьох гілка `if (empty) where(userId) else whereIn(ids)` віддає **або своє, або
shared**, тож при наявності shared власні НЕзашерені item-и зникають.

- [ ] `getAccounts` — `AccountDataAccess.ts:79` → `userId = self OR id ∈ ids` (union у дужках)
- [ ] `gets` (categories) — `CategoryDataAccess.ts:68` → union
- [ ] `gets` (incomes) — `IncomeDataAccess.ts:61` → union
- [ ] Прибрати дебаг `console.log` — `CategoryDataAccess.ts:85,87`
- [ ] Замінити плейсхолдери `// add sentry log` реальним логом fallback-гілки

---

## 4. Read-методи (одиночні `get`) — прокинути той самий scope

Щоб shared-item можна було **відкрити** (read-only), не лише бачити у списку.

- [ ] `getAccount` — `AccountDataAccess.ts:143` (зараз строгий `userId`)
- [ ] `get` (category) — `CategoryDataAccess.ts:104`
- [ ] `get` (income) — `IncomeDataAccess.ts:89`

> Увага: read і write тепер обидва пускають own+accessible (write у shared дозволено).
> Різниця лише в edit/delete — вони own-only. Деталі write — п.1.

---

## 5. Транзакції — `getTransactions` (переписати блок WHERE)

`TransactionDataAccess.ts:287`

- [ ] **Додати self-scope** — зараз немає `where userId` взагалі; юзер без груп
      бачить 0 транзакцій (`whereIn('x', [])` = false).
- [ ] **Explicit-фільтр (`?categoryId=`/`incomeId=`/`accountId=`):**
      `filter .andWhere(згрупована access-OR)`. Зараз `orWhereIn` «втікає» з-під фільтра
      і тягне чужі сутності.
- [ ] **Гілка `accountId`:** зараз запитаний `accountId` взагалі ігнорується —
      застосовується лише accessible-набір. Виправити на фільтр (source OR target) + окрема access-група.
- [ ] **Гілка без фільтрів (список):** весь scope у ОДИН `where(function(){ … OR … })`,
      щоб OR-и не вирвались з-під `isDeleted`/курсора.
- [ ] Перевірити курсорну пагінацію після групування (`TransactionDataAccess.ts:305`).

---

## 6. Статистика дашборда — item-based scope

Щоб shared-категорія показувала внески **всіх** контриб'юторів (інакше власник не
побачить транзакції, які учасники додали в його спільну категорію).

- [ ] `getStats` — `TransactionDataAccess.ts:116` → scope по **id ресурсу**
      (`categoryId/accountId/incomeId ∈ own+accessible`), не по `userId`.
- [ ] `getStatsByEntity` — `TransactionDataAccess.ts:186` → те саме.
- [ ] Перевірити `StatsOrchestratorService` (`summary`/`entityStats`/`categoriesStats`)
      — успадкує scope з `getStats`.

---

## 7. Семантика агрегатів — НЕ роздути баланс

Щойно `getAccounts` віддаватиме shared, усе згори успадкує це мовчки.

- [ ] `BalanceService.get` (`BalanceService.ts:33`) — баланс має рахувати **тільки свої**
      рахунки, інакше у net worth потраплять чужі гроші.
- [ ] `OverviewService.overview` (`OverviewService.ts:50-52`) — визначити, що показуємо:
      своє чи +shared.
- [ ] Ввести прапорець scope: `getAccounts(userId, { includeShared })` —
      dashboard/список категорій → `true`, баланс/overview → `false`.

---

## 8. Frontend

- [ ] Списки повертають `isOwn` / `ownerUserId` → ховати/дизейблити Edit/Delete
      на чужих shared-item-ах (інакше кнопки дадуть «not found»).
- [ ] Dashboard: секція/фільтр «моє / група».
- [ ] Форма транзакції: вибір спільної категорії (рахунок — лише свій).

---

## 9. Edit / Delete — строго own-only (лишаються `where({ userId })`)

Правило `EDIT/DELETE заборонено для shared` виходить безкоштовно (0 рядків для чужого):

- `patchAccount`/`deleteAccount` — `AccountDataAccess.ts:171,246`
- `patch`/`delete` category — `CategoryDataAccess.ts:138,178`
- `patch`/`delete` income — `IncomeDataAccess.ts:142,182`
- `patchTransaction`/`deleteTransaction`/`deleteTransactionsForEntity` — `TransactionDataAccess.ts`

> ⚠️ `addAmount` (`AccountDataAccess.ts:212`) — НЕ у цьому списку. Оскільки write у shared
> дозволено, `addAmount` має працювати по own+accessible (див. п.1), інакше баланс
> shared-рахунку не рухатиметься.
>
> ⚠️ `patchTransaction` лишається own-only на сам запис, але валідація нових id — п.1.
