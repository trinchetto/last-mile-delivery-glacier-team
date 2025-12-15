// Comprehensive mock data matching backend structure for DeliveryIQ frontend

// Sample lanes with realistic data patterns
export const lanes = [
    { id: '441xx→750xx', origin_zip: '441xx', dest_zip: '750xx', origin_city: 'Cleveland, OH', dest_city: 'Dallas, TX' },
    { id: '441xx→172xx', origin_zip: '441xx', dest_zip: '172xx', origin_city: 'Cleveland, OH', dest_city: 'Harrisburg, PA' },
    { id: '109c918ef6db', origin_zip: '940xx', dest_zip: '100xx', origin_city: 'San Francisco, CA', dest_city: 'New York, NY' },
    { id: '37b5426f2cfc', origin_zip: '601xx', dest_zip: '900xx', origin_city: 'Chicago, IL', dest_city: 'Los Angeles, CA' },
    { id: '54874e5091dc', origin_zip: '331xx', dest_zip: '021xx', origin_city: 'Miami, FL', dest_city: 'Boston, MA' },
    { id: '19936bf01cc6', origin_zip: '773xx', dest_zip: '981xx', origin_city: 'Houston, TX', dest_city: 'Seattle, WA' },
    { id: 'dbfc03065eae', origin_zip: '852xx', dest_zip: '303xx', origin_city: 'Phoenix, AZ', dest_city: 'Atlanta, GA' },
    { id: 'a1b2c3d4e5f6', origin_zip: '191xx', dest_zip: '802xx', origin_city: 'Philadelphia, PA', dest_city: 'Denver, CO' },
];

// Sample carriers with performance metrics
export const carriers = [
    { id: '19936bf01cc6', name: 'FastFreight Express', mode: 'Truckload', on_time_rate: 0.87, avg_transit: 2.3 },
    { id: '54874e5091dc', name: 'QuickShip Logistics', mode: 'Truckload', on_time_rate: 0.75, avg_transit: 3.1 },
    { id: 'dbfc03065eae', name: 'ReliableHaul Inc', mode: 'LTL', on_time_rate: 0.40, avg_transit: 4.5 },
    { id: 'a1b2c3d4e5f6', name: 'SpeedLine Transport', mode: 'Truckload', on_time_rate: 0.92, avg_transit: 1.8 },
    { id: 'b2c3d4e5f6a7', name: 'ValueMove Freight', mode: 'LTL', on_time_rate: 0.65, avg_transit: 3.8 },
    { id: 'c3d4e5f6a7b8', name: 'PrimeCarrier Co', mode: 'Truckload', on_time_rate: 0.82, avg_transit: 2.5 },
];

