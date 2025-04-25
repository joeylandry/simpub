let activeTag = 'all';
let sortBy    = 'featured';
let searchTerm = "";
  
// --- TOAST UTILITY ---
(function() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  document.body.appendChild(container);
  window.showToast = msg => {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      toast.addEventListener('transitionend', () => toast.remove());
    }, 3000);
  };
})();

// --- CART STATE ---
let cart = JSON.parse(localStorage.getItem("cart") || "[]");

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartPreview();
}

function addToCartItem(item) {
  cart.push(item);
  saveCart();
}

function updateCartPreview() {
  const countEl = document.getElementById("cart-count");
  const previewItems = document.getElementById("cart-preview-items");
  const previewBox = document.getElementById("cart-preview");
  if (!countEl || !previewItems || !previewBox) return;

  const stored = JSON.parse(localStorage.getItem("cart") || "[]");
  const grouped = {};
  stored.forEach(i => {
    const key = `${i.id}_${i.size}`;
    if (!grouped[key]) grouped[key] = { ...i };
    else grouped[key].quantity += i.quantity;
  });
  const items = Object.values(grouped);

  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
  countEl.textContent = `(${totalQty})`;
  countEl.classList.remove("animate");
  void countEl.offsetWidth;
  countEl.classList.add("animate");

  previewItems.innerHTML = items.length
    ? items.map((i, idx) =>
        `<div class="cart-preview-item">` +
        `<img src="${i.image}"/>` +
        `<div class="info">${i.name}<br><small>${i.size} × ${i.quantity}</small></div>` +
        `<button class="remove-btn" data-index="${idx}">✕</button>` +
        `</div>`
      ).join('')
    : "<p>Your cart is empty.</p>";
}

function removeFromCart(index, fromPreview = false) {
  let stored = JSON.parse(localStorage.getItem("cart") || "[]");
  const groupedMap = {};
  stored.forEach(i => {
    const key = `${i.id}_${i.size}`;
    if (!groupedMap[key]) groupedMap[key] = [];
    groupedMap[key].push(i);
  });
  const keys = Object.keys(groupedMap);
  if (index < 0 || index >= keys.length) return;

  const removeKey = keys[index];
  stored = stored.filter(i => `${i.id}_${i.size}` !== removeKey);
  cart = stored;
  saveCart();
  if (!fromPreview) renderCartPage();
}

function clearCart() {
  cart = [];
  saveCart();
  showToast('Cart cleared');
}

function filterByTag(tag) {
  activeTag = tag;
  updateGalleryDisplay();
}

// --- UPDATE GALLERY ---
function updateGalleryDisplay() {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  // 1) filter by tag
  let list = activeTag === 'all'
    ? PRODUCTS.slice()
    : PRODUCTS.filter(p => p.tags.includes(activeTag));

  // 2) filter by search term
  if (searchTerm) {
    list = list.filter(p =>
      p.name.toLowerCase().includes(searchTerm)
    );
  }

  // 3) sort
  switch (sortBy) {
    case 'newest':
      list.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
      break;
    case 'priceHighLow':
      list.sort((a, b) => b.price - a.price);
      break;
    case 'priceLowHigh':
      list.sort((a, b) => a.price - b.price);
      break;
    // 'featured' leaves original order
  }

  // 4) render
  renderGallery(list);
}

