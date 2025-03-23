--[[
    Discord Webhook for Roblox
    Allows sending messages from Roblox to Discord via webhooks
]]

local HttpService = game:GetService("HttpService")
local config = require(script.Parent.Config)

local DiscordWebhook = {}

-- Send a message to Discord
function DiscordWebhook:SendMessage(message, options)
    options = options or {}
    
    local data = {
        content = message,
        username = options.username or config.DefaultUsername,
        avatar_url = options.avatarUrl or config.DefaultAvatarUrl,
        tts = options.tts or false,
    }
    
    -- Add embeds if provided
    if options.embeds then
        data.embeds = options.embeds
    end
    
    local success, response = pcall(function()
        return HttpService:PostAsync(
            config.WebhookUrl,
            HttpService:JSONEncode(data),
            Enum.HttpContentType.ApplicationJson
        )
    end)
    
    return success, response
end

-- Send an embed to Discord
function DiscordWebhook:SendEmbed(embedData, options)
    options = options or {}
    options.embeds = {embedData}
    
    return self:SendMessage("", options)
end

return DiscordWebhook