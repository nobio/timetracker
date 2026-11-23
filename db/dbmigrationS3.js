#!/usr/local/bin/node

require("dotenv").config();
const logger = require("../api/config/logger"); // Logger configuration
const Axios = require("axios");
const mongoose = require("mongoose");
const models = require("./models");

// Import commander correctly for v15.1.0
const { program } = require("commander");

// Set version properly
program.version("1.0.0");

const MONGO_URL_ATLAS = "mongodb+srv://timetracker-user:cyfgeq-mypnu9-vozFyv@nobiocluster.12345.mongodb.net/timetracker?retryWrites=true&w=majority";
const MONGO_URL_LOCAL = "mongodb://localhost:27017/timetracker";

async function connectToDatabase(url) {
  try {
    await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info(`Connected to MongoDB at ${url}`);
  } catch (error) {
    logger.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

async function migrate() {
  try {
    // Connect to MongoDB Atlas
    await connectToDatabase(MONGO_URL_ATLAS);
    
    // Get all entries from the database
    const entries = await models.TimeEntry.find({});
    
    // Process entries
    for (const entry of entries) {
      // Perform migration logic here
      // Example: update fields, transform data, etc.
      logger.info(`Processing entry: ${entry._id}`);
    }
    
    logger.info("Migration completed successfully");
    process.exit(0);
  } catch (error) {
    logger.error("Migration failed:", error);
    process.exit(1);
  }
}

// Parse command line arguments
program
  .option("-f, --force", "Force migration")
  .parse(process.argv);

// Run migration if --force flag is provided
if (program.force) {
  migrate();
} else {
  logger.info("Migration requires --force flag to run");
  process.exit(1);
}
