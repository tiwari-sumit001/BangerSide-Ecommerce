# 🔥 BANGER SIDE — Premium E-Commerce Fashion Platform

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live_Demo-BANGER_SIDE-black?style=for-the-badge&logo=render&logoColor=white)](https://bangerside-ecommerce.onrender.com)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-5.x-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

**A full-stack, production-grade e-commerce platform for premium streetwear and ethnic fashion.**

[Live Demo](https://bangerside-ecommerce.onrender.com) · [Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started)

</div>

---

## 📸 Preview

> Shop page with AI Mood Search, Coupon System, and Secure Checkout.

---

## ✨ Features

### 🛍️ Customer Facing
- **AI Mood Search** — Type a vibe (e.g. "College first day" or "Rooftop Party") and get AI-curated product recommendations with match score & styling notes
- **Product Filters** — Filter by gender, price range, category, and sort order
- **Cart Management** — Add, increase, decrease, remove items; size selection per item
- **Wishlist** — Add/remove products, full wishlist page with auto-size persistence
- **Coupon Codes** — Apply discount codes at checkout with server-side validation
- **Cash on Delivery Checkout** — Streamlined COD flow with address management
- **Online Payments** — Razorpay integration for UPI & Card payments
- **Order Tracking** — Full order history with status tracking (Placed → Packed → Shipped → Delivered)
- **Order Cancellation** — Cancel placed/packed orders with automatic stock restoration
- **Dark Mode** — System-wide dark mode toggle with localStorage persistence

### 🔐 Authentication & Security
- **Email OTP Verification** — Real-time email delivery via Nodemailer + Gmail SMTP
- **Guest Access** — Browse the store as a guest; authentication mandatory only for cart & wishlist actions
- **JWT Authentication** — Stateless, role-separated tokens (`user` / `owner`)
- **Session Security** — httpOnly cookies, sameSite protection, secure in production
- **OTP Expiry** — 10-minute OTP expiry with resend functionality

### 🏪 Admin Panel (`/owners`)
- **Dashboard** — Revenue stats, order counts by status, recent orders
- **Product Management** — Create, edit, delete products with multi-image upload (up to 5 images per product)
- **Image Slider** — Multi-angle product image carousel per product
- **Order Management** — View all orders, update status (Placed → Delivered)
- **Coupon Management** — Create, activate/deactivate, manage discount coupons with expiry dates

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js 18+ |
| **Framework** | Express.js 5.x |
| **Database** | MongoDB + Mongoose ODM |
| **Templating** | EJS (Embedded JavaScript) |
| **Styling** | Tailwind CSS (CDN) + Custom CSS |
| **Authentication** | JWT (jsonwebtoken) + bcrypt |
| **Email** | Nodemailer + Gmail SMTP |
| **SMS** | Twilio SMS API |
| **Payments** | Razorpay |
| **File Upload** | Multer (memory storage → MongoDB Buffer) |
| **AI Stylist** | Natural.js NLP + Keyword Intent Matching |

---

## 📁 Project Structure

```
BANGER-SIDE/
├── app.js                    # Express app entry point
├── config/
│   ├── mongoose-connection.js
│   └── multer-config.js
├── controllers/
│   └── authController.js     # Register, Login, OTP verify
├── middlewares/
│   ├── isLoggedIn.js
│   └── isOwnerLoggedIn.js
├── models/
│   ├── user-model.js
│   ├── product-model.js
│   ├── order-model.js
│   ├── owner-model.js
│   └── coupon-model.js
├── routes/
│   ├── index.js              # Shop, Cart, Wishlist, Checkout, Orders
│   ├── usersRouter.js        # Auth routes
│   ├── ownersRouter.js       # Admin panel routes
│   ├── productsRouter.js     # Product CRUD
│   ├── paymentsRouter.js     # Razorpay integration
100: │   └── aiRouter.js           # AI Mood Stylist
101: ├── utils/
102: │   ├── checkoutHelpers.js    # Cart summary, order creation
103: │   ├── emailSender.js        # Nodemailer email utility
104: │   ├── smsSender.js          # Twilio SMS utility
105: │   ├── razorpay.js           # Razorpay order & verification
106: │   ├── orderPresentation.js
107: │   └── generateToken.js
108: └── views/                    # EJS templates
109:     ├── partials/
110:     │   ├── header.ejs
111:     │   └── footer.ejs
112:     ├── shop.ejs
113:     ├── checkout.ejs
114:     ├── cart.ejs
115:     ├── orders.ejs
116:     └── ...
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Gmail account with App Password (for email OTP)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/tiwari-sumit001/BangerSide-Ecommerce.git
cd BangerSide-Ecommerce

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# 4. Start the development server
npm start
```

---

## 🔑 Key Implementation Highlights

- **Bullet-proof Wishlist Logic** — Fixed critical loop issues by implementing auto-size selection and referer-based redirects.
- **Images stored as Buffer in MongoDB** — no file system dependency, deploy anywhere.
- **Server-side coupon validation** — prevents client-side bypass.
- **Guest-to-User Flow** — Seamless transition from browsing to authenticated checkout.
- **Stock management** — Automatic stock decrement on order, restoration on cancellation.

---

## 📄 License

MIT License — feel free to use this project for learning and portfolio purposes.

---

<div align="center">
  Built with ❤️ by <a href="https://github.com/tiwari-sumit001">Sumit Tiwari</a>
</div>
