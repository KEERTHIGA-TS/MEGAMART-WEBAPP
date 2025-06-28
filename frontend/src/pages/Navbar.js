import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const BASE_URL = process.env.REACT_APP_API || "http://localhost:5000";

const Navbar = ({ isLoggedIn, user, cartCount, onLogout }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();

  const isAdmin = user?.role === "admin";

  const togglePopup = () => setShowPopup(!showPopup);
  

  const handleSearchChange = async (e) => {
    const input = e.target.value;
    setQuery(input);

    if (input.length >= 1) {
      try {
        const res = await axios.get(`${BASE_URL}/api/products/search?q=${input}`);
        setSuggestions(res.data);
      } catch (err) {
        console.error("Search error", err);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (productId) => {
    setQuery("");
    setSuggestions([]);
    navigate(`/product/${productId}`);
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">MegaMart</Link>
      </div>

      <div className="navbar-search">
        <input
          className="input-search"
          type="text"
          value={query}
          onChange={handleSearchChange}
          placeholder="Search products..."
        />
        {suggestions.length > 0 && (
          <ul className="suggestion-list">
            {suggestions.map((s) => (
              <li key={s._id} onClick={() => handleSelectSuggestion(s._id)}>
                {s.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="navbar-links">
        {isLoggedIn ? (
          <>
            <Link to="/">Home</Link>
            {!isAdmin && (
              <>
              <Link to="/cart">Cart ({cartCount})</Link>
              <Link to="/orders">Orders</Link>
              </>
            )}
            <img
              src="/images/profile-img.png"
              alt="Profile"
              className="profile-icon"
              onClick={togglePopup}
            />
            {showPopup && (
              <div className="profile-popup">
                <p><strong>{user?.username}</strong></p>
                <p>{user?.email}</p>
                <button onClick={onLogout}>Logout</button>
              </div>
            )}
          </>
        ) : (
          <>
            <Link to="/">Home</Link>
            <Link to="/login">Login</Link>
            <Link to="/signup">Signup</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
