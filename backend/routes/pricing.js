const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper to format rule readable text
function formatRuleText(actionType, value, categoryNames, serviceNames) {
  const val = parseFloat(value) || 0;
  let ruleText = '';
  switch (actionType) {
    case 'percentage_increase':
      ruleText = `Current +${val}%`;
      break;
    case 'percentage_decrease':
      ruleText = `Current -${val}%`;
      break;
    case 'fixed_increase':
      ruleText = `Current +₹${val}`;
      break;
    case 'fixed_price':
      ruleText = `Fixed ₹${val}`;
      break;
    case 'reset':
      ruleText = `Base Price`;
      break;
    default:
      ruleText = `Base Price`;
      break;
  }

  const catText = categoryNames ? ` (${categoryNames})` : '';
  const servText = serviceNames ? ` [${serviceNames}]` : '';
  return `${ruleText}${catText}${servText}`;
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

// In-memory cache for pricing endpoints (TTL 30 seconds)
const pricingCache = new Map();
const PRICING_CACHE_TTL = 30000;

function getCachedData(key) {
  const cached = pricingCache.get(key);
  if (cached && (Date.now() - cached.timestamp < PRICING_CACHE_TTL)) {
    return cached.data;
  }
  return null;
}

function setCachedData(key, data) {
  pricingCache.set(key, { data, timestamp: Date.now() });
}

function clearPricingCache() {
  pricingCache.clear();
}

// -------------------------------------------------------------
// GET /api/pricing/stats
// Returns summary statistics & list of active states
// -------------------------------------------------------------
router.get('/stats', async (req, res) => {
  try {
    const cacheKey = 'pricing_stats';
    const cached = getCachedData(cacheKey);
    if (cached) return res.json(cached);

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

    const result = {
      success: true,
      stats: {
        total_states: statesCount[0]?.count || 0,
        total_cities: citiesCount[0]?.count || 0,
        total_services: servicesCount[0]?.count || 0,
        active_rules: activeRulesCount[0]?.count || 0
      },
      states: statesList.map(s => s.name)
    };

    setCachedData(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('Error fetching pricing stats:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// GET /api/pricing/categories
// Returns list of active categories for step 3 selection grid (supports page & limit)
// -------------------------------------------------------------
router.get('/categories', async (req, res) => {
  try {
    const pageNum = parseInt(req.query.page || '1') || 1;
    const limitNum = parseInt(req.query.limit || '0') || 0;
    const cacheKey = `pricing_categories_${pageNum}_${limitNum}`;

    const cached = getCachedData(cacheKey);
    if (cached) return res.json(cached);

    const [rows] = await db.query(
      "SELECT id, title, title as name FROM categories WHERE status = 1 ORDER BY title ASC"
    );

    const categories = rows.map(r => ({
      id: r.id,
      title: r.title,
      name: r.title
    }));

    let paginatedCategories = categories;
    let totalPages = 1;

    if (limitNum > 0) {
      const startIndex = (pageNum - 1) * limitNum;
      paginatedCategories = categories.slice(startIndex, startIndex + limitNum);
      totalPages = Math.ceil(categories.length / limitNum) || 1;
    }

    const response = {
      success: true,
      total: categories.length,
      page: pageNum,
      limit: limitNum > 0 ? limitNum : categories.length,
      totalPages: totalPages,
      categories: paginatedCategories,
      data: paginatedCategories
    };

    setCachedData(cacheKey, response);
    res.json(response);
  } catch (err) {
    console.error('Error fetching categories for pricing:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// GET /api/pricing/services
// Query params: ?category_ids=1,5,7 or ?categories=Cleaning,Electrician or ?category_name=Cleaning
// Supports pagination (?page=1&limit=20)
// -------------------------------------------------------------
router.get('/services', async (req, res) => {
  try {
    const { category_ids, category_id, categories, category_name, category_names, category, cat } = req.query;
    const pageNum = parseInt(req.query.page || '1') || 1;
    const limitNum = parseInt(req.query.limit || '0') || 0;

    const catParam = category_ids || category_id;
    const catNameParam = categories || category_name || category_names || category || cat;

    const cacheKey = `pricing_services_${catParam || ''}_${catNameParam || ''}_${pageNum}_${limitNum}`;
    const cached = getCachedData(cacheKey);
    if (cached) return res.json(cached);

    let targetCatIds = [];

    if (catParam) {
      targetCatIds = catParam.toString().split(',').map(i => parseInt(i.trim())).filter(i => !isNaN(i));
    }

    if (catNameParam && targetCatIds.length === 0) {
      const names = catNameParam.toString().split(',').map(n => n.trim()).filter(n => n);
      if (names.length > 0) {
        const [cats] = await db.query("SELECT id FROM categories WHERE title IN (?) OR name_hi IN (?)", [names, names]);
        targetCatIds = cats.map(c => c.id);
      }
    }

    let whereClause = "WHERE s.status = 1";
    let params = [];

    if (targetCatIds.length > 0) {
      whereClause += " AND s.category_id IN (?)";
      params.push(targetCatIds);
    }

    const [rows] = await db.query(
      `SELECT s.id, s.title, s.price, s.category_id, c.title as category_name
       FROM services s
       LEFT JOIN categories c ON s.category_id = c.id
       ${whereClause}
       ORDER BY c.title ASC, s.title ASC`,
      params
    );

    const services = rows.map(r => ({
      id: r.id,
      title: r.title,
      name: r.title,
      price: parseFloat(r.price) || 0,
      category_id: r.category_id,
      category_name: r.category_name || 'General'
    }));

    let paginatedServices = services;
    let totalPages = 1;

    if (limitNum > 0) {
      const startIndex = (pageNum - 1) * limitNum;
      paginatedServices = services.slice(startIndex, startIndex + limitNum);
      totalPages = Math.ceil(services.length / limitNum) || 1;
    }

    const response = {
      success: true,
      filter_applied: targetCatIds.length > 0,
      target_category_ids: targetCatIds,
      total: services.length,
      page: pageNum,
      limit: limitNum > 0 ? limitNum : services.length,
      totalPages: totalPages,
      services: paginatedServices,
      data: paginatedServices
    };

    setCachedData(cacheKey, response);
    res.json(response);
  } catch (err) {
    console.error('Error fetching services for pricing:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// GET /api/pricing/cities
// Query: ?state=Rajasthan or ?state_id=29 (supports page & limit)
// -------------------------------------------------------------
router.get('/cities', async (req, res) => {
  try {
    const stateName = req.query.state || req.query.state_name;
    const stateId = req.query.state_id;
    const pageNum = parseInt(req.query.page || '1') || 1;
    const limitNum = parseInt(req.query.limit || '0') || 0;

    const cacheKey = `pricing_cities_${stateName || ''}_${stateId || ''}_${pageNum}_${limitNum}`;
    const cached = getCachedData(cacheKey);
    if (cached) return res.json(cached);

    let whereClause = "WHERE 1=1";
    let params = [];

    if (stateName) {
      whereClause += " AND stateName = ?";
      params.push(stateName);
    } else if (stateId) {
      const [st] = await db.query("SELECT name FROM states WHERE id = ?", [stateId]);
      if (st.length > 0) {
        whereClause += " AND stateName = ?";
        params.push(st[0].name);
      }
    }

    const [cities] = await db.query(`SELECT id, cityName, stateName, status FROM cities ${whereClause} ORDER BY cityName ASC`, params);
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
          category_ids: existingRule.category_ids,
          category_names: existingRule.category_names,
          service_ids: existingRule.service_ids,
          service_names: existingRule.service_names,
          action_type: existingRule.action_type,
          value: parseFloat(existingRule.value),
          formatted_rule: formatRuleText(existingRule.action_type, existingRule.value, existingRule.category_names, existingRule.service_names),
          updated_at: existingRule.updated_at
        } : null
      };
    });

    let paginatedCities = enrichedCities;
    let totalPages = 1;

    if (limitNum > 0) {
      const startIndex = (pageNum - 1) * limitNum;
      paginatedCities = enrichedCities.slice(startIndex, startIndex + limitNum);
      totalPages = Math.ceil(enrichedCities.length / limitNum) || 1;
    }

    const response = {
      success: true,
      state: stateName || 'All',
      total: enrichedCities.length,
      page: pageNum,
      limit: limitNum > 0 ? limitNum : enrichedCities.length,
      totalPages: totalPages,
      cities: paginatedCities,
      data: paginatedCities
    };

    setCachedData(cacheKey, response);
    res.json(response);
  } catch (err) {
    console.error('Error fetching cities with pricing rules:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// POST /api/pricing/save-rules (or POST /api/pricing/rules)
// Bulk save or update pricing rules with category & service filters
// -------------------------------------------------------------
router.post('/save-rules', async (req, res) => {
  try {
    const {
      state_name,
      city_ids,
      cities,
      category_ids,
      category_names,
      service_ids,
      service_names,
      action_type,
      value
    } = req.body;

    if (!action_type) {
      return res.status(400).json({ success: false, error: 'action_type is required' });
    }

    const val = parseFloat(value) || 0;
    let targetCities = [];

    if (Array.isArray(cities) && cities.length > 0) {
      targetCities = cities;
    } else if (Array.isArray(city_ids) && city_ids.length > 0) {
      const [dbCities] = await db.query("SELECT id, cityName, stateName FROM cities WHERE id IN (?)", [city_ids]);
      targetCities = dbCities;
    } else if (state_name) {
      const [dbCities] = await db.query("SELECT id, cityName, stateName FROM cities WHERE stateName = ?", [state_name]);
      targetCities = dbCities;
    }

    if (targetCities.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid target cities selected' });
    }

    // Format category_ids and category_names strings/JSON
    const catIdsStr = Array.isArray(category_ids) ? category_ids.join(',') : (category_ids || null);
    const catNamesStr = Array.isArray(category_names) ? category_names.join(', ') : (category_names || null);
    const servIdsStr = Array.isArray(service_ids) ? service_ids.join(',') : (service_ids || null);
    const servNamesStr = Array.isArray(service_names) ? service_names.join(', ') : (service_names || null);

    let updatedCount = 0;

    for (const city of targetCities) {
      const cName = city.cityName || city.city_name;
      const sName = city.stateName || city.state_name || state_name;
      const cId = city.id || city.city_id || null;
      const sId = city.state_id || null;

      if (!cName || !sName) continue;

      if (action_type === 'reset') {
        await db.query(
          "DELETE FROM city_pricing_rules WHERE LOWER(city_name) = LOWER(?) AND LOWER(state_name) = LOWER(?)",
          [cName, sName]
        );
      } else {
        await db.query(`
          INSERT INTO city_pricing_rules (
            state_id, state_name, city_id, city_name,
            category_ids, category_names, service_ids, service_names,
            action_type, value, status
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
          ON DUPLICATE KEY UPDATE
            category_ids = VALUES(category_ids),
            category_names = VALUES(category_names),
            service_ids = VALUES(service_ids),
            service_names = VALUES(service_names),
            action_type = VALUES(action_type),
            value = VALUES(value),
            status = 1,
            updated_at = CURRENT_TIMESTAMP
        `, [sId, sName, cId, cName, catIdsStr, catNamesStr, servIdsStr, servNamesStr, action_type, val]);
      }
      updatedCount++;
    }

    res.json({
      success: true,
      message: `Successfully updated pricing rule for ${updatedCount} cities.`,
      updated_count: updatedCount,
      rule: {
        category_ids: catIdsStr,
        category_names: catNamesStr,
        service_ids: servIdsStr,
        service_names: servNamesStr,
        action_type,
        value: val,
        formatted_rule: formatRuleText(action_type, val, catNamesStr, servNamesStr)
      }
    });
  } catch (err) {
    console.error('Error saving pricing rules:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Alias route: POST /api/pricing/rules
router.post('/rules', async (req, res) => {
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
      category_ids: r.category_ids,
      category_names: r.category_names,
      service_ids: r.service_ids,
      service_names: r.service_names,
      action_type: r.action_type,
      value: parseFloat(r.value),
      formatted_rule: formatRuleText(r.action_type, r.value, r.category_names, r.service_names),
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
    const serviceName = req.query.service_name || 'Bathroom Cleaning';
    const categoryName = req.query.category_name || 'Cleaning';
    const actionType = req.query.action_type || 'percentage_increase';
    const value = parseFloat(req.query.value) || 0;

    const newPrice = calculateEffectivePrice(basePrice, actionType, value);
    const diff = newPrice - basePrice;
    const diffFormatted = diff > 0 ? `+₹${diff}` : diff < 0 ? `-₹${Math.abs(diff)}` : `₹0`;

    res.json({
      success: true,
      category_name: categoryName,
      service_name: serviceName,
      base_price: basePrice,
      action_type: actionType,
      value: value,
      formatted_rule: formatRuleText(actionType, value, categoryName, serviceName),
      calculated_price: newPrice,
      difference: diffFormatted,
      preview_text: `${serviceName} (${categoryName}) Base ₹${basePrice} -> ₹${newPrice}`
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
      
      // Filter rules matching service's category_id and service_id
      const matchingRule = rules.find(r => {
        if (!r.category_ids && !r.service_ids) return true; // Applies to all services
        
        const catMatch = !r.category_ids || r.category_ids.split(',').map(s => s.trim()).includes(service.category_id?.toString());
        const servMatch = !r.service_ids || r.service_ids.split(',').map(s => s.trim()).includes(service.id?.toString());
        
        return catMatch && servMatch;
      });

      if (matchingRule) {
        effectivePrice = calculateEffectivePrice(basePrice, matchingRule.action_type, matchingRule.value);
        appliedRule = {
          city_name: matchingRule.city_name,
          state_name: matchingRule.state_name,
          category_names: matchingRule.category_names,
          service_names: matchingRule.service_names,
          action_type: matchingRule.action_type,
          value: parseFloat(matchingRule.value),
          formatted_rule: formatRuleText(matchingRule.action_type, matchingRule.value, matchingRule.category_names, matchingRule.service_names)
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
