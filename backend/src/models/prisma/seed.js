/**
 * Database Seeding Script
 * Creates test data for development
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { getCurrentTaxYear } = require('../../utils/hmrcRates');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clean existing data
  console.log('Cleaning existing data...');
  await prisma.refreshToken.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.userMileageSummary.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.report.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.mileageRate.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();
  console.log('✅ Data cleaned\n');

  // Create mileage rates for current tax year
  const taxYear = getCurrentTaxYear();
  console.log(`Creating mileage rates for ${taxYear}...`);
  
  await prisma.mileageRate.createMany({
    data: [
      {
        taxYear,
        vehicleType: 'car',
        rateFirst10000: 0.45,
        rateOver10000: 0.25,
        effectiveFrom: new Date(`${taxYear.split('-')[0]}-04-06`),
      },
      {
        taxYear,
        vehicleType: 'motorcycle',
        rateFirst10000: 0.24,
        rateOver10000: 0.24,
        effectiveFrom: new Date(`${taxYear.split('-')[0]}-04-06`),
      },
      {
        taxYear,
        vehicleType: 'bicycle',
        rateFirst10000: 0.20,
        rateOver10000: 0.20,
        effectiveFrom: new Date(`${taxYear.split('-')[0]}-04-06`),
      },
    ],
  });
  console.log('✅ Mileage rates created\n');

  // Create demo company
  console.log('Creating demo company...');
  const company = await prisma.company.create({
    data: {
      name: 'Demo Construction Ltd',
      addressLine1: '123 Builder Street',
      city: 'London',
      postcode: 'SW1A 1AA',
      vatNumber: 'GB123456789',
      cisNumber: 'CIS123456',
      contactEmail: 'admin@democonstruction.co.uk',
      contactPhone: '020 7946 0958',
      isActive: true,
    },
  });
  console.log(`✅ Company created: ${company.name}\n`);

  // Create demo users
  console.log('Creating demo users...');
  const passwordHash = await bcrypt.hash('Test@12345', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true,
      emailVerified: true,
      preferences: JSON.stringify({ theme: 'light', currency: 'GBP' }),
    },
  });

  const contractor = await prisma.user.create({
    data: {
      email: 'contractor@example.com',
      passwordHash,
      firstName: 'John',
      lastName: 'Builder',
      role: 'user',
      companyId: company.id,
      phone: '07700 900123',
      isActive: true,
      emailVerified: true,
      preferences: JSON.stringify({ theme: 'light', currency: 'GBP' }),
    },
  });

  const accountant = await prisma.user.create({
    data: {
      email: 'accountant@example.com',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Accountant',
      role: 'accountant',
      isActive: true,
      emailVerified: true,
      preferences: JSON.stringify({ theme: 'light', currency: 'GBP' }),
    },
  });

  console.log(`✅ Users created:`);
  console.log(`  - ${admin.email} (admin)`);
  console.log(`  - ${contractor.email} (contractor)`);
  console.log(`  - ${accountant.email} (accountant)\n`);

  // Create vehicles for contractor
  console.log('Creating vehicles...');
  const van = await prisma.vehicle.create({
    data: {
      userId: contractor.id,
      name: 'Work Van',
      registration: 'AB12 CDE',
      make: 'Ford',
      model: 'Transit',
      fuelType: 'diesel',
      year: 2022,
      color: 'White',
      isCompanyCar: false,
    },
  });

  const personalCar = await prisma.vehicle.create({
    data: {
      userId: contractor.id,
      name: 'Personal Car',
      registration: 'XY99 ZZZ',
      make: 'Vauxhall',
      model: 'Corsa',
      fuelType: 'petrol',
      year: 2020,
      color: 'Blue',
      isCompanyCar: false,
    },
  });

  console.log(`✅ Vehicles created: ${van.name}, ${personalCar.name}\n`);

  // Create sample trips for contractor
  console.log('Creating sample trips...');
  const today = new Date();
  const trips = [
    {
      tripDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
      startLocation: 'Home',
      endLocation: 'Site A - London Bridge',
      distanceMiles: 12.5,
      isRoundTrip: true,
      purpose: 'Site inspection for new project',
      purposeCategory: 'site_visit',
      rateApplied: 0.45,
      amountGbp: 11.25,
      vehicleId: van.id,
    },
    {
      tripDate: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000),
      startLocation: 'Home',
      endLocation: 'Builder Merchants',
      distanceMiles: 3.2,
      isRoundTrip: true,
      purpose: 'Collect materials for Site A',
      purposeCategory: 'materials',
      rateApplied: 0.45,
      amountGbp: 2.88,
      vehicleId: van.id,
    },
    {
      tripDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
      startLocation: 'Home',
      endLocation: 'Client Office - Central London',
      distanceMiles: 8.0,
      isRoundTrip: false,
      purpose: 'Project progress meeting',
      purposeCategory: 'client_meeting',
      rateApplied: 0.45,
      amountGbp: 3.60,
      vehicleId: personalCar.id,
    },
    {
      tripDate: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000),
      startLocation: 'Site A',
      endLocation: 'Suppliers Warehouse',
      distanceMiles: 15.0,
      isRoundTrip: true,
      purpose: 'Emergency materials collection',
      purposeCategory: 'supplier_visit',
      rateApplied: 0.45,
      amountGbp: 13.50,
      vehicleId: van.id,
    },
    {
      tripDate: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
      startLocation: 'Home',
      endLocation: 'Training Centre',
      distanceMiles: 22.0,
      isRoundTrip: true,
      purpose: 'Health and Safety training',
      purposeCategory: 'training',
      rateApplied: 0.45,
      amountGbp: 9.90,
      vehicleId: personalCar.id,
    },
    {
      tripDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
      startLocation: 'Home',
      endLocation: 'Site B - Croydon',
      distanceMiles: 18.5,
      isRoundTrip: true,
      purpose: 'New project site survey',
      purposeCategory: 'site_visit',
      rateApplied: 0.45,
      amountGbp: 8.33,
      vehicleId: van.id,
    },
    {
      tripDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
      startLocation: 'Home',
      endLocation: 'Accountant Office',
      distanceMiles: 5.5,
      isRoundTrip: false,
      purpose: 'Quarterly review meeting',
      purposeCategory: 'other',
      rateApplied: 0.45,
      amountGbp: 2.48,
      vehicleId: personalCar.id,
    },
  ];

  let ytdMiles = 0;
  for (const tripData of trips) {
    await prisma.trip.create({
      data: {
        userId: contractor.id,
        vehicleId: tripData.vehicleId,
        tripDate: tripData.tripDate,
        startLocation: tripData.startLocation,
        endLocation: tripData.endLocation,
        distanceMiles: tripData.distanceMiles,
        isRoundTrip: tripData.isRoundTrip,
        purpose: tripData.purpose,
        purposeCategory: tripData.purposeCategory,
        taxYear,
        vehicleType: 'car',
        rateApplied: tripData.rateApplied,
        amountGbp: tripData.amountGbp,
        userMilesYtd: ytdMiles + tripData.distanceMiles,
        notes: '',
      },
    });
    ytdMiles += tripData.distanceMiles;
  }

  console.log(`✅ Created ${trips.length} sample trips\n`);

  // Create mileage summary
  console.log('Creating mileage summary...');
  const totalAmount = trips.reduce((sum, t) => sum + t.amountGbp, 0);
  const milesAt45p = trips.filter(t => t.rateApplied === 0.45).reduce((sum, t) => sum + t.distanceMiles, 0);
  const amountAt45p = trips.filter(t => t.rateApplied === 0.45).reduce((sum, t) => sum + t.amountGbp, 0);

  await prisma.userMileageSummary.create({
    data: {
      userId: contractor.id,
      taxYear,
      totalMiles: ytdMiles,
      totalClaimAmount: totalAmount,
      tripCount: trips.length,
      milesAt45p,
      amountAt45p,
      milesAt25p: 0,
      amountAt25p: 0,
      lastTripDate: trips[trips.length - 1].tripDate,
    },
  });
  console.log('✅ Mileage summary created\n');

  console.log('🎉 Database seed completed successfully!');
  console.log('\n📧 Login credentials:');
  console.log('  Admin:     admin@example.com / Test@12345');
  console.log('  Contractor: contractor@example.com / Test@12345');
  console.log('  Accountant: accountant@example.com / Test@12345');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });