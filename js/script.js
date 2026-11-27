console.log('script.js підключено');

/*
 * Практикум 10. Обраний фреймворк: Vue 3 (підключено через CDN).
 * Причина вибору: Vue підключається одним тегом <script> без Babel, а шаблони
 * пишуться звичайним HTML з директивами, тож наявну розмітку каталогу легко перенести.
 */

// Адреса пошуку коктейлів у TheCocktailDB (тестовий ключ «1», реєстрація не потрібна)
const API_URL = 'https://www.thecocktaildb.com/api/json/v1/1/search.php';

// ===== Практикум 11: налаштування локальних сховищ =====

// Джерело даних для збережених рецептів:
// false - етап 1 (localStorage), true - етап 2 (IndexedDB з одноразовою міграцією з localStorage)
const USE_INDEXEDDB = true;

// Ключі localStorage
const STORAGE_KEY = 'savedCocktails';
const MIGRATION_FLAG = 'savedCocktailsMigrated';

// Схема IndexedDB: база, версія, об'єктне сховище і його ключ (keyPath)
const DB_NAME = 'DrinksCatalogDB';
const DB_VERSION = 1;
const STORE_NAME = 'cocktails';

// Назви типів напоїв для значень select форми додавання
const typeLabels = {
    hot: 'Гарячий напій',
    cold: 'Холодний напій',
    cocktail: 'Коктейль'
};

// Кольори напою за типом - для рецептів, доданих через форму, і рецептів з API (практикум 12)
const typeColors = {
    hot: '#8d5a3b',
    cold: '#81d4fa',
    cocktail: '#ffb74d'
};

// Стрілкова функція з практикуму 6: чи готується напій швидко (до 5 хв)
const isQuick = time => time <= 5;

/*
 * Функції ручного рендеру з практикуму 7 для каталогу (createRecipeCard, renderRecipes,
 * updateDrinksCount, getFilteredRecipes, applyFilters) і видалення статичної картки
 * прибрано: список каталогу тепер декларативно рендерять компоненти DrinkList і DrinkCard,
 * а підсумок і фільтри - обчислювані значення Vue. Ручний DOM-код лишився тільки
 * для секції з API (практикум 9).
 */

// ===== Компоненти Vue =====

// Картка одного напою: отримує всі дані лише через props
const DrinkCard = {
    props: {
        name: { type: String, required: true },
        type: { type: String, required: true },
        typeKey: { type: String, default: 'hot' },
        timeMinutes: { type: Number, required: true },
        alcohol: { type: Boolean, required: true },
        difficulty: { type: String, default: null },
        image: { type: String, default: null },
        alt: { type: String, default: '' }
    },
    // Подія select: користувач відкрив картку (практикум 12)
    emits: ['select'],
    computed: {
        // Похідне значення: «швидкий» напій обчислюється з props timeMinutes
        quick() {
            return isQuick(this.timeMinutes);
        }
    },
    template: `
        <article class="recipe-card" :class="{ 'non-alcoholic': !alcohol }" :data-time="timeMinutes">
            <img v-if="image" :src="image" :alt="alt" class="recipe-card_image">
            <div v-else class="recipe-card_image recipe-card_image--placeholder"
                 role="img" :aria-label="'Немає фото: ' + name">🍹</div>
            <div class="recipe-card_content">
                <p class="recipe-badge" :class="'recipe-badge--' + typeKey">{{ type }}</p>
                <h3 class="recipe-card_title">{{ name }}</h3>
                <p class="recipe-card_info">⏳ Час: <strong>{{ timeMinutes }} хв</strong><span v-if="quick">(швидко)</span></p>
                <p v-if="difficulty" class="recipe-card_info">📊 Складність: <span>{{ difficulty }}</span></p>
                <p><a href="#recipe-details" class="recipe-card_link" @click="$emit('select')">Детальніше</a></p>
            </div>
        </article>
    `
};

