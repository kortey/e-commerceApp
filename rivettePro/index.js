const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const twilio = require("twilio");
const axios = require("axios");
const { saveOrder, getOrdersByPhone } = require("./firebase.js");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Function to send WhatsApp message
async function sendWhatsAppMessage(phoneNumber, orderDetails) {
  try {
    const message = `Thank you for your order!\n\n` +
      `Order Details:\n` +
      `Name: ${orderDetails.name}\n` +
      `Meal Plan: ${orderDetails.plan}\n` +
      `Delivery Address: ${orderDetails.address}\n` +
      `Total Amount: $${orderDetails.totalAmount}\n\n` +
      `We'll process your order soon!`;

    // Format the to phone number for WhatsApp
    const toWhatsAppNumber = `whatsapp:${phoneNumber}`;
    const fromWhatsAppNumber = `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`;

    console.log('Sending WhatsApp message to:', toWhatsAppNumber);
    console.log('Message content:', message);
    console.log('From WhatsApp number:', fromWhatsAppNumber);

    const response = await twilioClient.messages.create({
      body: message,
      from: fromWhatsAppNumber,
      to: toWhatsAppNumber
    });

    console.log('WhatsApp message sent successfully:', response.sid);
    console.log('Message status:', response.status);
    console.log('Full response:', JSON.stringify(response, null, 2));
    return response;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error.message);
    console.error('Full error details:', JSON.stringify(error, null, 2));
    throw error;
  }
}

// Route to save order
app.post("/api/orders", async (req, res) => {
  try {
    const orderData = req.body;
    if (!orderData.phone) {
      throw new Error('Phone number is required');
    }
    const savedOrder = await saveOrder(orderData);
    
    // Format phone number for WhatsApp (remove leading 0 and add country code if needed)
    let whatsappNumber = orderData.phone;
    if (whatsappNumber.startsWith('0')) {
      whatsappNumber = '233' + whatsappNumber.substring(1);
    }
    if (!whatsappNumber.startsWith('+')) {
      whatsappNumber = '+' + whatsappNumber;
    }

    // Send WhatsApp notification
    await sendWhatsAppMessage(whatsappNumber, orderData);
    
    res.status(201).json({ 
      success: true,
      message: "Order saved successfully", 
      orderId: savedOrder.id,
      totalAmount: orderData.totalAmount
    });
  } catch (error) {
    console.error('Error saving order:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message || 'Error processing order'
    });
  }
});

// Route to get orders by phone
app.get("/api/orders/:phone", async (req, res) => {
  try {
    const orders = await getOrdersByPhone(req.params.phone);
    res.json({
      success: true,
      orders: orders
    });
  } catch (error) {
    console.error("Error getting orders:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
