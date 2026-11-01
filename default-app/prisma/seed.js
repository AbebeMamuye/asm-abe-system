/**
 * Database Seed Script - Enterprise Edition
 * Creates comprehensive test data for the Asset Management System
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // ========================================================================
  // 1. CREATE USERS WITH DIFFERENT ROLES
  // ========================================================================
  console.log('👤 Creating users...');
  
  const users = [
    {
      username: 'AbeTech',
      password: 'TechAbe@123',
      email: 'admin@abetech.com',
      name: 'Abraham Tekle',
      firstName: 'Abraham',
      lastName: 'Tekle',
      role: 'ADMIN',
      department: 'Administration',
      position: 'System Administrator',
      employeeId: 'EMP-001',
    },
    {
      username: 'manager',
      password: 'Manager@123',
      email: 'manager@abetech.com',
      name: 'Sarah Johnson',
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'MANAGER',
      department: 'Inventory Management',
      position: 'Inventory Manager',
      employeeId: 'EMP-002',
    },
    {
      username: 'staff',
      password: 'Staff@123',
      email: 'staff@abetech.com',
      name: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      role: 'STAFF',
      department: 'Warehouse',
      position: 'Store Keeper',
      employeeId: 'EMP-003',
    },
    {
      username: 'viewer',
      password: 'Viewer@123',
      email: 'viewer@abetech.com',
      name: 'Jane Smith',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'VIEWER',
      department: 'Finance',
      position: 'Finance Officer',
      employeeId: 'EMP-004',
    },
  ];

  const createdUsers = [];
  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const user = await prisma.user.upsert({
      where: { username: userData.username },
      update: {},
      create: {
        ...userData,
        password: hashedPassword,
        passwordChangedAt: new Date(),
        isActive: true,
      },
    });
    createdUsers.push(user);
    console.log(`  ✓ Created user: ${user.username} (${user.role})`);
  }

  const adminUser = createdUsers[0];

  // ========================================================================
  // 2. CREATE CATEGORIES
  // ========================================================================
  console.log('\n📂 Creating categories...');
  
  const categories = [
    { name: 'Medical Equipment', description: 'Medical and diagnostic equipment', icon: '🏥', color: '#3B82F6' },
    { name: 'Electronics', description: 'Electronic devices and IT equipment', icon: '💻', color: '#8B5CF6' },
    { name: 'Furniture', description: 'Office and medical furniture', icon: '🪑', color: '#F59E0B' },
    { name: 'Stationery', description: 'Office supplies and stationery', icon: '📝', color: '#10B981' },
    { name: 'Cleaning Supplies', description: 'Cleaning and sanitation supplies', icon: '🧹', color: '#06B6D4' },
    { name: 'Laboratory', description: 'Laboratory equipment and supplies', icon: '🔬', color: '#EC4899' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
    console.log(`  ✓ Created category: ${category.name}`);
  }

  // ========================================================================
  // 3. CREATE DEPARTMENTS
  // ========================================================================
  console.log('\n🏢 Creating departments...');
  
  const departments = [
    { code: 'ADMIN', name: 'Administration', location: 'Building A - 1st Floor' },
    { code: 'OPD', name: 'Out Patient Department', location: 'Building B - Ground Floor' },
    { code: 'IPD', name: 'In Patient Department', location: 'Building B - 2nd Floor' },
    { code: 'SURGERY', name: 'Surgery Department', location: 'Building C - 1st Floor' },
    { code: 'LAB', name: 'Laboratory', location: 'Building A - 2nd Floor' },
    { code: 'PHARMACY', name: 'Pharmacy', location: 'Building A - Ground Floor' },
    { code: 'IT', name: 'IT Department', location: 'Building A - 3rd Floor' },
    { code: 'MAINT', name: 'Maintenance', location: 'Building D' },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: dept,
    });
    console.log(`  ✓ Created department: ${dept.name}`);
  }

  // ========================================================================
  // 4. CREATE SUPPLIERS
  // ========================================================================
  console.log('\n🏪 Creating suppliers...');
  
  const suppliers = [
    {
      code: 'SUP-001',
      name: 'International Med-Supplies Ltd',
      contactPerson: 'Dr. Michael Chen',
      email: 'sales@intlmedsupply.com',
      phone: '+251-11-123-4567',
      address: 'Bole Road, Addis Ababa, Ethiopia',
      taxId: 'TIN-001234567',
      rating: 5,
    },
    {
      code: 'SUP-002',
      name: 'Global Tech Solutions',
      contactPerson: 'Sarah Williams',
      email: 'info@globaltechsol.com',
      phone: '+251-11-234-5678',
      address: 'Kazanchis, Addis Ababa, Ethiopia',
      taxId: 'TIN-002345678',
      rating: 4,
    },
    {
      code: 'SUP-003',
      name: 'Office Essentials Ethiopia',
      contactPerson: 'Ahmed Hassan',
      email: 'orders@officeessentials.et',
      phone: '+251-11-345-6789',
      address: 'Merkato, Addis Ababa, Ethiopia',
      taxId: 'TIN-003456789',
      rating: 4,
    },
  ];

  for (const supplier of suppliers) {
    await prisma.supplier.upsert({
      where: { code: supplier.code },
      update: {},
      create: supplier,
    });
    console.log(`  ✓ Created supplier: ${supplier.name}`);
  }

  // ========================================================================
  // 5. CREATE COMPREHENSIVE ASSET INVENTORY
  // ========================================================================
  console.log('\n📦 Creating asset inventory...');
  
  const items = [
    // Medical Equipment
    {
      name: 'Diagnostic Ultrasound Machine',
      description: 'High-resolution color Doppler ultrasound system',
      category: 'Medical Equipment',
      unit: 'unit',
      quantity: 3,
      reorderLevel: 1,
      condition: 'FUNCTIONAL',
      location: 'OPD Room 4',
      modelNumber: 'GE-LOGIQ-P9',
      serialNumber: 'USM-2024-001',
      manufacturer: 'GE Healthcare',
      purchaseDate: new Date('2024-01-15'),
      purchasePrice: 250000.00,
      warrantyExpiry: new Date('2027-01-15'),
      barcode: 'BAR-USM-001',
      tags: JSON.stringify(['medical', 'diagnostic', 'imaging']),
    },
    {
      name: 'Digital Stethoscope',
      description: 'Electronic stethoscope with Bluetooth connectivity',
      category: 'Medical Equipment',
      unit: 'piece',
      quantity: 20,
      reorderLevel: 5,
      condition: 'FUNCTIONAL',
      location: 'Medical Supplies Room',
      modelNumber: '3M-Littmann-3200',
      manufacturer: '3M Littmann',
      purchaseDate: new Date('2024-03-10'),
      purchasePrice: 350.00,
      warrantyExpiry: new Date('2026-03-10'),
      tags: JSON.stringify(['medical', 'diagnostic']),
    },
    {
      name: 'Patient Monitor',
      description: '15-inch multi-parameter patient monitoring system',
      category: 'Medical Equipment',
      unit: 'unit',
      quantity: 8,
      reorderLevel: 2,
      condition: 'FUNCTIONAL',
      location: 'ICU',
      modelNumber: 'PM-5000',
      serialNumber: 'PM-2024-001',
      manufacturer: 'Philips Healthcare',
      purchaseDate: new Date('2024-02-20'),
      purchasePrice: 5000.00,
      warrantyExpiry: new Date('2027-02-20'),
      barcode: 'BAR-PM-001',
      tags: JSON.stringify(['medical', 'monitoring', 'icu']),
    },
    {
      name: 'Surgical Table',
      description: 'Hydraulic operating table with adjustable height',
      category: 'Medical Equipment',
      unit: 'unit',
      quantity: 4,
      reorderLevel: 1,
      condition: 'FUNCTIONAL',
      location: 'Operating Theater 1',
      modelNumber: 'ST-7000',
      serialNumber: 'ST-2024-001',
      manufacturer: 'Steris',
      purchaseDate: new Date('2023-11-05'),
      purchasePrice: 15000.00,
      warrantyExpiry: new Date('2028-11-05'),
      tags: JSON.stringify(['medical', 'surgery', 'equipment']),
    },

    // Electronics & IT Equipment
    {
      name: 'Dell OptiPlex 7090 Desktop',
      description: 'Intel i7, 16GB RAM, 512GB SSD, Windows 11 Pro',
      category: 'Electronics',
      unit: 'unit',
      quantity: 15,
      reorderLevel: 3,
      condition: 'FUNCTIONAL',
      location: 'IT Office',
      modelNumber: 'OptiPlex-7090',
      serialNumber: 'DELL-2024-001',
      manufacturer: 'Dell Technologies',
      purchaseDate: new Date('2024-01-10'),
      purchasePrice: 1200.00,
      warrantyExpiry: new Date('2027-01-10'),
      barcode: 'BAR-PC-001',
      tags: JSON.stringify(['electronics', 'computer', 'it']),
    },
    {
      name: 'HP LaserJet Pro M428fdw Printer',
      description: 'Multifunction laser printer with wireless capability',
      category: 'Electronics',
      unit: 'unit',
      quantity: 8,
      reorderLevel: 2,
      condition: 'MAINTENANCE',
      location: 'Admin Office',
      modelNumber: 'M428fdw',
      serialNumber: 'HP-2024-001',
      manufacturer: 'HP Inc.',
      purchaseDate: new Date('2023-12-01'),
      purchasePrice: 450.00,
      warrantyExpiry: new Date('2024-12-01'),
      lastMaintenanceDate: new Date('2024-09-15'),
      tags: JSON.stringify(['electronics', 'printer', 'office']),
    },
    {
      name: 'Cisco Network Switch 48-Port',
      description: 'Managed Gigabit Ethernet switch',
      category: 'Electronics',
      unit: 'unit',
      quantity: 3,
      reorderLevel: 1,
      condition: 'FUNCTIONAL',
      location: 'Server Room',
      modelNumber: 'Catalyst-2960X',
      serialNumber: 'CSC-2024-001',
      manufacturer: 'Cisco Systems',
      purchaseDate: new Date('2024-02-15'),
      purchasePrice: 2500.00,
      warrantyExpiry: new Date('2027-02-15'),
      tags: JSON.stringify(['electronics', 'networking', 'infrastructure']),
    },

    // Furniture
    {
      name: 'Executive Office Desk',
      description: 'Wooden L-shaped desk with drawers',
      category: 'Furniture',
      unit: 'piece',
      quantity: 12,
      reorderLevel: 2,
      condition: 'FUNCTIONAL',
      location: 'Various Offices',
      modelNumber: 'OD-2000',
      manufacturer: 'Office Furniture Co.',
      purchaseDate: new Date('2023-09-01'),
      purchasePrice: 450.00,
      tags: JSON.stringify(['furniture', 'office', 'desk']),
    },
    {
      name: 'Ergonomic Office Chair',
      description: 'Adjustable mesh back office chair with lumbar support',
      category: 'Furniture',
      unit: 'piece',
      quantity: 25,
      reorderLevel: 5,
      condition: 'FUNCTIONAL',
      location: 'Various Offices',
      modelNumber: 'EC-3000',
      manufacturer: 'ErgoChair Ltd.',
      purchaseDate: new Date('2024-01-20'),
      purchasePrice: 200.00,
      warrantyExpiry: new Date('2026-01-20'),
      tags: JSON.stringify(['furniture', 'office', 'chair']),
    },

    // Stationery
    {
      name: 'A4 Paper 80gsm',
      description: 'Premium quality copier paper, 500 sheets per ream',
      category: 'Stationery',
      unit: 'ream',
      quantity: 150,
      reorderLevel: 30,
      condition: 'FUNCTIONAL',
      location: 'Central Store',
      tags: JSON.stringify(['stationery', 'paper', 'consumable']),
    },
    {
      name: 'Ballpoint Pens - Blue',
      description: 'Medium point ballpoint pens, box of 50',
      category: 'Stationery',
      unit: 'box',
      quantity: 25,
      reorderLevel: 10,
      condition: 'FUNCTIONAL',
      location: 'Central Store',
      tags: JSON.stringify(['stationery', 'writing', 'consumable']),
    },
    {
      name: 'Lever Arch File',
      description: '75mm capacity lever arch file, assorted colors',
      category: 'Stationery',
      unit: 'piece',
      quantity: 80,
      reorderLevel: 20,
      condition: 'FUNCTIONAL',
      location: 'Central Store',
      tags: JSON.stringify(['stationery', 'filing', 'storage']),
    },

    // Cleaning Supplies
    {
      name: 'Hospital Grade Disinfectant',
      description: 'EPA-approved hospital-grade disinfectant, 5L',
      category: 'Cleaning Supplies',
      unit: 'liter',
      quantity: 45,
      reorderLevel: 15,
      condition: 'FUNCTIONAL',
      location: 'Cleaning Store',
      tags: JSON.stringify(['cleaning', 'disinfectant', 'consumable']),
    },
    {
      name: 'Industrial Floor Cleaner',
      description: 'Heavy-duty floor cleaning solution, 5L',
      category: 'Cleaning Supplies',
      unit: 'liter',
      quantity: 30,
      reorderLevel: 10,
      condition: 'FUNCTIONAL',
      location: 'Cleaning Store',
      tags: JSON.stringify(['cleaning', 'floor', 'consumable']),
    },
    {
      name: 'Microfiber Cleaning Cloths',
      description: 'Reusable microfiber cloths, pack of 12',
      category: 'Cleaning Supplies',
      unit: 'pack',
      quantity: 20,
      reorderLevel: 5,
      condition: 'FUNCTIONAL',
      location: 'Cleaning Store',
      tags: JSON.stringify(['cleaning', 'cloth', 'reusable']),
    },

    // Laboratory Equipment
    {
      name: 'Laboratory Centrifuge',
      description: 'High-speed refrigerated centrifuge, 24-place rotor',
      category: 'Laboratory',
      unit: 'unit',
      quantity: 2,
      reorderLevel: 1,
      condition: 'FUNCTIONAL',
      location: 'Laboratory',
      modelNumber: 'LC-5000R',
      serialNumber: 'LC-2024-001',
      manufacturer: 'Eppendorf',
      purchaseDate: new Date('2024-03-01'),
      purchasePrice: 8500.00,
      warrantyExpiry: new Date('2027-03-01'),
      barcode: 'BAR-LC-001',
      tags: JSON.stringify(['laboratory', 'equipment', 'diagnostic']),
    },
    {
      name: 'Microscope - Binocular',
      description: 'LED illuminated binocular microscope, 40x-1000x',
      category: 'Laboratory',
      unit: 'unit',
      quantity: 5,
      reorderLevel: 1,
      condition: 'FUNCTIONAL',
      location: 'Laboratory',
      modelNumber: 'BM-2000',
      serialNumber: 'MIC-2024-001',
      manufacturer: 'Olympus',
      purchaseDate: new Date('2023-11-20'),
      purchasePrice: 1500.00,
      warrantyExpiry: new Date('2026-11-20'),
      tags: JSON.stringify(['laboratory', 'microscope', 'diagnostic']),
    },
  ];

  const createdItems = [];
  for (const item of items) {
    const created = await prisma.item.create({
      data: {
        ...item,
        createdBy: adminUser.id,
        status: 'ACTIVE',
      },
    });
    createdItems.push(created);
    console.log(`  ✓ Created item: ${created.name}`);
  }

  // ========================================================================
  // 6. CREATE SAMPLE TRANSACTIONS
  // ========================================================================
  console.log('\n💼 Creating sample transactions...');
  
  // Stock-In transactions
  const stockInTransactions = [
    {
      itemId: createdItems[0].id, // Ultrasound
      type: 'IN',
      quantity: 3,
      unitPrice: 250000.00,
      totalPrice: 750000.00,
      supplier: 'International Med-Supplies Ltd',
      invoiceNumber: 'INV-2024-001',
      purchaseOrderNumber: 'PO-2024-001',
      voucherNumber: 'M19-0001',
      date: new Date('2024-01-15'),
      status: 'COMPLETED',
      approvedBy: 'Manager',
      remarks: 'Initial procurement for OPD expansion',
    },
    {
      itemId: createdItems[4].id, // Dell Desktop
      type: 'IN',
      quantity: 15,
      unitPrice: 1200.00,
      totalPrice: 18000.00,
      supplier: 'Global Tech Solutions',
      invoiceNumber: 'INV-2024-005',
      purchaseOrderNumber: 'PO-2024-002',
      voucherNumber: 'M19-0002',
      date: new Date('2024-01-10'),
      status: 'COMPLETED',
      approvedBy: 'IT Manager',
      remarks: 'IT infrastructure upgrade',
    },
  ];

  for (const txn of stockInTransactions) {
    await prisma.transaction.create({
      data: {
        ...txn,
        createdBy: adminUser.id,
        processedBy: adminUser.id,
      },
    });
    console.log(`  ✓ Created Stock-In: ${txn.voucherNumber}`);
  }

  // Stock-Out transactions
  const stockOutTransactions = [
    {
      itemId: createdItems[0].id, // Ultrasound
      type: 'OUT',
      quantity: 1,
      department: 'Out Patient Department',
      requisitionNumber: 'REQ-2024-001',
      recipientName: 'Dr. Sarah Johnson',
      voucherNumber: 'M20-0001',
      date: new Date('2024-01-20'),
      status: 'COMPLETED',
      approvedBy: 'Department Head',
      remarks: 'Allocated to OPD for patient diagnostics',
    },
    {
      itemId: createdItems[4].id, // Dell Desktop
      type: 'OUT',
      quantity: 5,
      department: 'Administration',
      requisitionNumber: 'REQ-2024-002',
      recipientName: 'IT Department',
      voucherNumber: 'M20-0002',
      date: new Date('2024-01-12'),
      status: 'COMPLETED',
      approvedBy: 'Admin Manager',
      remarks: 'Computer deployment for admin staff',
    },
  ];

  for (const txn of stockOutTransactions) {
    await prisma.transaction.create({
      data: {
        ...txn,
        createdBy: adminUser.id,
        processedBy: adminUser.id,
      },
    });
    console.log(`  ✓ Created Stock-Out: ${txn.voucherNumber}`);
  }

  // ========================================================================
  // 7. CREATE MAINTENANCE LOGS
  // ========================================================================
  console.log('\n🔧 Creating maintenance logs...');
  
  const maintenanceLogs = [
    {
      itemId: createdItems[5].id, // HP Printer
      maintenanceType: 'PREVENTIVE',
      description: 'Routine maintenance and cleaning',
      findings: 'Toner low, paper feed mechanism needs adjustment',
      actionTaken: 'Replaced toner cartridge, cleaned rollers, adjusted paper feed',
      technicianName: 'John Technician',
      technicianContact: '+251-91-123-4567',
      performedBy: 'Maintenance Team',
      scheduledDate: new Date('2024-09-10'),
      completionDate: new Date('2024-09-15'),
      nextDueDate: new Date('2024-12-15'),
      cost: 150.00,
      laborCost: 50.00,
      partsCost: 100.00,
      status: 'COMPLETED',
      priority: 'NORMAL',
      partsReplaced: JSON.stringify(['Toner Cartridge', 'Pickup Roller']),
    },
  ];

  for (const log of maintenanceLogs) {
    await prisma.maintenanceLog.create({
      data: {
        ...log,
        createdBy: adminUser.id,
      },
    });
    console.log(`  ✓ Created maintenance log for item`);
  }

  // ========================================================================
  // 8. CREATE SYSTEM CONFIGURATIONS
  // ========================================================================
  console.log('\n⚙️  Creating system configurations...');
  
  const configs = [
    {
      key: 'SYSTEM_NAME',
      value: 'Asset Management System',
      type: 'STRING',
      description: 'Application name',
      isPublic: true,
    },
    {
      key: 'ORGANIZATION_NAME',
      value: 'AbeTech Organization',
      type: 'STRING',
      description: 'Organization name',
      isPublic: true,
    },
    {
      key: 'CURRENCY',
      value: 'ETB',
      type: 'STRING',
      description: 'Default currency',
      isPublic: true,
    },
    {
      key: 'LOW_STOCK_ALERT_ENABLED',
      value: 'true',
      type: 'BOOLEAN',
      description: 'Enable low stock alerts',
      isPublic: false,
    },
    {
      key: 'AUTO_VOUCHER_NUMBER',
      value: 'true',
      type: 'BOOLEAN',
      description: 'Auto-generate voucher numbers',
      isPublic: false,
    },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: {
        ...config,
        updatedBy: adminUser.id,
      },
    });
    console.log(`  ✓ Created config: ${config.key}`);
  }

  // ========================================================================
  // SUMMARY
  // ========================================================================
  console.log('\n✅ Database seeding completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   Users: ${createdUsers.length}`);
  console.log(`   Categories: ${categories.length}`);
  console.log(`   Departments: ${departments.length}`);
  console.log(`   Suppliers: ${suppliers.length}`);
  console.log(`   Items: ${createdItems.length}`);
  console.log(`   Transactions: ${stockInTransactions.length + stockOutTransactions.length}`);
  console.log(`   Maintenance Logs: ${maintenanceLogs.length}`);
  console.log(`   System Configs: ${configs.length}`);
  
  console.log('\n🔐 Login Credentials:');
  console.log('   ┌─────────────────────────────────────────────────┐');
  console.log('   │ Role      │ Username    │ Password          │');
  console.log('   ├─────────────────────────────────────────────────┤');
  console.log('   │ ADMIN     │ AbeTech     │ TechAbe@123      │');
  console.log('   │ MANAGER   │ manager     │ Manager@123      │');
  console.log('   │ STAFF     │ staff       │ Staff@123        │');
  console.log('   │ VIEWER    │ viewer      │ Viewer@123       │');
  console.log('   └─────────────────────────────────────────────────┘');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
