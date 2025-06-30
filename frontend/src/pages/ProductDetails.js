import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

//import "./ProductDetails.css";

const BASE_URL = process.env.REACT_APP_API || "http://localhost:5000";

const ProductDetails = ({ user, fetchCartItems }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    axios
      .get(`${BASE_URL}/api/products/${id}`)
      .then((res) => 
        setProduct(res.data))
      .catch((err) => console.error("Error fetching product details:", err));
  }, [id]);

  const handleAddToCart = async () => {
  if (!user) {
    toast.error("Please log in first");
    return;
  }

  try {
    // Get current cart items to check existing quantity
    const res = await axios.get(`${BASE_URL}/api/cart/${user.userId}`);
    console.log(res.data.items);

    console.log(user.userId);
    const existingCartItem = (res.data.items || []).find(item => item.productId._id === product._id);
    console.log(existingCartItem);
    const existingQty = existingCartItem ? existingCartItem.quantity : 0;
    const newTotalQty = existingQty + quantity;
    console.log(existingQty);
    console.log(quantity);
    if (newTotalQty > product.stock) {
      toast.warn(`Only ${product.stock} items in stock. You already have ${existingQty} in your cart.`);
      return;
    }

    // Proceed with adding to cart
    await axios.post(`${BASE_URL}/api/cart`, {
      userId: user.userId,
      productId: product._id,
      quantity,
    });


    await fetchCartItems(user.userId);
    toast.success("Added to cart");
  } catch (err) {
    console.error("Failed to add to cart:", err);
    toast.error("Failed to add to cart");
  }
};


  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate("/cart");
  };

  if (!product) return <p>Loading...</p>;

  const discountedPrice = product.price - (product.price * (product.discount || 0)) / 100;

  return (
    <div className="product-detail-page">
      <div className="left-panel">
        <Zoom>
          <img
            src={`${BASE_URL}${product.image}`}
            alt={product.name}
            style={{
              width: "100%",
              maxWidth: "400px",
              borderRadius: "10px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          />
        </Zoom>
      </div>


      <div className="right-panel">
        {product.stock === 0 && <span className="stock-label">Out of stock</span>}

        <h2>{product.name}</h2>
        <p className="category-brand">
          CATEGORY: {product.category}, {product.brand}
        </p>
        <p>AVAILABILITY: {product.stock}</p>

        <div className="rating-section">
          <span className="star">★</span> 4.5/5 (0 Reviews)
        </div>

        <div className="price-section">
        {product.discount > 0 && (
          <>
            <p className="original-price">
              <s>₹{product.price.toLocaleString()}</s>
            </p>
            <p className="discount-percentage">
              ({product.discount}% OFF)
            </p>
          </>
        )}
        <h3 className="discounted-price">₹{discountedPrice.toLocaleString()}</h3>
      </div>
        
        <div className="quantity-section">
          {!isAdmin &&(
            <>
              <label>Quantity:</label>
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
              <input type="text" value={quantity} readOnly/>
              <button onClick={() => setQuantity((q) => q + 1)}>+</button>
            </>           
          )}
        </div>

        <div className="total-section">
          {!isAdmin &&(
              <strong>Total: ₹{(discountedPrice * quantity).toLocaleString()}</strong>
          )}
        </div>

        <div className="action-buttons">
          {!isAdmin &&(
            <>
              <button
                className="add-to-cart-btn"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                Add to Cart
              </button>
              <button
                className="buy-now-btn"
                onClick={handleBuyNow}
                disabled={product.stock === 0}
              >
                Buy Now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