// --- RENDER FUNCTIONS ---
function renderGallery(products = PRODUCTS) {
  const grid = document.getElementById("product-grid");
  if (!grid) return;
  grid.innerHTML = "";

  products.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>$${p.price.toFixed(2)}</p>
      <div class="card-buttons">
        <div class="quick-add-wrapper" data-id="${p.id}">
          <button class="quick-add-btn">Quick Add</button>
          <div class="quick-add-popup hidden">
            <label>Size:
              <select class="quick-size">
                <option>S</option><option>M</option><option>L</option><option>XL</option>
              </select>
            </label>
            <label>Qty:
              <input type="number" class="quick-qty" min="1" value="1">
            </label>
            <button class="quick-add-confirm">Add</button>
          </div>
        </div>
      </div>
    `;
    card.addEventListener('click', e => {
      if (e.target.closest('.quick-add-wrapper')) return;
      location.href = `product.html?id=${p.id}`;
    });
    grid.appendChild(card);
  });
}

function renderProductPage() {
  const detail = document.getElementById("product-detail");
  if (!detail) return;
  const id = new URLSearchParams(location.search).get("id");
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) {
    detail.innerHTML = "<p>Product not found.</p>";
    return;
  }
  detail.innerHTML = `
    <img src="${p.image}" alt="${p.name}">
    <div class="product-info">
      <h2>${p.name}</h2>
      <p>${p.description}</p>
      <label>Size:
        <select id="size"><option>S</option><option>M</option><option>L</option><option>XL</option></select>
      </label>
      <label>Qty:
        <input type="number" id="qty" value="1" min="1">
      </label>
      <button id="page-add-btn">Add to Cart</button>
    </div>
  `;
  document.getElementById("page-add-btn").onclick = () => {
    const size = detail.querySelector("#size").value;
    const qty  = parseInt(detail.querySelector("#qty").value, 10);
    if (!size || isNaN(qty) || qty < 1) return;
    addToCartItem({ id: p.id, name: p.name, image: p.image, price: p.price, size, quantity: qty });
    showToast(`Added ${qty}× ${p.name} [${size}] to cart`);
  };

  const rel = PRODUCTS.filter(x => x.id !== p.id && x.tags.some(t => p.tags.includes(t)));
  const rc = document.getElementById("related");
  if (rc) {
    rc.innerHTML = "";
    rel.forEach(r => {
      const d = document.createElement("div");
      d.className = "product-card";
      d.innerHTML = `<img src="${r.image}"><h4>${r.name}</h4>`;
      d.onclick = () => location.href = `product.html?id=${r.id}`;
      rc.appendChild(d);
    });
  }
}

function renderCartPage() {
  const cpage = document.getElementById("cart-page");
  if (!cpage) return;

  const stored = JSON.parse(localStorage.getItem("cart") || "[]");
  const groupedMap = {};
  stored.forEach(item => {
    const key = `${item.id}_${item.size}`;
    if (!groupedMap[key]) groupedMap[key] = { ...item };
    else groupedMap[key].quantity += item.quantity;
  });
  const groups = Object.entries(groupedMap);

  if (groups.length === 0) {
    cpage.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }

  cpage.innerHTML = "<h2>Your Cart</h2>";
  let total = 0;
  groups.forEach(([key, item]) => {
    total += item.price * item.quantity;
    const [id, size] = key.split("_");
    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <img src="${item.image}" width="60">
      <strong>${item.name}</strong> [${size}] –
      $${item.price.toFixed(2)} ×
      <input type="number"
             class="cart-qty"
             data-key="${key}"
             value="${item.quantity}"
             min="1"
             style="width: 3em">
      <button class="remove-page-btn"
              data-key="${key}">
        Remove
      </button>
    `;
    cpage.appendChild(div);
  });
  const summary = document.createElement("div");
  summary.innerHTML = `
    <h3>Total: $${total.toFixed(2)}</h3>
    <button onclick="checkout()">Checkout</button>
  `;
  cpage.appendChild(summary);
}

function openCart() { location.href = "cart.html"; }
function goToCart()   { location.href = "cart.html"; }
function checkout()   { showToast("Proceeding to checkout..."); }

