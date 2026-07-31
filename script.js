// ===============================
// CONFIG
// ===============================

const MENU_URL = "./menu (1).json";

const FORM_URL =
  "https://app.smartsheet.com/b/form/019d520b436a708a860cb9b2a4894e49";


// ===============================
// STATE
// ===============================

let menuItems = [];

let cart = [];

let currentRestaurant = "All";

let currentCategory = "All";


// ===============================
// DOM ELEMENTS
// ===============================

let menuDiv;
let cartDiv;

let tabsDiv;
let categoryTabsDiv;

let clearBtn;
let confirmBtn;

let commentsInput;

let floatingCart;
let cartPanel;
let cartCount;


// ===============================
// INIT
// ===============================

document.addEventListener("DOMContentLoaded", initApp);


async function initApp() {

  menuDiv = document.getElementById("menu");
  cartDiv = document.getElementById("cart");

  tabsDiv = document.getElementById("tabs");
  categoryTabsDiv = document.getElementById("categoryTabs");

  clearBtn = document.getElementById("clearBtn");
  confirmBtn = document.getElementById("confirmBtn");

  commentsInput = document.getElementById("comments");

  floatingCart = document.getElementById("floatingCart");
  cartPanel = document.getElementById("cartPanel");
  cartCount = document.getElementById("cartCount");


  clearBtn.addEventListener("click", () => {

    cart = [];

    renderCart();

  });


  confirmBtn.addEventListener("click", submitOrder);


  if (floatingCart) {

    floatingCart.addEventListener("click", () => {

      cartPanel?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    });

  }


  await loadMenu();

  renderCart();

}


// ===============================
// LOAD MENU
// ===============================