// Список карток: отримує масив і значення чекбокса «Лише безалкогольні» через props
const DrinkList = {
    components: { DrinkCard },
    props: {
        drinks: { type: Array, required: true },
        onlyNonAlcoholic: { type: Boolean, default: false }
    },
    // Передає подію відкриття картки батьківському компоненту разом із напоєм
    emits: ['select'],
    computed: {
        // Фільтрація за значенням чекбокса, переданим з батьківського компонента
        visibleDrinks() {
            if (!this.onlyNonAlcoholic) {
                return this.drinks;
            }
            return this.drinks.filter(drink => !drink.alcohol);
        }
    },
    template: `
        <div id="drinks-list" class="recipes-grid">
            <drink-card
                v-for="drink in visibleDrinks"
                :key="drink.id"
                :name="drink.name"
                :type="drink.type"
                :type-key="drink.typeKey"
                :time-minutes="drink.timeMinutes"
                :alcohol="drink.alcohol"
                :difficulty="drink.difficulty"
                :image="drink.image"
                :alt="drink.alt"
                @select="$emit('select', drink)"
            ></drink-card>
            <p v-if="visibleDrinks.length === 0" class="recipes-empty">
                За обраними умовами рецептів не знайдено
            </p>
        </div>
    `
};

// Батьківський компонент: реактивний стан каталогу, фільтр і підсумок
const catalogApp = Vue.createApp({
    components: { DrinkList },
    data() {
        return {
            // Дані варіанта 15 (масив з практикумів 6-7) тепер у реактивному стані
            drinks: [
                {
                    id: 1,
                    name: 'Капучино',
                    type: 'Гарячий напій',
                    typeKey: 'hot',
                    alcohol: false,
                    timeMinutes: 10,
                    difficulty: 'Середня',
                    image: 'assets/img/cappuccino.jpg',
                    alt: 'Чашка гарячого капучино',
                    color: '#a1673f',
                    ingredients: [
                        'Еспресо - 30 мл',
                        'Молоко - 120 мл',
                        'Цукор - за смаком'
                    ],
                    steps: [
                        'Приготувати еспресо.',
                        'Збити молоко до густої піни.',
                        'Влити молоко з піною в еспресо.'
                    ]
                },
                {
                    id: 2,
                    name: 'Мохіто безалкогольний',
                    type: 'Холодний напій',
                    typeKey: 'cold',
                    alcohol: false,
                    timeMinutes: 5,
                    difficulty: 'Легка',
                    image: 'assets/img/mojito.jpg',
                    alt: 'Склянка холодного мохіто',
                    color: '#a5d6a7',
                    ingredients: [
                        'М\'ята - 10 листочків',
                        'Лайм - 1/2 шт.',
                        'Газована вода - 150 мл',
                        'Лід - за смаком',
                        'Цукор - 1 ч.л.'
                    ],
                    steps: [
                        'Нарізати лайм часточками.',
                        'Розім\'яти лайм з м\'ятою та цукром на дні.',
                        'Додати лід.',
                        'Залити водою та перемішати.'
                    ]
                },
                {
                    id: 3,
                    name: 'Матча лате',
                    type: 'Гарячий напій',
                    typeKey: 'hot',
                    alcohol: false,
                    timeMinutes: 7,
                    difficulty: 'Середня',
                    image: 'assets/img/matcha.jpg',
                    alt: 'Зелений чай матча',
                    color: '#9ccc65',
                    ingredients: [
                        'Порошок матча - 1 ч.л.',
                        'Гаряча вода - 50 мл',
                        'Молоко - 150 мл',
                        'Мед - за смаком'
                    ],
                    steps: [
                        'Збити матчу з водою до однорідності.',
                        'Підігріти та спінити молоко.',
                        'Влити молоко в матчу, додати мед.'
                    ]
                },
                {
                    id: 4,
                    name: 'Глінтвейн',
                    type: 'Гарячий напій',
                    typeKey: 'hot',
                    alcohol: true,
                    timeMinutes: 15,
                    difficulty: 'Середня',
                    image: 'assets/img/mulled-wine.jpg',
                    alt: 'Келих гарячого глінтвейну з апельсином і корицею',
                    color: '#8e1b2b',
                    ingredients: [
                        'Червоне вино - 750 мл',
                        'Апельсин - 1 шт.',
                        'Кориця - 2 палички',
                        'Гвоздика - 5 шт.',
                        'Мед - 2 ст.л.'
                    ],
                    steps: [
                        'Нагріти вино, не доводячи до кипіння.',
                        'Додати спеції та нарізаний апельсин.',
                        'Настояти 10 хвилин і додати мед.'
                    ]
                },
                {
                    id: 5,
                    name: 'Імбирний лимонад',
                    type: 'Холодний напій',
                    typeKey: 'cold',
                    alcohol: false,
                    timeMinutes: 5,
                    difficulty: 'Легка',
                    image: 'assets/img/lemonade.jpg',
                    alt: 'Глечик лимонаду з імбиром і скибочками лимона',
                    color: '#f9d55b',
                    ingredients: [
                        'Імбир - 30 г',
                        'Лимон - 1 шт.',
                        'Газована вода - 500 мл',
                        'Цукровий сироп - 50 мл',
                        'Лід - за смаком'
                    ],
                    steps: [
                        'Натерти імбир і вичавити сік лимона.',
                        'Змішати з цукровим сиропом.',
                        'Додати лід і залити газованою водою.'
                    ]
                },
                {
                    id: 6,
                    name: 'Піна колада',
                    type: 'Коктейль',
                    typeKey: 'cocktail',
                    alcohol: true,
                    timeMinutes: 8,
                    difficulty: 'Середня',
                    image: 'assets/img/pina-colada.jpg',
                    alt: 'Коктейль піна колада зі шматочком ананаса',
                    color: '#efe3c2',
                    ingredients: [
                        'Білий ром - 50 мл',
                        'Кокосові вершки - 50 мл',
                        'Ананасовий сік - 100 мл',
                        'Лід - за смаком'
                    ],
                    steps: [
                        'Змішати всі інгредієнти в блендері з льодом.',
                        'Перелити в келих.',
                        'Прикрасити шматочком ананаса.'
                    ]
                }
            ],
            category: 'all',
            search: '',
            onlyNonAlcoholic: false
        };
    },
    computed: {
        // Напої, відібрані за типом і пошуком (чекбокс застосовує DrinkList)
        filteredDrinks() {
            const query = this.search.trim().toLowerCase();
            return this.drinks.filter(drink =>
                (this.category === 'all' || drink.typeKey === this.category) &&
                (query === '' || drink.name.toLowerCase().includes(query))
            );
        },
        // Похідне значення для p#drinks-count
        nonAlcoholicCount() {
            return this.drinks.filter(drink => !drink.alcohol).length;
        }
    },
    watch: {
        onlyNonAlcoholic(value) {
            console.log(`Фільтр «Лише безалкогольні»: ${value ? 'увімкнено' : 'вимкнено'}`);
        }
    },
    methods: {
        // Додає новий рецепт у реактивний масив - Vue сам перемальовує список
        addRecipe(recipe) {
            this.drinks.push(recipe);
        },
        // Відкриття картки: показує деталі з анімацією «наливання» (практикум 12)
        openDetails(drink) {
            openRecipeDetails(drink);
        },
        // Чи буде рецепт видно з поточними фільтрами
        isVisible(recipe) {
            const shown = this.filteredDrinks.some(drink => drink.id === recipe.id);
            return shown && !(this.onlyNonAlcoholic && recipe.alcohol);
        }
    }
}).mount('#catalog-app');