// Top 10 problematic lanes data
export const problematicLanes = [
    { lane_id: '37b5426f2cfc', origin: 'Chicago, IL', destination: 'Los Angeles, CA', late_rate: 0.939, shipments: 33, avg_transit: 6.2, goal_transit: 3, avg_delay: 3.2 },
    { lane_id: '441xx→750xx', origin: 'Cleveland, OH', destination: 'Dallas, TX', late_rate: 0.77, shipments: 45, avg_transit: 4.8, goal_transit: 2, avg_delay: 2.8 },
    { lane_id: 'dbfc03065eae', origin: 'Phoenix, AZ', destination: 'Atlanta, GA', late_rate: 0.72, shipments: 28, avg_transit: 5.1, goal_transit: 3, avg_delay: 2.1 },
    { lane_id: '54874e5091dc', origin: 'Miami, FL', destination: 'Boston, MA', late_rate: 0.68, shipments: 52, avg_transit: 4.2, goal_transit: 3, avg_delay: 1.2 },
    { lane_id: 'a1b2c3d4e5f6', origin: 'Philadelphia, PA', destination: 'Denver, CO', late_rate: 0.65, shipments: 38, avg_transit: 4.5, goal_transit: 3, avg_delay: 1.5 },
    { lane_id: '19936bf01cc6', origin: 'Houston, TX', destination: 'Seattle, WA', late_rate: 0.58, shipments: 41, avg_transit: 5.8, goal_transit: 4, avg_delay: 1.8 },
    { lane_id: 'b2c3d4e5f6a7', origin: 'Detroit, MI', destination: 'Phoenix, AZ', late_rate: 0.52, shipments: 29, avg_transit: 4.0, goal_transit: 3, avg_delay: 1.0 },
    { lane_id: 'c3d4e5f6a7b8', origin: 'Minneapolis, MN', destination: 'San Diego, CA', late_rate: 0.48, shipments: 35, avg_transit: 3.8, goal_transit: 3, avg_delay: 0.8 },
    { lane_id: 'd4e5f6a7b8c9', origin: 'Nashville, TN', destination: 'Portland, OR', late_rate: 0.45, shipments: 31, avg_transit: 4.3, goal_transit: 4, avg_delay: 0.3 },
    { lane_id: 'e5f6a7b8c9d0', origin: 'Charlotte, NC', destination: 'Las Vegas, NV', late_rate: 0.42, shipments: 27, avg_transit: 4.1, goal_transit: 3, avg_delay: 1.1 },
];

// Carrier comparison for a specific lane
export const carrierComparison = [
    { carrier_id: 'a1b2c3d4e5f6', carrier_name: 'SpeedLine Transport', shipments: 28, late_rate: 0.22, avg_transit: 1.8, reliability_rank: 1, recommended: true },
    { carrier_id: '19936bf01cc6', carrier_name: 'FastFreight Express', shipments: 45, late_rate: 0.35, avg_transit: 2.3, reliability_rank: 2, recommended: false },
    { carrier_id: 'c3d4e5f6a7b8', carrier_name: 'PrimeCarrier Co', shipments: 32, late_rate: 0.42, avg_transit: 2.5, reliability_rank: 3, recommended: false },
    { carrier_id: '54874e5091dc', carrier_name: 'QuickShip Logistics', shipments: 51, late_rate: 0.58, avg_transit: 3.1, reliability_rank: 4, recommended: false },
    { carrier_id: 'dbfc03065eae', carrier_name: 'ReliableHaul Inc', shipments: 19, late_rate: 0.78, avg_transit: 4.5, reliability_rank: 5, recommended: false },
];

// Transit time probability distribution
export const transitProbability = [
    { days: 1, probability: 0.12, cumulative: 0.12 },
    { days: 2, probability: 0.23, cumulative: 0.35 },
    { days: 3, probability: 0.31, cumulative: 0.66 },
    { days: 4, probability: 0.18, cumulative: 0.84 },
    { days: 5, probability: 0.09, cumulative: 0.93 },
    { days: 6, probability: 0.04, cumulative: 0.97 },
    { days: 7, probability: 0.03, cumulative: 1.0 },
];

// Similar historical shipments
export const similarShipments = [
    { id: 'SHP-001', ship_date: '2024-12-01', delivery_date: '2024-12-04', carrier: 'FastFreight Express', transit_days: 3, goal_days: 2, status: 'Late', delay_days: 1 },
    { id: 'SHP-002', ship_date: '2024-11-28', delivery_date: '2024-11-30', carrier: 'SpeedLine Transport', transit_days: 2, goal_days: 2, status: 'On Time', delay_days: 0 },
    { id: 'SHP-003', ship_date: '2024-11-25', delivery_date: '2024-11-28', carrier: 'FastFreight Express', transit_days: 3, goal_days: 2, status: 'Late', delay_days: 1 },
    { id: 'SHP-004', ship_date: '2024-11-22', delivery_date: '2024-11-24', carrier: 'SpeedLine Transport', transit_days: 2, goal_days: 2, status: 'On Time', delay_days: 0 },
    { id: 'SHP-005', ship_date: '2024-11-19', delivery_date: '2024-11-23', carrier: 'QuickShip Logistics', transit_days: 4, goal_days: 2, status: 'Late', delay_days: 2 },
    { id: 'SHP-006', ship_date: '2024-11-16', delivery_date: '2024-11-18', carrier: 'SpeedLine Transport', transit_days: 2, goal_days: 2, status: 'On Time', delay_days: 0 },
    { id: 'SHP-007', ship_date: '2024-11-13', delivery_date: '2024-11-17', carrier: 'ReliableHaul Inc', transit_days: 4, goal_days: 2, status: 'Late', delay_days: 2 },
    { id: 'SHP-008', ship_date: '2024-11-10', delivery_date: '2024-11-12', carrier: 'FastFreight Express', transit_days: 2, goal_days: 2, status: 'On Time', delay_days: 0 },
];

