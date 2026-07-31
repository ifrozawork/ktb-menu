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

document.addEventListener(
  "DOMContentLoaded",
  initApp
);


async function initApp() {

  // Get elements
  menuDiv =
    document.getElementById("menu");

  cartDiv =
    document.getElementById("cart");

  tabsDiv =
    document.getElementById("tabs");

  clearBtn =
    document.getElementById("clearBtn");

  confirmBtn =
    document.getElementById("confirmBtn");

  commentsInput =
    document.getElementById("comments");

  floatingCart =
    document.getElementById("floatingCart");

  cartPanel =
    document.getElementById("cartPanel");

  cartCount =
    document.getElementById("cartCount");


  // Clear cart
  clearBtn.addEventListener(
    "click",
    () => {

      cart = [];

      renderCart();

    }
  );


  // Proceed
  confirmBtn.addEventListener(
    "click",
    submitOrder
  );


  // Floating cart
  if (floatingCart) {

    floatingCart.addEventListener(
      "click",
      () => {

        if (cartPanel) {

          cartPanel.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });

        }

      }
    );

  }


  // Load menu
  await loadMenu();


  // Initial cart
  renderCart();

}


// ===============================
// LOAD MENU
// ===============================

async function loadMenu() {

  try {

    const response =
      await fetch(MENU_URL);


    if (!response.ok) {

      throw new Error(
        `Menu could not be loaded. HTTP ${response.status}`
      );

    }


    const data =
      await response.json();


    // Your JSON is a FLAT ARRAY
    if (!Array.isArray(data)) {

      throw new Error(
        "menu.json must contain a JSON array."
      );

    }


    // Convert JSON into our internal format
    //
    // The original JSON has no ID,
    // so we create one automatically.

    menuItems =
      data.map((item, index) => {

        return {

          id: index + 1,

          restaurant:
            item.restaurant ||
            "Unknown Restaurant",

          category:
            item.category ||
            "Other",

          name:
            item.name ||
            "Unnamed Item",

          description:
            item.description ||
            "",

          price:
            item.price ||
            "",

          img:
            item.img
              ? `./${item.img}`
              : ""

        };

      });


    // Create restaurant tabs
    initRestaurantTabs();


    // Show menu
    renderMenu();


  } catch (error) {

    console.error(
      "Menu loading error:",
      error
    );


    menuDiv.innerHTML = `

      <div class="error-message">

        <h3>
          ⚠️ Menu unavailable
        </h3>

        <p>
          ${escapeHTML(error.message)}
        </p>

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
      menuItems.map(
        item => item.restaurant
      )
    )

  ];


  tabsDiv.innerHTML =
    restaurants
      .map(
        restaurant => {

          return `

            <button
              type="button"
              class="${
                restaurant === currentRestaurant
                  ? "active"
                  : ""
              }"
              data-restaurant="${escapeAttribute(
                restaurant
              )}"
            >
              ${escapeHTML(restaurant)}
            </button>

          `;

        }
      )
      .join("");


  // Add click events
  tabsDiv
    .querySelectorAll("button")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          setRestaurant(
            button.dataset.restaurant
          );

        }
      );

    });

}


// ===============================
// SET RESTAURANT
// ===============================

function setRestaurant(
  restaurant
) {

  currentRestaurant =
    restaurant;


  // Highlight active tab

  tabsDiv
    .querySelectorAll("button")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.restaurant ===
          restaurant
      );

    });


  // Re-render menu

  renderMenu();

}


// ===============================
// SULTAN DINE CATEGORY LOGIC
// ===============================

function getDisplayCategory(
  item
) {

  // Only reorganize
  // Sultan Dine.

  if (
    item.restaurant !==
    "Sultan Dine"
  ) {

    return item.category;

  }


  const name =
    item.name.toLowerCase();


  // =========================
  // DESSERT
  // =========================

  const dessertItems = [

    "firni",

    "jorda"

  ];


  if (
    dessertItems.some(
      keyword =>
        name.includes(keyword)
    )
  ) {

    return "Dessert";

  }


  // =========================
  // DRINKS
  // =========================

  const drinkItems = [

    "borhani",

    "soft drinks",

    "water",

    "zafrani sorbot"

  ];


  if (
    drinkItems.some(
      keyword =>
        name.includes(keyword)
    )
  ) {

    return "Drinks";

  }


  // =========================
  // EVERYTHING ELSE
  // =========================

  return "Main Menu";

}


// ===============================
// GET FILTERED ITEMS
// ===============================

function getFilteredItems() {

  return menuItems.filter(
    item => {

      return (
        currentRestaurant ===
          "All" ||

        item.restaurant ===
          currentRestaurant
      );

    }
  );

}


// ===============================
// MENU RENDER
// ===============================

function renderMenu() {

  const filteredItems =
    getFilteredItems();


  // Nothing found
  if (
    !filteredItems.length
  ) {

    menuDiv.innerHTML = `

      <div class="no-results">

        <p>
          No menu items found.
        </p>

      </div>

    `;

    return;

  }


  // Group items by category

  const categories = {};


  filteredItems.forEach(
    item => {

      const displayCategory =
        getDisplayCategory(item);


      if (
        !categories[
          displayCategory
        ]
      ) {

        categories[
          displayCategory
        ] = [];

      }


      categories[
        displayCategory
      ].push(item);

    }
  );


  // ===============================
  // CATEGORY ORDER
  // ===============================

  let categoryOrder =
    Object.keys(categories);


  // Sultan Dine specifically:
  //
  // Main Menu
  // Dessert
  // Drinks

  if (
    currentRestaurant ===
    "Sultan Dine"
  ) {

    const preferredOrder = [

      "Main Menu",

      "Dessert",

      "Drinks"

    ];


    categoryOrder =
      preferredOrder.filter(
        category =>
          categories[category]
      );

  }


  // ===============================
  // BUILD HTML
  // ===============================

  menuDiv.innerHTML =
    categoryOrder
      .map(
        category => {

          const items =
            categories[category];


          return `

            <section
              class="menu-category"
            >

              <h3
                class="category-title"
              >
                ${escapeHTML(
                  category
                )}
              </h3>


              <div
                class="menu-grid"
              >

                ${items
                  .map(
                    item =>
                      renderMenuCard(
                        item
                      )
                  )
                  .join("")}

              </div>

            </section>

          `;

        }
      )
      .join("");

}


// ===============================
// MENU CARD
// ===============================

function renderMenuCard(
  item
) {

  // Optional image

  const imageHTML =
    item.img
      ? `

        <img
          src="${escapeAttribute(
            item.img
          )}"
          alt="${escapeAttribute(
            item.name
          )}"
          loading="lazy"
        >

      `
      : "";


  // Show restaurant name
  // only when viewing All

  const restaurantLabel =
    currentRestaurant ===
    "All"
      ? `

        <div
          class="card-restaurant"
        >
          ${escapeHTML(
            item.restaurant
          )}
        </div>

      `
      : "";


  // Description

  const descriptionHTML =
    item.description
      ? `

        <div
          class="card-desc"
        >
          ${escapeHTML(
            item.description
          )}
        </div>

      `
      : "";


  // IMPORTANT:
  //
  // PRICE IS NOT DISPLAYED.
  //
  // The price still exists
  // in menuItems for future use,
  // but is not shown here.


  return `

    <div class="card">

      ${imageHTML}


      <div class="card-content">

        ${restaurantLabel}


        <div class="card-title">

          ${escapeHTML(
            item.name
          )}

        </div>


        ${descriptionHTML}


        <div
          class="actions-row"
        >


          <!-- PRODUCT QUANTITY -->

          <div
            class="qty-control"
          >

            <button
              type="button"
              onclick="changeQty(
                ${item.id},
                -1
              )"
            >
              −
            </button>


            <span
              id="qty-${item.id}"
            >
              1
            </span>


            <button
              type="button"
              onclick="changeQty(
                ${item.id},
                1
              )"
            >
              +
            </button>

          </div>


          <!-- ADD BUTTON -->

          <button
            type="button"
            onclick="addToCart(
              ${item.id}
            )"
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

