--[[
    Configuration for Discord Webhook
    Update these values with your own Discord webhook URL and preferences
]]

return {
    -- Your Discord webhook URL (replace with your actual webhook URL)
    WebhookUrl = "https://discord.com/api/webhooks/your-webhook-id/your-webhook-token",
    
    -- Default username shown in Discord when sending messages
    DefaultUsername = "Roblox Bot",
    
    -- Default avatar URL for the webhook messages
    DefaultAvatarUrl = "",
    
    -- Color for embeds (decimal color code)
    DefaultColor = 5814783, -- Light blue
    
    -- Rate limiting (to avoid Discord's rate limits)
    MinTimeBetweenMessages = 1, -- seconds
}