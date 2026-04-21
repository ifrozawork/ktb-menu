const MENU_URL = "./menu.json";
const FORM_URL = "https://app.smartsheet.com/b/form/019d520b436a708a860cb9b2a4894e49";

let menuItems = [];
let cart = [];
let currentCategory = "All";

let menuDiv;
let cartDiv;
let tabsDiv;
let clearBtn;
let confirmBtn;
let commentsInput;
let floatingCart;
let cartPanel;

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

        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth"
        });
      }
    };
  }

  await loadMenu();
  renderCart();
}

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
    menuItems = [];
    tabsDiv.innerHTML = "";
    menuDiv.innerHTML = `
      <div class="menu-error">
        <p>Menu unavailable right now.</p>
        <p>Please check that menu.json is in the correct folder and contains valid JSON.</p>
      </div>
    `;
  }
}

function normalizeMenu(rawMenu) {
  if (!Array.isArray(rawMenu)) {
    throw new Error("menu.json must contain an array.");
  }

  return rawMenu
    .filter(item => isAvailable(item.Available ?? item.available ?? true))
    .map((item, index) => ({
      id: Number(item.id ?? index + 1),
      name: String(item.Item ?? item.name ?? "").trim(),
      category: String(item.Category ?? item.category ?? "Uncategorized").trim(),
      desc: String(item.Description ?? item.desc ?? "").trim(),
      img: normalizeImagePath(item.Image ?? item.img ?? "")
    }))
    .filter(item => item.name);
}

function isAvailable(value) {
  if (typeof value === "boolean") return value;
  if (value == null) return true;

  const normalized = String(value).trim().toLowerCase();
  return ["true", "yes", "1", "available", "y"].includes(normalized);
}

function normalizeImagePath(value) {
  const cleaned = String(value || "").trim();
  if (!cleaned) return "";

  // if already a full URL or path, keep it
  if (/^(https?:\/\/|\/|\.\/|\.\.\/)/i.test(cleaned)) {
    return cleaned;
  }

  // if already starts with images/
  if (cleaned.startsWith("images/")) {
    return `./${cleaned}`;
  }

  // otherwise assume filename only
  return `./images/${cleaned}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ------------------ TABS ------------------
function initTabs() {
  const cats = ["All", ...new Set(menuItems.map(i => i.category))];

  tabsDiv.innerHTML = cats.map(c =>
    `<button class="${c === currentCategory ? "active" : ""}" onclick='setCategory(${JSON.stringify(c)})'>${escapeHtml(c)}</button>`
  ).join("");
}

function setCategory(cat) {
  currentCategory = cat;

  document.querySelectorAll("#tabs button").forEach(btn => {
    btn.classList.remove("active");
    if (btn.innerText === cat) btn.classList.add("active");
  });

  renderMenu();
}

// ------------------ MENU ------------------
function renderMenu() {
  const filtered = menuItems.filter(i =>
    currentCategory === "All" || i.category === currentCategory
  );

  if (!filtered.length) {
    menuDiv.innerHTML = `<p class="empty-state">No menu items available in this category.</p>`;
    return;
  }

  menuDiv.innerHTML = `
    <div class="menu-grid">
      ${filtered.map(item => `
        <div class="card">
          ${item.img ? `<img src="${escapeHtml(item.img)}" alt="${escapeHtml(item.name)}" loading="lazy">` : ""}

          <div class="card-content">
            <div class="card-title">${escapeHtml(item.name)}</div>
            <div class="card-desc">${escapeHtml(item.desc)}</div>

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

// ------------------ ADD ------------------
function addToCart(id) {
  const item = menuItems.find(i => i.id === id);
  if (!item) return;

  const qtyEl = document.getElementById(`qty-${id}`);
  const qty = parseInt(qtyEl.innerText, 10) || 1;

  const existing = cart.find(i => i.id === id);

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ ...item, qty });
  }

  renderCart();
  qtyEl.innerText = 1;
}

// ------------------ MENU QTY ------------------
function changeQty(id, delta) {
  const el = document.getElementById(`qty-${id}`);
  let qty = parseInt(el.innerText, 10) || 1;
  qty = Math.max(1, qty + delta);
  el.innerText = qty;
}

// ------------------ CART QTY ------------------
function updateCartQty(id, change) {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.qty += change;

  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  }

  renderCart();
}

// ------------------ REMOVE ------------------
function removeItem(id) {
  cart = cart.filter(i => i.id !== id);
  renderCart();
}

// ------------------ RENDER CART ------------------
function renderCart() {
  if (!cart.length) {
    cartDiv.innerHTML = `<p class="empty-state">Your cart is empty.</p>`;
    return;
  }

  const html = cart.map(i => `
    <div class="cart-item">
      <div class="cart-left">
        <div class="cart-name">${escapeHtml(i.name)}</div>
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

  cartDiv.innerHTML = html;
}

// ------------------ CONFIRM ------------------
function submitOrder() {
  if (cart.length === 0) return alert("Add items");

  const itemsWithQty = cart.map(i => `${i.name}(${i.qty})`).join("|");
  const comments = commentsInput ? commentsInput.value : "";

  const url =
    `${FORM_URL}?Item=${encodeURIComponent(itemsWithQty)}` +
    `&Comments=${encodeURIComponent(comments)}`;

  window.open(url, "_blank", "noopener");
}
