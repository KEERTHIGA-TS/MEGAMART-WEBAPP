import React from "react";
import axios from "axios";
import { toast } from "react-toastify";
import PlaceOrder from "./PlaceOrder";

const BASE_URL = process.env.REACT_APP_API || "http://localhost:5000";


const Cart = ({ user, cartItems, setCartItems }) => {
  // Update quantity
  const updateQuantity = async (productId, newQty) => {
    console.log("Cart page product id: ", productId);
    console.log("cartItems: ",cartItems);
    const product = cartItems.find((item) => item.productId._id === productId);
    if (!product) return;
    console.log("product: ",product);
    const existingQty = product.quantity;
    const stock = product.stock;
    console.log("existingQty: "+existingQty);
    console.log("newQty: "+newQty);
    if (newQty > stock) {
      toast.warn(
        `Only ${stock} items in stock. You already have ${existingQty} in your cart.`
      );
      return;
    }

    if (newQty <= 0) return removeItem(productId);

    try {
      await axios.put(
        `${BASE_URL}/api/cart/update/${user.userId}/${productId}`,
        { quantity: newQty }
      );

      const updated = cartItems.map((item) =>
        item.productId._id === productId ? { ...item, quantity: newQty } : item
      );
      setCartItems(updated);
    } catch (err) {
      console.error("Failed to update quantity:", err);
      toast.error("Failed to update quantity.");
    }
  };

  // Remove item
  const removeItem = async (productId) => {
    try {
      await axios.delete(
        `${BASE_URL}/api/cart/remove/${user.userId}/${productId}`
      );
      setCartItems(cartItems.filter((item) => item.productId._id !== productId));
    } catch (err) {
      console.error("Failed to remove item:", err);
    }
  };

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="cart">
      <h2>Your Cart</h2>
      {cartItems.length === 0 ? (
        <p>No items in cart.</p>
      ) : (
        <>
          {cartItems.map((item) => (
            <div key={item._id} className="cart-item"> 
              <img
                src={
                  item.productId.image?.startsWith("http")
                    ? item.productId.image
                    : `${BASE_URL}${item.productId.image}`
                }
                alt={item.productId.name}
                width={80}
              />

              <div>
                <h4>{item.name}</h4>
                <p>₹{item.price}</p>
                <div className="quantity-section">
                  <button onClick={() => updateQuantity(item.productId._id, item.quantity - 1)}>
                  -
                  </button>
                  <span style={{ margin: "0 10px" }}>{item.quantity}</span>
                  <button
                    onClick={() => {
                      console.log(item);
                      updateQuantity(item.productId._id, item.quantity + 1);
                    }}
                    disabled={item.quantity >= item.stock}
                    style={{
                      opacity: item.quantity >= item.stock ? 0.3 : 1,
                      cursor: item.quantity >= item.stock ? "not-allowed" : "pointer",
                    }}
                  >
                  +
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.productId._id)}
                  style={{ backgroundColor: " #ef4444" }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <h3 style={{ textAlign: "right" }}>Total: ₹{total.toFixed(2)}</h3>

          {user && (
            <PlaceOrder
              cartItems={cartItems}
              userId={user.userId}
              onSuccess={() => setCartItems([])}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Cart;
