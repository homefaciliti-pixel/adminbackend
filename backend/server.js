const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const {
  User, Partner, Category, Service, Order,
  BookingEarning, SubscriptionEarning, Banner,
  City, State, Locality, Notification, Review
} = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON body parser
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Welcome / API Status endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Admin Panel Backend API!',
    status: 'Running',
    database: 'MongoDB Connected',
    documentation: 'See api_list.txt for the endpoint reference.'
  });
});

// Multer storage configuration for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Helper to return server errors
const handleServerError = (res, err) => {
  console.error(err);
  return res.status(500).json({ error: err.message || 'Internal Server Error' });
};

// -------------------------------------------------------------
// IMAGE UPLOAD ENDPOINT
// -------------------------------------------------------------
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// -------------------------------------------------------------
// USERS API
// -------------------------------------------------------------
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().sort({ id: -1 });
    res.json(users);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ id: req.params.id });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    handleServerError(res, err);
  }
});

// -------------------------------------------------------------
// PARTNERS API
// -------------------------------------------------------------
app.get('/api/partners', async (req, res) => {
  try {
    const partners = await Partner.find().sort({ id: -1 });
    res.json(partners);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.post('/api/partners', async (req, res) => {
  try {
    const p = req.body;
    if (!p.createdAt) {
      p.createdAt = new Date().toISOString().split('T')[0];
    }
    const partner = new Partner(p);
    await partner.save();
    res.status(201).json(partner);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.put('/api/partners/:id', async (req, res) => {
  try {
    const partner = await Partner.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!partner) return res.status(404).json({ error: 'Partner not found' });
    res.json(partner);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.delete('/api/partners/:id', async (req, res) => {
  try {
    const partner = await Partner.findOneAndDelete({ id: req.params.id });
    if (!partner) return res.status(404).json({ error: 'Partner not found' });
    res.json({ message: 'Partner deleted successfully' });
  } catch (err) {
    handleServerError(res, err);
  }
});

// -------------------------------------------------------------
// CATEGORIES API
// -------------------------------------------------------------
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ id: -1 });
    res.json(categories);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const category = await Category.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({ id: req.params.id });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    handleServerError(res, err);
  }
});

// -------------------------------------------------------------
// SERVICES API
// -------------------------------------------------------------
app.get('/api/services', async (req, res) => {
  try {
    const services = await Service.find().sort({ id: -1 });
    res.json(services);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.post('/api/services', async (req, res) => {
  try {
    const service = new Service(req.body);
    await service.save();
    res.status(201).json(service);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.put('/api/services/:id', async (req, res) => {
  try {
    const service = await Service.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json(service);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.delete('/api/services/:id', async (req, res) => {
  try {
    const service = await Service.findOneAndDelete({ id: req.params.id });
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json({ message: 'Service deleted' });
  } catch (err) {
    handleServerError(res, err);
  }
});

// -------------------------------------------------------------
// ORDERS API
// -------------------------------------------------------------
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ id: -1 });
    res.json(orders);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const o = req.body;
    if (!o.createdAt) {
      o.createdAt = new Date().toISOString().split('T')[0];
    }
    const order = new Order(o);
    await order.save();
    res.status(201).json(order);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.put('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({ id: req.params.id });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Order deleted' });
  } catch (err) {
    handleServerError(res, err);
  }
});

// -------------------------------------------------------------
// EARNINGS API
// -------------------------------------------------------------
app.get('/api/earnings/booking', async (req, res) => {
  try {
    const earnings = await BookingEarning.find().sort({ id: -1 });
    res.json(earnings);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.post('/api/earnings/booking', async (req, res) => {
  try {
    const earning = new BookingEarning(req.body);
    await earning.save();
    res.status(201).json(earning);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.get('/api/earnings/subscription', async (req, res) => {
  try {
    const earnings = await SubscriptionEarning.find().sort({ id: -1 });
    res.json(earnings);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.post('/api/earnings/subscription', async (req, res) => {
  try {
    const earning = new SubscriptionEarning(req.body);
    await earning.save();
    res.status(201).json(earning);
  } catch (err) {
    handleServerError(res, err);
  }
});

// -------------------------------------------------------------
// PAGES API
// -------------------------------------------------------------
app.get('/api/pages', async (req, res) => {
  try {
    const pages = await Page.find().sort({ id: -1 });
    res.json(pages);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.post('/api/pages', async (req, res) => {
  try {
    const page = new Page(req.body);
    await page.save();
    res.status(201).json(page);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.put('/api/pages/:id', async (req, res) => {
  try {
    const page = await Page.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!page) return res.status(404).json({ error: 'Page not found' });
    res.json(page);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.delete('/api/pages/:id', async (req, res) => {
  try {
    const page = await Page.findOneAndDelete({ id: req.params.id });
    if (!page) return res.status(404).json({ error: 'Page not found' });
    res.json({ message: 'Page deleted' });
  } catch (err) {
    handleServerError(res, err);
  }
});

// -------------------------------------------------------------
// BANNERS API
// -------------------------------------------------------------
app.get('/api/banners', async (req, res) => {
  try {
    const banners = await Banner.find().sort({ id: -1 });
    res.json(banners);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.post('/api/banners', async (req, res) => {
  try {
    const banner = new Banner(req.body);
    await banner.save();
    res.status(201).json(banner);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.put('/api/banners/:id', async (req, res) => {
  try {
    const banner = await Banner.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!banner) return res.status(404).json({ error: 'Banner not found' });
    res.json(banner);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.delete('/api/banners/:id', async (req, res) => {
  try {
    const banner = await Banner.findOneAndDelete({ id: req.params.id });
    if (!banner) return res.status(404).json({ error: 'Banner not found' });
    res.json({ message: 'Banner deleted' });
  } catch (err) {
    handleServerError(res, err);
  }
});

// -------------------------------------------------------------
// CITIES API
// -------------------------------------------------------------
app.get('/api/cities', async (req, res) => {
  try {
    const cities = await City.find().sort({ id: -1 });
    res.json(cities);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.post('/api/cities', async (req, res) => {
  try {
    const city = new City(req.body);
    await city.save();
    res.status(201).json(city);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.put('/api/cities/:id', async (req, res) => {
  try {
    const city = await City.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!city) return res.status(404).json({ error: 'City not found' });
    res.json(city);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.delete('/api/cities/:id', async (req, res) => {
  try {
    const city = await City.findOneAndDelete({ id: req.params.id });
    if (!city) return res.status(404).json({ error: 'City not found' });
    res.json({ message: 'City deleted' });
  } catch (err) {
    handleServerError(res, err);
  }
});

// -------------------------------------------------------------
// STATES API
// -------------------------------------------------------------
app.get('/api/states', async (req, res) => {
  try {
    const states = await State.find().sort({ id: -1 });
    res.json(states);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.post('/api/states', async (req, res) => {
  try {
    const state = new State(req.body);
    await state.save();
    res.status(201).json(state);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.put('/api/states/:id', async (req, res) => {
  try {
    const state = await State.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!state) return res.status(404).json({ error: 'State not found' });
    res.json(state);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.delete('/api/states/:id', async (req, res) => {
  try {
    const state = await State.findOneAndDelete({ id: req.params.id });
    if (!state) return res.status(404).json({ error: 'State not found' });
    res.json({ message: 'State deleted' });
  } catch (err) {
    handleServerError(res, err);
  }
});

// -------------------------------------------------------------
// LOCALITIES API
// -------------------------------------------------------------
app.get('/api/localities', async (req, res) => {
  try {
    const localities = await Locality.find().sort({ id: -1 });
    res.json(localities);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.post('/api/localities', async (req, res) => {
  try {
    const locality = new Locality(req.body);
    await locality.save();
    res.status(201).json(locality);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.put('/api/localities/:id', async (req, res) => {
  try {
    const locality = await Locality.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!locality) return res.status(404).json({ error: 'Locality not found' });
    res.json(locality);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.delete('/api/localities/:id', async (req, res) => {
  try {
    const locality = await Locality.findOneAndDelete({ id: req.params.id });
    if (!locality) return res.status(404).json({ error: 'Locality not found' });
    res.json({ message: 'Locality deleted' });
  } catch (err) {
    handleServerError(res, err);
  }
});

// -------------------------------------------------------------
// NOTIFICATIONS API
// -------------------------------------------------------------
app.get('/api/notifications', async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ id: -1 });
    res.json(notifications);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.post('/api/notifications', async (req, res) => {
  try {
    const n = req.body;
    if (!n.createdAt) {
      n.createdAt = new Date().toISOString().split('T')[0];
    }
    const notification = new Notification(n);
    await notification.save();
    res.status(201).json(notification);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.put('/api/notifications/:id', async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    res.json(notification);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.delete('/api/notifications/:id', async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({ id: req.params.id });
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    handleServerError(res, err);
  }
});

// -------------------------------------------------------------
// REVIEWS API
// -------------------------------------------------------------
app.get('/api/reviews', async (req, res) => {
  try {
    const reviews = await Review.find().sort({ id: -1 });
    res.json(reviews);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const review = new Review(req.body);
    await review.save();
    res.status(201).json(review);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.put('/api/reviews/:id', async (req, res) => {
  try {
    const review = await Review.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!review) return res.status(404).json({ error: 'Review not found' });
    res.json(review);
  } catch (err) {
    handleServerError(res, err);
  }
});

app.delete('/api/reviews/:id', async (req, res) => {
  try {
    const review = await Review.findOneAndDelete({ id: req.params.id });
    if (!review) return res.status(404).json({ error: 'Review not found' });
    res.json({ message: 'Review deleted' });
  } catch (err) {
    handleServerError(res, err);
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
