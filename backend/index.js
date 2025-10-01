require('dotenv').config();
const express = require('express');
const morgan = require("morgan");
const cors = require("cors");
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3002;

app.use(morgan("combined"));
app.use(cors({
  origin: 'http://localhost:4200',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017",
    dbName: process.env.DB_NAME || 'EYECONIC',
    collectionName: 'sessions',
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use((req, res, next) => {
  next();
});

const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const client = new MongoClient(mongoUri);
let productCollection, userCollection, orderCollection, feedbackCollection, cartCollection;

(async () => {
  try {
    await client.connect();
    const database = client.db(process.env.DB_NAME || "EYECONIC");
    productCollection = database.collection("Product");
    userCollection = database.collection("User");
    orderCollection = database.collection("Order");
    feedbackCollection = database.collection("Feedback");
    cartCollection = database.collection("Cart");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  }
})();

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.userId || req.session.role !== 'admin') {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}

function requireRoleAction(requiredRole, requiredActions) {
  return (req, res, next) => {
    if (!req.session.userId || req.session.role !== requiredRole) {
      return res.status(403).json({ message: "Forbidden: Invalid Role" });
    }

    const userAction = req.session.action || "just view";
    if (requiredActions.includes("edit all") || requiredActions.includes(userAction)) {
      return next();
    }

    if (userAction === "just view" && requiredActions.includes("view")) {
      return next();
    }

    return res.status(403).json({ message: "Forbidden: Insufficient Permissions" });
  };
}

app.get(
  "/products",
  async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const productDept = req.query.dept || "";
    const filter = productDept ? { product_dept: productDept } : {};
    try {
      const products = await productCollection
        .find(filter)
        .skip(skip)
        .limit(limit)
        .toArray();
      const total = await productCollection.countDocuments(filter);
      res.status(200).json({
        products,
        total,
        page,
        pages: Math.ceil(total / limit),
      });
    } catch {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

app.get("/products/:id", async (req, res) => {
  try {
    const productId = new ObjectId(req.params.id);
    const product = await productCollection.findOne({ _id: productId });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
  } catch {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post(
  "/products",
  requireRoleAction("admin", ["edit all", "sales ctrl"]),
  async (req, res) => {
    const { product_name, product_detail, stocked_quantity, unit_price, discount, product_dept, rating, image_1, image_2, image_3, image_4, image_5 } = req.body;

    if (!product_name || !unit_price) {
      return res.status(400).json({ message: "Please provide all required fields." });
    }
    if (typeof unit_price !== "number" || unit_price < 0) {
      return res.status(400).json({ message: "unit_price must be a non-negative number." });
    }
    if (typeof stocked_quantity !== "number" || stocked_quantity < 0) {
      return res.status(400).json({ message: "stocked_quantity must be a non-negative number." });
    }
    if (discount !== undefined && (discount < 0 || discount > 1)) {
      return res.status(400).json({ message: "discount must be between 0 and 1." });
    }

    const images = [image_1, image_2, image_3, image_4, image_5].filter(img => img);
    for (const img of images) {
      if (typeof img !== "string" || !img.startsWith("data:image/")) {
        return res.status(400).json({ message: "Invalid image format. Must be Base64." });
      }
    }

    const newProduct = {
      product_name,
      product_detail: product_detail || "",
      stocked_quantity: stocked_quantity || 0,
      unit_price,
      discount: discount || 0,
      product_dept: product_dept || "",
      rating: rating || 4,
      createdAt: new Date(),
      image_1: image_1 || "",
      image_2: image_2 || "",
      image_3: image_3 || "",
      image_4: image_4 || "",
      image_5: image_5 || "",
    };

    try {
      const result = await productCollection.insertOne(newProduct);
      res.status(201).json({ message: "Product added successfully", productId: result.insertedId });
    } catch (error) {
      res.status(500).json({ message: "Failed to add product" });
    }
  }
);

app.patch(
  "/products/:id",
  requireRoleAction("admin", ["edit all", "sales ctrl"]),
  async (req, res) => {
    const productId = new ObjectId(req.params.id);
    const { image_1, image_2, image_3, image_4, image_5, ...updateData } = req.body;

    const images = [image_1, image_2, image_3, image_4, image_5];
    for (const img of images) {
      if (img && (typeof img !== "string" || !img.startsWith("data:image/"))) {
        return res.status(400).json({ message: "Invalid image format. Must be Base64." });
      }
    }

    const updatedImages = {
      image_1: image_1 || '',
      image_2: image_2 || '',
      image_3: image_3 || '',
      image_4: image_4 || '',
      image_5: image_5 || '',
    };

    try {
      const updatePayload = { ...updateData, ...updatedImages };

      const result = await productCollection.updateOne(
        { _id: productId },
        { $set: updatePayload }
      );

      if (result.modifiedCount === 0) {
        return res.status(404).json({ message: "Product not found or no changes made" });
      }

      res.status(200).json({ message: "Product updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update product" });
    }
  }
);

app.delete(
  "/products/:id",
  requireRoleAction("admin", ["edit all", "sales ctrl"]),
  async (req, res) => {
    const productId = new ObjectId(req.params.id);
    try {
      const result = await productCollection.deleteOne({ _id: productId });
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.status(200).json({ message: "Product deleted successfully" });
    } catch {
      res.status(500).json({ message: "Failed to delete product" });
    }
  }
);

app.delete("/products", requireAdmin, async (req, res) => {
  const { productIds } = req.body;
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ message: "No product IDs provided" });
  }
  const objectIds = productIds.map(id => new ObjectId(id));
  try {
    const result = await productCollection.deleteMany({ _id: { $in: objectIds } });
    res.status(200).json({ message: "Products deleted successfully", deletedCount: result.deletedCount });
  } catch {
    res.status(500).json({ message: "Failed to delete products" });
  }
});

app.patch("/products/:id/update-stock", async (req, res) => {
  try {
    const productId = new ObjectId(req.params.id);
    const { quantity } = req.body;
    const result = await productCollection.updateOne(
      { _id: productId },
      { $inc: { stocked_quantity: -quantity } }
    );
    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Product not found or stock not updated" });
    }
    res.status(200).json({ message: "Stock updated successfully" });
  } catch {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/user/signup", async (req, res) => {
  const { profileName, email, password, gender, birthMonth, birthDay, birthYear, marketing, role = 'user' } = req.body;
  if (!profileName || !email || !password) {
    return res.status(400).json({ message: "Please provide all required fields." });
  }
  try {
    const existingUser = await userCollection.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      profileName,
      email,
      password: hashedPassword,
      gender,
      birthDate: { month: birthMonth, day: birthDay, year: birthYear },
      marketing: !!marketing,
      role
    };
    const result = await userCollection.insertOne(newUser);
    res.status(201).json({ message: "User registered successfully", userId: result.insertedId });
  } catch {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/user/login", async (req, res) => {
  const { email, password, rememberMe } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Please provide both email and password." });
  }
  try {
    const user = await userCollection.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    req.session.userId = user._id;
    req.session.isLoggedIn = true;
    req.session.role = user.role;
    req.session.action = user.action || "just view";
    if (rememberMe) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
    } else {
      req.session.cookie.expires = false;
    }
    res.status(200).json({
      userId: user._id,
      role: user.role,
      action: user.action || "just view",
      message: "Login successful"
    });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/user/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: "Could not log out. Try again later." });
    }
    res.clearCookie('connect.sid');
    res.status(200).json({ message: "Logout successful" });
  });
});

