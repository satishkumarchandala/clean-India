import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Organization from './models/Organization.js';
import Issue from './models/Issue.js';
import connectDB from './config/db.js';
import config from './config/config.js';

dotenv.config();

// Sample organizations
const organizations = [
  { name: 'Power Grid Corporation', category: 'electricity', description: 'Electricity distribution and maintenance' },
  { name: 'Water Supply Department', category: 'water', description: 'Water supply and sewage management' },
  { name: 'Roads & Transport Authority', category: 'road', description: 'Road maintenance and transport services' },
  { name: 'Municipal Corporation', category: 'general', description: 'General civic administration' },
  { name: 'Sanitation Department', category: 'sanitation', description: 'Waste management and sanitation' },
];

// Sample users
const users = [
  {
    name: config.admin.name,
    email: config.admin.email,
    password: config.admin.password,
    role: 'super_admin',
    phone: '+1234567890',
    location: 'City Center',
  },
  {
    name: 'John Citizen',
    email: 'john@example.com',
    password: 'password123',
    role: 'user',
    phone: '+1234567891',
    location: 'Downtown',
  },
  {
    name: 'Jane Reporter',
    email: 'jane@example.com',
    password: 'password123',
    role: 'user',
    phone: '+1234567892',
    location: 'Uptown',
  },
];

// Sample issues
const sampleIssues = [
  {
    title: 'Broken Street Light on Main Street',
    description: 'The street light near the park has been out for a week, making the area unsafe at night.',
    category: 'electricity',
    priority: 'high',
    status: 'pending',
    address: 'Main Street, near Central Park',
    latitude: 40.7589,
    longitude: -73.9851,
  },
  {
    title: 'Pothole on Highway 101',
    description: 'Large pothole causing traffic issues and potential vehicle damage.',
    category: 'road',
    priority: 'high',
    status: 'in-progress',
    address: 'Highway 101, Exit 45',
    latitude: 40.7480,
    longitude: -73.9862,
  },
  {
    title: 'Water Leakage in Residential Area',
    description: 'Continuous water leakage from underground pipe flooding the street.',
    category: 'water',
    priority: 'critical',
    status: 'pending',
    address: 'Oak Avenue, Block 5',
    latitude: 40.7614,
    longitude: -73.9776,
  },
];

const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();

    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Organization.deleteMany({});
    await Issue.deleteMany({});

    console.log('🏢 Creating organizations...');
    const createdOrgs = await Organization.insertMany(organizations);
    console.log(`✅ Created ${createdOrgs.length} organizations`);

    console.log('👥 Creating users...');
    // Create admin user
    const adminUser = await User.create(users[0]);
    console.log(`✅ Created admin user: ${adminUser.email}`);

    // Create regular users
    const regularUsers = [];
    for (let i = 1; i < users.length; i++) {
      const user = await User.create(users[i]);
      regularUsers.push(user);
      console.log(`✅ Created user: ${user.email}`);
    }

    // Assign some users to organizations
    const electricityOrg = createdOrgs.find(org => org.category === 'electricity');
    const waterOrg = createdOrgs.find(org => org.category === 'water');

    // Create org admin
    const orgAdmin = await User.create({
      name: 'Electricity Admin',
      email: 'electric.admin@example.com',
      password: 'password123',
      role: 'org_admin',
      organization: electricityOrg._id,
      phone: '+1234567893',
      location: 'Power Station',
    });
    console.log(`✅ Created org admin: ${orgAdmin.email}`);

    console.log('📋 Creating sample issues...');
    for (let issueData of sampleIssues) {
      const issue = await Issue.create({
        ...issueData,
        location: {
          type: 'Point',
          coordinates: [issueData.longitude, issueData.latitude],
        },
        reportedBy: regularUsers[Math.floor(Math.random() * regularUsers.length)]._id,
      });
      console.log(`✅ Created issue: ${issue.title}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('🎉 Database seeded successfully!');
    console.log('='.repeat(80));
    console.log('\n📝 Login Credentials:');
    console.log('Super Admin:');
    console.log(`  Email: ${config.admin.email}`);
    console.log(`  Password: ${config.admin.password}`);
    console.log('\nOrg Admin:');
    console.log('  Email: electric.admin@example.com');
    console.log('  Password: password123');
    console.log('\nRegular Users:');
    console.log('  Email: john@example.com / Password: password123');
    console.log('  Email: jane@example.com / Password: password123');
    console.log('='.repeat(80) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