// ===== Практикум 8: форма додавання рецепта (передає дані в стан Vue) =====

const addForm = document.querySelector('#add-recipe-form');
const nameInput = document.querySelector('#recipe-name');
const typeSelect = document.querySelector('#recipe-type');
const timeInput = document.querySelector('#recipe-time');
const alcoholCheckbox = document.querySelector('#recipe-alcohol');
const timeError = document.querySelector('#time-error');
const addMessage = document.querySelector('#add-message');

// Перевірка часу приготування: 0 або від'ємне значення - власне повідомлення
function validateTime() {
    const value = timeInput.value;

    if (value !== '' && Number(value) <= 0) {
        timeInput.setCustomValidity('Час приготування має бути більшим за 0 хвилин');
    } else {
        timeInput.setCustomValidity('');   // повертаємо поле в коректний стан
    }

    timeError.textContent = timeInput.validationMessage;
}

// Перевірка назви: поле не може складатися лише з пробілів
function validateName() {
    if (nameInput.value !== '' && nameInput.value.trim() === '') {
        nameInput.setCustomValidity('Назва не може складатися лише з пробілів');
    } else {
        nameInput.setCustomValidity('');
    }
}

nameInput.addEventListener('input', validateName);
timeInput.addEventListener('input', validateTime);

// Подія submit форми додавання: новий рецепт потрапляє в реактивний стан Vue
addForm.addEventListener('submit', event => {
    event.preventDefault();   // без цього сторінка перезавантажиться

    validateName();
    validateTime();
    if (!addForm.checkValidity()) {
        addForm.reportValidity();
        return;
    }

    const typeKey = typeSelect.value;
    const newRecipe = {
        id: Date.now(),   // унікальний id для :key у v-for
        name: nameInput.value.trim(),
        type: typeLabels[typeKey],
        typeKey: typeKey,
        alcohol: alcoholCheckbox.checked,
        timeMinutes: Number(timeInput.value),
        difficulty: null,
        image: null,
        alt: '',
        color: typeColors[typeKey],   // колір напою для анімації «наливання»
        ingredients: [],
        steps: []
    };

    catalogApp.addRecipe(newRecipe);
    console.log('Додано новий рецепт:', newRecipe);

    addMessage.textContent = catalogApp.isVisible(newRecipe)
        ? `Рецепт «${newRecipe.name}» додано до каталогу`
        : `Рецепт «${newRecipe.name}» додано, але він прихований поточним фільтром`;

    addForm.reset();
    timeError.textContent = '';
});

