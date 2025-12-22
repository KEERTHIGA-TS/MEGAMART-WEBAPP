// AddProduct.js
import React, { useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify"; 

const BASE_URL = process.env.REACT_APP_API || "http://localhost:5000";

const AddProduct = () => {
  const [name, setName] = useState("");
  const [description, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [discount, setDiscount] = useState("");
  const [stock, setStock] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = useRef(null);


  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();

    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("category", category);
    formData.append("brand", brand);
    formData.append("discount", discount);
    formData.append("stock", stock);
    formData.append("image", imageFile);

    try {
       const res = await axios.post(
          `${BASE_URL}/api/products`,
          formData,
          {
            withCredentials: true,
          }
        );


      
      toast.success("Product added successfully");
      console.log(res.data);

      // Optional: reset form
      setName("");
      setDesc("");
      setPrice("");
      setCategory("");
      setBrand("");
      setDiscount("");
      setStock("");
      setImageFile(null);
      if (fileInputRef.current) {
      fileInputRef.current.value = "";
}
    } catch (err) {
        console.log("Upload error full:", err);
        console.log("Response data:", err.response?.data);
        console.log("Status:", err.response?.status);
        console.log("Headers:", err.response?.headers);
      
        toast.error(err.response?.data?.details || "Failed to add product");
      }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-container">
      <h2>Add Product</h2>
      <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
      <textarea placeholder="Description" value={description} onChange={e => setDesc(e.target.value)} required />
      <input type="number" placeholder="Price" value={price} onChange={e => setPrice(e.target.value)} required />
      <input type="text" placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} />
      <input type="text" placeholder="Brand" value={brand} onChange={e => setBrand(e.target.value)} />
      <input type="number" placeholder="Discount (%)" value={discount} onChange={e => setDiscount(e.target.value)} />
      <input type="number" placeholder="Stock" value={stock} onChange={e => setStock(e.target.value)} />
      
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={e => setImageFile(e.target.files[0])}
        
      />

      {/* ✅ Image Preview */}
      {imageFile && (
        <img
          src={URL.createObjectURL(imageFile)}
          alt="Preview"
          style={{ width: "150px", marginTop: "10px" }}
        />
      )}

      <button type="submit">Add Product</button>
    </form>
  );
};

export default AddProduct;
