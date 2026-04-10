const menuItems = [
  { id: 1, name: "Burger", category: "Food", desc: "Juicy grilled burger", img: "images/burger.jpg" },
  { id: 2, name: "Sandwich", category: "Food", desc: "Veg sandwich", img: "images/sandwich.jpg" },
  { id: 3, name: "Pizza", category: "Food", desc: "Cheesy pizza", img: "images/pizza.jpg" },
  { id: 4, name: "Pasta", category: "Food", desc: "Creamy pasta", img: "images/pasta.jpg" },
  { id: 5, name: "Fries", category: "Food", desc: "Crispy fries", img: "images/fries.jpg" },
  { id: 6, name: "Coffee", category: "Drinks", desc: "Hot coffee", img: "images/coffee.jpg" },
  { id: 7, name: "Tea", category: "Drinks", desc: "Milk tea", img: "images/tea.jpg" },
  { id: 8, name: "Cold Drink", category: "Drinks", desc: "Soft drink", img: "images/coldrink.jpg" },
  { id: 9, name: "Ice Cream", category: "Dessert", desc: "Vanilla scoop", img: "images/icecream.jpg" },
  { id: 10, name: "Momos", category: "Food", desc: "Dumplings", img: "images/momos.jpg" },
  { id: 11, name: "Fried Rice", category: "Food", desc: "Fried rice", img: "images/fried rice.jpg" },
  { id: 12, name: "Milkshake", category: "Drinks", desc: "Chocolate shake", img: "images/milkshake.jpg" }
];

let cart = [];
let currentCategory = "All";

const menuDiv = document.getElementById("menu");
const cartDiv = document.getElementById("cart");
const tabsDiv = document.getElementById("tabs");

// INIT
initTabs();
renderMenu();
renderCart();

// ------------------ TABS ------------------
function initTabs() {
  const cats = ["All", ...new Set(menuItems.map(i => i.category))];
  tabsDiv.innerHTML = cats.map(c =>
    `<button onclick="setCategory('${c}')">${c}</button>`
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

  menuDiv.innerHTML = `
    <div class="menu-grid">
      ${filtered.map(item => `
        <div class="card">
          <img src="${item.img}">

          <div class="card-content">
            <div class="card-title">${item.name}</div>
            <div class="card-desc">${item.desc}</div>
            
            <div class="actions-row">
              
              <!-- FIXED QTY GROUP -->
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
  let qty = parseInt(document.getElementById(`qty-${id}`).innerText);

  const existing = cart.find(i => i.id === id);

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ ...item, qty });
  }

  renderCart();
  document.getElementById(`qty-${id}`).innerText = 1;
}

// ------------------ MENU QTY ------------------
function changeQty(id, delta) {
  const el = document.getElementById(`qty-${id}`);
  let qty = parseInt(el.innerText);
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
  const html = cart.map(i => `
    <div class="cart-item">
      <div class="cart-left">
        <div class="cart-name">${i.name}</div>
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

// ------------------ CLEAR ------------------
document.getElementById("clearBtn").onclick = () => {
  cart = [];
  renderCart();
};

// ------------------ CONFIRM ------------------
document.getElementById("confirmBtn").onclick = () => {
  if (cart.length === 0) return alert("Add items");

  const itemsWithQty = cart.map(i => `${i.name}(${i.qty})`).join("|");
  const comments = document.getElementById("comments").value;

  const FORM_URL = "https://app.smartsheet.com/b/form/019d520b436a708a860cb9b2a4894e49";

  const url =
    `${FORM_URL}?Item=${encodeURIComponent(itemsWithQty)}` +
    `&Comments=${encodeURIComponent(comments)}`;

  window.open(url, "_blank");
};

// ------------------ FLOATING CART ------------------
const floatingCart = document.getElementById("floatingCart");
const cartPanel = document.querySelector(".cart-panel");

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
