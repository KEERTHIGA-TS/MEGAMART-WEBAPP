// Home.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const BASE_URL = process.env.REACT_APP_API || "http://localhost:5000";

const Home = ({ user }) => {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    axios
      .get(`${BASE_URL}/api/products`)
      .then((res) => setProducts(res.data))
      .catch((err) => console.error("Error fetching products:", err));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`${BASE_URL}/api/products/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      alert("Product deleted");
    } catch (err) {
      console.error("Failed to delete:", err);
      alert("Error deleting product");
    }
  };

  return (
    <div className="home">
      <h2>All Products</h2>

      {isAdmin && (
        <button className="add-product-btn" onClick={() => navigate("/add-product")}>
          + Add Product
        </button>
      )}

      <div className="product-list">
        {products.map((product) => (
          <div className="product-card" key={product._id}>
            <img src={product.image} alt={product.name} />
            <div className="h3-div"><h3>{product.name}</h3></div>
            <p>₹{product.price}</p>
            <Link to={`/product/${product._id}`} className="details-btn">
              View Details
            </Link>

            {isAdmin && (
              <div className="admin-btns">
                <button
                  className="edit-btn"
                  onClick={() => navigate(`/edit-product/${product._id}`)}
                >
                  Edit
                </button>
                <button className="delete-btn" onClick={() => handleDelete(product._id)}>
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