app.get("/user/profile", requireAuth, async (req, res) => {
  const user = await userCollection.findOne({ _id: new ObjectId(req.session.userId) });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.status(200).json({
    _id: user._id,
    email: user.email,
    profileName: user.profileName,
    gender: user.gender,
    birthDate: user.birthDate,
    phone: user.phone,
    address: user.address,
    marketing: user.marketing,
    role: user.role
  });
});

app.patch(
  "/user/update/:userId",
  requireRoleAction("admin", ["edit all", "account ctrl"]),
  async (req, res) => {
    const { userId } = req.params;
    const updateData = { ...req.body };

    delete updateData.email;
    delete updateData.password;
    delete updateData._id;

    try {
      const result = await userCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: updateData }
      );
      if (result.modifiedCount === 0) {
        return res.status(404).json({ message: "User not found or no changes made" });
      }
      res.status(200).json({ message: "User updated successfully" });
    } catch (err) {
      res.status(500).json({ message: "Failed to update user" });
    }
  }
);

app.delete(
  "/user/delete/:userId",
  requireRoleAction("admin", ["edit all", "account ctrl"]),
  async (req, res) => {
    const { userId } = req.params;

    try {
      const result = await userCollection.deleteOne({ _id: new ObjectId(userId) });
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  }
);

app.get("/user/user-management", requireRoleAction("admin", ["edit all", "account ctrl", "view"]), async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;

  const filter = search
    ? { profileName: { $regex: search, $options: "i" } }
    : {};

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await userCollection
      .find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const total = await userCollection.countDocuments(filter);

    res.status(200).json({ users, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/cart", requireAuth, async (req, res) => {
  try {
    const cartItems = await cartCollection.aggregate([
      { $match: { userId: req.session.userId } },
      {
        $lookup: {
          from: "Product",
          localField: "productId",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          productId: 1,
          quantity: 1,
          unit_price: 1,
          userId: 1,
          product_name: "$productDetails.product_name",
          image_1: "$productDetails.image_1",
          stocked_quantity: "$productDetails.stocked_quantity"
        }
      }
    ]).toArray();
    res.status(200).json(cartItems);
  } catch {
    res.status(500).json({ message: "Failed to retrieve cart items" });
  }
});

app.post("/cart/add", requireAuth, async (req, res) => {
  const { productId, quantity, unit_price } = req.body;
  try {
    const itemToAdd = {
      userId: req.session.userId,
      productId: new ObjectId(productId),
      quantity,
      unit_price,
    };
    const existingItem = await cartCollection.findOne({ userId: req.session.userId, productId: itemToAdd.productId });
    if (existingItem) {
      await cartCollection.updateOne(
        { userId: req.session.userId, productId: itemToAdd.productId },
        { $inc: { quantity } }
      );
    } else {
      await cartCollection.insertOne(itemToAdd);
    }
    res.status(200).json({ message: "Item added to cart" });
  } catch {
    res.status(500).json({ message: "Failed to add item to cart" });
  }
});

app.delete("/cart/remove/:productId", requireAuth, async (req, res) => {
  const { productId } = req.params;
  try {
    await cartCollection.deleteOne({ userId: req.session.userId, productId: new ObjectId(productId) });
    res.status(200).json({ message: "Item removed from cart" });
  } catch {
    res.status(500).json({ message: "Failed to remove item from cart" });
  }
});

app.post('/cart/removeOrderedItems', requireAuth, async (req, res) => {
  const { orderedItemIds } = req.body;

  if (!Array.isArray(orderedItemIds) || orderedItemIds.length === 0) {
    return res.status(400).json({ message: 'Invalid or missing orderedItemIds.' });
  }

  try {
    const objectIds = orderedItemIds.map(id => new ObjectId(id));
    await cartCollection.deleteMany({
      userId: req.session.userId,
      productId: { $in: objectIds }
    });

    res.status(200).json({ message: 'Ordered items removed from cart.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove ordered items.' });
  }
});

app.patch("/cart/update", requireAuth, async (req, res) => {
  const { productId, quantity } = req.body;
  try {
    await cartCollection.updateOne(
      { userId: req.session.userId, productId: new ObjectId(productId) },
      { $set: { quantity } }
    );
    res.status(200).json({ message: "Cart item quantity updated" });
  } catch {
    res.status(500).json({ message: "Failed to update cart item quantity" });
  }
});

app.post("/cart/saveSelectedItems", requireAuth, async (req, res) => {
  const { selectedItems } = req.body;
  if (!selectedItems || !Array.isArray(selectedItems)) {
    return res.status(400).json({ message: "Invalid selected items data" });
  }

  try {
    await cartCollection.updateMany(
      { userId: req.session.userId },
      { $set: { selectedItems } },
      { upsert: true }
    );
    res.status(200).json({ message: "Selected items saved successfully" });
  } catch {
    res.status(500).json({ message: "Failed to save selected items" });
  }
});

app.delete("/cart/clear", requireAuth, async (req, res) => {
  try {
    await cartCollection.deleteMany({ userId: req.session.userId });
    res.status(200).json({ message: "Cart cleared" });
  } catch {
    res.status(500).json({ message: "Failed to clear cart" });
  }
});

app.get(
  "/orders",
  requireRoleAction("admin", ["edit all", "sales ctrl", "view"]),
  async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status || "";

    const filter = {};
    if (search) {
      try {
        filter.$or = [
          { userName: { $regex: search, $options: "i" } },
          { _id: new ObjectId(search) },
        ];
      } catch (err) {
        console.error("Invalid ObjectId for search:", search);
      }
    }
    if (status) {
      filter.status = status;
    }

    try {
      const orders = await orderCollection
        .aggregate([
          { $match: filter },
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: "User",
              localField: "userId",
              foreignField: "_id",
              as: "userDetails",
            },
          },
          {
            $addFields: {
              userName: {
                $ifNull: [
                  { $arrayElemAt: ["$userDetails.profileName", 0] },
                  { $concat: ["$shippingAddress.firstName", " ", "$shippingAddress.lastName"] },
                ],
              },
            },
          },
          {
            $project: {
              userDetails: 0,
            },
          },
        ])
        .toArray();

      const total = await orderCollection.countDocuments(filter);
      res.status(200).json({
        orders,
        total: await orderCollection.countDocuments(filter),
        page,
        pages: Math.ceil(await orderCollection.countDocuments(filter) / limit),
      });
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

app.post("/orders", requireAuth, async (req, res) => {
  const userId = req.session?.userId || null;
  const { selectedItems, totalPrice, paymentMethod, shippingAddress } = req.body;

  if (!Array.isArray(selectedItems) || selectedItems.length === 0) {
    return res.status(400).json({ message: "selectedItems must be a non-empty array." });
  }
  for (const item of selectedItems) {
    if (
      !item._id ||
      typeof item.quantity !== "number" ||
      item.quantity <= 0 ||
      typeof item.unit_price !== "number" ||
      item.unit_price < 0
    ) {
      return res.status(400).json({ message: "Invalid selectedItems format." });
    }
  }
  if (!totalPrice || typeof totalPrice !== "number" || totalPrice <= 0) {
    return res.status(400).json({ message: "Invalid totalPrice." });
  }
  if (!paymentMethod || typeof paymentMethod !== "string") {
    return res.status(400).json({ message: "Invalid paymentMethod." });
  }
  if (
    !shippingAddress ||
    !shippingAddress.firstName ||
    !shippingAddress.lastName ||
    !shippingAddress.address ||
    typeof shippingAddress.firstName !== "string" ||
    typeof shippingAddress.lastName !== "string" ||
    typeof shippingAddress.address !== "string"
  ) {
    return res.status(400).json({ message: "Invalid shippingAddress." });
  }

  try {
    const orderData = {
      userId,
      selectedItems,
      totalPrice,
      paymentMethod,
      shippingAddress,
      createdAt: new Date(),
      status: "in_progress",
    };

    const result = await orderCollection.insertOne(orderData);

    for (const item of selectedItems) {
      const productId = new ObjectId(item._id);

      const product = await productCollection.findOne({ _id: productId });
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item._id}` });
      }

      if (product.stocked_quantity < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for product ID: ${item._id}`,
        });
      }

      await productCollection.updateOne(
        { _id: productId },
        { $inc: { stocked_quantity: -item.quantity } }
      );
    }

    res
      .status(201)
      .json({ message: "Order placed successfully", orderId: result.insertedId });
  } catch (err) {
    res.status(500).json({ message: "Failed to place order" });
  }
});