function changeQty(
  id,
  delta
) {

  const element =
    document.getElementById(
      `qty-${id}`
    );


  if (!element) return;


  const current =
    parseInt(
      element.textContent,
      10
    ) || 1;


  const newValue =
    Math.max(
      1,
      current + delta
    );


  element.textContent =
    newValue;

}


// ===============================
// ADD TO CART
// ===============================

function addToCart(
  id
) {

  const item =
    menuItems.find(
      menuItem =>
        menuItem.id === id
    );


  if (!item) return;


  const quantityElement =
    document.getElementById(
      `qty-${id}`
    );


  const quantity =
    parseInt(
      quantityElement?.textContent,
      10
    ) || 1;


  // Check if item
  // already exists

  const existing =
    cart.find(
      cartItem =>
        cartItem.id === id
    );


  if (existing) {

    existing.qty +=
      quantity;

  } else {

    cart.push({

      ...item,

      qty: quantity

    });

  }


  // Reset quantity
  // on product card

  if (quantityElement) {

    quantityElement.textContent =
      "1";

  }


  renderCart();

}


// ===============================
// UPDATE CART QUANTITY
// ===============================

function updateCartQty(
  id,
  delta
) {

  const item =
    cart.find(
      cartItem =>
        cartItem.id === id
    );


  if (!item) return;


  item.qty += delta;


  // Remove item if
  // quantity reaches zero

  if (
    item.qty <= 0
  ) {

    cart =
      cart.filter(
        cartItem =>
          cartItem.id !== id
      );

  }


  renderCart();

}


