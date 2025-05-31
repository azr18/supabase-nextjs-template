-- Insert additional sample tools for comprehensive ToolCard testing
-- This demonstrates the grid layout with multiple tools and different subscription states

INSERT INTO "public"."tools" (name, description, slug, status, icon, order_index)
VALUES 
    (
        'Lead Generator',
        'AI-powered lead generation tool that automatically discovers, researches, and scores potential customers based on your ideal client profile.',
        'lead-generator',
        'active',
        '🎯',
        2
    ),
    (
        'Document Processor',
        'Intelligent document processing system that extracts, categorizes, and analyzes business documents using advanced OCR and AI.',
        'document-processor',
        'active',
        '📄',
        3
    ),
    (
        'Sales Optimizer',
        'Advanced sales analytics and optimization platform that provides insights, forecasting, and personalized recommendations.',
        'sales-optimizer',
        'coming_soon',
        '📈',
        4
    ),
    (
        'Email Automation',
        'Sophisticated email marketing automation with AI-powered personalization, scheduling, and performance analytics.',
        'email-automation',
        'active',
        '✉️',
        5
    ),
    (
        'Financial Analyzer',
        'Comprehensive financial analysis tool that provides cash flow forecasting, expense optimization, and profitability insights.',
        'financial-analyzer',
        'maintenance',
        '💰',
        6
    )
ON CONFLICT (slug) DO NOTHING;

-- Add sample subscriptions for the test user with different statuses
DO $$
DECLARE
    test_user_id UUID;
    lead_gen_tool_id UUID;
    doc_proc_tool_id UUID;
    email_auto_tool_id UUID;
BEGIN
    -- Get the test user ID
    SELECT id INTO test_user_id 
    FROM auth.users 
    WHERE email = 'ariel.r08@gmail.com' 
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Get tool IDs
        SELECT id INTO lead_gen_tool_id FROM public.tools WHERE slug = 'lead-generator' LIMIT 1;
        SELECT id INTO doc_proc_tool_id FROM public.tools WHERE slug = 'document-processor' LIMIT 1;
        SELECT id INTO email_auto_tool_id FROM public.tools WHERE slug = 'email-automation' LIMIT 1;
        
        -- Lead Generator - Active subscription
        IF lead_gen_tool_id IS NOT NULL THEN
            INSERT INTO public.user_tool_subscriptions (
                user_id, tool_id, status, started_at, created_at, updated_at
            )
            SELECT test_user_id, lead_gen_tool_id, 'active', NOW(), NOW(), NOW()
            WHERE NOT EXISTS (
                SELECT 1 FROM public.user_tool_subscriptions 
                WHERE user_id = test_user_id AND tool_id = lead_gen_tool_id
            );
        END IF;
        
        -- Document Processor - Trial subscription (7 days left)
        IF doc_proc_tool_id IS NOT NULL THEN
            INSERT INTO public.user_tool_subscriptions (
                user_id, tool_id, status, started_at, trial_ends_at, created_at, updated_at
            )
            SELECT test_user_id, doc_proc_tool_id, 'trial', NOW() - INTERVAL '7 days', NOW() + INTERVAL '7 days', NOW(), NOW()
            WHERE NOT EXISTS (
                SELECT 1 FROM public.user_tool_subscriptions 
                WHERE user_id = test_user_id AND tool_id = doc_proc_tool_id
            );
        END IF;
        
        -- Email Automation - Expired subscription
        IF email_auto_tool_id IS NOT NULL THEN
            INSERT INTO public.user_tool_subscriptions (
                user_id, tool_id, status, started_at, expires_at, created_at, updated_at
            )
            SELECT test_user_id, email_auto_tool_id, 'expired', NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 day', NOW(), NOW()
            WHERE NOT EXISTS (
                SELECT 1 FROM public.user_tool_subscriptions 
                WHERE user_id = test_user_id AND tool_id = email_auto_tool_id
            );
        END IF;
        
        RAISE NOTICE 'Additional sample subscriptions created for user %', test_user_id;
    ELSE
        RAISE NOTICE 'Test user not found for additional subscriptions';
    END IF;
END $$; 