// ===== Практикум 9: отримання рецептів із зовнішнього API =====

const apiForm = document.querySelector('#api-search-form');
const apiSearchInput = document.querySelector('#api-search');
const apiSearchButton = document.querySelector('#api-search-btn');
const apiReloadButton = document.querySelector('#api-reload-btn');
const apiLoading = document.querySelector('#api-loading');
const apiError = document.querySelector('#api-error');
const apiList = document.querySelector('#api-list');

// Останній пошуковий запит - для кнопки «Оновити»
let lastQuery = apiSearchInput.value.trim();

// Створює картку коктейлю з API (ручний DOM-рендер лише для секції API)
function createApiCard(drink) {
    const card = document.createElement('article');
    card.classList.add('recipe-card');
    if (drink.strAlcoholic === 'Non alcoholic') {
        card.classList.add('non-alcoholic');
    }

    const image = document.createElement('img');
    image.classList.add('recipe-card_image');
    image.src = drink.strDrinkThumb;
    image.alt = `Коктейль ${drink.strDrink}`;

    const content = document.createElement('div');
    content.classList.add('recipe-card_content');

    const type = document.createElement('p');
    type.classList.add('recipe-badge', 'recipe-badge--cocktail');
    type.textContent = 'Коктейль';

    const title = document.createElement('h3');
    title.classList.add('recipe-card_title');
    title.textContent = drink.strDrink;

    const instructions = document.createElement('p');
    instructions.classList.add('recipe-card_instructions');
    instructions.textContent = drink.strInstructions;

    // Кнопка «Зберегти рецепт» (практикум 11): запис рецепта в локальне сховище
    const actions = document.createElement('p');
    actions.classList.add('recipe-card_actions');
    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.classList.add('btn', 'btn--small', 'save-btn');
    saveButton.dataset.id = drink.idDrink;
    setSaveButtonLabel(saveButton);
    saveButton.addEventListener('click', () => saveCocktail(drink));
    actions.append(saveButton);

    content.append(type, title, instructions, actions);
    card.append(image, content);
    return card;
}

// Виводить список коктейлів з API або повідомлення, якщо список порожній
function renderApiCocktails(drinksList, emptyText) {
    apiList.innerHTML = '';

    if (drinksList.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.classList.add('recipes-empty');
        emptyMessage.textContent = emptyText;
        apiList.append(emptyMessage);
        return;
    }

    for (const drink of drinksList) {
        apiList.append(createApiCard(drink));
    }
}

