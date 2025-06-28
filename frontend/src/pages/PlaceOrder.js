import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const BASE_URL = process.env.REACT_APP_API || "http://localhost:5000";

const PlaceOrder = ({ cartItems, userId, onSuccess }) => {
  const navigate = useNavigate();
  const [address, setAddress] = useState({
    fullName: "", street: "", city: "", zip: "", phone: ""
  });
  const [paymentMethod, setPaymentMethod] = useState("COD");

  const handleChange = e => setAddress({ ...address, [e.target.name]: e.target.value });

  const placeOrder = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/api/orders`, {
        userId,
        address,
        paymentMethod,
        products: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      });

      toast.success("Order placed!");
      onSuccess(); // clear cart
      navigate(`/order-success/${res.data.order._id}`);
    } catch (err) {
      console.error("Place order error", err.response?.data || err.message);
      toast.error("Order failed");
    }
  };

  return (
    <div className="place-order-container">
      <h2>Delivery Address</h2>
      <input name="fullName" placeholder="Full Name" onChange={handleChange} />
      <input name="street" placeholder="Street" onChange={handleChange} />
      <input name="city" placeholder="City" onChange={handleChange} />
      <input name="zip" placeholder="ZIP" onChange={handleChange} />
      <input name="phone" placeholder="Phone" onChange={handleChange} />

      <h3>Payment Method</h3>
      <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
        <option value="COD">Cash on Delivery</option>
        <option value="Online">Online (Test)</option>
      </select>

      <button onClick={placeOrder}>Place Order</button>
    </div>
  );
};

export default PlaceOrder;