// Generate risk analysis result
export const generateRiskAnalysis = (lane, carrier, shipDate) => {
    // Find lane data
    const laneData = problematicLanes.find(l => l.lane_id === lane) || {
        lane_id: lane,
        origin: 'Unknown',
        destination: 'Unknown',
        late_rate: 0.19,
        shipments: 50,
        avg_transit: 3,
        goal_transit: 2,
        avg_delay: 1
    };

    // Find carrier data
    const carrierData = carriers.find(c => c.id === carrier) || carriers[0];

    // Calculate ensemble risk score
    const laneRisk = laneData.late_rate;
    const carrierRisk = 1 - carrierData.on_time_rate;
    const mlRisk = (laneRisk + carrierRisk) / 2 * (0.8 + Math.random() * 0.4); // Simulated ML prediction
    
    const riskScore = 0.4 * mlRisk + 0.3 * laneRisk + 0.3 * carrierRisk;
    const clampedScore = Math.min(0.99, Math.max(0.01, riskScore));

    // Determine risk level
    let riskLevel, riskColor;
    if (clampedScore < 0.3) {
        riskLevel = 'LOW';
        riskColor = 'green';
    } else if (clampedScore < 0.7) {
        riskLevel = 'MEDIUM';
        riskColor = 'yellow';
    } else {
        riskLevel = 'HIGH';
        riskColor = 'red';
    }

    // Calculate delivery window
    const p25 = Math.max(1, Math.floor(laneData.avg_transit - 1));
    const p50 = Math.round(laneData.avg_transit);
    const p75 = Math.ceil(laneData.avg_transit + 1);
    const p90 = Math.ceil(laneData.avg_transit + 2);

    let windowMin, windowMax, windowType;
    if (riskLevel === 'LOW') {
        windowMin = p50;
        windowMax = p50 + 1;
        windowType = 'tight';
    } else if (riskLevel === 'MEDIUM') {
        windowMin = p25;
        windowMax = p75;
        windowType = 'moderate';
    } else {
        windowMin = p50;
        windowMax = p90;
        windowType = 'wide';
    }

    // SLA comparison
    const slaGoal = laneData.goal_transit;
    let slaAlignment, slaMessage;
    if (slaGoal >= windowMax) {
        slaAlignment = 'ALIGNED';
        slaMessage = 'SLA is achievable based on historical performance';
    } else if (slaGoal >= p50) {
        slaAlignment = 'TIGHT';
        slaMessage = 'SLA is tight but achievable in most cases';
    } else {
        slaAlignment = 'MISALIGNED';
        slaMessage = 'SLA is aggressive - high risk of missing target';
    }

    // Generate insights
    const insights = [];
    if (laneRisk > 0.5) {
        insights.push({ type: 'warning', message: `High-risk lane: ${(laneRisk * 100).toFixed(0)}% historical late rate. Consider SLA review.` });
    }
    if (carrierRisk > 0.3) {
        insights.push({ type: 'alert', message: `Carrier has ${((1-carrierData.on_time_rate) * 100).toFixed(0)}% late rate on similar routes.` });
    }
    if (slaAlignment === 'MISALIGNED') {
        insights.push({ type: 'warning', message: `SLA mismatch: Goal is ${slaGoal} days but average transit is ${laneData.avg_transit.toFixed(1)} days.` });
    }
    if (insights.length === 0) {
        insights.push({ type: 'info', message: 'This lane/carrier combination has reliable historical performance.' });
    }

    // Calculate delivery dates
    const shipDateObj = new Date(shipDate || Date.now());
    const earliestDelivery = new Date(shipDateObj);
    earliestDelivery.setDate(earliestDelivery.getDate() + windowMin);
    const latestDelivery = new Date(shipDateObj);
    latestDelivery.setDate(latestDelivery.getDate() + windowMax);

    return {
        risk_score: clampedScore,
        risk_level: riskLevel,
        risk_color: riskColor,
        components: {
            ml_model_score: mlRisk,
            lane_late_rate: laneRisk,
            carrier_late_rate: carrierRisk,
        },
        confidence: {
            score: Math.min(0.95, laneData.shipments / 100),
            level: laneData.shipments >= 50 ? 'HIGH' : laneData.shipments >= 20 ? 'MEDIUM' : 'LOW',
            shipment_count: laneData.shipments,
        },
        recommended_window: {
            min_days: windowMin,
            max_days: windowMax,
            expected_days: laneData.avg_transit,
            window_type: windowType,
            description: `${windowMin}-${windowMax} days${riskLevel === 'HIGH' ? ' (⚠️ High variability)' : ''}`,
        },
        delivery_dates: {
            ship_date: shipDateObj.toISOString().split('T')[0],
            earliest: earliestDelivery.toISOString().split('T')[0],
            latest: latestDelivery.toISOString().split('T')[0],
        },
        sla_comparison: {
            current_sla: slaGoal,
            alignment: slaAlignment,
            message: slaMessage,
            expected_transit: laneData.avg_transit,
            diff_from_goal: laneData.avg_transit - slaGoal,
        },
        percentiles: {
            p25: p25,
            p50: p50,
            p75: p75,
            p90: p90,
        },
        insights: insights,
        lane_info: {
            id: laneData.lane_id,
            origin: laneData.origin,
            destination: laneData.destination,
        },
        carrier_info: {
            id: carrierData.id,
            name: carrierData.name,
            mode: carrierData.mode,
        },
    };
};

