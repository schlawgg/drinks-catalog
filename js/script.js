console.log('script.js підключено');

// Дані варіанта 15: масив рецептів напоїв (з практикумів 6-7)
const recipes = [
    {
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
        name: 'Піна колада',
        type: 'Коктейль',
        typeKey: 'cocktail',
        alcohol: true,
        timeMinutes: 8,
        difficulty: 'Середня',
        image: 'assets/img/pina-colada.jpg',
        alt: 'Коктейль піна колада зі шматочком ананаса'
    }
    
];

// Назви типів напоїв для значень select
const typeLabels = {
    hot: 'Гарячий напій',
    cold: 'Холодний напій',
    cocktail: 'Коктейль'
};

// Контейнер для карток рецептів та елемент підсумку
const listContainer = document.querySelector('#drinks-list');
const drinksCount = document.querySelector('#drinks-count');

// Елементи форми фільтра
const filterForm = document.querySelector('#filter-form');
const categorySelect = document.querySelector('#drink-category');
const searchInput = document.querySelector('#search-input');
const onlyNonAlcoholicCheckbox = document.querySelector('#only-non-alcoholic');

// Елементи форми додавання рецепта
const addForm = document.querySelector('#add-recipe-form');
const nameInput = document.querySelector('#recipe-name');
const typeSelect = document.querySelector('#recipe-type');
const timeInput = document.querySelector('#recipe-time');
const alcoholCheckbox = document.querySelector('#recipe-alcohol');
const timeError = document.querySelector('#time-error');
const addMessage = document.querySelector('#add-message');

// Видалення статичної картки-заглушки з практикуму 2
const staticCard = document.querySelector('.recipe-card--static');
if (staticCard !== null) {
    staticCard.remove();
}

// Стрілкова функція з практикуму 6: чи готується напій швидко (до 5 хв)
const isQuick = time => time <= 5;

// Створює DOM-елемент article з карткою одного рецепта
function createRecipeCard(recipe) {
    const card = document.createElement('article');
    card.classList.add('recipe-card');
    card.dataset.time = recipe.timeMinutes;   // атрибут data-time

    // Умовний клас: безалкогольні напої
    if (!recipe.alcohol) {
        card.classList.add('non-alcoholic');
    }

    // Фото рецепта або заглушка, якщо рецепт додано через форму без фото
    let image;
    if (recipe.image) {
        image = document.createElement('img');
        image.src = recipe.image;
        image.alt = recipe.alt;
    } else {
        image = document.createElement('div');
        image.classList.add('recipe-card_image--placeholder');
        image.setAttribute('role', 'img');
        image.setAttribute('aria-label', `Немає фото: ${recipe.name}`);
        image.textContent = '🍹';
    }
    image.classList.add('recipe-card_image');

    const content = document.createElement('div');
    content.classList.add('recipe-card_content');

    const type = document.createElement('p');
    type.classList.add('recipe-badge', `recipe-badge--${recipe.typeKey}`);
    type.textContent = recipe.type;

    const title = document.createElement('h3');
    title.classList.add('recipe-card_title');
    title.textContent = recipe.name;

    const time = document.createElement('p');
    time.classList.add('recipe-card_info');
    const timeValue = document.createElement('strong');
    timeValue.textContent = `${recipe.timeMinutes} хв`;
    time.append('⏳ Час: ', timeValue);
    if (isQuick(recipe.timeMinutes)) {
        time.append(' (швидко)');
    }

    content.append(type, title, time);

    // Складність показується лише тоді, коли вона відома
    if (recipe.difficulty) {
        const difficulty = document.createElement('p');
        difficulty.classList.add('recipe-card_info');
        const difficultyValue = document.createElement('span');
        difficultyValue.textContent = recipe.difficulty;
        difficulty.append('📊 Складність: ', difficultyValue);
        content.append(difficulty);
    }

    const linkWrapper = document.createElement('p');
    const link = document.createElement('a');
    link.classList.add('recipe-card_link');
    link.setAttribute('href', '#recipe-details');
    link.textContent = 'Детальніше';
    linkWrapper.append(link);

    content.append(linkWrapper);
    card.append(image, content);
    return card;
}

// Рендер списку: очищає контейнер і додає в нього картку для кожного рецепта
function renderRecipes(recipesList) {
    listContainer.innerHTML = '';

    if (recipesList.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.classList.add('recipes-empty');
        emptyMessage.textContent = 'За обраними умовами рецептів не знайдено';
        listContainer.append(emptyMessage);
        return;
    }

    for (const recipe of recipesList) {
        const card = createRecipeCard(recipe);
        listContainer.append(card);
    }
}

// Підрахунок безалкогольних рецептів і оновлення тексту p#drinks-count
function updateDrinksCount(recipesList) {
    let nonAlcoholicCount = 0;

    for (const recipe of recipesList) {
        if (!recipe.alcohol) {
            nonAlcoholicCount++;
        }
    }

    drinksCount.textContent = `Безалкогольних рецептів: ${nonAlcoholicCount} з ${recipesList.length}`;
}

// Повертає рецепти, що відповідають фільтрам (тип, пошук, «лише безалкогольні»)
function getFilteredRecipes() {
    const category = categorySelect.value;
    const query = searchInput.value.trim().toLowerCase();
    const onlyNonAlcoholic = onlyNonAlcoholicCheckbox.checked;
    const result = [];

    for (const recipe of recipes) {
        if (category !== 'all' && recipe.typeKey !== category) continue;
        if (query !== '' && !recipe.name.toLowerCase().includes(query)) continue;
        if (onlyNonAlcoholic && recipe.alcohol) continue;
        result.push(recipe);
    }

    return result;
}

// Перемальовує список з урахуванням поточних фільтрів
function applyFilters() {
    renderRecipes(getFilteredRecipes());
}

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

// Подія input на полі назви
nameInput.addEventListener('input', validateName);

// Подія input на полі часу: перевірка на кожну зміну значення
timeInput.addEventListener('input', validateTime);

// Подія change на чекбоксі «Лише безалкогольні»: миттєве перефільтрування списку
onlyNonAlcoholicCheckbox.addEventListener('change', () => {
    applyFilters();
    console.log(`Фільтр «Лише безалкогольні»: ${onlyNonAlcoholicCheckbox.checked ? 'увімкнено' : 'вимкнено'}`);
});

// Подія submit форми фільтра: застосування фільтрів без перезавантаження сторінки
filterForm.addEventListener('submit', event => {
    event.preventDefault();
    applyFilters();
});

// Подія submit форми додавання: новий рецепт у масив і повторний рендер списку
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
        name: nameInput.value.trim(),
        type: typeLabels[typeKey],
        typeKey: typeKey,
        alcohol: alcoholCheckbox.checked,
        timeMinutes: Number(timeInput.value),
        difficulty: null,
        image: null,
        alt: ''
    };

    recipes.push(newRecipe);
    console.log('Додано новий рецепт:', newRecipe);

    updateDrinksCount(recipes);
    applyFilters();

    const isVisible = getFilteredRecipes().includes(newRecipe);
    addMessage.textContent = isVisible
        ? `Рецепт «${newRecipe.name}» додано до каталогу`
        : `Рецепт «${newRecipe.name}» додано, але він прихований поточним фільтром`;

    addForm.reset();
    timeError.textContent = '';
});

renderRecipes(recipes);
updateDrinksCount(recipes);