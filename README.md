# 💸 SplitEasy

> Smart Expense Splitting & Settlement Platform for Students, Friends, Roommates, and Trips.

SplitEasy is a modern expense-sharing web application that helps users manage shared expenses without the complexity of traditional expense trackers. It allows groups to record expenses, calculate balances automatically, and simplify debts while providing secure authentication and an intuitive user experience.

---

## ✨ Features

### 👥 Group Management
- Create and manage multiple groups
- Invite members
- Group expense history
- Member balance tracking

### 💰 Expense Management
- Add shared expenses
- Split equally or customize shares
- Category-based expenses
- Upload receipt images
- Expense editing and deletion

### 📊 Balance Calculation
- Real-time balance updates
- Automatic debt calculation
- Smart debt simplification
- Settlement tracking

### 🔐 Authentication
- Firebase Email & Password Authentication
- Google Sign-In
- Secure user sessions

### ☁️ Cloud Storage
- Cloudinary for receipt image uploads
- Firestore for user and application data
- MongoDB for backend database

### 📱 User Experience
- Responsive design
- Modern UI
- Dashboard analytics
- Transaction history
- Profile management

---

# 🛠 Tech Stack

## Frontend

- HTML5
- CSS3
- JavaScript (Vanilla)

## Backend

- Node.js
- Express.js

## Database

- MongoDB
- Firebase Firestore

## Authentication

- Firebase Authentication

## Image Storage

- Cloudinary

## Other Tools

- Multer
- dotenv
- Helmet
- CORS
- Nodemon

---

# 📁 Project Structure

```
SplitEasy/
│
├── client/
│   ├── assets/
│   ├── css/
│   ├── js/
│   ├── pages/
│   └── index.html
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   │
│   ├── uploads/
│   ├── .env
│   ├── package.json
│   └── server.js
│
├── README.md
├── LICENSE
└── .gitignore
```

---

# 🚀 Getting Started

## Clone the Repository

```bash
git clone https://github.com/yourusername/spliteasy.git
```

```bash
cd spliteasy
```

---

## Install Dependencies

### Backend

```bash
cd server
npm install
```

### Frontend

Open the client folder using VS Code Live Server or any static server.

---

# 🔑 Environment Variables

Create a `.env` file inside the `server` directory.

```env
PORT=5000

MONGODB_URI=

JWT_SECRET=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

CLIENT_URL=http://localhost:5500
```

> Never commit your `.env` file.

---

# ▶️ Run the Project

Backend

```bash
npm run dev
```

or

```bash
npm start
```

Frontend

Run using Live Server or any local static server.

---

# 📷 Screenshots

> Add screenshots here after completing the UI.

```
assets/screenshots/
```

---

# 📌 Future Improvements

- UPI payment integration
- Email notifications
- Push notifications
- Expense reminders
- Export reports as PDF
- Dark mode
- AI-powered expense insights
- Recurring expenses
- Multi-currency support

---

# 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a new branch

```bash
git checkout -b feature/new-feature
```

3. Commit your changes

```bash
git commit -m "Add new feature"
```

4. Push

```bash
git push origin feature/new-feature
```

5. Open a Pull Request

---

# 📄 License

This project is licensed under the MIT License.

See the LICENSE file for more details.

---

# 👨‍💻 Author

**Arka Saha Roy**

Final Year B.Tech Student

Made with ❤️ for students and groups who want a simpler way to split expenses.