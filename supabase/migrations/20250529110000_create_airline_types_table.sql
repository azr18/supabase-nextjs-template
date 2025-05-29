-- Create airline_types table for SaaS platform
-- This table stores configuration and metadata for each supported airline

CREATE TABLE "public"."airline_types" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL,
    "code" TEXT NOT NULL UNIQUE CHECK (code IN ('fly_dubai', 'tap', 'philippines_airlines', 'air_india', 'el_al')),
    "display_name" TEXT NOT NULL,
    "short_name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "logo_url" TEXT,
    "website_url" TEXT,
    "support_email" TEXT,
    "processing_config" JSONB DEFAULT '{}',
    "file_format_config" JSONB DEFAULT '{}',
    "validation_rules" JSONB DEFAULT '{}',
    "ui_config" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE "public"."airline_types" ENABLE ROW LEVEL SECURITY;

-- Create primary key
CREATE UNIQUE INDEX airline_types_pkey ON "public"."airline_types" USING btree (id);
ALTER TABLE "public"."airline_types" ADD CONSTRAINT "airline_types_pkey" PRIMARY KEY USING INDEX "airline_types_pkey";

-- Create unique constraint on code
CREATE UNIQUE INDEX airline_types_code_unique_idx ON "public"."airline_types" USING btree (code);
ALTER TABLE "public"."airline_types" ADD CONSTRAINT "airline_types_code_unique" UNIQUE USING INDEX "airline_types_code_unique_idx";

-- Create indexes for efficient querying
CREATE INDEX airline_types_is_active_idx ON "public"."airline_types" USING btree (is_active);
CREATE INDEX airline_types_order_index_idx ON "public"."airline_types" USING btree (order_index);
CREATE INDEX airline_types_country_idx ON "public"."airline_types" USING btree (country);

-- Grant permissions
GRANT SELECT ON TABLE "public"."airline_types" TO "authenticated";
GRANT ALL ON TABLE "public"."airline_types" TO "service_role";

-- Create RLS policy: All authenticated users can read airline types (public configuration data)
CREATE POLICY "Authenticated users can view airline types"
ON "public"."airline_types"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

-- Create RLS policy: Only service_role can manage airline types (admin operations)
CREATE POLICY "Only service_role can manage airline types"
ON "public"."airline_types"
AS PERMISSIVE
FOR ALL
TO service_role
USING (true);

