console.log('script.js підключено');

// Дані варіанта 15: масив рецептів напоїв (розширений масив з практикуму 6)
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

// Контейнер для карток рецептів та елемент підсумку
const listContainer = document.querySelector('#drinks-list');
const drinksCount = document.querySelector('#drinks-count');

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

    const image = document.createElement('img');
    image.classList.add('recipe-card_image');
    image.src = recipe.image;
    image.alt = recipe.alt;

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

    const difficulty = document.createElement('p');
    difficulty.classList.add('recipe-card_info');
    const difficultyValue = document.createElement('span');
    difficultyValue.textContent = recipe.difficulty;
    difficulty.append('📊 Складність: ', difficultyValue);

    const linkWrapper = document.createElement('p');
    const link = document.createElement('a');
    link.classList.add('recipe-card_link');
    link.setAttribute('href', '#recipe-details');
    link.textContent = 'Детальніше';
    linkWrapper.append(link);

    content.append(type, title, time, difficulty, linkWrapper);
    card.append(image, content);
    return card;
}

// Рендер списку: очищає контейнер і додає в нього картку для кожного рецепта
function renderRecipes(recipesList) {
    listContainer.innerHTML = '';

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

renderRecipes(recipes);
updateDrinksCount(recipes);