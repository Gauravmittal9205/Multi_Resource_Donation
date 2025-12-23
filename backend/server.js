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
<<<<<<<<< Temporary merge branch 1
const impactRoutes = require('./routes/impact');
=========
const contactsRoutes = require('./routes/contacts');
>>>>>>>>> Temporary merge branch 2

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
<<<<<<<<< Temporary merge branch 1
app.use('/api/v1/impact', impactRoutes);
=========
app.use('/api/v1/contacts', contactsRoutes);
>>>>>>>>> Temporary merge branch 2

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    error: 'Server Error' 
  });
});

// Database connection
const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB Atlas...');
    console.log('Connection string:', process.env.MONGODB_URI ? 'Found' : 'Missing');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    
    console.log(`MongoDB connected: ${conn.connection.host}`);
    
    // Log when connected
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to DB');
    });
    
    // Log any errors after initial connection
    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });
    
    // Log when disconnected
    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected');
    });
    
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    console.error('Error code name:', error.codeName);
    
    // Exit process with failure after a delay to allow logs to be written
    setTimeout(() => process.exit(1), 1000);
  }
};

// Connect to the database
connectDB();

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Welcome to the Donation App API',
    version: '1.0.0'
  });
});

// Handle 404
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Not Found'
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