async function loadMenu() {

  try {

    const response = await fetch(MENU_URL);

    if (!response.ok) {

      throw new Error(
        `Menu could not be loaded. HTTP ${response.status}`
      );

    }


    const data = await response.json();


    if (!Array.isArray(data)) {

      throw new Error(
        "menu.json must contain a JSON array."
      );

    }


    // Your menu.json is already flat
    menuItems = data.map((item, index) => ({

      id: index + 1,

      restaurant:
        item.restaurant || "Unknown Restaurant",

      category:
        item.category || "Other",

      name:
        item.name || "Unnamed Item",

      description:
        item.description || "",

      price:
        item.price || "",

      img:
        item.img
          ? `./${item.img}`
          : ""

    }));


    initRestaurantTabs();

    initCategoryTabs();

    renderMenu();


  } catch (error) {

    console.error(error);

    menuDiv.innerHTML = `
      <div class="error-message">
        <h3>⚠️ Menu unavailable</h3>
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;

  }

}


// ===============================
// RESTAURANT TABS
// ===============================

function initRestaurantTabs() {

  const restaurants = [
    "All",
    ...new Set(
      menuItems.map(item => item.restaurant)
    )
  ];


  tabsDiv.innerHTML = restaurants
    .map(restaurant => {

      return `
        <button
          type="button"
          class="${restaurant === currentRestaurant ? "active" : ""}"
          data-restaurant="${escapeAttribute(restaurant)}"
        >
          ${escapeHTML(restaurant)}
        </button>
      `;

    })
    .join("");


  tabsDiv
    .querySelectorAll("button")
    .forEach(button => {

      button.addEventListener("click", () => {

        setRestaurant(
          button.dataset.restaurant
        );

      });

    });

}


// ===============================
// SET RESTAURANT
// ===============================

function setRestaurant(restaurant) {

  currentRestaurant = restaurant;

  // When changing restaurant,
  // reset category to All
  currentCategory = "All";


  tabsDiv
    .querySelectorAll("button")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.restaurant === restaurant
      );

    });


  initCategoryTabs();

  renderMenu();

}


// ===============================
// CATEGORY TABS
// ===============================

function initCategoryTabs() {

  if (!categoryTabsDiv) return;


  let categories;


  if (currentRestaurant === "All") {

    categories = [
      "All",
      ...new Set(
        menuItems.map(item => item.category)
      )
    ];

  } else {

    categories = [
      "All",
      ...new Set(
        menuItems
          .filter(
            item =>
              item.restaurant === currentRestaurant
          )
          .map(item => item.category)
      )
    ];

  }


  categoryTabsDiv.innerHTML = categories
    .map(category => {

      return `
        <button
          type="button"
          class="${category === currentCategory ? "active" : ""}"
          data-category="${escapeAttribute(category)}"
        >
          ${escapeHTML(category)}
        </button>
      `;

    })
    .join("");


  categoryTabsDiv
    .querySelectorAll("button")
    .forEach(button => {

      button.addEventListener("click", () => {

        setCategory(
          button.dataset.category
        );

      });

    });

}


// ===============================
// SET CATEGORY
// ===============================

function setCategory(category) {

  currentCategory = category;


  categoryTabsDiv
    .querySelectorAll("button")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.category === category
      );

    });


  renderMenu();

}


// ===============================
// FILTER MENU
// ===============================

function getFilteredItems() {

  return menuItems.filter(item => {

    const restaurantMatch =
      currentRestaurant === "All" ||
      item.restaurant === currentRestaurant;


    const categoryMatch =
      currentCategory === "All" ||
      item.category === currentCategory;


    return restaurantMatch && categoryMatch;

  });

}


// ===============================
// MENU RENDER
// ===============================

function renderMenu() {

  const filteredItems =
    getFilteredItems();


  if (!filteredItems.length) {

    menuDiv.innerHTML = `
      <div class="no-results">
        <p>No items found.</p>
      </div>
    `;

    return;

  }


  const categories = {};


  filteredItems.forEach(item => {

    if (!categories[item.category]) {

      categories[item.category] = [];

    }

    categories[item.category].push(item);

  });


  menuDiv.innerHTML = Object.entries(categories)
    .map(([category, items]) => {

      return `

        <section class="menu-category">

          ${
            currentCategory === "All"
              ? `
                <h3 class="category-title">
                  ${escapeHTML(category)}
                </h3>
              `
              : ""
          }

          <div class="menu-grid">

            ${items
              .map(renderMenuCard)
              .join("")}

          </div>

        </section>

      `;

    })
    .join("");

}


// ===============================
// MENU CARD
// ===============================

function renderMenuCard(item) {

  const imageHTML = item.img
    ? `
      <img
        src="${escapeAttribute(item.img)}"
        alt="${escapeAttribute(item.name)}"
        loading="lazy"
      >
    `
    : "";


  const restaurantLabel =
    currentRestaurant === "All"
      ? `
        <div class="card-restaurant">
          ${escapeHTML(item.restaurant)}
        </div>
      `
      : "";


  const descriptionHTML =
    item.description
      ? `
        <div class="card-desc">
          ${escapeHTML(item.description)}
        </div>
      `
      : "";


  const priceHTML =
    item.price
      ? `
        <div class="card-price">
          ৳ ${escapeHTML(item.price)}
        </div>
      `
      : `
        <div class="card-price unavailable">
          Price unavailable
        </div>
      `;


  return `

    <div class="card">

      ${imageHTML}

      <div class="card-content">

        ${restaurantLabel}

        <div class="card-title">
          ${escapeHTML(item.name)}
        </div>

        ${descriptionHTML}

        ${priceHTML}


        <div class="actions-row">

          <div class="qty-control">

            <button
              type="button"
              onclick="changeQty(${item.id}, -1)"
            >
              −
            </button>

            <span id="qty-${item.id}">
              1
            </span>

            <button
              type="button"
              onclick="changeQty(${item.id}, 1)"
            >
              +
            </button>

          </div>


          <button
            type="button"
            onclick="addToCart(${item.id})"
          >
            Add
          </button>

        </div>

      </div>

    </div>

  `;

}


// ===============================
// PRODUCT QUANTITY
// ===============================

function changeQty(id, delta) {

  const element =
    document.getElementById(`qty-${id}`);


  if (!element) return;


  const current =
    parseInt(element.textContent, 10) || 1;


  element.textContent =
    Math.max(1, current + delta);

}


// ===============================
// ADD TO CART
// ===============================

function addToCart(id) {

  const item =
    menuItems.find(item => item.id === id);


  if (!item) return;


  const quantityElement =
    document.getElementById(`qty-${id}`);


  const quantity =
    parseInt(
      quantityElement?.textContent,
      10
    ) || 1;


  const existing =
    cart.find(item => item.id === id);


  if (existing) {

    existing.qty += quantity;

  } else {

    cart.push({
      ...item,
      qty: quantity
    });

  }


  if (quantityElement) {

    quantityElement.textContent = "1";

  }


  renderCart();

}


// ===============================
// UPDATE CART QTY
// ===============================

function updateCartQty(id, delta) {

  const item =
    cart.find(item => item.id === id);


  if (!item) return;


  item.qty += delta;


  if (item.qty <= 0) {

    cart =
      cart.filter(item => item.id !== id);

  }


  renderCart();

}


// ===============================
// REMOVE ITEM
// ===============================

function removeItem(id) {

  cart =
    cart.filter(item => item.id !== id);


  renderCart();

}


// ===============================
// CART
// ===============================

function renderCart() {

  updateCartCount();


  if (!cart.length) {

    cartDiv.innerHTML =
      "<p>Your cart is empty.</p>";

    return;

  }


  cartDiv.innerHTML = cart
    .map(item => {

      return `

        <div class="cart-item">

          <div class="cart-left">

            <div class="cart-name">
              ${escapeHTML(item.name)}
            </div>

            <div class="cart-restaurant">
              ${escapeHTML(item.restaurant)}
            </div>

            ${
              item.price
                ? `
                  <div class="cart-price">
                    ৳ ${escapeHTML(item.price)}
                  </div>
                `
                : ""
            }

          </div>


          <div class="cart-right">

            <div class="qty-box">

              <button
                type="button"
                onclick="updateCartQty(${item.id}, -1)"
              >
                −
              </button>

              <span>
                ${item.qty}
              </span>

              <button
                type="button"
                onclick="updateCartQty(${item.id}, 1)"
              >
                +
              </button>

            </div>


            <button
              type="button"
              class="remove-btn"
              onclick="removeItem(${item.id})"
            >
              ❌
            </button>

          </div>

        </div>

      `;

    })
    .join("");

}


// ===============================
// CART COUNT
// ===============================

function updateCartCount() {

  const total =
    cart.reduce(
      (sum, item) => sum + item.qty,
      0
    );


  if (cartCount) {

    cartCount.textContent = total;

  }

}


// ===============================
// SUBMIT ORDER
// ===============================

function submitOrder() {

  if (!cart.length) {

    alert(
      "Please add at least one item to your order."
    );

    return;

  }


  const items = cart
    .map(item =>
      `${item.name}(${item.qty})`
    )
    .join("|");


  const restaurants = [
    ...new Set(
      cart.map(item => item.restaurant)
    )
  ].join(", ");


  const comments =
    commentsInput?.value?.trim() || "";


  const url =
    `${FORM_URL}?Item=${encodeURIComponent(items)}` +
    `&Restaurant=${encodeURIComponent(restaurants)}` +
    `&Comments=${encodeURIComponent(comments)}`;


  window.open(url, "_blank");

}


// ===============================
// HELPERS
// ===============================

function escapeHTML(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function escapeAttribute(value) {

  return escapeHTML(value);

}
