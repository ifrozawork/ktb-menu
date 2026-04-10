/***********************
 * STATE
 ***********************/
let menuItems = [];
let cart = [];
let currentCategory = "All";

/***********************
 * DOM REFERENCES
 ***********************/
const menuDiv = document.getElementById("menu");
const cartDiv = document.getElementById("cart");
const totalSpan = document.getElementById("total");
const tabsDiv = document.getElementById("tabs");
const summary = document.getElementById("cartSummary");
const floatingCart = document.getElementById("floatingCart");
const cartPanel = document.querySelector(".cart-panel");

/***********************
 * LOAD MENU (JSON)
 ***********************/
fetch("menu.json")
  .then(res => res.json())
  .then(data => {
    menuItems = data.filter(item => item.available);
    initTabs();
    renderMenu();
    restoreCart();
  })
  .catch(err => {
    console.error("Menu load failed:", err);
    menuDiv.innerHTML = "<p>Menu unavailable</p>";
  });

/***********************
 * CATEGORY TABS
 ***********************/
function initTabs() {
  const categories = ["All", ...new Set(menuItems.map(i => i.category))];
  tabsDiv.innerHTML = categories
    .map(
      c => `<button onclick="setCategory('${c}')" class="${c === currentCategory ? "active" : ""}">
              ${c}
            </button>`
    )
    .join("");
}

function setCategory(cat) {
  currentCategory = cat;
  document.querySelectorAll(".tabs button").forEach(btn =>
    btn.classList.toggle("active", btn.innerText === cat)
  );
  renderMenu();
}

/***********************
 * MENU RENDER
 ***********************/
function renderMenu() {
  const filtered =
    currentCategory === "All"
      ? menuItems
      : menuItems.filter(i => i.category === currentCategory);

  menuDiv.innerHTML = `
    <div class="menu-grid">
      ${filtered
        .map(
          item => `
          <div class="card">
            images/${item.image}
            <div class="card-content">
              <div class="card-title">${item.name}</div>
              <div class="card-desc">${item.description || ""}</div>
              <div class="price">${item.price} BDT</div>

              <div class="actions-row">
                <div class="qty-box">
                  <button onclick="changeQty(${item.id}, -1)">−</button>
                  <span id="qty-${item.id}">1</span>
                  <button onclick="changeQty(${item.id}, 1)">+</button>
                </div>
                <button onclick="addToCart(${item.id})">Add</button>
              </div>
            </div>
          </div>
        `
        )
        .join("")}
    </div>`;
}

/***********************
 * QUANTITY CONTROL
 ***********************/
function changeQty(id, delta) {
  const el = document.getElementById(`qty-${id}`);
  let qty = parseInt(el.innerText, 10);
  el.innerText = Math.max(1, qty + delta);
}

/***********************
 * CART LOGIC
 ***********************/
function addToCart(id) {
  const item = menuItems.find(i => i.id === id);
  const qty = parseInt(document.getElementById(`qty-${id}`).innerText, 10);

  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ ...item, qty });
  }

  document.getElementById(`qty-${id}`).innerText = 1;
  renderCart();
}

function renderCart() {
  let total = 0;
  let count = 0;

  cartDiv.innerHTML = cart
    .map(i => {
      total += i.price * i.qty;
      count += i.qty;
      return `
        <div class="cart-item">
          <div class="cart-left">
            <div class="cart-name">${i.name}</div>
            <div class="cart-price">${i.price} BDT × ${i.qty}</div>
          </div>
          <div class="cart-right">
            <button onclick="updateCartQty(${i.id}, -1)">−</button>
            <strong>${i.qty}</strong>
            <button onclick="updateCartQty(${i.id}, 1)">+</button>
            <button class="remove-btn" onclick="removeItem(${i.id})">❌</button>
          </div>
        </div>
      `;
    })
    .join("");

  totalSpan.innerText = total;
  summary.innerText = `🛒 ${count} items | ${total} BDT`;
  saveCart();
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

/***********************
 * PERSIST CART
 ***********************/
function saveCart() {
  localStorage.setItem("kb_cart", JSON.stringify(cart));
}

function restoreCart() {
  const saved = localStorage.getItem("kb_cart");
  if (saved) {
    cart = JSON.parse(saved);
    renderCart();
  }
}

/***********************
 * CLEAR + CONFIRM
 ***********************/
document.getElementById("clearBtn").onclick = () => {
  cart = [];
  saveCart();
  renderCart();
};

document.getElementById("confirmBtn").onclick = () => {
  if (!cart.length) return alert("Add items first");

  const orderId = "KB-" + Date.now().toString().slice(-6);
  const items = cart.map(i => `${i.name} (${i.qty})`).join("\n");
  const comments = document.getElementById("comments").value;

  const FORM_URL =
    "https://app.smartsheet.com/b/form/019d520b436a708a860cb9b2a4894e49";

  const url =
    `${FORM_URL}?OrderID=${orderId}` +
    `&Item=${encodeURIComponent(items)}` +
    `&Comments=${encodeURIComponent(comments)}`;

  window.open(url, "_blank");
};

/***********************
 * MOBILE CART TOGGLE
 ***********************/
floatingCart.onclick = () => {
  if (window.innerWidth <= 768) {
    cartPanel.classList.toggle("show");
    floatingCart.innerText = cartPanel.classList.contains("show")
      ? "❌ Close Cart"
      : "🛒 View Cart";
  }
};