// Показує або ховає стан завантаження і блокує кнопки на час запиту
function setApiLoading(isLoading) {
    apiLoading.hidden = !isLoading;
    apiSearchButton.disabled = isLoading;
    apiReloadButton.disabled = isLoading;
}

// Виводить зрозуміле повідомлення про помилку (або ховає його, якщо текст порожній)
function showApiError(message) {
    apiError.textContent = message;
    apiError.hidden = message === '';
}

/*
 * Завантаження коктейлів за назвою з TheCocktailDB:
 * https://www.thecocktaildb.com/api.php
 * Ендпоінт: https://www.thecocktaildb.com/api/json/v1/1/search.php?s=<назва>
 */
async function loadCocktails(query) {
    lastQuery = query;
    showApiError('');
    setApiLoading(true);

    try {
        const response = await fetch(`${API_URL}?s=${encodeURIComponent(query)}`);

        // fetch не вважає 404/500 помилкою, тому статус перевіряємо вручну
        if (!response.ok) {
            throw new Error(`Сервер TheCocktailDB відповів кодом ${response.status}`);
        }

        const data = await response.json();
        console.log('Відповідь TheCocktailDB:', data);

        // Якщо нічого не знайдено, API повертає { drinks: null }
        if (data.drinks === null || !Array.isArray(data.drinks)) {
            renderApiCocktails([], 'Рецептів за такою назвою не знайдено');
            return;
        }

        renderApiCocktails(data.drinks, '');
    } catch (error) {
        apiList.innerHTML = '';
        if (error instanceof TypeError) {
            // fetch відхиляє Promise, коли запит не дійшов до сервера (немає з'єднання)
            showApiError('Не вдалося завантажити рецепти. Перевірте з\'єднання з інтернетом і натисніть «Оновити».');
        } else {
            showApiError('Сервіс рецептів тимчасово недоступний. Спробуйте пізніше.');
        }
        console.error('Помилка запиту до TheCocktailDB:', error);
    } finally {
        setApiLoading(false);   // ховаємо завантаження і за успіху, і за помилки
    }
}

// Подія submit форми пошуку: новий запит до API без перезавантаження сторінки
apiForm.addEventListener('submit', event => {
    event.preventDefault();

    const query = apiSearchInput.value.trim();
    if (query === '') {
        showApiError('Введіть назву коктейлю для пошуку.');
        return;
    }

    loadCocktails(query);
});

// Кнопка «Оновити»: повторює останній запит, наприклад після збою мережі
apiReloadButton.addEventListener('click', () => {
    loadCocktails(lastQuery);
});

// ===== Практикум 11: збережені рецепти (localStorage → IndexedDB) =====

const savedStatus = document.querySelector('#saved-status');
const savedError = document.querySelector('#saved-error');
const savedList = document.querySelector('#saved-list');

// id збережених рецептів - щоб кнопка на картці API знала, що рецепт уже збережено
let savedIds = new Set();

// ----- Модель даних -----

// Збирає список інгредієнтів з полів strIngredient1..15 і strMeasure1..15
function getIngredients(drink) {
    const ingredients = [];
    for (let i = 1; i <= 15; i++) {
        const ingredient = drink[`strIngredient${i}`];
        if (!ingredient) continue;
        const measure = drink[`strMeasure${i}`];
        ingredients.push(measure ? `${measure.trim()} ${ingredient}` : ingredient);
    }
    return ingredients;
}

// Перетворює коктейль з API на запис для сховища: id, name, ingredients, instructions
function toSavedRecipe(drink) {
    return {
        id: drink.idDrink,
        name: drink.strDrink,
        ingredients: getIngredients(drink),
        instructions: drink.strInstructions,
        image: drink.strDrinkThumb,
        savedAt: new Date().toISOString()
    };
}

// ----- localStorage (етап 1) -----

// Зберігає масив рецептів у localStorage як JSON-рядок
function saveToLocalStorage(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// Читає масив рецептів з localStorage; пошкоджені дані не «ламають» застосунок
function loadFromLocalStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const items = raw ? JSON.parse(raw) : [];
        return Array.isArray(items) ? items : [];
    } catch (error) {
        console.error('Пошкоджені дані в localStorage:', error);
        return [];
    }
}

