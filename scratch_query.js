import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected!");
  const products = await Product.find({}, 'name colorOptions images');
  console.log("Found products:", products.length);
  products.forEach(p => {
    console.log(`Product: ${p.name}`);
    console.log(`Images: ${JSON.stringify(p.images)}`);
    console.log(`ColorOptions count: ${p.colorOptions ? p.colorOptions.length : 0}`);
    if (p.colorOptions) {
      p.colorOptions.forEach((opt, i) => {
        console.log(`  Option ${i}: Name: ${opt.name}, Colors: ${opt.colors}, Images: ${JSON.stringify(opt.images)}`);
      });
    }
  });
  await mongoose.disconnect();
}
run().catch(console.error);
