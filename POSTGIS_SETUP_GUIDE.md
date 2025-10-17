# PostGIS Setup Guide for MeCabal

## Overview

PostGIS is a spatial database extension for PostgreSQL that enables storage and querying of geographic data. MeCabal uses PostGIS for:
- Storing neighborhood boundaries (polygons)
- Storing landmark locations (points)
- Storing user coordinates (points)
- Performing geospatial queries (distance calculations, boundary checks, etc.)

---

## Current Setup Status

✅ **PostGIS Docker Image Configured**: Your `docker-compose.yml` already uses `postgis/postgis:15-3.3`

✅ **Initialization Script Created**: `backend/scripts/init-db.sql` enables PostGIS extensions automatically

---

## Step-by-Step Setup Instructions

### 1. Start Docker Services

From the `backend/` directory, run:

```bash
cd backend
docker-compose up -d
```

This will:
- Start PostgreSQL with PostGIS extension
- Automatically run `init-db.sql` on first startup
- Enable PostGIS, pg_trgm, and uuid-ossp extensions

### 2. Verify PostGIS Installation

**Option A: Using Docker Exec**
```bash
docker exec -it MeCabal-postgres psql -U MeCabal_user -d MeCabal_dev -c "SELECT PostGIS_Version();"
```

**Expected Output:**
```
             postgis_version
------------------------------------------
 3.3 USE_GEOS=1 USE_PROJ=1 USE_STATS=1
(1 row)
```

**Option B: Check Installed Extensions**
```bash
docker exec -it MeCabal-postgres psql -U MeCabal_user -d MeCabal_dev -c "SELECT * FROM pg_extension;"
```

**Expected Extensions:**
- `postgis`
- `postgis_topology`
- `pg_trgm`
- `uuid-ossp`
- `btree_gist`

### 3. Test PostGIS Functionality

**Create a test point:**
```bash
docker exec -it MeCabal-postgres psql -U MeCabal_user -d MeCabal_dev -c "SELECT ST_AsText(ST_GeomFromText('POINT(3.3792 6.5244)', 4326));"
```

**Expected Output:**
```
    st_astext
------------------
 POINT(3.3792 6.5244)
(1 row)
```

**Calculate distance between two points (in meters):**
```bash
docker exec -it MeCabal-postgres psql -U MeCabal_user -d MeCabal_dev -c "SELECT ST_Distance(ST_GeogFromText('POINT(3.3792 6.5244)'), ST_GeogFromText('POINT(3.3800 6.5250)'));"
```

**Expected Output:** A distance in meters (should be around 900-1000 meters)

---

## TypeORM Configuration for PostGIS

### 1. Install TypeORM PostGIS Support

In your backend directory:

```bash
cd backend
npm install typeorm @types/geojson
```

### 2. Update TypeORM Data Source Configuration

**Location:** `backend/libs/database/src/database.config.ts` or wherever your TypeORM config is

Ensure your configuration includes:

```typescript
import { DataSource, DataSourceOptions } from 'typeorm';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USER || 'MeCabal_user',
  database: process.env.DATABASE_NAME || 'MeCabal_dev',
  password: process.env.DATABASE_PASSWORD || 'MeCabal_password',

  // Enable PostGIS support
  extra: {
    // This ensures PostGIS types are properly handled
    application_name: 'MeCabal',
  },

  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/migrations/*{.ts,.js}'],
  synchronize: false, // Use migrations in production
  logging: process.env.NODE_ENV === 'development',
};

export default new DataSource(dataSourceOptions);
```

### 3. Using PostGIS Types in TypeORM Entities

**Example: Neighborhood Entity with Boundary Polygon**

```typescript
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { Point, Polygon } from 'geojson';

@Entity('neighborhoods')
export class Neighborhood {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  // Store as PostGIS geometry (polygon)
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326, // WGS84 coordinate system
    nullable: true,
  })
  boundaries: Polygon;

  // Alternative: Store as geography for better distance calculations
  // @Column({
  //   type: 'geography',
  //   spatialFeatureType: 'Polygon',
  //   srid: 4326,
  //   nullable: true,
  // })
  // boundaries: Polygon;
}
```

**Example: Landmark Entity with Point Location**

```typescript
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { Point } from 'geojson';

@Entity('landmarks')
export class Landmark {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  // Store as PostGIS point
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location: Point;
}
```

**Example: User Location Entity**

```typescript
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { Point } from 'geojson';

@Entity('user_locations')
export class UserLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  neighborhoodId: string;

  // Store exact coordinates
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  coordinates: Point;

  @Column({ default: true })
  isPrimary: boolean;
}
```

---

## PostGIS Query Examples

