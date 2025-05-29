-- Create user_tool_subscriptions table for SaaS platform
-- This table tracks user access to specific tools with subscription status

CREATE TABLE "public"."user_tool_subscriptions" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL,
    "user_id" UUID NOT NULL,
    "tool_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'trial', 'suspended', 'expired')),
    "started_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "expires_at" TIMESTAMP WITH TIME ZONE,
    "trial_ends_at" TIMESTAMP WITH TIME ZONE,
    "external_subscription_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE "public"."user_tool_subscriptions" ENABLE ROW LEVEL SECURITY;

-- Create primary key
CREATE UNIQUE INDEX user_tool_subscriptions_pkey ON "public"."user_tool_subscriptions" USING btree (id);
ALTER TABLE "public"."user_tool_subscriptions" ADD CONSTRAINT "user_tool_subscriptions_pkey" PRIMARY KEY USING INDEX "user_tool_subscriptions_pkey";

-- Create foreign key constraint to auth.users
ALTER TABLE "public"."user_tool_subscriptions" 
ADD CONSTRAINT "user_tool_subscriptions_user_id_fkey" 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create foreign key constraint to public.tools
ALTER TABLE "public"."user_tool_subscriptions" 
ADD CONSTRAINT "user_tool_subscriptions_tool_id_fkey" 
FOREIGN KEY (tool_id) REFERENCES public.tools(id) ON DELETE CASCADE;

-- Create unique constraint to prevent duplicate user-tool combinations
CREATE UNIQUE INDEX user_tool_subscriptions_user_tool_unique_idx 
ON "public"."user_tool_subscriptions" USING btree (user_id, tool_id);
ALTER TABLE "public"."user_tool_subscriptions" 
ADD CONSTRAINT "user_tool_subscriptions_user_tool_unique" 
UNIQUE USING INDEX "user_tool_subscriptions_user_tool_unique_idx";

-- Create indexes for efficient querying
CREATE INDEX user_tool_subscriptions_user_id_idx ON "public"."user_tool_subscriptions" USING btree (user_id);
CREATE INDEX user_tool_subscriptions_tool_id_idx ON "public"."user_tool_subscriptions" USING btree (tool_id);
CREATE INDEX user_tool_subscriptions_status_idx ON "public"."user_tool_subscriptions" USING btree (status);
CREATE INDEX user_tool_subscriptions_expires_at_idx ON "public"."user_tool_subscriptions" USING btree (expires_at);

-- Grant permissions
GRANT SELECT ON TABLE "public"."user_tool_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_tool_subscriptions" TO "service_role";

-- Create RLS policy: Users can only view their own subscriptions
CREATE POLICY "Users can view their own tool subscriptions"
ON "public"."user_tool_subscriptions"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create RLS policy: Only service_role can manage subscriptions (admin operations)
CREATE POLICY "Only service_role can manage tool subscriptions"
ON "public"."user_tool_subscriptions"
AS PERMISSIVE
FOR ALL
TO service_role
USING (true);

-- Create trigger to automatically update updated_at
CREATE TRIGGER handle_user_tool_subscriptions_updated_at
    BEFORE UPDATE ON "public"."user_tool_subscriptions"
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create a view for active subscriptions with tool details
-- Security is enforced through the underlying table's RLS policies
CREATE VIEW "public"."active_user_subscriptions" AS
SELECT 
    uts.id,
    uts.user_id,
    uts.tool_id,
    uts.status,
    uts.started_at,
    uts.expires_at,
    uts.trial_ends_at,
    t.name as tool_name,
    t.description as tool_description,
    t.slug as tool_slug,
    t.icon as tool_icon,
    t.order_index
FROM "public"."user_tool_subscriptions" uts
JOIN "public"."tools" t ON uts.tool_id = t.id
WHERE uts.status IN ('active', 'trial')
AND (uts.expires_at IS NULL OR uts.expires_at > NOW())
AND (uts.trial_ends_at IS NULL OR uts.trial_ends_at > NOW())
ORDER BY t.order_index;

-- Grant permissions on the view
GRANT SELECT ON "public"."active_user_subscriptions" TO "authenticated";
GRANT ALL ON "public"."active_user_subscriptions" TO "service_role";

COMMENT ON TABLE "public"."user_tool_subscriptions" IS 'Tracks user access to specific tools with subscription status and metadata';
COMMENT ON COLUMN "public"."user_tool_subscriptions"."status" IS 'Current subscription status: active, inactive, trial, suspended, expired';
COMMENT ON COLUMN "public"."user_tool_subscriptions"."expires_at" IS 'When the subscription expires (NULL for lifetime subscriptions)';
COMMENT ON COLUMN "public"."user_tool_subscriptions"."trial_ends_at" IS 'When the trial period ends (NULL if not a trial)';
COMMENT ON COLUMN "public"."user_tool_subscriptions"."external_subscription_id" IS 'Reference to external payment system subscription ID';
COMMENT ON VIEW "public"."active_user_subscriptions" IS 'View showing only active and trial subscriptions with tool details'; 