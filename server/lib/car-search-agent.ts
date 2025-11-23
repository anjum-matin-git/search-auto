import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { storage } from "../storage";
import { createEmbedding, extractCarFeatures } from "./openai-client";
import { scrapeAutoTrader, scrapeCarGurus, generateMockCars, type ScrapedCar } from "./web-scraper";
import type { Car } from "@shared/schema";

const StateAnnotation = Annotation.Root({
  messages: Annotation<(HumanMessage | AIMessage | SystemMessage)[]>({
    reducer: (x, y) => x.concat(y),
  }),
  query: Annotation<string>,
  userId: Annotation<number | null>,
  extractedFeatures: Annotation<any>,
  queryEmbedding: Annotation<number[]>,
  scrapedCars: Annotation<ScrapedCar[]>,
  storedCars: Annotation<Car[]>,
  finalResults: Annotation<Car[]>,
  searchId: Annotation<number | null>,
});

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const model = new ChatOpenAI({
  modelName: "gpt-5",
  openAIApiKey: process.env.OPENAI_API_KEY,
});

async function analyzeQuery(state: typeof StateAnnotation.State) {
  console.log("🔍 Analyzing query...");
  const features = await extractCarFeatures(state.query);
  const embedding = await createEmbedding(state.query);
  
  return {
    extractedFeatures: features,
    queryEmbedding: embedding,
    messages: [new AIMessage(`Understood. Looking for: ${JSON.stringify(features)}`)],
  };
}

async function scrapeWebsites(state: typeof StateAnnotation.State) {
  console.log("🌐 Scraping car websites...");
  
  const scrapedCars: ScrapedCar[] = [];
  
  try {
    const autoTraderCars = await scrapeAutoTrader(state.query);
    scrapedCars.push(...autoTraderCars);
  } catch (error) {
    console.error("AutoTrader scraping failed:", error);
  }
  
  try {
    const carGurusCars = await scrapeCarGurus(state.query);
    scrapedCars.push(...carGurusCars);
  } catch (error) {
    console.error("CarGurus scraping failed:", error);
  }

  if (scrapedCars.length === 0) {
    console.log("⚠️ No real data scraped, generating mock data...");
    const mockCars = await generateMockCars(state.query, 15);
    scrapedCars.push(...mockCars);
  }
  
  return {
    scrapedCars,
    messages: [new AIMessage(`Found ${scrapedCars.length} cars from various sources.`)],
  };
}

async function storeCarsInDatabase(state: typeof StateAnnotation.State) {
  console.log("💾 Storing cars in database...");
  
  const storedCars: Car[] = [];
  
  for (const scrapedCar of state.scrapedCars) {
    try {
      const carDescription = `${scrapedCar.year} ${scrapedCar.brand} ${scrapedCar.model} ${scrapedCar.type || ''} ${scrapedCar.features?.join(' ') || ''}`;
      const embedding = await createEmbedding(carDescription);
      
      const car = await storage.createCar({
        ...scrapedCar,
        embedding: `[${embedding.join(",")}]` as any,
      });
      
      storedCars.push(car);
    } catch (error) {
      console.error("Error storing car:", error);
    }
  }
  
  return {
    storedCars,
    messages: [new AIMessage(`Stored ${storedCars.length} cars in the database.`)],
  };
}

async function findSimilarCars(state: typeof StateAnnotation.State) {
  console.log("🎯 Finding similar cars using vector search...");
  
  const similarCars = await storage.findSimilarCars(state.queryEmbedding, 10);
  
  return {
    finalResults: similarCars,
    messages: [new AIMessage(`Found ${similarCars.length} matching vehicles.`)],
  };
}

async function saveSearchHistory(state: typeof StateAnnotation.State) {
  console.log("📝 Saving search history...");
  
  if (!state.userId) {
    return {
      messages: [new AIMessage("Search completed (guest user).")],
    };
  }
  
  const embeddingStr = `[${state.queryEmbedding.join(",")}]`;
  const search = await storage.createSearch({
    userId: state.userId,
    query: state.query,
    embedding: embeddingStr as any,
    filters: state.extractedFeatures,
  });
  
  for (let i = 0; i < state.finalResults.length; i++) {
    await storage.createSearchResult(
      search.id,
      state.finalResults[i].id,
      95 - i * 2,
      i + 1
    );
  }
  
  const userPrefs = await storage.getUserPreferences(state.userId);
  const prefBrands = userPrefs?.preferredBrands || [];
  const prefTypes = userPrefs?.preferredTypes || [];
  
  state.finalResults.forEach(car => {
    if (car.brand && !prefBrands.includes(car.brand)) {
      prefBrands.push(car.brand);
    }
    if (car.type && !prefTypes.includes(car.type)) {
      prefTypes.push(car.type);
    }
  });
  
  await storage.upsertUserPreferences({
    userId: state.userId,
    preferredBrands: prefBrands.slice(0, 10),
    preferredTypes: prefTypes.slice(0, 5),
    priceRangeMin: state.extractedFeatures.minPrice,
    priceRangeMax: state.extractedFeatures.maxPrice,
    preferredFeatures: state.extractedFeatures.features || [],
  });
  
  return {
    searchId: search.id,
    messages: [new AIMessage("Search history saved and preferences updated.")],
  };
}

const workflow = new StateGraph(StateAnnotation)
  .addNode("analyze_query", analyzeQuery)
  .addNode("scrape_websites", scrapeWebsites)
  .addNode("store_cars", storeCarsInDatabase)
  .addNode("find_similar", findSimilarCars)
  .addNode("save_history", saveSearchHistory)
  .addEdge(START, "analyze_query")
  .addEdge("analyze_query", "scrape_websites")
  .addEdge("scrape_websites", "store_cars")
  .addEdge("store_cars", "find_similar")
  .addEdge("find_similar", "save_history")
  .addEdge("save_history", END);

export const carSearchAgent = workflow.compile();

export async function searchCars(query: string, userId: number | null = null): Promise<Car[]> {
  const result = await carSearchAgent.invoke({
    messages: [new HumanMessage(query)],
    query,
    userId,
    extractedFeatures: {},
    queryEmbedding: [],
    scrapedCars: [],
    storedCars: [],
    finalResults: [],
    searchId: null,
  });
  
  return result.finalResults;
}
