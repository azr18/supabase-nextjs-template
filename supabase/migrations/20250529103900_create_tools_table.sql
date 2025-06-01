-- Create tools table for SaaS platform
-- This table stores information about available tools in the platform

CREATE TABLE "public"."tools" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL UNIQUE,
    "status" TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'coming_soon')),
    "icon" TEXT,
    "order_index" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE "public"."tools" ENABLE ROW LEVEL SECURITY;

-- Create primary key
CREATE UNIQUE INDEX tools_pkey ON "public"."tools" USING btree (id);
ALTER TABLE "public"."tools" ADD CONSTRAINT "tools_pkey" PRIMARY KEY USING INDEX "tools_pkey";

-- Create unique index for slug
CREATE UNIQUE INDEX tools_slug_idx ON "public"."tools" USING btree (slug);

-- Create index for order_index for efficient ordering
CREATE INDEX tools_order_index_idx ON "public"."tools" USING btree (order_index);

-- Grant permissions to authenticated users (read-only for most users)
GRANT SELECT ON TABLE "public"."tools" TO "authenticated";
GRANT SELECT ON TABLE "public"."tools" TO "anon";

-- Grant full permissions to service_role for admin operations
GRANT ALL ON TABLE "public"."tools" TO "service_role";

-- Create RLS policy: All authenticated users can view active tools
CREATE POLICY "Anyone can view active tools"
ON "public"."tools"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (status = 'active' OR auth.role() = 'service_role');

-- Create RLS policy: Only service_role can manage tools
CREATE POLICY "Only service_role can manage tools"
ON "public"."tools"
AS PERMISSIVE
FOR ALL
TO service_role
USING (true);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER handle_tools_updated_at
    BEFORE UPDATE ON "public"."tools"
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Insert the Invoice Reconciler tool as the first tool
INSERT INTO "public"."tools" (name, description, slug, status, icon, order_index)
VALUES (
    'Invoice Reconciler',
    'Multi-airline invoice reconciliation tool supporting Fly Dubai, TAP, Philippines Airlines, Air India, and El Al. Automates the comparison between invoices and reports.',
    'invoice-reconciler',
    'active',
    'calculator',
    1
); 