-- Create trigger to automatically update updated_at
CREATE TRIGGER handle_airline_types_updated_at
    BEFORE UPDATE ON "public"."airline_types"
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Insert initial airline configuration data
INSERT INTO "public"."airline_types" (
    code, 
    display_name, 
    short_name, 
    country, 
    currency, 
    order_index,
    processing_config,
    file_format_config,
    validation_rules,
    ui_config
) VALUES 
(
    'fly_dubai',
    'FlyDubai',
    'FZ',
    'United Arab Emirates',
    'AED',
    1,
    '{
        "pdf_extraction": {
            "table_detection_method": "lattice",
            "text_extraction_method": "stream",
            "currency_symbol": "AED",
            "date_format": "dd/MM/yyyy"
        },
        "reconciliation": {
            "tolerance_amount": 0.01,
            "tolerance_percentage": 0.1,
            "required_fields": ["invoice_number", "flight_number", "departure_date", "amount"]
        }
    }',
    '{
        "supported_formats": ["pdf"],
        "max_file_size_mb": 25,
        "required_pages": 1,
        "expected_structure": {
            "invoice_header": "required",
            "flight_details": "required",
            "amount_breakdown": "required"
        }
    }',
    '{
        "invoice_number": {
            "required": true,
            "pattern": "^FZ[0-9]+$",
            "description": "Must start with FZ followed by numbers"
        },
        "amount": {
            "required": true,
            "min_value": 0,
            "currency": "AED"
        }
    }',
    '{
        "color_scheme": "#E31E24",
        "icon": "plane-departure",
        "instructions": "Upload FlyDubai PDF invoices. Ensure all flight details and amounts are clearly visible."
    }'
),
(
    'tap',
    'TAP Air Portugal',
    'TP',
    'Portugal',
    'EUR',
    2,
    '{
        "pdf_extraction": {
            "table_detection_method": "stream",
            "text_extraction_method": "lattice",
            "currency_symbol": "€",
            "date_format": "dd-MM-yyyy"
        },
        "reconciliation": {
            "tolerance_amount": 0.01,
            "tolerance_percentage": 0.1,
            "required_fields": ["invoice_number", "flight_number", "departure_date", "total_amount"]
        }
    }',
    '{
        "supported_formats": ["pdf"],
        "max_file_size_mb": 25,
        "required_pages": 1,
        "expected_structure": {
            "invoice_header": "required",
            "passenger_details": "required",
            "flight_details": "required",
            "fare_breakdown": "required"
        }
    }',
    '{
        "invoice_number": {
            "required": true,
            "pattern": "^TP[0-9A-Z]+$",
            "description": "Must start with TP followed by alphanumeric characters"
        },
        "amount": {
            "required": true,
            "min_value": 0,
            "currency": "EUR"
        }
    }',
    '{
        "color_scheme": "#C41E3A",
        "icon": "plane",
        "instructions": "Upload TAP Air Portugal PDF invoices. Verify passenger and flight information is complete."
    }'
),
(
    'philippines_airlines',
    'Philippines Airlines',
    'PR',
    'Philippines',
    'PHP',
    3,
    '{
        "pdf_extraction": {
            "table_detection_method": "lattice",
            "text_extraction_method": "stream",
            "currency_symbol": "₱",
            "date_format": "MM/dd/yyyy"
        },
        "reconciliation": {
            "tolerance_amount": 0.50,
            "tolerance_percentage": 0.1,
            "required_fields": ["invoice_number", "flight_number", "departure_date", "base_fare", "taxes"]
        }
    }',
    '{
        "supported_formats": ["pdf"],
        "max_file_size_mb": 25,
        "required_pages": 1,
        "expected_structure": {
            "invoice_header": "required",
            "flight_details": "required",
            "pricing_details": "required"
        }
    }',
    '{
        "invoice_number": {
            "required": true,
            "pattern": "^PR[0-9]+$",
            "description": "Must start with PR followed by numbers"
        },
        "amount": {
            "required": true,
            "min_value": 0,
            "currency": "PHP"
        }
    }',
    '{
        "color_scheme": "#003087",
        "icon": "plane-arrival",
        "instructions": "Upload Philippines Airlines PDF invoices. Check that base fare and tax amounts are clearly shown."
    }'
),
(
    'air_india',
    'Air India',
    'AI',
    'India',
    'INR',
    4,
    '{
        "pdf_extraction": {
            "table_detection_method": "stream",
            "text_extraction_method": "lattice",
            "currency_symbol": "₹",
            "date_format": "dd-MM-yyyy"
        },
        "reconciliation": {
            "tolerance_amount": 1.00,
            "tolerance_percentage": 0.1,
            "required_fields": ["pnr", "flight_number", "travel_date", "total_fare"]
        }
    }',
    '{
        "supported_formats": ["pdf"],
        "max_file_size_mb": 25,
        "required_pages": 1,
        "expected_structure": {
            "booking_reference": "required",
            "flight_itinerary": "required",
            "fare_summary": "required"
        }
    }',
    '{
        "pnr": {
            "required": true,
            "pattern": "^[A-Z0-9]{6}$",
            "description": "6-character alphanumeric PNR code"
        },
        "amount": {
            "required": true,
            "min_value": 0,
            "currency": "INR"
        }
    }',
    '{
        "color_scheme": "#FF6600",
        "icon": "plane-tilt",
        "instructions": "Upload Air India PDF invoices. Ensure PNR and flight details are legible."
    }'
),
(
    'el_al',
    'El Al Israel Airlines',
    'LY',
    'Israel',
    'ILS',
    5,
    '{
        "pdf_extraction": {
            "table_detection_method": "lattice",
            "text_extraction_method": "stream",
            "currency_symbol": "₪",
            "date_format": "dd/MM/yyyy"
        },
        "reconciliation": {
            "tolerance_amount": 0.10,
            "tolerance_percentage": 0.1,
            "required_fields": ["confirmation_number", "flight_number", "departure_date", "total_price"]
        }
    }',
    '{
        "supported_formats": ["pdf"],
        "max_file_size_mb": 25,
        "required_pages": 1,
        "expected_structure": {
            "booking_confirmation": "required",
            "flight_schedule": "required",
            "payment_details": "required"
        }
    }',
    '{
        "confirmation_number": {
            "required": true,
            "pattern": "^[A-Z]{2}[0-9]{4,6}$",
            "description": "2 letters followed by 4-6 digits"
        },
        "amount": {
            "required": true,
            "min_value": 0,
            "currency": "ILS"
        }
    }',
    '{
        "color_scheme": "#0038A8",
        "icon": "plane-landing",
        "instructions": "Upload El Al PDF invoices. Confirm booking reference and payment information are visible."
    }'
);

-- Create view for active airline types with UI-friendly data
CREATE VIEW "public"."active_airline_types" AS
SELECT 
    at.id,
    at.code,
    at.display_name,
    at.short_name,
    at.country,
    at.currency,
    at.order_index,
    at.logo_url,
    at.processing_config,
    at.file_format_config,
    at.validation_rules,
    at.ui_config,
    at.created_at,
    at.updated_at
FROM "public"."airline_types" at
WHERE at.is_active = true
ORDER BY at.order_index, at.display_name;

-- Grant permissions on the view
GRANT SELECT ON "public"."active_airline_types" TO "authenticated";
GRANT ALL ON "public"."active_airline_types" TO "service_role";

