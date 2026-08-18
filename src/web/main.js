const state = {
  menu: [],
  cart: /** @type {Record<string, number>} */ ({}),
};

const menuList = document.getElementById('menu-list');
const cartList = document.getElementById('cart-list');
const cartEmpty = document.getElementById('cart-empty');
const statusEl = document.getElementById('status');
const discountInput = document.getElementById('discount');
const cardInput = document.getElementById('card');
const cardNameInput = document.getElementById('card-name');
const cardMonthInput = document.getElementById('card-month');
const cardYearInput = document.getElementById('card-year');
const placeOrderBtn = document.getElementById('place-order');

function money(pence) {
  return `£${(pence / 100).toFixed(2)}`;
}

function setStatus(message, ok) {
  statusEl.textContent = message;
  statusEl.className = ok === undefined ? '' : ok ? 'ok' : 'bad';
}

async function loadMenu() {
  const res = await fetch('/api/menu');
  const data = await res.json();
  state.menu = data.items;
  render();
}

function addToCart(itemId) {
  state.cart[itemId] = (state.cart[itemId] ?? 0) + 1;
  render();
}

function render() {
  menuList.innerHTML = '';
  for (const item of state.menu) {
    const li = document.createElement('li');
    li.className = 'menu-item';
    li.dataset.testid = `menu-${item.id}`;
    li.innerHTML = `
      <div>
        <strong>${item.name}</strong>
        <div class="stock" data-testid="stock-${item.id}">Stock: ${item.stock}</div>
      </div>
      <span>${money(item.pricePence)}</span>
    `;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Add';
    btn.dataset.testid = `add-${item.id}`;
    btn.disabled = item.stock < 1;
    btn.addEventListener('click', () => addToCart(item.id));
    li.appendChild(btn);
    menuList.appendChild(li);
  }

  const entries = Object.entries(state.cart).filter(([, qty]) => qty > 0);
  cartList.innerHTML = '';
  cartEmpty.hidden = entries.length > 0;
  for (const [itemId, quantity] of entries) {
    const item = state.menu.find((m) => m.id === itemId);
    if (!item) continue;
    const li = document.createElement('li');
    li.className = 'cart-item';
    li.dataset.testid = `cart-${itemId}`;
    li.innerHTML = `<span>${item.name}</span><span>× ${quantity}</span><span>${money(item.pricePence * quantity)}</span>`;
    cartList.appendChild(li);
  }
}

placeOrderBtn.addEventListener('click', async () => {
  const cart = Object.entries(state.cart)
    .filter(([, quantity]) => quantity > 0)
    .map(([itemId, quantity]) => ({ itemId, quantity }));

  const cardName = cardNameInput.value.trim();
  const cardExpiryMonth = Number(cardMonthInput.value);
  const cardExpiryYear = Number(cardYearInput.value);

  if (!cardName) {
    setStatus('Cardholder name is required', false);
    return;
  }
  if (!cardMonthInput.value || !cardYearInput.value) {
    setStatus('Expiry month and year are required', false);
    return;
  }

  setStatus('Placing order…');
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cart,
      discountCode: discountInput.value.trim() || undefined,
      cardNumber: cardInput.value.trim(),
      cardName,
      cardExpiryMonth,
      cardExpiryYear,
    }),
  });
  const result = await res.json();
  if (result.ok) {
    setStatus(
      `Order ${result.orderId} paid — total ${money(result.totalPence)}` +
        (result.discountPence ? ` (saved ${money(result.discountPence)})` : ''),
      true,
    );
    state.cart = {};
    await loadMenu();
  } else {
    setStatus(result.message || 'Order failed', false);
  }
});

loadMenu().catch((err) => setStatus(String(err), false));
