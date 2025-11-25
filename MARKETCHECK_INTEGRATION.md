# MarketCheck API Integration

## Overview
MarketCheck API has been integrated as an additional data source alongside Auto.dev to provide more comprehensive car listings.

## Configuration

Add your MarketCheck API key to your `.env` file:

```bash
MARKETCHECK_API_KEY=your-marketcheck-api-key
```

Get your API key from: https://universe.marketcheck.com/

## How It Works

1. **Primary Source**: Auto.dev API is used first
2. **Fallback/Supplement**: If Auto.dev returns fewer results than requested, MarketCheck API is called
3. **Deduplication**: Results are deduplicated by VIN to avoid showing the same car twice
4. **Data Normalization**: Both API responses are normalized to a consistent format

## API Endpoints Used

- **Endpoint**: `https://api.marketcheck.com/v2/search/car/active`
- **Authentication**: API key passed as query parameter `api_key`
- **Documentation**: https://docs.marketcheck.com/docs/get-started/api

## Features

- **Real-time Inventory**: Access to listings from 44,000+ dealerships
- **Comprehensive Data**: Vehicle specs, pricing, images, dealer info
- **Geographic Coverage**: US, Canada, UK support
- **VIN Decoding**: Built-in VIN support for detailed vehicle information

## Parameters Supported

- `make` (brand)
- `model`
- `year` / `year_max`
- `price_range_min` / `price_range_max`
- `zip` (postal code)
- `latitude` / `longitude` (with radius)
- `car_type` (used/new/certified)
- `rows` (limit)
- `start` (pagination)

## Integration Points

- **File**: `backend/integrations/marketcheck_api.py`
- **Tool**: `backend/agents/tools/search_tools.py` - Uses both APIs
- **Config**: `backend/core/config.py` - Added `MARKETCHECK_API_KEY`

## Error Handling

- API failures are logged but don't break the search
- If MarketCheck fails, Auto.dev results are still returned
- Graceful degradation ensures search always works

## Testing

The integration automatically:
- Falls back gracefully if one API is unavailable
- Deduplicates results by VIN
- Normalizes data from both sources
- Logs all operations for debugging


