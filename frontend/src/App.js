// App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "./pages/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Cart from "./pages/Cart";
import ProductDetails from "./pages/ProductDetails";
import AddProduct from "./pages/AddProduct";
import EditProduct from "./pages/EditProduct";
import MyOrders from "./pages/MyOrders";
import OrderSuccess from "./pages/OrderSuccess";
import "./styles.css";

const BASE_URL = process.env.REACT_APP_API || "http://localhost:5000";

function App() {
  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState([]);



  /*const getProductDetails = async (productId) => {
    const res = await fetch(`http://localhost:5000/api/products/${productId}`);
    return await res.json();
  };*/

  const fetchCartItems = async (userId) => {
    try {
      const res = await fetch(`${BASE_URL}/api/cart/${userId}`);
      const data = await res.json();
      //console.log(data);
      const itemsWithDetails = await Promise.all(
        (data.items || []).map(async (item) => {
          const product = item.productId;
          return {
            ...item,
            name: product.name,
            price: product.price,
            image: product.image,
            stock: product.stock, 
          };
        })
      );
      //console.log(itemsWithDetails);
      setCartItems(itemsWithDetails);
    } catch (err) {
      console.error("Failed to fetch cart items:", err);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/auth/check`, {
          credentials: "include",
        });
        const data = await res.json();

        if (data.valid) {
          const sessionUser = {
            userId: data.userId,
            username: data.username,
            role: data.role ,
            email: data.email,
          };
          setUser(sessionUser);
          await fetchCartItems(data.userId);
        }
      } catch (err) {
        console.error("Session check failed", err);
      }
    };

    checkSession();
  }, []);

  const handleLogin = async (data) => {
    try {
      const sessionUser = {
        userId: data.userId,
        username: data.username,
        role: data.role || "user",
        email: data.email,
      };
      setUser(sessionUser);
      await fetchCartItems(data.userId);
    } catch (err) {
      console.error("Login post-processing failed:", err);
      toast.error("Login setup failed");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      setCartItems([]);
      window.location.href = "/";
      toast.success("Logout successful!");
    } catch (err) {
      console.error("Logout failed", err);
      toast.error("Logout failed. Please try again.");
    }
  };

  return (
    <Router>
      <Navbar isLoggedIn={!!user} onLogout={handleLogout} cartCount={cartItems.length} user={user} />
      <ToastContainer position="top-center" autoClose={3000} />
      <Routes>
        <Route path="/" element={<Home user={user} />} />
        <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
        <Route path="/signup" element={!user ? <Signup onSignup={handleLogin} /> : <Navigate to="/" />} />
        <Route
          path="/add-product"
          element={user?.role === "admin" ? <AddProduct /> : <Navigate to="/" />}
        />
         <Route
          path="/edit-product/:id"
          element={user?.role === "admin" ? <EditProduct /> : <Navigate to="/" />}
        />
        <Route
          path="/cart"
          element={
            user ? (
              
              <Cart user={user} cartItems={cartItems} setCartItems={setCartItems} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/product/:id"
          element={
            <ProductDetails user={user} setCartItems={setCartItems} fetchCartItems={fetchCartItems} />
          }
        />
        {/* <Route path="/my-orders" element={<MyOrders user={user} />} /> */}
        <Route path="/orders" element={<MyOrders user={user} />} />
        <Route path="/order-success/:id" element={<OrderSuccess />} />
      </Routes>
    </Router>
  );
}

export default App;
