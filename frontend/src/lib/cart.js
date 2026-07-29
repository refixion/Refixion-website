/**
 * Lichte, localStorage-gebaseerde winkelwagen.
 *
 * Dit is bewust minimaal gehouden — Fase 1 heeft alleen "toevoegen" nodig voor
 * de knop op de productpagina. Fase 2 (/cart) bouwt de volledige winkelwagen-
 * pagina op exact dezelfde functies, zodat er geen tweede opslagformaat komt.
 *
 * Item-vorm: { productId, slug, title, image, unitPrice, optionIds, optionsLabel, optionsPrice, quantity }
 */
const CART_KEY = "refixion_cart_v1";

function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeCart(items) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    // localStorage kan falen in privénavigatie met volle quota — winkelwagen
    // werkt dan gewoon niet, geen crash.
  }
  window.dispatchEvent(new CustomEvent("refixion:cart-updated", { detail: items }));
}

function lineKey(item) {
  return `${item.productId}::${(item.optionIds || []).slice().sort().join(",")}`;
}

export function getCart() {
  return readCart();
}

export function getCartCount() {
  return readCart().reduce((sum, i) => sum + i.quantity, 0);
}

export function addToCart(item) {
  const items = readCart();
  const idx = items.findIndex((i) => lineKey(i) === lineKey(item));
  if (idx >= 0) {
    items[idx].quantity += item.quantity;
  } else {
    items.push(item);
  }
  writeCart(items);
  return items;
}

export function removeFromCart(index) {
  const items = readCart();
  items.splice(index, 1);
  writeCart(items);
  return items;
}

export function updateCartQuantity(index, quantity) {
  const items = readCart();
  if (!items[index]) return items;
  items[index].quantity = Math.max(1, Math.floor(quantity) || 1);
  writeCart(items);
  return items;
}

export function clearCart() {
  writeCart([]);
}
