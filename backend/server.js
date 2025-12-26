require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

// Route files
const auth = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const impactRoutes = require('./routes/impact');
const faqsRoutes = require('./routes/faqs');
const contactsRoutes = require('./routes/contacts');
const geoRoutes = require('./routes/geo');
const eventRegistrationsRoutes = require('./routes/eventRegistrations');
// const ngoRoutes = require('./routes/ngos');
const donationsRoutes = require('./routes/donations');
const ngoRequestsRoutes = require('./routes/ngoRequests');
const feedbackRoutes = require('./routes/feedback');
const ngoRegistrationRoutes = require('./routes/ngoRegistration');
const adminUsersRoutes = require('./routes/adminUsers');
const notificationsRoutes = require('./routes/notifications');
const announcementsRoutes = require('./routes/announcements');


// Create Express app
const app = express();

// Body parser (increase limits for profile payloads)
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Cookie parser
app.use(cookieParser());

// Enable CORS
app.use(cors());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Mount routers
app.use('/api/v1/auth', auth);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/impact', impactRoutes);
app.use('/api/v1/contacts', contactsRoutes);
app.use('/api/v1/geo', geoRoutes);
app.use('/api/v1/faqs', faqsRoutes);
app.use('/api/v1/event-registrations', eventRegistrationsRoutes);
// app.use('/api/v1/ngos', ngoRoutes);
app.use('/api/v1/donations', donationsRoutes);
app.use('/api/v1/ngo-requests', ngoRequestsRoutes);
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/api/v1/ngo-registration', ngoRegistrationRoutes);
app.use('/api/v1/users/admin', adminUsersRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/announcements', announcementsRoutes);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server Error';

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate value entered';
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  res.status(statusCode).json({
    success: false,
    message
  });
});

// Database connection
const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MongoDB connection string is not defined in environment variables');
  }

  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4,
    maxPoolSize: 10
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Keep retrying until connected so the server never starts without DB.
  // If you want to fail fast instead, reduce maxRetries.
  const maxRetries = Number(process.env.MONGO_CONNECT_RETRIES || 0); // 0 = infinite
  let attempt = 0;

  while (maxRetries === 0 || attempt < maxRetries) {
    attempt += 1;
    try {
      console.log(`Attempting to connect to MongoDB... (attempt ${attempt}${maxRetries === 0 ? '' : `/${maxRetries}`})`);

      const conn = await mongoose.connect(process.env.MONGODB_URI, options);
      console.log(`MongoDB connected: ${conn.connection.host}`);

      // Event listeners for connection status
      mongoose.connection.on('connected', () => {
        console.log('Mongoose connected to DB');
      });

      mongoose.connection.on('error', (err) => {
        console.error('Mongoose connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('Mongoose disconnected');
      });

      // Handle process termination
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('Mongoose connection closed due to app termination');
        process.exit(0);
      });

      return conn;
    } catch (error) {
      console.error('MongoDB connection failed:', {
        message: error.message,
        name: error.name,
        code: error.code,
        codeName: error.codeName
      });

      console.log('Retrying connection in 5 seconds...');
      await sleep(5000);
    }
  }

  throw new Error('MongoDB connection failed: exceeded maximum retry attempts');
};

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found'
  });
});

// Start server only after database connection is established
const startServer = async () => {
  try {
    await connectDB();

    try {
      const Faq = require('./models/Faq');
      const faqCount = await Faq.countDocuments();
      const volunteerFaqCount = await Faq.countDocuments({ role: 'volunteers' });

      if (faqCount === 0) {
        await Faq.insertMany(
          [
            {
              role: 'donors',
              order: 1,
              question: 'How do I donate items?',
              answer:
                'Click on the "Donate Now" button, select the items you wish to donate, and follow the simple steps to schedule a pickup.'
            },
            {
              role: 'donors',
              order: 2,
              question: 'How can I volunteer?',
              answer:
                'Join our volunteer program by signing up on our platform. You can help with pickup, sorting, and distribution of donations.'
            },
            {
              role: 'donors',
              order: 3,
              question: 'What items can I donate?',
              answer:
                'We accept food (non-perishable), clothes, books, and other essentials in good condition. Please ensure items are clean and usable.'
            },
            {
              role: 'donors',
              order: 4,
              question: 'How do I track my donation?',
              answer:
                "You can track your donation status in real-time through your dashboard. You'll receive notifications at each step of the process."
            },
            {
              role: 'donors',
              order: 5,
              question: 'Are there any tax benefits?',
              answer:
                "Yes, all donations are tax-deductible. You'll receive a tax receipt via email for your records."
            },
            {
              role: 'donors',
              order: 6,
              question: 'How do I schedule a pickup?',
              answer:
                'After submitting your donation details, you can choose a convenient pickup time slot from the available options.'
            },
            {
              role: 'ngos',
              order: 1,
              question: 'How do we register as an NGO?',
              answer:
                'Click on "Register as NGO" and complete the verification process by submitting the required documents for approval.'
            },
            {
              role: 'ngos',
              order: 2,
              question: 'What documents are required?',
              answer:
                'We require 12A/80G registration, PAN card, and a valid ID proof of the authorized signatory.'
            },
            {
              role: 'ngos',
              order: 3,
              question: 'How do we receive donations?',
              answer:
                'Once registered, you can view and accept available donations in your area through your dashboard.'
            },
            {
              role: 'ngos',
              order: 4,
              question: 'What are our responsibilities?',
              answer:
                'NGOs are responsible for timely pickup, proper utilization, and reporting of all received donations.'
            },
            {
              role: 'ngos',
              order: 5,
              question: 'How to report impact?',
              answer:
                'Use our impact reporting tool in your dashboard to share how the donations are being utilized.'
            }
          ],
          { ordered: false }
        );
      }

      if (volunteerFaqCount === 0) {
        await Faq.insertMany(
          [
            {
              role: 'volunteers',
              order: 1,
              question: 'How can I become a volunteer?',
              answer:
                'Sign up through our volunteer portal, complete the registration process, and attend an orientation session.'
            },
            {
              role: 'volunteers',
              order: 2,
              question: 'What are the volunteer requirements?',
              answer:
                'You must be at least 18 years old, complete a background check, and attend a training session.'
            },
            {
              role: 'volunteers',
              order: 3,
              question: 'What kind of volunteer work is available?',
              answer:
                'We need help with donation pickup, sorting, distribution, and community outreach programs.'
            }
          ],
          { ordered: false }
        );
      }
    } catch (seedErr) {
      console.error('FAQ seed error:', seedErr);
    }
    
    const PORT = process.env.PORT || 5000;

    const server = app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      console.log(`MongoDB connected: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', err);
      // Close server & exit process
      server.close(() => process.exit(1));
    });
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      // Close server & exit process
      server.close(() => process.exit(1));
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
