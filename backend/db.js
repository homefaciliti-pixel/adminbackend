const mongoose = require('mongoose');
require('dotenv').config();

const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    seedDatabase();
  })
  .catch(err => {
    console.error('Error connecting to MongoDB Atlas:', err);
  });

// -------------------------------------------------------------
// COUNTER SCHEMA FOR SEQUENTIAL IDS
// -------------------------------------------------------------
const CounterSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 }
});
const Counter = mongoose.model('Counter', CounterSchema);

async function getNextSequenceValue(sequenceName) {
  const sequenceDocument = await Counter.findOneAndUpdate(
    { id: sequenceName },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return sequenceDocument.seq;
}

// Helper function to attach auto-increment hook
function autoIncrementId(schema, modelName) {
  schema.pre('save', async function (next) {
    if (this.isNew) {
      this.id = await getNextSequenceValue(modelName + '_id');
    }
    next();
  });
}

// -------------------------------------------------------------
// SCHEMAS DEFINITION
// -------------------------------------------------------------
const UserSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  address: { type: String, required: true }
});
autoIncrementId(UserSchema, 'User');
const User = mongoose.model('User', UserSchema);

const PartnerSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  locality: { type: String, required: true },
  address: { type: String, required: true },
  image: { type: String, default: '' },
  status: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: false },
  gender: { type: String, default: '' },
  experience: { type: String, default: '' },
  services: { type: [String], default: [] },
  aadhaarNumber: { type: String, default: '' },
  panNumber: { type: String, default: '' },
  bankName: { type: String, default: '' },
  accountNumber: { type: String, default: '' },
  ifscCode: { type: String, default: '' },
  documents: { type: [String], default: [] },
  walletBalance: { type: Number, default: 0.0 },
  totalEarnings: { type: Number, default: 0.0 },
  withdrawnAmount: { type: Number, default: 0.0 },
  totalBookings: { type: Number, default: 0 },
  completedBookings: { type: Number, default: 0 },
  cancelledBookings: { type: Number, default: 0 },
  pendingBookings: { type: Number, default: 0 },
  rating: { type: Number, default: 0.0 },
  totalReviews: { type: Number, default: 0 },
  createdAt: { type: String, required: true }
});
autoIncrementId(PartnerSchema, 'Partner');
const Partner = mongoose.model('Partner', PartnerSchema);

const CategorySchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  title: { type: String, required: true },
  parent: { type: String, required: true },
  image: { type: String, default: '' },
  status: { type: Boolean, default: true }
});
autoIncrementId(CategorySchema, 'Category');
const Category = mongoose.model('Category', CategorySchema);

const ServiceSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, default: '' },
  description: { type: String, default: '' },
  status: { type: Boolean, default: true }
});
autoIncrementId(ServiceSchema, 'Service');
const Service = mongoose.model('Service', ServiceSchema);

const OrderSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  serviceRequestNumber: { type: String, required: true },
  serviceName: { type: String, required: true },
  serviceAmount: { type: Number, required: true },
  slotTime: { type: String, required: true },
  serviceDate: { type: String, required: true },
  city: { type: String, required: true },
  locality: { type: String, required: true },
  status: { type: String, required: true },
  vendorName: { type: String, default: '' },
  address: { type: String, required: true },
  createdAt: { type: String, required: true }
});
autoIncrementId(OrderSchema, 'Order');
const Order = mongoose.model('Order', OrderSchema);

const BookingEarningSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  transactionId: { type: String, required: true },
  serviceAmount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  extraServiceAmount: { type: Number, default: 0.0 },
  extraServicePaymentMethod: { type: String, default: '' },
  totalAmount: { type: Number, required: true },
  orderDate: { type: String, required: true }
});
autoIncrementId(BookingEarningSchema, 'BookingEarning');
const BookingEarning = mongoose.model('BookingEarning', BookingEarningSchema);

const SubscriptionEarningSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  partnerName: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  purchaseDate: { type: String, required: true },
  status: { type: String, required: true }
});
autoIncrementId(SubscriptionEarningSchema, 'SubscriptionEarning');
const SubscriptionEarning = mongoose.model('SubscriptionEarning', SubscriptionEarningSchema);

const BannerSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  title: { type: String, required: true },
  image: { type: String, default: '' },
  status: { type: Boolean, default: true }
});
autoIncrementId(BannerSchema, 'Banner');
const Banner = mongoose.model('Banner', BannerSchema);

const CitySchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  cityName: { type: String, required: true },
  stateName: { type: String, required: true },
  status: { type: Boolean, default: true }
});
autoIncrementId(CitySchema, 'City');
const City = mongoose.model('City', CitySchema);

const StateSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  name: { type: String, required: true },
  status: { type: Boolean, default: true }
});
autoIncrementId(StateSchema, 'State');
const State = mongoose.model('State', StateSchema);

const LocalitySchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  localityName: { type: String, required: true },
  cityName: { type: String, required: true },
  stateName: { type: String, required: true },
  status: { type: Boolean, default: true }
});
autoIncrementId(LocalitySchema, 'Locality');
const Locality = mongoose.model('Locality', LocalitySchema);

const NotificationSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  audience: { type: String, required: true },
  createdAt: { type: String, required: true },
  status: { type: Boolean, default: true },
  isSent: { type: Boolean, default: false },
  sentAt: { type: String, default: '' }
});
autoIncrementId(NotificationSchema, 'Notification');
const Notification = mongoose.model('Notification', NotificationSchema);

const ReviewSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  userName: { type: String, required: true },
  partnerName: { type: String, required: true },
  serviceName: { type: String, required: true },
  rating: { type: Number, required: true },
  reviewText: { type: String, default: '' },
  status: { type: Boolean, default: true }
});
autoIncrementId(ReviewSchema, 'Review');
const Review = mongoose.model('Review', ReviewSchema);

