import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Medicine seed data for all categories
 * Each medicine is pre-verified for immediate use
 */

const medicineData = [
  // ============ ALLOPATHY (Modern Medicine) ============
  {
    name: 'Paracetamol',
    category: 'ALLOPATHY',
    genericName: 'Acetaminophen',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Tablet', 'Syrup', 'IV Injection']),
    commonStrengths: JSON.stringify(['500mg', '650mg', '1g', '120mg/5ml']),
    isVerified: true,
  },
  {
    name: 'Ibuprofen',
    category: 'ALLOPATHY',
    genericName: 'Ibuprofen',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Tablet', 'Suspension']),
    commonStrengths: JSON.stringify(['200mg', '400mg', '600mg', '100mg/5ml']),
    isVerified: true,
  },
  {
    name: 'Amoxicillin',
    category: 'ALLOPATHY',
    genericName: 'Amoxicillin',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Capsule', 'Tablet', 'Suspension']),
    commonStrengths: JSON.stringify(['250mg', '500mg', '125mg/5ml']),
    isVerified: true,
  },
  {
    name: 'Azithromycin',
    category: 'ALLOPATHY',
    genericName: 'Azithromycin',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Tablet', 'Suspension']),
    commonStrengths: JSON.stringify(['250mg', '500mg', '200mg/5ml']),
    isVerified: true,
  },
  {
    name: 'Omeprazole',
    category: 'ALLOPATHY',
    genericName: 'Omeprazole',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Capsule', 'Tablet']),
    commonStrengths: JSON.stringify(['20mg', '40mg']),
    isVerified: true,
  },
  {
    name: 'Metformin',
    category: 'ALLOPATHY',
    genericName: 'Metformin HCl',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Tablet', 'Extended Release']),
    commonStrengths: JSON.stringify(['500mg', '850mg', '1000mg']),
    isVerified: true,
  },
  {
    name: 'Amlodipine',
    category: 'ALLOPATHY',
    genericName: 'Amlodipine Besylate',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Tablet']),
    commonStrengths: JSON.stringify(['2.5mg', '5mg', '10mg']),
    isVerified: true,
  },
  {
    name: 'Atenolol',
    category: 'ALLOPATHY',
    genericName: 'Atenolol',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Tablet']),
    commonStrengths: JSON.stringify(['25mg', '50mg', '100mg']),
    isVerified: true,
  },
  {
    name: 'Cetirizine',
    category: 'ALLOPATHY',
    genericName: 'Cetirizine HCl',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Tablet', 'Syrup']),
    commonStrengths: JSON.stringify(['5mg', '10mg', '5mg/5ml']),
    isVerified: true,
  },
  {
    name: 'Levocet irizine',
    category: 'ALLOPATHY',
    genericName: 'Levocetirizine',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Tablet', 'Syrup']),
    commonStrengths: JSON.stringify(['5mg', '2.5mg/5ml']),
    isVerified: true,
  },
  {
    name: 'Montelukast',
    category: 'ALLOPATHY',
    genericName: 'Montelukast Sodium',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Tablet']),
    commonStrengths: JSON.stringify(['4mg', '5mg', '10mg']),
    isVerified: true,
  },
  {
    name: 'Salbutamol',
    category: 'ALLOPATHY',
    genericName: 'Salbutamol/Albuterol',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Inhaler', 'Tablet', 'Syrup', 'Nebulizer']),
    commonStrengths: JSON.stringify(['2mg', '4mg', '100mcg/puff', '2.5mg/2.5ml']),
    isVerified: true,
  },
  {
    name: 'Atorvastatin',
    category: 'ALLOPATHY',
    genericName: 'Atorvastatin Calcium',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Tablet']),
    commonStrengths: JSON.stringify(['10mg', '20mg', '40mg', '80mg']),
    isVerified: true,
  },
  {
    name: 'Rosuvastatin',
    category: 'ALLOPATHY',
    genericName: 'Rosuvastatin Calcium',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Tablet']),
    commonStrengths: JSON.stringify(['5mg', '10mg', '20mg', '40mg']),
    isVerified: true,
  },
  {
    name: 'Aspirin',
    category: 'ALLOPATHY',
    genericName: 'Acetylsalicylic Acid',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Tablet', 'Dispersible']),
    commonStrengths: JSON.stringify(['75mg', '150mg', '300mg', '325mg']),
    isVerified: true,
  },
  {
    name: 'Clopidogrel',
    category: 'ALLOPATHY',
    genericName: 'Clopidogrel Bisulfate',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Tablet']),
    commonStrengths: JSON.stringify(['75mg']),
    isVerified: true,
  },
  {
    name: 'Pantoprazole',
    category: 'ALLOPATHY',
    genericName: 'Pantoprazole Sodium',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Tablet', 'IV Injection']),
    commonStrengths: JSON.stringify(['20mg', '40mg']),
    isVerified: true,
  },
  {
    name: 'Domperidone',
    category: 'ALLOPATHY',
    genericName: 'Domperidone',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Tablet', 'Suspension']),
    commonStrengths: JSON.stringify(['10mg', '5mg/5ml']),
    isVerified: true,
  },
  {
    name: 'Ondansetron',
    category: 'ALLOPATHY',
    genericName: 'Ondansetron HCl',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Tablet', 'Syrup', 'IV Injection']),
    commonStrengths: JSON.stringify(['4mg', '8mg', '2mg/5ml']),
    isVerified: true,
  },
  {
    name: 'Diclofenac',
    category: 'ALLOPATHY',
    genericName: 'Diclofenac Sodium',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Tablet', 'Gel', 'Injection']),
    commonStrengths: JSON.stringify(['50mg', '75mg', '1%']),
    isVerified: true,
  },
  {
    name: 'Tramadol',
    category: 'ALLOPATHY',
    genericName: 'Tramadol HCl',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Tablet', 'Capsule', 'Injection']),
    commonStrengths: JSON.stringify(['50mg', '100mg']),
    isVerified: true,
  },
  {
    name: 'Ciprofloxacin',
    category: 'ALLOPATHY',
    genericName: 'Ciprofloxacin HCl',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Tablet', 'Eye Drops', 'IV Infusion']),
    commonStrengths: JSON.stringify(['250mg', '500mg', '750mg', '0.3%']),
    isVerified: true,
  },
  {
    name: 'Levofloxacin',
    category: 'ALLOPATHY',
    genericName: 'Levofloxacin',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Tablet', 'IV Infusion']),
    commonStrengths: JSON.stringify(['250mg', '500mg', '750mg']),
    isVerified: true,
  },
  {
    name: 'Doxycycline',
    category: 'ALLOPATHY',
    genericName: 'Doxycycline',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Capsule', 'Tablet']),
    commonStrengths: JSON.stringify(['100mg']),
    isVerified: true,
  },
  {
    name: 'Prednisolone',
    category: 'ALLOPATHY',
    genericName: 'Prednisolone',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Tablet', 'Syrup']),
    commonStrengths: JSON.stringify(['5mg', '10mg', '20mg', '5mg/5ml']),
    isVerified: true,
  },

  // ============ AYURVEDA ============
  {
    name: 'Triphala Churna',
    category: 'AYURVEDA',
    genericName: 'Triphala Powder',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Powder', 'Tablet', 'Capsule']),
    commonStrengths: JSON.stringify(['50g', '100g', '500mg']),
    isVerified: true,
  },
  {
    name: 'Ashwagandha',
    category: 'AYURVEDA',
    genericName: 'Withania Somnifera',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Powder', 'Tablet', 'Capsule']),
    commonStrengths: JSON.stringify(['500mg', '300mg']),
    isVerified: true,
  },
  {
    name: 'Brahmi',
    category: 'AYURVEDA',
    genericName: 'Bacopa Monnieri',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Powder', 'Tablet', 'Capsule', 'Syrup']),
    commonStrengths: JSON.stringify(['500mg', '250mg']),
    isVerified: true,
  },
  {
    name: 'Chyawanprash',
    category: 'AYURVEDA',
    genericName: 'Chyawanprash',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Paste']),
    commonStrengths: JSON.stringify(['500g', '1kg']),
    isVerified: true,
  },
  {
    name: 'Arjuna',
    category: 'AYURVEDA',
    genericName: 'Terminalia Arjuna',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Powder', 'Tablet', 'Capsule']),
    commonStrengths: JSON.stringify(['500mg', '250mg']),
    isVerified: true,
  },
  {
    name: 'Tulsi',
    category: 'AYURVEDA',
    genericName: 'Ocimum Sanctum',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Powder', 'Capsule', 'Drops']),
    commonStrengths: JSON.stringify(['500mg', '250mg']),
    isVerified: true,
  },
  {
    name: 'Giloy',
    category: 'AYURVEDA',
    genericName: 'Tinospora Cordifolia',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Powder', 'Tablet', 'Juice']),
    commonStrengths: JSON.stringify(['500mg', '500ml']),
    isVerified: true,
  },
  {
    name: 'Neem',
    category: 'AYURVEDA',
    genericName: 'Azadirachta Indica',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Powder', 'Capsule', 'Tablet']),
    commonStrengths: JSON.stringify(['500mg', '250mg']),
    isVerified: true,
  },
  {
    name: 'Shatavari',
    category: 'AYURVEDA',
    genericName: 'Asparagus Racemosus',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Powder', 'Capsule', 'Tablet']),
    commonStrengths: JSON.stringify(['500mg', '250mg']),
    isVerified: true,
  },
  {
    name: 'Amla',
    category: 'AYURVEDA',
    genericName: 'Phyllanthus Emblica',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Powder', 'Capsule', 'Juice']),
    commonStrengths: JSON.stringify(['500mg', '500ml']),
    isVerified: true,
  },
  {
    name: 'Haritaki',
    category: 'AYURVEDA',
    genericName: 'Terminalia Chebula',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Powder', 'Tablet']),
    commonStrengths: JSON.stringify(['500mg', '50g']),
    isVerified: true,
  },
  {
    name: 'Manjistha',
    category: 'AYURVEDA',
    genericName: 'Rubia Cordifolia',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Powder', 'Capsule']),
    commonStrengths: JSON.stringify(['500mg', '250mg']),
    isVerified: true,
  },
  {
    name: 'Shankhpushpi',
    category: 'AYURVEDA',
    genericName: 'Convolvulus Pluricaulis',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Powder', 'Syrup', 'Capsule']),
    commonStrengths: JSON.stringify(['500mg', '200ml']),
    isVerified: true,
  },
  {
    name: 'Guduchi Satva',
    category: 'AYURVEDA',
    genericName: 'Tinospora Extract',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Powder']),
    commonStrengths: JSON.stringify(['50g', '100g']),
    isVerified: true,
  },
  {
    name: 'Trikatu Churna',
    category: 'AYURVEDA',
    genericName: 'Trikatu Powder',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Powder', 'Tablet']),
    commonStrengths: JSON.stringify(['50g', '500mg']),
    isVerified: true,
  },

  // ============ HOMEOPATHY ============
  {
    name: 'Arnica Montana',
    category: 'HOMEOPATHY',
    genericName: 'Arnica Montana',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Dilution', 'Tablet', 'Ointment']),
    commonStrengths: JSON.stringify(['30C', '200C', '1M', 'Q']),
    isVerified: true,
  },
  {
    name: 'Belladonna',
    category: 'HOMEOPATHY',
    genericName: 'Belladonna',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Dilution', 'Tablet']),
    commonStrengths: JSON.stringify(['30C', '200C', '1M']),
    isVerified: true,
  },
  {
    name: 'Bryonia Alba',
    category: 'HOMEOPATHY',
    genericName: 'Bryonia Alba',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Dilution', 'Tablet']),
    commonStrengths: JSON.stringify(['30C', '200C', '1M']),
    isVerified: true,
  },
  {
    name: 'Rhus Tox',
    category: 'HOMEOPATHY',
    genericName: 'Rhus Toxicodendron',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Dilution', 'Tablet', 'Ointment']),
    commonStrengths: JSON.stringify(['30C', '200C', '1M', 'Q']),
    isVerified: true,
  },
  {
    name: 'Nux Vomica',
    category: 'HOMEOPATHY',
    genericName: 'Strychnos Nux-vomica',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Dilution', 'Tablet']),
    commonStrengths: JSON.stringify(['30C', '200C', '1M']),
    isVerified: true,
  },
  {
    name: 'Pulsatilla',
    category: 'HOMEOPATHY',
    genericName: 'Pulsatilla Nigricans',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Dilution', 'Tablet']),
    commonStrengths: JSON.stringify(['30C', '200C', '1M']),
    isVerified: true,
  },
  {
    name: 'Sulphur',
    category: 'HOMEOPATHY',
    genericName: 'Sulphur',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Dilution', 'Tablet']),
    commonStrengths: JSON.stringify(['30C', '200C', '1M']),
    isVerified: true,
  },
  {
    name: 'Calcarea Carbonica',
    category: 'HOMEOPATHY',
    genericName: 'Calcium Carbonate',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Dilution', 'Tablet']),
    commonStrengths: JSON.stringify(['30C', '200C', '1M']),
    isVerified: true,
  },
  {
    name: 'Ignatia',
    category: 'HOMEOPATHY',
    genericName: 'Ignatia Amara',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Dilution', 'Tablet']),
    commonStrengths: JSON.stringify(['30C', '200C', '1M']),
    isVerified: true,
  },
  {
    name: 'Lycopodium',
    category: 'HOMEOPATHY',
    genericName: 'Lycopodium Clavatum',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Dilution', 'Tablet']),
    commonStrengths: JSON.stringify(['30C', '200C', '1M']),
    isVerified: true,
  },
  {
    name: 'Natrum Muriaticum',
    category: 'HOMEOPATHY',
    genericName: 'Sodium Chloride',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Dilution', 'Tablet']),
    commonStrengths: JSON.stringify(['30C', '200C', '1M']),
    isVerified: true,
  },
  {
    name: 'Sepia',
    category: 'HOMEOPATHY',
    genericName: 'Sepia Officinalis',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Dilution', 'Tablet']),
    commonStrengths: JSON.stringify(['30C', '200C', '1M']),
    isVerified: true,
  },
  {
    name: 'Lachesis',
    category: 'HOMEOPATHY',
    genericName: 'Lachesis Mutus',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Dilution', 'Tablet']),
    commonStrengths: JSON.stringify(['30C', '200C', '1M']),
    isVerified: true,
  },
  {
    name: 'Aconite',
    category: 'HOMEOPATHY',
    genericName: 'Aconitum Napellus',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Dilution', 'Tablet']),
    commonStrengths: JSON.stringify(['30C', '200C', '1M']),
    isVerified: true,
  },
  {
    name: 'Arsenicum Album',
    category: 'HOMEOPATHY',
    genericName: 'Arsenicum Album',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Dilution', 'Tablet']),
    commonStrengths: JSON.stringify(['30C', '200C', '1M']),
    isVerified: true,
  },

  // ============ UNANI ============
  {
    name: 'Khamira Marwareed',
    category: 'UNANI',
    genericName: 'Pearl Compound',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Paste', 'Powder']),
    commonStrengths: JSON.stringify(['60g', '125g']),
    isVerified: true,
  },
  {
    name: 'Majun Suranjan',
    category: 'UNANI',
    genericName: 'Colchicum Compound',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Paste']),
    commonStrengths: JSON.stringify(['60g', '125g']),
    isVerified: true,
  },
  {
    name: 'Arq Gulab',
    category: 'UNANI',
    genericName: 'Rose Water',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Liquid']),
    commonStrengths: JSON.stringify(['100ml', '500ml']),
    isVerified: true,
  },
  {
    name: 'Safoof Muhazzil',
    category: 'UNANI',
    genericName: 'Slimming Powder',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Powder']),
    commonStrengths: JSON.stringify(['50g', '100g']),
    isVerified: true,
  },
  {
    name: 'Jawarish Kamuni',
    category: 'UNANI',
    genericName: 'Cumin Compound',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Paste']),
    commonStrengths: JSON.stringify(['60g', '125g']),
    isVerified: true,
  },
  {
    name: 'Habbe Amber Momyai',
    category: 'UNANI',
    genericName: 'Amber Tablet',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Tablet']),
    commonStrengths: JSON.stringify(['10 tablets', '20 tablets']),
    isVerified: true,
  },
  {
    name: 'Sharbat Bazoori',
    category: 'UNANI',
    genericName: 'Diuretic Syrup',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Syrup']),
    commonStrengths: JSON.stringify(['200ml', '500ml']),
    isVerified: true,
  },
  {
    name: 'Roghan Banafsha',
    category: 'UNANI',
    genericName: 'Violet Oil',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Oil']),
    commonStrengths: JSON.stringify(['25ml', '50ml']),
    isVerified: true,
  },
  {
    name: 'Kushta Faulad',
    category: 'UNANI',
    genericName: 'Iron Ash',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Powder']),
    commonStrengths: JSON.stringify(['10g', '25g']),
    isVerified: true,
  },
  {
    name: 'Itrifal Ustukhuddus',
    category: 'UNANI',
    genericName: 'Lavender Compound',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Paste']),
    commonStrengths: JSON.stringify(['60g', '125g']),
    isVerified: true,
  },

  // ============ SIDDHA ============
  {
    name: 'Nilavembu Kudineer',
    category: 'SIDDHA',
    genericName: 'Andrographis Decoction',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Powder', 'Tablet', 'Decoction']),
    commonStrengths: JSON.stringify(['50g', '100g', '500mg']),
    isVerified: true,
  },
  {
    name: 'Kabasura Kudineer',
    category: 'SIDDHA',
    genericName: 'Fever Decoction',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Powder', 'Decoction']),
    commonStrengths: JSON.stringify(['50g', '100g']),
    isVerified: true,
  },
  {
    name: 'Amukkara Chooranam',
    category: 'SIDDHA',
    genericName: 'Ashwagandha Powder',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Powder']),
    commonStrengths: JSON.stringify(['50g', '100g']),
    isVerified: true,
  },
  {
    name: 'Thriph ala Chooranam',
    category: 'SIDDHA',
    genericName: 'Triphala Powder',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Powder']),
    commonStrengths: JSON.stringify(['50g', '100g']),
    isVerified: true,
  },
  {
    name: 'Pavala Parpam',
    category: 'SIDDHA',
    genericName: 'Coral Ash',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Powder']),
    commonStrengths: JSON.stringify(['5g', '10g']),
    isVerified: true,
  },
  {
    name: 'Sanjeevi Kudineer',
    category: 'SIDDHA',
    genericName: 'Life Saving Decoction',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Powder', 'Decoction']),
    commonStrengths: JSON.stringify(['50g', '100g']),
    isVerified: true,
  },
  {
    name: 'Karpooradi Chooranam',
    category: 'SIDDHA',
    genericName: 'Camphor Powder',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Powder']),
    commonStrengths: JSON.stringify(['25g', '50g']),
    isVerified: true,
  },
  {
    name: 'Lavangathi Chooranam',
    category: 'SIDDHA',
    genericName: 'Clove Powder',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Powder']),
    commonStrengths: JSON.stringify(['50g', '100g']),
    isVerified: true,
  },
  {
    name: 'Vilvathi Choornam',
    category: 'SIDDHA',
    genericName: 'Bael Powder',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Powder']),
    commonStrengths: JSON.stringify(['50g', '100g']),
    isVerified: true,
  },
  {
    name: 'Thalisadi Chooranam',
    category: 'SIDDHA',
    genericName: 'Talispatra Powder',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Powder']),
    commonStrengths: JSON.stringify(['50g', '100g']),
    isVerified: true,
  },

  // ============ GENERAL (Multi-category common supplements) ============
  {
    name: 'Multivitamin',
    category: 'GENERAL',
    genericName: 'Multivitamin & Minerals',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Tablet', 'Capsule', 'Syrup']),
    commonStrengths: JSON.stringify(['1 Tablet', '5ml']),
    isVerified: true,
  },
  {
    name: 'Vitamin D3',
    category: 'GENERAL',
    genericName: 'Cholecalciferol',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Tablet', 'Capsule', 'Drops']),
    commonStrengths: JSON.stringify(['1000 IU', '2000 IU', '60000 IU']),
    isVerified: true,
  },
  {
    name: 'Vitamin C',
    category: 'GENERAL',
    genericName: 'Ascorbic Acid',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Tablet', 'Capsule', 'Chewable']),
    commonStrengths: JSON.stringify(['500mg', '1000mg']),
    isVerified: true,
  },
  {
    name: 'Calcium Supplement',
    category: 'GENERAL',
    genericName: 'Calcium Carbonate',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Tablet', 'Chewable']),
    commonStrengths: JSON.stringify(['500mg', '1000mg', '1250mg']),
    isVerified: true,
  },
  {
    name: 'Iron Supplement',
    category: 'GENERAL',
    genericName: 'Ferrous Sulphate',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Tablet', 'Capsule', 'Syrup']),
    commonStrengths: JSON.stringify(['100mg', '200mg', '30mg/5ml']),
    isVerified: true,
  },
  {
    name: 'Folic Acid',
    category: 'GENERAL',
    genericName: 'Folic Acid',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Tablet']),
    commonStrengths: JSON.stringify(['5mg', '1mg']),
    isVerified: true,
  },
  {
    name: 'Omega-3',
    category: 'GENERAL',
    genericName: 'Omega-3 Fatty Acids',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Capsule', 'Soft Gel']),
    commonStrengths: JSON.stringify(['1000mg', '500mg']),
    isVerified: true,
  },
  {
    name: 'Zinc Supplement',
    category: 'GENERAL',
    genericName: 'Zinc Sulphate',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Tablet', 'Syrup']),
    commonStrengths: JSON.stringify(['20mg', '10mg/5ml']),
    isVerified: true,
  },
  {
    name: 'Probiotic',
    category: 'GENERAL',
    genericName: 'Lactobacillus',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Capsule', 'Sachet', 'Powder']),
    commonStrengths: JSON.stringify(['1 Billion CFU', '5 Billion CFU']),
    isVerified: true,
  },
  {
    name: 'Protein Powder',
    category: 'GENERAL',
    genericName: 'Whey Protein',
    manufacturer: 'Multiple',
    dosageForms: JSON.stringify(['Powder']),
    commonStrengths: JSON.stringify(['250g', '500g', '1kg']),
    isVerified: true,
  },
];