// Historical performance data
export const historicalPerformance = [
    { month: 'Jul', on_time: 82, shipments: 420 },
    { month: 'Aug', on_time: 78, shipments: 395 },
    { month: 'Sep', on_time: 85, shipments: 450 },
    { month: 'Oct', on_time: 81, shipments: 480 },
    { month: 'Nov', on_time: 76, shipments: 510 },
    { month: 'Dec', on_time: 72, shipments: 550 },
];

// Default mock lane data for initial display
export const mockLaneData = {
    lane_id: '109c918ef6db',
    origin: 'San Francisco, CA',
    destination: 'New York, NY',
    carrier: 'FastFreight Express',
    distance: 2900,
    risk_score: 0.78,
    risk_level: 'HIGH',
    recommended_window: {
        start: '2023-11-01',
        end: '2023-11-03',
        days: 5
    },
    insights: [
        { type: 'warning', message: 'High-risk lane: 78% historical late rate. Consider SLA review.' },
        { type: 'alert', message: 'Carrier has elevated late rate on this route.' },
        { type: 'info', message: 'SLA mismatch detected: Goal 2 days vs actual 4.5 days average.' }
    ],
    history: historicalPerformance
};

// Summary statistics
export const summaryStats = {
    total_shipments: 73000,
    overall_late_rate: 0.192,
    total_lanes: 970,
    total_carriers: 117,
    avg_transit_days: 2.8,
    high_risk_lanes: 45,
};
