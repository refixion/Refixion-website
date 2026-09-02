import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    api
      .get(`/shop/admin/orders?q=${q}&page=${page}&limit=${limit}`)
      .then((res) => {
        setOrders(res.data.orders);
        setPages(res.data.pages);
      })
      .catch(console.error);
  }, [q, page, limit]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">
        Bestellingen
      </h1>

      {/* Zoek + aantal per pagina */}
      <div className="mt-4 flex gap-3 flex-wrap">

        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Zoek op ordernummer of e-mail..."
          className="border rounded-lg px-4 py-2 w-80"
        />

        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          className="border rounded-lg px-3 py-2"
        >
          <option value={5}>5 per pagina</option>
          <option value={10}>10 per pagina</option>
          <option value={20}>20 per pagina</option>
        </select>

      </div>


      {/* Orders */}
      <div className="mt-6 space-y-4">

        {orders.map((order) => (

          <Link
            key={order.id}
            to={`/admin/orders/${order.id}`}
            className="block border rounded-xl p-5 hover:border-black transition bg-white"
          >

            <div className="flex justify-between items-start">

              <div>

                <div className="font-semibold text-lg">
                  {order.order_number}
                </div>

                <div className="text-sm text-gray-600">
                  {order.first_name} {order.last_name}
                </div>

                <div className="text-sm text-gray-500">
                  {order.email}
                </div>

              </div>


              <div className="text-right">

                <div className="font-semibold">
                  €{Number(order.total_price).toFixed(2)}
                </div>

                <div className="mt-2 flex flex-wrap gap-2 justify-end text-xs">
                  <span className="rounded-full bg-green-100 text-green-800 px-2 py-1 font-medium">
                    {PAYMENT_STATUS_LABEL[order.payment_status] || order.payment_status || "Onbekend"}
                  </span>
                  <span className="rounded-full bg-gray-100 text-gray-700 px-2 py-1 font-medium">
                    {ORDER_STATUS_LABEL[order.order_status] || order.order_status || "Onbekend"}
                  </span>
                </div>

              </div>

            </div>

          </Link>

        ))}


        {orders.length === 0 && (
          <div className="text-gray-500 py-10">
            Geen bestellingen gevonden.
          </div>
        )}

      </div>


      {/* Pagination */}
      <div className="mt-6 flex gap-2">

        {Array.from({ length: pages }).map((_, i) => (

          <button
            key={i}
            onClick={() => setPage(i + 1)}
            className={
              page === i + 1
                ? "bg-black text-white px-3 py-2 rounded"
                : "border px-3 py-2 rounded"
            }
          >
            {i + 1}
          </button>

        ))}

      </div>

    </div>
  );
}
