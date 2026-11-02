// 1. Навигация (делегирование): активная ссылка меню
const nav = document.querySelector(".nav");

nav.addEventListener("click", function (event) {
  const link = event.target.closest("a");
  if (link === null) {
    return;
  }

  nav.querySelectorAll("a").forEach(function (item) {
    item.classList.remove("active");
  });
  link.classList.add("active");
});

// 2. Карточки возможностей (делегирование): переключение класса selected
const featuresGrid = document.querySelector(".features-grid");

featuresGrid.addEventListener("click", function (event) {
  if (event.target.closest(".add-fav-btn") !== null) {
    return;
  }

  const card = event.target.closest(".feature-card");
  if (card === null) {
    return;
  }
  card.classList.toggle("selected");
});

// 3. Избранное: создание и удаление элементов
const FAVORITES_KEY = "nutrio-favorites";
const favoritesList = document.querySelector("#favorites-list");
const favoritesEmpty = document.querySelector("#favorites-empty");

function updateFavoritesEmpty() {
  favoritesEmpty.hidden = favoritesList.children.length > 0;
}

function saveFavorites() {
  const titles = Array.from(favoritesList.children).map(function (li) {
    return li.dataset.title;
  });
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(titles));
}

function addFavorite(title) {
  const exists = Array.from(favoritesList.children).some(function (li) {
    return li.dataset.title === title;
  });
  if (exists) {
    return;
  }

  const li = document.createElement("li");
  li.dataset.title = title;

  const text = document.createElement("span");
  text.textContent = title;

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "fav-delete";
  deleteBtn.textContent = "✕";
  deleteBtn.setAttribute("aria-label", "Удалить из избранного");
  deleteBtn.addEventListener("click", function () {
    li.remove();
    updateFavoritesEmpty();
    saveFavorites();
  });

  li.append(text, deleteBtn);
  favoritesList.appendChild(li);
  updateFavoritesEmpty();
  saveFavorites();
}

featuresGrid.addEventListener("click", function (event) {
  const addBtn = event.target.closest(".add-fav-btn");
  if (addBtn === null) {
    return;
  }
  addFavorite(addBtn.closest(".feature-card").querySelector("h3").textContent);
});

// Улучшение 1: избранное сохраняется в localStorage и восстанавливается при загрузке
try {
  const savedFavorites = JSON.parse(localStorage.getItem(FAVORITES_KEY));
  if (Array.isArray(savedFavorites)) {
    savedFavorites.forEach(addFavorite);
  }
} catch (error) {
  localStorage.removeItem(FAVORITES_KEY);
}
updateFavoritesEmpty();

// 4. Промо-таймер: обратный отсчёт от 5 минут
const promoTimer = document.querySelector("#promo-timer");
const badge = document.querySelector(".badge");
let secondsLeft = 300;

function formatTime(total) {
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return minutes + ":" + seconds;
}

promoTimer.textContent = formatTime(secondsLeft);

const promoTimerId = setInterval(function () {
  secondsLeft--;
  promoTimer.textContent = formatTime(secondsLeft);

  if (secondsLeft <= 0) {
    clearInterval(promoTimerId);
    badge.textContent = "Акция завершена";
  }
}, 1000);

// 5. Валидация формы
const form = document.querySelector(".form");
const formStatus = document.querySelector("#form-status");
const FORM_KEY = "nutrio-form";
const FORM_TTL = 10 * 60 * 1000; 
const nameInput = document.querySelector("#name");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const phoneInput = document.querySelector("#phone");

function showStatus(message, isError) {
  formStatus.textContent = message;
  formStatus.classList.toggle("form-status--error", isError);
  formStatus.classList.toggle("form-status--success", !isError);
}

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const textFields = [
    { id: "name", label: "Имя" },
    { id: "email", label: "Email" },
    { id: "password", label: "Пароль" },
    { id: "phone", label: "Телефон" }
  ];

  for (const field of textFields) {
    const input = document.querySelector("#" + field.id);
    if (input.value.trim() === "") {
      showStatus("Заполните поле «" + field.label + "»", true);
      input.focus();
      return;
    }
  }

  // Улучшение 2: проверка формата email, пароля и телефона
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim())) {
    showStatus("Введите корректный email, например you@example.com", true);
    emailInput.focus();
    return;
  }
  if (passwordInput.value.length < 8) {
    showStatus("Пароль должен быть не короче 8 символов", true);
    passwordInput.focus();
    return;
  }
  if (!/^\+?[0-9\s\-()]{10,18}$/.test(phoneInput.value.trim())) {
    showStatus("Введите корректный телефон, например +7 900 000-00-00", true);
    phoneInput.focus();
    return;
  }

  if (document.querySelector('input[name="goal"]:checked') === null) {
    showStatus("Выберите цель", true);
    return;
  }
  if (document.querySelector('input[name="period"]:checked') === null) {
    showStatus("Выберите формат меню", true);
    return;
  }

  showStatus("Заявка отправлена! Мы подберём меню и свяжемся с вами.", false);

  // 6. Сохранение данных формы (пароль в localStorage не храним)
  const formData = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    phone: phoneInput.value.trim()
  };
  localStorage.setItem(FORM_KEY, JSON.stringify({ savedAt: Date.now(), data: formData }));
});

form.addEventListener("input", function () {
  formStatus.textContent = "";
});

// 6. Подстановка сохранённых данных при загрузке страницы
try {
  const saved = JSON.parse(localStorage.getItem(FORM_KEY));
  if (saved !== null && Date.now() - saved.savedAt < FORM_TTL) {
    nameInput.value = saved.data.name || "";
    emailInput.value = saved.data.email || "";
    phoneInput.value = saved.data.phone || "";
  } else {
    localStorage.removeItem(FORM_KEY);
  }
} catch (error) {
  localStorage.removeItem(FORM_KEY);
}

// 7. Отзыв с сервера
const reviewContent = document.querySelector("#review-content");
const loadReviewBtn = document.querySelector("#load-review-btn");

loadReviewBtn.addEventListener("click", async function () {
  loadReviewBtn.disabled = true;
  reviewContent.textContent = "Загрузка...";

  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/comments?_limit=1");
    if (!response.ok) {
      throw new Error("Ошибка сервера: " + response.status);
    }

    const data = await response.json();
    const review = data[0];
    if (!review) {
      throw new Error("Отзыв не найден");
    }

    const text = document.createElement("p");
    text.className = "review-text";
    text.textContent = review.body;

    const author = document.createElement("p");
    author.className = "review-author";
    author.textContent = review.email;

    reviewContent.textContent = "";
    reviewContent.append(text, author);
  } catch (error) {
    console.log(error);
    reviewContent.textContent = "Не удалось загрузить отзыв. Проверьте соединение и попробуйте ещё раз.";
  } finally {
    loadReviewBtn.disabled = false;
  }
});