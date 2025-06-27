import React from "react";
import { useParams } from "react-router-dom";

const OrderSuccess = () => {
  const { id } = useParams();

  return (
    <div className="order-success" >
        <div className="order-success-cont">
            <h1> <img src="/images/success-icon-10-300x300.png" /> <br/> Order Placed Successfully!</h1>
            <p>Your order ID is: <strong>{id}</strong></p>
            <p>Thank you for shopping with us.</p>
        </div>
    </div>
  );
};

export default OrderSuccess;