### 1. Find Neighborhoods Within Radius

```typescript
// In your repository or service
async findNeighborhoodsNearPoint(
  latitude: number,
  longitude: number,
  radiusMeters: number = 2000
): Promise<Neighborhood[]> {
  return this.neighborhoodRepository
    .createQueryBuilder('neighborhood')
    .where(
      `ST_DWithin(
        neighborhood.boundaries::geography,
        ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
        :radius
      )`,
      { lat: latitude, lng: longitude, radius: radiusMeters }
    )
    .getMany();
}
```

### 2. Check if Point is Inside Neighborhood Boundary

```typescript
async isPointInNeighborhood(
  neighborhoodId: string,
  latitude: number,
  longitude: number
): Promise<boolean> {
  const result = await this.neighborhoodRepository
    .createQueryBuilder('neighborhood')
    .where('neighborhood.id = :neighborhoodId', { neighborhoodId })
    .andWhere(
      `ST_Contains(
        neighborhood.boundaries,
        ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)
      )`,
      { lat: latitude, lng: longitude }
    )
    .getOne();

  return !!result;
}
```

### 3. Calculate Distance Between User and Landmark

```typescript
async getDistanceToLandmark(
  userLocation: Point,
  landmarkId: string
): Promise<number> {
  const result = await this.landmarkRepository
    .createQueryBuilder('landmark')
    .select(
      `ST_Distance(
        landmark.location::geography,
        ST_SetSRID(ST_GeomFromGeoJSON(:userLocation), 4326)::geography
      ) as distance`
    )
    .where('landmark.id = :landmarkId', { landmarkId })
    .setParameter('userLocation', JSON.stringify(userLocation))
    .getRawOne();

  return result?.distance || 0;
}
```

### 4. Find Closest Neighborhoods to User

```typescript
async findClosestNeighborhoods(
  latitude: number,
  longitude: number,
  limit: number = 10
): Promise<Array<{ neighborhood: Neighborhood; distance: number }>> {
  const results = await this.neighborhoodRepository
    .createQueryBuilder('neighborhood')
    .select('neighborhood')
    .addSelect(
      `ST_Distance(
        ST_Centroid(neighborhood.boundaries)::geography,
        ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
      )`,
      'distance'
    )
    .where('neighborhood.boundaries IS NOT NULL')
    .orderBy('distance', 'ASC')
    .limit(limit)
    .setParameter('lat', latitude)
    .setParameter('lng', longitude)
    .getRawAndEntities();

  return results.entities.map((neighborhood, index) => ({
    neighborhood,
    distance: results.raw[index].distance,
  }));
}
```

---

## Creating Migrations with PostGIS

### Example Migration: Create Neighborhoods Table

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNeighborhoodsTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create neighborhoods table
    await queryRunner.query(`
      CREATE TABLE neighborhoods (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        ward_id UUID,
        parent_neighborhood_id UUID,
        is_gated BOOLEAN DEFAULT FALSE,
        requires_verification BOOLEAN DEFAULT FALSE,
        admin_user_id UUID,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),

        -- PostGIS geometry column for boundaries (polygon)
        boundaries GEOMETRY(Polygon, 4326),

        CONSTRAINT fk_ward FOREIGN KEY (ward_id) REFERENCES wards(id),
        CONSTRAINT fk_parent_neighborhood FOREIGN KEY (parent_neighborhood_id)
          REFERENCES neighborhoods(id) ON DELETE SET NULL
      );
    `);

    // Create spatial index on boundaries
    await queryRunner.query(`
      CREATE INDEX idx_neighborhoods_boundaries_gist
      ON neighborhoods USING GIST(boundaries);
    `);

    // Create full-text search index on name
    await queryRunner.query(`
      CREATE INDEX idx_neighborhoods_name_fulltext
      ON neighborhoods USING gin(to_tsvector('english', name));
    `);

    // Create regular indexes
    await queryRunner.query(`
      CREATE INDEX idx_neighborhoods_ward_id ON neighborhoods(ward_id);
      CREATE INDEX idx_neighborhoods_type ON neighborhoods(type);
      CREATE INDEX idx_neighborhoods_is_gated ON neighborhoods(is_gated);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS neighborhoods CASCADE;`);
  }
}
```

### Example Migration: Create Landmarks Table

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLandmarksTable1234567891 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE landmarks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        neighborhood_id UUID NOT NULL,
        address TEXT,
        description TEXT,
        created_by UUID,
        verification_status VARCHAR(20) DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),

        -- PostGIS point for exact location
        location GEOMETRY(Point, 4326) NOT NULL,

        CONSTRAINT fk_neighborhood FOREIGN KEY (neighborhood_id)
          REFERENCES neighborhoods(id) ON DELETE CASCADE
      );
    `);

    // Create spatial index on location
    await queryRunner.query(`
      CREATE INDEX idx_landmarks_location_gist
      ON landmarks USING GIST(location);
    `);

    // Create regular indexes
    await queryRunner.query(`
      CREATE INDEX idx_landmarks_neighborhood_id ON landmarks(neighborhood_id);
      CREATE INDEX idx_landmarks_type ON landmarks(type);
      CREATE INDEX idx_landmarks_verification_status ON landmarks(verification_status);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS landmarks CASCADE;`);
  }
}
```

---

## Troubleshooting

### Issue 1: PostGIS Extension Not Found

**Error:** `ERROR: could not open extension control file`

**Solution:**
```bash
# Restart the PostgreSQL container
docker-compose down
docker-compose up -d postgres

