console.log('script.js підключено');

/*
 * Практикум 10. Обраний фреймворк: Vue 3 (підключено через CDN).
 * Причина вибору: Vue підключається одним тегом <script> без Babel, а шаблони
 * пишуться звичайним HTML з директивами, тож наявну розмітку каталогу легко перенести.
 */

// Адреса пошуку коктейлів у TheCocktailDB (тестовий ключ «1», реєстрація не потрібна)
const API_URL = 'https://www.thecocktaildb.com/api/json/v1/1/search.php';

// Назви типів напоїв для значень select форми додавання
const typeLabels = {
    hot: 'Гарячий напій',
    cold: 'Холодний напій',
    cocktail: 'Коктейль'
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
                <p><a href="#recipe-details" class="recipe-card_link">Детальніше</a></p>
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
                    alt: 'Чашка гарячого капучино'
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
                    alt: 'Склянка холодного мохіто'
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
                    alt: 'Зелений чай матча'
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
                    alt: 'Келих гарячого глінтвейну з апельсином і корицею'
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
                    alt: 'Глечик лимонаду з імбиром і скибочками лимона'
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
                    alt: 'Коктейль піна колада зі шматочком ананаса'
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
        alt: ''
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

    content.append(type, title, instructions);
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

loadCocktails(lastQuery);