/**
 * Initial Analytics & Intelligence Computation Runner
 * Multi-Channel Customer Behaviour & Marketing Intelligence System
 *
 * Runs deterministic initial calculations for:
 * 1. RFM Segmentation & Scoring
 * 2. Multi-Touch Attribution Modeling
 * 3. Explainable Marketing Recommendations
 */

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const rfmService = require('../../backend/src/services/rfm.service');
const attributionService = require('../../backend/src/services/attribution.service');
const recommendationService = require('../../backend/src/services/recommendation.service');
const { pool } = require('../../backend/src/config/database');

async function initAnalytics() {
  console.log('Starting Initial Analytics & Intelligence Computation...');

  try {
    // 1. Recalculate RFM Scores
    console.log('\n--- 1. Computing RFM Quintiles & Segments ---');
    const rfmRes = await rfmService.recalculate();
    console.log(`RFM completed: ${rfmRes.updatedCount} customers scored.`);

    // 2. Recalculate Marketing Attribution
    console.log('\n--- 2. Computing First-Touch, Last-Touch & Multi-Touch Attribution ---');
    const attrRes = await attributionService.recalculate({ lookbackDays: 60 });
    console.log(`Attribution completed: ${attrRes.totalAttributedTouchpoints} touchpoints allocated.`);

    // 3. Generate Initial Explainable Recommendations
    console.log('\n--- 3. Generating Explainable Recommendations ---');
    const recRes = await recommendationService.generateRecommendations();
    console.log(`Recommendations completed: ${recRes.generatedCount} decision support actions generated.`);

    console.log('\nAll Initial Analytics Computations Completed Successfully!');
  } catch (error) {
    console.error('Initial analytics computation failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initAnalytics();
