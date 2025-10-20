# Location Service

The Location Service handles all location-related operations for the MeCabal community platform, including states, LGAs, wards, neighborhoods, landmarks, and user locations.

## Features

- **States Management**: CRUD operations for Nigerian states
- **LGAs Management**: Local Government Areas management
- **Wards Management**: Ward-level location management
- **Neighborhoods Management**: Neighborhood and estate management
- **Landmarks Management**: Points of interest and landmarks
- **User Locations**: User location tracking and management
- **Location Search**: Advanced search and filtering
- **Neighborhood Recommendations**: GPS-based neighborhood suggestions
- **Google Maps Integration**: Reverse geocoding and place details

## API Endpoints

### Health & Stats
- `GET /` - Service health status
- `GET /stats` - Service statistics

### States
- `GET /states` - Get all states
- `GET /states/:id` - Get state by ID

### LGAs
- `GET /lgas` - Get all LGAs
- `GET /lgas/:id` - Get LGA by ID
- `GET /lgas/state/:stateId` - Get LGAs by state

### Wards
- `GET /wards` - Get all wards
- `GET /wards/:id` - Get ward by ID
- `GET /wards/lga/:lgaId` - Get wards by LGA

### Neighborhoods
- `GET /neighborhoods` - Get all neighborhoods
- `GET /neighborhoods/:id` - Get neighborhood by ID
- `GET /neighborhoods/ward/:wardId` - Get neighborhoods by ward
- `GET /neighborhoods/lga/:lgaId` - Get neighborhoods by LGA
- `POST /neighborhoods/recommend` - Get neighborhood recommendations
- `GET /neighborhoods/search` - Search neighborhoods

### Landmarks
- `GET /landmarks` - Get all landmarks
- `GET /landmarks/:id` - Get landmark by ID
- `GET /landmarks/neighborhood/:neighborhoodId` - Get landmarks by neighborhood

### User Locations
- `GET /user/locations` - Get user's locations
- `GET /user/locations/primary` - Get user's primary location
- `POST /user/locations` - Create new user location
- `PUT /user/locations/:id` - Update user location
- `DELETE /user/locations/:id` - Delete user location
- `POST /user/locations/:id/set-primary` - Set location as primary

## Database Schema

### States
- `id` (UUID, Primary Key)
- `name` (String)
- `code` (String)
- `country` (String)

### Local Government Areas (LGAs)
- `id` (UUID, Primary Key)
- `name` (String)
- `code` (String)
- `stateId` (UUID, Foreign Key)

### Wards
- `id` (UUID, Primary Key)
- `name` (String)
- `code` (String)
- `lgaId` (UUID, Foreign Key)

### Neighborhoods
- `id` (UUID, Primary Key)
- `name` (String)
- `type` (Enum: AREA, ESTATE, COMMUNITY)
- `lgaId` (UUID, Foreign Key)
- `wardId` (UUID, Foreign Key, Optional)
- `boundaries` (PostGIS Polygon)
- `isGated` (Boolean)
- `requiresVerification` (Boolean)

### User Locations
- `id` (UUID, Primary Key)
- `userId` (UUID, Foreign Key)
- `stateId` (UUID, Foreign Key)
- `lgaId` (UUID, Foreign Key)
- `wardId` (UUID, Foreign Key, Optional)
- `neighborhoodId` (UUID, Foreign Key)
- `cityTown` (String, Optional)
- `address` (Text, Optional)
- `coordinates` (PostGIS Point)
- `isPrimary` (Boolean)
- `verificationStatus` (Enum: UNVERIFIED, PENDING, VERIFIED)

## Configuration

### Environment Variables
- `DATABASE_HOST` - Database host
- `DATABASE_PORT` - Database port
- `DATABASE_USERNAME` - Database username
- `DATABASE_PASSWORD` - Database password
- `DATABASE_NAME` - Database name
- `GOOGLE_MAPS_API_KEY` - Google Maps API key (optional)

### Dependencies
- PostgreSQL with PostGIS extension
- Google Maps API (optional)
- NestJS
- TypeORM

## Error Handling

The service includes comprehensive error handling with:
- Graceful fallbacks for Google Maps API failures
- PostGIS query fallbacks for spatial operations
- User authentication validation
- Input validation and sanitization

## Testing

Run tests with:
```bash
npm run test
npm run test:e2e
```

## Development

Start the service in development mode:
```bash
npm run start:dev
```

## Deployment

The service runs on port 3007 by default and is accessible through the API Gateway at `/location/*`.
