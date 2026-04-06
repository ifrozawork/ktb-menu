// MENU DATA
const menuItems = [
  { id: 1, name: "Burger", price: 180, category: "Food" },
  { id: 2, name: "Sandwich", price: 220, category: "Food" },
  { id: 3, name: "Coffee", price: 80, category: "Drinks" },
  { id: 4, name: "Tea", price: 40, category: "Drinks" }
];

let cart = [];

// ELEMENTS
const categorySelect = document.getElementById("category");
const menuDiv = document.getElementById("menu");
const cartDiv = document.getElementById("cart");
const totalSpan = document.getElementById("total");
const clearBtn = document.getElementById("clearBtn");
const confirmBtn = document.getElementById("confirmBtn");

// INIT
initCategories();
renderMenu();
renderCart();

// CATEGORY DROPDOWN
function initCategories() {
  const cats = ["All", ...new Set(menuItems.map(i => i.category))];
  categorySelect.innerHTML = cats.map(c => `<option>${c}</option>`).join("");
  categorySelect.onchange = renderMenu;
}

// RENDER MENU
function renderMenu() {
  const cat = categorySelect.value;
  menuDiv.innerHTML = "";

  menuItems
    .filter(i => cat === "All" || i.category === cat)
    .forEach(item => {
      menuDiv.innerHTML += `
        <div class="item">
          <div>
            <div class="name">${item.name}</div>
            <div class="price">${item.price} BDT</div>
          </div>

          <div style="display:flex; align-items:center; gap:6px;">
            <button onclick="changeQty(${item.id}, -1)">-</button>
            <span id="qty-${item.id}">1</span>
            <button onclick="changeQty(${item.id}, 1)">+</button>
            <button onclick="addToCart(${item.id})">Add</button>
          </div>
        </div>
      `;
    });
}

// ADD TO CART
function addToCart(id) {
  const item = menuItems.find(i => i.id === id);
  const qtyInput = document.getElementById(`qty-${id}`);
  const qty = parseInt(document.getElementById(`qty-${id}`).innerText);

  if (!qty || qty < 1) qty = 1;

  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ ...item, qty });
  }

  qtyInput.value = 1; // reset input
  renderCart();
}

// CHANGE QUANTITY
function changeQty(id, delta) {
  const el = document.getElementById(`qty-${id}`);
  let qty = parseInt(el.innerText);
  qty += delta;

  if (qty < 1) qty = 1;

  el.innerText = qty;
}


// RENDER CART
function renderCart() {
  cartDiv.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    cartDiv.innerHTML = "<p>Your cart is empty</p>";
    totalSpan.innerText = 0;
    return;
  }

  cart.forEach(i => {
    total += i.price * i.qty;

    cartDiv.innerHTML += `
      <div class="cart-item">
        
        <span>${i.name}</span>

        <div style="display:flex; align-items:center; gap:8px;">
          
          <button onclick="updateCartQty(${i.id}, -1)">-</button>
          
          <span>${i.qty}</span>
          
          <button onclick="updateCartQty(${i.id}, 1)">+</button>
          
          <button class="danger" onclick="removeItem(${i.id})">Remove</button>

        </div>

      </div>
    `;
  });

  totalSpan.innerText = total;
}


function updateCartQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.qty += delta;

  // If qty becomes 0 → remove item
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  }

  renderCart();
}


// REMOVE ITEM
function removeItem(id) {
  cart = cart.filter(i => i.id !== id);
  renderCart();
}

// CLEAR CART
clearBtn.addEventListener("click", () => {
  cart = [];
  renderCart();
});

// CONFIRM ORDER
function confirmOrder() {
  console.log("Confirm clicked");

  if (cart.length === 0) {
    alert("Please add items first");
    return;
  }

  const items = cart.map(i => `${i.name}`).join(" | ");
  const quantities = cart.map(i => i.qty).join(", ");
  const comments = document.getElementById("comments").value || "";

  const FORM_URL = "https://app.smartsheet.com/b/form/019d520b436a708a860cb9b2a4894e49";

  const url =
    `${FORM_URL}?Item=${encodeURIComponent(items)}` +
    `&Quantity=${encodeURIComponent(quantities)}` +
    `&Comments=${encodeURIComponent(comments)}`;

  console.log(url); // 👈 debug URL

  window.open(url, "_blank");
}
confirmBtn.addEventListener("click", confirmOrder);