async function seedMedicines() {
  console.log('🌱 Starting medicine database seeding...');

  try {
    // Check if medicines already exist
    const existingCount = await prisma.medicine.count();

    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing medicines`);
      console.log('   To reseed, delete existing medicines first or skip this step');
      return;
    }

    // Create all medicines
    console.log(`\n📦 Creating ${medicineData.length} medicines...`);

    let created = 0;
    for (const medicine of medicineData) {
      await prisma.medicine.create({
        data: medicine,
      });
      created++;

      // Progress indicator
      if (created % 10 === 0) {
        console.log(`   Created ${created}/${medicineData.length} medicines...`);
      }
    }

    console.log(`\n✅ Successfully created ${created} medicines!`);

    // Show statistics
    const stats = {
      ALLOPATHY: await prisma.medicine.count({ where: { category: 'ALLOPATHY' } }),
      AYURVEDA: await prisma.medicine.count({ where: { category: 'AYURVEDA' } }),
      HOMEOPATHY: await prisma.medicine.count({ where: { category: 'HOMEOPATHY' } }),
      UNANI: await prisma.medicine.count({ where: { category: 'UNANI' } }),
      SIDDHA: await prisma.medicine.count({ where: { category: 'SIDDHA' } }),
      GENERAL: await prisma.medicine.count({ where: { category: 'GENERAL' } }),
    };

    console.log('\n📊 Medicine Statistics:');
    console.log(`   ALLOPATHY:  ${stats.ALLOPATHY} medicines`);
    console.log(`   AYURVEDA:   ${stats.AYURVEDA} medicines`);
    console.log(`   HOMEOPATHY: ${stats.HOMEOPATHY} medicines`);
    console.log(`   UNANI:      ${stats.UNANI} medicines`);
    console.log(`   SIDDHA:     ${stats.SIDDHA} medicines`);
    console.log(`   GENERAL:    ${stats.GENERAL} medicines`);
    console.log(`   TOTAL:      ${Object.values(stats).reduce((a, b) => a + b, 0)} medicines`);

    const verified = await prisma.medicine.count({ where: { isVerified: true } });
    console.log(`\n✅ All ${verified} medicines are pre-verified!`);
  } catch (error) {
    console.error('❌ Error seeding medicines:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seedMedicines()
  .then(() => {
    console.log('\n🎉 Medicine seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Medicine seeding failed:', error);
    process.exit(1);
  });