app.patch(
  "/orders/:id/status",
  requireRoleAction("admin", ["edit all", "sales ctrl"]),
  async (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Missing status field" });
    }

    try {
      const result = await orderCollection.updateOne(
        { _id: new ObjectId(orderId) },
        { $set: { status } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.status(200).json({ message: "Order status updated successfully" });
    } catch {
      res.status(500).json({ message: "Failed to update order status" });
    }
  }
);

app.delete(
  "/orders/:orderId",
  requireRoleAction("admin", ["edit all", "sales ctrl"]),
  async (req, res) => {
    const { orderId } = req.params;

    if (!ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    try {
      const result = await orderCollection.deleteOne({ _id: new ObjectId(orderId) });

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.status(200).json({ message: "Order canceled successfully" });
    } catch (err) {
      res.status(500).json({ message: "Failed to cancel the order" });
    }
  }
);

app.get('/orders/:orderId/invoice', requireAuth, async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await orderCollection.findOne({ _id: new ObjectId(orderId) });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const productIds = order.selectedItems.map(item => new ObjectId(item._id));
    const products = await productCollection.find({ _id: { $in: productIds } }).toArray();

    const itemsWithNames = order.selectedItems.map(item => {
      const product = products.find(p => p._id.toString() === item._id);
      return {
        ...item,
        name: product?.product_name || 'Unknown',
      };
    });

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const fileName = `invoice-${orderId}.pdf`;
    const filePath = `./invoices/${fileName}`;

    if (!fs.existsSync('./invoices')) {
      fs.mkdirSync('./invoices');
    }

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const fontPath = './fonts/Roboto-Regular.ttf';
    if (fs.existsSync(fontPath)) {
      doc.font(fontPath);
    }

    const logoPath = './logo.png';
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 30, { width: 100 });
    }

    doc.fontSize(20).text('Hóa đơn bán hàng', 150, 50, { align: 'center' });
    doc.moveDown();

    doc.fontSize(12)
      .text(`Mã đơn hàng: ${orderId}`)
      .text(`Ngày tạo: ${new Date(order.createdAt).toLocaleDateString()}`)
      .text(`Khách hàng: ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`)
      .text(`Email: ${order.shippingAddress.email}`)
      .text(`Số điện thoại: ${order.shippingAddress.phone}`)
      .text(`Địa chỉ: ${order.shippingAddress.address}`);
    doc.moveDown();

    doc.fontSize(14).text('Chi tiết đơn hàng:');
    doc.moveDown();

    const columnWidths = [50, 200, 70, 100, 100];
    const tableStartX = 50;
    const tableStartY = doc.y;

    const drawTableBorders = (yStart, rowCount) => {
      const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
      doc.lineWidth(0.5);

      for (let i = 0; i <= rowCount; i++) {
        const y = yStart + i * 20;
        doc.moveTo(tableStartX, y).lineTo(tableStartX + tableWidth, y).stroke();
      }

      let currentX = tableStartX;
      columnWidths.forEach(width => {
        doc.moveTo(currentX, yStart).lineTo(currentX, yStart + rowCount * 20).stroke();
        currentX += width;
      });
      doc.moveTo(currentX, yStart).lineTo(currentX, yStart + rowCount * 20).stroke();
    };

    const header = ['STT', 'Tên sản phẩm', 'Số lượng', 'Đơn giá', 'Thành tiền'];
    const headerY = doc.y;

    header.forEach((text, i) => {
      doc.text(text, tableStartX + columnWidths.slice(0, i).reduce((sum, w) => sum + w, 0), headerY, {
        width: columnWidths[i],
        align: i === 0 ? 'left' : 'center',
      });
    });

    doc.moveDown(0.5);

    const rowStartY = doc.y;

    itemsWithNames.forEach((item, index) => {
      const rowY = rowStartY + index * 20;
      const row = [
        index + 1,
        item.name,
        item.quantity,
        `${item.unit_price.toLocaleString()} VND`,
        `${(item.quantity * item.unit_price).toLocaleString()} VND`,
      ];

      row.forEach((text, i) => {
        doc.text(text, tableStartX + columnWidths.slice(0, i).reduce((sum, w) => sum + w, 0), rowY, {
          width: columnWidths[i],
          align: i === 0 ? 'left' : 'center',
        });
      });
    });

    const totalRows = itemsWithNames.length + 1;
    drawTableBorders(tableStartY, totalRows);

    doc.moveDown(2);
    doc.fontSize(12)
      .text(`Tổng giá trị: ${order.totalPrice.toLocaleString()} VND`, 50, doc.y, { align: 'right' })
      .moveDown(0.5)
      .text(`Phương thức thanh toán: ${order.paymentMethod}`, 50, doc.y, { align: 'right' });

    doc.moveDown(2);
    doc.fontSize(12)
      .text('Cảm ơn bạn đã mua hàng!', 50, doc.y, { align: 'center' })
      .moveDown(0.5)
      .text('Liên hệ với chúng tôi: 037 500 1528', 50, doc.y, { align: 'center' });

    doc.end();

    stream.on('finish', () => {
      res.download(filePath, fileName, (err) => {
        if (err) {
          res.status(500).json({ message: 'Failed to download PDF' });
        }
        fs.unlink(filePath, () => { });
      });
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post("/feedback", async (req, res) => {
  const { fullName, email, phone, message } = req.body;
  if (!fullName || !message) {
    return res.status(400).json({ message: "Full name and message are required." });
  }
  try {
    const feedbackData = {
      fullName,
      email: email || null,
      phone: phone || null,
      message,
      submittedAt: new Date(),
    };
    const result = await feedbackCollection.insertOne(feedbackData);
    res.status(201).json({ message: "Feedback submitted successfully", feedbackId: result.insertedId });
  } catch {
    res.status(500).json({ message: "Failed to submit feedback" });
  }
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
