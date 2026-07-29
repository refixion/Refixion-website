import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Section } from "../components/site/primitives";
import { getCart, removeFromCart, updateCartQuantity } from "../lib/cart";

const FREE_SHIPPING_FROM = 50;
const SHIPPING_COST = 4.95;
const VAT_RATE = 0.21;

function formatPrice(price) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(price);
}

function lineTotal(item) {
  return (item.unitPrice + (item.optionsPrice || 0)) * item.quantity;
}

export default function CartPage() {
  const [items, setItems] = useState([]);

  const reload = () => setItems(getCart());

  useEffect(() => {
    reload();
    // Zodat de pagina ook bijwerkt als het item ergens anders is toegevoegd
    // (bv. via de productpagina in een andere tab).
    const onUpdate = () => reload();
    window.addEventListener("refixion:cart-updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("refixion:cart-updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const handleRemove = (idx, title) => {
    removeFromCart(idx);
    reload();
    toast.success(`${title} verwijderd uit winkelwagen`);
  };

  const handleQuantity = (idx, quantity) => {
    if (quantity < 1) return;
    updateCartQuantity(idx, quantity);
    reload();
  };

  if (items.length === 0) {
    return (
      <Section>
        <div className="text-center py-20">
          <ShoppingBag className="h-12 w-12 text-[#CCCCCC] mx-auto" strokeWidth={1} />
          <div className="mt-4 text-[18px] font-medium text-[#111111]">Je winkelwagen is leeg.</div>
          <p className="mt-2 text-[14px] text-[#666666]">Bekijk onze refurbished toestellen en vind je volgende telefoon.</p>
          <Link
            to="/shop"
            data-testid="cart-empty-shop-link"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#111111] text-white px-6 py-3 text-[14px] font-medium hover:bg-[#333]"
          >
            Naar de shop
          </Link>
        </div>
      </Section>
    );
  }

  const subtotal = items.reduce((sum, item) => sum + lineTotal(item), 0);
  const shipping = subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;
  const vatPortion = total - total / (1 + VAT_RATE);

  return (
    <div className="bg-white">
      <Section>
        <Link to="/shop" className="inline-flex items-center gap-2 text-[14px] text-[#666666] hover:text-[#111111]">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} /> Verder winkelen
        </Link>

        <h1 className="mt-6 text-3xl md:text-4xl font-semibold tracking-tight text-[#111111]">Winkelwagen.</h1>

        <div className="mt-8 grid lg:grid-cols-3 gap-10">
          {/* Items */}
          <div className="lg:col-span-2">
            {items.map((item, idx) => (
              <div
                key={`${item.productId}-${idx}`}
                data-testid={`cart-item-${idx}`}
                className="flex flex-col sm:flex-row sm:items-center gap-4 py-6 border-b border-[#EAEAEA]"
              >
                <Link to={`/shop/${item.slug}`} className="shrink-0 h-20 w-20 rounded-xl bg-[#FAFAFA] border border-[#EAEAEA] overflow-hidden flex items-center justify-center">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className="h-6 w-6 text-[#CCCCCC]" strokeWidth={1} />
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <Link to={`/shop/${item.slug}`} className="text-[15px] font-medium text-[#111111] hover:underline">
                    {item.title}
                  </Link>
                  {item.optionsLabel && (
                    <div className="text-[13px] text-[#666666] mt-0.5">+ {item.optionsLabel}</div>
                  )}
                  <div className="text-[13px] text-[#666666] mt-0.5 sm:hidden">
                    {formatPrice(item.unitPrice + (item.optionsPrice || 0))} per stuk
                  </div>
                </div>

                <div className="hidden sm:block w-28 text-[14px] text-[#666666]">
                  {formatPrice(item.unitPrice + (item.optionsPrice || 0))}
                </div>

                <div className="inline-flex items-center rounded-full border border-[#EAEAEA] self-start sm:self-auto">
                  <button
                    onClick={() => handleQuantity(idx, item.quantity - 1)}
                    className="h-9 w-9 flex items-center justify-center hover:bg-[#FAFAFA] rounded-l-full"
                    aria-label="Minder"
                  >
                    <Minus className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                  <span className="w-8 text-center text-[14px] text-[#111111]" data-testid={`cart-item-qty-${idx}`}>{item.quantity}</span>
                  <button
                    onClick={() => handleQuantity(idx, item.quantity + 1)}
                    className="h-9 w-9 flex items-center justify-center hover:bg-[#FAFAFA] rounded-r-full"
                    aria-label="Meer"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                </div>

                <div className="w-24 text-right text-[15px] font-semibold text-[#111111]">
                  {formatPrice(lineTotal(item))}
                </div>

                <button
                  onClick={() => handleRemove(idx, item.title)}
                  aria-label="Verwijderen"
                  data-testid={`cart-item-remove-${idx}`}
                  className="text-[#666666] hover:text-[#DC2626] p-2 self-end sm:self-auto"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div>
            <div className="rounded-2xl border border-[#EAEAEA] bg-[#FAFAFA] p-6 sticky top-24">
              <div className="text-[15px] font-semibold text-[#111111] mb-4">Overzicht</div>

              <div className="space-y-2 text-[14px]">
                <div className="flex justify-between text-[#666666]">
                  <span>Subtotaal</span>
                  <span data-testid="cart-subtotal">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#666666]">
                  <span>Verzendkosten</span>
                  <span data-testid="cart-shipping">{shipping === 0 ? "Gratis" : formatPrice(shipping)}</span>
                </div>
                {shipping > 0 && (
                  <div className="text-[12px] text-[#999999]">
                    Gratis verzending vanaf {formatPrice(FREE_SHIPPING_FROM)}
                  </div>
                )}
                <div className="flex justify-between text-[12px] text-[#999999] pt-1">
                  <span>Waarvan {Math.round(VAT_RATE * 100)}% btw</span>
                  <span>{formatPrice(vatPortion)}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#EAEAEA] flex justify-between items-baseline">
                <span className="text-[15px] font-medium text-[#111111]">Totaal</span>
                <span className="text-[22px] font-semibold text-[#111111]" data-testid="cart-total">{formatPrice(total)}</span>
              </div>

              <button
                data-testid="cart-checkout-btn"
                onClick={() => toast.info("Checkout volgt in de volgende fase")}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#111111] text-white px-6 py-3.5 text-[15px] font-medium hover:bg-[#333] transition-colors"
              >
                Verder naar checkout
              </button>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
