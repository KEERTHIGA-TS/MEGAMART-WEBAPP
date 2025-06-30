import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const BASE_URL = process.env.REACT_APP_API || "http://localhost:5000";

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/products/${id}`);
        setProduct(res.data);
      } catch (err) {
        toast.error("Failed to load product");
      }
    };
    fetchProduct();
  }, [id]);

  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const formData = new FormData();

    for (const key in product) {
      if (key !== "image") {
        formData.append(key, product[key]);
      }
    }

    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      await axios.put(`${BASE_URL}/api/products/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Product updated!");
      navigate("/");
    } catch (err) {
      toast.error("Update failed");
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`${BASE_URL}/api/products/${id}`);
      toast.success("Product deleted!");
      navigate("/");
    } catch (err) {
      toast.error("Delete failed");
      console.error(err);
    }
  };

  if (!product) return <p>Loading...</p>;

  return (
    <form onSubmit={handleUpdate} className="auth-container">
      <h2>Edit Product</h2>
      <input
        type="text"
        name="name"
        value={product.name}
        onChange={handleChange}
        placeholder="Name"
        required
      />
      <textarea
        name="description"
        value={product.description}
        onChange={handleChange}
        placeholder="Description"
        required
      />
      <input
        type="number"
        name="price"
        value={product.price}
        onChange={handleChange}
        placeholder="Price"
        required
      />
      <input
        type="text"
        name="category"
        value={product.category}
        onChange={handleChange}
        placeholder="Category"
      />
      <input
        type="text"
        name="brand"
        value={product.brand}
        onChange={handleChange}
        placeholder="Brand"
      />
      <input
        type="number"
        name="discount"
        value={product.discount}
        onChange={handleChange}
        placeholder="Discount (%)"
      />
      <input
        type="number"
        name="stock"
        value={product.stock}
        onChange={handleChange}
        placeholder="Stock"
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files[0])}
      />
      {product.image && (
        <img
          src={`${BASE_URL}${product.image}`} // Cloudinary full URL already
          alt="Preview"
          style={{ width: "150px", marginTop: "10px" }}
        />
      )}
      <button type="submit">Update Product</button>
      <button type="button" onClick={handleDelete} style={{ backgroundColor: "#dc3545" }}>
        Delete Product
      </button>
    </form>
  );
};

export default EditProduct;
