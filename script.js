// ===============================
// CONFIG
// ===============================

const MENU_URL = "./menu.json";

const FORM_URL =
  "https://app.smartsheet.com/b/form/019d520b436a708a860cb9b2a4894e49";


// ===============================
// STATE
// ===============================

let menuItems = [];
let cart = [];
let currentRestaurant = "All";


// ===============================
// DOM ELEMENTS
// ===============================

let menuDiv;
let cartDiv;
let tabsDiv;
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

  clearBtn = document.getElementById("clearBtn");
  confirmBtn = document.getElementById("confirmBtn");

  commentsInput = document.getElementById("comments");

  floatingCart = document.getElementById("floatingCart");
  cartPanel = document.getElementById("cartPanel");
  cartCount = document.getElementById("cartCount");


  // Clear cart
  clearBtn.addEventListener("click", () => {

    cart = [];

    renderCart();

  });


  // Submit order
  confirmBtn.addEventListener("click", submitOrder);


  // Floating cart
  floatingCart.addEventListener("click", () => {

    cartPanel.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  });


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


    // Your JSON is already a flat array
    if (!Array.isArray(data)) {

      throw new Error(
        "menu.json must contain an array of menu items."
      );

    }


    // Generate IDs because your JSON does not contain IDs
    menuItems = data.map((item, index) => ({

      id: index + 1,

      restaurant: item.restaurant || "Unknown Restaurant",

      category: item.category || "Other",

      name: item.name || "Unnamed Item",

      description: item.description || "",

      price: item.price || "",

      img: item.img
        ? `./${item.img}`
        : ""

    }));


    initTabs();

    renderMenu();


  } catch (error) {

    console.error("Menu loading error:", error);

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

function initTabs() {

  const restaurants = [
    "All",
    ...new Set(
      menuItems.map(item => item.restaurant)
    )
  ];


  tabsDiv.innerHTML = restaurants
    .map((restaurant, index) => {

      return `
        <button
          class="${index === 0 ? "active" : ""}"
          data-restaurant="${escapeAttribute(restaurant)}"
        >
          ${escapeHTML(restaurant)}
        </button>
      `;

    })
    .join("");


  // Add click events
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
// CHANGE RESTAURANT
// ===============================

function setRestaurant(restaurant) {

  currentRestaurant = restaurant;


  tabsDiv
    .querySelectorAll("button")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.restaurant === restaurant
      );

    });


  renderMenu();

}


// ===============================
// MENU RENDER
// ===============================

function renderMenu() {

  let filteredItems = menuItems.filter(item =>

    currentRestaurant === "All" ||
    item.restaurant === currentRestaurant

  );


  if (!filteredItems.length) {

    menuDiv.innerHTML = `
      <p>No menu items available.</p>
    `;

    return;
  }


  // Group items by category
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

          <h3 class="category-title">
            ${escapeHTML(category)}
          </h3>

          <div class="menu-grid">

            ${items.map(renderMenuCard).join("")}

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

  const priceText = item.price
    ? `৳ ${escapeHTML(item.price)}`
    : "Price unavailable";


  const imageHTML = item.img
    ? `
      <img
        src="${escapeAttribute(item.img)}"
        alt="${escapeAttribute(item.name)}"
        loading="lazy"
      >
    `
    : "";


  return `
    <div class="card">

      ${imageHTML}

      <div class="card-content">

        <div class="card-title">
          ${escapeHTML(item.name)}
        </div>

        ${
          item.description
            ? `
              <div class="card-desc">
                ${escapeHTML(item.description)}
              </div>
            `
            : ""
        }

        <div class="card-price">
          ${priceText}
        </div>


        <div class="actions-row">

          <div class="qty-control">

            <button
              type="button"
              onclick="changeQty(${item.id}, -1)"
            >
              -
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


  const newValue =
    Math.max(1, current + delta);


  element.textContent = newValue;

}


// ===============================
// ADD TO CART
// ===============================

function addToCart(id) {

  const item =
    menuItems.find(item => item.id === id);


  if (!item) return;


  const qtyElement =
    document.getElementById(`qty-${id}`);


  const quantity =
    parseInt(
      qtyElement?.textContent,
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


  // Reset product quantity
  if (qtyElement) {
    qtyElement.textContent = "1";
  }


  renderCart();

}


// ===============================
// UPDATE CART QUANTITY
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
// CART RENDER
// ===============================

function renderCart() {

  updateCartCount();


  if (!cart.length) {

    cartDiv.innerHTML = `
      <p>Your cart is empty.</p>
    `;

    return;

  }


  cartDiv.innerHTML = cart.map(item => {

    return `
      <div class="cart-item">

        <div class="cart-left">

          <div class="cart-name">
            ${escapeHTML(item.name)}
          </div>

          <div class="cart-restaurant">
            ${escapeHTML(item.restaurant)}
          </div>

          <div class="cart-price">
            ${item.price
              ? `৳ ${escapeHTML(item.price)}`
              : "Price unavailable"
            }
          </div>

        </div>


        <div class="cart-right">

          <div class="qty-box">

            <button
              type="button"
              onclick="updateCartQty(${item.id}, -1)"
            >
              -
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
            aria-label="Remove item"
          >
            ❌
          </button>

        </div>

      </div>
    `;

  }).join("");

}


// ===============================
// CART COUNT
// ===============================

function updateCartCount() {

  const totalItems =
    cart.reduce(
      (total, item) => total + item.qty,
      0
    );


  if (cartCount) {
    cartCount.textContent = totalItems;
  }

}


// ===============================
// SUBMIT ORDER
// ===============================

function submitOrder() {

  if (!cart.length) {

    alert("Please add at least one item to your order.");

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
// SECURITY / HTML HELPERS
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
