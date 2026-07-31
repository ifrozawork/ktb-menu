// =========================================================
// CONFIG
// =========================================================

const MENU_URL = "./menu (1).json";

const FORM_URL =
  "https://app.smartsheet.com/b/form/019d520b436a708a860cb9b2a4894e49";


// =========================================================
// STATE
// =========================================================

let menuItems = [];

let cart = [];

let currentRestaurant = "All";


// =========================================================
// DOM ELEMENTS
// =========================================================

let menuDiv;

let cartDiv;

let tabsDiv;

let clearBtn;

let confirmBtn;

let commentsInput;

let floatingCart;

let cartPanel;

let cartCount;

let closeCartBtn;


// =========================================================
// INIT
// =========================================================

document.addEventListener(
  "DOMContentLoaded",
  initApp
);


async function initApp() {

  // -------------------------
  // Get DOM elements
  // -------------------------

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

  closeCartBtn =
    document.getElementById("closeCartBtn");


  // -------------------------
  // Button events
  // -------------------------

  if (clearBtn) {

    clearBtn.addEventListener(
      "click",
      clearCart
    );

  }


  if (confirmBtn) {

    confirmBtn.addEventListener(
      "click",
      submitOrder
    );

  }


  // -------------------------
  // Mobile cart
  // -------------------------

  if (floatingCart) {

    floatingCart.addEventListener(
      "click",
      openCart
    );

  }


  if (closeCartBtn) {

    closeCartBtn.addEventListener(
      "click",
      closeCart
    );

  }


  // -------------------------
  // Escape key closes cart
  // -------------------------

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape"
      ) {

        closeCart();

      }

    }
  );


  // -------------------------
  // Load menu
  // -------------------------

  await loadMenu();


  // -------------------------
  // Initial cart
  // -------------------------

  renderCart();

}


// =========================================================
// CART OPEN / CLOSE
// =========================================================

function openCart(event) {

  if (event) {

    event.preventDefault();

  }


  if (!cartPanel) {

    return;

  }


  cartPanel.classList.add(
    "open"
  );


  document.body.classList.add(
    "cart-open"
  );


  // Prevent accidental page
  // scrolling when drawer opens

  setTimeout(
    () => {

      const firstButton =
        cartPanel.querySelector(
          ".mobile-cart-close"
        );

      if (
        firstButton &&
        window.innerWidth <= 768
      ) {

        firstButton.focus();

      }

    },
    50
  );

}


function closeCart(event) {

  if (event) {

    event.preventDefault();

  }


  if (!cartPanel) {

    return;

  }


  cartPanel.classList.remove(
    "open"
  );


  document.body.classList.remove(
    "cart-open"
  );

}


// =========================================================
// LOAD MENU
// =========================================================

