const menuItems = [
  { id: 1, name: "Burger", price: 180, category: "Food", desc: "Juicy grilled burger", img: "images/burger.jpg" },
  { id: 2, name: "Sandwich", price: 220, category: "Food", desc: "Veg sandwich", img: "images/sandwich.jpg" },
  { id: 3, name: "Pizza", price: 350, category: "Food", desc: "Cheesy pizza", img: "images/pizza.jpg" },
  { id: 4, name: "Pasta", price: 300, category: "Food", desc: "Creamy pasta", img: "images/pasta.jpg" },
  { id: 5, name: "Fries", price: 120, category: "Food", desc: "Crispy fries", img: "images/fries.jpg" },
  { id: 6, name: "Coffee", price: 80, category: "Drinks", desc: "Hot coffee", img: "images/coffee.jpg" },
  { id: 7, name: "Tea", price: 40, category: "Drinks", desc: "Milk tea", img: "images/tea.jpg" },
  { id: 8, name: "Cold Drink", price: 60, category: "Drinks", desc: "Soft drink", img: "images/coldrink.jpg" },
  { id: 9, name: "Ice Cream", price: 90, category: "Dessert", desc: "Vanilla scoop", img: "images/icecream.jpg" },
  { id: 10, name: "Momos", price: 150, category: "Food", desc: "Dumplings", img: "images/momos.jpg" },
  { id: 11, name: "Fried Rice", price: 200, category: "Food", desc: "Fried rice", img: "images/fried rice.jpg" },
  { id: 12, name: "Milkshake", price: 140, category: "Drinks", desc: "Chocolate shake", img: "images/milkshake.jpg" }
];

let cart = [];
let currentCategory = "All";

const menuDiv = document.getElementById("menu");
const cartDiv = document.getElementById("cart");
const totalSpan = document.getElementById("total");
const tabsDiv = document.getElementById("tabs");
const summary = document.getElementById("cartSummary");

// INIT
initTabs();
renderMenu();
renderCart();

function initTabs() {
  const cats = ["All", ...new Set(menuItems.map(i => i.category))];
  tabsDiv.innerHTML = cats.map(c =>
    `<button onclick="setCategory('${c}')">${c}</button>`
  ).join("");
}

function setCategory(cat) {
  currentCategory = cat;
  document.querySelectorAll(".tabs button").forEach(btn => {
  btn.classList.remove("active");
  if (btn.innerText === cat) btn.classList.add("active");
});
  renderMenu();
}

// MENU UI
function renderMenu() {
  menuDiv.innerHTML = `<div class="menu-grid"></div>`;
  const grid = menuDiv.querySelector(".menu-grid");

  menuItems
    .filter(i => currentCategory === "All" || i.category === currentCategory)
    .forEach(item => {
      grid.innerHTML += `
        <div class="card">
          <img src="${item.img}">
          
          <div class="card-content">
            <div class="card-title">${item.name}</div>
            <div class="card-desc">${item.desc}</div>
            <div class="price">${item.price} BDT</div>

            <div class="actions-row">
              <button onclick="changeQty(${item.id}, -1)">-</button>
              <span id="qty-${item.id}">1</span>
              <button onclick="changeQty(${item.id}, 1)">+</button>
              <button onclick="addToCart(${item.id})">Add</button>
            </div>
          </div>
        </div>
      `;
    });
}

// ADD (with animation)
function addToCart(id) {
  const item = menuItems.find(i => i.id === id);
  let qty = parseInt(document.getElementById(`qty-${id}`).innerText);

  const existing = cart.find(i => i.id === id);
  if (existing) existing.qty += qty;
  else cart.push({ ...item, qty });

  renderCart();
}

// QTY
function changeQty(id, delta) {
  const el = document.getElementById(`qty-${id}`);
  let qty = parseInt(el.innerText);
  qty = Math.max(1, qty + delta);
  el.innerText = qty;
}

// CART
function renderCart() {
  cartDiv.innerHTML = "";
  let total = 0;
  let count = 0;

  cart.forEach(i => {
    total += i.price * i.qty;
    count += i.qty;

    cartDiv.innerHTML += `
      <div class="cart-item">
        
        <div class="cart-left">
          <div class="cart-name">${i.name}</div>
          <div class="cart-price">₹${i.price}</div>
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
    `;
  });

  totalSpan.innerText = total;
  summary.innerText = `🛒 ${count} items | ${total} BDT`;
}

const floatingCart = document.getElementById("floatingCart");
const cartPanel = document.querySelector(".cart-panel");

floatingCart.onclick = () => {

  // ONLY FOR MOBILE
  if (window.innerWidth <= 768) {
    cartPanel.classList.toggle("show");

    if (cartPanel.classList.contains("show")) {
      floatingCart.innerText = "❌ Close Cart";
    } else {
      floatingCart.innerText = "🛒 View Cart";
    }

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth"
    });
  }

};


function removeItem(id) {
  cart = cart.filter(i => i.id !== id);
  renderCart();
}

// CLEAR
document.getElementById("clearBtn").onclick = () => {
  cart = [];
  renderCart();
};

// CONFIRM
document.getElementById("confirmBtn").onclick = () => {
  if (cart.length === 0) return alert("Add items");

  const itemsWithQty = cart.map(i => `${i.name}(${i.qty})`).join("|");
  const comments = document.getElementById("comments").value;

  const FORM_URL = "https://app.smartsheet.com/b/form/019d520b436a708a860cb9b2a4894e49";

  const url =
    `${FORM_URL}?Item=${encodeURIComponent(itemsWithQty)}` +
    `&Comments=${encodeURIComponent(comments)}`;

  console.log(url); // 👈 debug URL

  window.open(url, "_blank");
}

floatingCart.addEventListener("click", () => {
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "smooth"
  });
});

confirmBtn.addEventListener("click", confirmOrder);
