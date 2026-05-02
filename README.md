# 🔥 BANGER SIDE — Premium E-Commerce Fashion Platform

<div align="center">

![BANGER SIDE](https://img.shields.io/badge/BANGER_SIDE-Premium_Fashion-2563eb?style=for-the-badge&logo=shopify&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-5.x-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

**A full-stack, production-grade e-commerce platform for premium streetwear and ethnic fashion.**

[Live Demo](#) · [Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started)

</div>

---

## 📸 Preview

> Shop page with AI Mood Search, Coupon System, Voice Search, and Secure Checkout.

---

## ✨ Features

### 🛍️ Customer Facing
- **AI Mood Search** — Type a vibe (e.g. "Rooftop Party") and get AI-curated product recommendations with match score & styling notes
- **🎤 Voice Search** — Web Speech API integrated; speak your vibe, get matched instantly
- **Product Filters** — Filter by gender, price range, category, and sort order
- **Cart Management** — Add, increase, decrease, remove items; size selection per item
- **Wishlist** — Add/remove products, full wishlist page
- **Coupon Codes** — Apply discount codes at checkout with server-side validation
- **Cash on Delivery Checkout** — Streamlined COD flow with address management
- **Online Payments** — Razorpay integration for UPI & Card payments
- **Order Tracking** — Full order history with status tracking (Placed → Packed → Shipped → Delivered)
- **Order Cancellation** — Cancel placed/packed orders with automatic stock restoration
- **Dark Mode** — System-wide dark mode toggle with localStorage persistence

### 🔐 Authentication & Security
- **Email OTP Verification** — Real email via Nodemailer + Gmail SMTP on registration
- **Phone OTP Login** — Real SMS via Twilio integration (with Indian `+91` auto-prefix)
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
| **Voice Search** | Web Speech API (browser-native) |

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
│   └── aiRouter.js           # AI Mood Stylist
├── utils/
│   ├── checkoutHelpers.js    # Cart summary, order creation
│   ├── emailSender.js        # Nodemailer email utility
│   ├── smsSender.js          # Twilio SMS utility
│   ├── razorpay.js           # Razorpay order & verification
│   ├── orderPresentation.js
│   └── generateToken.js
└── views/                    # EJS templates
    ├── partials/
    │   ├── header.ejs
    │   └── footer.ejs
    ├── shop.ejs
    ├── checkout.ejs
    ├── cart.ejs
    ├── orders.ejs
    └── ...
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Twilio account (for SMS OTP)
- Gmail account with App Password (for email OTP)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/tiwari-sumit001/BangerSide.git
cd BangerSide

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# 4. Start the development server
npm start
```

### Environment Variables

```env
# Core
JWT_KEY=your_strong_jwt_secret
EXPRESS_SESSION_SECRET=your_session_secret
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/scatch

# Payments (Razorpay)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Email OTP (Gmail App Password)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_char_app_password

# SMS OTP (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1your_twilio_number
```

### Create Owner Account

```bash
# In development mode, send a POST request to create the admin:
curl -X POST http://localhost:3000/owners/create \
  -H "Content-Type: application/json" \
  -d '{"fullname":"Admin","email":"admin@bangerside.com","password":"yourpassword"}'
```

---

## 🔑 Key Implementation Highlights

- **Images stored as Buffer in MongoDB** — no file system dependency, deploy anywhere
- **Server-side coupon validation** — prevents client-side bypass
- **Dual OTP channels** — Both email AND SMS sent simultaneously on registration
- **Stock management** — Automatic stock decrement on order, restoration on cancellation
- **Role-separated JWT** — Same cookie system, different roles for users vs admin
- **Graceful degradation** — App works in dev without Twilio/Gmail (mock mode)

---

## 📄 License

MIT License — feel free to use this project for learning and portfolio purposes.

---

<div align="center">
  Built with ❤️ by <a href="https://github.com/tiwari-sumit001">Sumit Tiwari</a>
</div>