// --- EVENT DELEGATION FOR CLICKS ---
document.addEventListener("click", e => {
  if (e.target.matches(".quick-add-confirm")) {
    e.stopPropagation();
    const wrap = e.target.closest(".quick-add-wrapper");
    const id   = wrap.dataset.id;
    const p    = PRODUCTS.find(x => x.id === id);
    const size = wrap.querySelector(".quick-size").value;
    const qty  = parseInt(wrap.querySelector(".quick-qty").value, 10);
    if (!p || !size || isNaN(qty) || qty < 1) return;
    addToCartItem({ id: p.id, name: p.name, image: p.image, price: p.price, size, quantity: qty });
    showToast(`Added ${qty}× ${p.name} [${size}] to cart`);
    wrap.querySelector(".quick-add-popup").classList.add("hidden");
    return;
  }

  if (e.target.matches(".remove-btn")) {
    return removeFromCart(Number(e.target.dataset.index), true);
  }

  if (e.target.matches(".remove-page-btn")) {
    const key = e.target.dataset.key;
    cart = cart.filter(item => `${item.id}_${item.size}` !== key);
    saveCart();
    renderCartPage();
    updateCartPreview();
    return;
  }

  document.querySelectorAll(".quick-add-popup")
          .forEach(p => p.classList.add("hidden"));
});

// --- EVENT DELEGATION FOR QUANTITY CHANGES ---
document.addEventListener("input", e => {
  if (!e.target.matches(".cart-qty")) return;
  const key    = e.target.dataset.key;
  const newQty = parseInt(e.target.value, 10);
  if (isNaN(newQty) || newQty < 1) return;

  const stored = JSON.parse(localStorage.getItem("cart") || "[]");
  const grouped = {};
  stored.forEach(item => {
    const k = `${item.id}_${item.size}`;
    if (!grouped[k]) grouped[k] = { ...item };
    else grouped[k].quantity += item.quantity;
  });

  const updated = [];
  for (const [k, itm] of Object.entries(grouped)) {
    const qty = (k === key ? newQty : itm.quantity);
    const [id, size] = k.split("_");
    updated.push({ id, name: itm.name, image: itm.image, price: itm.price, size, quantity: qty });
  }

  cart = updated;
  saveCart();
  renderCartPage();
  updateCartPreview();
});

// --- CART & QUICK-ADD HOVER LOGIC ---
window.addEventListener("DOMContentLoaded", () => {
  // ── 1) Cart initialization (runs on every page) ─────────────────────
  renderCartPage();
  updateCartPreview();

  const icon = document.getElementById("cart-icon");
  const box  = document.getElementById("cart-preview");
  if (icon && box) {
    let t;
    icon.addEventListener("mouseenter", () => {
      clearTimeout(t);
      box.classList.add("show");
    });
    icon.addEventListener("mouseleave", () => {
      t = setTimeout(() => box.classList.remove("show"), 200);
    });
    box.addEventListener("mouseenter", () => clearTimeout(t));
    box.addEventListener("mouseleave", () => box.classList.remove("show"));
  }

  // ── 2) Store-only initialization ────────────────────────────────────
  if (typeof PRODUCTS !== "undefined") {
    // a) Initial renders for gallery and product detail
    renderGallery();
    renderProductPage();

    // b) Search handler
    const searchInput = document.getElementById("product-search");
    if (searchInput) {
      searchInput.addEventListener("input", e => {
        searchTerm = e.target.value.trim().toLowerCase();
        updateGalleryDisplay();
      });
    }

    // c) Sort-By handler
    const sortSelect = document.getElementById("sort-by");
    if (sortSelect) {
      sortSelect.addEventListener("change", e => {
        sortBy = e.target.value;
        updateGalleryDisplay();
      });
    }

    // d) Initial gallery render & ensure cart is up to date
    updateGalleryDisplay();

    // e) Quick-Add hover logic
    document.querySelectorAll(".quick-add-wrapper").forEach(wrap => {
      const pop = wrap.querySelector(".quick-add-popup");
      let hideTimer;
      function showPopup() {
        clearTimeout(hideTimer);
        document.querySelectorAll(".quick-add-popup")
          .forEach(p => p !== pop && p.classList.add("hidden"));
        pop.classList.remove("hidden");
      }
      function scheduleHide() {
        hideTimer = setTimeout(() => pop.classList.add("hidden"), 800);
      }
      wrap.addEventListener("mouseenter", showPopup);
      pop.addEventListener("mouseenter", showPopup);
      wrap.addEventListener("mouseleave", scheduleHide);
      pop.addEventListener("mouseleave", scheduleHide);
    });
  }
});