// ===============================
// REMOVE CART ITEM
// ===============================

function removeItem(
  id
) {

  cart =
    cart.filter(
      item =>
        item.id !== id
    );


  renderCart();

}


// ===============================
// RENDER CART
// ===============================

function renderCart() {

  updateCartCount();


  // Empty cart

  if (!cart.length) {

    cartDiv.innerHTML = `

      <p>
        Your cart is empty.
      </p>

    `;

    return;

  }


  cartDiv.innerHTML =
    cart
      .map(
        item => {

          return `

            <div
              class="cart-item"
            >


              <div
                class="cart-left"
              >

                <div
                  class="cart-name"
                >
                  ${escapeHTML(
                    item.name
                  )}
                </div>


                <div
                  class="cart-restaurant"
                >
                  ${escapeHTML(
                    item.restaurant
                  )}
                </div>

              </div>


              <div
                class="cart-right"
              >


                <!-- CART QTY -->

                <div
                  class="qty-box"
                >

                  <button
                    type="button"
                    onclick="updateCartQty(
                      ${item.id},
                      -1
                    )"
                  >
                    −
                  </button>


                  <span>
                    ${item.qty}
                  </span>


                  <button
                    type="button"
                    onclick="updateCartQty(
                      ${item.id},
                      1
                    )"
                  >
                    +
                  </button>

                </div>


                <!-- REMOVE -->

                <button
                  type="button"
                  class="remove-btn"
                  onclick="removeItem(
                    ${item.id}
                  )"
                  aria-label="Remove item"
                >
                  ❌
                </button>


              </div>

            </div>

          `;

        }
      )
      .join("");

}


// ===============================
// CART COUNT
// ===============================

function updateCartCount() {

  const total =
    cart.reduce(
      (sum, item) =>
        sum + item.qty,
      0
    );


  if (cartCount) {

    cartCount.textContent =
      total;

  }

}


// ===============================
// SUBMIT ORDER
// ===============================

function submitOrder() {

  // Empty cart check

  if (!cart.length) {

    alert(
      "Please add at least one item to your order."
    );

    return;

  }


  // Format items

  const items =
    cart
      .map(
        item =>
          `${item.name}(${item.qty})`
      )
      .join("|");


  // Restaurants

  const restaurants =
    [
      ...new Set(
        cart.map(
          item =>
            item.restaurant
        )
      )
    ]
      .join(", ");


  // Comments

  const comments =
    commentsInput?.value?.trim() ||
    "";


  // Build Smartsheet form URL

  const url =

    `${FORM_URL}?Item=${encodeURIComponent(
      items
    )}` +

    `&Restaurant=${encodeURIComponent(
      restaurants
    )}` +

    `&Comments=${encodeURIComponent(
      comments
    )}`;


  // Open form

  window.open(
    url,
    "_blank"
  );

}


// ===============================
// HTML SECURITY HELPERS
// ===============================

function escapeHTML(
  value
) {

  return String(value)

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}


function escapeAttribute(
  value
) {

  return escapeHTML(
    value
  );

}
