import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Nigerian location verification and geocoding service
interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
}

interface NeighborhoodMatch {
  id: string;
  name: string;
  type: string;
  distance_meters: number;
  state_name: string;
  lga_name: string;
  landmarks: any;
  confidence_score: number;
}

interface GeocodeResult {
  place_name: string;
  center: [number, number];
  place_type: string[];
  properties: {
    category?: string;
    landmark?: boolean;
    address?: string;
  };
  context: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // Verify user location within neighborhood boundaries
    if (req.method === 'POST' && path === '/verify-location') {
      return await verifyUserLocation(req, supabase);
    }
    
    // Reverse geocode coordinates to Nigerian address
    if (req.method === 'POST' && path === '/reverse-geocode') {
      return await reverseGeocode(req, supabase);
    }
    
    // Find neighborhoods near a point
    if (req.method === 'POST' && path === '/find-neighborhoods') {
      return await findNearbyNeighborhoods(req, supabase);
    }

    // Get neighborhood details
    if (req.method === 'GET' && path === '/neighborhood-details') {
      return await getNeighborhoodDetails(req, supabase);
    }

    // Validate Nigerian address format
    if (req.method === 'POST' && path === '/validate-address') {
      return await validateNigerianAddress(req, supabase);
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Location service error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function verifyUserLocation(req: Request, supabase: any) {
  const { user_id, latitude, longitude, address, verification_method = 'gps' } = await req.json();

  if (!user_id || !latitude || !longitude) {
    return new Response(
      JSON.stringify({ error: 'user_id, latitude, and longitude are required' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  // Validate Nigerian coordinates bounds
  if (!isWithinNigeriaBounds(latitude, longitude)) {
    return new Response(
      JSON.stringify({ 
        error: 'Location is outside Nigeria',
        verified: false
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  // Find matching neighborhoods using PostGIS
  const { data: matchingNeighborhoods, error } = await supabase.rpc('find_neighborhoods_by_point', {
    lat: latitude,
    lng: longitude
  });

  if (error) {
    console.error('Database error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to find neighborhoods' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  let verificationResult = {
    verified: false,
    neighborhood: null,
    address: null,
    confidence_score: 0,
    verification_method
  };

  if (matchingNeighborhoods && matchingNeighborhoods.length > 0) {
    const bestMatch = matchingNeighborhoods[0];
    
    // Calculate confidence score based on distance and neighborhood verification status
    const distanceScore = Math.max(0, 1 - (bestMatch.distance_meters / 2000)); // Max 2km range
    const verificationScore = bestMatch.is_verified ? 0.3 : 0.1;
    const confidenceScore = (distanceScore * 0.7) + verificationScore;

    // Get detailed address using reverse geocoding
    let detailedAddress = address;
    if (!detailedAddress) {
      const geocodeResult = await performReverseGeocode(latitude, longitude);
      detailedAddress = geocodeResult?.place_name || `${bestMatch.name}, Nigeria`;
    }

    // Update user location and neighborhood association
    const { error: updateError } = await supabase
      .from('user_neighborhoods')
      .upsert({
        user_id,
        neighborhood_id: bestMatch.id,
        relationship_type: 'resident',
        verification_method,
        verification_data: {
          coordinates: { latitude, longitude },
          address: detailedAddress,
          confidence_score: confidenceScore,
          timestamp: new Date().toISOString()
        },
        address_details: detailedAddress,
        joined_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,neighborhood_id'
      });

    if (updateError) {
      console.error('Update error:', updateError);
    }

    // Update user's verification level
    if (confidenceScore > 0.6) {
      await supabase
        .from('users')
        .update({ 
          verification_level: Math.max(2, 0) // Address verified
        })
        .eq('id', user_id);
    }

    verificationResult = {
      verified: confidenceScore > 0.5,
      neighborhood: {
        id: bestMatch.id,
        name: bestMatch.name,
        type: bestMatch.type,
        distance_meters: bestMatch.distance_meters,
        landmarks: bestMatch.landmarks
      },
      address: detailedAddress,
      confidence_score: confidenceScore,
      verification_method
    };
  }

  return new Response(
    JSON.stringify(verificationResult),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

async function reverseGeocode(req: Request, supabase: any) {
  const { latitude, longitude } = await req.json();

  if (!latitude || !longitude) {
    return new Response(
      JSON.stringify({ error: 'latitude and longitude are required' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  const geocodeResult = await performReverseGeocode(latitude, longitude);

  if (!geocodeResult) {
    return new Response(
      JSON.stringify({ error: 'Geocoding failed' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      address: geocodeResult.place_name,
      coordinates: [longitude, latitude],
      components: parseNigerianAddress(geocodeResult),
      raw_data: geocodeResult
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

async function findNearbyNeighborhoods(req: Request, supabase: any) {
  const { latitude, longitude, radius_km = 5, limit = 10 } = await req.json();

  if (!latitude || !longitude) {
    return new Response(
      JSON.stringify({ error: 'latitude and longitude are required' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  const { data: neighborhoods, error } = await supabase.rpc('find_neighborhoods_by_point', {
    lat: latitude,
    lng: longitude
  });

  if (error) {
    console.error('Database error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to find neighborhoods' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  // Filter by radius and add additional data
  const filteredNeighborhoods = neighborhoods
    ?.filter((n: any) => n.distance_meters <= radius_km * 1000)
    ?.slice(0, limit)
    ?.map((n: any) => ({
      ...n,
      distance_km: parseFloat((n.distance_meters / 1000).toFixed(2)),
      can_join: n.distance_meters <= 2000 // Can only join neighborhoods within 2km
    })) || [];

  return new Response(
    JSON.stringify({
      success: true,
      neighborhoods: filteredNeighborhoods,
      total_found: filteredNeighborhoods.length,
      search_radius_km: radius_km,
      search_center: { latitude, longitude }
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

async function getNeighborhoodDetails(req: Request, supabase: any) {
  const url = new URL(req.url);
  const neighborhood_id = url.searchParams.get('id');

  if (!neighborhood_id) {
    return new Response(
      JSON.stringify({ error: 'neighborhood id is required' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  const { data: neighborhood, error } = await supabase
    .from('neighborhoods')
    .select(`
      id,
      name,
      type,
      description,
      state_name,
      lga_name,
      landmarks,
      estate_management,
      is_verified,
      created_at,
      user_count:user_neighborhoods(count),
      recent_posts:posts(count)
    `)
    .eq('id', neighborhood_id)
    .single();

  if (error || !neighborhood) {
    return new Response(
      JSON.stringify({ error: 'Neighborhood not found' }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      neighborhood: {
        ...neighborhood,
        member_count: neighborhood.user_count?.[0]?.count || 0,
        recent_posts_count: neighborhood.recent_posts?.[0]?.count || 0
      }
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

async function validateNigerianAddress(req: Request, supabase: any) {
  const { address, latitude, longitude } = await req.json();

  if (!address && (!latitude || !longitude)) {
    return new Response(
      JSON.stringify({ error: 'Either address or coordinates are required' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  let validationResult = {
    valid: false,
    formatted_address: null,
    components: null,
    confidence: 0,
    suggestions: []
  };

  if (address) {
    // Validate address format and Nigerian context
    const addressComponents = parseNigerianAddressText(address);
    
    validationResult = {
      valid: addressComponents.valid,
      formatted_address: addressComponents.formatted,
      components: addressComponents.components,
      confidence: addressComponents.confidence,
      suggestions: addressComponents.suggestions
    };
  }

  if (latitude && longitude && isWithinNigeriaBounds(latitude, longitude)) {
    const geocodeResult = await performReverseGeocode(latitude, longitude);
    if (geocodeResult) {
      validationResult = {
        valid: true,
        formatted_address: geocodeResult.place_name,
        components: parseNigerianAddress(geocodeResult),
        confidence: 0.9,
        suggestions: []
      };
    }
  }

  return new Response(
    JSON.stringify(validationResult),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

// Helper functions
function isWithinNigeriaBounds(latitude: number, longitude: number): boolean {
  // Nigeria approximate bounds
  return latitude >= 4.0 && latitude <= 14.0 && 
         longitude >= 2.5 && longitude <= 15.0;
}

async function performReverseGeocode(latitude: number, longitude: number): Promise<GeocodeResult | null> {
  try {
    const mapboxToken = Deno.env.get('MAPBOX_ACCESS_TOKEN');
    if (!mapboxToken) {
      console.error('Mapbox token not configured');
      return null;
    }

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}&country=ng&types=address,poi,place&language=en`
    );

    if (!response.ok) {
      console.error('Mapbox geocoding error:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data.features?.[0] || null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

function parseNigerianAddress(geocodeResult: GeocodeResult) {
  const components = {
    street: null,
    area: null,
    lga: null,
    state: null,
    country: null,
    postcode: null
  };

  // Extract components from Mapbox context
  geocodeResult.context?.forEach(item => {
    if (item.id.startsWith('postcode')) {
      components.postcode = item.text;
    } else if (item.id.startsWith('place')) {
      components.lga = item.text;
    } else if (item.id.startsWith('region')) {
      components.state = item.text;
    } else if (item.id.startsWith('country')) {
      components.country = item.text;
    }
  });

  // Extract street and area from place_name
  const parts = geocodeResult.place_name.split(',');
  if (parts.length > 0) components.street = parts[0]?.trim();
  if (parts.length > 1) components.area = parts[1]?.trim();

  return components;
}

function parseNigerianAddressText(address: string) {
  // Simple Nigerian address validation and parsing
  const nigerianStates = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo', 'Jigawa',
    'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger',
    'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe',
    'Zamfara', 'FCT', 'Abuja'
  ];

  const addressLower = address.toLowerCase();
  const hasState = nigerianStates.some(state => 
    addressLower.includes(state.toLowerCase())
  );

  const hasNigeria = addressLower.includes('nigeria');
  const hasCommonTerms = /estate|avenue|street|road|close|way|crescent|drive|lane/.test(addressLower);

  const confidence = (hasState ? 0.4 : 0) + (hasNigeria ? 0.3 : 0) + (hasCommonTerms ? 0.3 : 0);

  return {
    valid: confidence > 0.5,
    formatted: address,
    components: { raw: address },
    confidence,
    suggestions: confidence < 0.5 ? ['Add state name', 'Add "Nigeria"', 'Include street type'] : []
  };
}