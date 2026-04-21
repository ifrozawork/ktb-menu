// ===============================
// CONFIG
// ===============================
const MENU_URL = "./menu.json";
const FORM_URL = "https://app.smartsheet.com/b/form/019d520b436a708a860cb9b2a4894e49";

// CATEGORY → RESTAURANT mapping
const RESTAURANTS = {
  "Coffee Lime": ["Drinks"],
  "Dessert Boutique": ["Dessert"],
  "Madchef": ["Food"]
};

// ===============================
// STATE
// ===============================
let menuItems = [];
let cart = [];
let currentRestaurant = "All";

let menuDiv;
let cartDiv;
let tabsDiv;
let clearBtn;
let confirmBtn;
let commentsInput;
let floatingCart;
let cartPanel;

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
  cartPanel = document.querySelector(".cart-panel");

  clearBtn.onclick = () => {
    cart = [];
    renderCart();
  };

  confirmBtn.onclick = submitOrder;

  if (floatingCart && cartPanel) {
    floatingCart.onclick = () => {
      if (window.innerWidth <= 768) {
        cartPanel.classList.toggle("show");
        floatingCart.innerText = cartPanel.classList.contains("show")
          ? "❌ Close Cart"
          : "🛒 View Cart";
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      }
    };
  }

  await loadMenu();
  renderCart();
}

// ===============================
// DATA LOADING
// ===============================
async function loadMenu() {
  try {
    const response = await fetch(`${MENU_URL}?t=${Date.now()}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Failed to load menu.json (${response.status})`);
    }

    const rawMenu = await response.json();
    menuItems = normalizeMenu(rawMenu);

    initTabs();
    renderMenu();
  } catch (error) {
    console.error("Menu load error:", error);
    menuDiv.innerHTML = `<p>Menu unavailable. Please check menu.json.</p>`;
  }
}

// ===============================
// NORMALIZATION
// ===============================
function normalizeMenu(rawMenu) {
  return rawMenu
    .filter(item => isAvailable(item.Available))
    .map((item, index) => ({
      id: Number(item.id ?? index + 1),
      name: item.Item,
      category: item.Category,
      desc: item.Description,
      img: normalizeImagePath(item.Image)
    }));
}

function isAvailable(value) {
  if (typeof value === "boolean") return value;
  if (value == null) return true;
  return ["true", "yes", "1"].includes(String(value).toLowerCase());
}

function normalizeImagePath(img) {
  if (!img) return "";
  if (img.startsWith("images/")) return `./${img}`;
  return `./images/${img}`;
}

function getRestaurantName(category) {
  for (const restaurant in RESTAURANTS) {
    if (RESTAURANTS[restaurant].includes(category)) {
      return restaurant;
    }
  }
  return "Unknown";
}

// ===============================
// TABS (RESTAURANTS)
// ===============================
function initTabs() {
  const restaurants = ["All", ...Object.keys(RESTAURANTS)];
  tabsDiv.innerHTML = restaurants
    .map(r => `<button onclick="setRestaurant('${r}')">${r}</button>`)
    .join("");
}

function setRestaurant(restaurant) {
  currentRestaurant = restaurant;

  document.querySelectorAll("#tabs button").forEach(btn => {
    btn.classList.toggle("active", btn.innerText === restaurant);
  });

  renderMenu();
}

// ===============================
// MENU RENDER
// ===============================
function renderMenu() {
  const filtered = menuItems.filter(item => {
    if (currentRestaurant === "All") return true;
    return RESTAURANTS[currentRestaurant]?.includes(item.category);
  });

  menuDiv.innerHTML = `
    <div class="menu-grid">
      ${filtered.map(item => `
        <div class="card">
          ${item.img ? `<img src="${item.img}" />` : ""}
          <div class="card-content">
            <div class="card-title">${item.name}</div>
            <div class="card-desc">${item.desc}</div>

            <div class="actions-row">
              <div class="qty-control">
                <button onclick="changeQty(${item.id}, -1)">-</button>
                <span id="qty-${item.id}">1</span>
                <button onclick="changeQty(${item.id}, 1)">+</button>
              </div>
              <button onclick="addToCart(${item.id})">Add</button>
            </div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

// ===============================
// CART LOGIC
// ===============================
function addToCart(id) {
  const item = menuItems.find(i => i.id === id);
  const qtyEl = document.getElementById(`qty-${id}`);
  const qty = parseInt(qtyEl.innerText, 10) || 1;

  const restaurant = getRestaurantName(item.category);
  const existing = cart.find(i => i.id === id);

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ ...item, qty, restaurant });
  }

  renderCart();
  qtyEl.innerText = 1;
}

function changeQty(id, delta) {
  const el = document.getElementById(`qty-${id}`);
  el.innerText = Math.max(1, (parseInt(el.innerText, 10) || 1) + delta);
}

function updateCartQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  }
  renderCart();
}

function removeItem(id) {
  cart = cart.filter(i => i.id !== id);
  renderCart();
}

// ===============================
// CART RENDER
// ===============================
function renderCart() {
  if (!cart.length) {
    cartDiv.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }

  cartDiv.innerHTML = cart.map(i => `
    <div class="cart-item">
      <div class="cart-left">
        <div class="cart-name">${i.name}</div>
        <div class="cart-restaurant">${i.restaurant}</div>
      </div>
      <div class="cart-right">
        <div class="qty-box">
          <button onclick="updateCartQty(${i.id}, -1)">-</button>
          <span>${i.qty}</span>
          <button onclick="updateCartQty(${i.id}, 1)">+</button>
        </div>
        <button class="remove-btn" onclick="removeItem(${i.id})">❌</button>
      </div>
    </div>
  `).join("");
}

// ===============================
// SUBMIT TO SMARTSHEET
// ===============================
function submitOrder() {
  if (!cart.length) return alert("Add items");

  const itemsWithQty = cart
    .map(i => `${i.name}(${i.qty})`)
    .join("|");

  const restaurants = [...new Set(cart.map(i => i.restaurant))].join(", ");
  const comments = commentsInput?.value || "";

  const url =
    `${FORM_URL}?Item=${encodeURIComponent(itemsWithQty)}` +
    `&Restaurant=${encodeURIComponent(restaurants)}` +
    `&Comments=${encodeURIComponent(comments)}`;

  window.open(url, "_blank", "noopener");
}
