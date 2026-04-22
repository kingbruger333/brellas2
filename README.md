# B2B Wholesale Catalog

MVP для оптового сайта-каталога с двумя частями:

- клиентский сайт на `Next.js`
- удобная админка на `Sanity Studio`

Владелец сайта управляет товарами не через код и не через Google Sheets, а через браузерную админ-панель по адресу `/studio`.

Пока Sanity не подключен, проект показывает демо-данные, чтобы его можно было сразу запустить и посмотреть верстку.

## Почему такой стек

- `Next.js 15` подходит для Vercel, дает быстрый SSR/ISR и понятную структуру.
- `Sanity` дает готовую удобную админку с логином, загрузкой фото, редактированием цен, описаний и любых полей товара.
- `next-sanity` удобно связывает сайт и CMS в одном проекте.
- Такой стек реалистичен для одного разработчика: минимум кастомной админки и быстрый запуск MVP.

## Возможности

### Сайт для клиентов

- главная страница
- каталог товаров
- отдельная карточка товара
- блок условий опта
- кнопки `Заказать в Telegram`

### Админка для владельца

- вход через аккаунт Sanity
- добавить товар
- редактировать товар
- удалить товар
- загружать фото
- менять цену
- менять описание
- указывать минимальный заказ
- менять тексты главной страницы и блока условий опта

## Структура проекта

```text
b2b-wholesale-catalog/
  .env.example
  package.json
  next.config.ts
  sanity.config.ts
  sanity.cli.ts
  README.md
  src/
    app/
      api/revalidate/route.ts
      catalog/page.tsx
      catalog/[slug]/page.tsx
      catalog/[slug]/not-found.tsx
      studio/[[...index]]/page.tsx
      globals.css
      layout.tsx
      page.tsx
    components/
      container.tsx
      portable-text.tsx
      product-card.tsx
      section-title.tsx
      site-footer.tsx
      site-header.tsx
      telegram-button.tsx
    lib/
      format.ts
      queries.ts
      sanity.client.ts
      sanity.env.ts
      sanity.image.ts
      types.ts
    sanity/
      schemaTypes/
        index.ts
        productType.ts
        siteSettingsType.ts
```

## Установка и запуск

### 1. Создать проект в Sanity

1. Зарегистрируйтесь на `sanity.io`.
2. Создайте новый project.
3. Возьмите `projectId` и `dataset`.
4. Создайте read token для сервера.

### 2. Заполнить переменные окружения

Скопируйте `.env.example` в `.env.local` и заполните:

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2025-01-01
SANITY_API_READ_TOKEN=your_read_token_for_preview_and_webhook
SANITY_STUDIO_PREVIEW_URL=http://localhost:3000
NEXT_PUBLIC_TELEGRAM_BOT_URL=https://t.me/your_bot
REVALIDATE_SECRET=change-me
```

### 3. Установить зависимости

```bash
npm install
```

Если PowerShell блокирует `npm`, используйте:

```powershell
npm.cmd install
```

### 4. Запустить локально

```bash
npm run dev
```

Или в PowerShell:

```powershell
npm.cmd run dev
```

Сайт будет доступен на `http://localhost:3000`, админка на `http://localhost:3000/studio`.

## Как пользоваться админкой

### Вход

1. Откройте `/studio`.
2. Войдите через Sanity account.
3. После входа появятся документы `Товар` и `Настройки сайта`.

### Добавить товар

1. Откройте `Товар`.
2. Нажмите `Create new`.
3. Заполните:
   - `Название`
   - `Slug`
   - `Артикул`
   - `Цена за единицу`
   - `Минимальный заказ`
   - `Краткое описание`
   - `Полное описание`
   - `Категория`
   - `Главное фото`
4. При необходимости добавьте дополнительные фото.
5. Отметьте `Показывать на главной`, если товар должен быть на главной странице.
6. Нажмите `Publish`.

### Редактировать товар

1. Откройте нужный товар в списке.
2. Измените цену, описание, фото или минимальный заказ.
3. Нажмите `Publish`.

### Удалить товар

1. Откройте товар.
2. В меню документа выберите удаление.
3. Подтвердите действие.

### Изменить тексты сайта

1. Откройте документ `Настройки сайта`.
2. Измените:
   - заголовок сайта
   - hero-блок
   - условия опта
   - ссылку на Telegram-бота
3. Нажмите `Publish`.

## Как работает Telegram

Все кнопки ведут на адрес из поля:

```env
NEXT_PUBLIC_TELEGRAM_BOT_URL=https://t.me/your_bot
```

Для карточек товара в ссылку добавляется параметр `start`, чтобы бот мог понять, какой товар выбрал клиент.

Пример:

```text
https://t.me/your_bot?start=product%3AНазвание%20товара
```

## Деплой на Vercel

1. Загрузите проект в GitHub.
2. Импортируйте репозиторий в Vercel.
3. Добавьте все переменные из `.env.local` в настройки проекта Vercel.
4. Выполните деплой.

После деплоя сайт и `/studio` будут работать в одном приложении.

## Что можно улучшить следующим этапом

- фильтрация по категориям и поиску
- мультивалютные цены
- Excel/PDF прайс-лист
- заявки в CRM
- роли менеджера и контент-редактора
- webhook из Sanity для мгновенного `revalidate`
