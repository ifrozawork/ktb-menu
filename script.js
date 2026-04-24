// ===============================
// CONFIG
// ===============================
const MENU_URL = "./menu.json";
const FORM_URL = "https://app.smartsheet.com/b/form/019d520b436a708a860cb9b2a4894e49";

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

  await loadMenu();
  renderCart();
}

// ===============================
// LOAD MENU (FIXED)
// ===============================
async function loadMenu() {
  try {
    const res = await fetch(MENU_URL);
    const data = await res.json();

    // 🔥 convert nested JSON → flat array
    menuItems = flattenMenu(data);

    initTabs(data.restaurants);
    renderMenu();

  } catch (err) {
    console.error(err);
    menuDiv.innerHTML = "<p>Menu unavailable</p>";
  }
}

// 🔥 IMPORTANT FUNCTION
function flattenMenu(data) {
  let flat = [];

  data.restaurants.forEach(rest => {
    rest.menu.forEach(cat => {
      cat.items.forEach(item => {
        flat.push({
          id: item.id,
          name: item.name,
          price: item.price,
          desc: item.desc,
          img: item.img ? `./${item.img}` : "",
          category: cat.category,
          restaurant: rest.name
        });
      });
    });
  });

  return flat;
}

// ===============================
// TABS (DYNAMIC RESTAURANTS)
// ===============================
function initTabs(restaurants) {
  const names = ["All", ...restaurants.map(r => r.name)];

  tabsDiv.innerHTML = names
    .map(r => `<button onclick="setRestaurant('${r}')">${r}</button>`)
    .join("");
}

function setRestaurant(r) {
  currentRestaurant = r;

  document.querySelectorAll("#tabs button").forEach(btn => {
    btn.classList.toggle("active", btn.innerText === r);
  });

  renderMenu();
}

// ===============================
// MENU RENDER
// ===============================
function renderMenu() {
  const filtered = menuItems.filter(item =>
    currentRestaurant === "All" || item.restaurant === currentRestaurant
  );

  menuDiv.innerHTML = `
    <div class="menu-grid">
      ${filtered.map(item => `
        <div class="card">
          ${item.img ? `<img src="${item.img}" />` : ""}
          <div class="card-content">
            <div class="card-title">${item.name}</div>
            <div class="card-desc">${item.category}</div>

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
// CART
// ===============================
function addToCart(id) {
  const item = menuItems.find(i => i.id === id);
  const qtyEl = document.getElementById(`qty-${id}`);
  const qty = parseInt(qtyEl.innerText) || 1;

  const existing = cart.find(i => i.id === id);

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ ...item, qty });
  }

  renderCart();
  qtyEl.innerText = 1;
}

function changeQty(id, delta) {
  const el = document.getElementById(`qty-${id}`);
  el.innerText = Math.max(1, parseInt(el.innerText) + delta);
}

function updateCartQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.id !== id);

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
// SUBMIT
// ===============================
function submitOrder() {
  if (!cart.length) return alert("Add items");

  const items = cart.map(i => `${i.name}(${i.qty})`).join("|");
  const restaurants = [...new Set(cart.map(i => i.restaurant))].join(", ");
  const comments = commentsInput?.value || "";

  const url =
    `${FORM_URL}?Item=${encodeURIComponent(items)}` +
    `&Restaurant=${encodeURIComponent(restaurants)}` +
    `&Comments=${encodeURIComponent(comments)}`;

  window.open(url, "_blank");
}
