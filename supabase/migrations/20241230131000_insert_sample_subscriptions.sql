-- Insert sample user subscription for testing
-- This gives the test user access to the Invoice Reconciler tool

-- Note: This assumes the test user with email 'ariel.r08@gmail.com' exists
-- If this user doesn't exist, this insertion will be skipped

DO $$
DECLARE
    test_user_id UUID;
    tool_id UUID;
BEGIN
    -- Get the test user ID
    SELECT id INTO test_user_id 
    FROM auth.users 
    WHERE email = 'ariel.r08@gmail.com' 
    LIMIT 1;
    
    -- Get the Invoice Reconciler tool ID
    SELECT id INTO tool_id 
    FROM public.tools 
    WHERE slug = 'invoice-reconciler' 
    LIMIT 1;
    
    -- Only insert if both user and tool exist
    IF test_user_id IS NOT NULL AND tool_id IS NOT NULL THEN
        -- Insert subscription if it doesn't already exist
        INSERT INTO public.user_tool_subscriptions (
            user_id, 
            tool_id, 
            status, 
            started_at,
            trial_ends_at,
            created_at,
            updated_at
        )
        SELECT 
            test_user_id,
            tool_id,
            'active',
            NOW(),
            NULL, -- No trial end date for active subscription
            NOW(),
            NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM public.user_tool_subscriptions 
            WHERE user_id = test_user_id AND tool_id = tool_id
        );
        
        RAISE NOTICE 'Sample subscription created for user % and tool %', test_user_id, tool_id;
    ELSE
        RAISE NOTICE 'Test user or tool not found. User ID: %, Tool ID: %', test_user_id, tool_id;
    END IF;
END $$; 