// -------------------------------------------------------------
// SEED DATABASE FUNCTION
// -------------------------------------------------------------
async function seedDatabase() {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('Database already initialized. Skipping seeding.');
      return;
    }

    console.log('MongoDB is empty. Seeding initial mock data...');

    // Seed Counters
    await Counter.create([
      { id: 'User_id', seq: 3 },
      { id: 'Partner_id', seq: 3 },
      { id: 'Category_id', seq: 3 },
      { id: 'Service_id', seq: 3 },
      { id: 'Order_id', seq: 2 },
      { id: 'BookingEarning_id', seq: 2 },
      { id: 'SubscriptionEarning_id', seq: 2 },
      { id: 'Banner_id', seq: 2 },
      { id: 'City_id', seq: 3 },
      { id: 'State_id', seq: 3 },
      { id: 'Locality_id', seq: 3 },
      { id: 'Notification_id', seq: 2 },
      { id: 'Review_id', seq: 2 }
    ]);

    // Seed Users
    await User.create([
      { id: 1, name: 'Rahul Sharma', email: 'rahul@gmail.com', mobile: '9876543210', address: 'Delhi, India' },
      { id: 2, name: 'Aman Verma', email: 'aman@gmail.com', mobile: '9988776655', address: 'Jaipur, Rajasthan' },
      { id: 3, name: 'Neha Singh', email: 'neha@gmail.com', mobile: '9123456780', address: 'Noida, Uttar Pradesh' }
    ]);

    // Seed Partners
    await Partner.create([
      {
        id: 1, name: 'Govind', email: 'govindanuragi53@gmail.com', mobile: '8009073091',
        city: 'Noida', state: 'Uttar Pradesh', locality: 'Sector 62', address: 'Near Metro Station',
        image: '', status: true, isApproved: true, gender: 'Male', experience: '3 Years',
        services: ['AC Repair', 'Fan Repair'], aadhaarNumber: 'XXXX-XXXX-1234', panNumber: 'ABCDE1234F',
        bankName: 'HDFC Bank', accountNumber: '1234567890', ifscCode: 'HDFC0001234', documents: [],
        walletBalance: 5200.0, totalEarnings: 25000.0, withdrawnAmount: 19800.0, totalBookings: 120,
        completedBookings: 98, cancelledBookings: 12, pendingBookings: 10, rating: 4.8, totalReviews: 46,
        createdAt: '06-05-2026 08:57 am'
      },
      {
        id: 2, name: 'Mahesh Kumar', email: 'maheshkumar918755@gmail.com', mobile: '8619328820',
        city: 'Jaipur', state: 'Rajasthan', locality: 'Vaishali Nagar', address: 'Main Road',
        image: '', status: true, isApproved: false, gender: 'Male', experience: '2 Years',
        services: ['Plumber'], aadhaarNumber: 'XXXX-XXXX-5678', panNumber: 'ABCDE5678G',
        bankName: 'SBI', accountNumber: '9876543210', ifscCode: 'SBIN0005678', documents: [],
        walletBalance: 0.0, totalEarnings: 0.0, withdrawnAmount: 0.0, totalBookings: 0,
        completedBookings: 0, cancelledBookings: 0, pendingBookings: 0, rating: 0.0, totalReviews: 0,
        createdAt: '20-03-2026 10:06 pm'
      },
      {
        id: 3, name: 'Sonali Sonawane', email: 'sonalideepak4554@gmail.com', mobile: '9819021075',
        city: 'Mumbai', state: 'Maharashtra', locality: 'Andheri', address: 'Near Market',
        image: '', status: false, isApproved: false, gender: 'Female', experience: '4 Years',
        services: ['Electrician', 'Home Repair'], aadhaarNumber: 'XXXX-XXXX-9012', panNumber: 'ABCDE9012H',
        bankName: 'ICICI Bank', accountNumber: '1122334455', ifscCode: 'ICIC0009012', documents: [],
        walletBalance: 0.0, totalEarnings: 0.0, withdrawnAmount: 0.0, totalBookings: 0,
        completedBookings: 0, cancelledBookings: 0, pendingBookings: 0, rating: 0.0, totalReviews: 0,
        createdAt: '19-03-2026 02:24 pm'
      }
    ]);

    // Seed Categories
    await Category.create([
      { id: 1, title: 'Professional Laundry & Grooming Services', parent: 'Contractors', image: '', status: true },
      { id: 2, title: 'AC Repair', parent: 'Home Services', image: '', status: true },
      { id: 3, title: 'Electrician', parent: 'Home Services', image: '', status: true }
    ]);

    // Seed Services
    await Service.create([
      { id: 1, title: 'Deep House Cleaning', price: 1999.0, image: '', description: 'Complete deep house cleaning service with premium agents.', status: true },
      { id: 2, title: 'AC Repair & Gas Refill', price: 599.0, image: '', description: 'Standard AC repair, cleaning, servicing, and gas checks.', status: true },
      { id: 3, title: 'Ceiling Fan Installation', price: 149.0, image: '', description: 'Fast and secure installation of ceiling or wall fans.', status: true }
    ]);

    // Seed Orders
    await Order.create([
      { id: 1, serviceRequestNumber: 'SR-2026-0001', serviceName: 'AC Repair & Gas Refill', serviceAmount: 599.0, slotTime: '10:00 AM - 12:00 PM', serviceDate: '2026-05-26', city: 'Jaipur', locality: 'Mansarovar', status: 'Pending', vendorName: 'Amit Kumar', address: 'A-45, Mansarovar, Jaipur', createdAt: '2026-05-25' },
      { id: 2, serviceRequestNumber: 'SR-2026-0002', serviceName: 'Deep House Cleaning', serviceAmount: 1999.0, slotTime: '02:00 PM - 05:00 PM', serviceDate: '2026-05-27', city: 'Noida', locality: 'Sector 62', status: 'Completed', vendorName: 'Sohan Lal', address: 'Flat 102, Block C, Noida', createdAt: '2026-05-24' }
    ]);

    // Seed Booking Earnings
    await BookingEarning.create([
      { id: 1, transactionId: 'TXN10002342', serviceAmount: 599.0, paymentMethod: 'UPI', extraServiceAmount: 0.0, extraServicePaymentMethod: '', totalAmount: 599.0, orderDate: '2026-05-25' },
      { id: 2, transactionId: 'TXN10002343', serviceAmount: 1999.0, paymentMethod: 'COD', extraServiceAmount: 100.0, extraServicePaymentMethod: 'Cash', totalAmount: 2099.0, orderDate: '2026-05-24' }
    ]);

    // Seed Subscription Earnings
    await SubscriptionEarning.create([
      { id: 1, partnerName: 'Amit Kumar', amount: 999.0, paymentMethod: 'Razorpay', purchaseDate: '2026-05-01', status: 'Active' },
      { id: 2, partnerName: 'Sohan Lal', amount: 999.0, paymentMethod: 'Razorpay', purchaseDate: '2026-05-15', status: 'Active' }
    ]);

    // Seed Banners
    await Banner.create([
      { id: 1, title: 'Summer AC Discount Offer', image: '', status: true },
      { id: 2, title: 'Home Cleaning Festival - Flat 20% Off', image: '', status: true }
    ]);

    // Seed Cities
    await City.create([
      { id: 1, cityName: 'Jaipur', stateName: 'Rajasthan', status: true },
      { id: 2, cityName: 'Delhi', stateName: 'Delhi', status: true },
      { id: 3, cityName: 'Noida', stateName: 'Uttar Pradesh', status: false }
    ]);

    // Seed States
    await State.create([
      { id: 1, name: 'Rajasthan', status: true },
      { id: 2, name: 'Delhi', status: true },
      { id: 3, name: 'Uttar Pradesh', status: true }
    ]);

    // Seed Localities
    await Locality.create([
      { id: 1, localityName: 'Mansarovar', cityName: 'Jaipur', stateName: 'Rajasthan', status: true },
      { id: 2, localityName: 'Sector 62', cityName: 'Noida', stateName: 'Uttar Pradesh', status: true },
      { id: 3, localityName: 'Laxmi Nagar', cityName: 'Delhi', stateName: 'Delhi', status: false }
    ]);

    // Seed Notifications
    await Notification.create([
      { id: 1, title: 'Welcome to Admin Panel', message: 'We are pleased to have you on board.', audience: 'All Partners', createdAt: '2026-05-25', status: true, isSent: true, sentAt: '2026-05-25 10:00 AM' },
      { id: 2, title: 'Upcoming Server Maintenance', message: 'There will be brief server maintenance tonight at 12:00 AM.', audience: 'All Users', createdAt: '2026-05-25', status: true, isSent: false, sentAt: '' }
    ]);

    // Seed Reviews
    await Review.create([
      { id: 1, userName: 'Rahul Sharma', partnerName: 'Amit Kumar', serviceName: 'AC Repair & Gas Refill', rating: 5.0, reviewText: 'Excellent service! The partner arrived on time and was very professional.', status: true },
      { id: 2, userName: 'Aman Verma', partnerName: 'Amit Kumar', serviceName: 'Ceiling Fan Installation', rating: 4.0, reviewText: 'Good work, fan works fine. Recommended.', status: true }
    ]);

    console.log('MongoDB database seeded successfully!');
  } catch (err) {
    console.error('Error seeding MongoDB database:', err);
  }
}

module.exports = {
  mongoose,
  User,
  Partner,
  Category,
  Service,
  Order,
  BookingEarning,
  SubscriptionEarning,
  Banner,
  City,
  State,
  Locality,
  Notification,
  Review
};
