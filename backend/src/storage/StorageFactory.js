/**
 * StorageFactory — Strategy selector for voucher persistence.
 * 
 * Returns the correct storage implementation based on
 * the USE_DASH_PLATFORM environment flag.
 * 
 * Pattern: Strategy (GoF) / Factory Method
 */
const dashClient = require('../config/dashClient');
const LocalStorage = require('./LocalStorage');
const DashPlatformStorage = require('./DashPlatformStorage');

let instance = null;

function getStorage() {
  if (instance) return instance;

  if (dashClient.USE_DASH_PLATFORM) {
    console.log('[StorageFactory] Strategy: DashPlatformStorage (with local fallback)');
    instance = new DashPlatformStorage();
  } else {
    console.log('[StorageFactory] Strategy: LocalStorage (in-memory)');
    instance = new LocalStorage();
  }

  return instance;
}

module.exports = { getStorage };
