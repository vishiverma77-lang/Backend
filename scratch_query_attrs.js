import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Attribute from './models/Attribute.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected!");
  const attrs = await Attribute.find({});
  console.log("Attributes in DB:");
  attrs.forEach(a => {
    console.log(`- ${a.name}: ${a.values.length} values`);
    console.log(`  Values: ${JSON.stringify(a.values)}`);
  });
  await mongoose.disconnect();
}
run().catch(console.error);
