const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper to format rule readable text
function formatRuleText(actionType, value) {
  const val = parseFloat(value) || 0;
  switch (actionType) {
    case 'percentage_increase':
      return `Current +${val}%`;
    case 'percentage_decrease':
      return `Current -${val}%`;
    case 'fixed_increase':
      return `Current +₹${val}`;
    case 'fixed_price':
      return `Fixed ₹${val}`;
    case 'reset':
      return `Base Price`;
    default:
      return `Base Price`;
  }
}

// Calculate price based on rule
function calculateEffectivePrice(basePrice, actionType, value) {
  const price = parseFloat(basePrice) || 0;
  const val = parseFloat(value) || 0;

  switch (actionType) {                 
    case 'percentage_increase':
      return Math.round(price * (1 + val / 100));
    case 'percentage_decrease':
      return Math.max(0, Math.round(price * (1 - val / 100)));
    case 'fixed_increase':
      return Math.round(price + val);
    case 'fixed_price':
      return Math.round(val);
    case 'reset':
    default:
      return price;
  }
}

// -------------------------------------------------------------
// GET /api/pricing/stats
// Returns summary statistics & list of active states
// -------------------------------------------------------------

router.get('/stats', async (req, res) => {
  try {
    // Run all 5 queries concurrently in parallel
    const [
      [statesCount],
      [citiesCount],
      [servicesCount],
      [activeRulesCount],
      [statesList]
    ] = await Promise.all([
      db.query("SELECT COUNT(*) as count FROM states WHERE status = 1"),
      db.query("SELECT COUNT(*) as count FROM cities WHERE status = 1"),
      db.query("SELECT COUNT(*) as count FROM services WHERE status = 1"),
      db.query("SELECT COUNT(*) as count FROM city_pricing_rules WHERE action_type != 'reset' AND status = 1"),
      db.query("SELECT DISTINCT name FROM states WHERE status = 1 ORDER BY name ASC")
    ]);

    res.json({
      success: true,
      stats: {
        total_states: statesCount[0]?.count || 0,
        total_cities: citiesCount[0]?.count || 0,
        total_services: servicesCount[0]?.count || 0,
        active_rules: activeRulesCount[0]?.count || 0
      },
      states: statesList.map(s => s.name)
    });
  } catch (err) {
    console.error('Error fetching pricing stats:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// GET /api/pricing/cities
// Query: ?state=Rajasthan or ?state_id=29
// Returns cities in state with their current pricing rule
// -------------------------------------------------------------
router.get('/cities', async (req, res) => {
  try {
    const stateName = req.query.state || req.query.state_name;
    const stateId = req.query.state_id;

    let whereClause = "WHERE 1=1";
    let params = [];

    if (stateName) {
      whereClause += " AND stateName = ?";
      params.push(stateName);
    } else if (stateId) {
      // Find state name by ID first or join
      const [st] = await db.query("SELECT name FROM states WHERE id = ?", [stateId]);
      if (st.length > 0) {
        whereClause += " AND stateName = ?";
        params.push(st[0].name);
      }
    }

    const [cities] = await db.query(`SELECT id, cityName, stateName, status FROM cities ${whereClause} ORDER BY cityName ASC`, params);

    // Fetch all pricing rules for these cities
    const [rules] = await db.query("SELECT * FROM city_pricing_rules WHERE status = 1");
    const ruleMap = new Map();
    rules.forEach(r => {
      const key = `${r.city_name}_${r.state_name}`.toLowerCase();
      ruleMap.set(key, r);
    });

    const enrichedCities = cities.map(city => {

      const key = `${city.cityName}_${city.stateName}`.toLowerCase();
      const existingRule = ruleMap.get(key);

      return {
        id: city.id,
        cityName: city.cityName,
        stateName: city.stateName,
        status: city.status,
        pricing_rule: existingRule ? {
          id: existingRule.id,
          action_type: existingRule.action_type,
          value: parseFloat(existingRule.value),
          formatted_rule: formatRuleText(existingRule.action_type, existingRule.value),
          updated_at: existingRule.updated_at
        } : null
      };
    });

    res.json({
      success: true,
      state: stateName || 'All',
      total: enrichedCities.length,
      cities: enrichedCities
    });
  } catch (err) {
    console.error('Error fetching cities with pricing rules:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// POST /api/pricing/save-rules
// Bulk save or update pricing rules for selected cities
// -------------------------------------------------------------
router.post('/save-rules', async (req, res) => {
  try {
    const { state_name, city_ids, cities, action_type, value } = req.body;

    if (!action_type) {
      return res.status(400).json({ success: false, error: 'action_type is required' });
    }

    const val = parseFloat(value) || 0;
    let targetCities = [];

    // Parse target cities list
    if (Array.isArray(cities) && cities.length > 0) {
      targetCities = cities;
    } else if (Array.isArray(city_ids) && city_ids.length > 0) {
      // Fetch city details from DB
      const [dbCities] = await db.query("SELECT id, cityName, stateName FROM cities WHERE id IN (?)", [city_ids]);
      targetCities = dbCities;
    } else if (state_name) {
      // All cities in state if no specific city selected
      const [dbCities] = await db.query("SELECT id, cityName, stateName FROM cities WHERE stateName = ?", [state_name]);
      targetCities = dbCities;
    }

    if (targetCities.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid target cities selected' });
    }

    // Replaced the sequential loop with concurrent execution using Promise.all
    const promises = targetCities.map(async (city) => {
      const cName = city.cityName || city.city_name;
      const sName = city.stateName || city.state_name || state_name;
      const cId = city.id || city.city_id || null;
      const sId = city.state_id || null;

      if (!cName || !sName) return;

      if (action_type === 'reset') {
        // Delete or set action_type='reset'
        await db.query(
          "DELETE FROM city_pricing_rules WHERE LOWER(city_name) = LOWER(?) AND LOWER(state_name) = LOWER(?)",
          [cName, sName]
        );
      } else {
        // Upsert rule into city_pricing_rules
        await db.query(`
          INSERT INTO city_pricing_rules (state_id, state_name, city_id, city_name, action_type, value, status)
          VALUES (?, ?, ?, ?, ?, ?, 1)
          ON DUPLICATE KEY UPDATE
            action_type = VALUES(action_type),
            value = VALUES(value),
            status = 1,
            updated_at = CURRENT_TIMESTAMP
        `, [sId, sName, cId, cName, action_type, val]);
      }
    });

    // Wait for all database operations to finish simultaneously
    await Promise.all(promises);
    const updatedCount = targetCities.length;


    // let updatedCount = 0;

    // for (const city of targetCities) {
    //   const cName = city.cityName || city.city_name;
    //   const sName = city.stateName || city.state_name || state_name;
    //   const cId = city.id || city.city_id || null;
    //   const sId = city.state_id || null;
 
    //   if (!cName || !sName) continue;

    //   if (action_type === 'reset') {
    //     // Delete or set action_type='reset'
    //     await db.query(
    //       "DELETE FROM city_pricing_rules WHERE LOWER(city_name) = LOWER(?) AND LOWER(state_name) = LOWER(?)",
    //       [cName, sName]
    //     );
    //   } else {
    //     // Upsert rule into city_pricing_rules
    //     await db.query(`
    //       INSERT INTO city_pricing_rules (state_id, state_name, city_id, city_name, action_type, value, status)
    //       VALUES (?, ?, ?, ?, ?, ?, 1)
    //       ON DUPLICATE KEY UPDATE
    //         action_type = VALUES(action_type),
    //         value = VALUES(value),
    //         status = 1,
    //         updated_at = CURRENT_TIMESTAMP
    //     `, [sId, sName, cId, cName, action_type, val]);
    //   }
    //   updatedCount++;
    // }


    res.json({
      success: true,
      message: `Successfully updated pricing rule for ${updatedCount} cities.`,
      updated_count: updatedCount,
      rule: {
        action_type,
        value: val,
        formatted_rule: formatRuleText(action_type, val)
      }
    });
  } catch (err) {
    console.error('Error saving pricing rules:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Alias route: POST /api/pricing/rules
router.post('/rules', async (req, res) => {
  // Forward to /save-rules handler logic
  req.url = '/save-rules';
  router.handle(req, res);
});

// -------------------------------------------------------------
// GET /api/pricing/rules
// Fetch all active pricing rules
// -------------------------------------------------------------

router.get('/rules', async (req, res) => {
  try {
    const [rules] = await db.query("SELECT * FROM city_pricing_rules WHERE status = 1 ORDER BY state_name ASC, city_name ASC");
    
    const formattedRules = rules.map(r => ({
      id: r.id,
      state_id: r.state_id,
      state_name: r.state_name,
      city_id: r.city_id,
      city_name: r.city_name,
      action_type: r.action_type,
      value: parseFloat(r.value),
      formatted_rule: formatRuleText(r.action_type, r.value),
      created_at: r.created_at,
      updated_at: r.updated_at
    }));

    res.json({
      success: true,
      count: formattedRules.length,
      rules: formattedRules
    });
  } catch (err) {
    console.error('Error fetching pricing rules:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// GET /api/pricing/preview
// Query parameters: ?price=600&action_type=percentage_increase&value=10
// Returns dynamic calculation preview for review step
// -------------------------------------------------------------
router.get('/preview', async (req, res) => {
  try {
    const basePrice = parseFloat(req.query.price) || 600;
    const serviceName = req.query.service_name || 'Sofa Cleaning';
    const actionType = req.query.action_type || 'percentage_increase';
    const value = parseFloat(req.query.value) || 0;

    const newPrice = calculateEffectivePrice(basePrice, actionType, value);
    const diff = newPrice - basePrice;
    const diffFormatted = diff > 0 ? `+₹${diff}` : diff < 0 ? `-₹${Math.abs(diff)}` : `₹0`;

    res.json({
      success: true,
      service_name: serviceName,
      base_price: basePrice,
      action_type: actionType,
      value: value,
      formatted_rule: formatRuleText(actionType, value),
      calculated_price: newPrice,
      difference: diffFormatted,
      preview_text: `${serviceName} Base ₹${basePrice} -> ₹${newPrice}`
    });
  } catch (err) {
    console.error('Error generating preview:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// GET /api/pricing/service-price
// Query parameters: ?service_id=123&city=Jaipur&state=Rajasthan
// Calculates city-specific service price for customer apps
// -------------------------------------------------------------
router.get('/service-price', async (req, res) => {
  try {
    const { service_id, city, state } = req.query;

    if (!service_id) {
      return res.status(400).json({ success: false, error: 'service_id parameter is required' });
    }

    const [services] = await db.query("SELECT * FROM services WHERE id = ?", [service_id]);
    if (services.length === 0) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    const service = services[0];
    const basePrice = parseFloat(service.price) || 0;

    let effectivePrice = basePrice;
    let appliedRule = null;

    if (city) {
      let query = "SELECT * FROM city_pricing_rules WHERE LOWER(city_name) = LOWER(?) AND status = 1";
      let params = [city];
      if (state) {
        query += " AND LOWER(state_name) = LOWER(?)";
        params.push(state);
      }

      const [rules] = await db.query(query, params);
      if (rules.length > 0) {
        const r = rules[0];
        effectivePrice = calculateEffectivePrice(basePrice, r.action_type, r.value);
        appliedRule = {
          city_name: r.city_name,
          state_name: r.state_name,
          action_type: r.action_type,
          value: parseFloat(r.value),
          formatted_rule: formatRuleText(r.action_type, r.value)
        };
      }
    }

    res.json({
      success: true,
      service_id: service.id,
      title: service.title,
      base_price: basePrice,
      effective_price: effectivePrice,
      has_city_pricing: !!appliedRule,
      applied_rule: appliedRule
    });
  } catch (err) {
    console.error('Error calculating city service price:', err);
    res.status(500).json({ success: false, error: err.message });
  } 
});

module.exports = router;
