export const SAMPLE_DATASETS = [
  {
    id: 'ecommerce_sales',
    name: 'E-Commerce Global Orders',
    description: '1,000 global transactions with revenue, region, categories, and customer ratings',
    filename: 'ecommerce_sales.csv',
    sampleQuery: `SELECT region, category, COUNT(*) as orders, ROUND(SUM(revenue), 2) as total_revenue, ROUND(AVG(rating), 2) as avg_rating
FROM ecommerce_sales
GROUP BY region, category
ORDER BY total_revenue DESC;`,
    generate: () => {
      const regions = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East'];
      const categories = ['Electronics', 'Furniture', 'Apparel', 'Fitness', 'Office Supplies'];
      const paymentMethods = ['Credit Card', 'UPI', 'PayPal', 'Wire Transfer', 'Apple Pay'];
      
      const headers = ['order_id,date,customer_name,region,category,revenue,quantity,payment_method,rating'];
      const rows: string[] = [];

      const firstNames = ['Aarav', 'Sophia', 'Liam', 'Priya', 'Lucas', 'Emma', 'Rohan', 'Mia', 'Mateo', 'Zara'];
      const lastNames = ['Sharma', 'Smith', 'Johnson', 'Patel', 'Garcia', 'Müller', 'Chen', 'Kim', 'Ali', 'Silva'];

      for (let i = 1; i <= 1000; i++) {
        const orderId = `ORD-${10000 + i}`;
        const date = `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`;
        const customer = `${firstNames[i % firstNames.length]} ${lastNames[(i * 3) % lastNames.length]}`;
        const region = regions[Math.floor(Math.random() * regions.length)];
        const category = categories[Math.floor(Math.random() * categories.length)];
        const quantity = Math.floor(Math.random() * 8) + 1;
        const basePrice = (Math.random() * 350 + 20);
        const revenue = (basePrice * quantity).toFixed(2);
        const payment = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        const rating = (Math.random() * 2 + 3).toFixed(1); // 3.0 to 5.0

        rows.push(`${orderId},${date},"${customer}",${region},${category},${revenue},${quantity},${payment},${rating}`);
      }
      return headers.concat(rows).join('\n');
    }
  },
  {
    id: 'world_cities_metrics',
    name: 'Global Tech Hubs & Quality of Life',
    description: 'Metropolitan indicators: tech job density, average tech salary, cost of living index',
    filename: 'world_cities.csv',
    sampleQuery: `SELECT continent, COUNT(*) as hubs, ROUND(AVG(avg_tech_salary), 0) as mean_salary, ROUND(AVG(cost_of_living_index), 1) as avg_col
FROM world_cities
GROUP BY continent
ORDER BY mean_salary DESC;`,
    generate: () => {
      const cities = [
        ['San Francisco', 'North America', 'USA', 165000, 94.2, 88.5, 9.2],
        ['Bengaluru', 'Asia Pacific', 'India', 38000, 31.4, 72.0, 8.8],
        ['London', 'Europe', 'UK', 115000, 82.1, 84.0, 8.5],
        ['Tokyo', 'Asia Pacific', 'Japan', 88000, 71.3, 91.0, 7.9],
        ['Berlin', 'Europe', 'Germany', 92000, 68.5, 86.2, 8.4],
        ['Singapore', 'Asia Pacific', 'Singapore', 122000, 85.0, 90.1, 9.0],
        ['Toronto', 'North America', 'Canada', 108000, 74.8, 83.5, 8.1],
        ['Sydney', 'Asia Pacific', 'Australia', 118000, 79.2, 85.4, 8.3],
        ['Austin', 'North America', 'USA', 142000, 72.1, 81.0, 8.6],
        ['Zurich', 'Europe', 'Switzerland', 158000, 110.5, 93.0, 8.2],
        ['Tel Aviv', 'Middle East', 'Israel', 125000, 86.4, 82.5, 8.7],
        ['Stockholm', 'Europe', 'Sweden', 94000, 73.2, 87.1, 8.5],
        ['São Paulo', 'Latin America', 'Brazil', 34000, 38.6, 68.2, 7.4],
        ['Seoul', 'Asia Pacific', 'South Korea', 82000, 76.1, 89.2, 8.0],
        ['Dublin', 'Europe', 'Ireland', 112000, 80.4, 82.0, 8.6],
        ['Dubai', 'Middle East', 'UAE', 105000, 69.8, 84.5, 8.1],
        ['Amsterdam', 'Europe', 'Netherlands', 104000, 78.5, 88.0, 8.7],
        ['Seattle', 'North America', 'USA', 159000, 86.3, 85.0, 9.1],
      ];

      const header = 'city,continent,country,avg_tech_salary,cost_of_living_index,quality_of_life_score,innovation_rank';
      const rows = cities.map((c) => c.join(','));
      return [header, ...rows].join('\n');
    }
  }
];