// ----- IndexedDB (етап 2) -----

let dbPromise = null;

// Відкриває базу DrinksCatalogDB; сховище cocktails створюється лише в onupgradeneeded
function openDB() {
    if (dbPromise) {
        return dbPromise;
    }

    dbPromise = new Promise((resolve, reject) => {
        if (!('indexedDB' in window)) {
            reject(new Error('IndexedDB не підтримується цим браузером'));
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = event => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    // якщо відкрити базу не вдалося, наступний виклик спробує ще раз
    dbPromise.catch(() => {
        dbPromise = null;
    });

    return dbPromise;
}

// Записує рецепт у сховище: put створює новий запис або оновлює наявний з тим самим id
async function putItem(item) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(item);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// Create: додає новий рецепт
async function addItem(item) {
    return putItem(item);
}

// Update: оновлює вже збережений рецепт (той самий id - без дубліката)
async function updateItem(item) {
    return putItem(item);
}

// Read: повертає всі збережені рецепти
async function getAllItems() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const request = tx.objectStore(STORE_NAME).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Delete: видаляє рецепт за id
async function deleteItem(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// Одноразова міграція: якщо сховище порожнє, а в localStorage є рецепти - переносимо їх
async function migrateFromLocalStorage() {
    if (localStorage.getItem(MIGRATION_FLAG) === 'true') {
        return;
    }

    const oldItems = loadFromLocalStorage();
    if (oldItems.length === 0) {
        return;
    }

    const currentItems = await getAllItems();
    if (currentItems.length === 0) {
        for (const item of oldItems) {
            await addItem(item);
        }
        console.log(`Міграція: перенесено ${oldItems.length} рецепт(ів) з localStorage в IndexedDB`);
    }

    localStorage.setItem(MIGRATION_FLAG, 'true');
}

// ----- Спільні функції для обох сховищ -----

async function getSavedRecipes() {
    return USE_INDEXEDDB ? getAllItems() : loadFromLocalStorage();
}

async function storeRecipe(recipe, isUpdate) {
    if (USE_INDEXEDDB) {
        return isUpdate ? updateItem(recipe) : addItem(recipe);
    }

    const items = loadFromLocalStorage().filter(item => item.id !== recipe.id);
    items.push(recipe);
    saveToLocalStorage(items);
}

async function removeRecipe(id) {
    if (USE_INDEXEDDB) {
        return deleteItem(id);
    }

    saveToLocalStorage(loadFromLocalStorage().filter(item => item.id !== id));
}

// ----- Інтерфейс -----

function showSavedError(message) {
    savedError.textContent = message;
    savedError.hidden = message === '';
}

// Текст кнопки на картці API залежить від того, чи рецепт уже збережено
function setSaveButtonLabel(button) {
    button.textContent = savedIds.has(button.dataset.id) ? '🔄 Оновити збережений' : '💾 Зберегти рецепт';
}

function updateSaveButtons() {
    for (const button of apiList.querySelectorAll('.save-btn')) {
        setSaveButtonLabel(button);
    }
}

// Створює картку збереженого рецепта
function createSavedCard(recipe) {
    const card = document.createElement('article');
    card.classList.add('recipe-card', 'saved-card');

    const image = document.createElement('img');
    image.classList.add('recipe-card_image');
    image.src = recipe.image;
    image.alt = `Коктейль ${recipe.name}`;
    // без інтернету фото не завантажиться - показуємо заглушку замість «битої» картинки
    image.addEventListener('error', () => {
        const placeholder = document.createElement('div');
        placeholder.classList.add('recipe-card_image', 'recipe-card_image--placeholder');
        placeholder.setAttribute('role', 'img');
        placeholder.setAttribute('aria-label', `Немає фото: ${recipe.name}`);
        placeholder.textContent = '🍹';
        image.replaceWith(placeholder);
    });

    const content = document.createElement('div');
    content.classList.add('recipe-card_content');

    const badge = document.createElement('p');
    badge.classList.add('recipe-badge', 'recipe-badge--saved');
    badge.textContent = 'Збережено';

    const title = document.createElement('h3');
    title.classList.add('recipe-card_title');
    title.textContent = recipe.name;

    const ingredientsTitle = document.createElement('p');
    ingredientsTitle.classList.add('recipe-card_label');
    ingredientsTitle.textContent = 'Інгредієнти:';

    const ingredientsList = document.createElement('ul');
    ingredientsList.classList.add('saved-ingredients');
    for (const ingredient of recipe.ingredients) {
        const item = document.createElement('li');
        item.textContent = ingredient;
        ingredientsList.append(item);
    }

    const instructions = document.createElement('p');
    instructions.classList.add('recipe-card_instructions');
    instructions.textContent = recipe.instructions;

    const actions = document.createElement('p');
    actions.classList.add('recipe-card_actions');
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.classList.add('btn', 'btn--small', 'btn--danger');
    deleteButton.textContent = '🗑 Видалити';
    deleteButton.addEventListener('click', () => deleteCocktail(recipe));

    // Відкриття збереженого рецепта в панелі деталей з анімацією «наливання» (практикум 12)
    const openButton = document.createElement('button');
    openButton.type = 'button';
    openButton.classList.add('btn', 'btn--small', 'btn--secondary');
    openButton.textContent = '📖 Відкрити';
    openButton.addEventListener('click', () => {
        openRecipeDetails({ ...recipe, color: typeColors.cocktail });
        if (window.innerWidth < 1024) {
            detailsCard.scrollIntoView({ behavior: 'smooth' });
        }
    });

    actions.append(openButton, deleteButton);

    content.append(badge, title, ingredientsTitle, ingredientsList, instructions, actions);
    card.append(image, content);
    return card;
}

function renderSavedRecipes(items) {
    savedList.innerHTML = '';
    const storageName = USE_INDEXEDDB ? 'IndexedDB' : 'localStorage';
    savedStatus.textContent = `Збережено рецептів: ${items.length} (сховище: ${storageName})`;

    if (items.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.classList.add('recipes-empty');
        emptyMessage.textContent = 'Ви ще не зберегли жодного рецепта. Натисніть «Зберегти рецепт» на картці з пошуку.';
        savedList.append(emptyMessage);
        return;
    }

    for (const recipe of items) {
        savedList.append(createSavedCard(recipe));
    }
}

// Перечитує рецепти зі сховища і перемальовує список (після кожної CRUD-операції)
async function refreshSaved() {
    const items = await getSavedRecipes();
    items.sort((a, b) => b.savedAt.localeCompare(a.savedAt));   // нові - першими
    savedIds = new Set(items.map(item => item.id));
    renderSavedRecipes(items);
    updateSaveButtons();
}

// Зберігає (або оновлює) рецепт з картки API
async function saveCocktail(drink) {
    const recipe = toSavedRecipe(drink);
    const isUpdate = savedIds.has(recipe.id);

    try {
        await storeRecipe(recipe, isUpdate);
        console.log(`${isUpdate ? 'Оновлено' : 'Збережено'} рецепт «${recipe.name}»:`, recipe);
        showSavedError('');
        await refreshSaved();
    } catch (error) {
        showSavedError('Не вдалося зберегти рецепт. Спробуйте ще раз.');
        console.error('Помилка збереження рецепта:', error);
    }
}

// Видаляє рецепт зі сховища
async function deleteCocktail(recipe) {
    try {
        await removeRecipe(recipe.id);
        console.log(`Видалено рецепт «${recipe.name}»`);
        await refreshSaved();
    } catch (error) {
        showSavedError('Не вдалося видалити рецепт. Спробуйте ще раз.');
        console.error('Помилка видалення рецепта:', error);
    }
}

// Запуск: відкриття бази, міграція і перше читання збережених рецептів
async function initSavedRecipes() {
    try {
        if (USE_INDEXEDDB) {
            await openDB();
            await migrateFromLocalStorage();
        }
        await refreshSaved();
        console.log(`Збережені рецепти завантажено (сховище: ${USE_INDEXEDDB ? 'IndexedDB' : 'localStorage'})`);
    } catch (error) {
        savedStatus.textContent = '';
        showSavedError('Збережені рецепти недоступні: браузер не дозволяє використовувати локальну базу даних (наприклад, у режимі приватного перегляду).');
        console.error('Помилка відкриття IndexedDB:', error);
    }
}

// ===== Практикум 12: анімація «наливання» напою при відкритті картки рецепта =====

const detailsCard = document.querySelector('#recipe-details');
const detailsGlass = document.querySelector('#details-glass');
const detailsLiquid = detailsGlass.querySelector('.glass_liquid');
const detailsHint = document.querySelector('#details-hint');
const detailsName = document.querySelector('#details-name');
const detailsBody = document.querySelector('#details-body');

// Тривалість наливання залежить від часу приготування напою: від 1 до 2.5 секунди
function getPourDuration(recipe) {
    if (!recipe.timeMinutes) {
        return 1.8;
    }
    return Math.min(2.5, Math.max(1, recipe.timeMinutes / 6));
}

// Створює заголовок і список (ul чи ol) для панелі деталей
function createDetailsList(titleText, items, listTag) {
    const fragment = document.createDocumentFragment();

    const title = document.createElement('p');
    title.classList.add('details-card_text');
    const strong = document.createElement('strong');
    strong.textContent = titleText;
    title.append(strong);

    const list = document.createElement(listTag);
    list.classList.add(listTag === 'ul' ? 'details-card_list' : 'details-card_steps');
    for (const item of items) {
        const li = document.createElement('li');
        li.textContent = item;
        list.append(li);
    }

    fragment.append(title, list);
    return fragment;
}

// Заповнює панель даними рецепта (назва, інгредієнти, кроки чи інструкція)
function renderRecipeDetails(recipe) {
    detailsHint.hidden = true;
    detailsName.hidden = false;
    detailsName.textContent = recipe.name;
    detailsBody.innerHTML = '';

    if (recipe.ingredients && recipe.ingredients.length > 0) {
        detailsBody.append(createDetailsList('Інгредієнти:', recipe.ingredients, 'ul'));
    } else {
        const noIngredients = document.createElement('p');
        noIngredients.classList.add('details-card_text');
        noIngredients.textContent = 'Інгредієнти для цього рецепта ще не вказано.';
        detailsBody.append(noIngredients);
    }

    if (recipe.steps && recipe.steps.length > 0) {
        detailsBody.append(createDetailsList('Кроки приготування:', recipe.steps, 'ol'));
    } else if (recipe.instructions) {
        const title = document.createElement('p');
        title.classList.add('details-card_text');
        const strong = document.createElement('strong');
        strong.textContent = 'Приготування:';
        title.append(strong);

        const text = document.createElement('p');
        text.classList.add('details-card_text');
        text.textContent = recipe.instructions;
        detailsBody.append(title, text);
    }
}

// Запускає анімацію «наливання» з нуля: колір і тривалість беруться з даних рецепта
function pourDrink(recipe) {
    detailsGlass.style.setProperty('--drink-color', recipe.color || typeColors.cocktail);
    detailsGlass.style.setProperty('--pour-duration', `${getPourDuration(recipe)}s`);

    // миттєво (без transition) спорожнюємо келих і змушуємо браузер застосувати
    // цей стан (reflow), інакше наливання не почнеться заново для того самого елемента
    detailsGlass.classList.add('glass--reset');
    detailsGlass.classList.remove('glass--filled', 'glass--pouring');
    void detailsGlass.offsetWidth;
    detailsGlass.classList.remove('glass--reset');

    detailsGlass.classList.add('glass--pouring', 'glass--filled');
    console.log(`Наливаємо «${recipe.name}» (${getPourDuration(recipe)} с)`);
}

// Коли рідина «налилася», струмінь зникає - анімація завершується
detailsLiquid.addEventListener('transitionend', event => {
    if (event.propertyName === 'transform' && detailsGlass.classList.contains('glass--filled')) {
        detailsGlass.classList.remove('glass--pouring');
        console.log('Напій налито');
    }
});

// Відкриття картки рецепта: дані + анімація
function openRecipeDetails(recipe) {
    renderRecipeDetails(recipe);
    pourDrink(recipe);
}

initSavedRecipes();
loadCocktails(lastQuery);