# Verify PostGIS image
docker exec -it MeCabal-postgres psql --version
```

### Issue 2: Permission Denied on Geometry Columns

**Error:** `ERROR: permission denied for table spatial_ref_sys`

**Solution:**
```bash
docker exec -it MeCabal-postgres psql -U postgres -d MeCabal_dev -c "GRANT ALL ON TABLE spatial_ref_sys TO MeCabal_user;"
```

### Issue 3: TypeORM Can't Find PostGIS Types

**Error:** `DataTypeNotSupportedError: Data type "geometry" in "Neighborhood.boundaries" is not supported`

**Solution:**
- Ensure `@types/geojson` is installed
- Use `geometry` or `geography` as the column type (not `geojson`)
- Ensure SRID is specified (usually 4326)

### Issue 4: Reset Database and Reinitialize

If you need to completely reset the database:

```bash
# Stop and remove containers and volumes
docker-compose down -v

# Start fresh (init-db.sql will run again)
docker-compose up -d

# Verify PostGIS
docker exec -it MeCabal-postgres psql -U MeCabal_user -d MeCabal_dev -c "SELECT PostGIS_Version();"
```

---

## Useful PostGIS Functions

| Function | Description | Example |
|----------|-------------|---------|
| `ST_MakePoint(lng, lat)` | Create a point | `ST_MakePoint(3.3792, 6.5244)` |
| `ST_Distance(geog1, geog2)` | Distance in meters | `ST_Distance(point1, point2)` |
| `ST_DWithin(geog1, geog2, radius)` | Within radius check | `ST_DWithin(point, polygon, 2000)` |
| `ST_Contains(geom1, geom2)` | Geometry contains another | `ST_Contains(polygon, point)` |
| `ST_Intersects(geom1, geom2)` | Geometries intersect | `ST_Intersects(poly1, poly2)` |
| `ST_Area(geog)` | Area in square meters | `ST_Area(polygon)` |
| `ST_Centroid(geom)` | Center point of geometry | `ST_Centroid(polygon)` |
| `ST_Buffer(geog, radius)` | Create buffer zone | `ST_Buffer(point, 500)` |

---

## Coordinate Systems (SRID)

**SRID 4326 (WGS84)**:
- Most common for GPS coordinates
- Latitude/Longitude format
- Use for storing user locations, neighborhoods in Nigeria
- Coordinates: Longitude (-180 to 180), Latitude (-90 to 90)

**Nigeria Bounds:**
- Latitude: 4.0°N to 14.0°N
- Longitude: 2.5°E to 15.0°E

**Lagos Coordinates (approx):**
- Latitude: 6.45° to 6.70°
- Longitude: 3.10° to 3.60°

---

## Performance Tips

1. **Always create spatial indexes (GIST)** on geometry/geography columns
2. **Use `geography` type** for distance calculations (more accurate)
3. **Use `geometry` type** for boundary checks and intersections (faster)
4. **Index foreign keys** for faster joins
5. **Limit query results** to avoid scanning large datasets
6. **Use `ST_DWithin`** instead of `ST_Distance` when checking radius (more efficient)

---

## Next Steps

1. ✅ Start Docker services: `docker-compose up -d`
2. ✅ Verify PostGIS installation (see Step 2 above)
3. ✅ Create location entities with geometry/geography columns
4. ✅ Generate migrations with spatial indexes
5. ✅ Implement geospatial queries in your services
6. ✅ Test with sample data

---

## Resources

- [PostGIS Documentation](https://postgis.net/documentation/)
- [PostGIS Functions Reference](https://postgis.net/docs/reference.html)
- [TypeORM Spatial Features](https://typeorm.io/)
- [GeoJSON Specification](https://geojson.org/)

---

**Document Version:** 1.0
**Last Updated:** October 17, 2025
