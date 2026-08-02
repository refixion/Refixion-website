import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get("/shop/admin/orders")
      .then((res) => setOrders(res.data))
      .catch(console.error);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Bestellingen</h1>

      <div className="mt-6 space-y-4">
        {orders.map((order) => (
  <Link
    key={order.id}
    to={`/admin/orders/${order.id}`}
    className="block border rounded-xl p-5 hover:border-black transition"
  >
    <div className="flex justify-between items-start">

      <div>
        <div className="font-semibold text-lg">
          {order.order_number}
        </div>

        <div className="text-sm text-gray-500">
          {order.first_name} {order.last_name}
        </div>

        <div className="text-sm text-gray-500">
          {order.email}
        </div>
      </div>


      <div className="text-right">

        <div className="font-semibold">
          €{order.total_price}
        </div>

        <div className="text-sm">
          Status: {order.order_status}
        </div>

      </div>

    </div>
  </Link>
))}
      </div>
    </div>
  );
}
