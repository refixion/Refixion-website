import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get("/admin/orders")
      .then((res) => setOrders(res.data))
      .catch(console.error);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Bestellingen</h1>

      <div className="mt-6 space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="border rounded-xl p-4">
            <div>
              <b>{order.order_number}</b>
            </div>
            <div>{order.customer_name}</div>
            <div>{order.email}</div>
            <div>€{order.total}</div>
            <div>Status: {order.order_status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