-- Create function to get airline configuration by code
CREATE OR REPLACE FUNCTION public.get_airline_config(airline_code TEXT)
RETURNS TABLE(
    id UUID,
    code TEXT,
    display_name TEXT,
    short_name TEXT,
    country TEXT,
    currency TEXT,
    processing_config JSONB,
    file_format_config JSONB,
    validation_rules JSONB,
    ui_config JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        at.id,
        at.code,
        at.display_name,
        at.short_name,
        at.country,
        at.currency,
        at.processing_config,
        at.file_format_config,
        at.validation_rules,
        at.ui_config
    FROM "public"."airline_types" at
    WHERE at.code = airline_code AND at.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_airline_config(TEXT) TO "authenticated";

-- Create function to validate airline invoice data
CREATE OR REPLACE FUNCTION public.validate_airline_invoice(
    airline_code TEXT,
    invoice_data JSONB
)
RETURNS TABLE(
    is_valid BOOLEAN,
    validation_errors TEXT[],
    missing_fields TEXT[]
) AS $$
DECLARE
    validation_rules JSONB;
    required_fields TEXT[];
    field_name TEXT;
    field_value TEXT;
    field_rules JSONB;
    errors TEXT[] := '{}';
    missing TEXT[] := '{}';
BEGIN
    -- Get validation rules for the airline
    SELECT at.validation_rules INTO validation_rules
    FROM "public"."airline_types" at
    WHERE at.code = airline_code AND at.is_active = true;
    
    IF validation_rules IS NULL THEN
        RETURN QUERY SELECT false, ARRAY['Airline not found or inactive'], ARRAY[]::TEXT[];
        RETURN;
    END IF;
    
    -- Get processing config to check required fields
    SELECT 
        ARRAY(SELECT jsonb_array_elements_text(pc->'reconciliation'->'required_fields'))
    INTO required_fields
    FROM "public"."airline_types" at
    WHERE at.code = airline_code AND at.is_active = true;
    
    -- Check required fields
    FOREACH field_name IN ARRAY required_fields
    LOOP
        IF NOT (invoice_data ? field_name) OR (invoice_data->field_name IS NULL) THEN
            missing := array_append(missing, field_name);
        END IF;
    END LOOP;
    
    -- Validate fields against rules
    FOR field_name IN SELECT jsonb_object_keys(validation_rules)
    LOOP
        field_rules := validation_rules->field_name;
        field_value := invoice_data->>field_name;
        
        -- Check pattern validation
        IF field_rules ? 'pattern' AND field_value IS NOT NULL THEN
            IF NOT (field_value ~ (field_rules->>'pattern')) THEN
                errors := array_append(errors, 
                    format('%s does not match required pattern: %s', 
                           field_name, field_rules->>'description'));
            END IF;
        END IF;
        
        -- Check minimum value for numeric fields
        IF field_rules ? 'min_value' AND field_value IS NOT NULL THEN
            BEGIN
                IF (field_value::numeric) < (field_rules->>'min_value')::numeric THEN
                    errors := array_append(errors, 
                        format('%s must be at least %s', 
                               field_name, field_rules->>'min_value'));
                END IF;
            EXCEPTION WHEN OTHERS THEN
                errors := array_append(errors, 
                    format('%s must be a valid number', field_name));
            END;
        END IF;
    END LOOP;
    
    -- Return validation results
    RETURN QUERY SELECT 
        (array_length(errors, 1) IS NULL OR array_length(errors, 1) = 0) AND 
        (array_length(missing, 1) IS NULL OR array_length(missing, 1) = 0),
        errors,
        missing;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.validate_airline_invoice(TEXT, JSONB) TO "authenticated";

COMMENT ON TABLE "public"."airline_types" IS 'Configuration and metadata for each supported airline in the reconciliation system';
COMMENT ON COLUMN "public"."airline_types"."code" IS 'Unique airline code used throughout the system: fly_dubai, tap, philippines_airlines, air_india, el_al';
COMMENT ON COLUMN "public"."airline_types"."display_name" IS 'Human-readable airline name for UI display';
COMMENT ON COLUMN "public"."airline_types"."short_name" IS 'Airline IATA code or short abbreviation';
COMMENT ON COLUMN "public"."airline_types"."processing_config" IS 'JSON configuration for PDF extraction and reconciliation processing';
COMMENT ON COLUMN "public"."airline_types"."file_format_config" IS 'JSON configuration for expected file formats and structure';
COMMENT ON COLUMN "public"."airline_types"."validation_rules" IS 'JSON rules for validating invoice data specific to each airline';
COMMENT ON COLUMN "public"."airline_types"."ui_config" IS 'JSON configuration for UI display (colors, icons, instructions)';
COMMENT ON VIEW "public"."active_airline_types" IS 'View showing only active airline types ordered by display preference';
COMMENT ON FUNCTION public.get_airline_config(TEXT) IS 'Returns complete configuration for a specific airline by code';
COMMENT ON FUNCTION public.validate_airline_invoice(TEXT, JSONB) IS 'Validates invoice data against airline-specific rules and returns validation results'; 