import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../lib/api";

const PAYMENT_STATUS_LABEL = {
  paid: "Betaald",
  pending: "In behandeling",
  cancelled: "Geannuleerd",
  failed: "Mislukt",
};

const ORDER_STATUS_LABEL = {
  new: "Nieuw",
  processing: "In verwerking",
  waiting_parts: "Wacht op onderdelen",
  packed: "Ingepakt",
  shipped: "Verzonden",
  delivered: "Afgeleverd",
  cancelled: "Geannuleerd",
};

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

const loadOrder = useCallback(async () => {
  setLoading(true);

  try {
    const res = await api.get(`/shop/admin/orders/${id}`);
    setOrder(res.data);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }

}, [id]);


useEffect(() => {
  loadOrder();
}, [loadOrder]);
  
async function updateStatus(status) {
  await api.put(`/shop/admin/orders/${id}/status`, {
    status: status,
  });

  loadOrder();
}
  
  if (loading) return <div>Laden...</div>;

  if (!order) return <div>Bestelling niet gevonden.</div>;

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-3xl font-bold">
          {order.order_number}
        </h1>

        <p className="text-gray-500">
          {new Date(order.created_at).toLocaleString("nl-NL")}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">

        <div className="border rounded-xl p-5">
          <h2 className="font-semibold mb-4">
            Klantgegevens
          </h2>

          <p><b>Naam:</b> {order.first_name} {order.last_name}</p>
          <p><b>E-mail:</b> {order.email}</p>
          <p><b>Telefoon:</b> {order.phone}</p>
        </div>

        <div className="border rounded-xl p-5">
          <h2 className="font-semibold mb-4">
            Verzendadres
          </h2>

          <p>{order.street} {order.house_number}</p>
          <p>{order.postal_code}</p>
          <p>{order.city}</p>
          <p>{order.country}</p>
        </div>

      </div>

      <div className="border rounded-xl p-5">

        <h2 className="font-semibold mb-4">
          Producten
        </h2>

        <div className="space-y-4">

          {order.items.map(item => (

            <div
              key={item.product_id}
              className="flex justify-between border-b pb-3"
            >
              <div>

                <div className="font-medium">
                  {item.product_title}
                </div>

                <div className="text-sm text-gray-500">
                  {item.quantity} × €{item.unit_price}
                </div>

                {item.options?.length > 0 && (

                  <ul className="text-sm mt-2">

                    {item.options.map(opt => (

                      <li key={opt.id}>
                        • {opt.name} (+€{opt.price})
                      </li>

                    ))}

                  </ul>

                )}

              </div>

              <div className="font-semibold">
                €{item.line_total}
              </div>

            </div>

          ))}

        </div>

      </div>

      <div className="border rounded-xl p-5">

        <h2 className="font-semibold mb-4">
          Bestelling
        </h2>

        <p>Subtotaal: €{order.subtotal}</p>
        <p>Verzendkosten: €{order.shipping_cost}</p>

        <p className="text-xl font-bold mt-2">
          Totaal: €{order.total_price}
        </p>

      </div>

      <div className="border rounded-xl p-5">

        <h2 className="font-semibold mb-4">
          Status
        </h2>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="rounded-full bg-green-100 text-green-800 px-2 py-1 text-xs font-medium">
            {PAYMENT_STATUS_LABEL[order.payment_status] || order.payment_status || "Onbekend"}
          </span>
          <span className="rounded-full bg-gray-100 text-gray-700 px-2 py-1 text-xs font-medium">
            {ORDER_STATUS_LABEL[order.order_status] || order.order_status || "Onbekend"}
          </span>
        </div>

        <select
          value={order.order_status}
          onChange={(e) => updateStatus(e.target.value)}
          className="border rounded-lg px-3 py-2"
        >
          <option value="new">Nieuw</option>
          <option value="processing">Wordt verwerkt</option>
          <option value="waiting_parts">Wacht op onderdelen</option>
          <option value="packed">Ingepakt</option>
          <option value="shipped">Verzonden</option>
          <option value="delivered">Afgeleverd</option>
          <option value="cancelled">Geannuleerd</option>
        </select>

      </div>

    </div>
  );
}