async function loadMenu() {

  try {

    const response =
      await fetch(
        MENU_URL,
        {
          cache: "no-store"
        }
      );


    if (!response.ok) {

      throw new Error(
        `Menu could not be loaded. HTTP ${response.status}`
      );

    }


    const data =
      await response.json();


    // The menu file must
    // contain a flat array.

    if (!Array.isArray(data)) {

      throw new Error(
        "menu.json must contain a JSON array."
      );

    }


    // -------------------------
    // Convert menu data
    // -------------------------

    menuItems =
      data.map(
        (item, index) => {

          return {

            id:
              index + 1,

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

        }
      );


    // -------------------------
    // Create restaurant tabs
    // -------------------------

    initRestaurantTabs();


    // -------------------------
    // Render menu
    // -------------------------

    renderMenu();


  }

  catch (error) {

    console.error(
      "Menu loading error:",
      error
    );


    if (menuDiv) {

      menuDiv.innerHTML = `

        <div class="error-message">

          <h3>
            ⚠️ Menu unavailable
          </h3>

          <p>
            ${escapeHTML(
              error.message
            )}
          </p>

        </div>

      `;

    }

  }

}


// =========================================================
// RESTAURANT TABS
// =========================================================

function initRestaurantTabs() {

  if (!tabsDiv) {

    return;

  }


  const restaurants = [

    "All",

    ...new Set(
      menuItems.map(
        item =>
          item.restaurant
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
                restaurant ===
                currentRestaurant
                  ? "active"
                  : ""
              }"

              data-restaurant="${escapeAttribute(
                restaurant
              )}"
            >

              ${escapeHTML(
                restaurant
              )}

            </button>

          `;

        }
      )
      .join("");


  // -------------------------
  // Add click events
  // -------------------------

  tabsDiv
    .querySelectorAll("button")
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            setRestaurant(
              button.dataset
                .restaurant
            );

          }
        );

      }
    );

}


// =========================================================
// SET RESTAURANT
// =========================================================

function setRestaurant(
  restaurant
) {

  currentRestaurant =
    restaurant;


  // -------------------------
  // Active tab
  // -------------------------

  if (tabsDiv) {

    tabsDiv
      .querySelectorAll(
        "button"
      )
      .forEach(
        button => {

          button.classList.toggle(
            "active",

            button.dataset
              .restaurant ===
              restaurant
          );

        }
      );

  }


  // -------------------------
  // Render
  // -------------------------

  renderMenu();


  // -------------------------
  // On mobile, scroll menu
  // to top after changing
  // restaurant.
  // -------------------------

  if (
    window.innerWidth <= 768
  ) {

    window.scrollTo({

      top: 0,

      behavior: "smooth"

    });

  }

}


// =========================================================
// SULTAN DINE CATEGORY LOGIC
// =========================================================

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
    item.name
      .toLowerCase();


  // -------------------------
  // Dessert
  // -------------------------

  const dessertItems = [

    "firni",

    "jorda"

  ];


  if (
    dessertItems.some(
      keyword =>
        name.includes(
          keyword
        )
    )
  ) {

    return "Dessert";

  }


  // -------------------------
  // Drinks
  // -------------------------

  const drinkItems = [

    "borhani",

    "soft drinks",

    "water",

    "zafrani sorbot"

  ];


  if (
    drinkItems.some(
      keyword =>
        name.includes(
          keyword
        )
    )
  ) {

    return "Drinks";

  }


  // -------------------------
  // Main menu
  // -------------------------

  return "Main Menu";

}


// =========================================================
// FILTER MENU
// =========================================================

function getFilteredItems() {

  return menuItems.filter(
    item => {

      if (
        currentRestaurant ===
        "All"
      ) {

        return true;

      }


      return (
        item.restaurant ===
        currentRestaurant
      );

    }
  );

}


// =========================================================
// RENDER MENU
// =========================================================

function renderMenu() {

  if (!menuDiv) {

    return;

  }


  const filteredItems =
    getFilteredItems();


  // -------------------------
  // Empty state
  // -------------------------

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


  // -------------------------
  // Group by category
  // -------------------------

  const categories = {};


  filteredItems.forEach(
    item => {

      const category =
        getDisplayCategory(
          item
        );


      if (
        !categories[
          category
        ]
      ) {

        categories[
          category
        ] = [];

      }


      categories[
        category
      ].push(item);

    }
  );


  // -------------------------
  // Category order
  // -------------------------

  let categoryOrder =
    Object.keys(
      categories
    );


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
          categories[
            category
          ]
      );

  }


  // -------------------------
  // Build menu
  // -------------------------

  menuDiv.innerHTML =

    categoryOrder
      .map(
        category => {

          const items =
            categories[
              category
            ];


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


// =========================================================
// MENU CARD
// =========================================================

function renderMenuCard(
  item
) {

  // -------------------------
  // Image
  // -------------------------

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


  // -------------------------
  // Restaurant name
  // -------------------------

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


  // -------------------------
  // Description
  // -------------------------

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
  // Price is deliberately
  // NOT displayed.


  return `

    <article
      class="card"
    >


      ${imageHTML}


      <div
        class="card-content"
      >


        ${restaurantLabel}


        <div
          class="card-title"
        >

          ${escapeHTML(
            item.name
          )}

        </div>


        ${descriptionHTML}


        <div
          class="actions-row"
        >


          <!-- Quantity -->

          <div
            class="qty-control"
          >

            <button
              type="button"

              aria-label="Decrease quantity"

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

              aria-label="Increase quantity"

              onclick="changeQty(
                ${item.id},
                1
              )"
            >
              +
            </button>

          </div>


          <!-- Add -->

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

    </article>

  `;

}


// =========================================================
// PRODUCT QUANTITY
// =========================================================

function changeQty(
  id,
  delta
) {

  const element =
    document.getElementById(
      `qty-${id}`
    );


  if (!element) {

    return;

  }


  const current =
    parseInt(
      element.textContent,
      10
    ) || 1;


  element.textContent =
    Math.max(
      1,
      current + delta
    );

}


// =========================================================
// ADD TO CART
// =========================================================

function addToCart(
  id
) {

  const item =
    menuItems.find(
      menuItem =>
        menuItem.id === id
    );


  if (!item) {

    return;

  }


  const quantityElement =
    document.getElementById(
      `qty-${id}`
    );


  const quantity =
    parseInt(
      quantityElement?.textContent,
      10
    ) || 1;


  // Existing item?

  const existing =
    cart.find(
      cartItem =>
        cartItem.id === id
    );


  if (existing) {

    existing.qty +=
      quantity;

  }

  else {

    cart.push({

      ...item,

      qty:
        quantity

    });

  }


  // Reset product quantity

  if (quantityElement) {

    quantityElement.textContent =
      "1";

  }


  renderCart();

}


// =========================================================
// UPDATE CART QUANTITY
// =========================================================

function updateCartQty(
  id,
  delta
) {

  const item =
    cart.find(
      cartItem =>
        cartItem.id === id
    );


  if (!item) {

    return;

  }


  item.qty +=
    delta;


  // Remove at zero

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


// =========================================================
// REMOVE CART ITEM
// =========================================================

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


// =========================================================
// CLEAR CART
// =========================================================

function clearCart() {

  cart = [];


  if (
    commentsInput
  ) {

    commentsInput.value =
      "";

  }


  renderCart();

}


// =========================================================
// RENDER CART
// =========================================================

function renderCart() {

  updateCartCount();


  if (!cartDiv) {

    return;

  }


  // -------------------------
  // Empty
  // -------------------------

  if (!cart.length) {

    cartDiv.innerHTML = `

      <p>
        Your cart is empty.
      </p>

    `;

    return;

  }


  // -------------------------
  // Items
  // -------------------------

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


                <!-- Quantity -->

                <div
                  class="qty-box"
                >

                  <button
                    type="button"

                    aria-label="Decrease quantity"

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

                    aria-label="Increase quantity"

                    onclick="updateCartQty(
                      ${item.id},
                      1
                    )"
                  >
                    +
                  </button>

                </div>


                <!-- Remove -->

                <button
                  type="button"

                  class="remove-btn"

                  aria-label="Remove item"

                  onclick="removeItem(
                    ${item.id}
                  )"
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


// =========================================================
// CART COUNT
// =========================================================

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


// =========================================================
// SUBMIT ORDER
// =========================================================

function submitOrder() {

  // -------------------------
  // Empty cart
  // -------------------------

  if (!cart.length) {

    alert(
      "Please add at least one item to your order."
    );

    return;

  }


  // -------------------------
  // Items
  // -------------------------

  const items =
    cart
      .map(
        item =>
          `${item.name}(${item.qty})`
      )
      .join("|");


  // -------------------------
  // Restaurants
  // -------------------------

  const restaurants =
    [
      ...new Set(
        cart.map(
          item =>
            item.restaurant
        )
      )

    ].join(", ");


  // -------------------------
  // Comments
  // -------------------------

  const comments =
    commentsInput?.value?.trim() ||
    "";


  // -------------------------
  // Smartsheet URL
  // -------------------------

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


  // -------------------------
  // Open form
  // -------------------------

  window.open(
    url,
    "_blank"
  );

}


// =========================================================
// HTML SECURITY HELPERS
// =========================================================

function escapeHTML(
  value
) {

  return String(
    value
  )

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
