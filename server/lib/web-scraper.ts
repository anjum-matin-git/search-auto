import axios from "axios";
import * as cheerio from "cheerio";
import type { InsertCar } from "@shared/schema";

export interface ScrapedCar {
  sourceUrl: string;
  source: string;
  brand: string;
  model: string;
  year: number;
  price: string;
  priceNumeric?: number;
  mileage?: string;
  mileageNumeric?: number;
  location?: string;
  dealership?: string;
  type?: string;
  fuelType?: string;
  transmission?: string;
  exteriorColor?: string;
  interiorColor?: string;
  specs?: {
    acceleration?: string;
    topSpeed?: string;
    power?: string;
    engineSize?: string;
    mpg?: string;
  };
  features?: string[];
  description?: string;
  images?: string[];
}

function extractNumericPrice(priceStr: string): number | undefined {
  const cleaned = priceStr.replace(/[^0-9]/g, "");
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? undefined : num;
}

function extractNumericMileage(mileageStr: string): number | undefined {
  const cleaned = mileageStr.replace(/[^0-9]/g, "");
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? undefined : num;
}

export async function scrapeAutoTrader(searchQuery: string): Promise<ScrapedCar[]> {
  try {
    const searchUrl = `https://www.autotrader.com/cars-for-sale/all-cars?searchRadius=100&zip=10001&marketExtension=include&isNewSearch=true&showAccelerateBanner=false&sortBy=relevance&numRecords=25`;
    
    const { data } = await axios.get(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(data);
    const cars: ScrapedCar[] = [];

    $('[data-cmp="inventoryListing"]').each((i, element) => {
      try {
        const $el = $(element);
        
        const title = $el.find('[data-cmp="subheading"]').text().trim();
        const priceText = $el.find('[data-cmp="pricing"]').first().text().trim();
        const mileageText = $el.find('[data-cmp="mileage"]').text().trim();
        const locationText = $el.find('[data-cmp="location"]').text().trim();
        const dealershipText = $el.find('[data-cmp="dealerName"]').text().trim();
        const imageUrl = $el.find('img').first().attr('src');
        const linkUrl = $el.find('a').first().attr('href');

        const titleParts = title.split(' ');
        const year = parseInt(titleParts[0], 10);
        const brand = titleParts[1] || "Unknown";
        const model = titleParts.slice(2).join(' ') || "Unknown";

        if (!title || !priceText) return;

        const car: ScrapedCar = {
          sourceUrl: linkUrl ? `https://www.autotrader.com${linkUrl}` : searchUrl,
          source: "AutoTrader",
          brand,
          model,
          year: isNaN(year) ? 2023 : year,
          price: priceText,
          priceNumeric: extractNumericPrice(priceText),
          mileage: mileageText || undefined,
          mileageNumeric: mileageText ? extractNumericMileage(mileageText) : undefined,
          location: locationText || undefined,
          dealership: dealershipText || undefined,
          images: imageUrl ? [imageUrl] : [],
        };

        cars.push(car);
      } catch (err) {
        console.error("Error parsing car listing:", err);
      }
    });

    return cars;
  } catch (error) {
    console.error("Error scraping AutoTrader:", error);
    return [];
  }
}

export async function scrapeCarGurus(searchQuery: string): Promise<ScrapedCar[]> {
  try {
    const searchUrl = `https://www.cargurus.com/Cars/inventorylisting/viewDetailsFilterViewInventoryListing.action?zip=10001&showNegotiable=true&sortDir=ASC&sourceContext=cargurusHomePageModel&distance=50000&sortType=DEAL_SCORE`;
    
    const { data } = await axios.get(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(data);
    const cars: ScrapedCar[] = [];

    $('.listing-row').each((i, element) => {
      try {
        const $el = $(element);
        
        const title = $el.find('.car-blade__title').text().trim();
        const priceText = $el.find('.price-section').text().trim();
        const mileageText = $el.find('.mileage-section').text().trim();
        const dealershipText = $el.find('.dealer-name').text().trim();
        const imageUrl = $el.find('img').first().attr('src');

        const titleParts = title.split(' ');
        const year = parseInt(titleParts[0], 10);
        const brand = titleParts[1] || "Unknown";
        const model = titleParts.slice(2).join(' ') || "Unknown";

        if (!title || !priceText) return;

        const car: ScrapedCar = {
          sourceUrl: searchUrl,
          source: "CarGurus",
          brand,
          model,
          year: isNaN(year) ? 2023 : year,
          price: priceText,
          priceNumeric: extractNumericPrice(priceText),
          mileage: mileageText || undefined,
          mileageNumeric: mileageText ? extractNumericMileage(mileageText) : undefined,
          dealership: dealershipText || undefined,
          images: imageUrl ? [imageUrl] : [],
        };

        cars.push(car);
      } catch (err) {
        console.error("Error parsing CarGurus listing:", err);
      }
    });

    return cars;
  } catch (error) {
    console.error("Error scraping CarGurus:", error);
    return [];
  }
}

export async function generateMockCars(query: string, count: number = 10): Promise<ScrapedCar[]> {
  const brands = ["Tesla", "BMW", "Mercedes", "Audi", "Porsche", "Lexus", "Acura", "Volvo", "Genesis"];
  const types = ["Sedan", "SUV", "Sports", "Coupe", "Electric"];
  const fuelTypes = ["Electric", "Gas", "Hybrid"];
  
  const cars: ScrapedCar[] = [];
  
  for (let i = 0; i < count; i++) {
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const year = 2020 + Math.floor(Math.random() * 5);
    const price = 30000 + Math.floor(Math.random() * 150000);
    const mileage = Math.floor(Math.random() * 50000);
    
    cars.push({
      sourceUrl: `https://example.com/car-${i}`,
      source: "Mock Data",
      brand,
      model: `Model ${String.fromCharCode(65 + i)}`,
      year,
      price: `$${price.toLocaleString()}`,
      priceNumeric: price,
      mileage: `${mileage.toLocaleString()} mi`,
      mileageNumeric: mileage,
      location: "New York, NY",
      dealership: `${brand} Dealership`,
      type,
      fuelType: type === "Electric" ? "Electric" : fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
      transmission: "Automatic",
      specs: {
        acceleration: `${(2 + Math.random() * 4).toFixed(1)}s`,
        topSpeed: `${120 + Math.floor(Math.random() * 80)} mph`,
        power: `${300 + Math.floor(Math.random() * 500)} hp`,
      },
      features: ["Leather", "Sunroof", "Navigation", "Backup Camera"],
      images: [
        "https://images.unsplash.com/photo-1555215695-3004980adade?w=800",
        "https://images.unsplash.com/photo-1503376763036-066120622c74?w=800",
      ],
    });
  }
  
  return cars;
}
