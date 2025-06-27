import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify"; // ✅ if you want to show toast

const BASE_URL = process.env.REACT_APP_API || "http://localhost:5000";

const MyOrders = ({ user }) => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (user) {
      axios
        .get(`${BASE_URL}/api/orders/user/${user.userId}`)
        .then((res) => setOrders(res.data))
        .catch((err) => console.error("Orders fetch error", err));
    }
  }, [user]);

  const cancelOrder = async (id) => {
    try {
      const res = await axios.patch(`${BASE_URL}/api/orders/${id}/cancel`);
      setOrders((prev) =>
        prev.map((o) => (o._id === id ? res.data.order : o))
      );
      toast.success("Order cancelled and email sent!");
    } catch (err) {
      toast.error("Failed to cancel order");
      console.error(err);
    }
  };

  return (
    <div className="my-orders">
      <h1>My Orders</h1>
      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        orders.map((order) => (
          <div key={order._id} className="order-card">
            <p><b>Order ID:</b> {order._id}</p>
            <p><b>Status:</b> {order.status}</p>
            <p><b>Placed On:</b> {new Date(order.createdAt).toLocaleString('en-IN')}</p>

            {order.status === "Cancelled" && order.cancelledAt && (
              <p style={{ color: "red" }}>
                <b>Cancelled At:</b> {new Date(order.cancelledAt).toLocaleString('en-IN')}
              </p>
            )}

            <p><b>Total:</b> ₹{order.totalAmount}</p>

            <h4>Products:</h4>
            <ul className="order-product-list">
              {order.products.map((p, i) => (
                <li key={i} className="order-product-item">
                  <img
                    src={`${BASE_URL}${p.productId.image}`}
                    alt={p.productId.name}
                    className="product-image"
                  />
                  <div className="product-info">
                    <p><b>{p.productId.name}</b></p>
                    <p>Price: ₹{p.productId.price} × {p.quantity}</p>
                  </div>
                </li>
              ))}
            </ul>

            <h3>📍 Delivery Address:</h3>
            <p>
              {order.address.fullName}<br/>
              {order.address.phone}<br/>
              {order.address.street}, {order.address.city} - {order.address.zip}<br/>
            </p>

            {order.status === "Pending" && (
              <button className="cancel-btn" onClick={() => cancelOrder(order._id)}>
                Cancel Order
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default MyOrders;
